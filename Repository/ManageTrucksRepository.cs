using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using System.Net.Http;
using System.Text.Json;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using System.Collections;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ManageTrucksRepository : IManageTrucksRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly IConfiguration _configuration;
        public ManageTrucksRepository(ISqlDataAccess dataAccess, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _configuration = configuration;
        }

        public async Task<TruckListResponse> GetTruckList(GridRequest request)
        {
            var filterSql = new StringBuilder();
            var parameters = new DynamicParameters();

            //  Whitelisted columns
            var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "trk_ID", "t.trk_ID" },
                { "trk_Code", "t.trk_Code" },
                { "trk_Plate", "t.trk_Plate" },
                { "TruckStatus", "TruckStatus" }
            };

            // Build Filters
            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    var key = filter.Key;
                    var value = filter.Value?.value?.ToString();
                    if (string.IsNullOrWhiteSpace(value)) continue;
                    if (!allowedColumns.TryGetValue(key, out var column)) continue;
                    var paramName = $"filter_{key}";
                    var paramSql = "@" + paramName;

                    //  Handle TruckStatus numeric → string mapping
                    if (key.Equals("TruckStatus", StringComparison.OrdinalIgnoreCase))
                    {
                        string mappedValue = value;
                        if (value == "1") mappedValue = "New";
                        else if (value == "2") mappedValue = "Check-In";
                        else if (value == "3") mappedValue = "Check-Out";
                        filterSql.Append($@"
                            AND (
                                CASE 
                                    WHEN CheckIn.checkin > 1 THEN 'Check-In'
                                    WHEN CheckOut.checkout > 1 THEN 'Check-Out'
                                    ELSE 'New'
                                END LIKE {paramSql}
                            )"
                        );
                        parameters.Add(paramName, $"%{mappedValue}%");
                    }
                    else
                    {
                        filterSql.Append($" AND {column} LIKE {paramSql}");
                        parameters.Add(paramName, $"%{value}%");
                    }
                }
            }

            //  Sorting Safe

            var sortMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "trk_ID", "t.trk_ID" },
                { "trk_Code", "t.trk_Code" },
                { "trk_Plate", "t.trk_Plate" },
                { "TruckStatus", @"
                    CASE 
                        WHEN CheckIn.checkin > 1 THEN 'Check-In'
                        WHEN CheckOut.checkout > 1 THEN 'Check-Out'
                        ELSE 'New'
                    END" 
                }
            };

            string sortField = "t.trk_ID";
            if (!string.IsNullOrWhiteSpace(request.sortField) && sortMap.TryGetValue(request.sortField, out var mappedSort))
            {
                sortField = mappedSort;
            }

            string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
            // Count Query

            string countSql = $@"
                SELECT COUNT(t.trk_ID)
                FROM V_Truck t
                LEFT JOIN (
                    SELECT COUNT(*) AS checkin, shp_TruckID
                    FROM LV_Shipment
                    WHERE shp_StatusID BETWEEN 2 AND 3
                    GROUP BY shp_TruckID
                ) CheckIn ON CheckIn.shp_TruckID = t.trk_ID
                LEFT JOIN (
                    SELECT COUNT(*) AS checkout, shp_TruckID
                    FROM LV_Shipment
                    WHERE shp_StatusID = 4
                    GROUP BY shp_TruckID
                ) CheckOut ON CheckOut.shp_TruckID = t.trk_ID
                WHERE t.trk_TransportMeanTypeID = 1
                  AND (t.LanguageID = 1 OR t.LanguageID IS NULL)
                  AND (t.LanguageID1 = 1 OR t.LanguageID1 IS NULL)
                  AND (t.LanguageID2 = 1 OR t.LanguageID2 IS NULL)
                  {filterSql};
            ";

            int total = await _dataAccess.GetDataReturnInline<int>(countSql, parameters);

            // Data Query
            string dataSql = $@"
                SELECT 
                    t.trk_ID,
                    t.trk_Code,
                    t.trk_Plate,
                    CASE 
                        WHEN CheckIn.checkin > 1 THEN 'Check-In'
                        WHEN CheckOut.checkout > 1 THEN 'Check-Out'
                        ELSE 'New'
                    END AS TruckStatus
                FROM V_Truck t
                LEFT JOIN (
                    SELECT COUNT(*) AS checkin, shp_TruckID
                    FROM LV_Shipment
                    WHERE shp_StatusID BETWEEN 2 AND 3
                    GROUP BY shp_TruckID
                ) CheckIn ON CheckIn.shp_TruckID = t.trk_ID
                LEFT JOIN (
                    SELECT COUNT(*) AS checkout, shp_TruckID
                    FROM LV_Shipment
                    WHERE shp_StatusID = 4
                    GROUP BY shp_TruckID
                ) CheckOut ON CheckOut.shp_TruckID = t.trk_ID
                WHERE t.trk_TransportMeanTypeID = 1
                  AND (t.LanguageID = 1 OR t.LanguageID IS NULL)
                  AND (t.LanguageID1 = 1 OR t.LanguageID1 IS NULL)
                  AND (t.LanguageID2 = 1 OR t.LanguageID2 IS NULL)
                  {filterSql}
                ORDER BY {sortField} {sortOrder}
                OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;
            ";

            // Paging
            parameters.Add("Skip", request.first);
            parameters.Add("Take", request.rows);

            var trucks = (await _dataAccess.GetDataInline<TruckList, dynamic>(dataSql, parameters)).ToList();

            return new TruckListResponse
            {
                Data = trucks,
                TotalCount = total,
            };
        }

        public async Task<AddTruckResponse> AddTruck(AddTruckRequest request)
        {
            try
            {
                var query = @"SELECT COUNT(1) FROM V_Truck WHERE trk_Plate = @Plate";
                var exists = (await _dataAccess.GetDataInline<int, dynamic>(query,new { Plate = request.plate_number })).FirstOrDefault();
                if (exists > 0)
                {
                    return new AddTruckResponse
                    {
                        IsSuccess = false,
                        Message = "Plate number already exists."
                    };
                }

                // Call for External Mantis API
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                // Add the API key to the request headers
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                // POST request URL with query parameters
                string requestUrl = $"api/Resources/AddTruck?TruckCode={request.code}&TruckPlate={request.plate_number}";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                // Sending POST request (empty body as per original logic)
                var response = await client.PostAsync(fullUrl, new StringContent(""));

                if (!response.IsSuccessStatusCode)
                {
                    return new AddTruckResponse
                    {
                        IsSuccess = false,
                        Message = "An error occurred while adding the record."
                    };
                }

                var responseBody = await response.Content.ReadAsStringAsync();

                var result = JsonConvert.DeserializeObject<AddTruckResponse>(responseBody);

                return result ?? new AddTruckResponse
                {
                    IsSuccess = false,
                    Message = "Invalid response received."
                };
            }
            catch (Exception ex)
            {
                return new AddTruckResponse
                {
                    IsSuccess = false,
                    Message = $"Exception: {ex.Message}"
                };
            }
        }

        public async Task<TruckShipmentResponse> GetTruckShipments(GridRequest request)
        {
            var filters = request.filters;
            var skip = request.first;
            var rows = request.rows;
            var sortField = string.IsNullOrEmpty(request.sortField) ? "shp_TruckID" : request.sortField;
            var sortType = request.sortOrder == "1" ? "ASC" : request.sortOrder == "-1" ? "DESC" : "DESC";

            // Base data query
            var sql = new StringBuilder(@"
                SELECT 
                    shp_TruckID,
                    trk_Code,
                    COUNT(shp_ID) AS ShipmentCount,
                    status
                FROM V_shipment WITH (NOLOCK)
                WHERE shp_TruckID IS NOT NULL
                  AND shp_LogisticSiteID = 5
                  AND (LanguageID = 1 OR LanguageID IS NULL)
            ");

            // Apply filters dynamically
            foreach (var f in filters)
            {
                if (!string.IsNullOrEmpty(f.Value?.value))
                {
                    sql.Append($" AND {f.Key} LIKE @Filter_{f.Key} ");
                }
            }

            sql.Append(" GROUP BY shp_TruckID, trk_Code, status ");
            sql.Append($" ORDER BY {sortField} {sortType} ");
            sql.Append(" OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY; ");

            // Fixed Count Query (must match GROUP BY logic)
            var countSql = new StringBuilder(@"
                SELECT COUNT(*) 
                FROM (
                    SELECT shp_TruckID
                    FROM V_shipment WITH (NOLOCK)
                    WHERE shp_TruckID IS NOT NULL
                      AND shp_LogisticSiteID = 5
                      AND (LanguageID = 1 OR LanguageID IS NULL)
            ");

            foreach (var f in filters)
            {
                if (!string.IsNullOrEmpty(f.Value?.value))
                {
                    countSql.Append($" AND {f.Key} LIKE @Filter_{f.Key} ");
                }
            }

            countSql.Append(" GROUP BY shp_TruckID, trk_Code, status ) AS CountData;");

            // Parameters
            var parameters = new DynamicParameters();
            parameters.Add("@Skip", skip);
            parameters.Add("@Rows", rows);

            foreach (var f in filters)
            {
                if (!string.IsNullOrEmpty(f.Value?.value))
                {
                    parameters.Add($"@Filter_{f.Key}", $"%{f.Value.value}%");
                }
            }

            var data = await _dataAccess.GetDataInline<TruckShipment, dynamic>(sql.ToString(), parameters);
            var total = await _dataAccess.SaveDataReturnInline<int>(countSql.ToString(), parameters);

            return new TruckShipmentResponse
            {
                Data = data,
                TotalCount = total
            };
        }

        public async Task<ShipmentDetailsResponse> GetShipments(ShipmentGridRequest? request)
        {
            // ───── 1.  Paging / sorting ─────────────────────────────────────
            var skip = request?.lazyState1?.first ;
            var rows = request?.lazyState1?.rows;
            var sortField = string.IsNullOrEmpty(request?.lazyState1?.sortField)
                             ? "shp_TruckID"
                             : request.lazyState1!.sortField;
            var sortOrder = request?.lazyState1?.sortOrder == "1" ? "ASC"
                           : request?.lazyState1?.sortOrder == "-1" ? "DESC"
                           : "DESC";

            // ───── 2.  WHERE clause & parameters ────────────────────────────
            var parameters = new DynamicParameters();
            var where = new StringBuilder(
                " WHERE shp_TruckID = @trk_Code" +
                " AND  status      = @status" +
                " AND  shp_LogisticSiteID = 5" +
                " AND (LanguageID = 1 OR LanguageID IS NULL) ");

            parameters.Add("@trk_Code", request?.trk_Code);
            parameters.Add("@status", request?.status);

            if (request?.lazyState1?.filters != null && request.lazyState1.filters.Count > 0)
            {
                foreach (var filter in request.lazyState1.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) &&
                        !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        string paramKey = $"@{filter.Key}";
                        where.Append($" AND {filter.Key} LIKE {paramKey}");
                        parameters.Add(paramKey, $"%{filter.Value!.value}%");
                    }
                }
            }

            // ───── 3.  Build TWO queries ────────────────────────────────────
            string dataSql = $@"
                SELECT  shp_Code,
                        shp_ID,
                        status,
                        shp_TruckID
                FROM    V_shipment
                {where}
                ORDER BY {sortField} {sortOrder}
                OFFSET  @Skip ROWS FETCH NEXT @Take ROWS ONLY;
            ";

            string countSql = $@"
                SELECT COUNT(shp_ID)
                FROM   V_shipment
                {where};
            ";

            parameters.Add("@Skip", skip);
            parameters.Add("@Take", rows);

            var data = await _dataAccess.GetDataInline<ShipmentDetails, dynamic>(dataSql, parameters);
            var totalCount = (await _dataAccess.GetDataInline<int, dynamic>(countSql, parameters)).FirstOrDefault();

            return new ShipmentDetailsResponse
            {
                Data = data,
                TotalCount = totalCount,
                Message = "Successful"
            };
        }

    }
}
