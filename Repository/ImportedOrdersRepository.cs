using System.Data.SqlClient;
using System.Data;
using System.Text;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Data.Common;
using Npgsql;
using static Hangfire.Storage.JobStorageFeatures;
using static iText.IO.Image.Jpeg2000ImageData;


namespace MiddlewareWebAPI.Data.Repository
{
    public class ImportedOrdersRepository : IImportedOrdersRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly string? _connectionString;
        private readonly string? _pgConStr;

        private readonly UrlConstants _urlConstants;
        public ImportedOrdersRepository(ISqlDataAccess dataAccess, IConfiguration configuration, UrlConstants urlConstants )
        {
            _dataAccess = dataAccess;
            _connectionString = configuration.GetConnectionString("con");
            _pgConStr = configuration.GetConnectionString("PostgresConnection");
            _urlConstants = urlConstants;
        }
        public async Task<ImportedOrdersResponse> GetImportedOrdersGrid(ImportedOrdersRequest request)
        {
            var response = new ImportedOrdersResponse();

            string query = @"
                SELECT 
                    io.id,
                    io.pick_list_id,
                    CASE 
                        WHEN mantisCount.totalItem <> sageCount.totalItem 
                        THEN 2 
                        ELSE io.mantis_imported 
                    END AS mantis_imported,
                    io.status,
                    io.created_at,
                    io.updated_at,
                    io.customer_code,
                    io.is_executed,
                    io.invalid_items,
                    io.is_sync,
                    io.sync_at,
                    io.sage_created_at,
                    io.fl_picklist_completed,
                    io.fl_picklist_deleted,
                    io.is_delivery_completed,
                    io.is_location_assigned,
                    io.is_lane_assigned,
                    io.ship_to,
                    io.source,
                    io.api_export,
                    ot.order_type,
                    io.is_exported,
                    io.lv_status,
                    ot.code,
                    ordertasks.total,
                    ordertasks.assigned,
                    ordertasks.completed,
                    io.ReExecute,
                    od.order_details_count,
                    (
                        SELECT COUNT(DISTINCT stc_sscc) 
                        FROM LV_Order o
                        INNER JOIN LV_OrderItem oi ON o.ord_id = oi.ori_orderid
                        INNER JOIN LV_OrderShipItem osi ON oi.ori_id = osi_OrderItemID
                        INNER JOIN LV_OrderShipItemStock oss ON osi.osi_id = oss_OrderShipItemID
                        INNER JOIN lv_stock s ON s.stk_id = oss.oss_StockID
                        INNER JOIN LV_StockContainer sc ON s.stk_ContainerID = sc.stc_id
                        WHERE o.ord_code = io.pick_list_id
                    ) AS total_pallet_info
                FROM Cus_T_ImportedOrders io
                LEFT JOIN (
                    SELECT COUNT(*) AS totalItem, ord_Code
                    FROM LV_OrderItem oi
                    INNER JOIN LV_Order o ON o.ord_id = oi.ori_OrderID
                    GROUP BY ord_Code
                ) AS mantisCount 
                    ON mantisCount.ord_Code = io.pick_list_id
                LEFT JOIN (
                    SELECT COUNT(*) AS totalItem, picklist_id
                    FROM Cus_T_ImportedOrdersDetails iod
                    WHERE iod.mantis_imported <> 4
                      AND EXISTS (
                          SELECT 1 FROM LV_Product p
                          WHERE p.prd_PrimaryCode = iod.item_reference
                      )
                    GROUP BY picklist_id
                ) AS sageCount 
                    ON io.id = sageCount.picklist_id 
                   AND io.mantis_imported = 1
                LEFT JOIN (
                    SELECT 
                        COUNT(oss_TaskID) AS total,
                        COUNT(tsk_ExpUserID) AS assigned,
                        SUM(CASE tsk_StatusID WHEN 3 THEN 1 ELSE 0 END) AS completed,
                        ord_Code
                    FROM V_SearchOrderShipmentTask sst
                    INNER JOIN LV_Task t ON t.tsk_ID = sst.oss_TaskID
                    GROUP BY ord_Code
                ) AS ordertasks
                    ON ordertasks.ord_Code = io.pick_list_id
                LEFT JOIN Cus_OrderType ot 
                  ON ot.id = io.order_type
                LEFT JOIN (
					SELECT pick_list_id, COUNT(*) AS order_details_count 
					FROM Cus_T_ImportedOrdersDetails
					WHERE pick_list_id IS NOT NULL  
					GROUP BY pick_list_id
				) od ON io.pick_list_id = od.pick_list_id
               WHERE 1=1 
            ";

            var countQuery = "SELECT COUNT(io.id) FROM Cus_T_ImportedOrders io WHERE 1 = 1";
            var parameters = new DynamicParameters();
            int paramIndex = 0;
            // Handle Filters
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrEmpty(filter.Key) || filter.Value?.value == null) continue;

                    string key = filter.Key.Trim();
                    key = key.Replace("io.", "");
                    string rawValue = filter.Value.value.ToString().Trim();
                    string paramName = $"@{paramIndex++}";

