using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ReceiptExportRepository : IReceiptExportRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly string? _connectionString;
        private readonly UrlConstants _urlConstants;
        public ReceiptExportRepository(ISqlDataAccess dataAccess, IConfiguration configuration, UrlConstants urlConstants)
        {
            _dataAccess = dataAccess;
            _connectionString = configuration.GetConnectionString("con");
            _urlConstants = urlConstants;
        }

        /* Store Procedure */
        public async Task<ReceiptExportResponse> GetReceiptExportGrid(GridRequest request)
        {
            var parameters = new DynamicParameters();

            parameters.Add("Skip", request.first);
            parameters.Add("Rows", request.rows);
            parameters.Add("SortField", request.sortField);
            parameters.Add("SortOrder", request.sortOrder == "1" ? "ASC" : "DESC");

            // Filters
            if (request.filters != null)
            {
                if (request.filters.TryGetValue("receiptCode", out var code) && !string.IsNullOrWhiteSpace(code?.value))
                {
                    parameters.Add("ReceiptCode", code.value.Trim());
                }

                if (request.filters.TryGetValue("receivedDate", out var date) && 
                    DateTime.TryParseExact(date?.value,"MM/dd/yyyy",CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    parameters.Add("ReceivedDate", parsedDate.Date);
                }


                if (request.filters.TryGetValue("receiptStatus", out var status) && !string.IsNullOrWhiteSpace(status?.value))
                {
                    parameters.Add("ReceiptStatus", status.value.Trim());
                }

                if (request.filters.TryGetValue("confirmationDate", out var confirmationDate) &&
                    DateTime.TryParseExact(confirmationDate?.value,"MM/dd/yyyy HH:mm:ss",CultureInfo.InvariantCulture,DateTimeStyles.None,out var parsedConfirmationDate))
                {
                    parameters.Add("ConfirmationDate", parsedConfirmationDate.Date);
                }


                if (request.filters.TryGetValue("confirmedBy", out var confirmedBy)
                    && !string.IsNullOrWhiteSpace(confirmedBy?.value))
                {
                    parameters.Add("ConfirmedBy", confirmedBy.value.Trim());
                }
            }

            var result = await _dataAccess.GetDataWithCount<ReceiptExport, DynamicParameters>(
                "Cus_Sp_GetReceiptsExport",
                parameters
            );

            return new ReceiptExportResponse
            {
                Data = result.Data.ToList(),
                TotalRecords = result.TotalCount
            };
        }

        public async Task<List<ReceiptExport>> GetReceiptExportById(int id)
        {
            try
            {
                var query = @"
                    SELECT 
                    r.rct_ID AS Id,
                    r.rct_Code AS ReceiptCode,
                    r.rct_inputDate AS ReceivedDate,

                    m.msg_Greek AS ReceiptStatus,
                    ps.pst_Code AS StatusCode,         

                    CAST(ps.pst_Code AS VARCHAR(20)) + ' - ' + m.msg_Greek AS Status,

                    --  Manual Container Export Status
                    ISNULL(mc.ExportedToX3, 0) AS ManualContainerExportedToX3,

                    --  ASN Export Status
                    ISNULL(asn.ExportedToX3, 0) AS AsnExportedToX3

                FROM LV_Receipt r

                JOIN LV_ProgressStatus ps 
                    ON r.rct_ProgressID = ps.pst_ID

                JOIN LV_Messages m 
                    ON m.msg_Code = ps.pst_MessageCode

                --  Get ExportedToX3 from Manual Containers
                OUTER APPLY
                (
                    SELECT TOP 1 ExportedToX3
                    FROM Cus_ManualContainers 
                    WHERE ctrnum = r.rct_Code
                ) mc

                --  Get ExportedToX3 from ASN
                OUTER APPLY
                (
                    SELECT TOP 1 ExportedToX3
                    FROM Cus_Asns 
                    WHERE ship_num = r.rct_Code
                ) asn

                WHERE r.rct_ID = @id
                AND m.msg_LanguageID = 1;
                ";
                var parameters = new DynamicParameters();
                parameters.Add("@id", id);
                var result = await _dataAccess.GetDataInline<ReceiptExport, dynamic>(query, parameters);
                return result.ToList();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<ReceiptExportDetailsResponse> GetReceiptExportDetails(GridRequest request, string receiptCode)
        {
            try
            {
                string cteQuery = @"
                    ;WITH ReceiptProducts AS (
                        SELECT DISTINCT p.prd_PrimaryCode
                        FROM LV_Receipt r WITH (NOLOCK)
                        INNER JOIN LV_ReceiptItem rci WITH (NOLOCK)
                            ON r.rct_ID = rci.rci_ReceiptID
                        INNER JOIN LV_Product p WITH (NOLOCK)
                            ON rci.rci_ProductID = p.prd_ID
                        WHERE r.rct_Code = @ReceiptCode
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
                ";

                string mainQuery = @"
                    SELECT
                        r.rct_Code AS ReceiptCode,
                        r.rct_ActualDate AS ActualDate,
						r.rct_InputDate AS InputDate,
                        r.rct_ExpectedDate AS ExpectedDate,
                        rci.rci_ReceiptLine AS LineNumber,

                        p.prd_PrimaryCode AS Mantis_SKU,
                        x3conv.sku_x3 AS X3_SKU,
                        x3conv.uom_mantis AS X3_UOM,

                        CAST(rci.rci_ExpQuantity AS DECIMAL(18,2)) AS ExpectedQty,
                        expUnit.unt_Code AS ExpectedUOM,

                        CAST(rci.rci_ActQuantity AS DECIMAL(18,2)) AS ActualQty,
                        actUnit.unt_Code AS ActualUOM,

                        CAST(CAST(rci.rci_ExpQuantity AS INT) AS VARCHAR(20)) + ' ' + ISNULL(expUnit.unt_Code,'')
                            AS ExpectedQtyDisplay,

                        CAST(CAST(rci.rci_ActQuantity AS INT) AS VARCHAR(20)) + ' ' + ISNULL(actUnit.unt_Code,'')
                            AS ActualQtyDisplay,

                        CASE
                            WHEN actUnit.unt_Code = x3conv.uom_mantis THEN
                                CAST(rci.rci_ActQuantity AS DECIMAL(18,6))
                            WHEN actToX3.conversion_qty > 0 THEN
                                CAST(ROUND(rci.rci_ActQuantity * actToX3.conversion_qty, 6) AS DECIMAL(18,6))
                            ELSE NULL
                        END AS X3_Qty,

                        FORMAT(
                            CASE
                                WHEN actUnit.unt_Code = x3conv.uom_mantis THEN rci.rci_ActQuantity
                                WHEN actToX3.conversion_qty > 0 THEN rci.rci_ActQuantity * actToX3.conversion_qty
                                ELSE NULL
                            END, '0'
                        ) + ' ' + ISNULL(x3conv.uom_mantis,'') AS X3_QtyDisplay,

                        MAX(CASE WHEN ra.rat_ID = 1 THEN rrv.rrv_Value END) AS PlannedLotNumber,
                        COUNT(DISTINCT lsa.lsa_Value) AS ActualLotAttrCode,

                        STUFF((
                            SELECT DISTINCT ', ' + lsa2.lsa_Value
                            FROM LV_Log l2
                            INNER JOIN LV_LogStock lsk2 ON l2.log_ID = lsk2.lsk_LogID
                            INNER JOIN LV_LogStockAttrValue lsa2 ON lsk2.lsk_ID = lsa2.lsa_LogStockID
                            INNER JOIN LV_StockAttributes sa2
                                ON lsa2.lsa_AttributeID = sa2.sat_ID AND sa2.sat_ID = 1
                            WHERE l2.log_ReceiptItemID = rci.rci_ID
                            FOR XML PATH(''), TYPE
                        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS ActualLotNumbers,

                        MAX(loc.loc_Code) AS LocationCodeesite,
                        MAX(CASE WHEN ra.rat_Code = 'POREF' THEN rrv.rrv_Value END) AS POREF

                    FROM LV_Receipt r WITH (NOLOCK)
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK)
                        ON r.rct_ID = rci.rci_ReceiptID
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
                        WHERE iph.iph_ParentItemUnitID = actItu.itu_ID
                    ) actToX3
                    LEFT JOIN LV_ReceiptItemRctAttrValue rrv WITH (NOLOCK)
                        ON rci.rci_ID = rrv.rrv_ReceiptItemID
                    LEFT JOIN LV_ReceiptAttributes ra WITH (NOLOCK)
                        ON rrv.rrv_ReceiptAttributeID = ra.rat_ID
                    LEFT JOIN LV_Log l WITH (NOLOCK)
                        ON rci.rci_ID = l.log_ReceiptItemID
                    LEFT JOIN LV_LogStock lsk WITH (NOLOCK)
                        ON l.log_ID = lsk.lsk_LogID
                    LEFT JOIN LV_LogStockAttrValue lsa WITH (NOLOCK)
                        ON lsk.lsk_ID = lsa.lsa_LogStockID
                    LEFT JOIN LV_StockAttributes sa WITH (NOLOCK)
                        ON lsa.lsa_AttributeID = sa.sat_ID AND sa.sat_ID = 1
                    LEFT JOIN LV_Location loc WITH (NOLOCK)
                        ON rci.rci_LocationID = loc.loc_ID
                    WHERE r.rct_Code = @ReceiptCode
                    GROUP BY
                        r.rct_Code,
                        r.rct_ActualDate,
					    r.rct_InputDate,
                        r.rct_ExpectedDate,
                        rci.rci_ID,
                        rci.rci_ReceiptLine,
                        p.prd_PrimaryCode,
                        x3conv.sku_x3,
                        x3conv.uom_mantis,
                        rci.rci_ExpQuantity,
                        expUnit.unt_Code,
                        rci.rci_ActQuantity,
                        actUnit.unt_Code,
                        actToX3.conversion_qty
                ";

                string pagedQuery = cteQuery + mainQuery + @"
                    ORDER BY rci.rci_ReceiptLine
                    OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY
                ";

                string countQuery = cteQuery + @"
                    SELECT COUNT(DISTINCT rci.rci_ID)
                    FROM LV_Receipt r WITH (NOLOCK)
                    INNER JOIN LV_ReceiptItem rci WITH (NOLOCK)
                        ON r.rct_ID = rci.rci_ReceiptID
                    WHERE r.rct_Code = @ReceiptCode
                ";

                var parameters = new DynamicParameters();
                parameters.Add("@ReceiptCode", receiptCode);
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var data = await _dataAccess.GetDataInline<ReceiptExportDetails, dynamic>(
                    pagedQuery, parameters);

                int totalRecords = (await _dataAccess.GetDataInline<int, dynamic>(
                    countQuery, parameters)).FirstOrDefault();

                return new ReceiptExportDetailsResponse
                {
                    Data = data,
                    TotalRecords = totalRecords
                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ReceiptExportDetailsLotResponse> GetReceiptExportDetailLOT(GridRequest request, string? receiptCode)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ReceiptCode", receiptCode);
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            var result = await _dataAccess.GetDataWithCount<ReceiptExportDetailsLot, DynamicParameters>(
                 "Cus_GetReceiptExportDetailLOT",
                 parameters
            );

            return new ReceiptExportDetailsLotResponse
            {
                Data = result.Data.ToList(),
                TotalRecords = result.TotalCount
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

    }
}
