using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using System.Data.Common;
using System.Collections;
using iText.Commons.Actions.Contexts;
using System.Text.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class DashboardRepository : IDashboardRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        public DashboardRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<IEnumerable<OrderShortDataRow>> GetOrderShortData(OrderShortDataRequest request)
        {
            try
            {
                var sql = @"
                    SELECT 
                        ct.pick_list_id,
                        ct.prd_PrimaryCode,
                        ct.qty,

                        SUM(oss.oss_Quantity) AS outer_QTY,
                        SUM(oss.oss_QuantitySU) AS inner_QTY,

                        ct.create_datetime,
                        os.ors_MessageCode,
                        ps.pst_MessageCode,

                        MAX(T.tsk_ID) AS tsk_ID,
                        MAX(T.tsk_Code) AS tsk_Code,

                        CASE 
                            WHEN ct.item_reference IS NULL THEN 'Missing_Info' 
                        END AS Item_issues,

                        CASE 
                            WHEN stock.has_stock IS NULL THEN 'No Stock' 
                        END AS Qty_Free

                    FROM (
                        SELECT
                            o.ord_ID,
                            iod.pick_list_id,
                            p.prd_ID,
                            p.prd_PrimaryCode,
                            iod.uom,
                            SUM(iod.qty) AS qty,
                            iod.create_datetime,
                            o.ord_StatusID,
                            iod.item_reference
                        FROM Cus_T_ImportedOrdersDetails iod
                        INNER JOIN LV_Product p 
                            ON p.prd_PrimaryCode = iod.item_reference
                        INNER JOIN LV_Order o 
                            ON o.ord_code = iod.pick_list_id
                        GROUP BY
                            o.ord_ID,
                            iod.pick_list_id,
                            p.prd_ID,
                            p.prd_PrimaryCode,
                            iod.uom,
                            iod.create_datetime,
                            o.ord_StatusID,
                            iod.item_reference
                    ) ct

                    LEFT JOIN LV_OrderItem oi 
                        ON oi.ori_OrderID = ct.ord_ID 
                        AND oi.ori_ProductID = ct.prd_ID

                    LEFT JOIN LV_OrderShipItem osi 
                        ON osi.osi_OrderItemID = oi.ori_ID

                    --IMPORTANT: keep this filter (prevents row explosion)
                    LEFT JOIN LV_OrderShipItemStock oss 
                        ON oss.oss_OrderShipItemID = osi.osi_ID
                        AND oss.oss_TaskID IS NOT NULL

                    LEFT JOIN LV_Task T 
                        ON T.tsk_ID = oss.oss_TaskID

                    LEFT JOIN LV_OrderStatus os 
                        ON ct.ord_StatusID = os.ors_ID

                    LEFT JOIN LV_ProgressStatus ps 
                        ON ct.ord_StatusID = ps.pst_ID

                    -- Stock check
                    LEFT JOIN (
                        SELECT DISTINCT 
                            s.stk_ProductID, 
                            1 AS has_stock
                        FROM lv_stock s
                        INNER JOIN lv_location l 
                            ON s.stk_LocationID = l.loc_ID
                        WHERE 
                            s.stk_CUQuantityFree > 0
                            AND l.loc_Code NOT IN ('W1', 'D2', 'MISTOCK','MISC','DMG01','EXP01','QRTIN','REC01')
                            AND l.loc_Code NOT LIKE 'TUL%'
                    ) stock 
                        ON stock.stk_ProductID = ct.prd_ID

                    WHERE 
                        ct.create_datetime > DATEADD(DAY, -@Days, GETDATE())
                ";

                var parameters = new DynamicParameters();
                parameters.Add("Days", request.Days);

                // Safe filtering (whitelist)
                if (!string.IsNullOrEmpty(request.Filter_Text))
                {
                    switch (request.Filter_By)
                    {
                        case "Qty_Free":
                            sql += " AND stock.has_stock IS NULL";
                            break;

                        case "Item_issues":
                            sql += " AND ct.item_reference IS NULL";
                            break;

                        case "ors_MessageCode":
                        case "pst_MessageCode":
                        case "prd_PrimaryCode":
                        case "pick_list_id":
                            sql += $" AND {request.Filter_By} LIKE @FilterText";
                            parameters.Add("FilterText", $"%{request.Filter_Text}%");
                            break;

                        case "create_datetime":
                            if (DateTime.TryParse(request.Filter_Text, out DateTime dt))
                            {
                                sql += " AND CAST(ct.create_datetime AS DATE) = @FilterDate";
                                parameters.Add("FilterDate", dt.Date);
                            }
                            break;
                    }
                }

                sql += @"
                    AND ct.qty > 0
                    AND pst_MessageCode NOT IN ('Status_Cancelled', 'Status_Suspended', 'Status_Done')
                    GROUP BY 
                        ct.pick_list_id, 
                        ct.prd_PrimaryCode, 
                        ct.qty, 
                        ct.create_datetime, 
                        ors_MessageCode,
                        ct.item_reference,
                        stock.has_stock, 
                        pst_MessageCode

                    HAVING 
                        (ct.qty <> ISNULL(SUM(oss.oss_Quantity), 0) 
                         AND ct.qty <> ISNULL(SUM(oss.oss_QuantitySU), 0)) 
                        OR SUM(oss.oss_Quantity) IS NULL
                    ORDER BY 
                        ct.create_datetime, 
                        ct.pick_list_id
                ";

                return await _dataAccess.GetDataInline<OrderShortDataRow, dynamic>(sql, parameters);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<TaskManagementResponse> GetTaskManagement()
        {
            try
            {
                var query = @"
                    SELECT 
                        T.tsk_ID,
                        T.tsk_Code,
                        FORMAT(T.tsk_CreateTime, 'yyyy-MM-dd h:mmtt') AS CreateDate,
                        CONVERT(VARCHAR(10), DATEADD(MINUTE, (DATEDIFF(MINUTE, 0, T.tsk_ActualTime)/15)*15, 0), 120) + ' ' + 
                        LTRIM(RIGHT(CONVERT(VARCHAR, DATEADD(MINUTE, (DATEDIFF(MINUTE, 0, T.tsk_ActualTime)/15)*15, 0), 100), 7)) AS tsk_ActualTime,
                        M.prd_PrimaryCode,
                        U.usr_Login,
                        V.ord_Code,
                        P.pst_MessageCode,
                        CONCAT(COM_Person.per_FirstName, ' ', COM_Person.per_LastName) AS username,
                        L.trt_MessageCode,
                        T.tsk_TransactionTypeID
                    FROM LV_Task T
                    INNER JOIN LV_ProgressStatus P ON T.tsk_StatusID = P.pst_ID
                    INNER JOIN LV_Product M ON T.tsk_ProductID = M.prd_ID
                    LEFT JOIN COM_Employee E ON E.emp_ID = T.tsk_ActualUserID
                    LEFT JOIN LV_Users U ON U.usr_PersonID = E.emp_PersonID
                    LEFT JOIN V_TaskOrder V ON V.TaskID = T.tsk_ID
                    LEFT JOIN COM_Person ON U.usr_PersonID = COM_Person.per_ID
                    LEFT JOIN LV_TransactionType L ON L.trt_ID = T.tsk_TransactionTypeID
                    WHERE P.pst_ID IN (2, 6)
                      AND NOT (
                          CAST(T.tsk_ActualTime AS DATE) = CAST(GETDATE() AS DATE)
                          AND ABS(DATEDIFF(MINUTE, T.tsk_ActualTime, GETDATE())) <= 15)
                ";

                var result = await _dataAccess.GetDataInline<TaskManagement, dynamic>(query, new { });
                return new TaskManagementResponse
                {
                    Tasks = result,
                    Message = "Successful"
                };
            }
            catch (Exception ex)
            {
                return new TaskManagementResponse { Error = 1, Message = $"Internal Server Error | {ex.Message}" };
            }
            
        }

        public async Task<bool> UpdateTaskStatus(int? taskId, int statusId)
        {
            var sql = @"UPDATE LV_Task SET tsk_StatusID = @StatusId WHERE tsk_ID = @TaskId";
            var rowsAffected = await _dataAccess.SaveDataInline(sql, new { TaskId = taskId, StatusId = statusId });
            return rowsAffected > 0;
        }

        public async Task<List<TruckDto>> GetTruckQuery(GridRequest request, int? truckId = null)
        {
            var sql = new StringBuilder();

            sql.AppendLine(@"
                SELECT
                    trk.trk_ID,
                    trk.trk_Code,
                    loc.loc_Code AS Doc,
                    COUNT(DISTINCT shp.shp_ID) AS NumberOfShipments,
                    shp.shp_ID,
                    COUNT(DISTINCT voi.ori_sscc) AS NumberOfPallets
                FROM V_Truck AS trk
                JOIN V_SearchShipment AS shp ON trk.trk_ID = shp.shp_TruckID
                LEFT JOIN V_SelectOrderShipment AS ost ON shp.shp_ID = ost.ost_ShipmentID
                JOIN V_OrderItemInfo AS voi ON voi.ori_OrderID = ost.ost_OrderID
                LEFT JOIN LV_Location AS loc ON shp.shp_LocationID = loc.loc_ID
                WHERE (shp.LanguageID = 1 OR shp.LanguageID IS NULL)
                  AND (shp.LanguageID1 = 1 OR shp.LanguageID1 IS NULL)
                  AND (ost.LanguageID = 1 AND ost.LanguageID1 = 1 AND ost.LanguageID2 = 1 AND (ost.LanguageID3 = 1 OR ost.LanguageID3 IS NULL))
                  AND (voi.LanguageID = 1 AND voi.LanguageID1 = 1 AND voi.LanguageID2 = 1 AND (voi.LanguageID3 = 1 OR voi.LanguageID3 IS NULL))
            ");

            if (truckId.HasValue)
            {
                sql.AppendLine("AND trk.trk_ID = @TruckId");
            }

            sql.AppendLine("GROUP BY trk.trk_ID, shp.shp_ID, trk.trk_Code, loc.loc_Code");
            sql.AppendLine("ORDER BY trk.trk_ID, shp.shp_ID");

            var result = await _dataAccess.GetDataInline<TruckDto,dynamic>(sql.ToString(), new { TruckId = truckId });
            return result.ToList();
        }

        public async Task<TruckOrderDetailResponse> GetTruckOrderDetail(int id)
        {
            var query = @"
               SELECT 
                    loc.loc_Code,
                    ost.ord_Code,
                    voi.ori_SSCC
                FROM V_Truck AS trk
                JOIN V_SearchShipment AS shp 
                    ON trk.trk_ID = shp.shp_TruckID
                LEFT JOIN V_SelectOrderShipment AS ost 
                    ON shp.shp_ID = ost.ost_ShipmentID
                JOIN V_OrderItemInfo AS voi 
                    ON voi.ori_OrderID = ost.ost_OrderID
                LEFT JOIN LV_Location AS loc 
                    ON shp.shp_LocationID = loc.loc_ID
                WHERE trk.trk_ID = @TruckId
                    AND (shp.LanguageID = 1 OR shp.LanguageID IS NULL)
                    AND (shp.LanguageID1 = 1 OR shp.LanguageID1 IS NULL)
                    AND ost.LanguageID = 1
                    AND ost.LanguageID1 = 1
                    AND ost.LanguageID2 = 1
                    AND (ost.LanguageID3 = 1 OR ost.LanguageID3 IS NULL)
                    AND voi.LanguageID = 1
                    AND voi.LanguageID1 = 1
                    AND voi.LanguageID2 = 1
                    AND (voi.LanguageID3 = 1 OR voi.LanguageID3 IS NULL)
                GROUP BY 
                    loc.loc_Code,
                    ost.ord_Code,
                    voi.ori_SSCC;
            ";

            var result = await _dataAccess.GetDataInline<TruckOrderDetail, dynamic>(query, new { TruckId = id });
            return new TruckOrderDetailResponse
            {
                Data = result,
                Message = "Successful"
            };
        }

        public async Task<ShippingConveyorResponse> GetShippingConveyor(GridRequest request)
        {
            try
            {
                var parameters = new DynamicParameters();
                var whereClauses = new List<string>();

                // FILTERING 
                if (request.filters != null)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Value.value))
                        {
                            whereClauses.Add($"{filter.Key} LIKE @Filter_{filter.Key}");
                            parameters.Add($"@Filter_{filter.Key}", $"%{filter.Value.value}%");
                        }
                    }
                }

                string whereSql = whereClauses.Count > 0
                    ? " WHERE " + string.Join(" AND ", whereClauses)
                    : "";

                // SORTING 
                string orderSql = "";

                if (!string.IsNullOrEmpty(request.sortField) &&
                    (request.sortOrder == "1" || request.sortOrder == "-1"))
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    orderSql = $" ORDER BY {request.sortField} {sortOrder}";
                }

                // BASE QUERY 
                string baseSql = @"
                    SELECT
                        ccs.title AS Slots,
                        o.ord_Code AS OrderCode,
                        ISNULL(OrderQuantity.OrderQuantity, 0) AS OrderQuantity,
                        ISNULL(PackQuantity.Quantity, 0) AS PackedQuantity,
                        ISNULL(SLotQuantity.Quantity, 0) AS SlotQuantity
                    FROM cus_con_Order cco WITH (NOLOCK)
                    INNER JOIN LV_Order o WITH (NOLOCK) ON cco.order_id = o.ord_ID
                    INNER JOIN CUS_Con_Slots ccs WITH (NOLOCK) ON cco.slot_id = ccs.id
                    OUTER APPLY (
                        SELECT SUM(oi.ori_Quantity) AS OrderQuantity
                        FROM LV_OrderItem oi WITH (NOLOCK)
                        WHERE o.ord_ID = oi.ori_OrderID
                        GROUP BY oi.ori_OrderID
                    ) AS OrderQuantity
                    OUTER APPLY (
                        SELECT SUM(osis.oss_Quantity) AS Quantity
                        FROM LV_OrderItem oi WITH (NOLOCK)
                        LEFT JOIN lv_stock st WITH (NOLOCK) ON st.stk_LocationID = 22483
                        INNER JOIN LV_StockPackType spt WITH (NOLOCK) 
                            ON st.stk_ID = spt.spt_StockID AND spt.spt_ParentID IS NULL
                        INNER JOIN LV_OrderShipItem osi WITH (NOLOCK) ON oi.ori_ID = osi.osi_OrderItemID
                        INNER JOIN LV_OrderShipItemStock osis WITH (NOLOCK) 
                            ON spt.spt_StockID = osis.oss_StockID 
                            AND osi.osi_ID = osis.oss_OrderShipItemID 
                            AND spt_ID = osis.oss_StockPackTypeID
                        WHERE o.ord_ID = oi.ori_OrderID
                    ) AS PackQuantity
                    OUTER APPLY (
                        SELECT SUM(osis.oss_Quantity) AS Quantity
                        FROM LV_OrderItem oi WITH (NOLOCK)
                        LEFT JOIN lv_stock st WITH (NOLOCK) ON st.stk_LocationID = ccs.mantis_location_id
                        INNER JOIN LV_StockPackType spt WITH (NOLOCK) 
                            ON st.stk_ID = spt.spt_StockID AND spt.spt_ParentID IS NULL
                        INNER JOIN LV_OrderShipItem osi WITH (NOLOCK) ON oi.ori_ID = osi.osi_OrderItemID
                        INNER JOIN LV_OrderShipItemStock osis WITH (NOLOCK) 
                            ON spt.spt_StockID = osis.oss_StockID 
                            AND osi.osi_ID = osis.oss_OrderShipItemID 
                            AND spt_ID = osis.oss_StockPackTypeID
                        WHERE o.ord_ID = oi.ori_OrderID
                    ) AS SLotQuantity
                    GROUP BY
                        ccs.title,
                        o.ord_Code,
                        o.ord_ID,
                        OrderQuantity.OrderQuantity,
                        PackQuantity.Quantity,
                        SLotQuantity.Quantity
                ";

                // TOTAL COUNT 
                string countSql = $"SELECT COUNT(1) FROM ({baseSql}) AS x {whereSql}";
                var totalRecords = await _dataAccess.SaveDataReturnInline<int>(countSql, parameters);

                // PAGINATION 
                string pagedSql = $@"
                    SELECT * FROM (
                        SELECT 
                            ROW_NUMBER() OVER ({(string.IsNullOrEmpty(orderSql) ? "ORDER BY (SELECT NULL)" : orderSql)}) AS RowNum,
                            *
                        FROM ({baseSql}) AS t
                        {whereSql}
                    ) AS Result
                    WHERE RowNum BETWEEN @Skip + 1 AND @Skip + @Take
                    {(string.IsNullOrEmpty(orderSql) ? "" : orderSql)}
                ";

                parameters.Add("@Skip", request.first);
                parameters.Add("@Take", request.rows);

                var data = await _dataAccess.GetDataInline<ShippingConveyorDto, dynamic>(pagedSql, parameters);

                return new ShippingConveyorResponse
                {
                    Data = data,
                    TotalCount = totalRecords,
                    Message = "Successful",
                    Error = 0
                };
            }
            catch (Exception ex)
            {
                return new ShippingConveyorResponse
                {
                    Message = ex.Message,
                    Error = 1
                };
            }
        }


        public async Task<TaskDashboardResponse> GetTaskDashboardAsync(TaskDashboardRequest request)
        {
            var lazyState = request.lazyState ?? new lazyState();
            var rows = lazyState.rows > 0 ? lazyState.rows : 10;
            var skip = lazyState.first >= 0 ? lazyState.first : 0;
            var sortOrder = lazyState.sortOrder == "-1" ? "DESC" : "ASC";

            // Map only to columns exposed by TaskBase CTE
            var sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["tsk_ID"] = "tsk_ID",
                ["tsk_Code"] = "tsk_Code",
                ["Message"] = "Message",
                ["MessageName"] = "MessageName",
                ["comboDescription"] = "ComboDescription",
                ["ProductShortDescription"] = "ProductShortDescription",
                ["actualUser"] = "ActualUser",
                ["Depositor"] = "Depositor",
                ["tsk_SSCC"] = "tsk_SSCC",
                ["fromLocCode"] = "FromLocCode",
                ["tsk_ToLocationCode"] = "tsk_ToLocationCode",
                ["taskOrder"] = "TaskOrder",
                ["tsk_Quantity"] = "tsk_Quantity",
                ["ExecutionDate"] = "tsk_CreateTime",
                ["transaction_type"] = "tsk_TransactionTypeID",
                ["status"] = "tsk_StatusID"
            };

            var sortField = !string.IsNullOrWhiteSpace(lazyState.sortField) &&
                            sortColumns.TryGetValue(lazyState.sortField, out var mappedSortField)
                ? mappedSortField
                : "tsk_ID";

            // Prevent duplicate column in ORDER BY
            var pagedOrderBy = sortField.Equals("tsk_ID", StringComparison.OrdinalIgnoreCase)
                ? $"TaskBase.{sortField} {sortOrder}"
                : $"TaskBase.{sortField} {sortOrder}, TaskBase.tsk_ID ASC";

            var finalOrderBy = sortField.Equals("tsk_ID", StringComparison.OrdinalIgnoreCase)
                ? $"p.{sortField} {sortOrder}"
                : $"p.{sortField} {sortOrder}, p.tsk_ID ASC";

            var filterColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["tsk_Code"] = "t.tsk_Code",
                ["Message"] = "tm.msg_Greek",
                ["MessageName"] = "pm.msg_Greek",
                ["comboDescription"] = "ISNULL(tcul.untl_Description,'') + ISNULL(iul.untl_Description,'')",
                ["ProductShortDescription"] = "p.prd_PrimaryCode + ' - ' + ISNULL(pl.prdl_ShortDescription,'')",
                ["actualUser"] = "ap.per_Code + ' - ' + ap.per_FirstName + ' ' + ap.per_LastName",
                ["Depositor"] = "d.dep_Code + ' - ' + c.cmp_ShortName",
                ["tsk_SSCC"] = "t.tsk_SSCC",
                ["fromLocCode"] = "t.tsk_FromLocationCode",
                ["tsk_ToLocationCode"] = "t.tsk_ToLocationCode",
                ["taskOrder"] = "ISNULL(T2.ost_Code,'') + ISNULL(T1.osg_Code,'')",
                ["tsk_Quantity"] = "t.tsk_Quantity",
                ["ExecutionDate"] = "t.tsk_CreateTime",
                ["transaction_type"] = "t.tsk_TransactionTypeID",
                ["status"] = "t.tsk_StatusID"
            };

            var parameters = new DynamicParameters();
            parameters.Add("skip", skip);
            parameters.Add("rows", rows);

            string fromClause = @"
