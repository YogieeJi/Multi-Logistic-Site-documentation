using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Diagnostics.CodeAnalysis;
using System.Formats.Asn1;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.Extensions.Options;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;
using Swashbuckle.Swagger;
using static Dapper.SqlMapper;
using static Hangfire.Storage.JobStorageFeatures;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;

namespace Middleware.Data.Repository
{
    public class AsnRepository : IAsnRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly HttpClient _httpClient;
        private readonly UrlConstants _urlConstants;
        public AsnRepository(ISqlDataAccess dataAccess, HttpClient httpClient, UrlConstants urlConstants)
        {
            _dataAccess = dataAccess;
            _httpClient = httpClient;
            _urlConstants = urlConstants;
        }

        //public async Task<ShipmentGridResponse> GetShipmentsGrid(ShipmentsRequest request)
        //{
        //    var sql = "SELECT * FROM cus_Asns WHERE 1 = 1";
        //    var countSql = "SELECT COUNT(id) FROM cus_Asns WHERE 1 = 1";

        //    var parameters = new DynamicParameters();

        //    // Handle Filters
        //    if (request.filters != null && request.filters.Count > 0)
        //    {
        //        foreach (var filter in request.filters)
        //        {
        //            if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
        //            {
        //                if (!string.IsNullOrWhiteSpace(filter.Key) && !string.IsNullOrWhiteSpace(filter.Value?.value))
        //                {
        //                    string paramName = $"@{filter.Key}";

        //                    // Handle specific datetime fields
        //                    if (filter.Key.Equals("create_dat_tim", StringComparison.OrdinalIgnoreCase) ||
        //                        filter.Key.Equals("expected_at", StringComparison.OrdinalIgnoreCase))
        //                    {
        //                        string condition = $" AND {filter.Key} = {paramName}";
        //                        sql += condition;
        //                        countSql += condition;

        //                        // Replace 'T' with space if datetime is in ISO format (e.g., 2025-06-06T00:00:00)
        //                        string formattedValue = filter.Value.value.Replace("T", " ");
        //                        parameters.Add(paramName, formattedValue);
        //                    }
        //                    else
        //                    {
        //                        // Default LIKE condition for string-based fields
        //                        string condition = $" AND {filter.Key} LIKE {paramName}";
        //                        sql += condition;
        //                        countSql += condition;

        //                        parameters.Add(paramName, $"%{filter.Value?.value}%");
        //                    }
        //                }
        //            }
        //        }
        //    }

        //    // Sorting
        //    if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
        //    {
        //        string sortOrder = "DESC";
        //        if (request.sortOrder == "1") sortOrder = "ASC";
        //        else if (request.sortOrder == "-1") sortOrder = "DESC";

        //        sql += $" ORDER BY {request.sortField} {sortOrder}";
        //    }
        //    else
        //    {
        //        sql += " ORDER BY Id DESC";
        //    }

        //    // Pagination
        //    sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
        //    parameters.Add("Skip", request.first);
        //    parameters.Add("Rows", request.rows);

        //    // Fetch data

        //    var data = await _dataAccess.GetDataInline<Shipments, dynamic>(sql, parameters);

        //    // Total count
        //    var totalCount = (await _dataAccess.GetDataInline<int, dynamic>(countSql, parameters)).FirstOrDefault();
        //    int totalRecords = totalCount;

        //    // Pagination info
        //    bool isFirstPage = string.IsNullOrEmpty(request.cursor);
        //    bool hasNextPage = (request.first + request.rows) < totalRecords;
        //    bool hasPrevPage = !isFirstPage && request.first > 0;

        //    string? nextCursor = hasNextPage ? GenerateNextCursor(data, totalRecords, request.first, request.rows) : null;
        //    string? prevCursor = hasPrevPage ? GeneratePrevCursor(data, request.first, request.rows) : null;

        //    string pathUrl = _urlConstants.AsnPathUrl;
        //    string shipmentsUrl = _urlConstants.AsnShipmentsUrl;

