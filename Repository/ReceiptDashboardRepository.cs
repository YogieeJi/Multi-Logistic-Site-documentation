using System.Data.SqlClient;
using System.Data;
using System.Text;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Data.Common;
using Microsoft.AspNetCore.Components;
using Org.BouncyCastle.Asn1.Ocsp;
using static iText.IO.Image.Jpeg2000ImageData;
using System.ComponentModel;
using Org.BouncyCastle.Tls;
using System.Net.Mail;
using SendGrid;
using SendGrid.Helpers.Mail;
using Swashbuckle.Swagger;
using System.Globalization;


namespace MiddlewareWebAPI.Data.Repository
{
    public class ReceiptDashboardRepository : IReceiptDashboardRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        //private readonly string? _connectionString;
        private readonly UrlConstants _urlConstants;
        private readonly INotificationLogsRepository _notificationLogsRepository;
        private readonly IConfiguration _configuration;

        public ReceiptDashboardRepository(ISqlDataAccess dataAccess, IConfiguration configuration, UrlConstants urlConstants, INotificationLogsRepository notificationLogsRepository)
        {
            _dataAccess = dataAccess;
            _configuration = configuration;
            _urlConstants = urlConstants;
            _notificationLogsRepository = notificationLogsRepository;
        }
        public async Task<List<Receiptdashboardddl>> getReceiptDropdown()
        {
            try
            {
                var query = @"
                SELECT 
                 rct_code as id,
                 rct_code as name
                 FROM LV_Receipt ORDER BY rct_inputdate DESC;
                ";

                var result = await _dataAccess.GetDataInline<Receiptdashboardddl, dynamic>(query, new { });
                return result.ToList();
            }
            catch (Exception ex)
            {
                return new List<Receiptdashboardddl>
                {
                    new Receiptdashboardddl
                    {
                        message = ex.Message,
                    }
                };
            }
        }
        public async Task<ReceiptDashboardResponse> getReceiptDetailsLOT(ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                var ReceiptLotdetails = "EXECUTE [dbo].[Cus_Sp_GetReceiptDetailsLOT_v1] @ReceiptCode,@Skip, @Rows";
                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<Dashboarddata, dynamic>(ReceiptLotdetails, parameters);

                return new ReceiptDashboardResponse
                {
                    data = result,
                    totalRecords = 0

                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<ReceiptDashboardResponse> getReceiptDetailsLOTC(ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                var ReceiptLotdetails = "EXECUTE Cus_Sp_GetReceiptDetailsLotPdf_v1 @ReceiptCode";
                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<Dashboarddata, dynamic>(ReceiptLotdetails, parameters);

                return new ReceiptDashboardResponse
                {
                    data = result,
                    totalRecords = 0

                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<ReceiptDashboardResponse> getReceiptDetailsLOT(string receiptCode)
        {
            try
            {
                var ReceiptLotdetails = "EXECUTE Cus_Sp_GetReceiptDetailsLotPdf_v1 @ReceiptCode";
                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<Dashboarddata, dynamic>(ReceiptLotdetails, parameters);

                return new ReceiptDashboardResponse
                {
                    data = result,
                    totalRecords = 0

                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<DateTime?> GetReceiptactualdate(string receiptCode)
        {
            try
            {
                var ReceiptLotdetails = "SELECT rct_ActualDate FROM LV_Receipt WHERE rct_Code = @ReceiptCode";
                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<DateTime?, dynamic>(ReceiptLotdetails, parameters);

                return result.FirstOrDefault();
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<ReceiptDashboardDetailsResponse> GetReceiptDetails(ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                string cteAndMainQuery = @"
                ;WITH ReceiptHeader AS (
                    SELECT 
                        r.rct_ID, 
                        r.rct_Code,
                        r.rct_ActualDate          --  added
                    FROM LV_Receipt r WITH (NOLOCK)
                    WHERE r.rct_Code = @receiptCode
                ),
                ReceiptProducts AS (
                    SELECT DISTINCT p.prd_PrimaryCode
                    FROM ReceiptHeader rh
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK)
                        ON rh.rct_ID = rci.rci_ReceiptID
                    INNER JOIN LV_Product p WITH (NOLOCK)
                        ON rci.rci_ProductID = p.prd_ID
                ),
                X3ConversionRanked AS (
                    SELECT x3.*,
                        ROW_NUMBER() OVER (
                            PARTITION BY x3.sku_mantis
                            ORDER BY
                                CASE x3.uom_mantis
                                    WHEN 'CS' THEN 1
                                    WHEN 'BX' THEN 2
                                    WHEN 'BG' THEN 2
                                    WHEN 'EA' THEN 3
                                    ELSE 4
                                END
                        ) AS priority_rank
                    FROM Cus_SageX3ToMantisConverion x3 WITH (NOLOCK)
                    INNER JOIN ReceiptProducts rp
                        ON x3.sku_mantis = rp.prd_PrimaryCode
                )
                SELECT
                    poRef.POReference AS PO,
                    rci.rci_ReceiptLine AS LineNumber,
                    p.prd_PrimaryCode AS Mantis_SKU,
                    COALESCE(c.bpsnum, d.bpsnum) AS BpsNum,
                    x3conv.sku_x3 AS ItemCode_X3,

                    rh.rct_ActualDate,          -- added here

                    -- Pack List Qty (X3 UOM)
                    SUM(
                        CASE
                            WHEN expUnit.unt_Code = x3conv.uom_mantis
                                THEN rci.rci_ExpQuantity
                            WHEN expToX3.conversion_qty > 0
                                THEN ROUND(rci.rci_ExpQuantity * expToX3.conversion_qty, 2)
                        END
                    ) AS PackList_Qty,

                    -- Actual Qty (X3 UOM)
                    SUM(
                        CASE
                            WHEN actUnit.unt_Code = x3conv.uom_mantis
                                THEN rci.rci_ActQuantity
                            WHEN actToX3.conversion_qty > 0
                                THEN ROUND(rci.rci_ActQuantity * actToX3.conversion_qty, 2)
                        END
                    ) AS Actual_Qty,

                    CAST(CAST(SUM(rci.rci_ExpQuantity) AS INT) AS VARCHAR(20))
                        + ' ' + ISNULL(expUnit.unt_Code, '') AS ExpectedQtyDisplay,

                    CAST(CAST(SUM(rci.rci_ActQuantity) AS INT) AS VARCHAR(20))
                        + ' ' + ISNULL(actUnit.unt_Code, '') AS ActualQtyDisplay,

                    FORMAT(
                        SUM(
                            CASE
                                WHEN actUnit.unt_Code = x3conv.uom_mantis
                                    THEN rci.rci_ActQuantity
                                WHEN actToX3.conversion_qty > 0
                                    THEN rci.rci_ActQuantity * actToX3.conversion_qty
                            END
                        ), '0'
                    ) + ' ' + ISNULL(x3conv.uom_mantis, '') AS X3_QtyDisplay,

                    COUNT(DISTINCT lsa.lsa_Value) AS ActualLotAttrCode

                FROM ReceiptHeader rh
                INNER JOIN LV_ReceiptItem rci WITH (NOLOCK)
                    ON rh.rct_ID = rci.rci_ReceiptID
                LEFT JOIN LV_Product p WITH (NOLOCK)
                    ON rci.rci_ProductID = p.prd_ID
                LEFT JOIN X3ConversionRanked x3conv
                    ON p.prd_PrimaryCode = x3conv.sku_mantis
                   AND x3conv.priority_rank = 1

                LEFT JOIN LV_ItemUnit expItu WITH (NOLOCK)
                    ON rci.rci_InputItemUnitID = expItu.itu_ID
                LEFT JOIN LV_Unit expUnit WITH (NOLOCK)
                    ON expItu.itu_UnitID = expUnit.unt_ID
                LEFT JOIN LV_ItemUnit actItu WITH (NOLOCK)
                    ON rci.rci_ActItemUnitID = actItu.itu_ID
                LEFT JOIN LV_Unit actUnit WITH (NOLOCK)
                    ON actItu.itu_UnitID = actUnit.unt_ID

                OUTER APPLY (
                    SELECT TOP 1 iph.iph_quantity AS conversion_qty
                    FROM LV_ItemPackTypeHierarchy iph WITH (NOLOCK)
                    WHERE iph.iph_ParentItemUnitID = expItu.itu_ID
                ) expToX3

                OUTER APPLY (
                    SELECT TOP 1 iph.iph_quantity AS conversion_qty
                    FROM LV_ItemPackTypeHierarchy iph WITH (NOLOCK)
                    WHERE iph.iph_ParentItemUnitID = actItu.itu_ID
                ) actToX3

                OUTER APPLY (
                    SELECT TOP 1 rrv.rrv_Value AS POReference
                    FROM LV_ReceiptItemRctAttrValue rrv WITH (NOLOCK)
                    WHERE rrv.rrv_ReceiptItemID = rci.rci_ID
                      AND rrv.rrv_ReceiptAttributeID = 4
                ) poRef

                LEFT JOIN (
                    SELECT ctrnum, itmref, MAX(bpsnum) bpsnum
                    FROM Cus_ManualContainerDetails
                    WHERE mantis_imported = '1'
                    GROUP BY ctrnum, itmref
                ) c
                    ON c.ctrnum = rh.rct_Code
                   AND c.itmref = p.prd_PrimaryCode

                LEFT JOIN (
                    SELECT e.ship_uid, e.itmref, MAX(a.bpsnum) bpsnum
                    FROM Cus_AsnLines e
                    INNER JOIN Cus_Asns a ON a.id = e.asn_id
                    WHERE mantis_imported = '1'
                    GROUP BY e.ship_uid, e.itmref
                ) d
                    ON d.ship_uid = rh.rct_Code
                   AND d.itmref = p.prd_PrimaryCode

                LEFT JOIN LV_Log l WITH (NOLOCK)
                    ON rci.rci_ID = l.log_ReceiptItemID
                LEFT JOIN LV_LogStock lsk WITH (NOLOCK)
                    ON l.log_ID = lsk.lsk_LogID
                LEFT JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
                    ON lsk.lsk_ID = lsa.lsa_LogStockID
                   AND lsa.lsa_AttributeID = 1

                GROUP BY
                    poRef.POReference,
                    rci.rci_ReceiptLine,
                    p.prd_PrimaryCode,
                    x3conv.sku_x3,
                    x3conv.uom_mantis,
                    expUnit.unt_Code,
                    actUnit.unt_Code,
                    c.bpsnum,
                    d.bpsnum,
                    rh.rct_ActualDate      

                ORDER BY
                rci.rci_ReceiptLine,    
                 poRef.POReference

                  OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY;
                ";

                string countQuery = @"
                    SELECT COUNT(DISTINCT rci.rci_ReceiptLine) AS TotalRecords
                    FROM LV_Receipt r WITH (NOLOCK)
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK)
                        ON r.rct_ID = rci.rci_ReceiptID
                    WHERE r.rct_Code = @ReceiptCode;

                ";

                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var data = await _dataAccess.GetDataInline<Dashboardddata_v1, dynamic>(
                    cteAndMainQuery, parameters);

                int totalRecords = (await _dataAccess.GetDataInline<int, dynamic>(
                    countQuery, parameters)).FirstOrDefault();

                return new ReceiptDashboardDetailsResponse
                {
                    Data = data,
                    totalRecords = totalRecords
                };
            }
            catch
            {
                throw;
            }
        }


        public async Task<ReceiptDashboardDetailsResponse> getReceiptDetails(ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                string baseQuery = @"
                SELECT 
                    prd.prd_PrimaryCode,
                    CASE 
                        WHEN c.input_sku IS NOT NULL THEN c.input_sku 
                        ELSE d.input_itmref 
                    END AS input_sku,
                    pov.rrv_Value AS ponum,
                    pol.rrv_Value AS poline,
                    CAST(SUM(ri.rci_ExpQuantity) AS INT) AS expected_QTY,
                    CAST(lg.qty AS INT) AS QTY,
                    b.unt_code,
                    COALESCE(c.bpsnum, d.bpsnum) AS bpsnum,
                    COALESCE(c.pohnum, d.pohnum) AS pohnum,
                    conv.uom_mantis,
                    CAST(
                        CASE
                            WHEN c.input_sku IS NULL THEN
                                CASE
                                    WHEN conv.uom_mantis = d.uom THEN lg.qty
                                    WHEN conv.uom_mantis = b.unt_Code THEN lg.qty
                                    ELSE lg.qty * iph_Quantity
                                END
                            ELSE
                                CASE
                                    WHEN conv.uom_mantis = c.uom THEN lg.qty
                                    WHEN conv.uom_mantis = b.unt_Code THEN lg.qty
                                    ELSE lg.qty * iph_Quantity
                                END
                        END AS INT
                    ) AS X3_QTY,
                 lg.unt_Code AS log_unt_code      
                FROM LV_Receipt r
                JOIN LV_ReceiptItem ri ON ri.rci_Receiptid = r.rct_id

                LEFT JOIN LV_ReceiptItemRctAttrValue pov 
                    ON pov.rrv_ReceiptItemID = ri.rci_id 
                    AND pov.rrv_ReceiptAttributeID = 4

                LEFT JOIN LV_ReceiptItemRctAttrValue pol 
                    ON pol.rrv_ReceiptItemID = ri.rci_id 
                    AND pol.rrv_ReceiptAttributeID = 6

                JOIN LV_Product prd ON ri.rci_productid = prd.prd_id

                LEFT JOIN (
                    SELECT 
                        ctrnum, itmref, uom, SUM(input_qty) AS QTY,
                        input_sku, pohnum, mantis_imported, bpsnum, poplin
                    FROM Cus_ManualContainerDetails
                    WHERE mantis_imported = '1'
                    GROUP BY itmref, ctrnum, input_sku, uom, pohnum, mantis_imported, bpsnum, poplin
                ) c ON r.rct_code = c.ctrnum
                    AND c.itmref = prd.prd_PrimaryCode
                    AND (c.pohnum = pov.rrv_Value OR (c.pohnum IS NULL AND pov.rrv_Value IS NULL))
                    AND (c.poplin = pol.rrv_Value OR (c.poplin IS NULL AND pol.rrv_Value IS NULL))

                LEFT JOIN (
                    SELECT 
                        e.ship_uid, itmref, uom, SUM(input_qty) AS QTY,
                        input_itmref, pohnum, mantis_imported, a.bpsnum, poplin
                    FROM Cus_AsnLines e
                    JOIN Cus_Asns a ON e.asn_id = a.id
                    WHERE mantis_imported = '1'
                    GROUP BY itmref, e.ship_uid, input_itmref, uom, pohnum, mantis_imported, a.bpsnum, poplin
                ) d ON r.rct_code = d.ship_uid
                    AND d.itmref = prd.prd_PrimaryCode
                    AND (d.pohnum = pov.rrv_Value OR (d.pohnum IS NULL AND pov.rrv_Value IS NULL))
                    AND (d.poplin = pol.rrv_Value OR (d.poplin IS NULL AND pol.rrv_Value IS NULL))

                LEFT JOIN Cus_SageX3ToMantisConverion conv 
                    ON conv.sku_x3 = c.input_sku OR conv.sku_x3 = d.input_itmref

                LEFT JOIN (
                    SELECT 
                        SUM(lsp_Quantity) AS qty,
                        prd_id,
                        unt_Code,
                        log_ReceiptItemID
                    FROM lv_log
                    JOIN LV_LogStock ON lsk_LogID = log_id
                    JOIN LV_LogStockPackType ON lsp_LogStockID = lsk_id
                    JOIN LV_ItemUnit ON lsp_ItemUnitID = ITU_ID
                    JOIN LV_UNIT ON itu_UnitID = unt_id
                    JOIN LV_Product ON lsk_ProductID = prd_id
                    WHERE log_ReceiptID IS NOT NULL
                    GROUP BY prd_id, log_ReceiptItemID, unt_Code
                ) lg ON lg.prd_id = prd.prd_id
                    AND lg.log_ReceiptItemID = ri.rci_ID
                    AND lg.unt_Code = conv.uom_mantis

                LEFT JOIN (
                    SELECT 
                        unt_code,
                        itu_ProductID,
                        iph_Quantity
                    FROM lv_unit
                    JOIN LV_ItemUnit ON itu_UnitID = unt_ID
                    LEFT JOIN LV_ItemPackTypeHierarchy 
                        ON iph_ChildItemUnitID = itu_id
                ) b ON b.unt_code = conv.uom_mantis
                    AND b.itu_ProductID = prd.prd_id

                WHERE 
                    r.rct_Code = @code
                    AND ri.rci_ExpQuantity > 0

                GROUP BY 
                    r.rct_code,
                    prd.prd_PrimaryCode,
                    c.input_sku,
                    iph_Quantity,
                    conv.sku_mantis,
                    conv.uom_mantis,
                    c.uom,
                    c.QTY,
                    lg.qty,
                    d.input_itmref,
                    d.ship_uid,
                    d.uom,
                    b.unt_code,
                    lg.unt_Code,
                    COALESCE(c.pohnum, d.pohnum),
                    COALESCE(c.bpsnum, d.bpsnum),
                    pov.rrv_Value,
                    pol.rrv_Value
                ";

                var parameters = new DynamicParameters();
                parameters.Add("@code", receiptCode);

                //SORTING
                string finalQuery = baseQuery;
                if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != "0")
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    finalQuery += $" ORDER BY {request.sortField} {sortOrder}";
                }
                else
                {
                    finalQuery += " ORDER BY ponum ASC, input_sku ASC";
                }

                //  PAGING 
                finalQuery += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // DATA RESULT 
                var dataResult = await _dataAccess.GetDataInline<Dashboardddata, dynamic>(finalQuery, parameters);

                //  TOTAL COUNT QUERY 
                string countQuery = $@"
                SELECT COUNT(*) FROM (
                    {baseQuery}
                ) AS temp";

                var totalRecords = (await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters)).FirstOrDefault();

                return new ReceiptDashboardDetailsResponse
                {
                    data = dataResult,
                    totalRecords = totalRecords
                };
            }
            catch (Exception)
            {
                throw;
            }
        }


        public async Task<PdfDownloadResponse> getReceiptDetails(string receiptCode)
        {
            try
            {
                string sql = @"
                ;WITH ReceiptProducts AS (
                    SELECT DISTINCT p.prd_PrimaryCode
                    FROM LV_Receipt r WITH (NOLOCK)
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK) ON r.rct_ID = rci.rci_ReceiptID
                    INNER JOIN LV_Product p WITH (NOLOCK) ON rci.rci_ProductID = p.prd_ID
                    WHERE r.rct_Code = @receiptCode
                ),
                X3ConversionRanked AS (
                    SELECT
                        x3.*,
                        ROW_NUMBER() OVER (
                            PARTITION BY x3.sku_mantis
                            ORDER BY
                                CASE x3.uom_mantis
                                    WHEN 'CS' THEN 1
                                    WHEN 'BX' THEN 2
                                    WHEN 'BG' THEN 2
                                    WHEN 'EA' THEN 3
                                    ELSE 4
                                END
                        ) AS priority_rank
                    FROM Cus_SageX3ToMantisConverion x3 WITH (NOLOCK)
                    INNER JOIN ReceiptProducts rp ON x3.sku_mantis = rp.prd_PrimaryCode
                ),
                LotData AS (
                    SELECT
                        rci.rci_ID,
                        rci.rci_ExpQuantity,
                        x3conv.sku_x3,
                        x3conv.uom_mantis AS X3_UOM,
                        poRef.POReference,
                        lsa.lsa_Value AS LotNumber,
                        SUM(lsp.lsp_Quantity) AS LotQty,
                        MAX(stockUnit.unt_Code) AS StockUOM,
                        lotToX3.conversion_qty
                    FROM LV_Receipt r WITH (NOLOCK)
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK) ON r.rct_ID = rci.rci_ReceiptID
                    LEFT JOIN LV_Product p WITH (NOLOCK) ON rci.rci_ProductID = p.prd_ID
                    LEFT JOIN X3ConversionRanked x3conv ON p.prd_PrimaryCode = x3conv.sku_mantis AND x3conv.priority_rank = 1
                    -- PO Reference
                    OUTER APPLY (
                        SELECT TOP 1 rrv.rrv_Value AS POReference
                        FROM LV_ReceiptItemRctAttrValue rrv WITH (NOLOCK)
                        WHERE rrv.rrv_ReceiptItemID = rci.rci_ID
                          AND rrv.rrv_ReceiptAttributeID = 4
                    ) AS poRef
                    -- Log tables for lot data
                    LEFT JOIN LV_Log l WITH (NOLOCK) ON rci.rci_ID = l.log_ReceiptItemID
                    LEFT JOIN LV_LogStock lsk WITH (NOLOCK) ON l.log_ID = lsk.lsk_LogID
                    LEFT JOIN LV_LogStockPackType lsp WITH (NOLOCK) ON lsk.lsk_ID = lsp.lsp_LogStockID
                        AND lsp.lsp_CUQuantity IS NOT NULL
                    -- Stock UOM
                    LEFT JOIN LV_ItemUnit stockItu WITH (NOLOCK) ON lsp.lsp_ItemUnitID = stockItu.itu_ID
                    LEFT JOIN LV_Unit stockUnit WITH (NOLOCK) ON stockItu.itu_UnitID = stockUnit.unt_ID
                    -- Lot number
                    LEFT JOIN LV_LogStockAttrValue lsa WITH (NOLOCK) ON lsk.lsk_ID = lsa.lsa_LogStockID
                    LEFT JOIN LV_StockAttributes sa WITH (NOLOCK) ON lsa.lsa_AttributeID = sa.sat_ID AND sa.sat_ID = 1
                    -- X3 UOM Conversion for Lot
                    OUTER APPLY (
                        SELECT TOP 1 iph.iph_quantity AS conversion_qty
                        FROM LV_ItemUnit x3Itu WITH (NOLOCK)
                        INNER JOIN LV_Unit x3Unit WITH (NOLOCK) ON x3Itu.itu_UnitID = x3Unit.unt_ID
                        INNER JOIN LV_ItemPackTypeHierarchy iph WITH (NOLOCK)
                            ON iph.iph_ChildItemUnitID = x3Itu.itu_ID
                            AND iph.iph_ParentItemUnitID = stockItu.itu_ID
                        WHERE x3Itu.itu_ProductID = rci.rci_ProductID
                          AND x3Unit.unt_Code = x3conv.uom_mantis
                    ) AS lotToX3
                    WHERE r.rct_Code = @receiptCode
                    GROUP BY
                        rci.rci_ID,
                        rci.rci_ExpQuantity,
                        x3conv.sku_x3,
                        x3conv.uom_mantis,
                        poRef.POReference,
                        lsa.lsa_Value,
                        lotToX3.conversion_qty
                ),
                LotWithX3Qty AS (
                    SELECT
                        rci_ID,
                        rci_ExpQuantity,
                        sku_x3,
                        X3_UOM,
                        POReference,
                        LotNumber,
                        LotQty,
                        StockUOM,
                        CASE
                            WHEN StockUOM = X3_UOM THEN LotQty
                            WHEN conversion_qty > 0 THEN CAST(ROUND(LotQty * conversion_qty, 2) AS DECIMAL(18,2))
                            ELSE NULL
                        END AS X3_LotQty
                    FROM LotData
                )
                SELECT
                    ISNULL(POReference, '') AS [PO],
                    sku_x3 AS [ItemCode],
                    SUM(rci_ExpQuantity) AS [PackListQTY],
                    SUM(ISNULL(X3_LotQty, 0)) AS [X3EntryQTY]
                FROM LotWithX3Qty
                WHERE sku_x3 IS NOT NULL
                GROUP BY POReference, sku_x3
                HAVING SUM(rci_ExpQuantity) <> 0 OR SUM(ISNULL(X3_LotQty, 0)) <> 0
                ORDER BY POReference, sku_x3;
                ";



                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                var data = await _dataAccess.GetDataInline<ReceiptDashboardPdf, dynamic>(sql, parameters);

                return new PdfDownloadResponse
                {
                    data = data,
                };
            }
            catch
            {
                throw;
            }
        }
        public async Task<ReceiptDashboardDetailsResponse> getReceiptDetailsOld(string receiptCode)
        {
            try
            {
                var Receiptdetails = @"SELECT 
                    prd.prd_PrimaryCode,
                    CASE 
                        WHEN c.input_sku IS NOT NULL THEN c.input_sku 
                        ELSE d.input_itmref 
                    END AS input_sku,
                    pov.rrv_Value AS ponum,
                    pol.rrv_Value AS poline,
                    CAST(SUM(ri.rci_ExpQuantity) AS INT) AS expected_QTY,
                    CAST(lg.qty AS INT) AS QTY,

                    lg.unt_Code,

                    COALESCE(c.bpsnum, d.bpsnum) AS bpsnum,
                    COALESCE(c.pohnum, d.pohnum) AS pohnum,
                    conv.uom_mantis,

                    CAST(
                        CASE
                            WHEN c.input_sku IS NULL THEN
                                CASE
                                    WHEN conv.uom_mantis = d.uom THEN lg.qty
                                    WHEN conv.uom_mantis = b.unt_Code THEN lg.qty
                                    ELSE lg.qty * iph_Quantity
                                END
                            ELSE
                                CASE
                                    WHEN conv.uom_mantis = c.uom THEN lg.qty
                                    WHEN conv.uom_mantis = b.unt_Code THEN lg.qty
                                    ELSE lg.qty * iph_Quantity
                                END
                        END AS INT
                    ) AS X3_QTY,

                    b.unt_code

                FROM LV_Receipt r
                JOIN LV_ReceiptItem ri ON ri.rci_Receiptid = r.rct_id

                LEFT JOIN LV_ReceiptItemRctAttrValue pov 
                    ON pov.rrv_ReceiptItemID = ri.rci_id 
                    AND pov.rrv_ReceiptAttributeID = 4

                LEFT JOIN LV_ReceiptItemRctAttrValue pol 
                    ON pol.rrv_ReceiptItemID = ri.rci_id 
                    AND pol.rrv_ReceiptAttributeID = 6

                JOIN LV_Product prd ON ri.rci_productid = prd.prd_id

                LEFT JOIN (
                    SELECT 
                        SUM(lsp_Quantity) AS qty,
                        prd_id,
                        unt_Code,
                        log_ReceiptItemID
                    FROM lv_log
                    JOIN LV_LogStock ON lsk_LogID = log_id
                    JOIN LV_LogStockPackType ON lsp_LogStockID = lsk_id AND lsp_ParentID IS NULL
                    JOIN LV_ItemUnit ON lsp_ItemUnitID = ITU_ID
                    JOIN LV_UNIT ON itu_UnitID = unt_id
                    JOIN LV_Product ON lsk_ProductID = prd_id
                    WHERE log_ReceiptID IS NOT NULL 
                    GROUP BY prd_id, log_receiptItemID, unt_Code
                ) lg ON lg.prd_id = prd.prd_id
                     AND lg.log_ReceiptItemID = ri.rci_ID

                LEFT JOIN (
                    SELECT 
                        ctrnum, itmref, uom, SUM(input_qty) AS QTY,
                        input_sku, pohnum, mantis_imported, bpsnum, poplin
                    FROM Cus_ManualContainerDetails
                    WHERE mantis_imported = '1'
                    GROUP BY itmref, ctrnum, input_sku, uom, pohnum, mantis_imported, bpsnum, poplin
                ) c ON r.rct_code = c.ctrnum
                     AND c.itmref = prd.prd_PrimaryCode
                     AND (c.pohnum = pov.rrv_Value OR (c.pohnum IS NULL AND pov.rrv_Value IS NULL))
                     AND (c.poplin = pol.rrv_Value OR (c.poplin IS NULL AND pol.rrv_Value IS NULL))

                LEFT JOIN (
                    SELECT 
                        e.ship_uid, itmref, uom, SUM(input_qty) AS QTY,
                        input_itmref, pohnum, mantis_imported, a.bpsnum, poplin
                    FROM Cus_AsnLines e
                    JOIN Cus_Asns a ON e.asn_id = a.id
                    WHERE mantis_imported = '1'
                    GROUP BY itmref, e.ship_uid, input_itmref, uom, pohnum, mantis_imported, a.bpsnum, poplin
                ) d ON r.rct_code = d.ship_uid
                     AND d.itmref = prd.prd_PrimaryCode
                     AND (d.pohnum = pov.rrv_Value OR (d.pohnum IS NULL AND pov.rrv_Value IS NULL))
                     AND (d.poplin = pol.rrv_Value OR (d.poplin IS NULL AND pol.rrv_Value IS NULL))

                LEFT JOIN Cus_SageX3ToMantisConverion conv 
                    ON conv.sku_x3 = c.input_sku OR conv.sku_x3 = d.input_itmref

                LEFT JOIN (
                    SELECT 
                        unt_code, itu_ProductID, iph_Quantity
                    FROM lv_unit
                    JOIN LV_ItemUnit ON itu_UnitID = unt_ID
                    LEFT JOIN LV_ItemPackTypeHierarchy ON iph_ChildItemUnitID = itu_id
                ) b ON b.unt_code = conv.uom_mantis
                     AND b.itu_ProductID = prd.prd_id

                WHERE 
                    r.rct_Code =@code
                    AND ri.rci_ExpQuantity > 0

                GROUP BY 
                    r.rct_code, prd.prd_PrimaryCode, c.input_sku, iph_Quantity, 
                    conv.sku_mantis, conv.uom_mantis, c.uom, c.QTY, 
                    lg.qty, d.input_itmref, d.ship_uid, d.uom, 
                    b.unt_code, lg.unt_Code, 
                    COALESCE(c.pohnum, d.pohnum), COALESCE(c.bpsnum, d.bpsnum),
                    pov.rrv_Value, pol.rrv_Value

                ORDER BY 
                    ponum, input_sku;


                ";
                var parameters = new DynamicParameters();
                parameters.Add("@code", receiptCode);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<Dashboardddata, dynamic>(Receiptdetails, parameters);
                return new ReceiptDashboardDetailsResponse
                {
                    data = result,
                    totalRecords = 0

                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<ReceiptDashboardLotDetailsResponse> GetReceiptDetailsLot(ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                string query = @"

                DECLARE @ReceiptId BIGINT;

                SELECT @ReceiptId = rct_ID
                FROM LV_Receipt WITH (NOLOCK)
                WHERE rct_Code = @receiptCode;

                ;WITH ReceiptItems AS (
                    SELECT rci_ID, rci_ReceiptLine, rci_ProductID
                    FROM LV_ReceiptItem WITH (NOLOCK)
                    WHERE rci_ReceiptID = @ReceiptId
                ),

                FilteredLogs AS (
                    SELECT l.log_ID, l.log_ReceiptItemID
                    FROM LV_Log l WITH (NOLOCK)
                    INNER JOIN ReceiptItems ri
                        ON ri.rci_ID = l.log_ReceiptItemID
                ),

                AggQty AS (
                    SELECT 
                        fl.log_ReceiptItemID,
                        lsk.lsk_ID,
                        SUM(lsp.lsp_Quantity) Qty,
                        MAX(lsp.lsp_ItemUnitID) ItemUnitID
                    FROM FilteredLogs fl
                    INNER JOIN LV_LogStock lsk WITH (NOLOCK)
                        ON fl.log_ID = lsk.lsk_LogID
                    INNER JOIN LV_LogStockPackType lsp WITH (NOLOCK)
                        ON lsk.lsk_ID = lsp.lsp_LogStockID
                        AND lsp.lsp_CUQuantity IS NOT NULL
                    GROUP BY fl.log_ReceiptItemID, lsk.lsk_ID
                ),

                -- restore X3 ranking logic but ONLY for receipt SKUs (fast)
                ReceiptProducts AS (
                    SELECT DISTINCT p.prd_PrimaryCode
                    FROM ReceiptItems ri
                    JOIN LV_Product p WITH (NOLOCK)
                        ON ri.rci_ProductID = p.prd_ID
                ),

                X3ConversionRanked AS (
                    SELECT x3.*,
                        ROW_NUMBER() OVER (
                            PARTITION BY x3.sku_mantis
                            ORDER BY
                                CASE x3.uom_mantis
                                    WHEN 'CS' THEN 1
                                    WHEN 'BX' THEN 2
                                    WHEN 'BG' THEN 2
                                    WHEN 'EA' THEN 3
                                    ELSE 4
                                END
                        ) AS priority_rank
                    FROM Cus_SageX3ToMantisConverion x3 WITH (NOLOCK)
                    INNER JOIN ReceiptProducts rp
                        ON rp.prd_PrimaryCode = x3.sku_mantis
                )

                SELECT
                    COUNT(*) OVER() AS TotalRecords,
                    r.rct_ActualDate AS ReceiptActualDate,
                    ri.rci_ReceiptLine AS LineNumber,
                    lotExp.exp_date AS ExpirationDate,
                    p.prd_PrimaryCode AS Mantis_SKU,
                    x3.sku_x3 AS X3_SKU,
                    lsa.lsa_Value AS LotNumber,

                    CAST(CAST(SUM(a.Qty) AS DECIMAL(18,0)) AS VARCHAR(20))
                        + ' ' + MAX(stockUnit.unt_Code) AS QuantityDisplay,

                    FORMAT(
                        SUM(
                            CASE
                                WHEN stockUnit.unt_Code = x3.uom_mantis
                                    THEN a.Qty
                                WHEN actToX3.conversion_qty > 0
                                    THEN a.Qty * actToX3.conversion_qty
                            END
                        ), '0'
                    ) + ' ' + ISNULL(x3.uom_mantis,'') AS X3_QtyDisplay

                FROM ReceiptItems ri
                JOIN LV_Receipt r WITH (NOLOCK) ON r.rct_ID = @ReceiptId
                LEFT JOIN LV_Product p WITH (NOLOCK) ON ri.rci_ProductID = p.prd_ID
                JOIN AggQty a ON ri.rci_ID = a.log_ReceiptItemID
                JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
                    ON a.lsk_ID = lsa.lsa_LogStockID AND lsa.lsa_AttributeID = 1
                LEFT JOIN LV_ItemUnit itu WITH (NOLOCK)
                    ON a.ItemUnitID = itu.itu_ID
                LEFT JOIN LV_Unit stockUnit WITH (NOLOCK)
                    ON itu.itu_UnitID = stockUnit.unt_ID

                -- apply ranked X3 conversion
                LEFT JOIN X3ConversionRanked x3
                    ON p.prd_PrimaryCode = x3.sku_mantis
                    AND x3.priority_rank = 1

                LEFT JOIN Cus_T_ItemsLotExp lotExp WITH (NOLOCK)
                    ON lotExp.item = p.prd_PrimaryCode
                   AND lotExp.lot_number = lsa.lsa_Value

                -- restore OUTER APPLY logic (NOT left join)
                OUTER APPLY (
                    SELECT TOP 1 iph.iph_quantity AS conversion_qty
                    FROM LV_ItemPackTypeHierarchy iph WITH (NOLOCK)
                    WHERE iph.iph_ParentItemUnitID = itu.itu_ID
                ) actToX3

                GROUP BY
                    r.rct_ActualDate,
                    ri.rci_ReceiptLine,
                    p.prd_PrimaryCode,
                    x3.sku_x3,
                    x3.uom_mantis,
                    lsa.lsa_Value,
                    actToX3.conversion_qty,
                    lotExp.exp_date

                ORDER BY
                    ri.rci_ReceiptLine,
                    p.prd_PrimaryCode,
                    lsa.lsa_Value
                OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var data = (await _dataAccess
                    .GetDataInline<ReceiptDashboardLotDto, dynamic>(query, parameters))
                    .ToList();


                int totalRecords = data.FirstOrDefault()?.totalRecords ?? 0;

                return new ReceiptDashboardLotDetailsResponse
                {
                    Data = data,
                    totalRecords = totalRecords
                };
            }
            catch
            {
                throw;
            }
        }


        public async Task<ReceiptDownloadPdfResponse> GetReceiptDetailsLot(string receiptCode)
        {
            try
            {
                string baseQuery = @"
                ;WITH ReceiptProducts AS (
                    SELECT DISTINCT p.prd_PrimaryCode
                    FROM LV_Receipt r WITH (NOLOCK)
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK) ON r.rct_ID = rci.rci_ReceiptID
                    INNER JOIN LV_Product p WITH (NOLOCK) ON rci.rci_ProductID = p.prd_ID
                    WHERE r.rct_Code = @receiptCode
                ),
                X3ConversionRanked AS (
                    SELECT
                        x3.*,
                        ROW_NUMBER() OVER (
                            PARTITION BY x3.sku_mantis
                            ORDER BY
                                CASE x3.uom_mantis
                                    WHEN 'CS' THEN 1
                                    WHEN 'BX' THEN 2
                                    WHEN 'BG' THEN 2
                                    WHEN 'EA' THEN 3
                                    ELSE 4
                                END
                        ) AS priority_rank
                    FROM Cus_SageX3ToMantisConverion x3 WITH (NOLOCK)
                    INNER JOIN ReceiptProducts rp ON x3.sku_mantis = rp.prd_PrimaryCode
                )
                SELECT
                    ISNULL(poRef.POReference, '') AS [PONumber],
                    ISNULL(x3conv.sku_x3, p.prd_PrimaryCode) AS [Item],
                    lsa.lsa_Value AS [LotNumber],
                    lotExp.exp_date AS [ExpirationDate],
                    CASE
                        WHEN MAX(stockUnit.unt_Code) = x3conv.uom_mantis THEN SUM(lsp.lsp_Quantity)
                        WHEN lotToX3.conversion_qty > 0 THEN CAST(ROUND(SUM(lsp.lsp_Quantity) * lotToX3.conversion_qty, 2) AS DECIMAL(18,2))
                        ELSE NULL
                    END AS [X3EntryQTY]
                FROM LV_Receipt r WITH (NOLOCK)
                INNER JOIN LV_ReceiptItem rci WITH (NOLOCK) ON r.rct_ID = rci.rci_ReceiptID
                LEFT JOIN LV_Product p WITH (NOLOCK) ON rci.rci_ProductID = p.prd_ID
                LEFT JOIN X3ConversionRanked x3conv ON p.prd_PrimaryCode = x3conv.sku_mantis AND x3conv.priority_rank = 1
                -- PO Reference
                OUTER APPLY (
                    SELECT TOP 1 rrv.rrv_Value AS POReference
                    FROM LV_ReceiptItemRctAttrValue rrv WITH (NOLOCK)
                    WHERE rrv.rrv_ReceiptItemID = rci.rci_ID
                      AND rrv.rrv_ReceiptAttributeID = 4
                ) AS poRef
                -- Log tables for lot data
                LEFT JOIN LV_Log l WITH (NOLOCK) ON rci.rci_ID = l.log_ReceiptItemID
                LEFT JOIN LV_LogStock lsk WITH (NOLOCK) ON l.log_ID = lsk.lsk_LogID
                LEFT JOIN LV_LogStockPackType lsp WITH (NOLOCK) ON lsk.lsk_ID = lsp.lsp_LogStockID
                    AND lsp.lsp_CUQuantity IS NOT NULL
                -- Stock UOM
                LEFT JOIN LV_ItemUnit stockItu WITH (NOLOCK) ON lsp.lsp_ItemUnitID = stockItu.itu_ID
                LEFT JOIN LV_Unit stockUnit WITH (NOLOCK) ON stockItu.itu_UnitID = stockUnit.unt_ID
                -- Lot number
                LEFT JOIN LV_LogStockAttrValue lsa WITH (NOLOCK) ON lsk.lsk_ID = lsa.lsa_LogStockID
                LEFT JOIN LV_StockAttributes sa WITH (NOLOCK) ON lsa.lsa_AttributeID = sa.sat_ID AND sa.sat_ID = 1
                -- Lot expiration date
                LEFT JOIN Cus_T_ItemsLotExp lotExp WITH (NOLOCK)
                    ON lotExp.item = p.prd_PrimaryCode
                    AND lotExp.lot_number = lsa.lsa_Value
                -- X3 UOM Conversion for Lot
                OUTER APPLY (
                    SELECT TOP 1 iph.iph_quantity AS conversion_qty
                    FROM LV_ItemUnit x3Itu WITH (NOLOCK)
                    INNER JOIN LV_Unit x3Unit WITH (NOLOCK) ON x3Itu.itu_UnitID = x3Unit.unt_ID
                    INNER JOIN LV_ItemPackTypeHierarchy iph WITH (NOLOCK)
                        ON iph.iph_ChildItemUnitID = x3Itu.itu_ID
                        AND iph.iph_ParentItemUnitID = stockItu.itu_ID
                    WHERE x3Itu.itu_ProductID = rci.rci_ProductID
                      AND x3Unit.unt_Code = x3conv.uom_mantis
                ) AS lotToX3
                WHERE r.rct_Code = @receiptCode
                  AND lsa.lsa_Value IS NOT NULL
                GROUP BY
                    poRef.POReference,
                    x3conv.sku_x3,
                    p.prd_PrimaryCode,
                    x3conv.uom_mantis,
                    lsa.lsa_Value,
                    lotExp.exp_date,
                    lotToX3.conversion_qty
                HAVING SUM(lsp.lsp_Quantity) > 0
                ORDER BY poRef.POReference, x3conv.sku_x3, lsa.lsa_Value;
 
                ";

                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                var data = (await _dataAccess.GetDataInline<ReceiptDashboardLot, dynamic>(baseQuery, parameters)).ToList();

                return new ReceiptDownloadPdfResponse
                {
                    Data = data,
                };
            }
            catch
            {
                throw;
            }
        }

        //public async Task<TransferReceiptPdfDownload> getInboundTransferReceipt(string receiptCode)
        //{
        //    try
        //    {
        //        string baseQuery = @"
        //        DECLARE @ReceiptID BIGINT;

        //        -- STEP 1: isolate receipt
        //        SELECT @ReceiptID = rct_ID
        //        FROM LV_Receipt WITH (NOLOCK)
        //        WHERE rct_Code = @receiptCode;

        //        -- HEADER DATA (from old query)
        //        WITH TransferHeader AS (
        //            SELECT 
        //                r.rct_ID,
        //                r.rct_Code,
        //                r.rct_DocumentNumbers,
        //                r.rct_ActualDate,
        //                mc.fcy AS SourceWarehouse
        //            FROM LV_Receipt r WITH (NOLOCK)
        //            INNER JOIN Cus_ManualContainers mc WITH (NOLOCK)
        //                ON mc.ctrnum = r.rct_Code
        //            WHERE r.rct_Code = @receiptCode
        //        ),

        //        ReceiptLogs AS (
        //            SELECT log_ID
        //            FROM LV_Log WITH (NOLOCK)
        //            WHERE log_ReceiptID = @ReceiptID
        //        ),

        //        RawData AS (
        //            SELECT 
        //                @receiptCode AS rct_code,
        //                p.prd_PrimaryCode,
        //                u.unt_Code,
        //                lsa.lsa_Value AS ActualLot,
        //                lsp.lsp_Quantity,
        //                CASE WHEN mcd.ctrnum IS NOT NULL THEN 1 ELSE 0 END AS IsMatched,
        //                itu.itu_UseLevelID,
        //                mcd.input_lot_qty,
        //                mcd.input_sku AS input_item,
        //                mcd.input_lot
        //            FROM ReceiptLogs rl

        //            INNER JOIN LV_LogStock ls WITH (NOLOCK)
        //                ON rl.log_ID = ls.lsk_LogID

        //            INNER JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
        //                ON lsa.lsa_LogStockID = ls.lsk_ID
        //               AND lsa.lsa_Value IS NOT NULL

        //            INNER JOIN LV_StockAttributes sa WITH (NOLOCK)
        //                ON sa.sat_ID = lsa.lsa_AttributeID
        //               AND sa.sat_Code = '01'

        //            INNER JOIN LV_Product p WITH (NOLOCK)
        //                ON ls.lsk_ProductID = p.prd_ID

        //            INNER JOIN Cus_SageX3ToMantisConverion conv WITH (NOLOCK)
        //                ON conv.sku_mantis = p.prd_PrimaryCode

        //            -- PERFORMANCE UNIT RESOLUTION
        //            CROSS APPLY (
        //                SELECT TOP 1 itu.itu_ID, itu.itu_UnitID, itu.itu_UseLevelID
        //                FROM LV_ItemUnit itu WITH (NOLOCK)
        //                INNER JOIN LV_Unit u2 WITH (NOLOCK)
        //                    ON u2.unt_ID = itu.itu_UnitID
        //                   AND u2.unt_Code = conv.uom_mantis
        //                WHERE itu.itu_ProductID = p.prd_ID
        //                ORDER BY itu.itu_UseLevelID DESC
        //            ) itu

        //            INNER JOIN LV_Unit u WITH (NOLOCK)
        //                ON u.unt_ID = itu.itu_UnitID

        //            INNER JOIN LV_LogStockPackType lsp WITH (NOLOCK)
        //                ON lsp.lsp_LogStockID = ls.lsk_ID
        //               AND lsp.lsp_ItemUnitID = itu.itu_ID

        //            LEFT JOIN Cus_ManualContainerDetails mcd WITH (NOLOCK)
        //                ON mcd.ctrnum = @receiptCode
        //               AND conv.sku_x3 = mcd.input_sku
        //               AND lsa.lsa_Value = mcd.input_lot
        //        ),

        //        Aggregated AS (
        //            SELECT 
        //                rct_code,
        //                prd_PrimaryCode,
        //                unt_Code,
        //                ActualLot,
        //                SUM(lsp_Quantity) AS lot_qty,
        //                MAX(IsMatched) AS IsMatched,
        //                MAX(itu_UseLevelID) AS itu_UseLevelID,
        //                MAX(input_lot_qty) AS input_lot_qty,
        //                MAX(input_item) AS input_item,
        //                MAX(input_lot) AS input_lot
        //            FROM RawData
        //            GROUP BY 
        //                rct_code,
        //                prd_PrimaryCode,
        //                unt_Code,
        //                ActualLot
        //        ),

        //        Ranked AS (
        //            SELECT 
        //                *,
        //                CASE WHEN IsMatched = 1 THEN 'Matched'
        //                     ELSE 'Not Matched'
        //                END AS MatchStatus,
        //                ROW_NUMBER() OVER (
        //                    PARTITION BY prd_PrimaryCode, ActualLot
        //                    ORDER BY IsMatched DESC, itu_UseLevelID DESC
        //                ) AS rn
        //            FROM Aggregated
        //        )

        //        SELECT 
        //            th.rct_DocumentNumbers,
        //            th.SourceWarehouse,
        //            th.rct_ActualDate,

        //            r.rct_code,
        //            r.prd_PrimaryCode,
        //            r.unt_Code,
        //            r.ActualLot,
        //            r.lot_qty,
        //            r.IsMatched,
        //            r.itu_UseLevelID,
        //            r.input_lot_qty,
        //            r.input_item,
        //            r.input_lot,
        //            r.MatchStatus
        //        FROM Ranked r
        //        CROSS JOIN TransferHeader th
        //        WHERE r.rn = 1
        //        ORDER BY r.input_item, r.input_lot, r.ActualLot;



        //        ";

        //        var parameters = new DynamicParameters();
        //        parameters.Add("@ReceiptCode", receiptCode);

        //        var data = (await _dataAccess.GetDataInline<InboundTransferReceipt, dynamic>(baseQuery, parameters)).ToList();

        //        return new TransferReceiptPdfDownload
        //        {
        //            Data = data,
        //        };
        //    }
        //    catch
        //    {
        //        throw;
        //    }
        //}

        public async Task<TransferReceiptPdfDownload> getInboundTransferReceipt(string receiptCode)
        {
            try
            {
                string baseQuery = @"
               DECLARE @ReceiptId BIGINT;
                DECLARE @LotAttrId INT;

                -- 1) isolate receipt id (faster filtering)
                SELECT @ReceiptId = rct_ID
                FROM LV_Receipt WITH (NOLOCK)
                WHERE rct_Code = @receiptCode;

                -- 2) resolve lot attribute id for sat_Code = '01' once
                SELECT TOP 1 @LotAttrId = sat_ID
                FROM LV_StockAttributes WITH (NOLOCK)
                WHERE sat_Code = '01'
                ORDER BY sat_ID;

                ;WITH
                TransferHeader AS (
                   SELECT
                        r.rct_ID,
                        r.rct_Code,
                        r.rct_DocumentNumbers,
                        r.rct_ActualDate,
                        mc.fcy AS SourceWarehouse
                   FROM LV_Receipt r WITH (NOLOCK)
                   INNER JOIN Cus_ManualContainers mc WITH (NOLOCK)
                        ON mc.ctrnum = r.rct_Code
                   WHERE r.rct_Code = @receiptCode
                     AND mc.fcy IS NOT NULL
                ),

                -- limit products to this receipt (prevents conversion explosion)
                ReceiptProducts AS (
                    SELECT DISTINCT p.prd_ID, p.prd_PrimaryCode
                    FROM LV_ReceiptItem rci WITH (NOLOCK)
                    INNER JOIN LV_Product p WITH (NOLOCK)
                        ON rci.rci_ProductID = p.prd_ID
                    WHERE rci.rci_ReceiptID = @ReceiptId
                ),

                ConvFiltered AS (
                    SELECT DISTINCT c.sku_mantis, c.sku_x3, c.uom_mantis
                    FROM Cus_SageX3ToMantisConverion c WITH (NOLOCK)
                    INNER JOIN ReceiptProducts rp
                        ON rp.prd_PrimaryCode = c.sku_mantis
                ),

                ReceiptLogs AS (
                    SELECT l.log_ID
                    FROM LV_Log l WITH (NOLOCK)
                    WHERE l.log_ReceiptID = @ReceiptId
                ),

                LogStocks AS (
                    SELECT ls.lsk_ID, ls.lsk_ProductID
                    FROM ReceiptLogs rl
                    INNER JOIN LV_LogStock ls WITH (NOLOCK)
                        ON rl.log_ID = ls.lsk_LogID
                ),

                -- ==========================
                -- RawData: add header cols by joining TransferHeader (fix for your binding error)
                -- ==========================
                RawData AS (
                   SELECT
                        th.rct_Code AS rct_code,
                        rp.prd_PrimaryCode,

                        --  header fields you asked for
                        th.rct_DocumentNumbers,
                        th.rct_ActualDate,
                        th.SourceWarehouse,

                        iuPick.unt_Code,
                        lsa.lsa_Value AS ActualLot,
                        lsp.lsp_Quantity,
                        iuPick.itu_UseLevelID,
                        cf.sku_x3,
                        lsk.lsk_ID AS lsk_id
                   FROM LogStocks lsk
                   --  brings in rct_DocumentNumbers / rct_ActualDate / SourceWarehouse
                INNER JOIN TransferHeader th
                    ON th.rct_ID = @ReceiptId

                   INNER JOIN ReceiptProducts rp
                        ON rp.prd_ID = lsk.lsk_ProductID
                   INNER JOIN ConvFiltered cf
                        ON cf.sku_mantis = rp.prd_PrimaryCode

                   -- lot attribute 01
                   INNER JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
                        ON lsa.lsa_LogStockID = lsk.lsk_ID
                       AND lsa.lsa_AttributeID = @LotAttrId

                   -- pick one ItemUnit for this product & conversion uom (prevents duplicates)
                   CROSS APPLY (
                        SELECT TOP 1
                            iu.itu_ID,
                            iu.itu_UseLevelID,
                            u.unt_Code
                        FROM LV_ItemUnit iu WITH (NOLOCK)
                        INNER JOIN LV_Unit u WITH (NOLOCK)
                            ON u.unt_ID = iu.itu_UnitID
                        WHERE iu.itu_ProductID = rp.prd_ID
                          AND u.unt_Code = cf.uom_mantis
                        ORDER BY iu.itu_ID
                   ) AS iuPick

                   -- pack qty for that picked itemunit
                   INNER JOIN LV_LogStockPackType lsp WITH (NOLOCK)
                        ON lsp.lsp_LogStockID = lsk.lsk_ID
                       AND lsp.lsp_ItemUnitID = iuPick.itu_ID

                   WHERE lsa.lsa_Value IS NOT NULL
                     AND LTRIM(RTRIM(lsa.lsa_Value)) <> ''
                ),

                Aggregated AS (
                   SELECT
                        rct_code,
                        prd_PrimaryCode,

                        --  carry header fields forward
                        MAX(rct_DocumentNumbers) AS rct_DocumentNumbers,
                        MAX(rct_ActualDate)      AS rct_ActualDate,
                        MAX(SourceWarehouse)     AS SourceWarehouse,

                        unt_Code,
                        ActualLot,
                        sku_x3,
                        SUM(lsp_Quantity) AS lot_qty,
                        MAX(itu_UseLevelID) AS itu_UseLevelID
                   FROM RawData
                   GROUP BY
                        rct_code,
                        prd_PrimaryCode,
                        unt_Code,
                        ActualLot,
                        sku_x3
                ),

                MatchedData AS (
                   SELECT a.*,
                          CASE WHEN mcd.ctrnum IS NOT NULL THEN 1 ELSE 0 END AS IsMatched,
                          mcd.input_sku AS input_item,
                          mcd.input_lot
                   FROM Aggregated a
                   LEFT JOIN Cus_ManualContainerDetails mcd WITH (NOLOCK)
                       ON a.rct_code = mcd.ctrnum
                      AND a.sku_x3 = mcd.input_sku
                      AND a.ActualLot = mcd.input_lot
                ),

                AggregatedMatch AS (
                   SELECT
                        rct_code,
                        prd_PrimaryCode,

                        --  carry header fields forward
                        MAX(rct_DocumentNumbers) AS rct_DocumentNumbers,
                        MAX(rct_ActualDate)      AS rct_ActualDate,
                        MAX(SourceWarehouse)     AS SourceWarehouse,

                        unt_Code,
                        ActualLot,
                        MAX(lot_qty) AS lot_qty,
                        MAX(IsMatched) AS IsMatched,
                        MAX(itu_UseLevelID) AS itu_UseLevelID,
                        MAX(input_item) AS input_item,
                        MAX(input_lot) AS input_lot
                   FROM MatchedData
                   GROUP BY
                        rct_code,
                        prd_PrimaryCode,
                        unt_Code,
                        ActualLot
                ),

                InputLotQty AS (
                   SELECT input_sku, input_lot,
                          SUM(CAST(input_lot_qty AS DECIMAL(18,2))) AS input_lot_qty
                   FROM Cus_ManualContainerDetails WITH (NOLOCK)
                   WHERE ctrnum = @receiptCode
                   GROUP BY input_sku, input_lot
                ),

                Ranked AS (
                   SELECT
                        a.*,
                        CASE WHEN a.IsMatched = 1 THEN 'Matched' ELSE 'Not Matched' END AS MatchStatus,
                        ilq.input_lot_qty,
                        ROW_NUMBER() OVER (
                            PARTITION BY a.prd_PrimaryCode, a.ActualLot
                            ORDER BY a.IsMatched DESC, a.itu_UseLevelID DESC
                        ) AS rn
                   FROM AggregatedMatch a
                   LEFT JOIN InputLotQty ilq
                        ON a.input_item = ilq.input_sku
                       AND a.input_lot  = ilq.input_lot
                )

                SELECT
                    rct_code,
                    rct_DocumentNumbers,
                    rct_ActualDate,
                    SourceWarehouse,

                    prd_PrimaryCode,
                    unt_Code,
                    ActualLot,
                    lot_qty,
                    input_lot_qty,
                    input_item,
                    input_lot,
                    MatchStatus
                FROM Ranked
                WHERE rn = 1
                  AND ActualLot IS NOT NULL
                  AND LTRIM(RTRIM(ActualLot)) <> ''
                ORDER BY input_item, input_lot, ActualLot;


                ";

                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                var data = (await _dataAccess.GetDataInline<InboundTransferReceipt, dynamic>(baseQuery, parameters)).ToList();

                return new TransferReceiptPdfDownload
                {
                    Data = data,
                };
            }
            catch
            {
                throw;
            }
        }

        //public async Task<DiscrepancyBreakdownPdfDownload> GetDiscrepancyData(string receiptCode)
        //{
        //    try
        //    {
        //        string baseQuery = @"
        //      --  Step 0: isolate receipt id early (BIG performance gain)
        //        DECLARE @ReceiptId BIGINT;

        //        SELECT @ReceiptId = rct_ID
        //        FROM LV_Receipt WITH (NOLOCK)
        //        WHERE rct_Code = @receiptCode;

        //        --  Step 0b: resolve Lot attribute id once (avoid join on StockAttributes repeatedly)
        //        DECLARE @LotAttrId INT;

        //        SELECT @LotAttrId = sat_ID
        //        FROM LV_StockAttributes WITH (NOLOCK)
        //        WHERE sat_Code = '01';


        //        WITH TransferHeader AS (
        //            -- Receipt header (kept as-is logically; now uses @ReceiptId)
        //            SELECT r.rct_ID,
        //                   r.rct_Code,
        //                   r.rct_DocumentNumbers,
        //                   r.rct_ActualDate AS ReceiptDate,
        //                   mc.fcy AS SourceWarehouse
        //            FROM LV_Receipt r WITH (NOLOCK)
        //            INNER JOIN Cus_ManualContainers mc WITH (NOLOCK)
        //                ON mc.ctrnum = r.rct_Code
        //            WHERE r.rct_ID = @ReceiptId
        //              AND mc.fcy IS NOT NULL
        //        ),

        //        --  Step 1: limit logs to this receipt only (prevents scanning whole LV_Log)
        //        ReceiptLogs AS (
        //            SELECT log_ID
        //            FROM LV_Log WITH (NOLOCK)
        //            WHERE log_ReceiptID = @ReceiptId
        //        ),

        //        RawData AS (
        //            -- Raw rows for actual receipt lots + optional match to manual container details (same output logic)
        //            SELECT
        //                   @receiptCode AS rct_code,                -- constant, avoids touching rct_code repeatedly
        //                   p.prd_PrimaryCode,
        //                   conv.sku_x3 AS X3_SKU,
        //                   u.unt_Code,
        //                   lsa.lsa_Value AS ActualLot,
        //                   lsp.lsp_Quantity,
        //                   CASE WHEN mcd.ctrnum IS NOT NULL THEN 1 ELSE 0 END AS IsMatched,
        //                   iu.itu_UseLevelID,
        //                   mcd.input_lot_qty,
        //                   mcd.input_sku AS input_item,
        //                   mcd.input_lot
        //            FROM ReceiptLogs rl
        //            INNER JOIN LV_LogStock ls WITH (NOLOCK)
        //                ON rl.log_ID = ls.lsk_LogID
        //            INNER JOIN LV_Product p WITH (NOLOCK)
        //                ON ls.lsk_ProductID = p.prd_ID
        //            INNER JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
        //                ON lsa.lsa_LogStockID = ls.lsk_ID
        //               AND lsa.lsa_AttributeID = @LotAttrId        --  replaces join on LV_StockAttributes
        //            INNER JOIN Cus_SageX3ToMantisConverion conv WITH (NOLOCK)
        //                ON conv.sku_mantis = p.prd_PrimaryCode
        //            INNER JOIN LV_ItemUnit iu WITH (NOLOCK)
        //                ON iu.itu_ProductID = p.prd_ID
        //            INNER JOIN LV_Unit u WITH (NOLOCK)
        //                ON u.unt_ID = iu.itu_UnitID
        //               AND u.unt_Code = conv.uom_mantis
        //            INNER JOIN LV_LogStockPackType lsp WITH (NOLOCK)
        //                ON lsp.lsp_LogStockID = ls.lsk_ID
        //               AND lsp.lsp_ItemUnitID = iu.itu_ID
        //            LEFT JOIN Cus_ManualContainerDetails mcd WITH (NOLOCK)
        //                ON mcd.ctrnum = @receiptCode
        //               AND conv.sku_x3 = mcd.input_sku
        //               AND lsa.lsa_Value = mcd.input_lot
        //        ),

        //        Aggregated AS (
        //            -- Aggregate to lot level (same logic)
        //            SELECT
        //                   rct_code,
        //                   prd_PrimaryCode,
        //                   X3_SKU,
        //                   unt_Code,
        //                   ActualLot,
        //                   SUM(lsp_Quantity) AS lot_qty,
        //                   MAX(IsMatched) AS IsMatched,
        //                   MAX(itu_UseLevelID) AS itu_UseLevelID,
        //                   MAX(input_lot_qty) AS input_lot_qty,
        //                   MAX(input_item) AS input_item,
        //                   MAX(input_lot) AS input_lot
        //            FROM RawData
        //            GROUP BY rct_code, prd_PrimaryCode, X3_SKU, unt_Code, ActualLot
        //        ),

        //        --  Step 2: build actual item+lot existence set ONCE (used for ShortShipped)
        //        ActualItemLots AS (
        //            SELECT DISTINCT
        //                   X3_SKU,
        //                   ActualLot
        //            FROM Aggregated
        //        ),

        //        Ranked AS (
        //            -- Rank to keep best row per (item,lot) (same logic)
        //            SELECT *,
        //                   CASE WHEN IsMatched = 1 THEN 'Matched' ELSE 'Not Matched' END AS MatchStatus,
        //                   ROW_NUMBER() OVER (
        //                       PARTITION BY prd_PrimaryCode, ActualLot
        //                       ORDER BY IsMatched DESC, itu_UseLevelID DESC
        //                   ) AS rn
        //            FROM Aggregated
        //        ),

        //        ShortShipped AS (
        //            --  Same “short shipped” logic, but FAST:
        //            -- Expected rows where (item+lot) NOT found in ActualItemLots
        //            SELECT
        //                   mcd.ctrnum AS rct_code,
        //                   conv.sku_mantis AS prd_PrimaryCode,
        //                   mcd.input_sku AS X3_SKU,
        //                   NULL AS unt_Code,
        //                   NULL AS ActualLot,
        //                   0 AS lot_qty,
        //                   mcd.input_lot_qty,
        //                   mcd.input_sku AS input_item,
        //                   mcd.input_lot,
        //                   'Short Shipped' AS MatchStatus
        //            FROM Cus_ManualContainerDetails mcd WITH (NOLOCK)
        //            LEFT JOIN Cus_SageX3ToMantisConverion conv WITH (NOLOCK)
        //                ON conv.sku_x3 = mcd.input_sku
        //            WHERE mcd.ctrnum = @receiptCode
        //              AND NOT EXISTS (
        //                  SELECT 1
        //                  FROM ActualItemLots a
        //                  WHERE a.X3_SKU = mcd.input_sku
        //                    AND a.ActualLot = mcd.input_lot
        //              )
        //        ),

        //        BaseResult AS (
        //            -- Actual lots (only rn = 1)
        //            SELECT
        //                r.rct_code,
        //                r.prd_PrimaryCode,
        //                r.X3_SKU,
        //                r.ActualLot,
        //                r.lot_qty,
        //                r.input_item,
        //                r.input_lot_qty,
        //                r.input_lot,
        //                r.MatchStatus
        //            FROM Ranked r
        //            WHERE r.rn = 1

        //            UNION ALL

        //            -- Expected-only lots (Short Shipped)
        //            SELECT
        //                s.rct_code,
        //                s.prd_PrimaryCode,
        //                s.X3_SKU,
        //                s.ActualLot,
        //                s.lot_qty,
        //                s.input_item,
        //                s.input_lot_qty,
        //                s.input_lot,
        //                s.MatchStatus
        //            FROM ShortShipped s
        //        ),

        //        DiscrepantItems AS (
        //            -- same rules
        //            SELECT DISTINCT br.X3_SKU
        //            FROM BaseResult br
        //            WHERE
        //                br.MatchStatus IN ('Not Matched', 'Short Shipped')
        //                OR (
        //                    br.MatchStatus = 'Matched'
        //                    AND ISNULL(CAST(br.lot_qty AS DECIMAL(18,3)), 0)
        //                        <> ISNULL(CAST(br.input_lot_qty AS DECIMAL(18,3)), 0)
        //                )
        //        )

        //        SELECT
        //            br.prd_PrimaryCode,
        //            br.ActualLot,
        //            br.lot_qty,
        //            br.input_item,
        //            br.input_lot_qty,
        //            br.input_lot
        //        FROM BaseResult br
        //        INNER JOIN DiscrepantItems di
        //            ON di.X3_SKU = br.X3_SKU
        //        ORDER BY
        //            br.input_item,
        //            br.input_lot,
        //            br.ActualLot
        //        ";

        //        var parameters = new DynamicParameters();
        //        parameters.Add("@ReceiptCode", receiptCode);

        //        var data = (await _dataAccess.GetDataInline<DiscrepancyBreakdownReceipt, dynamic>(baseQuery, parameters)).ToList();

        //        return new DiscrepancyBreakdownPdfDownload
        //        {
        //            Data = data,
        //        };
        //    }
        //    catch
        //    {
        //        throw;
        //    }
        //}
        public async Task<DiscrepancyBreakdownPdfDownload> GetDiscrepancyData(string receiptCode)
        {
            try
            {
                string baseQuery = @"
             DECLARE @ReceiptId BIGINT;
                DECLARE @LotAttrId INT;

                SELECT @ReceiptId = rct_ID
                FROM LV_Receipt WITH (NOLOCK)
                WHERE rct_Code = @receiptCode;

                SELECT TOP 1 @LotAttrId = sat_ID
                FROM LV_StockAttributes WITH (NOLOCK)
                WHERE sat_Code = '01'
                ORDER BY sat_ID;

                ;WITH
                ReceiptProducts AS (
                    SELECT DISTINCT p.prd_ID, p.prd_PrimaryCode
                    FROM LV_ReceiptItem rci WITH (NOLOCK)
                    INNER JOIN LV_Product p WITH (NOLOCK) ON rci.rci_ProductID = p.prd_ID
                    WHERE rci.rci_ReceiptID = @ReceiptId
                ),
                ConvRanked AS (
                    SELECT
                        c.sku_mantis,
                        c.sku_x3,
                        c.uom_mantis,
                        ROW_NUMBER() OVER (
                            PARTITION BY c.sku_mantis
                            ORDER BY
                                CASE c.uom_mantis
                                    WHEN 'CS' THEN 1
                                    WHEN 'BX' THEN 2
                                    WHEN 'BG' THEN 2
                                    WHEN 'EA' THEN 3
                                    ELSE 4
                                END
                        ) AS rn
                    FROM Cus_SageX3ToMantisConverion c WITH (NOLOCK)
                    INNER JOIN ReceiptProducts rp ON rp.prd_PrimaryCode = c.sku_mantis
                ),
                ConvFiltered AS (
                    SELECT sku_mantis, sku_x3, uom_mantis
                    FROM ConvRanked
                    WHERE rn = 1
                ),
                ReceiptLogs AS (
                    SELECT l.log_ID
                    FROM LV_Log l WITH (NOLOCK)
                    WHERE l.log_ReceiptID = @ReceiptId
                ),
                LogStocks AS (
                    SELECT ls.lsk_ID, ls.lsk_ProductID
                    FROM ReceiptLogs rl
                    INNER JOIN LV_LogStock ls WITH (NOLOCK) ON rl.log_ID = ls.lsk_LogID
                ),

                -- ACTUAL lots from logs
                ActualLots AS (
                    SELECT
                        @receiptCode AS rct_code,
                        rp.prd_PrimaryCode,
                        cf.sku_x3 AS input_item,
                        lsa.lsa_Value AS ActualLot,
                        SUM(lsp.lsp_Quantity) AS lot_qty
                    FROM LogStocks lsk
                    INNER JOIN ReceiptProducts rp ON rp.prd_ID = lsk.lsk_ProductID
                    INNER JOIN ConvFiltered cf ON cf.sku_mantis = rp.prd_PrimaryCode
                    INNER JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
                        ON lsa.lsa_LogStockID = lsk.lsk_ID
                       AND lsa.lsa_AttributeID = @LotAttrId
                    CROSS APPLY (
                        SELECT TOP 1 iu.itu_ID
                        FROM LV_ItemUnit iu WITH (NOLOCK)
                        INNER JOIN LV_Unit u WITH (NOLOCK) ON u.unt_ID = iu.itu_UnitID
                        WHERE iu.itu_ProductID = rp.prd_ID
                          AND u.unt_Code = cf.uom_mantis
                        ORDER BY iu.itu_ID
                    ) AS iuPick
                    INNER JOIN LV_LogStockPackType lsp WITH (NOLOCK)
                        ON lsp.lsp_LogStockID = lsk.lsk_ID
                       AND lsp.lsp_ItemUnitID = iuPick.itu_ID
                    WHERE lsa.lsa_Value IS NOT NULL
                      AND LTRIM(RTRIM(lsa.lsa_Value)) <> ''
                    GROUP BY
                        rp.prd_PrimaryCode,
                        cf.sku_x3,
                        lsa.lsa_Value
                ),

                -- INPUT lots from container details
                InputLots AS (
                    SELECT
                        mcd.ctrnum AS rct_code,
                        mcd.input_sku AS input_item,
                        mcd.input_lot AS input_lot,
                        SUM(CAST(mcd.input_lot_qty AS DECIMAL(18,2))) AS input_lot_qty
                    FROM Cus_ManualContainerDetails mcd WITH (NOLOCK)
                    WHERE mcd.ctrnum = @receiptCode
                    GROUP BY mcd.ctrnum, mcd.input_sku, mcd.input_lot
                ),

                -- FULL compare (Matched / Not Matched / ShortShipped + qty mismatch)
                LotCompare AS (
                    SELECT
                        COALESCE(a.rct_code, i.rct_code) AS rct_code,

                        -- prd_PrimaryCode only comes from Actual side.
                        a.prd_PrimaryCode AS prd_PrimaryCode,

                        a.ActualLot,
                        ISNULL(a.lot_qty, 0) AS lot_qty,

                        COALESCE(a.input_item, i.input_item) AS input_item,
                        i.input_lot_qty,
                        i.input_lot,

                        CASE
                            WHEN a.ActualLot IS NOT NULL AND i.input_lot IS NOT NULL THEN 'Matched'
                            WHEN a.ActualLot IS NOT NULL AND i.input_lot IS NULL     THEN 'Not Matched'
                            WHEN a.ActualLot IS NULL     AND i.input_lot IS NOT NULL THEN 'Short Shipped'
                            ELSE 'Unknown'
                        END AS MatchStatus,

                        CASE
                            WHEN a.ActualLot IS NOT NULL AND i.input_lot IS NULL THEN 1
                            WHEN a.ActualLot IS NULL     AND i.input_lot IS NOT NULL THEN 1
                            WHEN a.ActualLot IS NOT NULL AND i.input_lot IS NOT NULL
                                 AND ISNULL(a.lot_qty,0) <> ISNULL(i.input_lot_qty,0) THEN 1
                            ELSE 0
                        END AS IsDiscrepancyRow
                    FROM ActualLots a
                    FULL OUTER JOIN InputLots i
                        ON i.input_item = a.input_item
                       AND i.input_lot  = a.ActualLot
                ),

                DiscrepancyItems AS (
                    SELECT input_item
                    FROM LotCompare
                    GROUP BY input_item
                    HAVING MAX(IsDiscrepancyRow) = 1
                )

                SELECT
                    prd_PrimaryCode,
                    ActualLot,
                    lot_qty,
                    input_item,
                    input_lot_qty,
                    input_lot
                FROM LotCompare
                WHERE input_item IN (SELECT input_item FROM DiscrepancyItems)
                ORDER BY
                    input_item,
                    COALESCE(input_lot, ActualLot),
                    ActualLot;
                ";

                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);

                var data = (await _dataAccess.GetDataInline<DiscrepancyBreakdownReceipt, dynamic>(baseQuery, parameters)).ToList();

                return new DiscrepancyBreakdownPdfDownload
                {
                    Data = data,
                };
            }
            catch
            {
                throw;
            }
        }

        public async Task<ReceiptSelectionResponse> GetReceiptsInExecution(ReceiptSelectionRequest request)
        {
            var selectSql = @"
            SELECT 
                r.rct_Code AS ReceiptCode,
                r.rct_ID AS Id,
                r.rct_InputDate,
                r.rct_LineCount,
                ps.pst_Code,
                m.msg_Greek AS ReceiptStatus,
                CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,
                ISNULL(po.PONumber, '-') AS PONumber
            FROM LV_Receipt r
            JOIN LV_ProgressStatus ps 
                ON r.rct_ProgressID = ps.pst_ID
            JOIN LV_Messages m 
                ON m.msg_Code = ps.pst_MessageCode
            OUTER APPLY
            (
                SELECT STRING_AGG(CAST(x.PONumber AS VARCHAR(50)), ', ') AS PONumber
                FROM
                (
                    SELECT DISTINCT rrv.rrv_Value AS PONumber
                    FROM LV_ReceiptItem rci
                    LEFT JOIN LV_ReceiptItemRctAttrValue rrv
                        ON rci.rci_ID = rrv.rrv_ReceiptItemID
                        AND rrv.rrv_ReceiptAttributeID = 4
                    WHERE rci.rci_ReceiptID = r.rct_ID
                        AND rrv.rrv_Value IS NOT NULL
                        AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
                        AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> '0' -- ✅ FIX

                ) x
            ) po
            ";

           var whereSql = @"
            WHERE m.msg_LanguageID = 1 
                AND m.msg_Greek = 'Executing'
            AND Not EXISTS 
            (
                SELECT 1 
                FROM Cus_ManualContainers cmc
                WHERE cmc.ctrnum = r.rct_Code
                AND cmc.is_transfer = 1
           )
           ";



            //  CHANGE: exclude NULL, empty, and '0' PO
            whereSql += @"
            AND po.PONumber IS NOT NULL
            AND LTRIM(RTRIM(po.PONumber)) <> ''
            AND po.PONumber <> '0'
            ";



            var groupBySql = @"";
          var countSql = @"
            SELECT COUNT(DISTINCT r.rct_ID)
            FROM LV_Receipt r
            JOIN LV_ProgressStatus ps 
                ON r.rct_ProgressID = ps.pst_ID
            JOIN LV_Messages m 
                ON m.msg_Code = ps.pst_MessageCode
            WHERE m.msg_LanguageID = 1 
              AND m.msg_Greek = 'Executing'
            AND Not EXISTS 
              (
                  SELECT 1 
                  FROM Cus_ManualContainers cmc
                  WHERE cmc.ctrnum = r.rct_Code
                    AND cmc.is_transfer = 1
          )
          ";



            //  SAME CHANGE IN COUNT QUERY
            countSql += @"
            AND EXISTS
            (
                SELECT 1
                FROM LV_ReceiptItem rci
                JOIN LV_ReceiptItemRctAttrValue rrv
                    ON rci.rci_ID = rrv.rrv_ReceiptItemID
                   AND rrv.rrv_ReceiptAttributeID = 4
                WHERE rci.rci_ReceiptID = r.rct_ID
                  AND rrv.rrv_Value IS NOT NULL
                  AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
                  AND rrv.rrv_Value <> '0'
            )";

           var parameters = new DynamicParameters();

            var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
              { "receiptCode", "r.rct_Code" },
              { "receiptStatus", "m.msg_Greek" }
            };



            // FILTERING (UNCHANGED)
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;



                    var column = filter.Key.Trim();
                    var value = filter.Value.value.Trim();



                    if (!allowedColumns.ContainsKey(column))
                        continue;



                    var dbColumn = allowedColumns[column];
                    var paramName = column.Replace(".", "_");



                    whereSql += $" AND {dbColumn} LIKE @{paramName}";
                    countSql += $" AND {dbColumn} LIKE @{paramName}";



                    parameters.Add(paramName, $"%{value}%");
                }
            }



            var sql = selectSql + whereSql + groupBySql;



            // SORTING (UNCHANGED)
            if (!string.IsNullOrWhiteSpace(request.sortField) &&
         allowedColumns.ContainsKey(request.sortField) &&
         !string.IsNullOrWhiteSpace(request.sortOrder))
            {
                var sortColumn = allowedColumns[request.sortField];
                var sortDirection = request.sortOrder == "1" ? "ASC" : "DESC";



                sql += $" ORDER BY {sortColumn} {sortDirection}";
            }
            else
            {
                sql += " ORDER BY r.rct_ID DESC";
            }

           // PAGINATION (UNCHANGED)
            sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("Skip", request.first ?? 0, DbType.Int32);
            parameters.Add("Rows", request.rows ?? 10, DbType.Int32);
             var data = await _dataAccess.GetDataInline<ReceiptSelectionData, DynamicParameters>(sql, parameters);
            var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();
            return new ReceiptSelectionResponse
            {
                data = data,
                totalRecords = totalCount,
                error = 0,
            };
        }
        public async Task<ReceiptSelectionResponse> GetAllReceipt(ReceiptSelectionRequest request)
        {
            var selectSql = @"
            SELECT 
                r.rct_Code AS ReceiptCode,
                r.rct_ID AS Id,
                r.rct_InputDate,
                r.rct_LineCount,
                ps.pst_Code,
                m.msg_Greek AS ReceiptStatus,
                CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,
                ISNULL(po.PONumber, '-') AS PONumber
            FROM LV_Receipt r
            JOIN LV_ProgressStatus ps 
                ON r.rct_ProgressID = ps.pst_ID
            JOIN LV_Messages m 
                ON m.msg_Code = ps.pst_MessageCode
            OUTER APPLY
            (
                SELECT STRING_AGG(CAST(x.PONumber AS VARCHAR(50)), ', ') AS PONumber
                FROM
                (
                    SELECT DISTINCT rrv.rrv_Value AS PONumber
                    FROM LV_ReceiptItem rci
                    LEFT JOIN LV_ReceiptItemRctAttrValue rrv
                        ON rci.rci_ID = rrv.rrv_ReceiptItemID
                       AND rrv.rrv_ReceiptAttributeID = 4
                    WHERE rci.rci_ReceiptID = r.rct_ID
                      AND rrv.rrv_Value IS NOT NULL
                      AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
                      AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> '0'  -- ✅ FIX
                ) x
            ) po
            ";
            var whereSql = @"
             WHERE m.msg_LanguageID = 1
              AND Not EXISTS 
            (
              SELECT 1 
              FROM Cus_ManualContainers cmc
              WHERE cmc.ctrnum = r.rct_Code
                AND cmc.is_transfer = 1
            )
            ";
            //  FINAL FILTER (after aggregation)
            whereSql += @"
            AND po.PONumber IS NOT NULL
            AND LTRIM(RTRIM(po.PONumber)) <> ''
            AND po.PONumber <> '0'
            ";

           var groupBySql = @"";
           var countSql = @"
            SELECT COUNT(DISTINCT r.rct_ID)
            FROM LV_Receipt r
            JOIN LV_ProgressStatus ps 
                ON r.rct_ProgressID = ps.pst_ID
            JOIN LV_Messages m 
                ON m.msg_Code = ps.pst_MessageCode
            WHERE m.msg_LanguageID = 1
             AND Not EXISTS 
            (
                  SELECT 1 
                  FROM Cus_ManualContainers cmc
                  WHERE cmc.ctrnum = r.rct_Code
                    AND cmc.is_transfer = 1
           )
           ";

            //  SAME LOGIC IN COUNT
            countSql += @"
            AND EXISTS
            (
                SELECT 1
                FROM LV_ReceiptItem rci
                JOIN LV_ReceiptItemRctAttrValue rrv
                    ON rci.rci_ID = rrv.rrv_ReceiptItemID
                   AND rrv.rrv_ReceiptAttributeID = 4
                WHERE rci.rci_ReceiptID = r.rct_ID
                  AND rrv.rrv_Value IS NOT NULL
                  AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
                  AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> '0' -- ✅ FIX
            )";

          var parameters = new DynamicParameters();

           var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
           {
             { "receiptCode", "r.rct_Code" },
             { "receiptStatus", "m.msg_Greek" }
           };

              // FILTERING (UNCHANGED)
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;



                    var column = filter.Key.Trim();
                    var value = filter.Value.value.Trim();



                    if (!allowedColumns.ContainsKey(column))
                        continue;



                    var dbColumn = allowedColumns[column];
                    var paramName = column.Replace(".", "_");



                    whereSql += $" AND {dbColumn} LIKE @{paramName}";
                    countSql += $" AND {dbColumn} LIKE @{paramName}";



                    parameters.Add(paramName, $"%{value}%");
                }
            }
             var sql = selectSql + whereSql + groupBySql;

            // SORTING (UNCHANGED)
            if (!string.IsNullOrWhiteSpace(request.sortField) &&
          allowedColumns.ContainsKey(request.sortField) &&
          !string.IsNullOrWhiteSpace(request.sortOrder))
            {
                var sortColumn = allowedColumns[request.sortField];
                var sortDirection = request.sortOrder == "1" ? "ASC" : "DESC";



                sql += $" ORDER BY {sortColumn} {sortDirection}";
            }
            else
            {
                sql += " ORDER BY r.rct_ID DESC";
            }

             // PAGINATION (UNCHANGED)
            sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("Skip", request.first ?? 0, DbType.Int32);
            parameters.Add("Rows", request.rows ?? 10, DbType.Int32);
             var data = await _dataAccess.GetDataInline<ReceiptSelectionData, DynamicParameters>(sql, parameters);
            var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();
            return new ReceiptSelectionResponse
            {
                data = data,
                totalRecords = totalCount,
                error = 0,
            };
        }

        public async Task<ReceiptDetailsResponse> GetReceiptDetails(ReceiptDetailsRequest request, string receiptCode)
        {
            try
            {
                var parameters = new DynamicParameters();

                parameters.Add("Skip", request.first);
                parameters.Add("Rows", request.rows);
                parameters.Add("receiptCode", receiptCode);
                var result = (await _dataAccess.GetData<ReceiptDetails, DynamicParameters>("Cus_Sp_GetReceiptDiscrepancyWithPo", parameters)).ToList();

                return new ReceiptDetailsResponse
                {
                    Data = result,
                    TotalRecords = result.FirstOrDefault()?.TotalRecords ?? 0,
                    Error = 0

                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ReceiptLotDetailsResponse> GetReceiptDetailsLot(ReceiptLotDetailsRequest request, string receiptCode)
        {
            try
            {


                var parameters = new DynamicParameters();

                parameters.Add("Skip", request.first);
                parameters.Add("Rows", request.rows);
                parameters.Add("receiptCode", receiptCode);
                var result = await _dataAccess.GetData<ReceiptLotDetails, DynamicParameters>("Cus_Sp_GetReceiptDiscrepancyWithLot", parameters);

                return new ReceiptLotDetailsResponse
                {
                    Data = result,
                    TotalRecords = result.FirstOrDefault()?.TotalRecords ?? 0,
                    Error = 0

                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<ReceiptDetailsResponse> GetDiscrepancyItemsOnly(string receiptCode)
        {
            try
            {
                var parameters = new DynamicParameters();
                parameters.Add("receiptCode", receiptCode);

                var result = await _dataAccess.GetData<ReceiptDetails, DynamicParameters>("Cus_Sp_GetDiscrepancyItemsOnly", parameters);

                return new ReceiptDetailsResponse
                {
                    Data = result,
                    TotalRecords = result.FirstOrDefault()?.TotalRecords ?? 0,
                    Error = 0

                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }



        //public async Task<ReceiptStatusResponse> UpdateReceiptStatus(int receiptId, UpdateReceiptRequest request)
        //{
        //    try
        //    {
        //        // 1. GET RECEIPT CODE
        //        string receiptCode = request?.receiptCode?.Trim() ?? string.Empty;

        //        if (string.IsNullOrWhiteSpace(receiptCode))
        //        {
        //            var receiptSql = @"
        //           SELECT TOP 1 rct_Code
        //            FROM LV_Receipt WITH (NOLOCK)
        //             WHERE rct_ID = @ReceiptId
        //            ";

        //            var receiptResult = (await _dataAccess.GetDataInline<dynamic, dynamic>(
        //                receiptSql,
        //                new { ReceiptId = receiptId }
        //            )).FirstOrDefault();

        //            receiptCode = receiptResult?.rct_Code?.ToString() ?? string.Empty;
        //        }

        //        if (string.IsNullOrWhiteSpace(receiptCode))
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "Receipt code not found."
        //            };
        //        }

        //        // 2. CALL DISCREPANCY SP
        //        var discrepancyParams = new DynamicParameters();
        //        discrepancyParams.Add("@receiptCode", receiptCode);

        //        var discrepancyItems = (await _dataAccess.GetData<ReceiptDetails, DynamicParameters>(
        //            "Cus_Sp_GetDiscrepancyItemsOnly",
        //            discrepancyParams
        //        )).ToList();

        //        bool hasDiscrepancy = discrepancyItems.Any();

        //        string moduleName = "Receipt Export Notifications";

        //        var query = @"SELECT * FROM Cus_NotificationSetting WHERE nst_ModuleName = @ModuleName;";
        //        var result = await _dataAccess.GetDataInline<ManualEmailResponse, object>(
        //            query,
        //            new { ModuleName = moduleName }
        //        );

        //        var data = result.ToList();

        //        // 3. DECIDE EVENT CODE
        //        string eventCode = hasDiscrepancy
        //            ? "RECEIPT_EXPORT_DISCREPANCY"
        //            : "RECEIPT_EXPORT";

        //        // 4. FETCH TRIGGER + EMAILS
        //        var triggerSql = @"
        //        SELECT TOP 1
        //            ntg.ntg_ID,
        //            ntg.ntg_IsEnabled,
        //            ntg.ntg_EventName As EventName,
        //            nst.nst_Primary_Emails,
        //            nst.nst_Secondary_Emails
        //        FROM Cus_NotificationTrigger ntg WITH (NOLOCK)
        //        INNER JOIN Cus_NotificationSetting nst WITH (NOLOCK)
        //            ON ntg.ntg_NotificationSettingID = nst.nst_ID
        //        WHERE ntg.ntg_EventCode = @EventCode
        //          AND nst.nst_ModuleCode = 'RECEIPT_EXPORT'
        //          AND nst.nst_IsActive = 1
        //        ";

        //        var triggerParams = new DynamicParameters();
        //        triggerParams.Add("@EventCode", eventCode);

        //        var triggerInfo = (await _dataAccess.GetDataInline<dynamic, DynamicParameters>(
        //            triggerSql,
        //            triggerParams
        //        )).FirstOrDefault();

        //        if (triggerInfo == null)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = $"Notification trigger configuration not found for event {eventCode}."
        //            };
        //        }

        //        int triggerId = Convert.ToInt32(triggerInfo.ntg_ID);
        //        int triggerEnabled = Convert.ToInt32(triggerInfo.ntg_IsEnabled);

        //        if (triggerEnabled == 0)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = $"Notification trigger is off for event {eventCode}."
        //            };
        //        }

        //        string primaryEmails = triggerInfo.nst_Primary_Emails?.ToString() ?? "";
        //        string secondaryEmails = triggerInfo.nst_Secondary_Emails?.ToString() ?? "";

        //        //  FIX: VALIDATE BEFORE UPDATE
        //        if (string.IsNullOrWhiteSpace(primaryEmails) ||
        //            primaryEmails.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase))
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "Primary mail is not present."
        //            };
        //        }

        //        // 5. PREPARE EMAIL LIST
        //        var allEmails = (primaryEmails + "," + secondaryEmails)
        //            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //            .Select(x => x.Trim())
        //            .Where(x => !string.IsNullOrWhiteSpace(x))
        //            .Distinct(StringComparer.OrdinalIgnoreCase)
        //            .ToList();

        //        if (!allEmails.Any())
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "No recipient emails found."
        //            };
        //        }

        //        // UPDATE STATUS
        //        var updateSql = @"
        //        UPDATE LV_Receipt
        //        SET rct_ProgressID = 3
        //        WHERE rct_ID = @ReceiptId
        //        ";

        //        var updateParams = new DynamicParameters();
        //        updateParams.Add("@ReceiptId", receiptId);

        //        var rowsAffected = await _dataAccess.SaveDataInline(updateSql, updateParams);

        //        if (rowsAffected <= 0)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "No Receipt updated"
        //            };
        //        }

        //        var templateSql = @"
        //        SELECT TOP 1
        //            ntp.ntp_Subject AS Subject,
        //            ntp.ntp_Body AS Body
        //        FROM Cus_NotificationTemplate ntp WITH (NOLOCK)
        //        WHERE ntp.ntp_NotificationTriggerID = @TriggerId
        //          AND ntp.ntp_IsDefault = 1
        //        ";

        //        var templateParams = new DynamicParameters();
        //        templateParams.Add("@TriggerId", triggerId);

        //        var template = (await _dataAccess.GetDataInline<dynamic, DynamicParameters>(
        //            templateSql,
        //            templateParams
        //        )).FirstOrDefault();

        //        if (template == null)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = $"Notification template not found for event {eventCode}."
        //            };
        //        }

        //        string subjectTemplate = template.Subject?.ToString() ?? "";
        //        string bodyTemplate = template.Body?.ToString() ?? "";

        //        var estTime = TimeZoneInfo.ConvertTimeFromUtc(
        //            DateTime.UtcNow,
        //            TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time")
        //        );

        //        string readyDate = estTime.ToString("dd/MM/yyyy HH:mm:ss");
        //        string receivedBy = request?.UserName ?? "";
        //        string poNumber = discrepancyItems.FirstOrDefault()?.PO ?? "";

        //        string discrepancyText = string.Empty;

        //        if (discrepancyItems.Any())
        //        {
        //            var parts = discrepancyItems.Select(x =>
        //            {
        //                decimal diff = Convert.ToDecimal(x.ActualQty) - Convert.ToDecimal(x.ExpectedQty);
        //                string diffText = diff > 0 ? $"+{diff:0.##}" : $"{diff:0.##}";
        //                return $"Item {x.ItemCode} ({diffText})";
        //            });

        //            discrepancyText = string.Join(" . ", parts);
        //        }

        //        string finalSubject = subjectTemplate;
        //        string finalBody = bodyTemplate;

        //        if (eventCode == "RECEIPT_EXPORT_DISCREPANCY")
        //        {
        //            finalSubject = finalSubject.Replace("{ReceiptID}", receiptCode);

        //            finalBody = finalBody
        //                .Replace("{ReceiptID}", receiptCode)
        //                .Replace("{PO}", poNumber)
        //                .Replace("{Discrepancies}", discrepancyText);
        //        }
        //        else
        //        {
        //            finalSubject = finalSubject.Replace("{ReceiptID}", receiptCode);

        //            finalBody = finalBody
        //                .Replace("{ReceiptID}", receiptCode)
        //                .Replace("{ReadyDate}", readyDate)
        //                .Replace("{ReceivedBy}", receivedBy);
        //        }

        //        var apiKey = _configuration["SendGrid:ApiKey"];
        //        var client = new SendGridClient(apiKey);

        //        var from = new EmailAddress("mw-no-reply@dynarex.com", "Mantis System");

        //        var msg = new SendGridMessage();
        //        msg.SetFrom(from);
        //        msg.SetSubject(finalSubject);

        //        foreach (var email in primaryEmails.Split(',', ';'))
        //        {
        //            if (!string.IsNullOrWhiteSpace(email))
        //                msg.AddTo(new EmailAddress(email.Trim()));
        //        }

        //        foreach (var email in secondaryEmails.Split(',', ';'))
        //        {
        //            if (!string.IsNullOrWhiteSpace(email))
        //                msg.AddCc(new EmailAddress(email.Trim()));
        //        }

        //        msg.AddContent(MimeType.Text, finalBody);
        //        msg.AddContent(MimeType.Html, finalBody.Replace(Environment.NewLine, "<br/>"));

        //        var response = await client.SendEmailAsync(msg);

        //        int statusCode = response != null ? (int)response.StatusCode : 0;
        //        bool isSuccess = statusCode >= 200 && statusCode < 300;

        //        if (!isSuccess)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = $"SendGrid email failed. Status: {statusCode}"
        //            };
        //        }

        //        return new ReceiptStatusResponse
        //        {
        //            Success = true,
        //            Error = 0,
        //            Message = "Receipt Status Updated Successfully and email sent successfully."
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ReceiptStatusResponse
        //        {
        //            Success = false,
        //            Error = 1,
        //            Message = "Error while updating receipt status | " + ex.Message
        //        };
        //    }
        //}

        public async Task<string> GetReceiptCodeById(int receiptId)
        {
            var sql = @"
                SELECT TOP 1 rct_Code
                FROM LV_Receipt WITH (NOLOCK)
                WHERE rct_ID = @ReceiptId
            ";

            var result = (await _dataAccess.GetDataInline<dynamic, object>(
                sql,
                new { ReceiptId = receiptId }
            )).FirstOrDefault();

            return result?.rct_Code?.ToString() ?? "";
        }

        public async Task<List<ReceiptDetails>> GetDiscrepancyItems(string receiptCode)
        {
            var param = new DynamicParameters();
            param.Add("@receiptCode", receiptCode);

            var data = await _dataAccess.GetData<ReceiptDetails, DynamicParameters>(
                "Cus_Sp_GetDiscrepancyItemsOnly",
                param
            );

            return data.ToList();
        }

        public async Task<List<ManualEmailResponse>> GetNotificationSettings(string moduleName)
        {
            var sql = @"SELECT * FROM Cus_NotificationSetting WHERE nst_ModuleName = @ModuleName";

            var result = await _dataAccess.GetDataInline<ManualEmailResponse, object>(
                sql,
                new { ModuleName = moduleName }
            );

            return result.ToList();
        }

        public async Task<dynamic> GetTriggerInfo(string eventCode)
        {
            var sql = @"
            SELECT TOP 1
                ntg.ntg_ID,
                ntg.ntg_IsEnabled,
                ntg.ntg_EventName As EventName,
                nst.nst_Primary_Emails,
                nst.nst_Secondary_Emails
            FROM Cus_NotificationTrigger ntg WITH (NOLOCK)
            INNER JOIN Cus_NotificationSetting nst WITH (NOLOCK)
                ON ntg.ntg_NotificationSettingID = nst.nst_ID
            WHERE ntg.ntg_EventCode = @EventCode
              AND nst.nst_ModuleCode = 'RECEIPT_EXPORT'
              AND nst.nst_IsActive = 1
            ";

            return (await _dataAccess.GetDataInline<dynamic, object>(
                sql,
                new { EventCode = eventCode }
            )).FirstOrDefault();
        }

        public async Task<int> UpdateReceiptStatusCompleted(int receiptId, string receiptCode)
        {
            var sql = @"
            -- STEP 1: Always update receipt status
            UPDATE LV_Receipt
            SET rct_ProgressID = 3
            WHERE rct_ID = @ReceiptId;

            -- STEP 2: Update ManualContainers ONLY if rejected (ExportedToX3 = 2)
            UPDATE Cus_ManualContainers
            SET ExportedToX3 = 3
            WHERE ctrnum = @ReceiptCode
              AND ExportedToX3 = 2;

            -- STEP 3: Update ASN ONLY if rejected (ExportedToX3 = 2)
            UPDATE Cus_Asns
            SET ExportedToX3 = 3
            WHERE ship_uid = @ReceiptCode
              AND ExportedToX3 = 2;
            ";

            return await _dataAccess.SaveDataInline(sql, new
            {
                ReceiptId = receiptId,
                ReceiptCode = receiptCode
            });
        }
        public async Task<dynamic> GetTemplateByTriggerId(int triggerId)
        {
            var sql = @"
            SELECT TOP 1
                ntp.ntp_Subject AS Subject,
                ntp.ntp_Body AS Body
            FROM Cus_NotificationTemplate ntp WITH (NOLOCK)
            WHERE ntp.ntp_NotificationTriggerID = @TriggerId
              AND ntp.ntp_IsDefault = 1
            ";

            return (await _dataAccess.GetDataInline<dynamic, object>(
                sql,
                new { TriggerId = triggerId }
            )).FirstOrDefault();
        }

        public async Task<ReceiptSelectionResponse> GetReadyToProcessReceipts(ReceiptSelectionRequest request)
        {
            var selectSql = @"
    SELECT 
        r.rct_Code AS ReceiptCode,
        r.rct_ID AS Id,
        r.rct_InputDate,
        r.rct_LineCount,
        ps.pst_Code,
        m.msg_Greek AS ReceiptStatus,
        CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,
        ISNULL(po.PONumber, '-') AS PONumber
    FROM LV_Receipt r
    JOIN LV_ProgressStatus ps 
        ON r.rct_ProgressID = ps.pst_ID
    JOIN LV_Messages m 
        ON m.msg_Code = ps.pst_MessageCode
    OUTER APPLY
    (
        SELECT STRING_AGG(CAST(x.PONumber AS VARCHAR(50)), ', ') AS PONumber
        FROM
        (
            SELECT DISTINCT rrv.rrv_Value AS PONumber
            FROM LV_ReceiptItem rci
            LEFT JOIN LV_ReceiptItemRctAttrValue rrv
                ON rci.rci_ID = rrv.rrv_ReceiptItemID
               AND rrv.rrv_ReceiptAttributeID = 4
            WHERE rci.rci_ReceiptID = r.rct_ID
              AND rrv.rrv_Value IS NOT NULL
              AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
              AND CAST(rrv.rrv_Value AS VARCHAR(50)) <> '0'   -- ✅ ADDED
        ) x
    ) po
    ";



            var whereSql = @"
    WHERE m.msg_LanguageID = 1 
      AND m.msg_Greek = 'Completed'

 

      AND NOT EXISTS (
        SELECT 1 
        FROM Cus_Asns ca
        WHERE ca.ship_uid = r.rct_Code
          AND ca.ExportedToX3 = 1
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM Cus_ManualContainers mc
        WHERE mc.ctrnum = r.rct_Code
          AND mc.ExportedToX3 = 1
      )

 

      AND NOT EXISTS 
      (
          SELECT 1 
          FROM Cus_ManualContainers cmc
          WHERE cmc.ctrnum = r.rct_Code
            AND cmc.is_transfer = 1
      )
    ";



            //  FILTER: remove NULL, empty, '-', '0'
            whereSql += @"
    AND po.PONumber IS NOT NULL
    AND LTRIM(RTRIM(po.PONumber)) <> ''
    AND po.PONumber <> '-'
    AND po.PONumber <> '0'
    ";



            var groupBySql = @"";



            var countSql = @"
    SELECT COUNT(DISTINCT r.rct_ID)
    FROM LV_Receipt r
    JOIN LV_ProgressStatus ps 
        ON r.rct_ProgressID = ps.pst_ID
    JOIN LV_Messages m 
        ON m.msg_Code = ps.pst_MessageCode
    WHERE m.msg_LanguageID = 1 
      AND m.msg_Greek = 'Completed'

 

      AND NOT EXISTS (
        SELECT 1 
        FROM Cus_Asns ca
        WHERE ca.ship_uid = r.rct_Code
          AND ca.ExportedToX3 = 1
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM Cus_ManualContainers mc
        WHERE mc.ctrnum = r.rct_Code
          AND mc.ExportedToX3 = 1
      )

 

      AND NOT EXISTS 
      (
          SELECT 1 
          FROM Cus_ManualContainers cmc
          WHERE cmc.ctrnum = r.rct_Code
            AND cmc.is_transfer = 1
      )
    ";



            //  COUNT FIX (exclude NULL, empty, 0)
            countSql += @"
    AND EXISTS
    (
        SELECT 1
        FROM LV_ReceiptItem rci
        JOIN LV_ReceiptItemRctAttrValue rrv
            ON rci.rci_ID = rrv.rrv_ReceiptItemID
           AND rrv.rrv_ReceiptAttributeID = 4
        WHERE rci.rci_ReceiptID = r.rct_ID
          AND rrv.rrv_Value IS NOT NULL
          AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
          AND CAST(rrv.rrv_Value AS VARCHAR(50)) <> '0'   -- ✅ ADDED
    )";



            var parameters = new DynamicParameters();



            var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
 {
 { "receiptCode", "r.rct_Code" },
 { "receiptStatus", "m.msg_Greek" }
 };



            // FILTERING (UNCHANGED)
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;



                    var column = filter.Key.Trim();
                    var value = filter.Value.value.Trim();



                    if (!allowedColumns.ContainsKey(column))
                        continue;



                    var dbColumn = allowedColumns[column];
                    var paramName = column.Replace(".", "_");



                    whereSql += $" AND {dbColumn} LIKE @{paramName}";
                    countSql += $" AND {dbColumn} LIKE @{paramName}";



                    parameters.Add(paramName, $"%{value}%");
                }
            }



            var sql = selectSql + whereSql + groupBySql;



            // SORTING (UNCHANGED)
            if (!string.IsNullOrWhiteSpace(request.sortField) &&
         allowedColumns.ContainsKey(request.sortField) &&
         !string.IsNullOrWhiteSpace(request.sortOrder))
            {
                var sortColumn = allowedColumns[request.sortField];
                var sortDirection = request.sortOrder == "1" ? "ASC" : "DESC";



                sql += $" ORDER BY {sortColumn} {sortDirection}";
            }
            else
            {
                sql += " ORDER BY r.rct_ID DESC";
            }



            // PAGINATION (UNCHANGED)
            sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";



            parameters.Add("Skip", request.first ?? 0, DbType.Int32);
            parameters.Add("Rows", request.rows ?? 10, DbType.Int32);



            var data = await _dataAccess.GetDataInline<ReceiptSelectionData, DynamicParameters>(sql, parameters);
            var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();



            return new ReceiptSelectionResponse
            {
                data = data,
                totalRecords = totalCount,
                error = 0,
            };
        }
        //public async Task<ReceiptSelectionResponse> GetReadyToProcessReceipts(ReceiptSelectionRequest request)
        //{
        //    var selectSql = @"
        //    SELECT 
        //        r.rct_Code AS ReceiptCode,
        //        r.rct_ID AS Id,
        //        r.rct_InputDate,
        //        r.rct_LineCount,
        //        ps.pst_Code,
        //        m.msg_Greek AS ReceiptStatus,
        //        CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,
        //        ISNULL(po.PONumber, '-') AS PONumber
        //    FROM LV_Receipt r
        //    JOIN LV_ProgressStatus ps 
        //        ON r.rct_ProgressID = ps.pst_ID
        //    JOIN LV_Messages m 
        //        ON m.msg_Code = ps.pst_MessageCode
        //    OUTER APPLY
        //    (
        //        SELECT STRING_AGG(CAST(x.PONumber AS VARCHAR(50)), ', ') AS PONumber
        //        FROM
        //        (
        //            SELECT DISTINCT rrv.rrv_Value AS PONumber
        //            FROM LV_ReceiptItem rci
        //            LEFT JOIN LV_ReceiptItemRctAttrValue rrv
        //                ON rci.rci_ID = rrv.rrv_ReceiptItemID
        //               AND rrv.rrv_ReceiptAttributeID = 4
        //            WHERE rci.rci_ReceiptID = r.rct_ID
        //              AND rrv.rrv_Value IS NOT NULL
        //              AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
        //        ) x
        //    ) po
        //    ";

        //    var whereSql = @"
        //    WHERE m.msg_LanguageID = 1 
        //      AND m.msg_Greek = 'Completed'
        //      AND (
        //            EXISTS (
        //                SELECT 1 
        //                FROM Cus_Asns ca
        //                WHERE ca.ship_num = r.rct_Code
        //                  AND ISNULL(ca.ExportedToX3, 0) = 0
        //            )
        //            OR
        //            EXISTS (
        //                SELECT 1 
        //                FROM Cus_ManualContainers mc
        //                WHERE mc.ctrnum = r.rct_Code
        //                  AND ISNULL(mc.ExportedToX3, 0) = 0
        //            )
        //          )
        //    ";

        //    var groupBySql = @"";

        //    var countSql = @"
        //    SELECT COUNT(DISTINCT r.rct_ID)
        //    FROM LV_Receipt r
        //    JOIN LV_ProgressStatus ps 
        //        ON r.rct_ProgressID = ps.pst_ID
        //    JOIN LV_Messages m 
        //        ON m.msg_Code = ps.pst_MessageCode
        //    WHERE m.msg_LanguageID = 1 
        //      AND m.msg_Greek = 'Completed'
        //      AND (
        //            EXISTS (
        //                SELECT 1 
        //                FROM Cus_Asns ca
        //                WHERE ca.ship_num = r.rct_Code
        //                  AND ISNULL(ca.ExportedToX3, 0) = 0
        //            )
        //            OR
        //            EXISTS (
        //                SELECT 1 
        //                FROM Cus_ManualContainers mc
        //                WHERE mc.ctrnum = r.rct_Code
        //                  AND ISNULL(mc.ExportedToX3, 0) = 0
        //            )
        //          )
        //    ";

        //    var parameters = new DynamicParameters();

        //    var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        //    {
        //        { "receiptCode", "r.rct_Code" },
        //        { "receiptStatus", "m.msg_Greek" }
        //    };

        //    // FILTERING
        //    if (request.filters != null && request.filters.Count > 0)
        //    {
        //        foreach (var filter in request.filters)
        //        {
        //            if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
        //                continue;

        //            var column = filter.Key.Trim();
        //            var value = filter.Value.value.Trim();

        //            if (!allowedColumns.ContainsKey(column))
        //                continue;

        //            var dbColumn = allowedColumns[column];
        //            var paramName = column.Replace(".", "_");

        //            whereSql += $" AND {dbColumn} LIKE @{paramName}";
        //            countSql += $" AND {dbColumn} LIKE @{paramName}";

        //            parameters.Add(paramName, $"%{value}%");
        //        }
        //    }

        //    var sql = selectSql + whereSql + groupBySql;

        //    // SORTING
        //    if (!string.IsNullOrWhiteSpace(request.sortField) &&
        //        allowedColumns.ContainsKey(request.sortField) &&
        //        !string.IsNullOrWhiteSpace(request.sortOrder))
        //    {
        //        var sortColumn = allowedColumns[request.sortField];
        //        var sortDirection = request.sortOrder == "1" ? "ASC" : "DESC";

        //        sql += $" ORDER BY {sortColumn} {sortDirection}";
        //    }
        //    else
        //    {
        //        sql += " ORDER BY r.rct_ID DESC";
        //    }

        //    // PAGINATION
        //    sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

        //    parameters.Add("Skip", request.first ?? 0, DbType.Int32);
        //    parameters.Add("Rows", request.rows ?? 10, DbType.Int32);

        //    var data = await _dataAccess.GetDataInline<ReceiptSelectionData, DynamicParameters>(sql, parameters);
        //    var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();

        //    return new ReceiptSelectionResponse
        //    {
        //        data = data,
        //        totalRecords = totalCount,
        //        error = 0,
        //    };
        //}

        public async Task<ReceiptSelectionResponse> GetAllAccountingReceipts(ReceiptSelectionRequest request)
        {
            var selectSql = @"
    SELECT 
        r.rct_Code AS ReceiptCode,
        r.rct_ID AS Id,
        r.rct_InputDate,
        r.rct_LineCount,
        ps.pst_Code,
        m.msg_Greek AS ReceiptStatus,
        CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,
        ISNULL(po.PONumber, '-') AS PONumber

 

        ,ISNULL(mc.ExportedToX3, 0) AS ManualContainerExportedToX3
        ,ISNULL(asn.ExportedToX3, 0) AS AsnExportedToX3

 

    FROM LV_Receipt r
    JOIN LV_ProgressStatus ps 
        ON r.rct_ProgressID = ps.pst_ID
    JOIN LV_Messages m 
        ON m.msg_Code = ps.pst_MessageCode

 

    OUTER APPLY
    (
        SELECT TOP 1 ExportedToX3
        FROM Cus_ManualContainers 
        WHERE ctrnum = r.rct_Code
    ) mc

 

    OUTER APPLY
    (
        SELECT TOP 1 ExportedToX3
        FROM Cus_Asns 
        WHERE ship_uid = r.rct_Code
    ) asn

 

    OUTER APPLY
    (
        SELECT STRING_AGG(CAST(x.PONumber AS VARCHAR(50)), ', ') AS PONumber
        FROM
        (
            SELECT DISTINCT rrv.rrv_Value AS PONumber
            FROM LV_ReceiptItem rci
            LEFT JOIN LV_ReceiptItemRctAttrValue rrv
                ON rci.rci_ID = rrv.rrv_ReceiptItemID
               AND rrv.rrv_ReceiptAttributeID = 4
            WHERE rci.rci_ReceiptID = r.rct_ID
              AND rrv.rrv_Value IS NOT NULL
              AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
          AND CAST(rrv.rrv_Value AS VARCHAR(50)) <> '0'   --  ADDED

             
        ) x
    ) po
    ";



            var whereSql = @"
    WHERE m.msg_LanguageID = 1 
      AND m.msg_Greek = 'Completed'

 

      AND NOT EXISTS (
        SELECT 1 
        FROM Cus_ManualContainers cmc
        WHERE cmc.ctrnum = r.rct_Code
          AND cmc.ExportedToX3 NOT IN (0,1)
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM Cus_Asns ca
        WHERE ca.ship_uid = r.rct_Code
          AND ca.ExportedToX3 NOT IN (0,1)
      )

 

      AND NOT EXISTS 
      (
          SELECT 1 
          FROM Cus_ManualContainers cmc
          WHERE cmc.ctrnum = r.rct_Code
            AND cmc.is_transfer = 1
      )
    ";



            //  CHANGE: exclude NULL, empty, and '0' PO
            whereSql += @"
    AND po.PONumber IS NOT NULL
    AND LTRIM(RTRIM(po.PONumber)) <> ''
    AND po.PONumber <> '0'
    ";



            var groupBySql = @"";



            var countSql = @"
            SELECT COUNT(DISTINCT r.rct_ID)
            FROM LV_Receipt r
            JOIN LV_ProgressStatus ps 
                ON r.rct_ProgressID = ps.pst_ID
            JOIN LV_Messages m 
                ON m.msg_Code = ps.pst_MessageCode

 

            OUTER APPLY
            (
                SELECT TOP 1 ExportedToX3
                FROM Cus_ManualContainers 
                WHERE ctrnum = r.rct_Code
            ) mc

 

            OUTER APPLY
            (
                SELECT TOP 1 ExportedToX3
                FROM Cus_Asns 
                WHERE ship_uid = r.rct_Code
            ) asn

 

            WHERE m.msg_LanguageID = 1 
              AND m.msg_Greek = 'Completed'

 

              AND NOT EXISTS (
                SELECT 1 
                FROM Cus_ManualContainers cmc
                WHERE cmc.ctrnum = r.rct_Code
                  AND cmc.ExportedToX3 NOT IN (0,1)
              )
              AND NOT EXISTS (
                SELECT 1 
                FROM Cus_Asns ca
                WHERE ca.ship_uid = r.rct_Code
                  AND ca.ExportedToX3 NOT IN (0,1)
              )

 

              AND NOT EXISTS 
              (
                  SELECT 1 
                  FROM Cus_ManualContainers cmc
                  WHERE cmc.ctrnum = r.rct_Code
                    AND cmc.is_transfer = 1
              )
            ";
            countSql += @"
            AND EXISTS
            (
                SELECT 1
                FROM LV_ReceiptItem rci
                JOIN LV_ReceiptItemRctAttrValue rrv
                    ON rci.rci_ID = rrv.rrv_ReceiptItemID
                   AND rrv.rrv_ReceiptAttributeID = 4
                WHERE rci.rci_ReceiptID = r.rct_ID
                  AND rrv.rrv_Value IS NOT NULL
                  AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
                  AND rrv.rrv_Value <> '0'
            )";

            var parameters = new DynamicParameters();
            var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
             { "receiptCode", "r.rct_Code" },
             { "receiptStatus", "m.msg_Greek" }
            };

            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;
                     var column = filter.Key.Trim();
                    var value = filter.Value.value.Trim();
                   if (!allowedColumns.ContainsKey(column))
                        continue;
                   var dbColumn = allowedColumns[column];
                    var paramName = column.Replace(".", "_");
                   whereSql += $" AND {dbColumn} LIKE @{paramName}";
                    countSql += $" AND {dbColumn} LIKE @{paramName}";

                  parameters.Add(paramName, $"%{value}%");
                }
            }

          var sql = selectSql + whereSql + groupBySql;

            if (!string.IsNullOrWhiteSpace(request.sortField) &&
            allowedColumns.ContainsKey(request.sortField) &&
            !string.IsNullOrWhiteSpace(request.sortOrder))
            {
                var sortColumn = allowedColumns[request.sortField];
                var sortDirection = request.sortOrder == "1" ? "ASC" : "DESC";



                sql += $" ORDER BY {sortColumn} {sortDirection}";
            }
            else
            {
                sql += " ORDER BY r.rct_ID DESC";
            }
            sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

            parameters.Add("Skip", request.first);
            parameters.Add("Rows", request.rows);
            var data = await _dataAccess.GetDataInline<ReceiptSelectionData, DynamicParameters>(sql, parameters);
            var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();

            return new ReceiptSelectionResponse
            {
                data = data,
                totalRecords = totalCount,
                error = 0,
            };
        }        
        
        //public async Task<ReceiptSelectionResponse> GetAllAccountingReceipts(ReceiptSelectionRequest request)
        //{
        //    var selectSql = @"
        //    SELECT 
        //        r.rct_Code AS ReceiptCode,
        //        r.rct_ID AS Id,
        //        r.rct_InputDate,
        //        r.rct_LineCount,
        //        ps.pst_Code,
        //        m.msg_Greek AS ReceiptStatus,
        //        CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,
        //        ISNULL(po.PONumber, '-') AS PONumber

        //        -- ADDED: Export flags (optional if you want to return to UI)
        //        ,ISNULL(mc.ExportedToX3, 0) AS ManualContainerExportedToX3
        //        ,ISNULL(asn.ExportedToX3, 0) AS AsnExportedToX3

        //    FROM LV_Receipt r
        //    JOIN LV_ProgressStatus ps 
        //        ON r.rct_ProgressID = ps.pst_ID
        //    JOIN LV_Messages m 
        //        ON m.msg_Code = ps.pst_MessageCode

        //    -- ADDED: Manual Container Export Status
        //    OUTER APPLY
        //    (
        //        SELECT TOP 1 ExportedToX3
        //        FROM Cus_ManualContainers 
        //        WHERE ctrnum = r.rct_Code
        //    ) mc

        //    -- ADDED: ASN Export Status
        //    OUTER APPLY
        //    (
        //        SELECT TOP 1 ExportedToX3
        //        FROM Cus_Asns 
        //        WHERE ship_num = r.rct_Code
        //    ) asn

        //    OUTER APPLY
        //    (
        //        -- existing PO logic (UNCHANGED)
        //        SELECT STRING_AGG(CAST(x.PONumber AS VARCHAR(50)), ', ') AS PONumber
        //        FROM
        //        (
        //            SELECT DISTINCT rrv.rrv_Value AS PONumber
        //            FROM LV_ReceiptItem rci
        //            LEFT JOIN LV_ReceiptItemRctAttrValue rrv
        //                ON rci.rci_ID = rrv.rrv_ReceiptItemID
        //               AND rrv.rrv_ReceiptAttributeID = 4
        //            WHERE rci.rci_ReceiptID = r.rct_ID
        //              AND rrv.rrv_Value IS NOT NULL
        //              AND LTRIM(RTRIM(CAST(rrv.rrv_Value AS VARCHAR(50)))) <> ''
        //        ) x
        //    ) po
        //    ";

        //    var whereSql = @"
        //    WHERE m.msg_LanguageID = 1 
        //      AND m.msg_Greek = 'Completed'

        //      --  ADDED: Only include ExportedToX3 = 0 or 1 (exclude 2)
        //      AND (
        //            ISNULL(mc.ExportedToX3, 0) IN (0,1)
        //            OR ISNULL(asn.ExportedToX3, 0) IN (0,1)
        //          )
        //    ";

        //    var groupBySql = @""; // unchanged

        //    var countSql = @"
        //    SELECT COUNT(DISTINCT r.rct_ID)
        //    FROM LV_Receipt r
        //    JOIN LV_ProgressStatus ps 
        //        ON r.rct_ProgressID = ps.pst_ID
        //    JOIN LV_Messages m 
        //        ON m.msg_Code = ps.pst_MessageCode

        //    -- ADDED in COUNT also (IMPORTANT)
        //    OUTER APPLY
        //    (
        //        SELECT TOP 1 ExportedToX3
        //        FROM Cus_ManualContainers 
        //        WHERE ctrnum = r.rct_Code
        //    ) mc

        //    OUTER APPLY
        //    (
        //        SELECT TOP 1 ExportedToX3
        //        FROM Cus_Asns 
        //        WHERE ship_num = r.rct_Code
        //    ) asn

        //    WHERE m.msg_LanguageID = 1 
        //      AND m.msg_Greek = 'Completed'

        //      --  SAME FILTER IN COUNT
        //      AND (
        //            ISNULL(mc.ExportedToX3, 0) IN (0,1)
        //            OR ISNULL(asn.ExportedToX3, 0) IN (0,1)
        //          )
        //    ";

        //    var parameters = new DynamicParameters();

        //    var allowedColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        //    {
        //        { "receiptCode", "r.rct_Code" },
        //        { "receiptStatus", "m.msg_Greek" }
        //    };

        //    // FILTERING (UNCHANGED)
        //    if (request.filters != null && request.filters.Count > 0)
        //    {
        //        foreach (var filter in request.filters)
        //        {
        //            if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
        //                continue;

        //            var column = filter.Key.Trim();
        //            var value = filter.Value.value.Trim();

        //            if (!allowedColumns.ContainsKey(column))
        //                continue;

        //            var dbColumn = allowedColumns[column];
        //            var paramName = column.Replace(".", "_");

        //            whereSql += $" AND {dbColumn} LIKE @{paramName}";
        //            countSql += $" AND {dbColumn} LIKE @{paramName}";

        //            parameters.Add(paramName, $"%{value}%");
        //        }
        //    }

        //    var sql = selectSql + whereSql + groupBySql;

        //    // SORTING (UNCHANGED)
        //    if (!string.IsNullOrWhiteSpace(request.sortField) &&
        //        allowedColumns.ContainsKey(request.sortField) &&
        //        !string.IsNullOrWhiteSpace(request.sortOrder))
        //    {
        //        var sortColumn = allowedColumns[request.sortField];
        //        var sortDirection = request.sortOrder == "1" ? "ASC" : "DESC";

        //        sql += $" ORDER BY {sortColumn} {sortDirection}";
        //    }
        //    else
        //    {
        //        sql += " ORDER BY r.rct_ID DESC";
        //    }

        //    // PAGINATION (UNCHANGED)
        //    sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

        //    parameters.Add("Skip", request.first);
        //    parameters.Add("Rows", request.rows);

        //    var data = await _dataAccess.GetDataInline<ReceiptSelectionData, DynamicParameters>(sql, parameters);
        //    var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();

        //    return new ReceiptSelectionResponse
        //    {
        //        data = data,
        //        totalRecords = totalCount,
        //        error = 0,
        //    };
        //}
        public async Task<RceiptDiscrepancyWithPoResponse> GetDicrepancyItems(ReceiptDiscrepancyItemsRequest request, string receiptCode)
        {
            var parameters = new DynamicParameters();

            parameters.Add("Skip", request.first);
            parameters.Add("Rows", request.rows);
            parameters.Add("receiptCode", receiptCode);
            var result = (await _dataAccess.GetData<RceiptDiscrepancyWithPo, DynamicParameters>("Cus_Sp_GetReceiptDiscrepancyWithPo", parameters)).ToList();

            return new RceiptDiscrepancyWithPoResponse
            {
                Data = result,
                TotalRecords = result.FirstOrDefault()?.TotalRecords ?? 0,
                Error = 0

            };
        }

        public async Task<ReceiptDiscrepancyByLotResponse> GetDicrepancyItemsByLot(ReceiptDiscrepancyItemsRequest request, string receiptCode)
        {
            var parameters = new DynamicParameters();

            parameters.Add("Skip", request.first);
            parameters.Add("Rows", request.rows);
            parameters.Add("receiptCode", receiptCode);
            var result = await _dataAccess.GetData<RceiptDiscrepancyByLot, DynamicParameters>("Cus_Sp_GetReceiptDiscrepancyWithLot", parameters);

            return new ReceiptDiscrepancyByLotResponse
            {
                Data = result,
                TotalRecords = result.FirstOrDefault()?.TotalRecords ?? 0,
                Error = 0

            };
        }
        public async Task<IEnumerable<ReceiptExportDetailsLot>> GetReceiptExportDetailsLot(string? ReceiptCode)
        {
            var parameters = new
            {
                ReceiptCode
            };

            var result = await _dataAccess.GetData<ReceiptExportDetailsLot, dynamic>(
                "Cus_GetReceiptExportDetailsLot",
                parameters
            );

            return result.ToList();
        }
        //public async Task ActivityLog(ActivityLog log)
        //{
        //    var sql = @"INSERT INTO Cus_ActivityLog 
        //            (log_name, module_id, sub_module_id, event, subject_id, properties,subject_ref, description, causer_type, created_at, user_name, api_action_type)
        //            VALUES 
        //            (@log_name, @module_id, @sub_module_id, @event, @subject_id, @properties, @subject_ref, @description, @causer_type, GETUTCDATE(), @user_name, @api_action_type)";
        //    await _dataAccess.SaveDataInline(sql, log);
        //}

        public async Task<ResponseResult> MarkAsManualExportReceipt(MarkAsExportedRequest request)
        {
            try
            {
                var parameters = new DynamicParameters();

                parameters.Add("@ReceiptCode", request.ReceiptCode);
                parameters.Add("@UserId", request.UserId);
                parameters.Add("@ResultCode", dbType: DbType.Int32, direction: ParameterDirection.Output);

                await _dataAccess.SaveData("Cus_Sp_MarkAsExportedReceiptExport", parameters);

                var resultCode = parameters.Get<int>("@ResultCode");

                return resultCode switch
                {
                    0 => new ResponseResult { Error = 0, Message = "Receipt marked as manually exported successfully." },
                    1 => new ResponseResult { Error = 1, Message = "Receipt already marked as exported." },
                    2 => new ResponseResult { Error = 1, Message = "Receipt not found." }
                };


            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = ex.Message
                };
            }
        }
        public async Task<NotificationTriggerInfo?> GetNotificationTriggerInfoByEventCode(string eventCode, string moduleCode)
        {
            var sql = @"
                SELECT TOP 1
                    ntg.ntg_ID AS TriggerId,
                    ntg.ntg_IsEnabled AS IsEnabled,
                    nst.nst_Primary_Emails AS PrimaryEmails,
                    nst.nst_Secondary_Emails AS SecondaryEmails
                FROM Cus_NotificationTrigger ntg WITH (NOLOCK)
                INNER JOIN Cus_NotificationSetting nst WITH (NOLOCK)
                    ON ntg.ntg_NotificationSettingID = nst.nst_ID
                WHERE ntg.ntg_EventCode = @EventCode
                  AND nst.nst_ModuleCode = @ModuleCode
                  AND nst.nst_IsActive = 1
            ";

            var parameters = new DynamicParameters();
            parameters.Add("@EventCode", eventCode);
            parameters.Add("@ModuleCode", moduleCode);

            var result = await _dataAccess.GetDataInline<NotificationTriggerInfo, DynamicParameters>(sql, parameters);
            return result.FirstOrDefault();
        }

        public async Task<NotificationTemplateInfo?> GetDefaultNotificationTemplateByTriggerId(int triggerId)
        {
            var sql = @"
            SELECT TOP 1
                ntp.ntp_Subject AS Subject,
                ntp.ntp_Body AS Body
            FROM Cus_NotificationTemplate ntp WITH (NOLOCK)
            WHERE ntp.ntp_NotificationTriggerID = @TriggerId
              AND ntp.ntp_IsDefault = 1
            ";

            var parameters = new DynamicParameters();
            parameters.Add("@TriggerId", triggerId);

            var result = await _dataAccess.GetDataInline<NotificationTemplateInfo, DynamicParameters>(sql, parameters);
            return result.FirstOrDefault();
        }

        public async Task<dynamic> GetRejectTriggerInfo()
        {
            var sql = @"
            SELECT TOP 1
                ntg.ntg_ID,
                ntg.ntg_IsEnabled,
                nst.nst_Primary_Emails,
                nst.nst_Secondary_Emails
            FROM Cus_NotificationTrigger ntg WITH (NOLOCK)
            INNER JOIN Cus_NotificationSetting nst WITH (NOLOCK)
                ON ntg.ntg_NotificationSettingID = nst.nst_ID
            WHERE ntg.ntg_EventCode = 'RECEIPT_EXPORT_REJECT'
              AND nst.nst_ModuleCode = 'RECEIPT_EXPORT'
            ";

            return (await _dataAccess.GetDataInline<dynamic, object>(sql, new { }))
                .FirstOrDefault();
        }

        public async Task<dynamic> GetRejectTemplateByTriggerId(int triggerId)
        {
            var sql = @"
            SELECT TOP 1
                ntp.ntp_Subject AS Subject,
                ntp.ntp_Body AS Body
            FROM Cus_NotificationTemplate ntp WITH (NOLOCK)
            WHERE ntp.ntp_NotificationTriggerID = @TriggerId
              AND ntp.ntp_IsDefault = 1
            ";

            return (await _dataAccess.GetDataInline<dynamic, object>(sql, new { TriggerId = triggerId }))
                .FirstOrDefault();
        }

        public async Task<int> UpdateReceiptToExecuting(int receiptId, RejectReceiptRequest request)
        {
            try
            {
                var sql = @"
                -- STEP 1: Update LV_Receipt
                UPDATE LV_Receipt
                SET rct_ProgressID = 2
                WHERE rct_ID = @ReceiptId;

             -- STEP 3: Try update Cus_ManualContainers
                UPDATE Cus_ManualContainers
                SET ExportedToX3 = 2
                WHERE ctrnum = @ReceiptCode;

                -- STEP 2: Try update Cus_Asns
                UPDATE Cus_Asns
                SET ExportedToX3 = 2
                WHERE ship_uid = @ReceiptCode;

                ";

                var result = await _dataAccess.SaveDataInline(sql, new
                {
                    ReceiptId = receiptId,
                    ReceiptCode = request.receiptCode
                });

                return result;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error while updating receiptId {receiptId}: {ex.Message}", ex);
            }
        }       
        
        //public async Task<ReceiptActionResult> UpdateReceiptStatusExecuting(int receiptId, RejectReceiptRequest request)
        //{
        //    try
        //    {
        //        if (request == null)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Reject request is required."
        //            };
        //        }

        //        // 1. UPDATE RECEIPT STATUS TO EXECUTING
        //        var updateSql = @"
        //            UPDATE LV_Receipt
        //            SET rct_ProgressID = 2
        //            WHERE rct_ID = @ReceiptId
        //        ";

        //        var updateParams = new DynamicParameters();
        //        updateParams.Add("@ReceiptId", receiptId);

        //        var rowsAffected = await _dataAccess.SaveDataInline(updateSql, updateParams);

        //        if (rowsAffected <= 0)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "No Receipt updated."
        //            };
        //        }

        //        string receiptCode = request.receiptCode?.ToString() ?? "";

        //        string moduleName = "Receipt Export Notifications";

        //        var query = @"SELECT * FROM Cus_NotificationSetting WHERE nst_ModuleName = @ModuleName;";
        //        var result = await _dataAccess.GetDataInline<ManualEmailResponse, object>(
        //            query,
        //            new { ModuleName = moduleName }
        //        );

        //        var data = result.ToList();

        //        // 3. CHECK NOTIFICATION TRIGGER FOR REJECT EVENT
        //        //    EventCode = RECEIPT_EXPORT_REJECT
        //        var triggerSql = @"
        //            SELECT TOP 1
        //                ntg.ntg_ID,
        //                ntg.ntg_IsEnabled,
        //                nst.nst_Primary_Emails,
        //                nst.nst_Secondary_Emails
        //            FROM Cus_NotificationTrigger ntg WITH (NOLOCK)
        //            INNER JOIN Cus_NotificationSetting nst WITH (NOLOCK)
        //                ON ntg.ntg_NotificationSettingID = nst.nst_ID
        //            WHERE ntg.ntg_EventCode = 'RECEIPT_EXPORT_REJECT'
        //              AND nst.nst_ModuleCode = 'RECEIPT_EXPORT'
        //        ";

        //        var triggerInfo = (await _dataAccess.GetDataInline<dynamic, dynamic>(
        //            triggerSql,
        //            new { }
        //        )).FirstOrDefault();

        //        if (triggerInfo == null)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Reject notification trigger configuration not found."
        //            };
        //        }

        //        int triggerId = Convert.ToInt32(triggerInfo.ntg_ID);
        //        int isEnabled = Convert.ToInt32(triggerInfo.ntg_IsEnabled);

        //        // if ntg_IsEnabled = 0 => do not send mail, return error
        //        if (isEnabled == 0)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Notification trigger is off."
        //            };
        //        }

        //        string primaryEmails = triggerInfo.nst_Primary_Emails?.ToString() ?? "";
        //        string secondaryEmails = triggerInfo.nst_Secondary_Emails?.ToString() ?? "";

        //        if (string.IsNullOrWhiteSpace(primaryEmails) || primaryEmails.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase))
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Primary mail is not present."
        //            };
        //        }

        //        // 4. PREPARE EMAIL LIST
        //        var emailList = (primaryEmails + "," + secondaryEmails)
        //            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //            .Select(x => x.Trim())
        //            .Where(x => !string.IsNullOrWhiteSpace(x))
        //            .Distinct(StringComparer.OrdinalIgnoreCase)
        //            .ToList();

        //        if (!emailList.Any())
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "No recipient emails found."
        //            };
        //        }

        //        // 5. FETCH DEFAULT TEMPLATE FOR REJECT EVENT
        //        var templateSql = @"
        //         SELECT TOP 1
        //        ntp.ntp_Subject AS Subject,
        //        ntp.ntp_Body AS Body
        //        FROM Cus_NotificationTemplate ntp WITH (NOLOCK)
        //         WHERE ntp.ntp_NotificationTriggerID = @TriggerId
        //        AND ntp.ntp_IsDefault = 1
        //        ";

        //        var templateParams = new DynamicParameters();
        //        templateParams.Add("@TriggerId", triggerId);

        //        var template = (await _dataAccess.GetDataInline<dynamic, DynamicParameters>(
        //            templateSql,
        //            templateParams
        //        )).FirstOrDefault();

        //        if (template == null)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Reject notification template not found."
        //            };
        //        }

        //        string subjectTemplate = template.Subject?.ToString() ?? "";
        //        string bodyTemplate = template.Body?.ToString() ?? "";

        //        // 6. REPLACE TAGS FROM DB TEMPLATE
        //        string rejectReason = request.Reason?.Trim() ?? "";

        //        string finalSubject = subjectTemplate
        //            .Replace("{ReceiptID}", receiptCode)
        //            .Replace("{Reason}", rejectReason);

        //        string finalBody = bodyTemplate
        //            .Replace("{ReceiptID}", receiptCode)
        //            .Replace("{Reason}", rejectReason);

        //        // 7. SEND EMAIL VIA SENDGRID
        //        var apiKey = _configuration["SendGrid:ApiKey"];
        //        var client = new SendGridClient(apiKey);

        //        var from = new EmailAddress("mw-no-reply@dynarex.com", "Mantis System");

        //        var msg = new SendGridMessage();
        //        msg.SetFrom(from);
        //        msg.SetSubject(finalSubject);

        //        //PRIMARY → TO
        //        foreach (var email in primaryEmails
        //                     .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //                     .Select(e => e.Trim())
        //                     .Where(e => !string.IsNullOrWhiteSpace(e)))
        //        {
        //            msg.AddTo(new EmailAddress(email));
        //        }

        //        // SECONDARY → CC
        //        if (!string.IsNullOrWhiteSpace(secondaryEmails))
        //        {
        //            foreach (var email in secondaryEmails
        //                         .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //                         .Select(e => e.Trim())
        //                         .Where(e => !string.IsNullOrWhiteSpace(e)))
        //            {
        //                msg.AddCc(new EmailAddress(email));
        //            }
        //        }

        //        msg.AddContent(MimeType.Text, finalBody);
        //        msg.AddContent(MimeType.Html, finalBody.Replace(Environment.NewLine, "<br/>"));

        //        var response = await client.SendEmailAsync(msg);
        //        var responseBody = await response.Body.ReadAsStringAsync();

        //        int statusCode = response != null ? (int)response.StatusCode : 0;
        //        bool isSuccess = statusCode >= 200 && statusCode < 300;

        //        if (!isSuccess)
        //        {
        //            // ERROR LOG
        //            await _notificationLogsRepository.CreateNotificationLogs(new CreateNotificationLogRequest
        //            {
        //                NotificationSettingID = data[0].nst_ID,
        //                TriggerID = triggerId,
        //                UserID = request.UserId,
        //                NotificationType = data[0].nst_ModuleName,
        //                OpertionType = "RECEIPT_EXPORT_REJECT",
        //                Status = "ERROR",
        //                CreatedBy = request.UserEmail,
        //                Subject = finalSubject,
        //                Body = responseBody,
        //                PrimaryEmail = primaryEmails,
        //                SecondaryEmail = secondaryEmails
        //            });

        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = $"SendGrid email failed. Status: {(int)response.StatusCode}, Response: {responseBody}"
        //            };
        //        }
        //        else
        //        {
        //            // SUCCESS LOG
        //            await _notificationLogsRepository.CreateNotificationLogs(new CreateNotificationLogRequest
        //            {
        //                NotificationSettingID = data[0].nst_ID,
        //                TriggerID = triggerId,
        //                UserID = request.UserId,
        //                NotificationType = data[0].nst_ModuleName,
        //                OpertionType = "RECEIPT_EXPORT_REJECT",
        //                Status = "SENT",
        //                CreatedBy = request.UserEmail,
        //                Subject = finalSubject,
        //                Body = finalBody,
        //                PrimaryEmail = primaryEmails,
        //                SecondaryEmail = secondaryEmails
        //            });

        //            return new ReceiptActionResult
        //            {
        //                Success = true,
        //                Message = "Receipt Status Updated Successfully and reject email sent successfully."
        //            };
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ReceiptActionResult
        //        {
        //            Success = false,
        //            Message = "Error while updating receipt status executing | " + ex.Message
        //        };
        //    }
        //}
    }

}