FROM LV_Task t WITH (NOLOCK)

LEFT JOIN LV_TaskList tl WITH (NOLOCK)
    ON t.tsk_TaskListID = tl.tkl_ID

LEFT JOIN LV_Product p WITH (NOLOCK)
    ON t.tsk_ProductID = p.prd_ID

LEFT JOIN LV_ProductLang pl WITH (NOLOCK)
    ON p.prd_ID = pl.prdl_ProductID
   AND pl.prdl_LanguageID = 1

INNER JOIN LV_TransactionType tt WITH (NOLOCK)
    ON t.tsk_TransactionTypeID = tt.trt_ID

INNER JOIN LV_Messages tm WITH (NOLOCK)
    ON tt.trt_MessageCode = tm.msg_Code
   AND tm.msg_LanguageID = 1

INNER JOIN LV_ProgressStatus ps WITH (NOLOCK)
    ON t.tsk_StatusID = ps.pst_ID

INNER JOIN LV_Messages pm WITH (NOLOCK)
    ON ps.pst_MessageCode = pm.msg_Code
   AND pm.msg_LanguageID = 1

LEFT JOIN LV_Depositor d WITH (NOLOCK)
    ON t.tsk_DepositorID = d.dep_ID

LEFT JOIN LV_Company c WITH (NOLOCK)
    ON d.dep_CompanyID = c.cmp_ID