                    // special cases first
                    if (key.Equals("total", StringComparison.OrdinalIgnoreCase))
                    {
                        query += @" AND EXISTS (
                            SELECT 1 FROM V_SearchOrderShipmentTask ot 
                            WHERE ot.ord_Code = io.pick_list_id 
                            GROUP BY ot.ord_Code 
                            HAVING COUNT(ot.oss_TaskID) = @totalValue
                        )";
                        countQuery += @" AND EXISTS (
                            SELECT 1 FROM V_SearchOrderShipmentTask ot 
                            WHERE ot.ord_Code = io.pick_list_id 
                            GROUP BY ot.ord_Code 
                            HAVING COUNT(ot.oss_TaskID) = @totalValue
                        )";
                        parameters.Add("@totalValue", rawValue);
                        continue;
                    }

                    if (key.Equals("created_at", StringComparison.OrdinalIgnoreCase))
                    {
                        // Convert to date string in format yyyy-MM-dd for comparison
                        query += $" AND CONVERT(VARCHAR(10), io.created_at, 120) LIKE {paramName}";
                        countQuery += $" AND CONVERT(VARCHAR(10), io.created_at, 120) LIKE {paramName}";
                        parameters.Add(paramName, $"%{rawValue}%");
                        continue;
                    }

                    if (key.Equals("assigned", StringComparison.OrdinalIgnoreCase))
                    {
                        query += @" AND EXISTS (
                            SELECT 1 FROM V_SearchOrderShipmentTask ot 
                            INNER JOIN LV_Task t ON t.tsk_ID = ot.oss_TaskID
                            WHERE ot.ord_Code = io.pick_list_id 
                            GROUP BY ot.ord_Code 
                            HAVING COUNT(t.tsk_ExpUserID) = @assignedValue
                        )";
                        countQuery += @" AND EXISTS (
                            SELECT 1 FROM V_SearchOrderShipmentTask ot 
                            INNER JOIN LV_Task t ON t.tsk_ID = ot.oss_TaskID
                            WHERE ot.ord_Code = io.pick_list_id 
                            GROUP BY ot.ord_Code 
                            HAVING COUNT(t.tsk_ExpUserID) = @assignedValue
                        )";
                        parameters.Add("@assignedValue", rawValue);
                        continue;
                    }

                    // mantis_imported special (if you need that behaviour)
                    if (key.Equals("mantis_imported", StringComparison.OrdinalIgnoreCase))
                    {
                        // if user passes 2 => custom logic (your PHP did totalItem <> sageCount.totalItem)
                        if (int.TryParse(rawValue, out int mantisVal) && mantisVal == 2)
                        {
                            query += $" AND io.mantis_imported = {paramName}";
                            countQuery += $" AND io.mantis_imported = {paramName}";
                            parameters.Add(paramName, mantisVal);
                        }
                        else
                        {
                            query += $" AND io.mantis_imported = {paramName}";
                            countQuery += $" AND io.mantis_imported = {paramName}";
                            parameters.Add(paramName, mantisVal);
                        }
                        continue;
                    }

                    if (key.Equals("order_type", StringComparison.OrdinalIgnoreCase) || key.Equals("o.order_type", StringComparison.OrdinalIgnoreCase))
                    {
                        if (int.TryParse(rawValue, out int orderTypeId))
                        {
                            // numeric id match against i.order_type
                            query += $" AND io.order_type = {paramName}";
                            countQuery += $" AND io.order_type = {paramName}";
                            parameters.Add(paramName, orderTypeId);
                        }
                        else
                        {
                            // name match against o.order_type (use LIKE for partial matches)
                            query += $" AND o.order_type LIKE {paramName}";
                            countQuery += $" AND o.order_type LIKE {paramName}";
                            parameters.Add(paramName, $"%{rawValue}%");
                        }
                        continue;
                    }

                    if (key.Equals("lv_status", StringComparison.OrdinalIgnoreCase))
                    {
                        query += $" AND io.lv_status = {paramName}";
                        countQuery += $" AND io.lv_status = {paramName}";
                        parameters.Add(paramName, rawValue);
                        continue;
                    }

                    if (key.Equals("pick_list_id", StringComparison.OrdinalIgnoreCase))
                    {
                        query += $" AND io.pick_list_id LIKE {paramName}";
                        countQuery += $" AND io.pick_list_id LIKE {paramName}";
                        parameters.Add(paramName, $"%{rawValue}%");
                        continue;
                    }
                    else
                    {
                        string columnName = $"io.{key}";
                        query += $" AND {columnName} LIKE {paramName}";
                        countQuery += $" AND {columnName} LIKE {paramName}";
                        parameters.Add(paramName, $"%{rawValue}%");
                    }
                }
            }

            // Handle sorting based on sortOrder and sortField
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                query += $" ORDER BY {request.sortField} {sortOrder}";
            }
            else
            {
                query += " ORDER BY io.id DESC";
            }

            // Pagination
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            var data = await _dataAccess.GetDataInline<ImportedOrderDto, dynamic>(query, parameters);
            var totalRecords = (await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters)).FirstOrDefault();

            bool hasNextPage = (request.first + request.rows) < totalRecords;
            bool hasPrevPage = request.first > 0;

            string? nextCursor = hasNextPage && data.Any() ? GenerateNextCursor(data) : null;
            string? prevCursor = hasPrevPage && data.Any() ? GeneratePrevCursor(data) : null;

            string pathUrl = _urlConstants.ImportedOrdersPathUrl;
            string importedOrdersUrl = _urlConstants.ImportedOrdersCursorUrl;

            string templateUrl = _urlConstants.OrdersTemplateUrl;
            string BulkLoadOrderTemplateUrl = _urlConstants.BulkLoadOrderTemplateUrl;

            return new ImportedOrdersResponse
            {
                Data = data.ToList(),
                Next_cursor = nextCursor,
                Prev_cursor = prevCursor,
                Path = pathUrl,
                Next_page_url = nextCursor != null ? $"{importedOrdersUrl}{nextCursor}" : null,
                Prev_page_url = prevCursor != null ? $"{importedOrdersUrl}{prevCursor}" : null,
                TemplateUrl = templateUrl,
                Per_page = request.rows,
                TotalCount = totalRecords,
                BulkOrderTemplateUrl = BulkLoadOrderTemplateUrl
            };
        }

        private string? GenerateNextCursor(IEnumerable<ImportedOrderDto> data)
        {
            var lastItem = data.LastOrDefault();
            return lastItem != null ? Convert.ToBase64String(Encoding.UTF8.GetBytes($"id={lastItem.id}")) : null;
        }

        private string? GeneratePrevCursor(IEnumerable<ImportedOrderDto> data)
        {
            var firstItem = data.FirstOrDefault();
            return firstItem != null ? Convert.ToBase64String(Encoding.UTF8.GetBytes($"id={firstItem.id}")) : null;
        }

        public async Task<IEnumerable<OrderTypeRequest>> GetOrderTypes()
        {
            var query = "SELECT order_type, id FROM Cus_OrderType";
            var data = await _dataAccess.GetDataInline<OrderTypeRequest, dynamic>(query, new { });
            return data;
        }

        public async Task<IEnumerable<ImportedOrder>> GetImportedOrderDetail(int id)
        {
            string query = "SELECT * FROM Cus_T_ImportedOrders WHERE Id = @id";
            return await _dataAccess.GetDataInline<ImportedOrder, dynamic>(query, new { Id = id });
        }

        public async Task<OrderLinesResponse> GetImportedOrderLinesById(OrderLinesRequest request, int id)
        {
            var queryBuilder = "SELECT * FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId";
            var countQueryBuilder = "SELECT COUNT(id) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId";

            var parameters = new DynamicParameters();
            parameters.Add("@PicklistId", id);

            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        string filterValue = $"%{filter.Value?.value}%";
                        string condition = $" AND {filter.Key} LIKE @{filter.Key}";

                        queryBuilder += condition;
                        countQueryBuilder += condition; // Apply filter to count query as well

                        parameters.Add(filter.Key, filterValue);
                    }
                }
            }

            // Handle sorting based on sortOrder and sortField
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                queryBuilder += $" ORDER BY {request.sortField} {sortOrder}";
            }
            else
            {
                queryBuilder += " ORDER BY Id ASC";
            }

            // Pagination
            queryBuilder += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            // Fetch Data
            var result = await _dataAccess.GetDataInline<OrderLinesDto, dynamic>(queryBuilder.ToString(), parameters);

            // Fetch Total Count
            var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQueryBuilder.ToString(), parameters);

            return new OrderLinesResponse
            {
                Data = result,
                TotalCount = totalCount.FirstOrDefault(),
            };
        }

        public async Task<IEnumerable<PickListOrders>> GetImportedOrderById(int id)
        {
            string query = "SELECT * FROM Cus_T_ImportedOrders WHERE id = @Id";
            return await _dataAccess.GetDataInline<PickListOrders, dynamic>(query.ToString(), new { Id = id });
        }

        public async Task<PickListResponse> PicklistDetailApiCall(PickListOrders order)
        {
            return await Task.FromResult(new PickListResponse { Error = 0, Message = "Picklist synced successfully" });
        }

        public async Task<IEnumerable<ManualOrderCompleteImportedOrder>> GetOrderById(int id)
        {
            string query = "SELECT id, is_exported FROM Cus_T_ImportedOrders WHERE id = @Id";
            return await _dataAccess.GetDataInline<ManualOrderCompleteImportedOrder, dynamic>(query, new { Id = id });
        }

        public async Task<bool> UpdateOrder(ManualOrderCompleteImportedOrder order)
        {
            //string query = "UPDATE Cus_T_ImportedOrders SET is_exported = COALESCE(@IsExported, is_exported) WHERE id = @Id";
            string query = "UPDATE Cus_T_ImportedOrders SET is_exported = 6 WHERE id = @Id";

            var param = new DynamicParameters();
            param.Add("@Id", order.id);
            //param.Add("@IsExported", order.is_exported);

            int rowsAffected = await _dataAccess.SaveDataInline(query, param);
            return rowsAffected > 0;
        }

        public async Task UpdateOrderStatus(int id, string status)
        {
            string query = "UPDATE ImportedOrders SET lv_status = @Status WHERE id = @Id";
            var param = new DynamicParameters();
            param.Add("@Id", id);
            param.Add("@Status", status);

            await _dataAccess.SaveDataInline(query, param);
        }

        public async Task<bool> CheckOrderStatus(string pick_list_id)
        {
            string query = @"SELECT COUNT(*) FROM LV_order 
                     WHERE ord_code = @PickListId AND ord_StatusID = 3";
            var param = new DynamicParameters();
            param.Add("@PickListId", pick_list_id);

            // FIX: Use correct data retrieval method
            var result = await _dataAccess.GetDataInline<int, dynamic>(query, param);
            return result.FirstOrDefault() > 0;
        }

        public async Task<int> GetTotalOrderCount(string pick_list_id)
        {
            string query = @"SELECT COUNT(*) FROM LV_order a
                     INNER JOIN LV_ordershipment b ON a.ord_id = b.ost_OrderID
                     INNER JOIN LV_ordershipitem c ON b.ost_ID = c.osi_OrderShipmentID
                     WHERE a.ord_code = @PickListId";

            var result = await _dataAccess.GetDataInline<int, dynamic>(query, new { PickListId = pick_list_id });
            return result.FirstOrDefault();
        }

        public async Task<int> GetActualOrderCount(string pick_list_id)
        {
            string query = @"SELECT COUNT(*) FROM LV_order a
                     INNER JOIN LV_ordershipment b ON a.ord_id = b.ost_OrderID
                     INNER JOIN LV_ordershipitem c ON b.ost_ID = c.osi_OrderShipmentID
                     WHERE a.ord_code = @PickListId AND c.osi_StatusID IN (4,10,11)";

            var result = await _dataAccess.GetDataInline<int, dynamic>(query, new { PickListId = pick_list_id });
            return result.FirstOrDefault();
        }

        public async Task<int> GetEmptyLpnCount(string orderCode)
        {
            string query = "SELECT COUNT(*) FROM Cus_T_OrderShipLocations WHERE order_code = @OrderCode AND lpn IS NULL";
            return (await _dataAccess.GetDataInline<int, dynamic>(query, new { OrderCode = orderCode })).FirstOrDefault();
        }

        public async Task<bool> DeleteOrderShipLocations(string order_code)
        {
            string query = "DELETE FROM Cus_T_OrderShipLocations WHERE order_code = @OrderCode";
            int rowsAffected = await _dataAccess.SaveDataInline(query, new { OrderCode = order_code });
            return rowsAffected > 0;
        }

        public async Task<bool> UpdateOrderLocationStatus(int orderId)
        {
            string query = "UPDATE Cus_T_ImportedOrders SET is_location_assigned = 3 WHERE id = @OrderId";
            int rowsAffected = await _dataAccess.SaveDataInline(query, new { OrderId = orderId });
            return rowsAffected > 0;
        }

        public async Task UpdateOrderType(int id, int order_type)
        {
            string query = "UPDATE Cus_T_ImportedOrders SET order_type = @OrderType WHERE id = @Id";
            var param = new DynamicParameters();
            param.Add("@Id", id);
            param.Add("@OrderType", order_type);

            await _dataAccess.SaveDataInline(query, param);

        }

        public async Task<int> GetOrderPalletsCount(string pick_list_id)
        {
            string query = "SELECT COUNT(*) FROM CUS_V_LPNShipmentDetails WHERE Order_Number = @pick_list_id";
            var param = new DynamicParameters();
            param.Add("@pick_list_id", pick_list_id);

            var result = await _dataAccess.GetDataInline<int, dynamic>(query, param);
            return result.FirstOrDefault();
        }

        public async Task<AssignOrdersResponse> AssignOrdersToUserLoc(AssignOrdersRequest request)
        {
            try
            {
                if (request?.orders == null || !request.orders.Any())
                {
                    return new AssignOrdersResponse { Error = 1, Message = "No orders provided" };
                }

                var pickListIds = request.orders.Select(o => o.pick_list_id).ToList();

                string ssccCondition = request?.uom == "cs"
                    ? "tsk_SSCC IS NULL"
                    : "tsk_SSCC IS NOT NULL";

                var updateQuery = $@"
                    DECLARE @LocationId INT, @LocationCode NVARCHAR(250);

                    SELECT TOP 1 
                        @LocationId = loc_ID,  
                        @LocationCode = loc_code 
                    FROM lv_location
                    WHERE loc_code = (
                        SELECT CONCAT('TUL-', usr_Login) 
                        FROM lv_users
                        JOIN com_employee ON usr_personid = emp_personid
                        WHERE emp_id = @UserId
                    );

                    UPDATE LV_Task
                    SET 
                        tsk_ExpUserID = @UserId,
                        tsk_ToLocationCode = @LocationCode,
                        tsk_ToLocationID = @LocationId
                    FROM LV_Task
                    JOIN CUS_V_ParamsForOrdCod2 ON tsk_id = oss_TaskID
                    WHERE ord_Code IN @PickListIds
                      AND {ssccCondition}
                      AND tsk_StatusID = 1;
                ";

                await _dataAccess.SaveDataInline(updateQuery, new
                {
                    UserId = request.user,
                    PickListIds = pickListIds
                });

                return new AssignOrdersResponse
                {
                    Error = 0,
                    Message = "Order Assigned Successfully"
                };
            }
            catch (Exception ex)
            {
                return new AssignOrdersResponse
                {
                    Error = 1,
                    Message = "Internal Server Error | " + ex.Message
                };
            }
        }

        private async Task<bool> AssignLocation(AssignOrderLinesRequest? request, List<string> loc_array, List<OrderLines> orderLines)
        {
            if (loc_array == null || loc_array.Count == 0)
            {
                string insertSql = @"
                    INSERT INTO Cus_T_OrderShipLocations (order_code, sku, assigned_shiploc, location_level_identifier)
                    VALUES (@PickListId, @Sku, @AssignedShipLoc, @LocationLevelIdentifier)
                ";

                await _dataAccess.SaveDataInline(insertSql, new
                {
                    PickListId = request?.pick_list_id,
                    Sku = (string?)null,
                    AssignedShipLoc = (string?)null,
                    LocationLevelIdentifier = (string?)null
                });

                // Optionally, mark all order lines as location assigned
                foreach (var ol in orderLines)
                {
                    string updateDetailSql = "UPDATE Cus_T_ImportedOrdersDetails SET is_location_assigned = 1 WHERE id = @Id";
                    await _dataAccess.SaveDataInline(updateDetailSql, new { Id = ol.id });
                }
            }
            else
            {
                for (int i = 0; i < loc_array.Count; i++)
                {
                    string? location = loc_array[i];
                    var shipmentSku = (i < orderLines.Count) ? orderLines[i].item_reference : null;
                    var orderLineId = (i < orderLines.Count) ? orderLines[i].id : (int?)null;

                    if (!string.IsNullOrEmpty(shipmentSku) && !string.IsNullOrEmpty(location))
                    {
                        string insertSql = @"
                            IF NOT EXISTS (
                                SELECT 1 
                                FROM Cus_T_OrderShipLocations 
                                WHERE order_code = @PickListId
                                  AND sku = @Sku
                                  AND assigned_shiploc = @AssignedShipLoc
                                  AND location_level_identifier = @LocationLevelIdentifier
                            )
                            BEGIN
                                INSERT INTO Cus_T_OrderShipLocations (order_code, sku, assigned_shiploc, location_level_identifier)
                                VALUES (@PickListId, @Sku, @AssignedShipLoc, @LocationLevelIdentifier)
                            END
                        ";

                        await _dataAccess.SaveDataInline(insertSql, new
                        {
                            PickListId = request?.pick_list_id,
                            Sku = shipmentSku,
                            AssignedShipLoc = location.Split("||")[0],
                            LocationLevelIdentifier = location
                        });
                    }

                    if (orderLineId.HasValue)
                    {
                        string updateDetailSql = "UPDATE Cus_T_ImportedOrdersDetails SET is_location_assigned = 1 WHERE id = @Id";
                        await _dataAccess.SaveDataInline(updateDetailSql, new { Id = orderLineId.Value });
                    }
                }
            }

            int isLocationAssigned = 1;

            if (request?.assigned_type == 2)
            {
                string countSql = @"
                    SELECT COUNT(*) 
                    FROM Cus_T_ImportedOrdersDetails 
                    WHERE picklist_id = @OrderId AND is_location_assigned = 0";

                int notAssignedCount = await _dataAccess.SaveDataReturnInline<int>(countSql, new { OrderId = request.id });

                if (notAssignedCount > 0)
                {
                    isLocationAssigned = 2;
                }
            }

            string updateOrderSql = @"
                UPDATE Cus_T_ImportedOrders
                SET is_location_assigned = @IsAssigned
                WHERE id = @OrderId";

            await _dataAccess.SaveDataInline(updateOrderSql, new
            {
                IsAssigned = isLocationAssigned,
                OrderId = request.id
            });

            return true;
        }

        private async Task<List<string>> AppendVirtualLocationsIfNeeded(List<string> locArray, int orderLineCount, string orderType, string? customerCode = null)
        {
            // Only append virtual locations if locArray count is less than order lines
            if (locArray.Count < orderLineCount)
            {
                int remainingLocCount = orderLineCount - locArray.Count;

                string sql = @"
                     SELECT TOP 1 CONCAT(a.loc_Code, '||s') AS Id
                     FROM lv_location a
                     INNER JOIN Cus_T_ship_loc_info b ON a.loc_Code = b.Code
                     WHERE b.shipment_type = @OrderType
                      AND b.limited_capacity = 0;        
                 ";
                /**where_clause**/
                //AND a.limited_capacity = 0 

                string whereClause = "";
                var parameters = new DynamicParameters();
                parameters.Add("@OrderType", orderType);

                if (orderType == "I" && !string.IsNullOrEmpty(customerCode))
                {
                    whereClause = "AND b.customer_code = @CustomerCode";
                    parameters.Add("@CustomerCode", customerCode);
                }

                sql = sql.Replace("/**where_clause**/", whereClause);

                var virtualLocation = await _dataAccess.GetDataInline<VirtualLocationDto, DynamicParameters>(sql, parameters);
                var virtualLocId = virtualLocation.FirstOrDefault()?.Id;

                if (!string.IsNullOrEmpty(virtualLocId))
                {
                    var locArrayRem = Enumerable.Repeat(virtualLocId, remainingLocCount).ToList();
                    locArray.AddRange(locArrayRem);
                }
            }

            return locArray;
        }

        private async Task<List<string>> GetLocations(AssignOrderLinesRequest? request, string sqlQuery)
        {
            var parameters = new
            {
                OrderType = request?.order_type,
                CustomerCode = request?.customer
            };

            var data = (await _dataAccess.GetDataInline<LocationDto, dynamic>(sqlQuery, parameters)).ToList();

            int locId = 0;
            int incLocId = 0;
            int prevLocId = 0;

            string? deep = "";
            string? prevDeep = "";

            string? sectorCode = "";
            string? prevSectorCode = "";

            var locArray = new List<string>();
            int noOfPallets = 0;

            foreach (var location in data)
            {
                locId = location.loc_ID;
                var deepParts = location.id.Split("||");
                deep = deepParts.Length > 1 ? deepParts[1] : "";
                sectorCode = location.loc_SectorCode;

                if (incLocId == 0)
                {
                    if (deep != "d")
                    {
                        incLocId = locId + 1;
                        prevLocId = locId;
                        prevSectorCode = sectorCode;
                        prevDeep = deep;

                        locArray.Add(location.id);
                    }
                }
                else
                {
                    if (locId == incLocId && sectorCode == prevSectorCode)
                    {
                        incLocId = locId + 1;
                        prevLocId = locId;
                        prevSectorCode = sectorCode;
                        prevDeep = deep;

                        locArray.Add(location.id);
                    }
                    else if (locId == prevLocId && sectorCode == prevSectorCode && deep != prevDeep)
                    {
                        incLocId = locId + 1;
                        prevLocId = locId;
                        prevSectorCode = sectorCode;
                        prevDeep = deep;

                        locArray.Add(location.id);
                    }
                    else
                    {
                        if (deep != "d")
                        {
                            incLocId = locId + 1;
                            prevLocId = locId;
                            prevSectorCode = sectorCode;
                            prevDeep = deep;

                            locArray.Add(location.id);
                        }
                        else
                        {
                            incLocId = 0;
                            locArray.Clear();
                        }
                    }
                }

                if (locArray.Count == noOfPallets)
                {
                    break;
                }
            }

            return locArray;
        }

        public async Task<ResponseDto> DeleteOrders(List<int> orderIds)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                string deleteOrdersQuery = "DELETE FROM Cus_T_ImportedOrders WHERE id IN @OrderIds;";
                int deletedCount = await connection.ExecuteAsync(deleteOrdersQuery, new { OrderIds = orderIds }, transaction: transaction);

                if (deletedCount > 0)
                {
                    string deleteOrderDetailsQuery = "DELETE FROM Cus_T_ImportedOrdersDetails WHERE picklist_id IN @OrderIds;";
                    await connection.ExecuteAsync(deleteOrderDetailsQuery, new { OrderIds = orderIds }, transaction: transaction);

                    transaction.Commit();
                    return new ResponseDto { Error = 0, Message = "Order deleted successfully." };
                }
                else
                {
                    transaction.Rollback();
                    return new ResponseDto { Error = 1, Message = "No orders were deleted." };
                }
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                return new ResponseDto { Error = 1, Message = $"Error deleting order(s) | {ex.Message}" };
            }
        }

        public async Task<int> GetAllOrderPalletsCount(List<string> pickListIds)
        {
            if (pickListIds == null || !pickListIds.Any())
            {
                return 0;
            }

            var query = $@"SELECT COUNT(*) as count 
                   FROM CUS_V_LPNShipmentDetails 
                   WHERE Order_Number IN ({string.Join(",", pickListIds.Select(id => $"'{id}'"))})";

            var result = await _dataAccess.GetDataInline<int, dynamic>(query, new { });

            return result.FirstOrDefault();
        }

        public async Task<ResponseResult> AssignLanes(AssignLanesRequest request)
        {
            try
            {
                var lanes = (await _dataAccess.GetDataInline<LaneSlot, dynamic>(
                    "SELECT lane, slot FROM Cus_LaneSlots WHERE lane IN @Lanes AND is_available = 1",
                    new { request.Lanes }
                )).ToList();

                int counter = 0;

                foreach (var order in request?.Order)
                {
                    int wrappedLpnCheck = await _dataAccess.SaveDataReturnInline<int>(
                        "SELECT COUNT(id) FROM Cus_T_OrderShipLocations WHERE order_code = @OrderCode AND wrapped_lpn IS NULL",
                        new { OrderCode = order.pick_list_id }
                    );

                    if (wrappedLpnCheck == 0)
                    {
                        var pallets = (await _dataAccess.GetDataInline<OrderShipLocation, dynamic>(
                            "SELECT order_code, assigned_shiploc, lpn FROM Cus_T_OrderShipLocations WHERE order_code = @OrderCode",
                            new { OrderCode = order.pick_list_id }
                        )).ToList();

                        foreach (var pallet in pallets)
                        {
                            if (counter >= lanes.Count)
                            {
                                return new ResponseResult
                                {
                                    Error = 1,
                                    Message = "Not enough available lanes."
                                };
                            }

                            var lane = lanes[counter];

                            await _dataAccess.SaveDataInline(
                                "INSERT INTO Cus_T_OrderLaneAssignment (lane, slot, order_code, ship_to, lpn) VALUES (@Lane, @Slot, @OrderCode, @ShipTo, @Lpn)",
                                new
                                {
                                    Lane = lane.lane,
                                    Slot = lane.slot,
                                    OrderCode = pallet.order_code,
                                    ShipTo = pallet.assigned_shiploc,
                                    Lpn = pallet.lpn
                                }
                            );

                            await _dataAccess.SaveDataInline(
                                "UPDATE Cus_LaneSlots SET is_available = 0 WHERE lane = @Lane AND slot = @Slot",
                                new { Lane = lane.lane, Slot = lane.slot }
                            );

                            await _dataAccess.SaveDataInline(
                                "UPDATE Cus_T_ImportedOrders SET is_lane_assigned = 1 WHERE pick_list_id = @OrderCode",
                                new { OrderCode = pallet.order_code }
                            );

                            counter++;
                        }
                    }
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Lanes Assigned Successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Database Error: " + ex.Message
                };
            }
        }

        public async Task<IEnumerable<LoadOrders>> GetOrderByPickListId(string? pick_list_id)
        {
            string query = "SELECT id, pick_list_id, lv_status FROM Cus_T_ImportedOrders WHERE pick_list_id = @PickListId";
            return await _dataAccess.GetDataInline<LoadOrders, dynamic>(query, new { PickListId = pick_list_id });
        }

        public async Task UpdateLoadOrders(LoadOrders order)
        {
            string query = "UPDATE Cus_T_ImportedOrders SET lv_status = @LvStatus WHERE id = @Id";
            await _dataAccess.SaveDataInline(query, new { LvStatus = order.lv_status, Id = order.id });
        }

        public async Task<int?> GetOrderIdFromPickList(string? pick_list_id)
        {
            string query = @"SELECT TOP(1) b.ord_id AS id 
                        FROM Cus_T_ImportedOrdersDetails a
                        INNER JOIN LV_Order b ON a.pick_list_id = b.ord_Code
                        WHERE a.pick_list_id = @PickListId";

            return await _dataAccess.GetDataReturnInline<int?>(query, new { PickListId = pick_list_id });
        }

        public async Task UpdateLaneStatus(string? pick_list_id)
        {
            string deleteQuery = "DELETE FROM Cus_T_OrderLaneAssignment WHERE order_code = @PickListId";
            string updateLaneQuery = "UPDATE Cus_LaneSlots SET is_available = 1 WHERE lane IN (SELECT lane FROM OrderLaneAssignment WHERE order_code = @PickListId)";
            string updateImportedOrdersQuery = "UPDATE Cus_T_ImportedOrders SET is_lane_assigned = 1 WHERE pick_list_id = @PickListId";
            string closeOrderQuery = "UPDATE Cus_T_ImportedOrders SET lv_status = 'Closed' WHERE pick_list_id = @PickListId";

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                await connection.ExecuteAsync(deleteQuery, new { PickListId = pick_list_id }, transaction);
                await connection.ExecuteAsync(updateLaneQuery, new { PickListId = pick_list_id }, transaction);
                await connection.ExecuteAsync(updateImportedOrdersQuery, new { PickListId = pick_list_id }, transaction);
                await connection.ExecuteAsync(closeOrderQuery, new { PickListId = pick_list_id }, transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task UpdateReExecuteStatus(int orderId)
        {
            string query = "UPDATE Cus_T_ImportedOrders SET ReExecute = @ReExecute WHERE Id = @Id";
            await _dataAccess.SaveDataInline(query, new { ReExecute = 1, Id = orderId });
        }

        public async Task ExecuteUpdateMissingOrderLines(string pick_list_id)
        {
            var query = "EXEC CUS_SP_UpdateMissingOrderLines @PickListId";
            await _dataAccess.SaveDataInline(query, new { PickListId = pick_list_id });
        }

        public async Task UpdateReExecuteStatus(List<int> orderIds)
        {
            var query = "UPDATE Cus_T_ImportedOrders SET ReExecute = 0 WHERE Id IN @OrderIds";
            await _dataAccess.SaveDataInline(query, new { OrderIds = orderIds });
        }

        public async Task<ResponseResult> ArchiveCompletedOrders()
        {
            try
            {
                await _dataAccess.SaveData("CUS_SP_Update_ImportedOrders_History", new { });

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Completed orders have been successfully archived."
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Error while Appending & Re-executing order | " + ex.Message
                };
            }
        }

        public async Task<OrderTaskResponse> GetOrderTasks(OrderTaskRequest request)
        {
            var filters = request.Filters ?? new();
            var sortField = string.IsNullOrEmpty(request.sortField) ? "" : request.sortField;
            var sortOrder = request.sortOrder == "1" ? "ASC" :
                            request.sortOrder == "-1" ? "DESC" : "";

            // BASE QUERY
            var baseQuery = @"
                SELECT
                    ord.ord_ID,
                    ord.ord_Code,
                    task.tsk_FromLocationCode,
                    task.tsk_ToLocationCode,
                    COUNT(task.tsk_ID) AS Total_Tasks,
                    task.ComboDescription,
                    task.tsk_SSCC,
                    task.ProductShortDescription,
                    task.tsk_FinalLocationCode,
                    task.ExpUser AS Assigned_User,
                    SUM(task.tsk_Quantity) AS Total_Qty,
                    progress.pst_MessageCode AS Task_Status,
                    task.ActualUser AS Executed_User,
                    loc.loc_SectorCode
                FROM LV_Order AS ord
                LEFT JOIN V_SearchOrderShipmentTask AS task_ship ON task_ship.ord_Code = ord.ord_Code
                LEFT JOIN V_TaskSearch AS task ON task.tsk_ID = task_ship.oss_TaskID
                LEFT JOIN LV_ProgressStatus AS progress ON task.tsk_StatusID = progress.pst_ID
                LEFT JOIN LV_Users AS user_details ON task.tsk_ExpUserID = user_details.usr_ID
                LEFT JOIN LV_Location AS loc ON task.tsk_FromLocationID = loc.loc_ID
                WHERE ord.ord_Code = @Code 
                  AND LanguageID = 1 AND LanguageID1 = 1
                  AND (LanguageID2 = 1 OR LanguageID2 IS NULL)
                  AND (LanguageID3 = 1 OR LanguageID3 IS NULL)
                  AND (LanguageID4 = 1 OR LanguageID4 IS NULL)
                  AND (LanguageID5 = 1 OR LanguageID5 IS NULL)
                  AND (LanguageID6 = 1 OR LanguageID6 IS NULL)
            ";

            var parameters = new DynamicParameters();
            parameters.Add("@Code", request.Code);

            // FILTERS
            foreach (var filter in filters)
            {
                if (!string.IsNullOrEmpty(filter.Value?.value))
                {
                    var col = filter.Key switch
                    {
                        "task_status" => "progress.pst_MessageCode",
                        "assigned_user" => "task.ExpUser",
                        "executed_user" => "task.ActualUser",
                        "loc_SectorCode" => "loc.loc_SectorCode",
                        _ => filter.Key
                    };

                    if (filter.Key == "loc_SectorCode")
                    {
                        baseQuery += $" AND {col} IN @SectorCodes";
                        parameters.Add("@SectorCodes", filter.Value.value.Split(","));
                    }
                    else
                    {
                        baseQuery += $" AND {col} LIKE @{filter.Key}";
                        parameters.Add("@" + filter.Key, $"%{filter.Value.value}%");
                    }
                }
            }

            // GROUP BY
            baseQuery += @"
                GROUP BY
                    task.tsk_FinalLocationCode,
                    task.ComboDescription,
                    task.ExpUser,
                    task.tsk_SSCC,
                    task.tsk_FromLocationCode,
                    ord.ord_ID,
                    ord.ord_Code,
                    progress.pst_MessageCode,
                    task.tsk_ToLocationCode,
                    task.ActualUser,
                    task.ProductShortDescription,
                    loc.loc_SectorCode
            ";

            //  THE MAIN FIX → MATCH PHP ORDERING
            string phpOrder = @"
                ORDER BY 
                    loc.loc_SectorCode ASC,
                    task.tsk_FromLocationCode ASC,
                    ord.ord_ID ASC
            ";

            // APPLY ORDERING (ignore UI sorting)
            var dataQuery = $"{baseQuery} {phpOrder} OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY";

            var countQuery = $"SELECT COUNT(*) FROM ({baseQuery}) AS CountTable";

            parameters.Add("@Skip", request.first);
            parameters.Add("@Take", request.Rows);

            var data = await _dataAccess.GetDataInline<OrderTask, dynamic>(dataQuery, parameters);
            var total = await _dataAccess.SaveDataReturnInline<int>(countQuery, parameters);

            return new OrderTaskResponse
            {
                Data = data,
                TotalRecords = total
            };
        }

        public async Task<(int StatusCode, object Response)> UploadedOrders(List<ImportedOrderDetail> orders)
        {
            var ExcelJson = JsonConvert.SerializeObject(orders);
            var parameters = new DynamicParameters();
            parameters.Add("@ExcelJson", ExcelJson);
            parameters.Add("@RetResult", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);
            parameters.Add("@RetError", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);

            try
            {
                await _dataAccess.SaveData("[dbo].[Cus_Sp_ImportOrdersFromExcelJson_v1]", parameters);
                string result = parameters.Get<string>("@RetResult");
                string error = parameters.Get<string>("@RetError");

                if (!string.IsNullOrWhiteSpace(error))
                {
                    return (400, new { error = 1, message = error });
                }

                return (200, new { error = 0, message = result });
            }
            catch (Exception ex)
            {
                return (500, new { error = 1, message = "Internal error while uploading: " + ex.Message });
            }
        }

        public async Task<ImportedOrder> GetLastImportedOrder(string source)
        {
            var sql = @"
                SELECT * 
                FROM Cus_T_ImportedOrders 
                WHERE Source = @source 
                ORDER BY Id DESC
            ";
            return (await _dataAccess.GetFirstDataInline<ImportedOrder, dynamic>(sql, new { Source = source })).FirstOrDefault();
        }

        //public async Task ActivityLog(ActivityLog log)
        //{
        //    try
        //    {
        //        var sql = @"INSERT INTO Cus_ActivityLog 
        //                (log_name, module_id, sub_module_id, event, subject_id, properties,subject_ref, description, causer_type, created_at, user_name, api_action_type)
        //                VALUES 
        //                (@log_name, @module_id, @sub_module_id, @event, @subject_id, @properties, @subject_ref, @description, @causer_type, @created_at, @user_name,@api_action_type)";
        //        await _dataAccess.SaveDataInline(sql, log);
        //    }
        //    catch (Exception)
        //    {
        //        throw;
        //    }
        //}


        public async Task<IEnumerable<ImportedOrder>> GetByPickListId(string pickListId)
        {
            var sql = "SELECT * FROM Cus_T_ImportedOrders WHERE pick_list_id = @PickListId";
            return await _dataAccess.GetFirstDataInline<ImportedOrder, dynamic>(sql, new { PickListId = pickListId });
        }

        public async Task<ImportedOrder> CreatedOrder(ImportedOrder order)
        {
            try
            {
                var sql = @"INSERT INTO Cus_T_ImportedOrders (
                    pick_list_id, customer_code, status, created_at, updated_at, mantis_imported, is_executed,
                    invalid_items, fl_picklist_completed, fl_picklist_deleted, is_delivery_completed, is_location_assigned,
                    is_lane_assigned, ship_to, is_sync, sync_at, source, api_export, sage_created_at,
                    is_exported, lv_status, order_type, ReExecute
                ) 
                OUTPUT INSERTED.Id, INSERTED.created_at, INSERTED.updated_at   
                VALUES (
                    @pick_list_id,
                    @customer_code,
                    @status,
                    SYSUTCDATETIME(),
                    SYSUTCDATETIME(),
                    0,
                    @is_executed,
                    @invalid_items,
                    @fl_picklist_completed,
                    @fl_picklist_deleted,
                    @is_delivery_completed,
                    @is_location_assigned,
                    @is_lane_assigned,
                    @ship_to,
                    0,               -- is_sync 
                    @sync_at,       -- sync_at
                    @source,
                    @api_export,
                    @sage_created_at,
                    @is_exported,
                    'Pending',
                    1,
                    @ReExecute
                );";

                var result = await _dataAccess.QuerySingleAsync<ImportedOrder>(sql, order);
                return result;

            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<IEnumerable<ImportedOrder>> GetUnsyncedOrdersFromX3(int limit)
        {
            string sql = @"SELECT TOP(@Limit) * 
                   FROM Cus_T_ImportedOrders 
                   WHERE is_sync = 0 AND source = 'x3'";
            return await _dataAccess.GetDataInline<ImportedOrder, dynamic>(sql, new { Limit = limit });
        }
        public async Task<IEnumerable<ImportedOrder>> picklistorderdetails(int limit)
        {
            string sql = @"SELECT TOP(@Limit) * 
                   FROM Cus_T_ImportedOrders 
                   WHERE is_sync = 0 AND source = 'x3'";
            return await _dataAccess.GetDataInline<ImportedOrder, dynamic>(sql, new { Limit = limit });
        }
        public async Task<IEnumerable<SkuConversionDto>> GetSkuConversionAsync(string skuX3)
        {
            var sql = "SELECT * FROM Cus_SageX3ToMantisConverion WHERE sku_x3 = @SkuX3";
            return await _dataAccess.GetFirstDataInline<SkuConversionDto, dynamic>(sql, new { SkuX3 = skuX3 });
        }

        public async Task<IEnumerable<ProductDto>> GetProductBySkuAsync(string skuMantis)
        {
            var sql = "SELECT * FROM LV_Product WHERE prd_PrimaryCode = @Sku";
            return await _dataAccess.GetFirstDataInline<ProductDto, dynamic>(sql, new { Sku = skuMantis });
        }

        public async Task<List<OrderLinesDto>> GetPickListDetailsAsync(int pickListId)
        {
            string sql = "SELECT * FROM Cus_T_ImportedOrdersDetails WHERE pick_list_id = @pickListId";
            return (await _dataAccess.GetDataInline<OrderLinesDto, dynamic>(sql, new { pickListId })).ToList();
        }

        public async Task UpsertPickListDetailsAsync(List<OrderLinesDto> details)
        {
            // Use MERGE or custom UPSERT logic per record
            foreach (var d in details)
            {
                await _dataAccess.SaveDataInline(@"MERGE Cus_T_ImportedOrdersDetails AS target
                USING (
                    SELECT 
                        @picklist_id AS picklist_id,
                        @pick_list_id AS pick_list_id,
                        @order_code AS order_code,
                        @order_type AS order_type,
                        @item_no AS item_no,
                        @item_reference AS item_reference,
                        @item_description AS item_description,
                        @qty AS qty,
                        @uom AS uom,
                        @create_datetime AS create_datetime,
                        @bpcord AS bpcord,
                        @dlvdat AS dlvdat,
                        @shidat AS shidat,
                        @mantis_imported AS mantis_imported,
                        @site AS site,
                        @lot_detail AS lot_detail,
                        @ship_to AS ship_to,
                        @customer_code AS customer_code,
                        @is_valid_item AS is_valid_item,
                        @input_sku AS input_sku,
                        @input_uom AS input_uom,
                        @input_qty AS input_qty,
                        @is_kit_item AS is_kit_item,
                        @status AS status,
                        @kit_flag AS kit_flag,
                        @line_type AS line_type,
                        @stock_manage AS stock_manage,
                        @is_ship_item AS is_ship_item,
                        @fl_delivery_sent AS fl_delivery_sent, -- not in use
                        @fl_picklist_deleted AS fl_picklist_deleted,
                        @serial_manage AS serial_manage,
                        @pick_list_line AS pick_list_line,
                        @ship_method AS ship_method,
                        @can_export AS can_export,
                        @is_exported AS is_exported,
                        @is_location_assigned AS is_location_assigned
                ) AS source
                ON (
                    target.pick_list_id = source.pick_list_id AND 
                    target.order_code = source.order_code AND 
                    target.item_reference = source.item_reference AND 
                    target.item_no = source.item_no
                )
                WHEN MATCHED THEN 
                    UPDATE SET 
                        picklist_id = source.picklist_id,
                        order_type = source.order_type,
                        item_description = source.item_description,
                        qty = source.qty,
                        uom = source.uom,
                        create_datetime = source.create_datetime,
                        bpcord = source.bpcord,
                        dlvdat = source.dlvdat,
                        shidat = source.shidat,
                        mantis_imported = source.mantis_imported,
                        site = source.site,
                        lot_detail = source.lot_detail,
                        ship_to = source.ship_to,
                        customer_code = source.customer_code,
                        is_valid_item = source.is_valid_item,
                        input_sku = source.input_sku,
                        input_uom = source.input_uom,
                        input_qty = source.input_qty,
                        is_kit_item = source.is_kit_item,
                        status = source.status,
                        kit_flag = source.kit_flag,
                        line_type = source.line_type,
                        stock_manage = source.stock_manage,
                        is_ship_item = source.is_ship_item,
                        fl_delivery_sent = source.fl_delivery_sent,
                        fl_picklist_deleted = source.fl_picklist_deleted,
                        serial_manage = source.serial_manage,
                        pick_list_line = source.pick_list_line,
                        ship_method = source.ship_method,
                        can_export = source.can_export,
                        is_exported = source.is_exported,
                        is_location_assigned = source.is_location_assigned
                WHEN NOT MATCHED THEN 
                    INSERT (
                        picklist_id,
                        pick_list_id,
                        order_code,
                        order_type,
                        item_no,
                        item_reference,
                        item_description,
                        qty,
                        uom,
                        create_datetime,
                        bpcord,
                        dlvdat,
                        shidat,
                        mantis_imported,
                        site,
                        lot_detail,
                        ship_to,
                        customer_code,
                        is_valid_item,
                        input_sku,
                        input_uom,
                        input_qty,
                        is_kit_item,
                        status,
                        kit_flag,
                        line_type,
                        stock_manage,
                        is_ship_item,
                        fl_delivery_sent,
                        fl_picklist_deleted,
                        serial_manage,
                        pick_list_line,
                        ship_method,
                        can_export,
                        is_exported,
                        is_location_assigned
                    )
                    VALUES (
                        source.picklist_id,
                        source.pick_list_id,
                        source.order_code,
                        source.order_type,
                        source.item_no,
                        source.item_reference,
                        source.item_description,
                        source.qty,
                        source.uom,
                        source.create_datetime,
                        source.bpcord,
                        source.dlvdat,
                        source.shidat,
                        source.mantis_imported,
                        source.site,
                        source.lot_detail,
                        source.ship_to,
                        source.customer_code,
                        source.is_valid_item,
                        source.input_sku,
                        source.input_uom,
                        source.input_qty,
                        source.is_kit_item,
                        source.status,
                        source.kit_flag,
                        source.line_type,
                        source.stock_manage,
                        source.is_ship_item,
                        source.fl_delivery_sent,
                        source.fl_picklist_deleted,
                        source.serial_manage,
                        source.pick_list_line,
                        source.ship_method,
                        source.can_export,
                        source.is_exported,
                        source.is_location_assigned
                    );", d);

            }
        }

        public async Task UpdateMantisImportedFlagAsync(string pickListId)
        {
            string sql = "UPDATE Cus_T_ImportedOrdersDetails SET mantis_imported = 0 WHERE pick_list_id = @pickListId";
            await _dataAccess.SaveDataInline(sql, new { pickListId });
        }

        public async Task UpdateCreatorEmail(string pickListId, string? creatorEmail)
        {
            var query = @"
                UPDATE Cus_T_ImportedOrders
                SET creator_email = @creator_email
                WHERE pick_list_id = @pick_list_id
            ";

            await _dataAccess.SaveDataInline(query, new
            {
                pick_list_id = pickListId,
                creator_email = creatorEmail
            });
        }

        public async Task<ImportedOrderDto> GetPickListByIdAsync(string pickListId)
        {
            string sql = "SELECT * FROM Cus_T_ImportedOrders WHERE pick_list_id = @pickListId";
            return (await _dataAccess.GetFirstDataInline<ImportedOrderDto, dynamic>(sql, new { pickListId })).FirstOrDefault();
        }

        public async Task UpdatePickListAsync(ImportedOrderDto pickList)
        {
            string sql = @"UPDATE Cus_T_ImportedOrders SET
                        is_sync = @is_sync,
                        invalid_items = @invalid_items,
                        sync_at = @sync_at,
                        status = @status,
                        customer_code = @customer_code,
                        ship_to = @ship_to,
                        api_export = @api_export,
                        is_exported = @is_exported
                       WHERE id = @Id";
            await _dataAccess.SaveDataInline(sql, pickList);
        }

        public async Task<bool> HasUnexportedLinesAsync(int pickListId)
        {
            string sql = "SELECT COUNT(1) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @pickListId AND is_exported = 0";
            int count = await _dataAccess.SaveDataReturnInline<int>(sql, new { pickListId });
            return count > 0;
        }

        public async Task<IEnumerable<ImportedOrder>> GetImportedOrderByIdAsync(int id)
        {
            string sql = "SELECT * FROM Cus_T_ImportedOrders WHERE Id IN (@Id)";
            return await _dataAccess.GetFirstDataInline<ImportedOrder, dynamic>(sql, new { Id = id });
        }
        public async Task<IEnumerable<ImportedOrder>> GetImportedOrderByIdAsync(string id)
        {
            string sql = "SELECT * FROM Cus_T_ImportedOrders WHERE pick_list_id = @Id";
            return await _dataAccess.GetFirstDataInline<ImportedOrder, dynamic>(sql, new { Id = id });
        }
        public async Task<IEnumerable<OrderLinesDto>> GetOrderDetailsByPicklistId(int picklistId)
        {
            string sql = "SELECT * FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId and is_valid_item = 0";
            var result = await _dataAccess.GetDataInline<OrderLinesDto, dynamic>(sql, new { PicklistId = picklistId });
            return result.ToList();
        }
        public async Task<IEnumerable<OrdershipLinesDto>> GetAllocatedStockDetailsfororder(string picklistId)
        {
           string sql = @"SELECT ord_ID FROM lv_order 
                         INNER JOIN lv_orderitem ON ord_id = ori_OrderID
                         INNER JOIN LV_OrderShipItem ON ori_id = osi_orderitemid
                         INNER JOIN LV_OrderShipItemStock ON osi_id = oss_OrderShipItemID 
                         INNER JOIN LV_TASK ON OSS_TASKID = TSK_ID
                        WHERE ORD_CODE = @PicklistId AND TSK_STATUSID <>1";
            var result = await _dataAccess.GetDataInline<OrdershipLinesDto, dynamic>(sql, new { PicklistId = picklistId });
            return result.ToList();
        }
        public async Task<IEnumerable<orderstatusid>> getorderstaus(string picklistId)
        {
            string sql = @"select ord_statusid from lv_order where ord_code = @PicklistId";
            var result = await _dataAccess.GetDataInline<orderstatusid, dynamic>(sql, new { PicklistId = picklistId });
            return result.ToList();
        }
        public async Task<IEnumerable<OrdershipLinesDto>> GetAllocatedStockDetailsforordershipitem(string picklistId, int OSI_ID)
        {
            string sql = @"SELECT ord_ID FROM lv_order 
                         INNER JOIN lv_orderitem ON ord_id = ori_OrderID
                         INNER JOIN LV_OrderShipItem ON ori_id = osi_orderitemid
                         INNER JOIN LV_OrderShipItemStock ON osi_id = oss_OrderShipItemID 
                         INNER JOIN LV_TASK ON OSS_TASKID = TSK_ID
                        WHERE ORD_CODE = @PicklistId AND OSI_ID = @OSI_ID AND TSK_STATUSID <>1";
            var result = await _dataAccess.GetDataInline<OrdershipLinesDto, dynamic>(sql, new { PicklistId = picklistId, OSI_ID = OSI_ID });
            return result.ToList();
        }
        public async Task<IEnumerable<CancelOrderLinesDto>> GetPicklistLine(int? picklistId, string itemrefs)
        {
            var itemRefList = itemrefs.Split(',').ToList();
            string sql = $"SELECT pick_list_line,qty,input_uom FROM Cus_T_ImportedOrdersDetails WHERE Picklist_id = @PicklistId AND item_reference in @itemrefs";
            var result = await _dataAccess.GetDataInline<CancelOrderLinesDto, dynamic>(sql, new { PicklistId = picklistId, itemrefs = itemRefList });
            return result.ToList();
        }

        public async Task UpdateOrderDetail(OrderLinesDto detail)
        {
            string sql = @"UPDATE Cus_T_ImportedOrdersDetails 
                       SET item_reference = @item_reference, 
                           uom = @uom, 
                           is_valid_item = @is_valid_item, 
                           mantis_imported = @mantis_imported 
                       WHERE id = @id";

            await _dataAccess.SaveDataInline(sql, detail);
        }

        public async Task UpdateInvalidItemsFlag(int orderId, bool hasInvalidItems)
        {
            string sql = @"UPDATE Cus_T_ImportedOrders 
                       SET invalid_items = @invalid_items 
                       WHERE id = @id";

            await _dataAccess.SaveDataInline(sql, new
            {
                id = orderId,
                invalid_items = hasInvalidItems ? 1 : 0
            });
        }

        public async Task OrderShipmentRelease(OrderShipmentReleaseRequest request)
        {
            if (request?.Order == null)
                throw new ArgumentNullException(nameof(request.Order));

            var sql = @"
                DELETE FROM Cus_T_OrderShipLocations WHERE order_code = @PickListId;

                UPDATE Cus_T_ImportedOrders 
                SET is_location_assigned = @AssignedStatus 
                WHERE id = @OrderId;
            ";

            var parameters = new
            {
                PickListId = request.Order.pick_list_id,
                AssignedStatus = 3,  // assuming 3 = Released
                OrderId = request.Order.id
            };

            await _dataAccess.SaveDataInline(sql, parameters);
        }

        public async Task<bool> IsOrderStatusCompleted(string? pick_list_id)
        {
            try
            {
                string query = @"SELECT ord_StatusID 
                         FROM LV_order 
                         WHERE ord_code = @PickListId AND ord_StatusID = 3";

                var result = await _dataAccess.GetDataInline<int, dynamic>(query, new { PickListId = pick_list_id });
                return result.Any();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<int> GetOrderShipmentItemCount(string? pick_list_id, bool checkActualOrder)
        {
            try
            {
                string query = @"SELECT COUNT(ord_id) s
                         FROM LV_order a
                         INNER JOIN LV_ordershipment b ON a.ord_id = b.ost_OrderID
                         INNER JOIN LV_ordershipitem c ON b.ost_ID = c.osi_OrderShipmentID
                         WHERE a.ord_code = @PickListId";
                if (checkActualOrder)
                {
                    query += " AND c.osi_StatusID IN (4, 10, 11)";
                }
                var result = await _dataAccess.SaveDataReturnInline<int>(query, new { PickListId = pick_list_id });
                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task UpdateLvStatus(int id, string status)
        {
            try
            {
                string query = @"UPDATE Cus_T_ImportedOrders SET lv_status = @Status WHERE id = @Id";
                await _dataAccess.SaveDataInline(query, new { Status = status, Id = id });
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task ProcessManualOrderStatusJson(string jsonData)
        {

            {
                var parameters = new DynamicParameters();
                parameters.Add("@JsonData", jsonData, DbType.String);

                await _dataAccess.SaveData("[dbo].[Cus_Sp_ProcessManualOrderStatusJson_v1]", parameters);
            }
        }

        public async Task<OrderItemResponse> GetOrderItem(OrderItemGridRequest request)
        {
            try
            {
                var picklistCode = request.code;

                // Fetch Order ID
                var orderIdQuery = "SELECT ord_ID FROM LV_Order WHERE ord_Code = @Code";
                var orderId = await _dataAccess.GetDataInline<int?, dynamic>(
                    orderIdQuery,
                    new { Code = picklistCode }
                );

                if (orderId == null)
                {
                    return new OrderItemResponse
                    {
                        Data = Enumerable.Empty<OrderItemDto>(),
                        TotalRecords = 0
                    };
                }


                var baseQuery = @"
                    SELECT *
                    FROM V_OrderShipItemNew
                    WHERE osi_OrderShipmentID IN (
                        SELECT ost_ID
                        FROM LV_OrderShipment
                        WHERE ost_OrderID = @OrderId
                    )
                    AND LanguageID = 1
                    AND LanguageID1 = 1
                    AND LanguageID2 = 1
                    AND LanguageID4 = 1
                    AND LanguageID7 = 1
                    AND LanguageID6 = 1
                    AND (LanguageID5 = 1 OR LanguageID5 IS NULL)
                    AND pls_LogisticSiteID = ost_LogisticSiteID
                ";

                string dataQuery = baseQuery;
                string countQuery = $"SELECT COUNT(*) FROM ({baseQuery}) AS tbl WHERE 1=1";

                var parameters = new DynamicParameters();
                parameters.Add("@OrderId", orderId);

                // FILTERS
                if (request.filters != null)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrWhiteSpace(filter.Key) &&
                            !string.IsNullOrWhiteSpace(filter.Value?.value))
                        {
                            string filterValue = $"%{filter.Value.value}%";
                            string condition = $" AND {filter.Key} LIKE @{filter.Key}";

                            dataQuery += condition;
                            countQuery += condition;

                            parameters.Add($"@{filter.Key}", filterValue);
                        }
                    }
                }

                // SORTING
                bool sortingApplied = false;

                if (!string.IsNullOrWhiteSpace(request.sortField))
                {
                    string sortType = request.sortOrder == "1" ? "ASC" :
                                      request.sortOrder == "-1" ? "DESC" : "";

                    if (!string.IsNullOrWhiteSpace(sortType))
                    {
                        dataQuery += $" ORDER BY {request.sortField} {sortType}";
                        sortingApplied = true;
                    }
                }

                // DEFAULT ORDER 
                if (!sortingApplied)
                {
                    // Keeps SQL Server output same as Laravel
                    dataQuery += " ORDER BY osi_OrderShipmentID";
                }


                // PAGINATION

                dataQuery += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);


                // EXECUTION
                var data = await _dataAccess.GetDataInline<OrderItemDto, dynamic>(dataQuery, parameters);
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new OrderItemResponse
                {
                    Data = data,
                    TotalRecords = totalCount.FirstOrDefault()
                };
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task<OrderItemResponse> GetOrderItemdetail(string code)
        {
            try
            {
                var picklistCode = code;

                // Fetch Order ID
                var orderIdQuery = "SELECT ord_ID FROM LV_Order WHERE ord_Code = @Code";
                var orderId = await _dataAccess.GetDataInline<int?, dynamic>(
                    orderIdQuery,
                    new { Code = picklistCode }
                );

                if (orderId == null)
                {
                    return new OrderItemResponse
                    {
                        Data = Enumerable.Empty<OrderItemDto>(),
                        TotalRecords = 0
                    };
                }


                var baseQuery = @"
                    SELECT *
                    FROM V_OrderShipItemNew
                    WHERE osi_OrderShipmentID IN (
                        SELECT ost_ID
                        FROM LV_OrderShipment
                        WHERE ost_OrderID = @OrderId
                    )
                    AND LanguageID = 1
                    AND LanguageID1 = 1
                    AND LanguageID2 = 1
                    AND LanguageID4 = 1
                    AND LanguageID7 = 1
                    AND LanguageID6 = 1
                    AND osi_statusid not in (11)
                    AND (LanguageID5 = 1 OR LanguageID5 IS NULL)
                    AND pls_LogisticSiteID = ost_LogisticSiteID
                ";

                string dataQuery = baseQuery;
                string countQuery = $"SELECT COUNT(*) FROM ({baseQuery}) AS tbl WHERE 1=1";

                var parameters = new DynamicParameters();
                parameters.Add("@OrderId", orderId);



                // EXECUTION
                var data = await _dataAccess.GetDataInline<OrderItemDto, dynamic>(dataQuery, parameters);
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new OrderItemResponse
                {
                    Data = data,
                    TotalRecords = totalCount.FirstOrDefault()
                };
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task<AssignOrdersResponse> AssignOrderLinesToUserLoc(AssignOrderLinesRequest request)
        {
            try
            {
                var orders = request.orders;
                string? pickListId = "";
                string? orderType = "";
                string? customerCode = "";
                List<OrderLines>? orderLines;

                int orderId;

                if (request.assigned_type == 2)
                {
                    pickListId = request.pick_list_id;
                    orderType = (await _dataAccess.GetDataInline<string, dynamic>(
                        "SELECT code FROM Cus_OrderType WHERE id = @Id",
                        new { Id = request.order_type })).FirstOrDefault();

                    customerCode = request.customer;
                    orderLines = request.orders;
                    orderId = request.orders[0].id;
                }
                else
                {
                    var order = request?.orders?.FirstOrDefault();
                    pickListId = request?.pick_list_id;
                    orderType = request?.order_type;
                    customerCode = request?.customer;
                    orderId = order.id;

                    orderLines = (await _dataAccess.GetDataInline<OrderLines, dynamic>(
                        "SELECT item_reference, id FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId",
                        new { PicklistId = orderId })).ToList();
                }

                var itemReferences = string.Join(", ", orderLines.Select(x => $"'{x?.item_reference?.Replace("'", "''")}'"));
                var updateQuery = "";

                if (request.user.HasValue && request.user.Value > 0)
                {
                    updateQuery = $@"
                        UPDATE LV_Task
                        SET tsk_ExpUserID = @User,
                            tsk_ToLocationCode = (SELECT loc_code FROM lv_location WHERE loc_code = (SELECT CONCAT('TUL-', usr_Login) FROM lv_users
                             WHERE usr_id = (SELECT usr_id FROM lv_users
                              JOIN com_employee ON usr_personid = emp_personid
                              WHERE emp_id = @User))),
                            tsk_ToLocationID = (SELECT loc_ID FROM lv_location WHERE loc_code = (SELECT CONCAT('TUL-', usr_Login)
                              FROM lv_users
                              WHERE usr_id = (SELECT usr_id FROM lv_users
                              JOIN com_employee ON usr_personid = emp_personid
                              WHERE emp_id = @User)))
                        FROM LV_Task
                        JOIN CUS_V_ParamsForOrdCod2 ON tsk_id = oss_TaskID
                        JOIN lv_product ON LV_Task.tsk_ProductID = LV_Product.prd_ID
                        WHERE ord_Code = @PickListId 
                          AND LV_Product.prd_PrimaryCode IN ({itemReferences})
                          AND tsk_SSCC IS NULL 
                          AND tsk_StatusID = '1'
                    ";
                }

                if (request.pallet_user.HasValue && request.pallet_user.Value > 0)
                {
                    updateQuery = $@"
                        UPDATE LV_Task
                        SET tsk_ExpUserID = @pallet_user,
                            tsk_ToLocationCode = (SELECT loc_code FROM lv_location
                               WHERE loc_code = (SELECT CONCAT('TUL-', usr_Login)
                               FROM lv_users
                               WHERE usr_id = (SELECT usr_id FROM lv_users
                               JOIN com_employee ON usr_personid = emp_personid
                               WHERE emp_id = @pallet_user))),
                            tsk_ToLocationID = (SELECT loc_ID FROM lv_location
                             WHERE loc_code = (SELECT CONCAT('TUL-', usr_Login)
                             FROM lv_users
                             WHERE usr_id = (SELECT usr_id FROM lv_users
                             JOIN com_employee ON usr_personid = emp_personid
                             WHERE emp_id = @pallet_user)))
                        FROM LV_Task
                        JOIN CUS_V_ParamsForOrdCod2 ON tsk_id = oss_TaskID
                        JOIN lv_product ON LV_Task.tsk_ProductID = LV_Product.prd_ID
                        WHERE ord_Code = @PickListId 
                          AND LV_Product.prd_PrimaryCode IN ({itemReferences})
                          AND tsk_SSCC IS NOT NULL 
                          AND tsk_StatusID = '1'
                    ";
                }

                await _dataAccess.SaveDataInline<dynamic>(updateQuery, new { request?.user, PickListId = pickListId, request?.pallet_user });

                string customerCodeCondition = "";

                if (orderType == "R")
                {
                    customerCodeCondition = "AND customer_code IS NULL";
                }
                else if (orderType == "I")
                {
                    // Validate internal transfer customer
                    var validCustomersSql = @"SELECT DISTINCT customer_code FROM Cus_T_ship_loc_info WHERE shipment_type = 'I'";

                    var validCustomers = (await _dataAccess.GetDataInline<string, dynamic>(validCustomersSql, new { })).ToList();

                    if (!validCustomers.Contains(customerCode))
                    {
                        return new AssignOrdersResponse
                        {
                            Error = 1,
                            Message = "The order does not belong to internal transfer customer."
                        };
                    }

                    customerCodeCondition = "AND customer_code = @CustomerCode";
                }

                string sqlQuery = $@"
                    SELECT CONCAT(a.loc_Code, '||s') AS Id, a.loc_Code, a.loc_ID, a.loc_SectorCode, a.loc_ColumnCode
                    FROM lv_location a
                    INNER JOIN Cus_T_ship_loc_info b ON a.loc_Code = b.Code
                    WHERE b.shipment_type = @OrderType
                      AND limited_capacity = 1 
                      AND b.Size = 'Single'
                      AND a.loc_storagesystemid IN (3,14,15)
                      AND a.loc_Code NOT IN (SELECT assigned_shiploc FROM Cus_T_OrderShipLocations)
                      {customerCodeCondition}

                    UNION ALL

                    SELECT CONCAT(a.loc_Code, '||d') AS Id, a.loc_Code, a.loc_ID, a.loc_SectorCode, a.loc_ColumnCode
                    FROM lv_location a
                    INNER JOIN Cus_T_ship_loc_info b ON a.loc_Code = b.Code
                    WHERE b.shipment_type = @OrderType
                      AND limited_capacity = 1 
                      AND b.Size = 'Double'
                      AND a.loc_storagesystemid IN (3,14,15)
                      AND a.loc_Code NOT IN (SELECT assigned_shiploc FROM Cus_T_OrderShipLocations)
                      {customerCodeCondition}

                    ORDER BY a.loc_ID ASC
                ";

                // get all orderlines
                var parameters = new { orderType };
                var loc_array = await GetLocations(request, sqlQuery);

                // check total no of pallet and toal location if not match assign virtual location for remaining location
                var locArray = await AppendVirtualLocationsIfNeeded(loc_array, orderLines.Count, orderType, customerCode);

                // Assign Location 
                await AssignLocation(request, loc_array, orderLines);

                return new AssignOrdersResponse { Error = 0, Message = "Order Assigned Successfully" };
            }
            catch (Exception ex)
            {
                return new AssignOrdersResponse { Error = 1, Message = "Internal Server Error | " + ex.Message };
            }
        }

        public async Task InsertLoadOrdersJob(JobModel job)
        {
            var sql = @"
                INSERT INTO Cus_jobs (queue, payload, attempts, reserved_at, available_at, created_at)
                VALUES (@queue, @payload, @attempts, @reserved_at, @available_at, @created_at);
            ";

            await _dataAccess.SaveDataInline(sql, job);
        }
        public async Task<OrderCancelremainngItemResponse> GetOrderItemcancelleddetail(string code, int? osiorderitemid)
        {
            try
            {
                var picklistCode = code;

                // Fetch Order ID
                var orderIdQuery = "SELECT ord_ID FROM LV_Order WHERE ord_Code = @Code";
                var orderId = await _dataAccess.GetDataInline<int?, dynamic>(
                    orderIdQuery,
                    new { Code = picklistCode }
                );

                if (orderId == null)
                {
                    return new OrderCancelremainngItemResponse
                    {
                        Data = Enumerable.Empty<OrderRCItemDto>(),
                        TotalRecords = 0
                    };
                }

                var baseQuery = @"
                   SELECT 
                    osi_OrderItemID,
                    SUM(osi_Quantity) AS ActualOrderQuantity,
                    SUM(CASE WHEN osi_statusid = 11 THEN osi_Quantity ELSE 0 END) AS CancelledQuantity,
                	SUM(osi_Quantity) - SUM(CASE WHEN osi_statusid = 11 THEN osi_Quantity ELSE 0 END) as remaining
                  FROM V_OrderShipItemNew
                  WHERE osi_OrderShipmentID IN (
                        SELECT ost_ID
                        FROM LV_OrderShipment
                        WHERE ost_OrderID = @OrderId
                      )
                    AND LanguageID = 1
                    AND LanguageID1 = 1
                    AND LanguageID2 = 1
                    AND LanguageID4 = 1
                    AND LanguageID7 = 1
                    AND LanguageID6 = 1
                    AND (LanguageID5 = 1 OR LanguageID5 IS NULL)
                    AND pls_LogisticSiteID = ost_LogisticSiteID
                	and osi_OrderItemID = @osiorderitemid
                  GROUP BY osi_OrderItemID
                ";



                string dataQuery = baseQuery;
                string countQuery = $"SELECT COUNT(*) FROM ({baseQuery}) AS tbl WHERE 1=1";

                var parameters = new DynamicParameters();
                parameters.Add("@OrderId", orderId);
                parameters.Add("@osiorderitemid", osiorderitemid);


                // EXECUTION
                var data = await _dataAccess.GetDataInline<OrderRCItemDto, dynamic>(dataQuery, parameters);
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new OrderCancelremainngItemResponse
                {
                    Data = data,
                    TotalRecords = totalCount.FirstOrDefault()
                };
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task<int?> GetOrderIdByPickListId(string pickListId)
        {
            var sql = @"SELECT TOP 1 b.ord_id
                    FROM Cus_T_ImportedOrdersDetails a
                    INNER JOIN LV_Order b ON a.pick_list_id = b.ord_Code
                    WHERE a.pick_list_id = @PickListId";
            var result = await _dataAccess.GetDataInline<int, dynamic>(sql, new { PickListId = pickListId });
            return result.FirstOrDefault();
        }

        public async Task<IEnumerable<OrderLaneAssignment>> GetOrderLaneAssignments(string pickListId)
        {
            return await _dataAccess.GetDataInline<OrderLaneAssignment, dynamic>(
                 "SELECT * FROM Cus_T_OrderLaneAssignment WHERE order_code = @OrderCode",
                 new { OrderCode = pickListId });
        }

        public async Task<int> DeleteOrderLaneAssignment(long id)
        {
            return await _dataAccess.SaveDataInline("DELETE FROM Cus_T_OrderLaneAssignment WHERE id = @Id", new { Id = id });
        }

        public async Task<int> UpdateLaneSlotAvailability(string? lane, bool isAvailable)
        {
            return await _dataAccess.SaveDataInline(
                "UPDATE Cus_LaneSlots SET is_available = @IsAvailable WHERE lane = @Lane",
                new { Lane = lane, IsAvailable = isAvailable });
        }

        public async Task<int> UpdateImportedOrderLaneAssigned(string pickListId)
        {
            return await _dataAccess.SaveDataInline(
                  "UPDATE Cus_T_ImportedOrders SET is_lane_assigned = 1 WHERE pick_list_id = @PickListId",
                  new { PickListId = pickListId });
        }

        public async Task<int> UpdateImportedOrderStatus(string? pickListId, string status)
        {
            return await _dataAccess.SaveDataInline(
                  "UPDATE Cus_T_ImportedOrders SET lv_status = @Status WHERE pick_list_id = @PickListId",
                  new { Status = status, PickListId = pickListId });
        }

        //public async Task<(List<dynamic> Data, int Total)> GetOrderExportDataAsync(OrderExportFilter request)
        //{
        //    var filters = request.filters ?? new();
        //    var page = request.page ?? 1;
        //    var rows = request.rows ?? 10;
        //    var skip = request.first ?? (page - 1) * rows;
        //    var sortField = request.sortField;

        //    if (sortField == "pick_list_id")
        //    {
        //        sortField = "lo.ord_Code";
        //    }
        //    else if (sortField == "customer_code")
        //    {
        //        sortField = "lo.ord_CustomerOrderCode";
        //    }
        //    else
        //    {
        //        // Default field if no match
        //        sortField = "lo.ord_inputdate";
        //    }
        //    var sortOrder = request.sortOrder == "1" ? "asc" : "desc";

        //    string whereClause = "";

        //    foreach (var filter in filters)
        //    {
        //        var col = filter.Key;
        //        var val = filter.Value?.value;

        //        if (col == "lv_status")
        //        {
        //            if (val == "Completed")
        //            {
        //                whereClause += $" AND ta.MinStatus >= 3 AND ta.MaxStatus <= 5 ";
        //            }
        //            else if (val == "Canceled")
        //            {
        //                whereClause += $" AND ta.MinStatus >= 4 AND ta.MaxStatus <= 5 ";
        //            }
        //            else if (val == "Pending")
        //            {
        //                whereClause += $" AND ta.MinStatus = 1 AND ta.MaxStatus = 1 ";
        //            }
        //            else if (val == "Executing")
        //            {
        //                whereClause += $" AND MinStatus = 1 AND MaxStatus = 3  OR MinStatus IS NULL OR MaxStatus IS NULL ";
        //            }
        //        }
        //        else if (col == "export_status")
        //        {
        //            if (val == "Not Exported")
        //            {
        //                whereClause += $" AND io.is_exported = 0 ";
        //            }
        //            else if (val == "Partial Failed")
        //            {
        //                whereClause += $" AND io.is_exported IN (1, 3, 4, 5) ";
        //            }
        //            else if (val == "Completed")
        //            {
        //                whereClause += $" AND io.is_exported IN (2,6) ";
        //            }
        //        }

        //        else if (!string.IsNullOrWhiteSpace(val))
        //        {
        //            whereClause += $" AND {col} LIKE '%{val}%'";
        //        }
        //    }

        //    // Replace with your actual SQL with filters injected in WHERE clause
        //    var baseQuery = @$"
        //    WITH TaskAgg AS (
        //             SELECT 
        //                 oi.ori_OrderID,
        //                 MIN(t.tsk_StatusID) AS MinStatus,
        //                 MAX(t.tsk_StatusID) AS MaxStatus,
        //                 COUNT(t.tsk_code) AS TotalTasks,
        //                 SUM(CASE WHEN t.tsk_StatusID = 3 THEN t.tsk_Quantity ELSE 0 END) AS PickedQty,
        //                 SUM(t.tsk_Quantity) AS TotalQty,
        //                 MAX(CASE WHEN osi.osi_StatusID = 1 THEN 1 ELSE 0 END) AS HasMissing
        //             FROM LV_Order lo
        //             INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //             INNER JOIN LV_OrderShipItem osi ON oi.ori_ID = osi.osi_OrderItemID
        //             INNER JOIN LV_OrderShipItemStock osis ON osi.osi_ID = osis.oss_OrderShipItemID
        //             INNER JOIN LV_Task t ON t.tsk_ID = osis.oss_TaskID
        //             WHERE lo.ord_StatusID NOT IN (3,4,5)
        //             GROUP BY oi.ori_OrderID
        //         ),
        //         UsersAgg AS (
        //             SELECT 
        //                 ori_OrderID,
        //                 STRING_AGG(CAST(usr_Login AS NVARCHAR(MAX)), ', ') AS Users
        //             FROM (
        //                 SELECT DISTINCT 
        //                     oi.ori_OrderID,
        //                     usr.usr_Login
        //                 FROM LV_Order lo
        //                 INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //                 INNER JOIN LV_OrderShipItem osi ON oi.ori_ID = osi.osi_OrderItemID
        //                 INNER JOIN LV_OrderShipItemStock osis ON osi.osi_ID = osis.oss_OrderShipItemID
        //                 INNER JOIN LV_Task t ON t.tsk_ID = osis.oss_TaskID
        //                 INNER JOIN COM_Employee e ON t.tsk_ActualUserID = e.emp_ID
        //                 INNER JOIN lv_users usr ON usr.usr_PersonID = e.emp_PersonID
        //                 WHERE lo.ord_StatusID NOT IN (3,4,5)
        //             ) DistinctUsers
        //             GROUP BY ori_OrderID
        //         ),
        //         MissingCheck AS (
        //             SELECT DISTINCT 
        //                 oi.ori_OrderID,
        //                 MAX(CASE WHEN osi.osi_StatusID = 1 THEN 1 ELSE 0 END) AS HasMissingTasks
        //             FROM LV_Order lo
        //             INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //             INNER JOIN LV_OrderShipItem osi ON oi.ori_ID = osi.osi_OrderItemID
        //             WHERE lo.ord_StatusID NOT IN (3,4,5)
        //             GROUP BY oi.ori_OrderID
        //         )
        //         SELECT 
        //             io.id,
        //             lo.ord_Code AS pick_list_id, 
        //             COUNT(DISTINCT oi.ori_ID) AS order_details_count, 
        //             lo.ord_CustomerOrderCode AS [Customer Code],
        //             FORMAT(lo.ord_inputdate, 'MM-dd-yyyy') AS [Date Created],
        //             io.is_exported,
        //             CASE
        //                 WHEN ta.MinStatus = 1 AND ta.MaxStatus = 1 THEN 'Pending'
        //                 WHEN ta.MinStatus >= 4 AND ta.MaxStatus <= 5 THEN 'Canceled'
        //                 WHEN ta.MinStatus >= 3 AND ta.MaxStatus <= 5 THEN 'Completed'
        //                 ELSE 'Executing'
        //             END AS [status],
        //             ISNULL(ua.Users, '') AS [Assigned To],
        //             IIF(mc.HasMissingTasks = 1, 'Missing Tasks', '') AS [Task Check],
        //             ISNULL(ta.TotalTasks, 0) AS [Total Tasks],
        //             CAST(
        //                 ISNULL((ta.PickedQty * 100.0) / NULLIF(ta.TotalQty, 0), 0) AS INT
        //             ) AS [Picked Percentage],
        //             CASE
        //                 WHEN io.is_exported = 0 THEN 'Not Exported'
        //                 WHEN io.is_exported IN (1, 3, 4, 5) THEN 'Partial Failed'
        //                 WHEN io.is_exported IN (2,6) THEN 'Completed'
        //                 ELSE 'Unknown'
        //             END AS [Export Status]
        //         FROM LV_Order lo
        //         INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //         INNER JOIN Cus_T_ImportedOrders io ON lo.ord_Code = io.pick_list_id
        //         LEFT JOIN TaskAgg ta ON lo.ord_ID = ta.ori_OrderID
        //         LEFT JOIN UsersAgg ua ON lo.ord_ID = ua.ori_OrderID
        //         LEFT JOIN MissingCheck mc ON lo.ord_ID = mc.ori_OrderID
        //         WHERE lo.ord_StatusID NOT IN (3,4,5)
        //         {whereClause}
        //         GROUP BY 
        //             io.id,
        //             io.is_exported,
        //             lo.ord_Code, 
        //             lo.ord_CustomerOrderCode, 
        //             lo.ord_inputdate, 
        //             lo.ord_ID,
        //             ta.MinStatus,
        //             ta.MaxStatus,
        //             ta.TotalTasks,
        //             ta.PickedQty,
        //             ta.TotalQty,
        //             mc.HasMissingTasks,
        //             ua.Users,
        //             io.is_exported
        //        ORDER BY {sortField} {sortOrder}
        //        OFFSET {skip} ROWS FETCH NEXT {rows} ROWS ONLY;
        //    ";

        //    var countQuery = @$"
        //                 WITH TaskAgg AS (
        //         SELECT 
        //             oi.ori_OrderID,
        //             MIN(t.tsk_StatusID) AS MinStatus,
        //             MAX(t.tsk_StatusID) AS MaxStatus,
        //             COUNT(t.tsk_code) AS TotalTasks,
        //             SUM(CASE WHEN t.tsk_StatusID = 3 THEN t.tsk_Quantity ELSE 0 END) AS PickedQty,
        //             SUM(t.tsk_Quantity) AS TotalQty,
        //             MAX(CASE WHEN osi.osi_StatusID = 1 THEN 1 ELSE 0 END) AS HasMissing
        //         FROM LV_Order lo
        //         INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //         INNER JOIN LV_OrderShipItem osi ON oi.ori_ID = osi.osi_OrderItemID
        //         INNER JOIN LV_OrderShipItemStock osis ON osi.osi_ID = osis.oss_OrderShipItemID
        //         INNER JOIN LV_Task t ON t.tsk_ID = osis.oss_TaskID
        //         WHERE lo.ord_StatusID NOT IN (3,4,5)
        //         GROUP BY oi.ori_OrderID
        //     ),
        //     UsersAgg AS (
        //         SELECT 
        //             ori_OrderID,
        //             STRING_AGG(CAST(usr_Login AS NVARCHAR(MAX)), ', ') AS Users
        //         FROM (
        //             SELECT DISTINCT 
        //                 oi.ori_OrderID,
        //                 usr.usr_Login
        //             FROM LV_Order lo
        //             INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //             INNER JOIN LV_OrderShipItem osi ON oi.ori_ID = osi.osi_OrderItemID
        //             INNER JOIN LV_OrderShipItemStock osis ON osi.osi_ID = osis.oss_OrderShipItemID
        //             INNER JOIN LV_Task t ON t.tsk_ID = osis.oss_TaskID
        //             INNER JOIN COM_Employee e ON t.tsk_ActualUserID = e.emp_ID
        //             INNER JOIN lv_users usr ON usr.usr_PersonID = e.emp_PersonID
        //             WHERE lo.ord_StatusID NOT IN (3,4,5)
        //         ) DistinctUsers
        //         GROUP BY ori_OrderID
        //     ),
        //     MissingCheck AS (
        //         SELECT DISTINCT 
        //             oi.ori_OrderID,
        //             MAX(CASE WHEN osi.osi_StatusID = 1 THEN 1 ELSE 0 END) AS HasMissingTasks
        //         FROM LV_Order lo
        //         INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //         INNER JOIN LV_OrderShipItem osi ON oi.ori_ID = osi.osi_OrderItemID
        //         WHERE lo.ord_StatusID NOT IN (3,4,5)
        //         GROUP BY oi.ori_OrderID
        //     )

        //     SELECT COUNT(*)
        //     FROM (
        //         SELECT 
        //             io.id
        //         FROM LV_Order lo
        //         INNER JOIN LV_OrderItem oi ON lo.ord_id = oi.ori_OrderID
        //         INNER JOIN Cus_T_ImportedOrders io ON lo.ord_Code = io.pick_list_id
        //         LEFT JOIN TaskAgg ta ON lo.ord_ID = ta.ori_OrderID
        //         LEFT JOIN UsersAgg ua ON lo.ord_ID = ua.ori_OrderID
        //         LEFT JOIN MissingCheck mc ON lo.ord_ID = mc.ori_OrderID
        //         WHERE lo.ord_StatusID NOT IN (3,4,5)
        //         {whereClause}
        //         GROUP BY 
        //             io.id,
        //             lo.ord_ID,
        //             ta.MinStatus,
        //             ta.MaxStatus,
        //             ta.TotalTasks,
        //             ta.PickedQty,
        //             ta.TotalQty,
        //             mc.HasMissingTasks,
        //             ua.Users,
        //             io.is_exported,
        //             lo.ord_Code, 
        //             lo.ord_CustomerOrderCode, 
        //             lo.ord_inputdate
        //     ) AS Result;

        //    ";

        //    var data = await _dataAccess.GetDataInline<dynamic, dynamic>(baseQuery, new { });
        //    var total = await _dataAccess.GetDataInline<int, dynamic>(countQuery, new { });

        //    return (data.ToList(), total.FirstOrDefault());
        //}
        public async Task<(List<dynamic> Data, int Total)> GetOrderExportDataAsync(OrderExportFilter request)
        {
            try
            {
                var filters = request.filters ?? new();
                var page = request.page <= 0 ? 1 : request.page ?? 1;
                var rows = request.rows <= 0 ? 10 : request.rows ?? 10;

                var skip = request.first ?? (page - 1) * rows;

                if (skip < 0)
                    skip = 0;
                var sortField = request.sortField ?? "lo.ord_inputdate";
                var sortOrder = request.sortOrder == "1" ? "asc" : "desc";

                // Map sort field
                if (sortField == "pick_list_id")
                {
                    sortField = "lo.ord_Code";
                }
                else if (sortField == "customer_code")
                {
                    sortField = "lo.ord_CustomerOrderCode";
                }

                // Extract filter values
                string statusFilter = null;
                string exportStatusFilter = null;
                string pickListId = null;
                string customerCode = null;
                string dateCreated = null;

                foreach (var filter in filters)
                {
                    var col = filter.Key;
                    var val = filter.Value?.value;

                    if (string.IsNullOrWhiteSpace(val))
                        continue;

                    switch (col)
                    {
                        case "lv_status":
                            statusFilter = val;
                            break;
                        case "export_status":
                            exportStatusFilter = val;
                            break;
                        case "pick_list_id":
                            pickListId = val;
                            break;
                        case "customer_code":
                            customerCode = val;
                            break;
                        case "date_created":
                            dateCreated = val;
                            break;
                    }
                }

                // Prepare parameters for stored procedure
                var parameters = new
                {
                    Page = page,
                    Rows = rows,
                    Skip = skip,
                    SortField = sortField,
                    SortOrder = sortOrder,
                    StatusFilter = statusFilter,
                    ExportStatusFilter = exportStatusFilter,
                    PickListId = pickListId,
                    CustomerCode = customerCode,
                    DateCreated = dateCreated
                };

                // Execute stored procedure - returns two result sets
                //var results = await _dataAccess.GetDataInline<dynamic, int>(
                //    "SP_GetOrderExportData",
                //    parameters
                //);
                //var results = await _dataAccess.GetDataInline<dynamic, dynamic>("SP_GetOrderExportData_1V", new { });
                var results = await _dataAccess.ExecuteStoredProcedureMultipleAsync<dynamic, int>(
                              "SP_GetOrderExportData_1V",
                              parameters
                          );
                //return (results.ToList(), results.FirstOrDefault());
                return (results.Item1.ToList(), results.Item2.FirstOrDefault());
            }
             catch (Exception ex)
            {
                throw new Exception("Error fetching order task details", ex);
            }
        }

        public async Task<List<PickListIdResponse>> GetPickListIdsAsync()
        {
            var query = @"
                SELECT 
                    CAST(ord.ord_InputDate AS DATE) AS InputDate,
                    io.pick_list_id,
                    io.customer_code,
                    io.is_exported
                FROM LV_OrderShipItem osi
                INNER JOIN LV_OrderStatus ors ON osi.osi_StatusID = ors.ors_ID
                INNER JOIN LV_OrderItem ori ON osi.osi_OrderItemID = ori.ori_id
                INNER JOIN LV_Order ord ON ori.ori_OrderID = ord.ord_id
                INNER JOIN Cus_T_ImportedOrders io ON io.pick_list_id = ord.ord_Code
                WHERE ord.ord_StatusID NOT IN (3, 4, 5)
                  AND osi.osi_StatusID != 8
                  AND io.is_exported != 2
                GROUP BY 
                    CAST(ord.ord_InputDate AS DATE),
                    io.pick_list_id,
                    io.customer_code,
                    io.id,
                    io.is_exported
                ORDER BY io.id DESC
            ";

            var result = await _dataAccess.GetDataInline<PickListIdResponse, dynamic>(query, new { });
            return result.ToList();
        }
        public async Task<List<OrderShortDataExportModel>> GetOrderShortDataExportAsync(string order)

        {
            var query = @"
            SELECT ct.pick_list_id, ct.prd_PrimaryCode, ct.qty,
                   SUM(oss_Quantity) AS outer_QTY,
                   SUM(oss_QuantitySU) AS inner_QTY,
                   ct.create_datetime,
                   ors_MessageCode,
                   pst_MessageCode,
                   CASE WHEN ct.item_reference IS NULL THEN 'Missing_Info' END AS Item_issues,
                   CASE WHEN inv_qtyfree = 0 THEN 'no Stock' END AS Qty_Free
            FROM (
                SELECT ord_ID, pick_list_id, prd_ID, prd_PrimaryCode, uom, SUM(qty) AS qty, create_datetime, ord_StatusID, item_reference
                FROM Cus_T_ImportedOrdersDetails
                INNER JOIN LV_Product ON prd_PrimaryCode = item_reference
                INNER JOIN LV_Order ON pick_list_id = ord_code
                GROUP BY prd_ID, ord_ID, pick_list_id, prd_PrimaryCode, uom, create_datetime, ord_StatusID, item_reference
            ) ct
            LEFT JOIN LV_OrderItem ON ori_OrderID = ct.ord_ID AND ori_ProductID = ct.prd_ID
            LEFT JOIN LV_OrderShipItem osi ON osi_OrderItemID = ori_id
            LEFT JOIN LV_OrderShipItemStock ON oss_TaskID IS NOT NULL AND osi.osi_ID = oss_OrderShipItemID
            LEFT JOIN LV_OrderStatus ON ct.ord_StatusID = ors_id
            LEFT JOIN COM_Inventory ON ct.prd_ID = inv_ProductID
            LEFT JOIN LV_ProgressStatus ON ct.ord_StatusID = pst_ID
            WHERE ct.pick_list_id = @order 
              AND ct.qty > 0 
              AND pst_MessageCode NOT IN ('Status_Cancelled', 'Status_Suspended','Status_Done')
            GROUP BY ct.pick_list_id, ct.prd_PrimaryCode, ct.qty, ct.create_datetime,
                     ors_MessageCode, ct.item_reference, inv_qtyfree, pst_MessageCode
            HAVING (ct.qty <> SUM(oss_Quantity) AND ct.qty <> SUM(oss_QuantitySU)) OR SUM(oss_Quantity) IS NULL
            ORDER BY ct.create_datetime";

            var result = await _dataAccess.GetDataInline<OrderShortDataExportModel, dynamic>(query, new { order });
            return result.ToList();
        }
        public async Task<(IEnumerable<OrderTaskDetailResponse> data, int totalRecords)> GetOrderTaskDetailsAsync(OrderTaskDetailRequest request)
        {
            try
            {
                var filters = request.filters ?? new Dictionary<string, Filters>();
                //var filters = request.filters ?? new();
                var skip = 0;

                if (request.first > 0)
                {
                    skip = request.first;
                }
                else if (request.page > 0 && request.rows > 0)
                {
                    skip = (request.page - 1) * request.rows;
                }

                // Ensure skip is never negative
                if (skip < 0)
                {
                    skip = 0;
                }
                var sortField = !string.IsNullOrEmpty(request.sortField) ? request.sortField : "p.prd_PrimaryCode";
                var sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";

                var whereConditions = new List<string>
                {
                   $"ord.ord_Code = @code",
                   $"task.LanguageID = 1",
                   $"task.LanguageID1 = 1",
                   $"ISNULL(task.LanguageID2, 1) = 1",
                   $"ISNULL(task.LanguageID3, 1) = 1",
                   $"ISNULL(task.LanguageID4, 1) = 1",
                   $"ISNULL(task.LanguageID5, 1) = 1",
                   $"ISNULL(task.LanguageID6, 1) = 1"
                };

                var parameters = new DynamicParameters();
                parameters.Add("code", request.code);

                //foreach (var filter in filters)
                //{
                //    if (!string.IsNullOrWhiteSpace(filter.Value.value))
                //    {
                //        string column = filter.Key switch
                //        {
                //            "prd_PrimaryCode" => "p.prd_PrimaryCode",
                //            "assigned_user" => "task.ExpUser",
                //            "LotNum" => "Attributes0.tav_Value",
                //            _ => null
                //        };

                //        if (!string.IsNullOrEmpty(column))
                //        {
                //            whereConditions.Add($"{column} LIKE @filter_{filter.Key}");
                //            parameters.Add($"filter_{filter.Key}", $"%{filter.Value.value}%");
                //        }
                //    }
                //}

                var whereClause = string.Join(" AND ", whereConditions);

                var sql = $@"
                   SELECT 
                       p.prd_PrimaryCode,
                       task.ExpUser AS assigned_user,
                       task.ComboDescription,
                       ISNULL(Attributes0.tav_Value, '') AS LotNum,
                       SUM(CAST(task.tsk_Quantity AS INT)) AS total_quantity,
                       SUM(CASE WHEN progress.pst_MessageCode = 'Status_Done' THEN CAST(task.tsk_Quantity AS INT) ELSE 0 END) AS picked_quantity,
                       SUM(CAST(task.tsk_Quantity AS INT)) - SUM(CASE WHEN progress.pst_MessageCode = 'Status_Done' THEN CAST(task.tsk_Quantity AS INT) ELSE 0 END) AS remaining_quantity,
                       CASE 
                           WHEN COUNT(*) = SUM(CASE WHEN progress.pst_MessageCode = 'Status_Done' THEN 1 ELSE 0 END) THEN 'Complete'
                           WHEN SUM(CASE WHEN progress.pst_MessageCode = 'Status_Done' THEN 1 ELSE 0 END) > 0 THEN 'Partial Picking'
                           ELSE 'Pending'
                       END AS final_status
                   FROM LV_Order ord
                   LEFT JOIN V_SearchOrderShipmentTask task_ship ON task_ship.ord_Code = ord.ord_Code
                   LEFT JOIN V_TaskSearch task ON task.tsk_ID = task_ship.oss_TaskID
                   LEFT JOIN LV_ProgressStatus progress ON task.tsk_StatusID = progress.pst_ID
                   LEFT JOIN LV_Product p ON task.tsk_ProductID = p.prd_ID
                   LEFT JOIN (
                       SELECT tav_TaskID, tav_Value 
                       FROM lv_TaskAttributesvalues 
                       WHERE tav_AttributeID = 1
                   ) AS Attributes0 ON task.tsk_ID = Attributes0.tav_TaskID
                   WHERE {whereClause}
                   GROUP BY p.prd_PrimaryCode, task.ExpUser, Attributes0.tav_Value, task.ComboDescription
                   ORDER BY {sortField} {sortOrder}
                   OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY;
                ";

                var countquery =
                $@"
                 SELECT COUNT(*) 
                 FROM (
                   SELECT 1 AS dummy_column
                   FROM LV_Order ord
                   LEFT JOIN V_SearchOrderShipmentTask task_ship ON task_ship.ord_Code = ord.ord_Code
                   LEFT JOIN V_TaskSearch task ON task.tsk_ID = task_ship.oss_TaskID
                   LEFT JOIN LV_ProgressStatus progress ON task.tsk_StatusID = progress.pst_ID
                   LEFT JOIN LV_Product p ON task.tsk_ProductID = p.prd_ID
                   LEFT JOIN (
                       SELECT tav_TaskID, tav_Value 
                       FROM lv_TaskAttributesvalues 
                       WHERE tav_AttributeID = 1
                   ) AS Attributes0 ON task.tsk_ID = Attributes0.tav_TaskID
                   WHERE ord.ord_Code = @code
                       AND task.LanguageID = 1
                       AND task.LanguageID1 = 1
                       AND ISNULL(task.LanguageID2, 1) = 1
                       AND ISNULL(task.LanguageID3, 1) = 1
                       AND ISNULL(task.LanguageID4, 1) = 1
                       AND ISNULL(task.LanguageID5, 1) = 1
                       AND ISNULL(task.LanguageID6, 1) = 1
                   GROUP BY p.prd_PrimaryCode, task.ExpUser, Attributes0.tav_Value, task.ComboDescription
                 ) AS CountTable;
                ";
                //var countquery = "\r\n            SELECT COUNT(*) FROM (\r\n                SELECT 1\r\n                FROM LV_Order ord\r\n                LEFT JOIN V_SearchOrderShipmentTask task_ship ON task_ship.ord_Code = ord.ord_Code\r\n                LEFT JOIN V_TaskSearch task ON task.tsk_ID = task_ship.oss_TaskID\r\n                LEFT JOIN LV_ProgressStatus progress ON task.tsk_StatusID = progress.pst_ID\r\n                LEFT JOIN LV_Product p ON task.tsk_ProductID = p.prd_ID\r\n                LEFT JOIN (\r\n                    SELECT tav_TaskID, tav_Value \r\n                    FROM lv_TaskAttributesvalues \r\n                    WHERE tav_AttributeID = 1\r\n                ) AS Attributes0 ON task.tsk_ID = Attributes0.tav_TaskID\r\n                WHERE" {whereClause}"               GROUP BY p.prd_PrimaryCode, task.ExpUser, Attributes0.tav_Value, task.ComboDescription\r\n            ) AS CountTable";

                parameters.Add("skip", skip);
                parameters.Add("take", request.rows);

                //using var multi = await _dataAccess.QueryMultipleAsync(sql, parameters);
                var data = await _dataAccess.GetDataInline<OrderTaskDetailResponse, dynamic>(sql, parameters);
                var total = await _dataAccess.GetDataInline<int, dynamic>(countquery, parameters);
                //var total = await multi.ReadFirstAsync<int>();

                return (data, total.FirstOrDefault());
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching order task details", ex);
            }
        }


        public async Task UpdateOrderStatus(List<string>? pickListIds, string? status)
        {
            var query = @"UPDATE Cus_T_ImportedOrders 
                      SET lv_status = @Status 
                      WHERE pick_list_id IN @PickListIds
            ";

            await _dataAccess.SaveDataInline(query, new { Status = status, PickListIds = pickListIds });
        }
        public async Task UpdateOrderStatusConditional(string pickListIds, string? status)
        {
            var query = @"UPDATE Cus_T_ImportedOrders 
                      SET lv_status = @Status 
                      WHERE pick_list_id = @PickListIds
            ";

            await _dataAccess.SaveDataInline(query, new { Status = status, PickListIds = pickListIds });
        }

        public async Task<IEnumerable<SectorCodeDto>> GetSectorCodes(string? orderCode)
        {
            string sql = @"
                SELECT 
                    LV_Location.loc_SectorCode,
                    COUNT(task.tsk_FromLocationCode) AS Location_Count,
                    CAST(SUM(task.tsk_Quantity) AS INT) AS Total_Quantity
                FROM LV_Order AS ord
                LEFT JOIN V_SearchOrderShipmentTask AS task_ship ON task_ship.ord_Code = ord.ord_Code
                LEFT JOIN V_TaskSearch AS task ON task.tsk_ID = task_ship.oss_TaskID
                LEFT JOIN LV_ProgressStatus AS progress ON task.tsk_StatusID = progress.pst_ID
                LEFT JOIN LV_Users AS user_details ON task.tsk_ExpUserID = user_details.usr_ID
                LEFT JOIN LV_Location ON task.tsk_FromLocationID = LV_Location.loc_ID
                WHERE ord.ord_Code = @OrderCode
                    AND LanguageID = 1
                    AND LanguageID1 = 1
                    AND (LanguageID2 = 1 OR LanguageID2 IS NULL)
                    AND (LanguageID3 = 1 OR LanguageID3 IS NULL)
                    AND (LanguageID4 = 1 OR LanguageID4 IS NULL)
                    AND (LanguageID5 = 1 OR LanguageID5 IS NULL)
                    AND (LanguageID6 = 1 OR LanguageID6 IS NULL)
                GROUP BY LV_Location.loc_SectorCode
                ORDER BY LV_Location.loc_SectorCode ASC
            ";

            return await _dataAccess.GetDataInline<SectorCodeDto, dynamic>(sql, new { OrderCode = orderCode });
        }

        public async Task<int> UpdateTasks(string? orderCode, int userId, List<string> fromLocationCodes)
        {
            var fromLocationCodesParam = string.Join(",", fromLocationCodes.Select((x, i) => $"@FromLocationCode{i}"));
            var dynamicParams = new DynamicParameters();
            for (int i = 0; i < fromLocationCodes.Count; i++)
            {
                dynamicParams.Add($"FromLocationCode{i}", fromLocationCodes[i]);
            }
            dynamicParams.Add("OrderCode", orderCode);
            dynamicParams.Add("UserId", userId);

            var sql = $@"
                DECLARE @Login NVARCHAR(50);
                DECLARE @LocCode NVARCHAR(50);
                DECLARE @LocID INT;

                SELECT @Login = usr_Login
                FROM lv_users 
                WHERE usr_id = (
                    SELECT usr_id 
                    FROM lv_users 
                    JOIN com_employee ON usr_personid = emp_personid 
                    WHERE emp_id = @UserId
                );

                SELECT @LocCode = loc_code, @LocID = loc_ID
                FROM lv_location 
                WHERE loc_code = CONCAT('TUL-', @Login);

                UPDATE LV_Task
                SET 
                    tsk_ExpUserID = @UserId,
                    tsk_ToLocationCode = @LocCode,
                    tsk_ToLocationID = @LocID
                FROM LV_Task
                INNER JOIN CUS_V_ParamsForOrdCod2 
                    ON LV_Task.tsk_id = CUS_V_ParamsForOrdCod2.oss_TaskID
                WHERE 
                    CUS_V_ParamsForOrdCod2.ord_Code = @OrderCode
                    AND LV_Task.tsk_statusID = 1
                    AND LV_Task.tsk_FromLocationCode IN ({fromLocationCodesParam});
            ";

            var rowsAffected = await _dataAccess.SaveDataInline(sql, dynamicParams);
            return rowsAffected;
        }

        public async Task<IEnumerable<MantisUser>> GettaskwiseMantisUsers(string customercode)
        {
            var query = @"CUS_SP_TASK_W_MANTIS_USER @customercode";
            var param = new DynamicParameters();
            param.Add("@customercode", customercode);
            return await _dataAccess.GetDataInline<MantisUser, dynamic>(query, param);
        }

        public async Task<NotificationTemplateDto> GetDefaultTemplateByEvent(string eventCode)
        {
            var sql = @"
                SELECT TOP 1 
                    ntg.ntg_ID As TriggerID,
                    ntg.ntg_EventName As EventName,
	                ntg.ntg_IsEnabled As IsEnabled,
                    ntp.ntp_Subject As Subject,
                    ntp.ntp_Body As Body
                FROM Cus_NotificationTemplate ntp
                INNER JOIN Cus_NotificationTrigger ntg 
                    ON ntp.ntp_NotificationTriggerID = ntg.ntg_ID
                WHERE ntg.ntg_EventCode = @EventCode
                AND ntp.ntp_IsDefault = 1
                ORDER BY ntp.ntp_ID DESC
            ";

            var result = await _dataAccess.GetDataInline<NotificationTemplateDto, dynamic>(
                sql,
                new { EventCode = eventCode }
            );

            return result.FirstOrDefault();
        }

        public async Task<ImportedOrder> GetEmailByPicklist(string pick_list_id)
        {
            var query = @"SELECT TOP 1 *
                  FROM Cus_T_ImportedOrders
                  WHERE pick_list_id = @PickListId
                  ORDER BY Id DESC;";

            var result = await _dataAccess.GetDataInline<ImportedOrder, dynamic>(
                query, new { PickListId = pick_list_id });

            return result.FirstOrDefault();
        }

        public async Task<List<ManualEmailResponse>> GetManualEmail(string ModuleName)
        {
            var query = @"SELECT * FROM Cus_NotificationSetting where nst_ModuleName = @ModuleName;";

            var result = await _dataAccess.GetDataInline<ManualEmailResponse, dynamic>(query, new { ModuleName });

            return result.ToList();
        }

        public async Task UpdateNotificationEmail(string moduleName, string? creatorEmail)
        {
            var query = @"UPDATE Cus_NotificationSetting 
                      SET default_Emails = @CreatorEmail 
                      WHERE nst_ModuleName = @ModuleName
            ";

            await _dataAccess.SaveDataInline(query, new { ModuleName = moduleName, CreatorEmail = creatorEmail });

        }

    }
}

