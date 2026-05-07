using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using iText.Kernel.Geom;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class TruckRepository : ITruckRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        public TruckRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<IEnumerable<TrucksList>> GetTruckList()
        {
            const string sql = @"
                SELECT DISTINCT TruckRef FROM [dbo].[cus_T_TruckLPNList]; 
            ";
            //WHERE(@Search IS NULL OR TruckRef LIKE '%' + @Search + '%')
            //    GROUP BY TruckRef;
            return await _dataAccess.GetDataInline<TrucksList,dynamic>(sql, new { });
        }

        public async Task<IEnumerable<AllTrucksDetails>> GetAllTrucksDetails()
        {
            var query = @"
                SELECT stk_ID,
                       TruckRef AS TRUCK, 
                       loc_Code AS LOCATION, 
                       stc_SSCC AS LPN, 
                       prd_PrimaryCode AS SKU, 
                       sav_Value AS LOT, 
                       spt_Quantity AS QTY_OF_UOM,
                       unt_Code AS UOM,
                       CONVERT(INT, spt_CUQuantity / spt_Quantity) AS UOM_QTY,
                       stk_CUQuantity AS CU_UNITS, 
                       ISNULL(unr_Description, '') AS UNSUITABLE
                FROM LV_Stock
                JOIN LV_Product ON stk_ProductID = prd_ID
                JOIN LV_Location ON stk_LocationID = loc_ID
                JOIN LV_StockContainer ON stk_ContainerID = stc_ID
                LEFT JOIN LV_StockAttributesValues ON stk_ID = sav_StockID AND sav_AttributeID = 1
                LEFT JOIN cus_T_TruckLPNList ON stc_SSCC = LPN
                JOIN LV_StockPackType ON stk_ID = spt_StockID
                JOIN LV_ItemUnit ON spt_ItemUnitID = itu_ID
                JOIN LV_Unit ON itu_UnitID = unt_ID
                LEFT JOIN LV_UnsuitabilityReason ON stk_UnsuitReasonID = unr_ID
                WHERE spt_parentID IS NULL
                ORDER BY TruckRef, loc_Code, LPN
            ";

            return await _dataAccess.GetDataInline<AllTrucksDetails,dynamic>(query, new {});
        }

        public async Task<IEnumerable<TruckDetail>> GetTruckDetail(string? Truck_ref)
        {
            var queryaData = @"
                SELECT 
                    TruckRef AS TRUCK,
                    prd_PrimaryCode AS SKU,
                    sav_Value AS LOT,
                    spt_Quantity AS QTY_OF_UOM
                FROM LV_Stock
                    JOIN LV_Product 
                        ON stk_ProductID = prd_ID
                    JOIN LV_Location 
                        ON stk_LocationID = loc_ID
                    JOIN LV_StockContainer 
                        ON stk_ContainerID = stc_ID
                    LEFT JOIN LV_StockAttributesValues 
                        ON stk_ID = sav_StockID 
                        AND sav_AttributeID = 1
                    LEFT JOIN cus_T_TruckLPNList 
                        ON stc_SSCC = LPN
                    JOIN LV_StockPackType 
                        ON stk_ID = spt_StockID
                    JOIN LV_ItemUnit 
                        ON spt_ItemUnitID = itu_ID
                    JOIN LV_Unit 
                        ON itu_UnitID = unt_ID
                    LEFT JOIN LV_UnsuitabilityReason 
                        ON stk_UnsuitReasonID = unr_ID
                WHERE 
                    spt_parentID IS NULL
                    AND TruckRef = @TruckRef
                ORDER BY 
                    TruckRef, 
                    loc_Code, 
                    LPN;
            ";

            return await _dataAccess.GetDataInline<TruckDetail, dynamic>(queryaData, new { TruckRef = Truck_ref });
        }
    }
}