        //    return new ShipmentGridResponse
        //    {
        //        Data = data.ToList(),
        //        next_cursor = nextCursor,
        //        prev_cursor = prevCursor,
        //        path = pathUrl,
        //        next_page_url = nextCursor != null ? $"{shipmentsUrl}{nextCursor}" : null,
        //        prev_page_url = prevCursor != null ? $"{shipmentsUrl}{prevCursor}" : null,
        //        per_page = request.rows,
        //        TotalCount = totalRecords
        //    };
        //}
        public async Task<ShipmentGridResponse> GetShipmentsGrid(ShipmentsRequest request)
        {
            var sql = "SELECT * FROM cus_Asns WHERE 1 = 1";
            var countSql = "SELECT COUNT(id) FROM cus_Asns WHERE 1 = 1";
            var parameters = new DynamicParameters();

            //  CHANGE (WHY): whitelist to prevent SQL injection from filter.Key/sortField
            var allowedColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "id", "ship_uid", "ship_num", "ship_dat", "create_dat_tim", "expected_at",
        "fcy", "bpsnum", "tctnum", "dspweu", "dspvou", "created_at", "updated_at",
        "is_sync", "synced_at", "is_transfer", "status", "invalid_items",
        "mantis_imported_h", "ctnum", "import_ready", "is_conveyable"
    };

            //  CHANGE (WHY): parse FE date like "t2026-01-14 22:10:41:000"
            static bool TryParseFrontendDate(string input, out DateTime dt)
            {
                dt = default;
                if (string.IsNullOrWhiteSpace(input)) return false;

                var s = input.Trim();

                // remove leading 't' if present
                if (s.Length > 0 && (s[0] == 't' || s[0] == 'T'))
                    s = s.Substring(1);

                // ISO T -> space
                s = s.Replace("T", " ");

                // fix milliseconds ":000" -> ".000"
                if (s.Length >= 4 && s[^4] == ':')
                    s = s[..^4] + "." + s[^3..];

                string[] formats =
                {
            "yyyy-MM-dd HH:mm:ss.fff",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd"
        };

                return DateTime.TryParseExact(
                    s,
                    formats,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out dt
                );
            }