LEFT JOIN COM_Employee ae WITH (NOLOCK)
    ON t.tsk_ActualUserID = ae.emp_ID

LEFT JOIN COM_Person ap WITH (NOLOCK)
    ON ae.emp_PersonID = ap.per_ID

LEFT JOIN LV_ItemUnit iu WITH (NOLOCK)
    ON t.tsk_ItemUnitID = iu.itu_ID

LEFT JOIN LV_Unit iuu WITH (NOLOCK)
    ON iu.itu_UnitID = iuu.unt_ID

LEFT JOIN LV_UnitLang iul WITH (NOLOCK)
    ON iuu.unt_ID = iul.untl_UnitID
   AND iul.untl_LanguageID = 1

LEFT JOIN LV_Unit tcu WITH (NOLOCK)
    ON t.tsk_ContUnitID = tcu.unt_ID

LEFT JOIN LV_UnitLang tcul WITH (NOLOCK)
    ON tcu.unt_ID = tcul.untl_UnitID
   AND tcul.untl_LanguageID = 1

LEFT JOIN
(
    SELECT
        oss_TaskID,
        MAX(osg_Code) AS osg_Code
    FROM LV_OrderShipGroupItem ogi WITH (NOLOCK)
    INNER JOIN LV_OrderShipmentGroup osg WITH (NOLOCK)
        ON ogi.ogi_GroupID = osg.osg_ID
    INNER JOIN LV_OrderShipItemStock oss WITH (NOLOCK)
        ON ogi.ogi_ID = oss.oss_GroupItemID
    GROUP BY oss_TaskID
) T1
    ON t.tsk_ID = T1.oss_TaskID

