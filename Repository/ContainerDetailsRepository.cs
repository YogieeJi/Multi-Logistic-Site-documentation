using System.Data;
using System.Data.Common;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Dapper;
using iText.Commons.Actions.Contexts;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;
using static System.Net.WebRequestMethods;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;



namespace MiddlewareWebAPI.Data.Repository
{
    public class ContainerDetailsRepository : IContainerDetailsRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        private readonly UrlConstants _urlConstants;
        private readonly IConfiguration _configuration;
        public ContainerDetailsRepository(ISqlDataAccess dataAccess, UrlConstants urlConstants, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _urlConstants = urlConstants;
            _configuration = configuration;
        }

        //public async Task<ContainerResponse> GetManualContainersGrid(ContainerRequest request)
        //{
        //    var query = "SELECT *,FORMAT(created_at, 'yyyy-MM-dd') as formatted_created_at FROM Cus_ManualContainers WHERE 1 = 1";
        //    var countQuery = "SELECT COUNT(id) FROM Cus_ManualContainers WHERE 1 = 1";

        //    var parameters = new DynamicParameters();

        //    // Handle Filters
        //    if (request.filters != null && request.filters.Count > 0)
        //    {
        //        foreach (var filter in request.filters)
        //        {
        //            if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
        //            {
        //                if (filter.Key == "formatted_created_at")
        //                {
        //                    string filterValue = $"%{filter.Value?.value}%";
        //                    string condition = $" AND created_at LIKE @{filter.Key}";

        //                    query += condition;
        //                    countQuery += condition; // Apply filter to count query as well

        //                    parameters.Add(filter.Key, filterValue);
        //                }
        //                else
        //                {
        //                    string filterValue = $"%{filter.Value?.value}%";
        //                    string condition = $" AND {filter.Key} LIKE @{filter.Key}";

        //                    query += condition;
        //                    countQuery += condition; // Apply filter to count query as well

        //                    parameters.Add(filter.Key, filterValue);
        //                }

        //            }
        //        }
        //    }

        //    // Handle sorting based on sortOrder and sortField
        //    if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
        //    {
        //        string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
        //        query += $" ORDER BY {request.sortField} {sortOrder}";
        //    }
        //    else
        //    {
        //        query += " ORDER BY Id DESC";
        //    }

        //    // Pagination
        //    query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
        //    parameters.Add("@Skip", request.first);
        //    parameters.Add("@Rows", request.rows);

        //    // Fetch Data
        //    var result = await _dataAccess.GetDataInline<Containers, dynamic>(query, parameters);

        //    // Fetch Total Count with Filters Applied
        //    var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

        //    string templateUrl = _urlConstants.ContainersTemplateUrl;
        //    string bulkLoadAndComplete = _urlConstants.BulkLoadAndComplete;

        //    return new ContainerResponse
        //    {
        //        Data = result.ToList(),
        //        TotalCount = totalCount.FirstOrDefault(),
        //        TemplateUrl = templateUrl,
        //        BulkTemplateUrl = bulkLoadAndComplete
        //    };
        //}
        //public async Task<ContainerResponse> GetManualContainersGrid(ContainerRequest request)
        //{
        //    var query = @"SELECT 
        //        c.*,
        //        FORMAT(c.created_at, 'yyyy-MM-dd') AS formatted_created_at,
        //        CASE
        //            WHEN EXISTS (
        //                SELECT 1
        //                FROM Cus_ManualContainerDetails d
        //                WHERE d.ctrnum = c.ctrnum
        //            )
        //            AND NOT EXISTS (
        //                SELECT 1
        //                FROM Cus_ManualContainerDetails d
        //                WHERE d.ctrnum = c.ctrnum
        //                  AND NULLIF(LTRIM(RTRIM(d.input_lot)), '') IS NULL
        //            )
        //            THEN 1
        //            ELSE 0
        //        END AS HasLotInfo
        //    FROM Cus_ManualContainers c
        //     Where 1=1";
        //    var countQuery = "SELECT COUNT(id) FROM Cus_ManualContainers WHERE 1 = 1";

        //    var parameters = new DynamicParameters();

        //    // Handle Filters
        //    if (request.filters != null && request.filters.Count > 0)
        //    {
        //        foreach (var filter in request.filters)
        //        {
        //            if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
        //            {
        //                if (filter.Key == "formatted_created_at")
        //                {
        //                    // Compare against formatted date instead of raw datetime
        //                    string filterValue = $"%{filter.Value?.value}%";
        //                    string condition = $" AND FORMAT(created_at, 'yyyy-MM-dd') LIKE @{filter.Key}";

        //                    query += condition;
        //                    countQuery += condition;

        //                    parameters.Add(filter.Key, filterValue);
        //                }
        //                else
        //                {
        //                    string filterValue = $"%{filter.Value?.value}%";
        //                    string condition = $" AND {filter.Key} LIKE @{filter.Key}";

        //                    query += condition;
        //                    countQuery += condition;

        //                    parameters.Add(filter.Key, filterValue);
        //                }
        //            }
        //        }
        //    }

        //    // Handle sorting based on sortOrder and sortField
        //    if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
        //    {
        //        string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
        //        query += $" ORDER BY {request.sortField} {sortOrder}";
        //    }
        //    else
        //    {
        //        query += " ORDER BY Id DESC";
        //    }

        //    // Pagination
        //    query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
        //    parameters.Add("@Skip", request.first);
        //    parameters.Add("@Rows", request.rows);