            // ---------------- FILTERS ----------------
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) || string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;

                    var column = filter.Key.Trim();
                    var value = filter.Value!.value!.Trim();

                    if (!allowedColumns.Contains(column))
                        continue;

                    var paramBase = column;

                    //  DATE COLUMNS
                    if (column.Equals("create_dat_tim", StringComparison.OrdinalIgnoreCase) ||
                        column.Equals("expected_at", StringComparison.OrdinalIgnoreCase))
                    {
                        //  CHANGE (WHY): If FE gives full date -> filter by date
                        //  CHANGE (WHY): If FE gives junk like "20" -> DON'T throw, fallback to text search
                        if (TryParseFrontendDate(value, out var dt))
                        {
                            // range by 1 second (handles .000 ms)
                            var from = new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, dt.Minute, dt.Second);
                            var to = from.AddSeconds(1);

                            string condition = $" AND {column} >= @{paramBase}_from AND {column} < @{paramBase}_to";
                            sql += condition;
                            countSql += condition;

                            parameters.Add($"{paramBase}_from", from, DbType.DateTime2);
                            parameters.Add($"{paramBase}_to", to, DbType.DateTime2);
                        }
                        else
                        {
                            //  CHANGE (WHY): fallback when user types partial value like "20"
                            // Convert datetime to varchar and apply LIKE.
                            // NOTE: style 121 => "yyyy-mm-dd hh:mi:ss.mmm"
                            string condition = $" AND CONVERT(varchar(23), {column}, 121) LIKE @{paramBase}_txt";
                            sql += condition;
                            countSql += condition;

                            parameters.Add($"{paramBase}_txt", $"%{value}%", DbType.String);
                        }
                    }
                    else
                    {
                        //  Normal string columns
                        string condition = $" AND {column} LIKE @{paramBase}";
                        sql += condition;
                        countSql += condition;

                        parameters.Add(paramBase, $"%{value}%", DbType.String);
                    }
                }
            }

            // ---------------- SORTING ----------------
            if (!string.IsNullOrWhiteSpace(request.sortField) &&
                allowedColumns.Contains(request.sortField) &&
                request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                sql += $" ORDER BY {request.sortField} {sortOrder}";
            }
            else
            {
                sql += " ORDER BY Id DESC";
            }

            // ---------------- PAGINATION ----------------
            sql += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("Skip", request.first, DbType.Int32);
            parameters.Add("Rows", request.rows, DbType.Int32);

            // ---------------- EXECUTE ----------------
            var data = await _dataAccess.GetDataInline<Shipments, DynamicParameters>(sql, parameters);

            var totalCount = (await _dataAccess.GetDataInline<int, DynamicParameters>(countSql, parameters)).FirstOrDefault();
            int totalRecords = totalCount;

            bool isFirstPage = string.IsNullOrEmpty(request.cursor);
            bool hasNextPage = (request.first + request.rows) < totalRecords;
            bool hasPrevPage = !isFirstPage && request.first > 0;

            string? nextCursor = hasNextPage ? GenerateNextCursor(data, totalRecords, request.first, request.rows) : null;
            string? prevCursor = hasPrevPage ? GeneratePrevCursor(data, request.first, request.rows) : null;

            string pathUrl = _urlConstants.AsnPathUrl;
            string shipmentsUrl = _urlConstants.AsnShipmentsUrl;

            return new ShipmentGridResponse
            {
                Data = data.ToList(),
                next_cursor = nextCursor,
                prev_cursor = prevCursor,
                path = pathUrl,
                next_page_url = nextCursor != null ? $"{shipmentsUrl}{nextCursor}" : null,
                prev_page_url = prevCursor != null ? $"{shipmentsUrl}{prevCursor}" : null,
                per_page = request.rows,
                TotalCount = totalRecords
            };
        }

        // Generate NextCursor
        private string? GenerateNextCursor(IEnumerable<Shipments> data, int totalRecords, int requestFirst, int requestRows)
        {
            if (!data.Any() || (requestFirst + requestRows) >= totalRecords)
                return null; // Don't generate cursor if it's the last page

            return Convert.ToBase64String(Encoding.UTF8.GetBytes($"id={data.Last().id}"));
        }

        // Generate PreviousCursor
        private string? GeneratePrevCursor(IEnumerable<Shipments> data, int requestFirst, int requestRows)
        {
            if (!data.Any() || requestFirst - requestRows < 0)
                return null; // No previous page available

            return Convert.ToBase64String(Encoding.UTF8.GetBytes($"id={data.First().id}"));
        }

        public async Task<IEnumerable<Shipments>> GetShipmentDetail(int id)
        {
            var query = "SELECT * FROM cus_Asns WHERE Id = @Id";
            var parameters = new DynamicParameters();
            parameters.Add("@id", id);
            var data = await _dataAccess.GetDataInline<Shipments, dynamic>(query.ToString(), parameters);
            return data;
        }

        public async Task<IEnumerable<AsnLineRequest>> GetInvalidAsnLines(int asnId)
        {
            var query = "SELECT * FROM AsnLine WHERE AsnId = @AsnId AND InvalidItems = 1";
            return await _dataAccess.GetDataInline<AsnLineRequest, dynamic>(query, new { AsnId = asnId });
        }

        public async Task<IEnumerable<AsnLineRequest>> GetAsnLineById(int id)
        {
            var query = "SELECT * FROM AsnLine WHERE Id = @Id";
            return await _dataAccess.GetDataInline<AsnLineRequest, dynamic>(query, new { Id = id });
        }

        public async Task<IEnumerable<AsnLineRequest>> UpdateAsnLine(AsnLineRequest asnLine)
        {
            var query = "UPDATE AsnLine SET Itmref = @Itmref, Uom = @Uom, Shiqty = @Shiqty, InvalidItems = @InvalidItems, IsPresentInMantis = @IsPresentInMantis WHERE Id = @Id";
            await _dataAccess.GetDataInline<AsnLineRequest, dynamic>(query, asnLine);

            // Assuming you need to return the updated line:
            var updatedLineQuery = "SELECT * FROM AsnLine WHERE Id = @Id";
            var updatedLine = await _dataAccess.GetDataInline<AsnLineRequest, dynamic>(updatedLineQuery, new { Id = asnLine.AsnId });

            return updatedLine;
        }

        public async Task UpdateAsnStatus(int id, int status)
        {
            var query = "UPDATE Asn SET InvalidItems = @Status WHERE Id = @Id";
            await _dataAccess.GetDataInline<int, dynamic>(query, new { Id = id, Status = status });
        }

        public async Task<ShipmentLineResponse> GetShipmentLines(ShipmentLinesRequest request, int id)
        {
            var query = "SELECT * FROM cus_Asnlines WHERE asn_id = @asn_id";
            var countQuery = "SELECT COUNT(*) FROM cus_Asnlines WHERE asn_id = @asn_id";

            var parameters = new DynamicParameters();
            parameters.Add("@asn_id", id);

            // Handle Filters
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        if (!string.IsNullOrWhiteSpace(filter.Key) && !string.IsNullOrWhiteSpace(filter.Value?.value))
                        {
                            string paramName = $"@{filter.Key}";

                            // Handle DATETIME fields like created_at differently
                            if (filter.Key.Equals("created_at", StringComparison.OrdinalIgnoreCase))
                            {
                                // Use exact match for created_at (or adjust for range if needed)
                                string condition = $" AND {filter.Key} = {paramName}";
                                query += condition;
                                countQuery += condition; // Apply filter to count query as well

                                // Convert the input format (replace 'T' with space for SQL compatibility)
                                string formattedValue = filter.Value.value.Replace("T", " ");
                                parameters.Add(paramName, formattedValue);
                            }
                            else
                            {
                                // Apply LIKE for string fields (e.g., module_id)
                                string condition = $" AND {filter.Key} LIKE {paramName}";
                                query += condition;
                                countQuery += condition; // Apply filter to count query as well

                                parameters.Add(paramName, $"%{filter.Value?.value}%");
                            }
                        }
                    }
                }
            }

            // Handle sorting based on sortOrder and sortField
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = "DESC";

                // Handle sortOrder values
                if (request.sortOrder == "0")
                {
                    query += $" ORDER BY {request.sortField}";
                }
                else
                {
                    // If sortOrder is "1", it's ascending; otherwise, descending
                    if (request.sortOrder == "1")
                    {
                        sortOrder = "ASC";  // Ascending order
                    }
                    else if (request.sortOrder == "-1")
                    {
                        sortOrder = "DESC"; // Descending order
                    }

                    // Apply sorting to the SQL query
                    query += $" ORDER BY {request.sortField} {sortOrder}";

                }
            }
            else
            {
                // Default sorting if no sortField or sortOrder is provided (by Id DESC)
                query += " ORDER BY Id ASC";
            }

            // Pagination
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            // Fetch Data
            var result = await _dataAccess.GetDataInline<AsnLineResponse, dynamic>(query.ToString(), parameters);

            // Fetch Total Count
            var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery.ToString(), parameters);

            return new ShipmentLineResponse
            {
                Data = result,
                TotalCount = totalCount.FirstOrDefault(),
            };
        }

        public async Task<bool> UpdateImportReady(UpdateShipmentRequest request)
        {
            string query = "UPDATE cus_Asns SET import_ready = 1 WHERE id = @id";

            if (request?.shipments == null || request.shipments.Count == 0)
            {
                return false; // No shipments provided
            }
            int rowsAffected = 0;
            foreach (var shipment in request.shipments)
            { 
                rowsAffected += await _dataAccess.SaveDataInline(query, new { Id = shipment.id });
            }

                return rowsAffected > 0;
            
        }

        public async Task<IEnumerable<Asn>> GetLatestAsn()
        {
            var query = "SELECT TOP 1 * FROM cus_Asns ORDER BY create_dat_tim DESC";
            return await _dataAccess.GetFirstDataInline<Asn,dynamic>(query, new { });
        }

        //public async Task LogActivity(ActivityLog activityLog)
        //{
        //    var sql = @"INSERT INTO Cus_ActivityLog 
        //            (log_name, module_id, sub_module_id, event, properties, description, causer_type, created_at, subject_id)
        //            VALUES 
        //            (@log_name, @module_id, @sub_module_id, @event, @properties, @description, @causer_type, GETUTCDATE(),@subject_id)";

        //    await _dataAccess.SaveDataInline(sql, activityLog);
        //}

        public async Task LogActivityAsync(string eventType, string reference)
        {
            string sql = @"
            INSERT INTO Cus_ActivityLog (log_name, module_id, sub_module_id, event, properties, description, causer_type, created_at)
            VALUES (@log_name, @module_id, @sub_module_id, @event, @properties, @description, @causer_type, GETUTCDATE());";

            await _dataAccess.SaveDataInline(sql, new
            {
                log_name = "inbound",
                @event = eventType,
                subject_ref = reference,
                module_id = 1,
                sub_module_id = 1 
            });
        }

        public async Task<ShipmentContainer> GetShipmentContainerAsync(string containerNumber)
        {
            var sql = "SELECT * FROM shipment_countainers WHERE container_number = @containerNumber";
            return (await _dataAccess.GetFirstDataInline<ShipmentContainer,dynamic>(sql, new { containerNumber })).FirstOrDefault();
        }

        public async Task<bool> IsLvReceiptExistAsync(string receiptCode)
        {
            var sql = "SELECT COUNT(1) FROM LV_Receipt WHERE rct_Code = @receiptCode";
            return await _dataAccess.SaveDataReturnInline<bool>(sql, new { receiptCode });
        }

        public async Task UpdateContainerCountAsync(string containerNumber, int count)
        {
            var sql = "UPDATE shipment_countainers SET count = @count WHERE container_number = @containerNumber";
            await _dataAccess.SaveDataInline(sql, new { count, containerNumber });
        }

        public async Task UpsertShipmentContainerAsync(string containerNumber)
        {
            var sql = @"
            MERGE INTO shipment_countainers AS Target
            USING (SELECT @containerNumber AS container_number) AS Source
            ON Target.container_number = Source.container_number
            WHEN MATCHED THEN UPDATE SET container_number = Source.container_number
            WHEN NOT MATCHED THEN INSERT (container_number) VALUES (Source.container_number);";
            await _dataAccess.SaveDataInline(sql, new { containerNumber });
        }

        public async Task UpdateAsnAsync(OrderDataSync asn)
        {
            string sql = @"
            UPDATE cus_Asns 
            SET expected_at = @ExpectedAt, 
                ctrnum = @Ctrnum,
                invalid_items = @InvalidItems,
                is_conveyable = @IsConveyable
            WHERE id = @Id";

            await _dataAccess.SaveDataInline(sql, asn);
        }

        public async Task UpsertAsnLinesAsync(List<AsnLineRequest> lines)
        {

            foreach (var line in lines)
            {
                string sql = @"
                MERGE cus_Asnlines AS target
                USING (SELECT @AsnId AS asn_id, @PohNum AS pohnum, @PopLin AS poplin) AS source
                ON target.asn_id = source.asn_id AND target.pohnum = source.pohnum AND target.poplin = source.poplin
                WHEN MATCHED THEN
                    UPDATE SET
                        ship_uid = @ShipUid,
                        poqseq = @PoqSeq,
                        pohnum = @PohNum,
                        ctrnum = @Ctrnum,
                        ctrlin = @CtrlLin,
                        shiqty = @Shiqty,
                        input_qty = @InputQty,
                        extrcpdat = @ExtrcpDat,
                        qtyweu = @QtyWeu,
                        qtyvou = @QtyVou,
                        shiplin = @Shiplin,
                        pohfcy = @Pohfcy,
                        itmref = @Itmref,
                        uom = @Uom,
                        input_itmref = @InputItmref,
                        input_uom = @InputUom,
                        invalid_items = @InvalidItems,
                        is_conveyable = @IsConveyable,
                        is_present_in_mantis = @IsPresentInMantis,
                        mantis_imported = @Mantis_Imported,
                        updated_at = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (
                        asn_id, ship_uid, pohnum, poqseq, ctrnum, ctrlin, shiqty, input_qty, extrcpdat, 
                        qtyweu, qtyvou, poplin, shiplin, pohfcy, itmref, uom, input_itmref, input_uom,
                        invalid_items, is_conveyable, is_present_in_mantis,mantis_imported,created_at
                    )
                    VALUES (
                        @AsnId, @ShipUid, @PohNum, @PoqSeq, @Ctrnum, @CtrlLin, @Shiqty, @InputQty, @ExtrcpDat, 
                        @QtyWeu, @QtyVou, @PopLin, @Shiplin, @Pohfcy, @Itmref, @Uom, @InputItmref, @InputUom,
                        @InvalidItems, @IsConveyable, @IsPresentInMantis, @Mantis_Imported,GETDATE()
                    );";
                await _dataAccess.SaveDataInline(sql, line);
            }
        }

        public async Task<OrderDataSync> CreateOrGetAsnAsync(string shipNum, OrderDataSync asnHeader)
        {
            string selectSql = "SELECT * FROM cus_Asns WHERE ship_num = @shipNum";
            var existing = await _dataAccess.GetDataInline<OrderDataSync, dynamic>(selectSql, new { shipNum });

            if (existing != null && existing.Count() > 0)
            {
                asnHeader.IsNewlyCreated = 0;
                return existing.FirstOrDefault();
            }

            asnHeader.IsNewlyCreated = 1;
            string insertSql = @"
            INSERT INTO cus_Asns (ship_uid, ship_num, ship_dat, create_dat_tim, fcy, bpsnum, tctrnum, dspweu, dspvou, is_transfer, Status, is_conveyable, import_ready,invalid_items,mantis_imported_h,is_sync,created_at)
            OUTPUT INSERTED.*
            VALUES (@ship_uid, @shipNum, @ship_dat, @create_dat_tim, @fcy, @bpsnum, @tctrnum, @dspweu, @dspvou, @is_transfer, @Status, @IsConveyable, @import_ready,@InvalidItems,@mantis_imported_h,@is_sync,GETDATE())";

            return await _dataAccess.CreateOrGetDataInline<OrderDataSync>(insertSql, asnHeader);
        }

        public async Task<IEnumerable<ItemConversion>> GetItemConversionAsync(string itmref)
        {
            string sql = "SELECT sku_x3, sku_mantis, uom_mantis FROM Cus_SageX3ToMantisConverion WHERE sku_x3 = @Itmref";
            return await _dataAccess.GetFirstDataInline<ItemConversion, dynamic>(sql, new { itmref });
        }

        public async Task<IEnumerable<ImportedOrder>> GetShipmentorderByIdAsync(int id)
        {
            string sql = "SELECT * FROM cus_asns WHERE id = @Id";
            return await _dataAccess.GetFirstDataInline<ImportedOrder, dynamic>(sql, new { id = id });
        }
        public async Task<IEnumerable<AsnLineRequestrevalidate>> GetshipmentDetailsByasnId(int asnid)
        {
            string sql = "SELECT * FROM cus_asnlines WHERE asn_id = @asnid and invalid_items = 1";
            var result = await _dataAccess.GetDataInline<AsnLineRequestrevalidate, dynamic>(sql, new { asnid = asnid });
            return result.ToList();
        }

        public async Task UpdateOrderDetail(AsnLineRequestrevalidate detail)
        {
            string sql = @"UPDATE cus_asnlines 
                       SET itmref = @input_itmref, 
                           uom = @uom, 
                           invalid_items = 0, 
                           is_present_in_mantis = @mantis_imported 
                       WHERE id = @id";

            await _dataAccess.SaveDataInline(sql, detail);
        }

        public async Task UpdateInvalidItemsFlag(int orderId, bool hasInvalidItems)
        {
            string sql = @"UPDATE cus_asns 
                       SET invalid_items = 0 
                       WHERE id = @id";

            await _dataAccess.SaveDataInline(sql, new
            {
                id = orderId,
                invalid_items = hasInvalidItems ? 1 : 0
            });
        }
        public async Task<int?> GetItemIdByCode(string code)
        {
            var query = "SELECT TOP 1 prd_ID FROM LV_Product WHERE prd_PrimaryCode = @Code";
            var result= await _dataAccess.GetFirstDataInline<int?,dynamic>(query, new { Code = code });
            return result.FirstOrDefault();
        }
        public async Task<int?> getsubjectidshipment(string code)
        {
            var query = "SELECT TOP 1 id FROM cus_asns WHERE ship_num = @Code order by id desc";
            var result = await _dataAccess.GetFirstDataInline<int?, dynamic>(query, new { Code = code });
            return result.FirstOrDefault();
        }

        public async Task<Dictionary<int, string>> GetItemAttributesById(int itemId)
        {
            var query = @"
            SELECT pav_attributeID AS AttributeId, pav_Value AS Value 
            FROM LV_ProductAttributesValues 
            WHERE pav_ProductID = @ItemId AND pav_attributeID IN (7,8,9)";

            var result = await _dataAccess.GetDataInline<ItemAttributeDto,dynamic>(query, new { ItemId = itemId });

            return result.ToDictionary(x => x.AttributeId, x => x.Value);
        }
        public async Task<int?> GetProductIdByPrimaryCode(string primaryCode)
        {
            var query = @"SELECT prd_ID FROM LV_Product WHERE prd_PrimaryCode = @Code";
            var result=await _dataAccess.GetFirstDataInline<int?,dynamic>(query, new { Code = primaryCode });
            return result.FirstOrDefault();
        }
        public async Task<int?> GetExistingPavId(int productId, int attributeId)
        {
            var query = @"SELECT pav_ID FROM LV_ProductAttributesValues 
                      WHERE pav_ProductID = @ProductId AND pav_attributeID = @AttributeId";
            var result = await _dataAccess.GetFirstDataInline<int?,dynamic>(query, new { ProductId = productId, AttributeId = attributeId });
            return result.FirstOrDefault();
        }

        public async Task<int> GetLatestPavId()
        {
            var query = @"SELECT ISNULL(MAX(pav_ID), 0) FROM LV_ProductAttributesValues";
            var result= await _dataAccess.GetFirstDataInline<int, dynamic>(query, new {});
            return result.FirstOrDefault();

        }

        public async Task UpdateAttribute(int pavId, string? value)
        {
            var query = @"UPDATE LV_ProductAttributesValues SET pav_value = @Value WHERE pav_ID = @PavId";
            await _dataAccess.SaveDataInline(query, new { Value = value, PavId = pavId });
        }

        public async Task InsertAttribute(int pavId, int productId, int attributeId, string? value)
        {
            var query = @"
            DECLARE @NewPavId Int;             
            SELECT @NewPavId= ISNULL(MAX(pav_ID), 0)+1 FROM LV_ProductAttributesValues;

            INSERT INTO LV_ProductAttributesValues 
            (pav_ID, pav_ProductID, pav_attributeID, pav_value, pav_DomainID, pav_LogisticSiteID) 
            VALUES (@NewPavId, @ProductId, @AttributeId, @Value, 1, 5);";
            await _dataAccess.SaveDataInline(query, new
            {
                ProductId = productId,
                AttributeId = attributeId,
                Value = value
            });
        }
        public async Task<IEnumerable<AsnLineResponse>> GetNonConveyableItems(int asnId)
        {
            try
            {
                var sql = "SELECT * FROM Cus_AsnLines WHERE asn_id = @asnId AND is_conveyable = 0";
                var result=  await _dataAccess.GetDataInline<AsnLineResponse, dynamic>(sql, new {  asnId });
                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task UpdateAsnLineIsConveyable(int id)
        {
            try
            {
                var sql = "UPDATE Cus_AsnLines SET is_conveyable = 1 WHERE Id = @Id";
               var result= await _dataAccess.SaveDataInline(sql, new { Id = id });
            }
            catch (Exception ex)
            {
                throw;
            }
        }


        public async Task UpdateAsnIsConveyable(int asnId)
        {
            try
            {
                var sql = "UPDATE Cus_Asns SET is_conveyable = 1 WHERE Id = @AsnId";
                var result = await _dataAccess.SaveDataInline(sql, new { AsnId = asnId });
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<IEnumerable<AsnLineV1>> GetShipmentLinesByAsnId(int asnId)
        {
            string sql = @"SELECT asn_id, pohnum, poplin, itmref, uom,pohfcy,extrcpdat,shiqty,input_qty,qtyweu,input_itmref,input_uom,shiplin,invalid_items,is_conveyable,
                          is_present_in_mantis FROM Cus_AsnLines WHERE asn_id = @AsnId ORDER BY Id DESC";
             var result = await _dataAccess.GetDataInline<AsnLineV1, dynamic>(sql, new { AsnId = asnId });
            return result;
        }

        public async Task<Shipments> CheckAsnExists(string shipNum)
        {
            var sql = "SELECT * FROM Cus_Asns WHERE ship_num = @ShipNum";
            var result = (await _dataAccess.GetDataInline<Shipments, dynamic>(sql, new { ShipNum = shipNum })).FirstOrDefault();
            return result;
        }

        public async Task<int> UpdateInvalidItems(int asnId, bool invalidItems)
        {
            var query = @"UPDATE Cus_Asns SET invalid_items = @InvalidItems WHERE id = @Id";
            var result = await _dataAccess.SaveDataInline(query, new { Id = asnId, InvalidItems = invalidItems });
            return result;

        }

        //public Task<int> UpdateInvalidItems(int asnId, bool invalidItems)
        //{
        //    throw new NotImplementedException();
        //}

        public async Task<int> UpdateAsnConveyable(int asnId, bool is_conveyable)
        {
            string updateQuery = @"UPDATE Cus_Asns SET is_conveyable = @IsConveyable WHERE id = @Id";
            var result = await _dataAccess.SaveDataInline(updateQuery, new { IsConveyable= is_conveyable , Id = asnId });
            return result;

        }

        public async Task<int> UpsertAsn(CreateShipmentDetailResponse item)
        {
            var upsertSql = @"
        MERGE INTO Cus_AsnLines AS Target
        USING (VALUES 
            (@asn_id, @ship_uid, @pohnum, @poqseq, @ctrnum, @ctrlin, @shiqty, @input_qty,
             @extrcpdat, @qtyweu, @qtyvou, @poplin, @shiplin, @pohfcy, @itmref, @uom,
             @input_itmref, @input_uom, @invalid_items, @is_conveyable, @is_present_in_mantis)
        ) AS Source (
            asn_id, ship_uid, pohnum, poqseq, ctrnum, ctrlin, shiqty, input_qty,
            extrcpdat, qtyweu, qtyvou, poplin, shiplin, pohfcy, itmref, uom,
            input_itmref, input_uom, invalid_items, is_conveyable, is_present_in_mantis
        )
        ON Target.asn_id = Source.asn_id
           AND Target.pohnum = Source.pohnum
           AND Target.poplin = Source.poplin
        WHEN MATCHED THEN
            UPDATE SET 
                Target.ship_uid = Source.ship_uid,
                Target.poqseq = Source.poqseq,
                Target.ctrnum = Source.ctrnum,
                Target.ctrlin = Source.ctrlin,
                Target.shiqty = Source.shiqty,
                Target.input_qty = Source.input_qty,
                Target.extrcpdat = Source.extrcpdat,
                Target.qtyweu = Source.qtyweu,
                Target.qtyvou = Source.qtyvou,
                Target.shiplin = Source.shiplin,
                Target.pohfcy = Source.pohfcy,
                Target.itmref = Source.itmref,
                Target.uom = Source.uom,
                Target.input_itmref = Source.input_itmref,
                Target.input_uom = Source.input_uom,
                Target.invalid_items = Source.invalid_items,
                Target.is_conveyable = Source.is_conveyable,
                Target.is_present_in_mantis = Source.is_present_in_mantis
        WHEN NOT MATCHED THEN
            INSERT (
                asn_id, ship_uid, pohnum, poqseq, ctrnum, ctrlin, shiqty, input_qty,
                extrcpdat, qtyweu, qtyvou, poplin, shiplin, pohfcy, itmref, uom,
                input_itmref, input_uom, invalid_items, is_conveyable, is_present_in_mantis
            )
            VALUES (
                Source.asn_id, Source.ship_uid, Source.pohnum, Source.poqseq, Source.ctrnum, Source.ctrlin, 
                Source.shiqty, Source.input_qty, Source.extrcpdat, Source.qtyweu, Source.qtyvou, Source.poplin, 
                Source.shiplin, Source.pohfcy, Source.itmref, Source.uom, Source.input_itmref, Source.input_uom, 
                Source.invalid_items, Source.is_conveyable, Source.is_present_in_mantis
         );";

            return await _dataAccess.SaveDataInline(upsertSql, item);
        }

        public async Task<int> UpdateAsnHeader(int asnId, DateTime? expectedAt, string ctrnum)
        {
            var sql = @"
        UPDATE Cus_Asns
        SET expected_at = @ExpectedAt,
            ctrnum = @Ctrnum
        WHERE id = @Id";

            return await _dataAccess.SaveDataInline(sql, new
            {
                ExpectedAt = expectedAt,
                Ctrnum = ctrnum,
                Id = asnId
            });
        }
    }
}