LEFT JOIN
(
    SELECT
        oss_TaskID,
        MAX(ost_Code) AS ost_Code
    FROM LV_OrderShipItemStock oss WITH (NOLOCK)
    INNER JOIN LV_OrderShipItem osi WITH (NOLOCK)
        ON oss.oss_OrderShipItemID = osi.osi_ID
    INNER JOIN LV_OrderShipment ost WITH (NOLOCK)
        ON osi.osi_OrderShipmentID = ost.ost_ID
    GROUP BY oss_TaskID
) T2
    ON t.tsk_ID = T2.oss_TaskID
";

            string whereClause = @"
WHERE t.tsk_LogisticSiteID = 5
  AND t.tsk_CreateTime IS NOT NULL
";

            if (string.IsNullOrEmpty(request.dateFrom) && string.IsNullOrEmpty(request.dateTo))
            {
                whereClause += " AND t.tsk_CreateTime >= DATEADD(DAY, -60, GETDATE())";
            }
            else
            {
                if (!string.IsNullOrEmpty(request.dateFrom))
                {
                    whereClause += " AND t.tsk_CreateTime >= @dateFrom";
                    parameters.Add("dateFrom", DateTime.Parse(request.dateFrom + " 00:00:00"));
                }

                if (!string.IsNullOrEmpty(request.dateTo))
                {
                    whereClause += " AND t.tsk_CreateTime <= @dateTo";
                    parameters.Add("dateTo", DateTime.Parse(request.dateTo + " 23:59:59"));
                }
            }

            if (lazyState.filters != null && lazyState.filters.Count > 0)
            {
                int idx = 0;

                foreach (var kv in lazyState.filters)
                {
                    var key = kv.Key;
                    var f = kv.Value;

                    if (f?.value == null) continue;
                    if (!filterColumns.TryGetValue(key, out var sqlCol)) continue;

                    var pname = $"p{idx++}";
                    object filterVal = f.value;

                    if (filterVal is JsonElement jsonEl)
                    {
                        if (jsonEl.ValueKind == JsonValueKind.Array)
                        {
                            var list = jsonEl.EnumerateArray()
                                .Select(e => e.ToString())
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .ToList();

                            if (!list.Any()) continue;

                            var inParams = new List<string>();
                            int j = 0;
                            foreach (var val in list)
                            {
                                var inName = $"{pname}_{j++}";
                                inParams.Add($"@{inName}");
                                parameters.Add(inName, val);
                            }

                            whereClause += $" AND {sqlCol} IN ({string.Join(",", inParams)})";
                            continue;
                        }
                        else if (jsonEl.ValueKind == JsonValueKind.String)
                        {
                            var strVal = jsonEl.GetString();
                            if (string.IsNullOrWhiteSpace(strVal)) continue;
                            filterVal = strVal;
                        }
                        else if (jsonEl.ValueKind == JsonValueKind.Number)
                        {
                            if (jsonEl.TryGetInt32(out var intVal))
                                filterVal = intVal;
                            else if (jsonEl.TryGetDouble(out var dblVal))
                                filterVal = dblVal;
                            else
                                continue;
                        }
                        else if (jsonEl.ValueKind == JsonValueKind.True || jsonEl.ValueKind == JsonValueKind.False)
                        {
                            filterVal = jsonEl.GetBoolean();
                        }
                        else
                        {
                            continue;
                        }
                    }

                    if (f.matchMode == "contains" && filterVal is string)
                    {
                        whereClause += $" AND {sqlCol} LIKE @{pname}";
                        parameters.Add(pname, $"%{filterVal}%");
                    }
                    else
                    {
                        whereClause += $" AND {sqlCol} = @{pname}";
                        parameters.Add(pname, filterVal);
                    }
                }
            }

            var countSql = $@"
