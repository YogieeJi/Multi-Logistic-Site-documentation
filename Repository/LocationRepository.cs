using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Data.Repository
{
    public class LocationRepository : ILocationRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        public LocationRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }
        public async Task<OrderShipmentLocationResponse> getshipmentLocations(GridRequestLocaation request)
        {
            try
            {
                var query = "SELECT CAST(LEFT(csl.code, PATINDEX('%[^0-9]%', csl.code + 'X') - 1) AS INT) AS code, csl.Storage_system,csl.Sector,csl.Column_code,csl.Size,csl.shipment_type,csl.customer_code,csl.limited_capacity,csl.code AS loc_code,cot.order_type,csl.is_consolidated FROM Cus_T_ship_loc_info AS csl LEFT JOIN Cus_OrderType AS cot ON cot.code = csl.shipment_type WHERE 1 = 1";
                var count = "SELECT COUNT(csl.code) AS TotalCount FROM Cus_T_ship_loc_info AS csl LEFT JOIN Cus_OrderType AS cot ON cot.code = csl.shipment_type WHERE 1 = 1";

                var parameters = new DynamicParameters();

                // ✅ Column whitelist to prevent ambiguity
                var columnMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "code", "csl.code" },
                    { "Storage_system", "csl.Storage_system" },
                    { "Sector", "csl.Sector" },
                    { "Column_code", "csl.Column_code" },
                    { "Size", "csl.Size" },
                    { "shipment_type", "csl.shipment_type" },
                    { "customer_code", "csl.customer_code" },
                    { "limited_capacity", "csl.limited_capacity" },
                    { "loc_code", "csl.code" },
                    { "order_type", "cot.order_type" },
                    {"is_consolidated","csl.is_consolidated" }
                };

                // Filters
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            if (columnMap.ContainsKey(filter.Key))
                            {
                                string column = columnMap[filter.Key];
                                string filterValue = $"%{filter.Value.value}%";
                                string condition = $" AND {column} LIKE @{filter.Key}";

                                query += condition;
                                count += condition;

                                parameters.Add(filter.Key, filterValue);
                            }
                        }
                    }
                }

                // Sorting based on sortOrder and sortField
                if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    query += $" ORDER BY {request.sortField} {sortOrder}";
                }
                else
                {
                    query += " ORDER BY csl.code DESC";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var result = await _dataAccess.GetDataInline<OrderShipmentLocation, dynamic>(query, parameters);

                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(count, parameters);

                return new OrderShipmentLocationResponse
                {
                    data = result.ToList(),
                    totalRecords = totalCount.FirstOrDefault(),
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<int> deleteLocation(string code)
        {
            try
            {
                var query = @" DELETE FROM Cus_T_ship_loc_info WHERE Code = @code";
                var parameters = new
                {
                    code
                };
                return await _dataAccess.SaveDataInline(query, parameters);
            }
            catch (Exception ex)
            {

                return 0;
            }
        }
        public async Task<DetailOrderShipmentLocationResponse> getshipmentLocationDetail(string code)
        {
            try
            {
                var query = "SELECT * from Cus_T_ship_loc_info where code = @code";
                

                var parameters = new DynamicParameters();
                parameters.Add("@code", code);

                var result = await _dataAccess.GetDataInline<DetailOrderShipmentLocation, dynamic>(query, parameters);

                return new DetailOrderShipmentLocationResponse
                {
                    data = result.ToList(),
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<IEnumerable<ShippingLocationDto>> GetShippingLocations(string pickListId)
        {
            string query = @"
                SELECT CONCAT(a.loc_Code, '||s') AS Id, a.loc_Code 
                FROM lv_location a
                WHERE a.loc_storagesystemid IN (14,15) 
                AND a.loc_Code NOT IN (
                    SELECT assigned_shiploc 
                    FROM Cus_T_OrderShipLocations 
                    WHERE order_code <> @PickListId
                )
                UNION ALL
                SELECT CONCAT(a.loc_Code, '||d') AS Id, a.loc_Code 
                FROM lv_location a
                INNER JOIN Cus_T_ship_loc_info b ON a.loc_Code = b.Code
                WHERE a.loc_storagesystemid IN (14,15) 
                AND b.Size = 'Double' 
                AND a.loc_Code NOT IN (
                    SELECT assigned_shiploc 
                    FROM Cus_T_OrderShipLocations 
                    WHERE order_code <> @PickListId
                )
                ORDER BY 1 DESC;"
            ;

            return await _dataAccess.GetDataInline<ShippingLocationDto, dynamic>(query, new { PickListId = pickListId });
        }

        public async Task<IEnumerable<OrderShipLocationDto>> GetSelectedLocations(string pickListId)
        {
            string query = @"
                SELECT location_level_identifier AS LocationLevelIdentifier, assigned_shiploc AS AssignedShipLoc, lpn 
                FROM Cus_T_OrderShipLocations 
                WHERE order_code = @PickListId;"
            ;

            return await _dataAccess.GetDataInline<OrderShipLocationDto,dynamic>(query, new { PickListId = pickListId });
        }

        public async Task<IEnumerable<LaneLookupResponse>> LanesLookup()
        {
            string query = @"
                SELECT 
                    CONCAT(lane, '(Available slots = ', COUNT(id), ')') AS LaneCount,
                    lane,
                    COUNT(id) AS Count
                FROM [dbo].Cus_LaneSlots
                WHERE is_available = '1'
                GROUP BY lane;
            ";

            return await _dataAccess.GetDataInline<LaneLookupResponse, dynamic>(query, new { });
        }
        public async Task<IEnumerable<LocationLookupResponse>> getshipmentLocationLookups()
        {
            string query = @"
                SELECT *
                FROM [dbo].Cus_OrderType
            ";
            return await _dataAccess.GetDataInline<LocationLookupResponse, dynamic>(query, new { });
        }
        public async Task<LocationResponse> getMantisLocations(Mantislocationrequest request)
        {
            bool isQueryEmpty = string.IsNullOrWhiteSpace(request.query);
            int pageSize = isQueryEmpty ? 200 : (request.page > 0 ? request.page : 200);

            // Base query
            string query = $@"
                   SELECT TOP ({pageSize}) *
                   FROM [dbo].[LV_Location]
                       ";
            var parameters = new { searchText = request.query };

            // Add WHERE only if query has value
            if (!isQueryEmpty)
            {
                query += " WHERE loc_Code LIKE '%' + @searchText + '%'";
            }

            var locations = await _dataAccess.GetDataInline<Location, dynamic>(query, parameters);

            // Wrap into LocationResponse
            var response = new LocationResponse
            {
                error = 0,
                data = locations.ToList(),
                message = "Successful."
            };

            return response;
        }
        public async Task<ItemDescDto> Getshiploc(string code)
        {
            var query = "select isnull(code,'') as Product_Name from Cus_T_ship_loc_info where code = @code";

            return (await _dataAccess.GetDataInline<ItemDescDto, dynamic>(query, new { code = code })).FirstOrDefault();

        }
        public async Task<ResponseModel> createUpdateShipmentLocation(ShipmentLocationRequest request)
        {
            try
            {
                // 1️⃣ Fetch location details from LV_Location joined with LV_StorageSystems
                string locationQuery = @"
            SELECT TOP 1 
                L.loc_SectorCode,
                L.loc_Column,
                S.sts_Description
            FROM LV_Location L
            INNER JOIN LV_StorageSystems S ON S.sts_ID = L.loc_StorageSystemID
            WHERE L.loc_Code = @Code
        ";

                var lvLocation1 = await _dataAccess.GetDataInline<lvlocation, dynamic>(locationQuery, new { Code = request.code });
                var lvLocation = lvLocation1.FirstOrDefault();

                if (lvLocation == null)
                {
                    return new ResponseModel
                    {
                        Error = "1",
                        Message = "Location not found in mantis."
                    };
                }

                // 2️⃣ Check if record already exists in Cus_T_ship_loc_info
                string checkQuery = "SELECT COUNT(1) AS Count FROM Cus_T_ship_loc_info WHERE Code = @Code";
                var result = await _dataAccess.GetDataInline<dynamic, dynamic>(checkQuery, new { Code = request.code });

                int count = 0;
                if (result != null && result.Any())
                {
                    count = Convert.ToInt32(result.First().Count);
                }

                // 3️⃣ Insert or Update logic
                string query;
                if (count > 0)
                {
                    // UPDATE
                    query = @"
                UPDATE Cus_T_ship_loc_info
                SET 
                    Column_code = @Column_code,
                    Sector = @Sector,
                    Size = @Size,
                    Storage_system = @Storage_system,
                    customer_code = @customer_code,
                    limited_capacity = @limited_capacity,
                    shipment_type = @shipment_type,
                    is_consolidated = @is_consolidated
                WHERE Code = @Code;
            ";
                }
                else
                {
                    // INSERT
                    query = @"
                 INSERT INTO Cus_T_ship_loc_info (
                    Code,
                    Column_code,
                    Sector,
                    Size,
                    Storage_system,
                    customer_code,
                    limited_capacity,
                    shipment_type,
                    is_consolidated
                 )
                  VALUES 
                 (
                    @Code,
                    @Column_code,
                    @Sector,
                    @Size,
                    @Storage_system,
                    @customer_code,
                    @limited_capacity,
                    @shipment_type,
                    @is_consolidated
                 );
                    ";
                }

                // 4️⃣ Prepare parameters
                var parameters = new
                {
                    Code = request.code,
                    Column_code = lvLocation.loc_Column,
                    Sector = lvLocation.loc_SectorCode,
                    Size = request.size,
                    Storage_system = lvLocation.sts_Description,
                    customer_code = request.customer_code,
                    limited_capacity = request.limited_capacity,
                    shipment_type = request.shipment_type,
                    is_consolidated = request.is_consolidated
                };

                int rowsAffected = await _dataAccess.SaveDataInline(query, parameters);

                // 5️⃣ Return response
                if (rowsAffected > 0)
                {
                    string message = (count > 0)
                        ? "Shipment location updated successfully."
                        : "Shipment location created successfully.";

                    return new ResponseModel { Error = "0", Message = message };
                }
                else
                {
                    return new ResponseModel { Error = "1", Message = "Could not create or update shipment location." };
                }
            }
            catch (Exception ex)
            {
                // log ex if needed
                return new ResponseModel
                {
                    Error = "1",
                    Message = "Internal Server Error | " + ex.Message
                };
            }
        }
    }
}
