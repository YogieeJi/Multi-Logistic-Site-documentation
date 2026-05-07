using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Http;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class OrderReallocationRepository : IOrderReallocationRepository
    {
        public ISqlDataAccess _dataAccess;
        public OrderReallocationRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }
        public async Task<OrdersReponse> GetOrders(GridRequest request)
        {
            try
            {
                var baseSql = @"
                    SELECT ord_ID, ord_Code, ord_CustomerOrderCode, ord_InputDate, ord_StatusID, ord_LineCount
                    FROM LV_Order
                ";

                var allowedSortFields = new[]
                {
                    "ord_ID", "ord_Code", "ord_CustomerOrderCode", "ord_InputDate", "ord_StatusID", "ord_LineCount"
                };

                var sortField = allowedSortFields.Contains(request.sortField) ? request.sortField : "ord_ID";
                var sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";

                var whereClause = new StringBuilder("WHERE ord_StatusID = 2");
                var parameters = new DynamicParameters();

                if (request.filters != null)
                {
                    foreach (var kvp in request.filters)
                    {
                        var key = kvp.Key;
                        var value = kvp.Value?.value;

                        if (string.IsNullOrWhiteSpace(value)) continue;

                        if (key.Equals("ord_InputDate", StringComparison.OrdinalIgnoreCase))
                        {
                            var paramName = "@ord_InputDate";
                            whereClause.Append($" AND CAST(ord_InputDate AS DATE) = {paramName}");

                            if (DateTime.TryParse(value.Replace("T", " "), out var parsedDate))
                                parameters.Add(paramName, parsedDate.Date);
                            else
                                throw new Exception($"Invalid ord_InputDate value: {value}");
                        }
                        else if (key.Equals("ord_InputDate_from", StringComparison.OrdinalIgnoreCase))
                        {
                            var paramName = "@ord_InputDate_from";
                            whereClause.Append($" AND ord_InputDate >= {paramName}");
                            if (DateTime.TryParse(value.Replace("T", " "), out var parsedFrom))
                                parameters.Add(paramName, parsedFrom);
                            else
                                throw new Exception($"Invalid ord_InputDate_from value: {value}");
                        }
                        else if (key.Equals("ord_InputDate_to", StringComparison.OrdinalIgnoreCase))
                        {
                            var paramName = "@ord_InputDate_to";
                            whereClause.Append($" AND ord_InputDate <= {paramName}");
                            if (DateTime.TryParse(value.Replace("T", " "), out var parsedTo))
                                parameters.Add(paramName, parsedTo);
                            else
                                throw new Exception($"Invalid ord_InputDate_to value: {value}");
                        }
                        else
                        {
                            var paramName = $"@{key}";
                            whereClause.Append($" AND {key} LIKE {paramName}");
                            parameters.Add(paramName, $"%{value}%");
                        }
                    }
                }

                // Pagination parameters
                parameters.Add("@Offset", request.first);
                parameters.Add("@Fetch", request.rows);

                var finalSql = $@"
                    {baseSql} {whereClause}
                    ORDER BY {sortField} {sortOrder}
                    OFFSET @Offset ROWS FETCH NEXT @Fetch ROWS ONLY;

                    SELECT COUNT(ord_ID) FROM LV_Order {whereClause};
                ";

                var (data, total) = await _dataAccess.GetDataInlineWithCount<Orders, DynamicParameters>(finalSql, parameters);

                return new OrdersReponse
                {
                    Data = data,
                    TotalRecords = total,
                    Error = 0,
                };
            }
            catch (Exception ex)
            {
                return new OrdersReponse
                {
                    Error = 1,
                    Message = $"Internal Server Error | {ex.InnerException?.Message ?? ex.Message}"
                };
            }
        }

        public async Task<OrderShipItemsReponse> GetOrderShipItems(OrderItemsGridRequest request)
        {
            try
            {
                var page = request.page;
                var rows = request.rows;
                var skip = request.first;
                var sortField = !string.IsNullOrEmpty(request.sortField) ? request.sortField : "osi.osi_ID";
                var sortType = (request.sortOrder == "1") ? "ASC" : "DESC";

                var filterClauses = new List<string>();
                var parameters = new DynamicParameters();
                parameters.Add("@code", request.Code);

                if (request.filters != null)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Value?.value))
                        {
                            var key = filter.Key.Replace(".", "_");
                            filterClauses.Add($"{filter.Key} LIKE @{key}");
                            parameters.Add($"@{key}", $"%{filter.Value.value}%");
                        }
                    }
                }

                var filterSql = filterClauses.Count > 0 ? " AND " + string.Join(" AND ", filterClauses) : "";

                var baseSql = $@"
                    FROM LV_Order o
                    JOIN LV_OrderItem oi ON o.ord_ID = oi.ori_OrderID
                    JOIN LV_Product p ON oi.ori_ProductID = p.prd_ID
                    JOIN LV_ProductLang prdl ON p.prd_ID = prdl.prdl_ProductID
                    JOIN LV_OrderShipItem osi ON osi.osi_OrderItemID = oi.ori_ID
                    JOIN V_OrderStatus ON osi.osi_StatusID = V_OrderStatus.ors_ID AND V_OrderStatus.LanguageID = 1
                    WHERE o.ord_Code = @code AND V_OrderStatus.Status IN ('pending', 'For picking')
                    {filterSql}
                ";

                var countSql = $"SELECT COUNT(*) {baseSql}";
                var totalRecords = await _dataAccess.GetDataReturnInline<int>(countSql, parameters);

                var dataSql = $@"
                    SELECT 
                        osi.osi_ID AS OrderShipItemId,
                        p.prd_PrimaryCode AS ProductCode,
                        CAST(osi.osi_Quantity AS INT) AS Quantity,
                        V_OrderStatus.Status AS OrderStatus,
                        oi.ori_ProductID AS ProductId,
                        prdl.prdl_Description AS ProductDescription
                    {baseSql}
                    ORDER BY {sortField} {sortType}
                    OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY
                ";

                parameters.Add("@Skip", skip);
                parameters.Add("@Rows", rows);

                var data = await _dataAccess.GetDataInline<OrderShipItemsModel,dynamic>(dataSql, parameters);

                return new OrderShipItemsReponse
                {
                    Error = 0,
                    Data = data,
                    TotalRecords = totalRecords,
                    Message = "Successfully fetched order ship items"
                };
            }
            catch (Exception ex)
            {
                return new OrderShipItemsReponse
                {
                    Error = 1,
                    Message = $"Error while fetching order ship items: {ex.Message}"
                };
            }
        }
    }
}