SELECT COUNT(1)
{fromClause}
{whereClause};";

            int totalRecords = (await _dataAccess.GetDataInline<int, dynamic>(countSql, parameters)).FirstOrDefault();

            var sql = $@"
;WITH TaskBase AS
(
    SELECT
        t.tsk_Code,
        tm.msg_Greek AS Message,
        pm.msg_Greek AS MessageName,
        p.prd_PrimaryCode + ' - ' + ISNULL(pl.prdl_ShortDescription, '') AS ProductShortDescription,
        ISNULL(tcul.untl_Description, '') + ISNULL(iul.untl_Description, '') AS ComboDescription,
        CAST(t.tsk_Quantity AS INT) AS tsk_Quantity,
        t.tsk_SSCC,
        t.tsk_FromLocationCode AS FromLocCode,
        t.tsk_ToLocationCode,
        ISNULL(T2.ost_Code, '') + ISNULL(T1.osg_Code, '') AS TaskOrder,
        ap.per_Code + ' - ' + ap.per_FirstName + ' ' + ap.per_LastName AS ActualUser,
        COALESCE(tl.tkl_CompleteDate, t.tsk_ActualTime) AS ActualDateTime,
        d.dep_Code + ' - ' + c.cmp_ShortName AS Depositor,
        t.tsk_ID,
        t.tsk_TransactionTypeID,
        t.tsk_CreateTime,
        t.tsk_StatusID
    {fromClause}
    {whereClause}
),
PagedTasks AS
(
    SELECT *
    FROM TaskBase
    ORDER BY {pagedOrderBy}
    OFFSET @skip ROWS FETCH NEXT @rows ROWS ONLY
)
SELECT
    p.tsk_Code,
    p.Message,
    p.MessageName,
    p.ProductShortDescription,
    p.ComboDescription,
    p.tsk_Quantity,
    p.tsk_SSCC,
    p.FromLocCode,
    p.tsk_ToLocationCode,
    p.TaskOrder,
    p.ActualUser,
    CONVERT(varchar(10), p.ActualDateTime, 23) + ' ' +
    RIGHT('0' + CAST(
        CASE 
            WHEN DATEPART(HOUR, p.ActualDateTime) % 12 = 0 THEN 12
            ELSE DATEPART(HOUR, p.ActualDateTime) % 12
        END AS varchar(2)
    ), 2) + ':' +
    RIGHT('0' + CAST(DATEPART(MINUTE, p.ActualDateTime) AS varchar(2)), 2) + ' ' +
    CASE WHEN DATEPART(HOUR, p.ActualDateTime) >= 12 THEN 'PM' ELSE 'AM' END AS tkl_CompleteDate,
    p.Depositor,
    p.tsk_ID,
    p.tsk_TransactionTypeID,
    ISNULL(a.LotNum, '') AS LotNum,
    TRY_CONVERT(real, TRY_CONVERT(NUMERIC(18,8), a.SublotNum)) AS SublotNum,
    TRY_CONVERT(real, TRY_CONVERT(NUMERIC(18,8), a.ExpiryDate)) AS ExpiryDate,
    TRY_CONVERT(real, TRY_CONVERT(NUMERIC(18,8), a.MfgDate)) AS MfgDate
