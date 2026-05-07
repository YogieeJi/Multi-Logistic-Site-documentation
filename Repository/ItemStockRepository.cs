using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using iText.Layout.Borders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ItemStockRepository : IItemStockRepository
    {

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ISqlDataAccess _dataAccess { get; }
        public ItemStockRepository(ISqlDataAccess dataAccess, HttpClient httpClient, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _httpClient = httpClient;
            _configuration = configuration;
        }
        public async Task<ItemStockResponse> GetItemStock(GridRequest request)
        {
            try
            {
                var parameters = new DynamicParameters();

                // SAME SQL AS SQL SERVER
                var rawQuery = @"
                           SELECT 
                        V_StockSearch.*, 
                        ISNULL(Attributes0.sav_value, '') AS LotNum, 
                        ISNULL(Attributes0.OriginalValue, '') AS LotNum_OV, 
                        CONVERT(real, CONVERT(NUMERIC(18,3), Attributes1.sav_value)) AS SublotNum, 
                        ISNULL(Attributes1.OriginalValue, '') AS SublotNum_OV, 
                        CONVERT(real, CONVERT(NUMERIC(18,3), Attributes2.sav_value)) AS ExpiryDate, 
                        ISNULL(Attributes2.OriginalValue, '') AS ExpiryDate_OV, 
                        CONVERT(real, CONVERT(NUMERIC(18,3), Attributes3.sav_value)) AS MfgDate, 
                        ISNULL(Attributes3.OriginalValue, '') AS MfgDate_OV,
                        b.exp_date, 
                        b.first_receipt_date
                    FROM V_StockSearch

                    LEFT JOIN (
                        SELECT 
                            sav_stockID, 
                            sav_Value, 
                            sav_AttributeID, 
                            sav_Value AS OriginalValue 
                        FROM LV_StockAttributesValues 
                        WHERE sav_AttributeID = 1
                    ) AS Attributes0 
                        ON V_StockSearch.spt_stockID = Attributes0.sav_StockID

                    LEFT JOIN (
                        SELECT 
                            sav_stockID, 
                            sav_Value, 
                            sav_AttributeID, 
                            sav_Value AS OriginalValue 
                        FROM LV_StockAttributesValues 
                        WHERE sav_AttributeID = 2
                    ) AS Attributes1 
                        ON V_StockSearch.spt_stockID = Attributes1.sav_StockID

                    LEFT JOIN (
                        SELECT 
                            sav_stockID, 
                            sav_Value, 
                            sav_AttributeID, 
                            sav_Value AS OriginalValue 
                        FROM LV_StockAttributesValues 
                        WHERE sav_AttributeID = 3
                    ) AS Attributes2 
                        ON V_StockSearch.spt_stockID = Attributes2.sav_StockID

                    LEFT JOIN (
                        SELECT 
                            sav_stockID, 
                            sav_Value, 
                            sav_AttributeID, 
                            sav_Value AS OriginalValue 
                        FROM LV_StockAttributesValues 
                        WHERE sav_AttributeID = 4
                    ) AS Attributes3 
                        ON V_StockSearch.spt_stockID = Attributes3.sav_StockID

                    LEFT JOIN (
                        SELECT DISTINCT 
                            item, 
                            lot_number, 
                            ISNULL(exp_date, '') AS exp_date, 
                            ISNULL(first_receipt_date, '') AS first_receipt_date 
                        FROM Cus_T_ItemsLotExp WITH (NOLOCK)
                    ) AS b 
                        ON V_StockSearch.prd_PrimaryCode = b.item
                        AND Attributes0.sav_Value = b.lot_number

                    WHERE 
                        (LanguageID = 1 OR LanguageID IS NULL)
                        AND LanguageID1 = 1
                        AND LanguageID2 = 1
                        AND (LanguageID3 = 1 OR LanguageID3 IS NULL)
                        AND loc_Code != 'MISC'
                        AND LanguageID4 = 1
                        AND LogisticSiteID = 5
                        AND stk_LogisticUnitID = 9

                 ";

                // Wrap for filtering
                var baseQuery = $"SELECT * FROM ({rawQuery}) AS FilteredBase WHERE 1=1";

                string fallbackSortField = null;

                // PARTIAL FILTER HANDLING (LIKE)
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        var col = filter.Key;
                        var val = filter.Value?.value;

                        if (!string.IsNullOrWhiteSpace(col) && !string.IsNullOrWhiteSpace(val))
                        {
                            //  Partial search
                            baseQuery += $" AND CAST([{col}] AS NVARCHAR(255)) LIKE @{col}";
                            parameters.Add($"@{col}", $"%{val}%");

                            if (fallbackSortField == null)
                            {
                                fallbackSortField = col;
                                parameters.Add($"{fallbackSortField}_exact", val);
                            }
                        }
                    }
                }

                // Count query
                var countQuery = $"SELECT COUNT(*) FROM ({baseQuery}) AS CountQuery";

                //// SORTING LIKE SQL
                //if (!string.IsNullOrWhiteSpace(request.sortField) && request.sortOrder != "0")
                //{
                //    var orderDir = request.sortOrder == "1" ? "ASC" : "DESC";
                //    baseQuery += $" ORDER BY [{request.sortField}] {orderDir}";
                //}
                //else if (!string.IsNullOrEmpty(fallbackSortField))
                //{
                //    baseQuery += $@"
                //     ORDER BY 
                //     CASE WHEN [{fallbackSortField}] = @{fallbackSortField}_exact THEN 0 ELSE 1 END,
                //    [{fallbackSortField}] ASC
                //   ";
                //}
                //else
                //{
                //    baseQuery += " ORDER BY spt_ID DESC";
                //}
                // SORTING LIKE SQL
                if (!string.IsNullOrWhiteSpace(request.sortField) && request.sortOrder != "0")
                {
                    var orderDir = request.sortOrder == "1" ? "ASC" : "DESC";

                    //  CHANGE: add stable tie-breaker so row order doesn't jump after update
                    baseQuery += $" ORDER BY FilteredBase.[{request.sortField}] {orderDir}, FilteredBase.spt_ID DESC";
                }
                else if (!string.IsNullOrEmpty(fallbackSortField))
                {
                    //  CHANGE: add stable tie-breaker so order remains consistent
                    // ✅ CHANGE: qualify columns so SQL does not re-order due to VIEW expansion
                    baseQuery += $@"
                        ORDER BY 
                        CASE WHEN FilteredBase.[{fallbackSortField}] = @{fallbackSortField}_exact THEN 0 ELSE 1 END,
                        FilteredBase.[{fallbackSortField}] ASC,
                        FilteredBase.spt_ID DESC
                        ";

                }
                else
                {
                    // default stable order
                    //  CHANGE: fully qualify column to enforce sorting from the outer query
                    baseQuery += " ORDER BY FilteredBase.spt_ID DESC";
                }


                // Pagination
                baseQuery += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Execute
                var result = await _dataAccess.GetDataInline<ItemStock, dynamic>(baseQuery, parameters);
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new ItemStockResponse
                {
                    data = result,
                    totalRecords = totalCount.FirstOrDefault()
                };
            }
            catch (Exception ex)
            {
                return new ItemStockResponse
                {
                    data = new List<ItemStock>(),
                    totalRecords = 0,
                    message = ex.Message
                };
            }
        }
        
        public async Task<StockReserveReasonsResponse> GetStockReserveReasons()
        {
            var query = "SELECT * FROM LV_StockReserveReason";
            var result = await _dataAccess.GetDataInline<StockReserveReasons, dynamic>(query, new { });
            return new StockReserveReasonsResponse
            {
                error = 0,
                data = result
            };
        }
    }

}

