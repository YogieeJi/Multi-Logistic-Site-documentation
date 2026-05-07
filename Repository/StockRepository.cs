using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using static Hangfire.Storage.JobStorageFeatures;

namespace MiddlewareWebAPI.Data.Repository
{
    public class StockRepository : IStockRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public StockRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<StockServiceResponse> GetCustomerAttributes(GridRequest request)
        {
            try
            {
                var whereClause = "WHERE 1=1";
                var parameters = new DynamicParameters();

                // Handle Filters
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            string filterValue = $"%{filter.Value?.value}%";
                            whereClause += $" AND {filter.Key} LIKE @{filter.Key}";
                            parameters.Add(filter.Key, filterValue);
                        }
                    }
                }

                // Main query (filters applied before GROUP BY)
                var baseQuery = $@"
                     SELECT 
                     vsc.cus_Code,
                     MAX(LV_CustomerAttributeValues.ctv_value) AS ctv_value,
                     MAX(vsc.cus_ID) AS cus_ID,
                     MAX(vsc.CustomerFullName) AS CustomerFullName,
                     MAX(LV_OrderType.ort_Description) AS ort_Description,
                     MAX(o.order_type) AS order_type
                     FROM V_SearchCustomer AS vsc
                     LEFT JOIN LV_CustomerAttributeValues ON LV_CustomerAttributeValues.ctv_CustomerID = vsc.cus_ID
                     LEFT JOIN LV_OrderType ON LV_OrderType.ort_Code = LV_CustomerAttributeValues.ctv_value
                     LEFT JOIN Cus_T_ImportedOrders AS c ON c.customer_code = vsc.cus_Code
                     LEFT JOIN Cus_OrderType AS o ON o.id = c.order_type
                    {whereClause}
                     GROUP BY vsc.cus_Code";

                // Count query
                var countQuery = $"SELECT COUNT(*) FROM ({baseQuery}) AS countQuery";

                // Sorting
                string sortField = !string.IsNullOrEmpty(request.sortField) ? request.sortField : "cus_ID";
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";

                // Pagination (only works SQL Server 2012+)
                var paginatedQuery = $@"
                {baseQuery}
               ORDER BY {sortField} {sortOrder}
               OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<StockServiceDto, dynamic>(paginatedQuery, parameters);

                // Fetch Total Count
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new StockServiceResponse
                {
                    error = 0,
                    Data = result,
                    TotalRecords = totalCount.FirstOrDefault(),
                    message = "Success"
                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<OrderTypesResponse> GetOrderTypes()
        {
            try
            {
                var query = "SELECT ort_Code, ort_Description FROM LV_OrderType";
                var result = await _dataAccess.GetDataInline<OrderTypesDto, dynamic>(query, new { });
                return new OrderTypesResponse
                {
                    Data = result,
                };
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task<string?> GetExistingOrderType(string cusCode)
        {
            try
            {
                var sql = "SELECT order_type FROM Cus_T_ImportedOrders WHERE customer_code = @CusCode";
                var result = (await _dataAccess.GetDataInline<string?, dynamic>(sql, new { CusCode = cusCode })).FirstOrDefault();
                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<bool> UpdateOrderType(string cusCode, string? orderType)
        {
            try
            {
                var sql = "UPDATE Cus_T_ImportedOrders SET order_type = @OrderType WHERE customer_code = @CusCode";
                var result = await _dataAccess.SaveDataInline(sql, new { CusCode = cusCode, OrderType = orderType });
                return result > 0;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<int?> GetExistingAttributeId(int cusId, int attrId, int domainId)
        {
            try
            {
                var sql = @"SELECT ctv_ID FROM LV_CustomerAttributeValues 
                          WHERE ctv_CustomerID = @CusId AND ctv_AttributeID = @AttrId AND ctv_DomainID = @DomainId";
                var result = (await _dataAccess.GetDataInline<int?, dynamic>(sql, new { CusId = cusId, AttrId = attrId, DomainId = domainId })).FirstOrDefault();
                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<bool> UpdateAttributeValue(int ctvId, string orderId)
        {
            try
            {
                var sql = "UPDATE LV_CustomerAttributeValues SET ctv_value = @OrderId WHERE ctv_ID = @CtvId";
                return await _dataAccess.SaveDataInline(sql, new { OrderId = orderId, CtvId = ctvId }) > 0;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<int> GetNextSequenceId(string fieldName)
        {
            try
            {
                var parameters = new DynamicParameters();
                parameters.Add("@seqfield", fieldName);
                parameters.Add("@total", 1);
                parameters.Add("@result", dbType: DbType.Int32, direction: ParameterDirection.Output);
                var result = await _dataAccess.SaveDataWithReturn("[dbo].[sp_GetNextID]", parameters);

                int ctv_ID = parameters.Get<int>("@result");
                return ctv_ID;
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<bool> InsertAttribute(int ctvId, int cusId, int attrId, int domainId, string orderId)
        {
            try
            {
                var sql = @"
            INSERT INTO LV_CustomerAttributeValues 
                (ctv_ID, ctv_CustomerID, ctv_AttributeID, ctv_value, ctv_DomainID)
            VALUES 
                (@CtvId, @CusId, @AttrId, @OrderId, @DomainId);";

                var result = await _dataAccess.SaveDataInline(sql, new
                {
                    CtvId = ctvId,
                    CusId = cusId,
                    AttrId = attrId,
                    OrderId = orderId,
                    DomainId = domainId
                });

                return result > 0;
            }
            catch (Exception)
            {
                
                throw;
            }
        }

    }
}

