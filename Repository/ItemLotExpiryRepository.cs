using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Dapper;
using iText.StyledXmlParser.Jsoup.Select;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ItemLotExpiryRepository : IItemLotExpiryRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        public ItemLotExpiryRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        //public async Task<ItemLotExpiryResponse> GetGrid(GridRequest request)
        //{
        //    try
        //    {
        //        var baseQuery = @"
        //SELECT DISTINCT
        //    Cus_T_ItemsLotExp.id,
        //    LV_Product.prd_PrimaryCode,
        //    LV_StockAttributesValues.sav_Value,
        //    CONVERT(VARCHAR, CAST(Cus_T_ItemsLotExp.exp_date AS DATE), 120) AS exp_date,
        //    CONVERT(VARCHAR, CAST(Cus_T_ItemsLotExp.first_receipt_date AS DATE), 120) AS first_receipt_date
        //FROM LV_Product
        //JOIN lv_stock ON lv_stock.stk_productid = LV_Product.prd_ID
        //JOIN LV_StockAttributesValues ON LV_StockAttributesValues.sav_StockID = lv_stock.stk_id
        //LEFT JOIN Cus_T_ItemsLotExp
        //    ON Cus_T_ItemsLotExp.item = LV_Product.prd_PrimaryCode
        //    AND Cus_T_ItemsLotExp.lot_number = LV_StockAttributesValues.sav_Value
        //WHERE 1=1
        //GROUP BY
        //    Cus_T_ItemsLotExp.id,
        //    LV_Product.prd_PrimaryCode,
        //    LV_StockAttributesValues.sav_Value,
        //    CONVERT(VARCHAR, CAST(Cus_T_ItemsLotExp.exp_date AS DATE), 120),
        //    CONVERT(VARCHAR, CAST(Cus_T_ItemsLotExp.first_receipt_date AS DATE), 120)";

        //        var parameters = new DynamicParameters();
        //        var filterConditions = new StringBuilder();

        //        if (request.filters != null && request.filters.Count > 0)
        //        {
        //            foreach (var filter in request.filters)
        //            {
        //                if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
        //                {
        //                    string filterValue = $"%{filter.Value.value}%";
        //                    filterConditions.Append($" AND {filter.Key} LIKE @{filter.Key}");
        //                    parameters.Add(filter.Key, filterValue);
        //                }
        //            }
        //        }

        //        var query = baseQuery + filterConditions.ToString();

        //        if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
        //        {
        //            string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
        //            query += $" ORDER BY {request.sortField} {sortOrder}";
        //        }
        //        else
        //        {
        //            query += " ORDER BY prd_PrimaryCode DESC";
        //        }

        //        query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
        //        parameters.Add("@Skip", request.first);
        //        parameters.Add("@Rows", request.rows);

        //        var countQuery = $"SELECT COUNT(*) FROM ({baseQuery + filterConditions.ToString()}) AS sub";

        //        var result = await _dataAccess.GetDataInline<ItemLotExpiry, dynamic>(query, parameters);
        //        var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

        //        return new ItemLotExpiryResponse
        //        {
        //            data = result,
        //            totalRecords = totalCount.FirstOrDefault(),
        //            message = "Successful"
        //        };
        //    }
        //    catch (Exception)
        //    {
        //        throw;
        //    }
        //}

        public async Task<ItemLotExpiryResponse> GetGrid(GridRequest request)
        {
            try
            {
                var parameters = new DynamicParameters();

                // Map UI filter keys to SQL columns
                var filterColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    //["item"] = "p.prd_PrimaryCode",
                    ["prd_PrimaryCode"] = "p.prd_PrimaryCode",
                    ["lot_number"] = "sav.sav_Value",
                    ["sav_Value"] = "sav.sav_Value",
                    ["exp_date"] = "ile.exp_date",                  // use raw DATE
                    ["first_receipt_date"] = "ile.first_receipt_date"
                };

                var sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    //["item"] = "prd_PrimaryCode",
                    ["prd_PrimaryCode"] = "prd_PrimaryCode",
                    ["lot_number"] = "sav_Value",
                    ["exp_date"] = "exp_date",
                    ["first_receipt_date"] = "first_receipt_date"
                };

                // WHERE clause
                var whereBuilder = new StringBuilder("WHERE 1=1");
                if (request?.filters != null && request.filters.Count > 0)
                {
                    int idx = 0;
                    foreach (var kv in request.filters)
                    {
                        var key = kv.Key;
                        var filterObj = kv.Value;
                        var filterVal = filterObj?.value?.ToString();
                        if (string.IsNullOrWhiteSpace(filterVal))
                            continue;

                        if (!filterColumns.TryGetValue(key, out var sqlCol))
                            continue;

                        var pname = $"f{idx++}";

                        if (key.Equals("exp_date", StringComparison.OrdinalIgnoreCase) ||
                            key.Equals("first_receipt_date", StringComparison.OrdinalIgnoreCase))
                        {
                            // Treat filter value as date
                            whereBuilder.Append($" AND CAST({sqlCol} AS date) = @{pname}");
                            parameters.Add(pname, DateTime.Parse(filterVal));
                        }
                        else
                        {
                            // For text, use exact match instead of LIKE
                            whereBuilder.Append($" AND {sqlCol} = @{pname}");
                            parameters.Add(pname, filterVal);
                        }
                    }
                }

                // Base CTE (apply filters here, before dedup)
                string baseCte = $@"
            WITH base AS (
                SELECT 
                    ile.id,
                    p.prd_PrimaryCode,
                    sav.sav_Value,
                    CONVERT(varchar(10), CAST(ile.exp_date AS date), 120)          AS exp_date,
                    CONVERT(varchar(10), CAST(ile.first_receipt_date AS date), 120) AS first_receipt_date
                FROM LV_Product p
                JOIN lv_stock s                   ON s.stk_productid = p.prd_ID
                JOIN LV_StockAttributesValues sav ON sav.sav_StockID = s.stk_id
                LEFT JOIN Cus_T_ItemsLotExp ile
                    ON ile.item       = p.prd_PrimaryCode
                   AND ile.lot_number = sav.sav_Value
                {whereBuilder}   --  filters applied here
            ),
            dedup AS (
                SELECT DISTINCT id, prd_PrimaryCode, sav_Value, exp_date, first_receipt_date
                FROM base
            )";

                // Count query
                string countSql = baseCte + @"
            SELECT COUNT(*) FROM dedup;";

                // Sorting
                string sortFieldSql;
                if (!string.IsNullOrWhiteSpace(request?.sortField) &&
                    sortColumns.TryGetValue(request.sortField, out var mapped))
                    sortFieldSql = mapped;
                else
                    sortFieldSql = "prd_PrimaryCode";

                string sortDir = (request?.sortOrder == "1") ? "ASC" : "DESC";

                // Paging
                int skip = request?.first ?? 0;
                int rows = request?.rows ?? 10;
                parameters.Add("Skip", skip);
                parameters.Add("Rows", rows);

                // Data query
                string dataSql = $@"
            {baseCte}
            SELECT id, prd_PrimaryCode, sav_Value, exp_date, first_receipt_date
            FROM dedup
            ORDER BY {sortFieldSql} {sortDir}
            OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY;";

                var data = await _dataAccess.GetDataInline<ItemLotExpiry, dynamic>(dataSql, parameters);
                var totalList = await _dataAccess.GetDataInline<int, dynamic>(countSql, parameters);
                int total = totalList?.FirstOrDefault() ?? 0;

                return new ItemLotExpiryResponse
                {
                    data = data,
                    totalRecords = total,
                    message = "Successful"
                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ItemLotExpiryDetailResponse> GetDetail(int id)
        {
            var query = "SELECT id,warehouse,item,lot_number,exp_date,first_receipt_date FROM Cus_T_ItemsLotExp where Id=@id ";
            var result = (await _dataAccess.GetDataInline<ItemLotExpiryDetail, dynamic>(query, new { Id = id })).FirstOrDefault();
            return new ItemLotExpiryDetailResponse
            {
                data = result,

            };

        }

        public async Task<EditItemLotExpiryResponse> GetLVProducts()
        {
            try
            {
                var query = "SELECT prd_ID, prd_PrimaryCode FROM LV_Product";
                var result = await _dataAccess.GetDataInline<EditItemLotExpiry, dynamic>(query, new { });

                return new EditItemLotExpiryResponse
                {
                    error = 0,
                    data = result,
                    message = "Data fetched Successfully"
                };
            }
            catch (Exception ex)
            {
                return new EditItemLotExpiryResponse
                {
                    error = 1,
                    message = "Database error | " + ex.Message
                };

            }
        }

        public async Task<bool> Update(UpdateItemLotExpiryRequest request,int id)
        {
            try
            {
                var sql = @"UPDATE Cus_T_ItemsLotExp SET 
                    exp_date = @Exp_Date,
                    first_receipt_date = @First_Receipt_Date,
                    item = @Item,
                    lot_number = @Lot_Number,
                    warehouse = @Warehouse
                   WHERE id = @Id";
                var result = await _dataAccess.SaveDataInline<dynamic>(sql, new
                {
                    Exp_Date = request.exp_date,
                    first_Receipt_Date = request.first_receipt_date,
                    Item = request.item,
                    Lot_Number = request.lot_number,
                    Warehouse = request.warehouse,
                    Id = id
                });
                return result > 0;
            }
            catch (Exception)
            {
                throw;
            }


        }

        public async Task<bool> Add(AddItemLotExpiryRequest request)
        {
            try
            {
                var checkQuery = @"
                SELECT COUNT(1)
                FROM Cus_T_ItemsLotExp
                WHERE item = @Item
                  AND lot_number = @LotNumber
               ";

                var exists = await _dataAccess.GetDataInline<int, dynamic>(checkQuery, new
                {
                    Item = request.item,
                    LotNumber = request.lot_number
                });

                if (exists.FirstOrDefault() > 0)
                {
                    throw new Exception("An entry with the same Item and Lot Number already exists.");
                }

                var query = @"
                    INSERT INTO Cus_T_ItemsLotExp (exp_date, first_receipt_date, item, lot_number, warehouse)
                    VALUES (@ExpDate, @FirstReceiptDate, @Item, @LotNumber, @Warehouse)
                ";

                var result = await _dataAccess.SaveDataInline<dynamic>(query, new
                {
                    ExpDate = request.exp_date,
                    FirstReceiptDate = request.first_receipt_date?.ToString("yyyy-MM-dd"),
                    Item = request.item,
                    LotNumber = request.lot_number,
                    Warehouse = request.warehouse
                });

                return result > 0;
            }
            catch
            {
                throw;
            }
        }
    }
}