        //    // Fetch Data
        //    var result = await _dataAccess.GetDataInline<Containers, dynamic>(query, parameters);

        //    // Fetch Total Count with Filters Applied
        //    var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

        //    string templateUrl = _urlConstants.ContainersTemplateUrl;
        //    string bulkLoadAndComplete = _urlConstants.BulkLoadAndComplete;

        //    return new ContainerResponse
        //    {
        //        Data = result.ToList(),
        //        TotalCount = totalCount.FirstOrDefault(),
        //        TemplateUrl = templateUrl,
        //        BulkTemplateUrl = bulkLoadAndComplete
        //    };
        //}
        public async Task<ContainerResponse> GetManualContainersGrid(ContainerRequest request)
        {
            //  CHANGE: Wrap original query in a CTE so computed column (HasLotInfo) can be used in WHERE/ORDER BY safely
            // Without this, filtering/sorting on HasLotInfo causes: "Invalid column name 'hasLotInfo'"
            var baseQuery = @"
        WITH ContainerCTE AS (
            SELECT 
                c.*,
                FORMAT(c.created_at, 'yyyy-MM-dd') AS formatted_created_at,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM Cus_ManualContainerDetails d
                        WHERE d.ctrnum = c.ctrnum
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM Cus_ManualContainerDetails d
                        WHERE d.ctrnum = c.ctrnum
                          AND NULLIF(LTRIM(RTRIM(d.input_lot)), '') IS NULL
                    )
                    THEN 1
                    ELSE 0
                END AS HasLotInfo
            FROM Cus_ManualContainers c
        )
    ";

            //  CHANGE: Now select from CTE so HasLotInfo is a real selectable column for filters/sorts
            var query = baseQuery + @" SELECT * FROM ContainerCTE WHERE 1=1";
            var countQuery = baseQuery + @" SELECT COUNT(id) FROM ContainerCTE WHERE 1=1"; // ✅ CHANGE: count must use same filters from CTE

            var parameters = new DynamicParameters();

            // Handle Filters
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        // ✅ CHANGE: Special handling for HasLotInfo filter (because it is numeric 0/1 and should not use LIKE)
                        // Frontend might send "hasLotInfo" (camelCase) - handle both
                        if (filter.Key.Equals("hasLotInfo", StringComparison.OrdinalIgnoreCase) ||
                            filter.Key.Equals("HasLotInfo", StringComparison.OrdinalIgnoreCase))
                        {
                            // Expecting "0" or "1" from UI filter dropdown
                            if (int.TryParse(filter.Value.value, out int hasLot))
                            {
                                string condition = " AND HasLotInfo = @HasLotInfo"; // ✅ CHANGE: filter on computed column from CTE
                                query += condition;
                                countQuery += condition;

                                parameters.Add("@HasLotInfo", hasLot);
                            }

                            continue; //  CHANGE: skip normal LIKE filter for HasLotInfo
                        }

