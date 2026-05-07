using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using Dapper;
using Microsoft.AspNetCore.Http.Extensions;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;
using OfficeOpenXml.Style;
using static MiddlewareWebAPI.Data.Model.UrlConstants;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ItemConversionRepository : IItemConversionRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly UrlConstants _urlConstants;

        public ItemConversionRepository(ISqlDataAccess dataAccess, UrlConstants urlConstants)
        {
            _dataAccess = dataAccess;
            _urlConstants = urlConstants;
        }

        public async Task<ItemConversionsResponse> GetGrid(GridRequest request)
        {
            var baseQuery = "FROM Cus_SageX3ToMantisConverion WHERE 1=1";
            var query = "SELECT DISTINCT * " + baseQuery;
            var countQuery = "SELECT COUNT(id) " + baseQuery;

            var parameters = new DynamicParameters();

            // Filters
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrWhiteSpace(filter.Key) && !string.IsNullOrWhiteSpace(filter.Value?.value))
                    {
                        var filterValue = filter.Value.value.Trim().ToLower();
                        if (filterValue == "null")
                        {
                            query += $" AND {filter.Key} IS NULL";
                            countQuery += $" AND {filter.Key} IS NULL";
                        }
                        else
                        {
                            if (filter.Key == "is_kit_item" || filter.Key == "is_ship_item")
                            {
                                if (filterValue == "yes" || filterValue == "true")
                                {
                                    filterValue = "1";
                                }
                                else if (filterValue == "no" || filterValue == "false")
                                {
                                    filterValue = "0";
                                }
                            }

                            string paramName = $"@{filter.Key}";
                            query += $" AND {filter.Key} LIKE {paramName}";
                            countQuery += $" AND {filter.Key} LIKE {paramName}";
                            parameters.Add(paramName, $"%{filterValue}%");
                        }
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
                query += " ORDER BY sku_mantis DESC";
            }

            // Pagination
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            // Execute queries
            var totalRecords = (await _dataAccess.GetDataInline<int,dynamic>(countQuery, parameters)).FirstOrDefault();
            var data = await _dataAccess.GetDataInline<ItemConversions,dynamic>(query, parameters);

            string? templateUrl = _urlConstants.ItemsTemplateUrl;

            return new ItemConversionsResponse { 
                Data = data,
                TotalCount = totalRecords,
                TemplateUrl = templateUrl,
            };

        }

        public async Task<LanesResponse> GetLanesGrid(GridRequest request)
        {
            try
            {
                var query = "SELECT * FROM CUS_Con_Lanes WHERE Is_ErrorLane = 0";
                var count = "SELECT COUNT(id) FROM CUS_Con_Lanes WHERE Is_ErrorLane = 0";

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
                            count += condition; // Apply filter to count query as well

                            parameters.Add(filter.Key, filterValue);
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
                    query += " ORDER BY id ASC";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var result = await _dataAccess.GetDataInline<Lanes, dynamic>(query, parameters);

                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(count, parameters);

                string? templateUrl = _urlConstants.ItemsTemplateUrl;

                return new LanesResponse
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
        public async Task<GetUserResponse> getUserToLane(UserGridRequest request)
        {
            try
            {
                var query = "SELECT * FROM Cus_Lanes as cul JOIN CUS_Conv_LaneUsers " +
                    "AS lu ON lu.lane_id = cul.id JOIN LV_Users AS u ON u.usr_ID = " +
                    "lu.mantis_user_id WHERE cul.id = @lane_id";

                var count = "SELECT COUNT(cul.id) FROM Cus_Lanes as cul JOIN CUS_Conv_LaneUsers " +
                    "AS lu ON lu.lane_id = cul.id JOIN LV_Users AS u ON u.usr_ID = " +
                    "lu.mantis_user_id WHERE cul.id = @lane_id";

                var parameters = new DynamicParameters();
                parameters.Add("lane_id", request.lane_id);
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
                            count += condition; // Apply filter to count query as well

                            parameters.Add(filter.Key, filterValue);
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
                    query += " ORDER BY cul.id DESC";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var result = await _dataAccess.GetDataInline<Laneusers, dynamic>(query, parameters);

                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(count, parameters);

                string? templateUrl = _urlConstants.ItemsTemplateUrl;

                return new GetUserResponse
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
        public async Task<GetUserResponse> GetAllUsers()
        {
            try
            {
                var query = "select usr_ID, usr_Login from  LV_Users order by usr_Login";

                var parameters = new DynamicParameters();

                var result = await _dataAccess.GetDataInline<Laneusers, dynamic>(query, parameters);

                string? templateUrl = _urlConstants.ItemsTemplateUrl;

                return new GetUserResponse
                {
                    data = result
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<IEnumerable<UOMResponse>> GetUOMList(string? sku)
        {
            var sql = @"SELECT DISTINCT unt_Code FROM LV_Product
                INNER JOIN lv_itemunit ON itu_productid = prd_id
                INNER JOIN lv_unit ON itu_unitid = unt_id";

            if (!string.IsNullOrEmpty(sku))
            {
                sql += " WHERE prd_PrimaryCode = @Sku";
            }

            return await _dataAccess.GetDataInline<UOMResponse, dynamic>(sql, new { Sku = sku });
        }

        public async Task<bool> CheckSkuX3Exists(string sku_x3)
        {
            var sql = "SELECT COUNT(1) FROM Cus_SageX3ToMantisConverion WHERE sku_x3 = @SkuX3";
            var count = await _dataAccess.SaveDataReturnInline<int>(sql, new { SkuX3 = sku_x3 });
            return count > 0;
        }

        public async Task UpdateOrCreateItem(AddItemRequest request)
        {
            var existingSql = "SELECT COUNT(1) FROM Cus_SageX3ToMantisConverion WHERE sku_mantis = @sku_mantis";
            var exists = await _dataAccess.SaveDataReturnInline<int>(existingSql, new { request.sku_mantis });

            if (exists > 0)
            {
                var updateSql = @"UPDATE Cus_SageX3ToMantisConverion
                    SET 
                        sku_x3 = @sku_x3,
                        uom_x3 = @uom_x3,
                        uom_mantis = @uom_mantis,
                        is_kit_item = @is_kit_item,
                        is_ship_item = @receiving,
                        receiving = @Receiving,
                        shipping = @shipping
                    WHERE sku_mantis = @sku_mantis";
                await _dataAccess.SaveDataInline(updateSql, request);
            }
            else
            {
                var insertSql = @"
                INSERT INTO Cus_SageX3ToMantisConverion (
                        sku_x3,
                        sku_mantis,
                        uom_x3,
                        uom_mantis,
                        is_kit_item,
                        is_ship_item,
                        receiving,
                        shipping
                )
                    VALUES (
                        @sku_x3,
                        @sku_mantis,
                        @uom_x3,
                        @uom_mantis,
                        @is_kit_item,
                        @is_ship_item,
                        @receiving,
                        @shipping
                    );
                ";
                await _dataAccess.SaveDataInline(insertSql, request);
            }
        }
        public async Task DeleteItem(int id)
        {
            var sql = "DELETE FROM Cus_SageX3ToMantisConverion WHERE id = @Id";
            await _dataAccess.SaveDataInline(sql, new { Id = id });

        }
        public async Task removeUserToLane(DeletelanesRequest request)
        {
         var sql = "DELETE FROM CUS_Conv_LaneUsers WHERE lane_id = @lane_id and mantis_user_id = @user_id";
         await _dataAccess.SaveDataInline(sql, new { lane_id = request.lane_id, user_id = request.user_id});
        }

        public async Task<IEnumerable<ItemConversions>> GetDetail(string? sku_mantis)
        {
            var query = "SELECT * FROM Cus_SageX3ToMantisConverion WHERE sku_mantis = @Sku_mantis ";
            return await _dataAccess.GetFirstDataInline<ItemConversions,dynamic>(query, new { Sku_mantis = sku_mantis });
        }

        public async Task<int> UpdateItem(AddItemRequest request,string? sku_mantis)
        {
            var sql = @"
                UPDATE Cus_SageX3ToMantisConverion
                SET 
                    sku_x3 = @sku_x3,
                    uom_x3 = @uom_x3,
                    uom_mantis = @uom_mantis,
                    shipping = @shipping,
                    receiving = @receiving,
                    is_kit_item = @is_kit_item,
                    is_ship_item = @is_ship_item
                WHERE sku_mantis = @sku_mantis";

            var parameters = new DynamicParameters(request);
            parameters.Add("sku_mantis", sku_mantis);

            return await _dataAccess.SaveDataInline(sql, parameters);
        }
        public async Task<int> addUserToLane(AddUsersRequest request)
      
        {
            var existingSql = "SELECT COUNT(1) FROM CUS_Conv_LaneUsers WHERE lane_id = @lane_id and mantis_user_id = @mantis_user_id";
            var exists = await _dataAccess.SaveDataReturnInline<int>(existingSql, new {lane_id = request.lane_id, mantis_user_id = request.user_id });

            if (exists == 0)
            {
                    var insertSql = @"
                     INSERT INTO CUS_Conv_LaneUsers (
                        lane_id,
                        mantis_user_id
                    )
                    VALUES (
                        @lane_id,
                        @user_id
                    ); ";
                return await _dataAccess.SaveDataInline(insertSql, request);
                 
            }
            return 1;
        }
        
        public async Task<ResponseResult> UpdateItems(List<ItemConversions> items)
        {
            var excelJson = JsonConvert.SerializeObject(items);

            var parameters = new DynamicParameters();
            parameters.Add("@ExcelJson", excelJson);
            parameters.Add("@RetResult", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);
            parameters.Add("@RetError", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);

            try
            {
                await _dataAccess.SaveData("[dbo].[Cus_Sp_UploadItemsFromExcelJson_v1]", parameters);

                string result = parameters.Get<string>("@RetResult");
                string error = parameters.Get<string>("@RetError");

                if (!string.IsNullOrWhiteSpace(error))
                {
                    return new ResponseResult
                    {
                        Error = 1,
                        Message = error
                    };
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = result
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Internal error while uploading: " + ex.Message
                };
            }
        }

    }
}