FROM PagedTasks p
OUTER APPLY
(
    SELECT
        MAX(CASE WHEN tav_AttributeID = 1 THEN tav_Value END) AS LotNum,
        MAX(CASE WHEN tav_AttributeID = 2 THEN tav_Value END) AS SublotNum,
        MAX(CASE WHEN tav_AttributeID = 3 THEN tav_Value END) AS ExpiryDate,
        MAX(CASE WHEN tav_AttributeID = 4 THEN tav_Value END) AS MfgDate
    FROM lv_TaskAttributesvalues WITH (NOLOCK)
    WHERE tav_TaskID = p.tsk_ID
      AND tav_AttributeID IN (1,2,3,4)
) a
ORDER BY {finalOrderBy};";

            var resultData = await _dataAccess.GetDataInline<TaskDashboardModel, dynamic>(sql, parameters);

            var dashboardData = new DashboardData
            {
                data = resultData.ToList(),
                path = "http://192.168.254.8:81/mantis-middleware/public/api/v2/get-task-dashboard",
                per_page = rows,
                next_cursor = null,
                next_page_url = null,
                prev_cursor = null,
                prev_page_url = null,
                total = totalRecords
            };

            return new TaskDashboardResponse
            {
                data = dashboardData
            };
        }

        //public async Task<TaskDashboardResponse> GetTaskDashboardAsync(TaskDashboardRequest request)
        //{
        //    var lazyState = request.lazyState ?? new lazyState();
        //    var sortField = !string.IsNullOrEmpty(lazyState.sortField) ? lazyState.sortField : "tsk_ID";
        //    var sortOrder = lazyState.sortOrder == "-1" ? "DESC" : "ASC";
        //    var rows = lazyState.rows > 0 ? lazyState.rows : 10;
        //    var skip = lazyState.first;

        //    // Map FE filter keys → DB columns
        //    var filterColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        //    {
        //        ["tsk_Code"] = "V_TaskSearch.tsk_Code",
        //        ["Message"] = "V_TaskSearch.Message",
        //        ["MessageName"] = "V_TaskSearch.MessageName",
        //        ["comboDescription"] = "V_TaskSearch.ComboDescription",
        //        ["ProductShortDescription"] = "V_TaskSearch.ProductShortDescription",
        //        ["actualUser"] = "V_TaskSearch.ActualUser",
        //        ["Depositor"] = "V_TaskSearch.Depositor",
        //        ["tsk_SSCC"] = "V_TaskSearch.tsk_SSCC",
        //        ["fromLocCode"] = "V_TaskSearch.FromLocCode",
        //        ["tsk_ToLocationCode"] = "V_TaskSearch.tsk_ToLocationCode",
        //        ["taskOrder"] = "V_TaskSearch.TaskOrder",
        //        ["tsk_Quantity"] = "V_TaskSearch.tsk_Quantity",
        //        ["ExecutionDate"] = "V_TaskSearch.tsk_CreateTime",
        //        ["transaction_type"] = "V_TaskSearch.tsk_TransactionTypeID",
        //        ["status"] = "V_TaskSearch.tsk_StatusID",
        //    };

        //    var sql = @"
        //        SELECT 
        //            V_TaskSearch.tsk_Code,
        //            V_TaskSearch.Message,
        //            V_TaskSearch.MessageName,
        //            V_TaskSearch.ProductShortDescription,
        //            V_TaskSearch.ComboDescription,
        //            CAST(V_TaskSearch.tsk_Quantity AS INT) AS tsk_Quantity,
        //            V_TaskSearch.tsk_SSCC,
        //            V_TaskSearch.FromLocCode,
        //            V_TaskSearch.tsk_ToLocationCode,
        //            V_TaskSearch.TaskOrder,
        //            V_TaskSearch.ActualUser,
        //            FORMAT(COALESCE(V_TaskSearch.tkl_CompleteDate, V_TaskSearch.tsk_ActualTime), 'yyyy-MM-dd hh:mm tt') AS tkl_CompleteDate,
        //            V_TaskSearch.Depositor,
        //            V_TaskSearch.tsk_ID,
        //            V_TaskSearch.tsk_TransactionTypeID,
        //            ISNULL(Attributes0.tav_Value, '') AS LotNum,
        //            CONVERT(real, CONVERT(NUMERIC(18,8), Attributes1.tav_Value)) AS SublotNum,
        //            CONVERT(real, CONVERT(NUMERIC(18,8), Attributes2.tav_Value)) AS ExpiryDate,
        //            CONVERT(real, CONVERT(NUMERIC(18,8), Attributes3.tav_Value)) AS MfgDate
        //        FROM V_TaskSearch WITH (NOLOCK)
        //        LEFT JOIN (SELECT tav_TaskID, tav_Value FROM lv_TaskAttributesvalues WITH (NOLOCK) WHERE tav_AttributeID = 1) AS Attributes0 
        //            ON V_TaskSearch.tsk_ID = Attributes0.tav_TaskID
        //        LEFT JOIN (SELECT tav_TaskID, tav_Value FROM lv_TaskAttributesvalues WITH (NOLOCK) WHERE tav_AttributeID = 2) AS Attributes1 
        //            ON V_TaskSearch.tsk_ID = Attributes1.tav_TaskID
        //        LEFT JOIN (SELECT tav_TaskID, tav_Value FROM lv_TaskAttributesvalues WITH (NOLOCK) WHERE tav_AttributeID = 3) AS Attributes2 
        //            ON V_TaskSearch.tsk_ID = Attributes2.tav_TaskID
        //        LEFT JOIN (SELECT tav_TaskID, tav_Value FROM lv_TaskAttributesvalues WITH (NOLOCK) WHERE tav_AttributeID = 4) AS Attributes3 
        //            ON V_TaskSearch.tsk_ID = Attributes3.tav_TaskID
        //        WHERE V_TaskSearch.tsk_LogisticSiteID = 5
        //          AND V_TaskSearch.LanguageID = 1
        //          AND V_TaskSearch.LanguageID1 = 1
        //          AND (V_TaskSearch.LanguageID2 = 1 OR V_TaskSearch.LanguageID2 IS NULL)
        //          AND (V_TaskSearch.LanguageID3 = 1 OR V_TaskSearch.LanguageID3 IS NULL)
        //          AND (V_TaskSearch.LanguageID4 = 1 OR V_TaskSearch.LanguageID4 IS NULL)
        //          AND (V_TaskSearch.LanguageID5 = 1 OR V_TaskSearch.LanguageID5 IS NULL)
        //          AND (V_TaskSearch.LanguageID6 = 1 OR V_TaskSearch.LanguageID6 IS NULL)
        //    ";

        //    var parameters = new DynamicParameters();

        //    // Default date filter (last 60 days)
        //    if (string.IsNullOrEmpty(request.dateFrom) && string.IsNullOrEmpty(request.dateTo))
        //    {
        //        sql += " AND V_TaskSearch.tsk_CreateTime >= DATEADD(DAY, -60, GETDATE())";
        //    }
        //    else
        //    {
        //        if (!string.IsNullOrEmpty(request.dateFrom))
        //        {
        //            sql += " AND V_TaskSearch.tsk_CreateTime >= @dateFrom";
        //            parameters.Add("dateFrom", DateTime.Parse(request.dateFrom + " 00:00:00"));
        //        }
        //        if (!string.IsNullOrEmpty(request.dateTo))
        //        {
        //            sql += " AND V_TaskSearch.tsk_CreateTime <= @dateTo";
        //            parameters.Add("dateTo", DateTime.Parse(request.dateTo + " 23:59:59"));
        //        }
        //    }

        //    // Apply filters
        //    if (lazyState.filters != null && lazyState.filters.Count > 0)
        //    {
        //        int idx = 0;
        //        foreach (var kv in lazyState.filters)
        //        {
        //            var key = kv.Key;
        //            var f = kv.Value;
        //            if (f?.value == null) continue;
        //            if (!filterColumns.TryGetValue(key, out var sqlCol)) continue;

        //            var pname = $"p{idx++}";
        //            object filterVal = f.value;

        //            // unwrap JsonElement safely
        //            if (filterVal is JsonElement jsonEl)
        //            {
        //                if (jsonEl.ValueKind == JsonValueKind.Array)
        //                {
        //                    var list = jsonEl.EnumerateArray()
        //                                     .Select(e => e.ToString())
        //                                     .Where(s => !string.IsNullOrWhiteSpace(s))
        //                                     .ToList();
        //                    if (!list.Any()) continue; // skip empty []
        //                    var inParams = new List<string>();
        //                    int j = 0;
        //                    foreach (var val in list)
        //                    {
        //                        var inName = $"{pname}_{j++}";
        //                        inParams.Add($"@{inName}");
        //                        parameters.Add(inName, val);
        //                    }
        //                    sql += $" AND {sqlCol} IN ({string.Join(",", inParams)})";
        //                    continue;
        //                }
        //                else if (jsonEl.ValueKind == JsonValueKind.String)
        //                {
        //                    var strVal = jsonEl.GetString();
        //                    if (string.IsNullOrWhiteSpace(strVal)) continue;
        //                    filterVal = strVal;
        //                }
        //                else if (jsonEl.ValueKind == JsonValueKind.Number)
        //                {
        //                    if (jsonEl.TryGetInt32(out var intVal)) filterVal = intVal;
        //                    else if (jsonEl.TryGetDouble(out var dblVal)) filterVal = dblVal;
        //                    else continue; // skip invalid
        //                }
        //                else if (jsonEl.ValueKind == JsonValueKind.True || jsonEl.ValueKind == JsonValueKind.False)
        //                {
        //                    filterVal = jsonEl.GetBoolean();
        //                }
        //                else
        //                {
        //                    continue; // skip unsupported []
        //                }
        //            }

        //            // Build SQL based on type
        //            if (f.matchMode == "contains" && filterVal is string)
        //            {
        //                sql += $" AND {sqlCol} LIKE @{pname}";
        //                parameters.Add(pname, $"%{filterVal}%");
        //            }
        //            else
        //            {
        //                sql += $" AND {sqlCol} = @{pname}";
        //                parameters.Add(pname, filterVal);
        //            }
        //        }
        //    }

        //    // Sorting
        //    if (sortField != "tsk_ID")
        //        sql += $" ORDER BY {sortField} {sortOrder}, tsk_ID ASC";
        //    else
        //        sql += $" ORDER BY tsk_ID {sortOrder}";

        //    var resultData = await _dataAccess.GetDataInline<TaskDashboardModel, dynamic>(sql, parameters);

        //    var dashboardData = new DashboardData
        //    {
        //        data = resultData.ToList(),
        //        path = "http://192.168.254.8:81/mantis-middleware/public/api/v2/get-task-dashboard",
        //        per_page = rows,
        //        next_cursor = null,
        //        next_page_url = null,
        //        prev_cursor = null,
        //        prev_page_url = null
        //    };

        //    return new TaskDashboardResponse
        //    {
        //        data = dashboardData
        //    };
        //}



        public async Task<IEnumerable<PalletInfo>> GetPalletInfo(PalletInfoRequest request)
        {
            var query = @"
                SELECT
                    '1' AS SortOrder,
                    loc_Code AS Loc_code,
                    stc_SSCC AS Sscc,
                    CONCAT(
                        CAST(stc_length AS INT), '-L, ',
                        CAST(stc_Height AS INT), '-H, ',
                        CAST(stc_Width AS INT), '-W, ',
                        CAST(stc_GrossWeight AS INT), '-LB'
                    ) AS Dimensions
                FROM LV_StockContainer WITH (NOLOCK)
                INNER JOIN LV_Stock WITH (NOLOCK) 
                    ON stc_ID = stk_ContainerID AND stc_SSCC IS NOT NULL
                INNER JOIN LV_OrderShipItemStock WITH (NOLOCK) 
                    ON stk_ID = oss_StockID
                OUTER APPLY (
                    SELECT TOP 1 osi_OrderItemID 
                    FROM LV_OrderShipItem WITH (NOLOCK)
                    WHERE oss_OrderShipItemID = osi_ID OR oss_GroupItemID = osi_GroupItemID
                ) AS osi
                OUTER APPLY (
                    SELECT TOP 1 ori_OrderID 
                    FROM LV_OrderItem WITH (NOLOCK)
                    WHERE osi.osi_OrderItemID = ori_ID
                ) AS ori
                INNER JOIN LV_Order WITH (NOLOCK) 
                    ON ori.ori_OrderID = ord_ID
                INNER JOIN LV_Location 
                    ON loc_ID = stk_LocationID
                WHERE ord_code = @OrderCode
                GROUP BY 
                    loc_Code,
                    stc_SSCC, 
                    stc_length,
                    stc_Height,
                    stc_Width,
                    stc_GrossWeight"
            ;

            return await _dataAccess.GetDataInline<PalletInfo,dynamic>(query, new { OrderCode = request.Order_Code });
        }
    }
}
