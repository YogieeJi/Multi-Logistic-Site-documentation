using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class OrderRepository : IOrderRepository
    {
        public ISqlDataAccess _dataAccess;
        public OrderRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<OrderDetailResponse> GetOrderDetail(OrderDetailRequest request)
        {
            try
            {
                var prdIdQuery = "SELECT prd_ID FROM LV_Product WITH (NOLOCK) WHERE prd_PrimaryCode = @PrimaryCode";
                var prdId = await _dataAccess.GetDataReturnInline<int?>(prdIdQuery, new { PrimaryCode = request.primary_code });

                if (prdId == null)
                {
                    return new OrderDetailResponse
                    {
                        Error = 1,
                        Message = "Product not found",
                    };
                }

                var sql = @"
                    SELECT
                        LV_Location.loc_Code,
                        CAST(V_StockSearch.SPTQuantity AS INT) AS SPTQuantity,
                        CAST(V_StockSearch.SPTQuantityFree AS INT) AS SPTQuantityFree,
                        ISNULL(Attributes0.sav_value, '') AS LotNum,
                        ISNULL(LV_StockReserveReason.srr_Description, '') AS ReserveReasonDescr,
                        ISNULL(b.exp_date, '') AS Exp_Date
                    FROM V_StockSearch WITH (NOLOCK)
                    LEFT JOIN (
                        SELECT sav_stockID, sav_Value
                        FROM LV_StockAttributesValues WITH (NOLOCK)
                        WHERE sav_AttributeID = 1
                    ) AS Attributes0 ON V_StockSearch.spt_stockID = Attributes0.sav_stockID
                    LEFT JOIN (
                        SELECT DISTINCT item, lot_number,
                            ISNULL(exp_date, '') AS exp_date
                        FROM Cus_T_ItemsLotExp WITH (NOLOCK)
                    ) AS b ON V_StockSearch.prd_PrimaryCode = b.item
                         AND Attributes0.sav_Value = b.lot_number
                    LEFT JOIN LV_Location ON LV_Location.loc_ID = V_StockSearch.stk_LocationID
                    LEFT JOIN LV_StockReserveReason ON LV_StockReserveReason.srr_ID = V_StockSearch.stk_ReserveReasonID
                    WHERE 
                        (V_StockSearch.LanguageID = 1 OR V_StockSearch.LanguageID IS NULL)
                        AND V_StockSearch.LanguageID1 = 1
                        AND V_StockSearch.LanguageID2 = 1
                        AND (V_StockSearch.LanguageID3 = 1 OR V_StockSearch.LanguageID3 IS NULL)
                        AND V_StockSearch.LanguageID4 = 1
                        AND V_StockSearch.stk_ProductID = @PrdID
                        AND V_StockSearch.LogisticSiteID = 5
                        AND V_StockSearch.stk_LogisticUnitID = 9
                        AND V_StockSearch.stk_LocationID <> 22479
                    ORDER BY V_StockSearch.spt_ID;
                ";

                var rows = await _dataAccess.GetDataInline<OrderDetailRow, dynamic>(sql, new { PrdID = prdId });

                if (rows == null || !rows.Any())
                {
                    return new OrderDetailResponse
                    {
                        Error = 1,
                        Message = "Product not found",
                        Data = Enumerable.Empty<OrderDetailRow>()
                    };
                }

                return new OrderDetailResponse
                {
                    Error = 0,
                    Message = "Success",
                    Data = rows
                };
            }
            catch (Exception ex)
            {
                return new OrderDetailResponse { Error = 1, Message = $"Internal Server Error | {ex.Message}" };
            }
        }

    }
}
