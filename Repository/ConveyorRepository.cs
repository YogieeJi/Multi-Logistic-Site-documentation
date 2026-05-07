using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http;
using System.Numerics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ConveyorRepository : IConveyorRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        public ConveyorRepository(ISqlDataAccess dataAccess, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _httpClient = httpClientFactory.CreateClient("WmsConveyorSettings");
            _configuration = configuration;
        }

        public async Task<LaneResponse> GetLanes(LaneRequest request)
        {
            var pageNumber = request.Page + 1;
            var pageSize = request.Rows;
            //var sortBy = request.SortField ?? "stn_Name";
            var sortBy = string.IsNullOrEmpty(request.SortField) ? "stn_Name" : request.SortField;
            var sortOrder = request.SortOrder == "1" ? "asc" : "desc";

            var endpoint = _configuration["WmsConveyorSettings:WmsEndpoint"] ?? "http://10.40.0.5";
            var url = $"{endpoint}/api/ConveyorSettings/GetAllSettings?pageNumber={pageNumber}&pageSize={pageSize}&sortBy={sortBy}&sortOrder={sortOrder}";
            //var url = $"{endpoint}/api/conveyor/conveyor-setting/getLane?pageNumber={pageNumber}&pageSize={pageSize}&sortBy={sortBy}&sortOrder={sortOrder}";

            var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
            httpRequest.Headers.Add("ApiKey", "DynarexCentralServer");

            var response = await _httpClient.SendAsync(httpRequest);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to fetch lane data. Status: {response.StatusCode}, Body: {responseString}");
            }

            dynamic result = JsonConvert.DeserializeObject(responseString);

            if (result?.IsSuccess == true)
            {
                return new LaneResponse
                {
                    Error = 0,
                    Data = result.Data,
                    TotalRecords = result.TotalRecords
                };
            }

            return new LaneResponse
            {
                Error = 1,
                Message = result?.Message ?? "Unexpected error"
            };
        }
        public async Task<laneDetails> getLaneDetail(int? id)
        {
            var query = "SELECT * FROM CUS_Con_Lanes WHERE id = @id ";
            var result = await _dataAccess.GetFirstDataInline<laneDetails1, dynamic>(query, new { id = id });

            return new laneDetails
            {
                data = result.FirstOrDefault()
            };
        }

        public async Task<OccupiedLanesResponse> occupiedLanesGrid(GridRequest request)
        {
            try
            {
                var query = "SELECT lane, COUNT(slot) AS slots_count FROM Cus_T_OrderLaneAssignment ";
                var count = "SELECT lane, COUNT(slot) AS slots_count FROM Cus_T_OrderLaneAssignment ";

                var parameters = new DynamicParameters();

                // Pagination
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            string filterValue = $"%{filter.Value?.value}%";
                            string condition = $" AND {filter.Key} LIKE @{filter.Key}";

                            query += condition;
                            count += condition;  // Apply filter to count query as well


                            parameters.Add(filter.Key, filterValue);
                        }
                    }
                }
                query += $" GROUP BY lane";
                count += $" GROUP BY lane";
                // Sorting based on sortOrder and sortField
                if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    query += $" ORDER BY {request.sortField} {sortOrder}";
                }
                else
                {
                    query += " ORDER BY lane  DESC";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var result = await _dataAccess.GetDataInline<OccupiedLanes, dynamic>(query, parameters);

                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(count, parameters);


                return new OccupiedLanesResponse
                {
                    data = result,
                    totalRecords = totalCount.FirstOrDefault(),
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<SlotGridResponse> GetSlotsGrid(GridRequest request)
        {
            try
            {
                var query = @"
                    SELECT 
                        cs.id,
                        cs.title,
                        cs.lane_id,
                        cs.lane,
                        cs.ptl_ip_ID,
                        cs.ptl_address,
                        cs.mantis_location_id,
                        cpc.ip AS ip
                    FROM Cus_Con_Slots cs
                    LEFT JOIN CUS_PTL_controllers cpc 
                        ON cpc.id = cs.ptl_ip_ID
                    WHERE 1=1 
                ";

                var count = @"
                SELECT COUNT(cs.id)
                FROM Cus_Con_Slots cs
                LEFT JOIN CUS_PTL_controllers cpc 
                    ON cpc.id = cs.ptl_ip_ID
                WHERE 1=1 ";

                var parameters = new DynamicParameters();

                // Map frontend filter/sort keys -> actual DB column aliases
                var fieldMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "id", "cs.id" },
                    { "title", "cs.title" },
                    { "lane_id", "cs.lane_id" },
                    { "lane", "cs.lane" },
                    { "ptl_ip_ID", "cs.ptl_ip_ID" },
                    { "ptl_address", "cs.ptl_address" },
                    { "mantis_location_id", "cs.mantis_location_id" },
                    { "ip", "cpc.ip" }
                };

                // Apply filters
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            if (fieldMap.TryGetValue(filter.Key, out var columnName))
                            {
                                string filterValue = $"%{filter.Value.value}%";
                                string condition = $" AND {columnName} LIKE @{filter.Key}";

                                query += condition;
                                count += condition;

                                parameters.Add(filter.Key, filterValue);
                            }
                        }
                    }
                }

                // Sorting
                string sortColumn = "cs.id"; // default sort column
                if (!string.IsNullOrEmpty(request.sortField) && fieldMap.TryGetValue(request.sortField, out var mappedSort))
                {
                    sortColumn = mappedSort;
                }

                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                query += $" ORDER BY {sortColumn} {sortOrder}";

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Execute queries
                var result = await _dataAccess.GetDataInline<SlotGridData, dynamic>(query, parameters);
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(count, parameters);

                return new SlotGridResponse
                {
                    Data = result,
                    TotalRecords = totalCount.FirstOrDefault(),
                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<SlotGridDetailResponse> GetSlotsDetail(int id)
        {
            var query = @"SELECT s.*, c.ip AS Ip
                         FROM Cus_Con_Slots s
                         LEFT JOIN CUS_PTL_controllers c ON c.id = s.ptl_ip_ID
                         WHERE s.id = @Id";
            var result = (await _dataAccess.GetDataInline<SlotGridData, dynamic>(query, new { Id = id })).FirstOrDefault();
            return new SlotGridDetailResponse
            {
                data = result
            };
        }

        public async Task<List<PTLControllerModel>> GetPTLController()
        {
            var query = "SELECT id, ip FROM CUS_PTL_controllers";
            return (await _dataAccess.GetDataInline<PTLControllerModel, dynamic>(query, new { })).ToList();
        }

        public async Task<List<LVLocationModel>> GetLVLocations()
        {
            var query = @"
            SELECT loc_ID, loc_Code 
            FROM LV_Location 
            WHERE loc_StorageSystemID = 1 
              AND loc_SectorCode LIKE '%L%'";
            return (await _dataAccess.GetDataInline<LVLocationModel, dynamic>(query, new { })).ToList();
        }

        public async Task<List<ConveyorLaneModel>> GetConveyorLanes()
        {
            var query = "SELECT * FROM CUS_Con_Lanes";
            return (await _dataAccess.GetDataInline<ConveyorLaneModel, dynamic>(query, new { })).ToList();
        }

        public async Task<bool> AddSlot(ConveyorSlotRequest slot)
        {
            try
            {
                var query = @"INSERT INTO Cus_Con_Slots 
                    (title, lane_id, lane, ptl_ip_ID, ptl_address, mantis_location_id)
                    VALUES (@Title, @Lane_Id, @Lane, @Ptl_Ip_ID, @Ptl_Address, @Mantis_Location_Id);
                    SELECT CAST(SCOPE_IDENTITY() as int)
                ";

                var result = await _dataAccess.SaveDataInline(query, new { Title =slot.title, Lane_Id =slot.lane_id,
                    Lane = slot.lane,
                    Ptl_Ip_ID = slot.ip,           // mapping ip -> ptl_ip_ID
                    Ptl_Address = slot.tag,        // mapping tag -> ptl_address
                    Mantis_Location_Id=slot.mantis_location_id
                });
                return result > 0;
            }
            catch (Exception)
            {
                throw;
            }
        }
        //public async Task<bool> UpdateSlot(SlotInputModel model, int id)
        //{
        //    var query =@"UPDATE Cus_Con_Slots
        //                     SET 
        //                    title = @Title,
        //                     lane = @Lane,
        //                    ptl_ip_ID = @Ptl_Ip_ID,
        //                    ptl_address = @Ptl_Address,
        //                    mantis_location_id = @Mantis_Location_Id
        //                     WHERE id = @Id";  ////lane_id = @Lane_Id

        //    var affected = await _dataAccess.SaveDataInline(query, new
        //    {
        //        Id = id,
        //        Title = model.title,
        //        //Lane_Id = model.lane_id,
        //        Lane = model.lane,
        //        Ptl_Ip_ID = model.ip,
        //        Ptl_Address = model.tag,
        //        Mantis_Location_Id = model.mantis_location_id
        //    });

        //    return affected > 0;
        //}
        public async Task<bool> UpdateSlot(SlotInputModel model, int id)
        {
            try
            {
                var updates = new List<string>();
                var parameters = new DynamicParameters();
                parameters.Add("@Id", id);

                if (!string.IsNullOrEmpty(model.title))
                {
                    updates.Add("title = @Title");
                    parameters.Add("@Title", model.title);
                }

                if (!string.IsNullOrEmpty(model.lane))
                {
                    updates.Add("lane = @Lane");
                    parameters.Add("@Lane", model.lane);
                }

                if (!string.IsNullOrEmpty(model.ip))
                {
                    updates.Add("ptl_ip_ID = @Ptl_Ip_ID");
                    parameters.Add("@Ptl_Ip_ID", model.ip);
                }

                // Handle Tag field
                if (model.tag.HasValue && model.tag.Value != 0)
                {
                    // Update with value
                    updates.Add("ptl_address = @Ptl_Address");
                    parameters.Add("@Ptl_Address", model.tag.Value);
                }
                else if (!model.tag.HasValue || model.tag.Value == 0)
                {
                    // Explicitly set to NULL if tag is empty or cleared
                    updates.Add("ptl_address = NULL");
                }


                if (model.mantis_location_id != 0)
                {
                    updates.Add("mantis_location_id = @Mantis_Location_Id");
                    parameters.Add("@Mantis_Location_Id", model.mantis_location_id);
                }

                //if (model.lane_id != 0)
                //{
                //    updates.Add("lane_id = @Lane_Id");
                //    parameters.Add("@Lane_Id", model.lane_id);
                //}

                if (!updates.Any())
                {
                    return false; // nothing to update
                }

                var query = $@"
                UPDATE Cus_Con_Slots
                SET {string.Join(", ", updates)}
                WHERE id = @Id";

                var affected = await _dataAccess.SaveDataInline(query, parameters);
                return affected > 0;
            }
            catch (Exception ex)
            {
                // Handle general errors
                Console.WriteLine($"Unexpected error while updating slot {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<IEnumerable<OrderStatusResponse>> GetOrdersByStatus()
        {
            return await _dataAccess.GetDataInline<OrderStatusResponse, dynamic>("[dbo].[Cus_Sp_GetOrdersByStatus_v1]", new { });
        }

        public async Task<OrderSlotResponse> GetOrderSlot(GridRequest request)
        {
            var filtersSql = "";
            var parameters = new DynamicParameters();
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            // Base query
            var baseSql = @"
                FROM CUS_Con_Slots s
                INNER JOIN CUS_Con_Lanes c ON s.lane_id = c.id
                LEFT JOIN CUS_Con_Order o ON s.id = o.slot_id
                LEFT JOIN LV_Order ord ON ord.ord_ID = o.order_id
                LEFT JOIN LV_ProgressStatus pst ON pst.pst_ID = ord.ord_StatusID
                WHERE c.lane_type = 2
            ";

            // Dynamic filters
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Value.value))
                    {
                        if (filter.Key == "title")
                            filtersSql += $" AND s.title LIKE @title ";
                        else
                            filtersSql += $" AND {filter.Key} LIKE @{filter.Key} ";

                        parameters.Add($"@{filter.Key}", $"%{filter.Value.value}%");
                    }
                }
            }

            // Sorting
            string orderBy = " ORDER BY s.id DESC";
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                var sortType = request.sortOrder == "1" ? "ASC" : "DESC";
                orderBy = $" ORDER BY {request.sortField} {sortType}";
            }

            // Query for total count
            var countSql = $"SELECT COUNT(*) {baseSql} {filtersSql}";
            var totalRecords = await _dataAccess.GetDataReturnInline<int>(countSql, parameters);

            // Query for paged data
            var dataSql = $@"
                SELECT s.id, s.title, ord.ord_Code, pst.pst_MessageCode, 
                       o.is_noprint, o.label_file_name, o.order_id
                {baseSql} {filtersSql}
                {orderBy}
                OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY
            ";

            var data = await _dataAccess.GetDataInline<OrderSlot, dynamic>(dataSql, parameters);

            return new OrderSlotResponse 
            { 
                Data = data, 
                TotalRecords = totalRecords
            };
        }

        public async Task<ResponseResult> UpdateOrderSlot(UpdateOrderSlotRequest request)
        {
            try
            {
                var sql = @"
                    MERGE CUS_Con_Order AS target
                    USING (VALUES (@slot_id, @order_id, @label_file_name, @is_noprint)) 
                          AS source (slot_id, order_id, label_file_name, is_noprint)
                    ON target.slot_id = source.slot_id
                    WHEN MATCHED THEN 
                        UPDATE SET 
                            order_id = source.order_id,
                            label_file_name = source.label_file_name,
                            is_noprint = source.is_noprint
                    WHEN NOT MATCHED THEN
                        INSERT (slot_id, order_id, label_file_name, is_noprint)
                        VALUES (source.slot_id, source.order_id, source.label_file_name, source.is_noprint);";

                await _dataAccess.SaveDataInline(sql, request);

                return new ResponseResult { Error = 0, Message = "Slot updated successfully" };
            }
            catch (Exception ex)
            {
                return new ResponseResult { Error = 1, Message = $"Error while updating slot | {ex.Message}" };
            }
        }

        public async Task<ConveryorLanesResponse> GetConveyorLanesGrid(GridRequest request)
        {
            var sql = new StringBuilder("SELECT * FROM CUS_Con_Lanes WHERE 1=1 ");
            var countSql = new StringBuilder("SELECT COUNT(*) FROM CUS_Con_Lanes WHERE 1=1 ");
            var parameters = new DynamicParameters();

            // Filters
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    var column = filter.Key;
                    var filterValue = filter.Value?.value?.Trim();
                    if (string.IsNullOrEmpty(filterValue)) continue;

                    var paramName = $"@p_{column.Replace(".", "_")}";

                    // Handle lane_type mapping
                    if (column.Equals("lane_type", StringComparison.OrdinalIgnoreCase))
                    {
                        int? laneTypeInt = null;
                        switch (filterValue.ToLower())
                        {
                            case "receiving":
                                laneTypeInt = 1;
                                break;
                            case "shipping":
                                laneTypeInt = 2;
                                break;
                        }

                        if (laneTypeInt.HasValue)
                        {
                            sql.Append($" AND lane_type = {paramName} ");
                            countSql.Append($" AND lane_type = {paramName} ");
                            parameters.Add(paramName, laneTypeInt.Value);
                        }

                        continue; 
                    }

                    sql.Append($" AND {column} LIKE {paramName} ");
                    countSql.Append($" AND {column} LIKE {paramName} ");
                    parameters.Add(paramName, $"%{filterValue}%");
                }
            }

            // Sorting
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != "0")
            {
                var sortType = request.sortOrder == "1" ? "ASC" : "DESC";
                sql.Append($" ORDER BY {request.sortField} {sortType} ");
            }
            else
            {
                sql.Append(" ORDER BY Id DESC ");
            }

            // Pagination
            sql.Append(" OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY ");
            parameters.Add("@Skip", request.first);
            parameters.Add("@Take", request.rows);

            var data = await _dataAccess.GetDataInline<ConveryorLanes,dynamic>(sql.ToString(), parameters);
            var totalCount = await _dataAccess.SaveDataReturnInline<int>(countSql.ToString(), parameters);

            return new ConveryorLanesResponse
            {
                Data = data,
                TotalRecords = totalCount,
                Message = "Successfull"
            };
        }

        public async Task<int> AddLane(CreateLaneRequest request)
        {
            var sql = @"
                INSERT INTO CUS_Con_Lanes (conveyor_id, conveyor_name, title, lane_type, Is_ErrorLane, is_noread)
                VALUES (@Conveyor_id, @Conveyor_name, @Title, @Lane_type, @Is_ErrorLane, @Is_noread);

                SELECT CAST(SCOPE_IDENTITY() as int);
            ";

            var id = await _dataAccess.SaveDataReturnInline<int>(sql, request);
            return id;
        }

        public async Task<int> UpdateLanes(UpdateLanesRequest request, int id)
        {
            var sql = @"
                UPDATE CUS_Con_Lanes
                SET conveyor_id = @Conveyor_Id,
                    conveyor_name = @Conveyor_Name,
                    title = @Title,
                    lane_type = @Lane_Type,
                    Is_ErrorLane = @Is_ErrorLane,
                    is_noread = @Is_NoRead
                WHERE id = @Id
            ";

            var parameters = new
            {
                Id = id,
                Conveyor_Id = request.Conveyor_id,
                Conveyor_Name = request.Conveyor_name,
                Title = request.Title,
                Lane_Type = request.Lane_type,
                Is_ErrorLane = request.Is_ErrorLane,
                Is_NoRead = request.Is_noread
            };

            return await _dataAccess.SaveDataInline(sql, parameters);
        }
    }

}