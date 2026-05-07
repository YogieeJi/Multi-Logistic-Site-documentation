using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class OutboundShipmentRepository : IOutboundShipmentRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        public OutboundShipmentRepository(ISqlDataAccess dataAccess, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
        }

        public async Task<OutboundShipmentsResponse> GetOutboundShipments(GridRequest request)
        {
            var parameter = new DynamicParameters();
            var whereConditions = new List<string>();

            // Base SELECT (for data)
            var selectQuery = @"
               SELECT
                    t.trk_Code AS trk_Code,
                    t.trk_Id AS trk_ID,

                    dbo.UtcToLocal(
                        MIN(NULLIF(s.shp_ShipDate, '1900-01-01'))
                    ) AS shp_ShipDate,

                    STUFF((
                        SELECT DISTINCT ',' + CAST(s2.shp_ID AS VARCHAR(20))
                        FROM LV_Shipment s2
                        WHERE s2.shp_TruckID = t.trk_ID
                        FOR XML PATH(''), TYPE
                    ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS shp_ID,

                    MIN(s.shp_statusID) AS shp_statusID,
                    MIN(os.ost_Code) AS ost_Code,

                    CASE
                        WHEN COUNT(CASE WHEN l.loc_Code IS NULL THEN 1 END) > 0
                            THEN NULL
                        ELSE MIN(CASE WHEN o.ord_StatusID NOT IN (3,4,5) THEN l.loc_Code END)
                    END AS loc_code,

                    COUNT(DISTINCT CASE WHEN o.ord_StatusID NOT IN (3,4,5) THEN o.ord_ID END) AS OrderCount,
                    COUNT(DISTINCT stc.stc_sscc) AS TruckPalletCount

                FROM LV_Truck t
                LEFT JOIN LV_Shipment s ON s.shp_TruckID = t.trk_ID
                LEFT JOIN LV_OrderShipment os ON os.ost_ShipmentID = s.shp_ID
                LEFT JOIN LV_Order o ON o.ord_Id = os.ost_OrderID
                LEFT JOIN LV_OrderItem oi ON o.ord_id = oi.ori_orderid
                LEFT JOIN LV_OrderShipItem osi ON oi.ori_id = osi.osi_OrderItemID
                LEFT JOIN LV_OrderShipItemStock oss ON osi.osi_id = oss.oss_OrderShipItemID
                LEFT JOIN lv_stock stk ON stk.stk_id = oss.oss_StockID
                LEFT JOIN LV_StockContainer stc ON stk.stk_ContainerID = stc.stc_id
                LEFT JOIN LV_Location l ON l.loc_ID = s.shp_LocationID
                WHERE t.trk_ManagedLED = 1
            ";

            // Build WHERE conditions dynamically
            if (request.filters != null && request.filters?.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrEmpty(filter.Value?.value)) continue;

                    var paramName = $"@{filter.Key}";
                    parameter.Add(paramName, $"%{filter.Value.value}%");

                    switch (filter.Key.ToLower())
                    {
                        case "shp_shipdate":
                            if (DateTime.TryParse(filter.Value.value, out DateTime date))
                            {
                                var dateParam = $"@date_{filter.Key}";
                                parameter.Add(dateParam, date.Date);
                                whereConditions.Add($"EXISTS (SELECT 1 FROM LV_Shipment s2 WHERE s2.shp_TruckID = t.trk_ID AND CAST(s2.shp_ShipDate AS DATE) = {dateParam})");
                            }
                            break;

                        case "trk_code":
                            whereConditions.Add($"t.trk_Code LIKE {paramName}");
                            break;

                        case "shp_id":
                            whereConditions.Add($"EXISTS (SELECT 1 FROM LV_Shipment s3 WHERE s3.shp_TruckID = t.trk_ID AND CAST(s3.shp_ID AS VARCHAR) LIKE {paramName})");
                            break;

                        default:
                            parameter.Add(paramName, $"%{filter.Value.value}%");
                            whereConditions.Add($"({filter.Key} LIKE {paramName})");
                            break;
                    }
                }
            }

            // Append WHERE clause
            var whereClause = whereConditions.Any() ? " AND " + string.Join(" AND ", whereConditions) : "";

            // Final data query
            var dataQuery = selectQuery + whereClause + @" GROUP BY t.trk_Code, t.trk_Id";

            // Sorting
            if (!string.IsNullOrEmpty(request.sortField) && !string.IsNullOrEmpty(request.sortOrder))
            {
                var sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                // Sanitize sortField to prevent SQL injection (only allow known columns)
                var allowedSortFields = new[] { "trk_Code", "shp_ShipDate", "OrderCount", "TruckPalletCount" };
                var safeSortField = allowedSortFields.Contains(request.sortField) ? request.sortField : "trk_Code";
                dataQuery += $" ORDER BY {safeSortField} {sortOrder}";
            }
            else
            {
                dataQuery += " ORDER BY CASE WHEN COUNT(s.shp_ID) = 0 THEN 0 ELSE 1 END, t.trk_Id DESC";
            }

            // Pagination
            dataQuery += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameter.Add("@Skip", request.first);
            parameter.Add("@Rows", request.rows);

            // Correct COUNT query (without pagination)
            var countQuery = @"
                SELECT COUNT(*) 
                FROM (
                    SELECT t.trk_Id
                    FROM LV_Truck t
                    LEFT JOIN LV_Shipment s ON s.shp_TruckID = t.trk_ID
                    LEFT JOIN LV_OrderShipment os ON os.ost_ShipmentID = s.shp_ID
                    LEFT JOIN LV_Order o ON o.ord_Id = os.ost_OrderID
                    LEFT JOIN LV_OrderItem oi ON o.ord_id = oi.ori_orderid
                    LEFT JOIN LV_OrderShipItem osi ON oi.ori_id = osi.osi_OrderItemID
                    LEFT JOIN LV_OrderShipItemStock oss ON osi.osi_id = oss.oss_OrderShipItemID
                    LEFT JOIN lv_stock stk ON stk.stk_id = oss.oss_StockID
                    LEFT JOIN LV_StockContainer stc ON stk.stk_ContainerID = stc.stc_id
                    LEFT JOIN LV_Location l ON l.loc_ID = s.shp_LocationID
                    WHERE t.trk_ManagedLED = 1" + whereClause + @"
                    GROUP BY t.trk_Code, t.trk_Id
                ) AS FilteredTrucks
             ";

            // Execute queries
            var data = await _dataAccess.GetDataInline<OutboundShipment, dynamic>(dataQuery, parameter);
            var totalRecords = await _dataAccess.SaveDataReturnInline<int>(countQuery, parameter);

            return new OutboundShipmentsResponse
            {
                Data = data.ToList(),
                TotalRecords = totalRecords,
                Message = "Successfully fetched data"
            };
        }

        public async Task<IEnumerable<Truckddlresponse>> getAllTrucks()
        {
            var sqlBuilder = new StringBuilder(@"
                SELECT trk_ID, trk_Code FROM LV_truck
            ");

            var data = await _dataAccess.GetDataInline<Truckddlresponse, dynamic>(sqlBuilder.ToString(),new {});
            return data;
        }

        public async Task<IEnumerable<TrucksResponse>> GetTruckById(int id)
        {
            var sql = new StringBuilder(@"
                SELECT 
                    t.trk_ID,
                    t.trk_Code,
                    MIN(s.shp_ShipDate) AS shp_ShipDate,
                    CASE 
                        WHEN COUNT(CASE WHEN l.loc_Code IS NULL 
                                        AND o.ord_StatusID IS NOT NULL 
                                        AND o.ord_StatusID NOT IN (3,4,5) 
                                THEN 1 END) > 0 
                            THEN NULL
                        ELSE MIN(CASE WHEN o.ord_StatusID NOT IN (3,4,5) 
                                    THEN l.loc_Code END)
                    END AS loc_Code
                FROM LV_Truck t
                LEFT JOIN LV_Shipment s ON t.trk_ID = s.shp_TruckID
                LEFT JOIN LV_OrderShipment os ON s.shp_ID = os.ost_ShipmentID
                LEFT JOIN LV_Order o ON os.ost_OrderID = o.ord_ID
                LEFT JOIN LV_Location l ON l.loc_ID = s.shp_LocationID
                WHERE t.trk_ID = @TruckId
                GROUP BY t.trk_ID, t.trk_Code;
            ");

            return await _dataAccess.GetFirstDataInline<TrucksResponse,dynamic>(sql.ToString(), new { TruckId = id });
        }

        public async Task<TrucklocationResponse> GetAlllocation()
        {
            var sqlBuilder = new StringBuilder(@"
              select loc_Description,* from LV_Location where loc_Description is not null
            ");

            var data = await _dataAccess.GetDataInline<Trucklocations, dynamic>(sqlBuilder.ToString(), new { });
            return new TrucklocationResponse
            {
                Data = data.ToList()
            };


        }
        public async Task<OutboundShipmentDetailResponse> GetShipmentDetailById(GridRequest request, int id)
        {
            var sqlBuilder = new StringBuilder();
            var countBuilder = new StringBuilder();

            sqlBuilder.Append(@"
                SELECT 
                    ost_ID,
                    ost_OrderID,
                    ost_ExecuteDate,
                    ost_ShipDate,
                    ost_DeliveryDate,
                    V_SelectOrderShipment.OrderShipmentStatus,
                    V_SelectOrderShipment.ost_Code,
                    Cus_T_ImportedOrders.ship_to,
                    Cus_T_ImportedOrders.customer_code
                FROM V_SelectOrderShipment
                INNER JOIN LV_Order ON LV_Order.ord_ID = V_SelectOrderShipment.ost_OrderID
                LEFT JOIN Cus_T_ImportedOrders ON Cus_T_ImportedOrders.pick_list_id = V_SelectOrderShipment.ord_Code
                WHERE ost_ShipmentID = @ShipmentId
                  AND ors_Code < 65
                  AND LanguageID = 1
                  AND LanguageID1 = 1
                  AND LanguageID2 = 1
                  AND (LanguageID3 = 1 OR LanguageID3 IS NULL)
            ");

            var parameters = new DynamicParameters();
            parameters.Add("ShipmentId", id);

            // Filters
            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Value.value))
                    {
                        sqlBuilder.Append($" AND {filter.Key} LIKE @{filter.Key}");
                        parameters.Add(filter.Key, $"%{filter.Value.value}%");
                    }
                }
            }

            // Sorting
            string sortType = request.sortOrder switch
            {
                "1" => "ASC",
                "-1" => "DESC",
                _ => ""
            };

            if (!string.IsNullOrEmpty(request.sortField) && !string.IsNullOrEmpty(sortType))
            {
                sqlBuilder.Append($" ORDER BY {request.sortField} {sortType}");
            }
            else
            {
                sqlBuilder.Append(" ORDER BY ost_ID ASC");
            }

            // Pagination
            sqlBuilder.Append(" OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY");
            parameters.Add("Skip", request.first);
            parameters.Add("Rows", request.rows);

            // Count query
            countBuilder.Append(@"
                SELECT COUNT(*) 
                FROM V_SelectOrderShipment
                INNER JOIN LV_Order ON LV_Order.ord_ID = V_SelectOrderShipment.ost_OrderID
                LEFT JOIN Cus_T_ImportedOrders ON Cus_T_ImportedOrders.pick_list_id = V_SelectOrderShipment.ord_Code
                WHERE ost_ShipmentID = @ShipmentId
                  AND ors_Code < 65
                  AND LanguageID = 1
                  AND LanguageID1 = 1
                  AND LanguageID2 = 1
                  AND (LanguageID3 = 1 OR LanguageID3 IS NULL)
            ");

            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Value.value))
                    {
                        countBuilder.Append($" AND {filter.Key} LIKE @{filter.Key}");
                    }
                }
            }

            var data = await _dataAccess.GetDataInline<OutboundShipmentDetail,dynamic>(sqlBuilder.ToString(), parameters);
            var totalCount = await _dataAccess.GetDataInline<int,dynamic>(countBuilder.ToString(), parameters);

            return new OutboundShipmentDetailResponse
            {
                Data = data,
                TotalCount = totalCount.FirstOrDefault(),
            };
        }

        public async Task<ShipmentDetailTruckResponse> GetShipmentDetailTruck(GridRequest request, int id)
        {
            var baseSql = new StringBuilder(@"
                FROM lv_truck t
                INNER JOIN LV_Shipment s ON s.shp_TruckID = t.trk_ID
                INNER JOIN LV_OrderShipment os ON os.ost_ShipmentID = s.shp_ID
                INNER JOIN V_OrderStatus vs ON os.ost_StatusID = vs.ors_ID
                INNER JOIN LV_Order o ON os.ost_OrderID = o.ord_ID AND o.ord_StatusID NOT IN (3,4,5)
                LEFT JOIN LV_OrderItem oi ON oi.ori_OrderID = o.ord_ID
                LEFT JOIN Cus_T_ImportedOrders io ON o.ord_Code = io.pick_list_id
                WHERE t.trk_ID = @TruckId 
                  AND LanguageID = 1
            ");

            var parameters = new DynamicParameters();
            parameters.Add("@TruckId", id);

            // 🔹 Apply filters
            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Value.value))
                        continue;

                    var key = filter.Key;
                    var value = filter.Value.value;

                    // Handle date filters
                    if (key.Equals("ost_ExecuteDate", StringComparison.OrdinalIgnoreCase) ||
                        key.Equals("ost_ShipDate", StringComparison.OrdinalIgnoreCase))
                    {
                        if (DateTime.TryParse(value, out DateTime dateValue))
                        {
                            baseSql.Append($" AND CONVERT(date, {key}) = @Date_{key} ");
                            parameters.Add($"@Date_{key}", dateValue.Date);
                        }
                        continue;
                    }

                    // Special case: order shipment status
                    if (key.Equals("OrderShipmentStatus", StringComparison.OrdinalIgnoreCase))
                    {
                        baseSql.Append(" AND (vs.ors_Code + ' - ' + vs.Status) LIKE @OrderShipmentStatus ");
                        parameters.Add("@OrderShipmentStatus", $"%{value}%");
                    }
                    else
                    {
                        baseSql.Append($" AND {key} LIKE @{key} ");
                        parameters.Add($"@{key}", $"%{value}%");
                    }
                }
            }

            // 🔹 Select part
            var selectSql = new StringBuilder(@"
                SELECT 
                    os.ost_ID,
                    os.ost_OrderID,
                    os.ost_ExecuteDate,
                    io.ship_to AS Ship_To,
                    io.customer_code AS Customer_Code,
                    o.ord_Code AS Ord_Code,
                    os.ost_ShipDate,
                    os.ost_DeliveryDate,
                    os.ost_LoadingPriority,
                    (vs.ors_Code + ' - ' + vs.Status) AS OrderShipmentStatus,
                    CAST(SUM(ISNULL(oi.ori_Quantity, 0)) AS INT) AS TotalQuantity
            ");
            selectSql.Append(baseSql);
            selectSql.Append(@"
                GROUP BY 
                    os.ost_ID,
                    os.ost_OrderID,
                    os.ost_ExecuteDate,
                    os.ost_ShipDate,
                    os.ost_DeliveryDate,
                    vs.ors_Code,
                    vs.Status,
                    o.ord_Code,
                    os.ost_LoadingPriority,
                    io.ship_to,
                    io.customer_code
            ");

            // 🔹 Sorting
            if (!string.IsNullOrEmpty(request.sortField) && !string.IsNullOrEmpty(request.sortOrder))
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                selectSql.Append($" ORDER BY {request.sortField} {sortOrder}");
            }
            else
            {
                selectSql.Append(" ORDER BY os.ost_ID ASC");
            }

            // 🔹 Pagination
            selectSql.Append(" OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY");
            parameters.Add("@Skip", request.first);
            parameters.Add("@Take", request.rows);

            // 🔹 Count query
            var countSql = new StringBuilder();
            countSql.Append("SELECT COUNT(*) FROM (SELECT os.ost_ID ");
            countSql.Append(baseSql);
            countSql.Append(@"
                GROUP BY 
                    os.ost_ID,
                    os.ost_OrderID,
                    os.ost_ExecuteDate,
                    os.ost_ShipDate,
                    os.ost_DeliveryDate,
                    vs.ors_Code,
                    vs.Status,
                    o.ord_Code,
                    os.ost_LoadingPriority,
                    io.ship_to,
                    io.customer_code
            ) AS CountTable");

            var data = await _dataAccess.GetDataInline<ShipmentDetailTruck, dynamic>(selectSql.ToString(), parameters);
            var totalRecords = await _dataAccess.SaveDataReturnInline<int>(countSql.ToString(), parameters);

            return new ShipmentDetailTruckResponse
            {
                Data = data,
                TotalCount = totalRecords,
            };
        }

        public async Task<IEnumerable<OutboundShipmentHeader>> GetShipmentHeaderById(int id)
        {
            var sql = @"
                SELECT * 
                FROM V_SearchShipment
                WHERE shp_ID = @Id
                  AND shp_LogisticSiteID = 5
                  AND (LanguageID = 1 OR LanguageID IS NULL)
                  AND (LanguageID1 = 1 OR LanguageID1 IS NULL)
            ";

            var shipmentsHeader = await _dataAccess.GetDataInline<OutboundShipmentHeader,dynamic>(sql, new { Id = id });
            return shipmentsHeader;
        }

        public async Task<IEnumerable<OutboundShipmentTruck>> EditOrderShipmentTruck(int id)
        {
            var sql = @"
                SELECT *
                FROM (
                    SELECT 
                        V.OrderShipmentStatus,
                        V.ost_Code,
                        V.ost_ExecuteDate,
                        V.ost_ShipDate,
                        V.ost_DeliveryDate,
                        V.ost_ShipmentID,
                        V.ost_LoadingPriority,
                        C.ship_to AS ShipTo,
                        C.customer_code AS CustomerCode,
                        S.shp_Code,
                        T.trk_code AS TruckCodePlate,
                        T.trk_id AS Shp_TruckID,
                        CASE 
                            WHEN COUNT(CASE WHEN L.loc_Code IS NULL 
                                                AND O.ord_StatusID IS NOT NULL 
                                                AND O.ord_StatusID NOT IN (3,4,5) 
                                            THEN 1 END) > 0 
                                THEN NULL
                            ELSE MIN(CASE WHEN O.ord_StatusID NOT IN (3,4,5) THEN L.loc_Code END)
                        END AS Loc_Code
                    FROM V_SelectOrderShipment V
                    LEFT JOIN LV_Shipment S ON V.ost_ShipmentID = S.shp_ID
                    LEFT JOIN LV_Truck T ON S.shp_TruckID = T.trk_ID
                    LEFT JOIN LV_Location L ON L.loc_ID = S.shp_LocationID
                    INNER JOIN LV_Order O ON O.ord_ID = V.ost_OrderID
                    LEFT JOIN Cus_T_ImportedOrders C ON C.pick_list_id = V.ord_Code

                    WHERE T.trk_ID = @TruckId
                        AND V.LanguageID = 1
                        AND V.ors_Code < 65
                        AND V.LanguageID1 = 1
                        AND V.LanguageID2 = 1
                        AND (V.LanguageID3 = 1 OR V.LanguageID3 IS NULL)

                    GROUP BY 
                        V.OrderShipmentStatus, V.ost_Code, V.ost_ExecuteDate, V.ost_ShipDate, 
                        V.ost_DeliveryDate, V.ost_ShipmentID, V.ost_LoadingPriority,
                        C.ship_to, C.customer_code, S.shp_Code, T.trk_code, T.trk_id
                ) sub
                ORDER BY 
                    CASE WHEN Loc_Code IS NULL THEN 0 ELSE 1 END, 
                    Loc_Code;
            ";

            return await _dataAccess.GetDataInline<OutboundShipmentTruck, dynamic>(sql, new { TruckId = id });
        }

        public async Task<WmsResponse> DeleteShipmentFromWms(int? shipmentId)
        {
            var requestUrl = $"Order/DeleteShipment?shipmentID={shipmentId}";

            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<WmsResponse>(responseBody);
        }

        public async Task<IEnumerable<LaneSlotModel>> GetAvailableLanes(IEnumerable<string> lanes)
        {
            var sql = @"SELECT lane, slot FROM Cus_LaneSlots WHERE lane IN @Lanes AND is_available = 1";
            return await _dataAccess.GetDataInline<LaneSlotModel,dynamic>(sql, new { Lanes = lanes });
        }

        public async Task<IEnumerable<string>> GetShipmentCodes(int shipmentId)
        {
            var sql = @"SELECT ost_Code FROM V_SelectOrderShipment 
                    WHERE ost_ShipmentID = @ShipmentId AND ors_Code < 65
                    AND LanguageID = 1 AND LanguageID1 = 1 AND LanguageID2 = 1 
                    AND (LanguageID3 = 1 OR LanguageID3 IS NULL)";
            return await _dataAccess.GetDataInline<string,dynamic>(sql, new { ShipmentId = shipmentId });
        }

        public async Task<bool> IsWrappedLpn(string orderCode)
        {
            var sql = @"SELECT COUNT(*) FROM Cus_T_OrderShipLocations WHERE order_code = @OrderCode AND wrapped_lpn IS NULL";
            var count = await _dataAccess.GetDataReturnInline<int>(sql, new { OrderCode = orderCode });
            return count == 0;
        }

        public async Task<IEnumerable<OrderPalletModel>> GetOrderPallets(string orderCode)
        {
            var sql = @"SELECT order_code AS OrderCode, assigned_shiploc AS AssignedShipLoc, lpn FROM Cus_T_OrderShipLocations WHERE order_code = @OrderCode";
            return await _dataAccess.GetDataInline<OrderPalletModel,dynamic>(sql, new { OrderCode = orderCode });
        }

        public async Task CreateOrderLaneAssignment(OrderLaneAssignmentModel model)
        {
            var sql = @"INSERT INTO Cus_T_OrderLaneAssignment (lane, slot, order_code, ship_to, lpn) 
                    VALUES (@Lane, @Slot, @OrderCode, @ShipTo, @Lpn)";
            await _dataAccess.SaveDataInline(sql, model);
        }

        public async Task UpdateLaneAvailability(string lane, string slot)
        {
            var sql = @"UPDATE Cus_LaneSlots SET is_available = 0 WHERE lane = @Lane AND slot = @Slot";
            await _dataAccess.SaveDataInline(sql, new { Lane = lane, Slot = slot });
        }

        public async Task MarkOrderAsAssigned(string pickListId)
        {
            var sql = @"UPDATE Cus_T_ImportedOrders SET is_lane_assigned = 1 WHERE pick_list_id = @PickListId";
            await _dataAccess.SaveDataInline(sql, new { PickListId = pickListId });
        }

        public async Task<List<string>> GetDistinctOrderCodesByShipmentIds(List<int> shipmentIds)
        {
            var query = @"
            SELECT DISTINCT ost_code
            FROM V_SelectOrderShipment
            WHERE ost_ShipmentID IN @ShipmentIds";

            var result = await _dataAccess.GetDataInline<string,dynamic>(query, new { ShipmentIds = shipmentIds });
            return result.ToList();
        }

        public async Task DeleteOrderShipLocations(List<string> orderCodes)
        {
            var query = @"DELETE FROM Cus_T_OrderShipLocations
            WHERE order_code IN @OrderCodes";

            await _dataAccess.SaveDataInline(query, new { OrderCodes = orderCodes });
        }

        public async Task<OrderShipmentsResponse> GetOrderShipments(GridRequest request)
        {
            try
            {
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

                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                //// Format filters
                //var filters = new List<string>();
                //if (request.filters != null)
                //{
                //    foreach (var filter in request.filters)
                //    {
                //        var key = filter.Key;
                //        var value = filter.Value?.value;
                //        //if (!string.IsNullOrWhiteSpace(value))
                //        //{
                //            filters.Add($"{key}:{value}");
                //        //}
                //    }
                //}

                // Format filters (Fixed DateTime issue)
                var filters = new List<string>();

                if (request.filters != null)
                {
                    foreach (var filter in request.filters)
                    {
                        var key = filter.Key;
                        var values = filter.Value?.value;

                        if (values == null) continue;

                        var Value = values.ToString().Trim();

                        // Handle DateTime
                        if (DateTime.TryParse(Value, out DateTime dateValue))
                        {
                            // Only Date (NO time)
                            var formattedDate = dateValue.ToString("yyyy-MM-dd");

                            filters.Add($"{key}:{formattedDate}");
                        }
                        else
                        {
                            filters.Add($"{key}:{Value}");
                        }
                    }
                }

                // Determine sort order
                var sortType = request.sortOrder == "-1" || request.sortOrder?.ToLower() == "desc" ? "desc" : "asc";

                var payload = new OrderShipmentsPayload
                {
                    PageNumber = request.page + 1,
                    PageSize = request.rows,
                    SortBy = string.IsNullOrEmpty(request.sortField) ? "ost_ID" : request.sortField,
                    SortOrder = sortType,
                    Filters = filters
                };

                string requestUrl = "api/Order/GetOrderShipments";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

                var response = await client.PostAsync(fullUrl, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                var result = JsonConvert.DeserializeObject<OrderShipmentsResponse>(responseBody);

                if (result == null || !result.IsSuccess)
                {
                    return new OrderShipmentsResponse
                    {
                        CurrentPage = result.CurrentPage,
                        Data = new List<OrderShipments>(),
                        IsSuccess = result.IsSuccess,
                        Message = result?.Message ?? "Failed to fetch order shipments.",
                        PageSize = result.PageSize,
                        TotalPages = result.TotalPages,
                        TotalRecords = result.TotalRecords,
                    };
                }

                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        //public async Task ActivityLog(ActivityLog log)
        //{
        //    var sql = @"INSERT INTO Cus_ActivityLog 
        //            (log_name, module_id, sub_module_id, event, subject_id, properties,subject_ref, description, causer_type, created_at, user_name, api_action_type)
        //            VALUES 
        //            (@log_name, @module_id, @sub_module_id, @event, @subject_id, @properties, @subject_ref, @description, @causer_type, GETUTCDATE(), @user_name, @api_action_type)";
        //    await _dataAccess.SaveDataInline(sql, log);
        //}

        public async Task<List<Shipment>> GetShipmentById(int id)
        {
            string shipmentQuery = @"
                SELECT * FROM V_SearchShipment
                WHERE shp_ID = @Id AND shp_LogisticSiteID = 5
                  AND (LanguageID = 1 OR LanguageID IS NULL)
                  AND (LanguageID1 = 1 OR LanguageID1 IS NULL)
            ";

            string shipmentDetailQuery = @"
                SELECT 
                    VSO.OrderShipmentStatus,
                    VSO.ost_Code,
                    ost_ExecuteDate,
                    ost_ShipDate,
                    ost_DeliveryDate,
                    ost_ShipmentID,
                    ost_LoadingPriority,
                    IO.ship_to as Ship_To,
                    IO.customer_code as Customer_Code
                FROM V_SelectOrderShipment VSO
                INNER JOIN LV_Order LO ON LO.ord_ID = VSO.ost_OrderID
                LEFT JOIN Cus_T_ImportedOrders IO ON IO.pick_list_id = VSO.ord_Code
                WHERE VSO.ost_ShipmentID = @Id 
                  AND VSO.LanguageID = 1 AND VSO.LanguageID1 = 1 AND VSO.LanguageID2 = 1 
                  AND (VSO.LanguageID3 = 1 OR VSO.LanguageID3 IS NULL)
                  AND VSO.ors_Code < 65
            ";

            var shipments = (await _dataAccess.GetDataInline<Shipment,dynamic>(shipmentQuery, new { Id = id })).ToList();

            foreach (var shipment in shipments)
            {
                var details = (await _dataAccess.GetDataInline<ShipmentDetail,dynamic>(shipmentDetailQuery, new { Id = id })).ToList();
                shipment.Shipment_Detail = details;
            }

            return shipments;
        }

        public async Task<int> MarkShipmentStatusComplete(List<int>? shipmentIds)
        {
            int updatedCount = 0;

            foreach (var shipmentId in shipmentIds)
            {
                var affected = await _dataAccess.SaveDataInline(
                    "UPDATE LV_Shipment SET shp_StatusID = @StatusID WHERE shp_ID = @ShipmentId",
                    new { StatusID = 8, ShipmentId = shipmentId });

                if (affected > 0)
                    updatedCount++;
            }

            return updatedCount;
        }

        public async Task<int> GetLatestShipmentId(string? trk_id)
        {
            try
            {
                var query = "SELECT trk_ID FROM LV_Truck where trk_ID = @TruckId";
                return await _dataAccess.GetDataReturnInline<int>(query, new { TruckId = trk_id });
            }
            catch (Exception ex)
            {
                throw;
            }
        }
    }
}