                        if (filter.Key == "formatted_created_at")
                        {
                            // Compare against formatted date instead of raw datetime
                            string filterValue = $"%{filter.Value?.value}%";

                            //  CHANGE: now formatted_created_at exists in CTE, so just filter directly on it
                            // (Your old FORMAT(created_at...) in WHERE worked too, but this is cleaner & avoids confusion)
                            string condition = $" AND formatted_created_at LIKE @{filter.Key}";

                            query += condition;
                            countQuery += condition;

                            parameters.Add(filter.Key, filterValue);
                        }
                        else
                        {
                            string filterValue = $"%{filter.Value?.value}%";

                            //  NOTE: This is your original behavior (LIKE for every field)
                            // Now it works for table columns + CTE columns (except HasLotInfo which we handled above)
                            string condition = $" AND {filter.Key} LIKE @{filter.Key}";

                            query += condition;
                            countQuery += condition;

                            parameters.Add(filter.Key, filterValue);
                        }
                    }
                }
            }

            // Handle sorting based on sortOrder and sortField
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";

                //  CHANGE: if UI sends camelCase sort field, map it to SQL alias
                // Otherwise sorting can fail (invalid column) depending on what is sent from UI
                var sortField = request.sortField.Equals("hasLotInfo", StringComparison.OrdinalIgnoreCase)
                    ? "HasLotInfo"
                    : request.sortField;

                query += $" ORDER BY {sortField} {sortOrder}";
            }
            else
            {
                query += " ORDER BY Id DESC";
            }

            // Pagination
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            // Fetch Data
            var result = await _dataAccess.GetDataInline<Containers, dynamic>(query, parameters);

            // Fetch Total Count with Filters Applied
            var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

            string templateUrl = _urlConstants.ContainersTemplateUrl;
            string bulkLoadAndComplete = _urlConstants.BulkLoadAndComplete;

            return new ContainerResponse
            {
                Data = result.ToList(),
                TotalCount = totalCount.FirstOrDefault(),
                TemplateUrl = templateUrl,
                BulkTemplateUrl = bulkLoadAndComplete
            };
        }

        public async Task<IEnumerable<Containers>> GetManualContainerById(int id)
        {
            string query = @"
                SELECT 
                    Id,
                    asn_id,
                    transfers_id,
                    ctrnum,
                    ctruid,
                    fcy,
                    bpsnum,
                    shipnum,
                    tctrnum,
                    create_dat_tim,
                    is_transfer,
                    extrcpdat,
                    status,
                    created_at,
                    dbo.UtcToLocal(created_at) AS created_at,
                    dbo.UtcToLocal(updated_at) AS updated_at,
                    contain_invalid_items,
                    import_ready,
                    mantis_imported_H,
                    conveyable,
                    ship_date,
                    ExportedToX3,
                    ExportDate,
                    ConfirmationDate,
                    ConfirmedByUserID
                FROM Cus_ManualContainers
                WHERE Id = @Id";
            return await _dataAccess.GetDataInline<Containers, dynamic>(query.ToString(), new { Id = id });
        }

        public async Task<ManualContainerDetailResponse> GetManualContainerLines(ManualContainerDetailRequest request, int id)
        {
            var query = @"SELECT 
                    container_id,
                    ctrnum, ctruid,
                    fcy,
                    bpsnum,
                    shipnum,
                    tctrnum,
                    create_dat_tim,
                    seanum1,
                    seanum2,
                    pohnum,
                    poplin,
                    poqseq,
                    itmref,
                    qtyuom,
                    ctrlin,
                    extrcpdat,
                    qtyweu,
                    qtyvou,
                    uom,
                    is_receipt_complete,
                    is_transfer,
                    is_receipt_sent,
                    receipt_sent_at,
                    receipt_number,
                    mantis_imported,
                    receipt_id,
                    conveyable,
                    transfers_id,
                    status,
                    dbo.UtcToLocal(created_at) AS created_at,
                    dbo.UtcToLocal(updated_at) AS updated_at,
                    invalid_item,
                    input_sku,
                    input_uom,
                    input_qty,
                    input_lot,
                    input_lot_qty
                  FROM Cus_ManualContainerDetails
                  WHERE container_id = @container_id";

            var countQuery = @"SELECT COUNT(id) 
                       FROM Cus_ManualContainerDetails 
                       WHERE container_id = @container_id";

            var parameters = new DynamicParameters();
            parameters.Add("@container_id", id);

            // ------- Handle Filters ------------
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        string key = filter.Key;
                        string rawValue = filter.Value.value;

                        if (key == "mantis_imported" || key == "invalid_item")
                        {
                            int bitValue =
                                (rawValue.Equals("yes", StringComparison.OrdinalIgnoreCase) ||
                                 rawValue.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                                 rawValue == "1") ? 1 : 0;

                            string condition = $" AND {key} = @{key}";
                            query += condition;
                            countQuery += condition;

                            parameters.Add(key, bitValue);
                        }
                        else
                        {
                            string filterValue = $"%{rawValue}%";
                            string condition = $" AND {key} LIKE @{key}";

                            query += condition;
                            countQuery += condition;

                            parameters.Add(key, filterValue);
                        }
                    }
                }
            }

            // --------Sorting----------
            var allowedSortColumns = new[]
            {
                "id","ctrnum","ctruid","itmref","pohnum","status",
                "created_at","updated_at"
            };

            string sortField = "id";
            string sortOrder = "ASC";

            if (!string.IsNullOrEmpty(request.sortField) && allowedSortColumns.Contains(request.sortField.ToLower()))
            {
                sortField = request.sortField;
            }

            if (!string.IsNullOrEmpty(request.sortOrder))
            {
                if (request.sortOrder == "1")
                    sortOrder = "ASC";
                else if (request.sortOrder == "-1")
                    sortOrder = "DESC";
            }

            query += $" ORDER BY {sortField} {sortOrder}";

            // ------ Pagination ---------
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            var result = await _dataAccess.GetDataInline<ManualContainerDetail, dynamic>(query, parameters);
            var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);
            return new ManualContainerDetailResponse
            {
                Data = result.ToList(),
                TotalCount = totalCount.FirstOrDefault()
            };
        }

        public async Task<bool> UpdateImportReady(UpdateManualContainerRequest request)
        {
            try
            {
                int rowsAffected = 0;
                foreach (var container in request.containers)
                {
                    string updateContaner = "UPDATE Cus_ManualContainers SET import_ready = 1 WHERE id = @Id";
                    var param = new DynamicParameters();
                    param.Add("@id", container.id);
                    rowsAffected += await _dataAccess.SaveDataInline(updateContaner, param);
                    string updateContanerDetails = @"
                UPDATE Cus_ManualContainerDetails
                SET mantis_imported = 0 
                WHERE container_id = @ContainerId AND mantis_imported = 2";
                    await _dataAccess.SaveDataInline(updateContanerDetails, new { ContainerId = container.id });
                }
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<ManualContainerDeleteResponse> deleteContainer(ManualContainerDeleteRequest request)
        {
            try
            {
                var containerIdsCsv = string.Join(",", request.containers);
                var result = await _dataAccess.GetData<ManualContainerDeleteResponse, dynamic>
                    (
                     "[dbo].[Cus_Sp_Receipt_ManualContainers_Delete_v1]",
                       new { ContainerIDs = containerIdsCsv }
                    );
                var re = result.FirstOrDefault();
                return new ManualContainerDeleteResponse
                {
                    error = re.error,
                    message = re.message
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<(int StatusCode, object Response)> UploadContainers(UploadContainerRequest request)
        {
            var ExcelJson = JsonConvert.SerializeObject(request.Orders);
            var parameters = new DynamicParameters();
            parameters.Add("@ExcelJson", ExcelJson);
            parameters.Add("@RetResult", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);
            parameters.Add("@RetError", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);
            parameters.Add("@Msg", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);

            try
            {
                await _dataAccess.SaveData("[dbo].[Cus_Sp_UploadManualContainer_v1]", parameters);
                string result = parameters.Get<string>("@RetResult");
                string error = parameters.Get<string>("@RetError");
                string Msg = parameters.Get<string>("@Msg");

                if (!string.IsNullOrWhiteSpace(error))
                {
                    return (400, new { error = 1, message = error });
                }

                return (200, new { error = 0, message = result });
            }
            catch (Exception ex)
            {
                return (500, new { error = 1, message = "Internal error while uploading: " + ex.Message });
            }
        }
        public async Task<SyncManualContainer?> GetLatestTransfer()
        {
            try
            {
                var sql = @"SELECT TOP 1 *
                    FROM Cus_ManualContainers
                    WHERE is_transfer = 1
                    ORDER BY create_dat_tim DESC";

                var result = (await _dataAccess.GetDataInline<SyncManualContainer, dynamic>(sql, new { })).FirstOrDefault();
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching latest transfer: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> LogActivity(ActivityLog model)
        {
            try
            {
                var query = @"INSERT INTO Cus_ActivityLog
                      ([event], [log_name], [module_id], [sub_module_id], [properties], [description], [created_at],[subject_ref])
                      VALUES (@Event, @LogName, @ModuleId, @SubModuleId, @Properties, @Description, @CreatedAt,@subject_ref)";

                var parameters = new
                {
                    Event = model.@event,
                    LogName = model.log_name,
                    ModuleId = model.module_id,
                    SubModuleId = model.sub_module_id,
                    Properties = model.properties,
                    Description = model.description,
                    CreatedAt = model.created_at,
                    Subject_ref = model.subject_ref

                };

                var rowsAffected = await _dataAccess.SaveDataInline(query, parameters);
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<SyncManualContainer> GetByShipNum(string shipNum)
        {
            try
            {
                var query = "SELECT * FROM Cus_ManualContainers WHERE shipnum = @ShipNum";
                var result = await _dataAccess.GetDataInline<SyncManualContainer, dynamic>(query, new { ShipNum = shipNum });
                return result.FirstOrDefault();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<ContainerInsertResult> Insert(SyncManualContainers container)
        {
            try
            {
                //var query = @"INSERT INTO Cus_ManualContainers (shipnum, ctrnum, create_dat_tim, fcy, ship_date, is_transfer, status)
                //  VALUES (@shipnum, @ctrnum, @create_dat_tim, @fcy, @ship_date, @is_transfer, @status)";
                //await _dataAccess.SaveDataInline(query, container);
                //}
                // ctrnum,bpsnum,tctrnum,extrcpdat,ctruid, @bpsnum,@tctrnum,@extrcpdat,


                var query = @"
                        INSERT INTO Cus_ManualContainers (
                            ctrnum,
                             fcy,
                            shipnum,
                            create_dat_tim,
                            is_transfer,
                            status,
                            created_at,
                            updated_at,
                            contain_invalid_items,
                            ship_date
                            
                        )
                        OUTPUT INSERTED.Id, INSERTED.CtrNum
                        VALUES (
                            @ctrnum,
                            @fcy,
                            @shipnum,
                            @create_dat_tim,
                            @is_transfer,
                            @status,
                            GETDATE(),
                            @updated_at,
                            @contain_invalid_items,
                            @ship_date
                        );";
                var result = await _dataAccess.QuerySingleAsync<ContainerInsertResult>(query, container);
                return result;
            }

            catch (Exception ex)
            {
                throw new Exception("Error occurred while inserting containers record", ex);
            }
        }
        public async Task<SyncManualContainers> Update(SyncManualContainers container)
        {
            try
            {
                var sql = @"UPDATE Cus_ManualContainers SET 
                        ctrnum = @ctrnum, 
                        create_dat_tim = @create_dat_tim, 
                        fcy = @fcy, 
                        ship_date = @ship_date, 
                        is_transfer = @is_transfer, 
                        status = @status 
                    WHERE shipnum = @shipnum";
                await _dataAccess.SaveDataInline(sql, container);
                return container;
            }
            catch (Exception ex)
            {
                throw new Exception("Error occurred while updating containers record.", ex);

            }
        }

        public async Task<ItemConversion> GetBySkuX3(string? skuX3)
        {
            try
            {
                var sql = "SELECT * FROM Cus_SageX3ToMantisConverion WHERE sku_x3 = @skuX3";
                var results = (await _dataAccess.GetDataInline<ItemConversion, dynamic>(sql, new { skuX3 = skuX3 })).FirstOrDefault();
                return results;
            }
            catch (Exception ex)
            {
                throw new Exception("Error occurred while getting skuX3 containers record.", ex);

            }
        }
        //public async Task<validateitemcondition1result?> validateConveyAbleItem(string sku)
        //{
        //    try
        //    {
        //        var (statusCode, resultObj) = await ValidateItem(sku, "", "", 0, 1);

        //        if (statusCode == 200 && resultObj is not null)
        //        {
        //            // Use reflection to access the anonymous type's 'message' property
        //            var messageProp = resultObj.GetType().GetProperty("message")?.GetValue(resultObj);

        //            if (messageProp is validateitemcondition1result model)
        //            {
        //                return model;
        //            }
        //        }

        //        return null;
        //    }
        //    catch (Exception)
        //    {
        //        // Optional: log error
        //        throw;
        //    }
        //}

        public async Task<validateitemcondition0result> ValidateItem(string sku, string itemCode = "", string unitCode = "", int qty = 0, int condition = 0)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@SKU", sku);
            parameters.Add("@itemCode", itemCode);
            parameters.Add("@unitCode", unitCode);
            parameters.Add("@qty", qty);
            parameters.Add("@condition", condition);

            try
            {
                switch (condition)
                {
                    case 0:
                        //string spName = "[dbo].[ValidateItemHelper] @SKU='1313', @itemCode='', @unitCode='', @qty= 0, @condition= 0";
                        var result0 = (await _dataAccess.GetData<validateitemcondition0result, dynamic>("[dbo].[Cus_Sp_ValidateItemHelper_v1]", parameters)).FirstOrDefault();
                        return result0;

                    case 1:
                        var result1 = (await _dataAccess.GetData<validateitemcondition0result, dynamic>("[dbo].[Cus_Sp_ValidateItemHelper_v1]", parameters)).FirstOrDefault();
                        return result1;

                    case 2:
                        var result2 = (await _dataAccess.GetData<validateitemcondition0result, dynamic>("[dbo].[Cus_Sp_ValidateItemHelper_v1]", parameters)).FirstOrDefault();
                        return result2;


                }
                return null;


            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task MarkContainInvalidItems(string ctrnum, bool contain_contain_invalid_items)
        {
            var sql = @"
            UPDATE Cus_ManualContainers
            SET contain_invalid_items =@ContainInvalidItems
            WHERE ctrnum = @CtrNum";

            await _dataAccess.SaveDataInline(sql, new { CtrNum = ctrnum, ContainInvalidItems = contain_contain_invalid_items });
        }
        public async Task UpdateConveyableFlag(string ctrnum, int conveyable)
        {
            var sql = @"
            UPDATE Cus_ManualContainers
            SET conveyable =@Conveyable
            WHERE ctrnum = @CtrNum";
            await _dataAccess.SaveDataInline(sql, new { CtrNum = ctrnum, Conveyable = conveyable });
        }
        public async Task UpdateConveyableAndInvalidItemsFlag(string ctrnum, int conveyable, bool contain_invalid_items)
        {
            var sql = @"
            UPDATE Cus_ManualContainers
            SET conveyable =@Conveyable,
               contain_invalid_items =@ContainInvalidItems  
            WHERE ctrnum = @CtrNum";
            await _dataAccess.SaveDataInline(sql, new { CtrNum = ctrnum, Conveyable = conveyable, ContainInvalidItems=contain_invalid_items });
        }

        public async Task UpsertManualContainerDetails(List<SyncManualContainerDetails> details)
        {
            try
            {
                var sql = @"
                    MERGE INTO Cus_ManualContainerDetails AS Target
                    USING (SELECT 
                        @container_id AS container_id,
                        @itmref AS itmref,
                        @uom AS uom) AS Source
                    ON Target.container_id = Source.container_id 
                        AND Target.itmref = Source.itmref 
                        AND Target.uom = Source.uom
                    WHEN MATCHED THEN 
                        UPDATE SET 
                            fcy = @fcy,
                            ctrnum = @ctrnum,
                            shipnum = @shipnum,
                            create_dat_tim = @create_dat_tim,
                            status = @status,
                            invalid_item = @invalid_item,
                            conveyable = @conveyable,
                            qtyuom = @qtyuom,
                            input_sku = @input_sku,
                            input_uom = @input_uom,
                            input_qty = @input_qty,
                            input_lot = @input_lot,
                            input_lot_qty = @input_lot_qty,
                            updated_at = GETUTCDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (
                            container_id,
                            fcy,
                            ctrnum,
                            shipnum,
                            create_dat_tim,
                            itmref,
                            uom,
                            status,
                            invalid_item,
                            conveyable,
                            qtyuom,
                            input_sku,
                            input_uom,
                            input_qty,
                            input_lot,
                            input_lot_qty,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            @container_id,
                            @fcy,
                            @ctrnum,
                            @shipnum,
                            @create_dat_tim,
                            @itmref,
                            @uom,
                            @status,
                            @invalid_item,
                            @conveyable,
                            @qtyuom,
                            @input_sku,
                            @input_uom,
                            @input_qty,
                            @input_lot,
                            @input_lot_qty,
                            GETUTCDATE(),
                            GETUTCDATE()
                        );
                ";

                await _dataAccess.SaveDataInline(sql, details);
            }
            catch (Exception)
            {
                throw;
            }
        }


        public async Task<IEnumerable<ManualContainerDetail>> GetDetailsByContainerId(int containerId)
        {
            var sql = "SELECT * FROM Cus_ManualContainerDetails WHERE container_id = @ContainerId";
            return await _dataAccess.GetDataInline<ManualContainerDetail, dynamic>(sql, new { ContainerId = containerId });
        }

        public async Task UpdateDetailConveyable(int id, int conveyable)
        {
            var sql = "UPDATE Cus_ManualContainerDetails SET conveyable = @Conveyable WHERE id = @Id";
            await _dataAccess.SaveDataInline(sql, new { Conveyable = conveyable, Id = id });
        }

        public async Task UpdateContainerConveyable(int containerId, int conveyable)
        {
            var sql = "UPDATE Cus_ManualContainers SET conveyable = @Conveyable WHERE Id = @ContainerId";
            await _dataAccess.SaveDataInline(sql, new { Conveyable = conveyable, ContainerId = containerId });
        }
        public async Task<bool> ContainerExists(int containerId)
        {
            var sql = "SELECT * FROM Cus_ManualContainers WHERE id = @Id";
            var result = (await _dataAccess.GetDataInline<int?, dynamic>(sql, new { Id = containerId })).FirstOrDefault();
            return result.HasValue;
        }
        public async Task<List<ManualContainerDetail>> GetManualContainerDetailsByContainerId(int containerId)
        {
            try
            {
                string sql = "SELECT * FROM Cus_ManualContainerDetails WHERE container_id = @ContainerId";
                var result = await _dataAccess.GetDataInline<ManualContainerDetail, dynamic>(sql, new { ContainerId = containerId });
                return result.ToList();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task UpdateManualContainerDetail(ManualContainerDetail detail)
        {
            try
            {
                string sql = @"
                UPDATE Cus_ManualContainerDetails
                SET itmref = @Itmref,
                    uom = @Uom,
                    qtyuom = @QtyUom,
                    invalid_item = @invalid_item,
                    mantis_imported = @mantis_imported
                WHERE id = @Id";

                await _dataAccess.SaveDataInline(sql, detail);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task UpdateContainerInvalidItemFlag(int containerId, int value)
        {
            var sql = "UPDATE Cus_ManualContainers SET contain_invalid_items = @Value, mantis_imported_h = 0 WHERE id = @ContainerId";
            await _dataAccess.SaveDataInline(sql, new { Value = value, ContainerId = containerId });
        }

        public async Task<ContainerLineResponse> GetContainerLinesByAsnId(int asnId)
        {
            var query = @"
                SELECT 
                    id,
                    pohnum,
                    poplin,
                    itmref,
                    ABS(qtyuom) AS qtyuom,
                    ctrlin,
                    qtyweu,
                    qtyvou,
                    uom,
                    mantis_imported,
                    input_sku,
                    input_uom,
                    ABS(input_qty) AS input_qty,
                    ABS(TRY_CAST(input_lot_qty AS INT)) AS input_lot_qty,
                    input_lot,
                    invalid_item,
                    conveyable,
                    status,
                    ctrnum
                FROM Cus_ManualContainerDetails
                WHERE container_id = @Id
                ORDER BY Id ASC
            ";

            var result = await _dataAccess.GetDataInline<ContainerLine, dynamic>(query, new { Id = asnId });

            return new ContainerLineResponse
            {
                containerLine = result
            };
        }

        public async Task<ApisResponse> BulkMarkReceiptComplete(List<string> ctrnums)
        {
            try
            {
                // Step 1: Get all valid receipt IDs that match the ctrnums and are not already completed
                var sql = @"SELECT rct_ID
                    FROM LV_receipt
                    WHERE rct_Code IN @Ctrnums
                    AND rct_ProgressID != @ProgressId";

                var receiptIds = await _dataAccess.GetDataInline<int, dynamic>(sql, new { Ctrnums = ctrnums, ProgressId = 3 });

                if (receiptIds == null || !receiptIds.Any())
                {
                    return new ApisResponse { Error = 1, Message = "Receipts not found." };
                }

                // Step 2: Prepare API client
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                bool anySuccess = false;
                string lastSuccessMessage = "";
                string lastErrorMessage = "";

                // Step 3: Loop over each receipt and update status
                foreach (var receiptId in receiptIds)
                {
                    string requestUrl = $"api/Receipts/UpdateReceiptStatus?receiptID={receiptId}&progressID=3";
                    var response = await client.PutAsync(requestUrl, new StringContent(""));

                    if (response.IsSuccessStatusCode)
                    {
                        var responseBody = await response.Content.ReadAsStringAsync();
                        var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                        if (result?.IsSuccess == true)
                        {
                            anySuccess = true;
                            lastSuccessMessage = result.Message;
                        }
                        else
                        {
                            lastErrorMessage = result?.Message ?? "Unknown error during API call.";
                        }
                    }
                    else
                    {
                        lastErrorMessage = $"API call failed for receiptID {receiptId}.";
                    }
                }

                // Step 4: If any were successful, update container status
                if (anySuccess)
                {
                    var updateSql = @"UPDATE Cus_ManualContainers
                              SET status = @Status
                              WHERE ctrnum IN @Ctrnums";

                    await _dataAccess.SaveDataInline(updateSql, new
                    {
                        Status = "3-completed",
                        Ctrnums = ctrnums
                    });

                    return new ApisResponse
                    {
                        Error = 0,
                        Message = lastSuccessMessage
                    };
                }
                else
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = string.IsNullOrEmpty(lastErrorMessage) ? "No receipt status updated." : lastErrorMessage
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = "Could not mark receipt complete: " + ex.Message
                };
            }
        }

        public async Task<int> InsertOrUpdateContainerOrder(ContainersOrderDto arr, int statusValue)
        {
            var query = "SELECT * FROM ManualContainers WHERE ctrnum = @CtrNum AND shipnum = @ShipNum new";
            var result = (await _dataAccess.GetDataInline<ManualContainer, dynamic>(query, new { CtrNum = arr.ctrnum, ShipNum = arr.shipnum })).FirstOrDefault();
            if (result == null)
            {
                var insertQuery = @"
            INSERT INTO ManualContainers (ctrnum, shipnum, status)
            VALUES (@CtrNum, @ShipNum, @Status);
            SELECT CAST(SCOPE_IDENTITY() as int)"
                ;

                var id = await _dataAccess.SaveDataReturnInline<int>(insertQuery, new
                {
                    CtrNum = arr.ctrnum,
                    ShipNum = arr.shipnum,
                    Status = statusValue
                });
                return id;
            }
            else
            {
                var updateQuery = "UPDATE ManualContainers SET status = @Status WHERE id = @Id";
                var updaterResult = await _dataAccess.SaveDataInline(updateQuery, new
                {
                    Status = statusValue,
                    Id = result.id
                });
                return result.id;
            }
        }
        public async Task<int> MarkContainerAsInvalid(int orderId)
        {
            var sql = "UPDATE ManualContainers SET contain_invalid_items = 1 WHERE id = @Id";
            var affectedRows = await _dataAccess.SaveDataInline(sql, new { Id = orderId });

            return affectedRows;
        }
        public async Task<int> MarkContainerAsConveyable(int orderId)
        {
            var sql = "UPDATE ManualContainers SET conveyable=1 WHERE id = @Id";
            var affectedRows = await _dataAccess.SaveDataInline(sql, new { Id = orderId });
            return affectedRows;
        }
        public async Task<int> MarkContainerAsConveyableAndInvalid(int orderId)
        {
            var sql = @"UPDATE ManualContainers
                        SET conveyable = 1, 
                            contain_invalid_items = 1
                        WHERE id = @Id";
            var affectedRows = await _dataAccess.SaveDataInline(sql, new { Id = orderId });
            return affectedRows;
        }

        public async Task UpsertLoadCompleteManualContainerDetails(IEnumerable<ManualContainerDetail> data)
        {
            var distinctData = data
            .GroupBy(x => new { x.container_id, x.bpsnum, x.shipnum, x.ctrnum, x.pohnum, x.poplin, x.itmref })
            .Select(g => g.First())
            .ToList();

            var sql = @"
                        MERGE INTO ManualContainerDetail AS target
                        USING (SELECT @ContainerId AS container_id,
                                      @BpsNum AS bpsnum,
                                      @ShipNum AS shipnum,
                                      @CtrNum AS ctrnum,
                                      @PohNum AS pohnum,
                                      @Poplin AS poplin,
                                      @ItmRef AS itmref) AS source
                        ON target.container_id = source.container_id AND 
                           target.bpsnum = source.bpsnum AND 
                           target.shipnum = source.shipnum AND 
                           target.ctrnum = source.ctrnum AND 
                           target.pohnum = source.pohnum AND 
                           target.poplin = source.poplin AND 
                           target.itmref = source.itmref
                        WHEN MATCHED THEN 
                            UPDATE SET shipnum = source.shipnum
                        WHEN NOT MATCHED THEN
                            INSERT (container_id, bpsnum, shipnum, ctrnum, pohnum, poplin, itmref)
                            VALUES (@ContainerId, @BpsNum, @ShipNum, @CtrNum, @PohNum, @Poplin, @ItmRef)";

            foreach (var batch in distinctData.Chunk(80))
            {
                foreach (var item in batch)
                {
                    await _dataAccess.SaveDataInline(sql, item);
                }
            }
        }
        public async Task<ManualContainer> GetContainerById(int id)
        {
            var sql = "SELECT * FROM Cus_ManualContainers WHERE Id = @Id";
            var result = (await _dataAccess.GetDataInline<ManualContainer, dynamic>(sql, new { Id = id })).FirstOrDefault();
            return result;
        }
        public async Task<List<ManualContainerDetail>> GetContainerDetailsByContainerId(int id)
        {
            var sql = "SELECT * FROM Cus_ManualContainerDetails WHERE container_id = @Id";
            var result = await _dataAccess.GetDataInline<ManualContainerDetail, dynamic>(sql, new { Id = id });
            return result.ToList();
        }

        public async Task<ManualContainerDetail?> GetById(int id)
        {
            var sql = "SELECT * FROM Cus_ManualContainerDetails WHERE Id = @Id";
            var result = (await _dataAccess.GetDataInline<ManualContainerDetail,dynamic>(sql, new { Id = id })).FirstOrDefault();
            return result;
        }

        public async Task UpdateContainerDetail(ManualContainerDetail detail)
        {
            var sql = @"UPDATE Cus_ManualContainerDetails 
                    SET itmref = @Itmref, 
                        uom = @Uom, 
                        qtyuom = @Qtyuom, 
                        invalid_item = @invalid_item, 
                        mantis_imported = @mantis_imported
                    WHERE Id = @Id";
            var rseult = await _dataAccess.SaveDataInline(sql, detail);

        }
        public async Task UpdateContainer(ManualContainer container)
        {
            var sql = "UPDATE Cus_ManualContainers SET mantis_imported_h = @MantisImportedH WHERE Id = @Id";
            await _dataAccess.SaveDataInline(sql, container);
        }
        public async Task UpdateContainerInvalidStatus(int containerId)
        {
            var sql = "UPDATE Cus_ManualContainers SET contain_invalid_items = 0 WHERE Id = @Id";
            await _dataAccess.SaveDataInline(sql, new { Id = containerId });
        }

        public async Task<List<int>> GetReceiptIdsByCodes(List<string> codes)
        {
            var query = @"SELECT rct_ID FROM LV_receipt WHERE rct_Code IN @Codes";
            var result = await _dataAccess.GetDataInline<int, dynamic>(query, new { Codes = codes });
            return result.ToList();
        }

        public async Task<bool> UpdateManualContainerStatus(List<string> ids, string status)
        {
            var query = "UPDATE Cus_ManualContainers SET status = @Status WHERE ctrnum IN @Ids";
            var rows = await _dataAccess.SaveDataInline(query, new { Status = status, Ids = ids });
            return rows > 0;
        }

        public async Task<ApisResponse> RemoveReservation(List<string> ids)
        {
            var baseUrl = _configuration["MantisApi:Endpoint"];
            var apiKey = _configuration["MantisApi:ApiKey"];

            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };

            using var client = new HttpClient(handler)
            {
                BaseAddress = new Uri(baseUrl)
            };

            client.DefaultRequestHeaders.Add("ApiKey", apiKey);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            foreach (var code in ids)
            {
                string requestUrl = $"api/Receipts/UnreserveReceipt?receiptCode={code}";
                var response = await client.PutAsync(requestUrl, null);

                if (!response.IsSuccessStatusCode)
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = $"API call failed for code {code} with status {response.StatusCode}."
                    };
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                if (result?.IsSuccess != true)
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = result?.Message ?? $"API call failed for code {code}."
                    };
                }
            }

            return new ApisResponse
            {
                Error = 0,
                Message = "All receipts unreserved successfully."
            };
        }
        public async Task<CreateContainerDetailResponse?> GetManualContainerByShipnum(string shipnum)
        {
            var sql = @"SELECT TOP 1 * 
                FROM Cus_ManualContainers 
                WHERE shipnum = @Shipnum"
            ;
            var result = (await _dataAccess.GetDataInline<CreateContainerDetailResponse, dynamic>(sql, new { Shipnum = shipnum })).FirstOrDefault();
            return result;

        }


        public async Task UpdateTransfer(int id, bool contain_invalid_items)
        {
            var sql= @"UPDATE Cus_ManualContainers 
                      SET contain_invalid_items = 1
                      WHERE id = @Id";
            await _dataAccess.SaveDataInline(sql, new {Id= id});
        }

        public async Task UpdateConveyableTransfer(int id, int conveyable)
        {
            var sql = @"UPDATE Cus_ManualContainers 
          SET conveyable = @Conveyable
          WHERE id = @Id";
            await _dataAccess.SaveDataInline(sql, new { Id = id, Conveyable= conveyable });
        }

        public async Task UpdateContainerFlags(int id, int conveyable, bool contain_invalid_items)
        {
            var sql = @"UPDATE Cus_ManualContainers
                      SET conveyable = @Convayable,
                     contain_invalid_items = @Contain_Invalid_Items
                       WHERE id = @Id";
            await _dataAccess.SaveDataInline(sql, new { Id = id, Convayable= conveyable, Contain_Invalid_Items= contain_invalid_items });

        }

        public async Task UpsertContainerDetails(IEnumerable<ContainerDetailDto> items, List<string> upsertKeys)
        {
            foreach (var item in items)
            {
                var sql = @"
               MERGE INTO Cus_ManualContainerDetails AS target
                USING (VALUES (
                    @container_id, @fcy, @ctrnum, @shipnum, @create_dat_tim, 
                    @itmref, @uom, @status, @invalid_item, @conveyable, @qtyuom,
                    @input_sku, @input_uom, @input_qty, @input_lot, @input_lot_qty
                )) AS source (
                    container_id, fcy, ctrnum, shipnum, create_dat_tim, 
                    itmref, uom, status, invalid_item, conveyable, qtyuom,
                    input_sku, input_uom, input_qty, input_lot, input_lot_qty
                )
                ON target.container_id = source.container_id
                   AND target.itmref = source.itmref
                   AND target.uom = source.uom
                   AND (
                        (source.input_lot IS NULL AND target.input_lot IS NULL)
                        OR (source.input_lot IS NOT NULL AND target.input_lot = source.input_lot)
                   )
                   AND (
                        (source.input_lot_qty IS NULL AND target.input_lot_qty IS NULL)
                        OR (source.input_lot_qty IS NOT NULL AND target.input_lot_qty = source.input_lot_qty)
                   )
                WHEN MATCHED THEN
                    UPDATE SET
                        fcy = source.fcy,
                        ctrnum = source.ctrnum,
                        shipnum = source.shipnum,
                        create_dat_tim = source.create_dat_tim,
                        status = source.status,
                        invalid_item = source.invalid_item,
                        conveyable = source.conveyable,
                        qtyuom = source.qtyuom,
                        input_sku = source.input_sku,
                        input_uom = source.input_uom,
                        input_qty = source.input_qty
                WHEN NOT MATCHED THEN
                    INSERT (
                        container_id, fcy, ctrnum, shipnum, create_dat_tim,
                        itmref, uom, status, invalid_item, conveyable, qtyuom,
                        input_sku, input_uom, input_qty, input_lot, input_lot_qty
                    )
                    VALUES (
                        source.container_id, source.fcy, source.ctrnum, source.shipnum, source.create_dat_tim,
                        source.itmref, source.uom, source.status, source.invalid_item, source.conveyable, source.qtyuom,
                        source.input_sku, source.input_uom, source.input_qty, source.input_lot, source.input_lot_qty
                    );";


          await _dataAccess.SaveDataInline(sql, item);
            }
        }

        public async Task DeleteContainerDetails(string ctrnum)
        {
            var sql = @"DELETE FROM Cus_ManualContainerDetails WHERE ctrnum = @Ctrnum";

            await _dataAccess.SaveDataInline(sql, new { Ctrnum = ctrnum });
        }
    }
}