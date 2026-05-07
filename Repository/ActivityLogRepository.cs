using Dapper;
using Microsoft.Extensions.Configuration;
//using MiddlewareWebAPI.Common.Helper;
using MiddlewareWebAPI.Data.IRepository;
//using MiddlewareWebAPI.Common.Helper;

using MiddlewareWebAPI.Data.Model;
using Npgsql;
using System.Data;
using System.Text.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ActivityLogRepository : IActivityLogRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly string? _pgConStr;
        private readonly bool _usePostgres;

        //public readonly GetLogsCommon _logsHelper;

        public ActivityLogRepository(ISqlDataAccess dataAccess, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _pgConStr = configuration.GetConnectionString("PostgresConnection");
            _usePostgres = configuration.GetValue<bool>("DatabaseSettings:UsePostgreSQL");

        }

          // GetInboundLogs
        public async Task<InboundLogResponse> GetInboundLogs(InboundLogRequest request)
        {
            try
            {
                return _usePostgres
                    ? await GetInboundLogs_Postgres(request)
                    : await GetInboundLogs_Old(request);
            }
            catch (Exception ex)
            {

                Console.WriteLine($"Error in GetInboundLogs: {ex.Message}");
                throw;
            }
        }
         //  GetOutboundLogs
        public async Task<OutboundLogResponse> GetOutboundLogs(OutboundLogRequest request)
        {
            try
            {
                return _usePostgres
                    ? await GetOutboundLogs_Postgres(request)
                    : await GetOutboundLogs_Old(request);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetOutboundLogs: {ex.Message}");
                throw;
            }
        }
         // InsertActivityLog
        public async Task ActivityLog(ActivityLog log)
        {
            try
            {

                if (_usePostgres)
                {
                    await ActivityLog_Postgres(log);
                }
                else
                {
                    await ActivityLog_Old(log);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ActivityLog: {ex.Message}");
                throw new Exception("Error while inserting activity log: " + ex.Message);
            }
        }
        //ArchiveActivityLogs
        public async Task<ApisResponse> ArchiveActivityLogs()
        {
            try
            {
                return _usePostgres
                    ? await ArchiveActivityLogs_Postgres()
                    : await ArchiveActivityLogs_Old();

            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = $"Error while archiving activity logs | {ex.Message}"
                };
            }
        }

        //GetTargetedLogsfororders
        public async Task<IEnumerable<ActivityLog>> GetTargetedLogsfororders(int moduleId, IEnumerable<int> subModuleId, int subjectId)
        {
            if (_usePostgres)
            {
                return await GetTargetedLogsfororders_Postgres(moduleId, subModuleId, subjectId);
            }
            else
            {
                return await GetTargetedLogsfororders_Old(moduleId, subModuleId, subjectId);
            }
        }

        //GetTargetedLogs
        public async Task<IEnumerable<ActivityLog>> GetTargetedLogs(int moduleId, int subModuleId, int subjectId)
        {
            return _usePostgres
                ? await GetTargetedLogs_Postgres(moduleId, subModuleId, subjectId)
                : await GetTargetedLogs_Old(moduleId, subModuleId, subjectId);
        }


        //public async Task<ActivityLogResponse> GetActivityLogs(OutboundLogRequest request, string logType = null)
        //{
        //    try
        //    {
        //        var parameters = new DynamicParameters();

        //        DateTime? fromDate = null;
        //        DateTime? toDate = null;
        //        string search = null;


        //        if (request.filters != null)
        //        {
        //            foreach (var filter in request.filters)
        //            {
        //                if (string.IsNullOrWhiteSpace(filter.Key) ||
        //                    string.IsNullOrWhiteSpace(filter.Value?.value))
        //                    continue;

        //                if (filter.Key.Equals("created_at", StringComparison.OrdinalIgnoreCase) &&
        //                    DateTime.TryParse(filter.Value.value, out var parsedDate))
        //                {
        //                    fromDate = parsedDate.Date;
        //                    toDate = parsedDate.Date;
        //                }
        //                else
        //                {
        //                    search = filter.Value.value;
        //                }
        //            }
        //        }

        //        search = string.IsNullOrWhiteSpace(search) ? null : search;
        //        parameters.Add("p_page_number", request.page <= 0 ? 1 : request.page);
        //        parameters.Add("p_page_size", request.rows <= 0 ? 10 : request.rows);
        //        parameters.Add("p_search", search);
        //        parameters.Add("p_from_date", fromDate);
        //        parameters.Add("p_to_date", toDate);
        //        parameters.Add("p_log_type", logType);

        //        var result = (await _dataAccess.GetDataPostgres<ActivityLog, dynamic>(
        //            @"SELECT * FROM mw.get_activity_logs_v1(
        //        p_page_number => @p_page_number,
        //        p_page_size   => @p_page_size,
        //        p_search      => @p_search,
        //        p_from_date   => @p_from_date,
        //        p_to_date     => @p_to_date,
        //        p_log_type    => @p_log_type
        //    )",
        //            parameters
        //        )).ToList();
        //        if (result == null || result.Count == 0)
        //        {
        //            var fallbackParams = new DynamicParameters();
        //            fallbackParams.Add("p_log_type", parameters.Get<string>("p_log_type"));

        //            result = (await _dataAccess.GetDataPostgres<ActivityLog, dynamic>(
        //                @"SELECT * FROM mw.get_activity_logs_v1(
        //    p_log_type => @p_log_type
        //)",
        //                fallbackParams
        //            )).ToList();
        //        }


        //        var totalCount = result.FirstOrDefault()?.total_count ?? 0;

        //        var history = await _dataAccess.GetSinglePostgres<InboundHistory, dynamic>(
        //            @"SELECT history_created_at 
        //      FROM mw.activity_log_history 
        //      ORDER BY id DESC 
        //      LIMIT 1",
        //            new { }
        //        );

        //        return new ActivityLogResponse
        //        {
        //            Data = result,
        //            TotalCount = Convert.ToInt32(totalCount),
        //            HistoryCreatedAt = history?.history_created_at
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine($"Error: {ex.Message}");

        //        return new ActivityLogResponse
        //        {
        //            Data = new List<ActivityLog>(),
        //            TotalCount = 0
        //        };
        //    }
        //}

        private async Task<IEnumerable<ActivityLog>> GetTargetedLogs_Postgres(int moduleId, int subModuleId, int subjectId)
        {
            string query = @" SELECT * FROM mw.get_targeted_logs(@ModuleId, @SubModuleIds,@SubjectId)";

            return await _dataAccess.GetDataPostgres<ActivityLog, dynamic>(query, new
                {
                    ModuleId = moduleId,
                    SubModuleIds = new[] { subModuleId }, 
                    SubjectId = subjectId
                }
            );
        }
        private async Task<IEnumerable<ActivityLog>> GetTargetedLogs_Old(int moduleId, int subModuleId, int subjectId)
        {
            string query = $@"
                SELECT
                  id,
                log_name,
                description,
                subject_type,
                subject_id,
                causer_type,
                causer_id,
                event,
                batch_uuid,
                module_id,
                sub_module_id,
                subject_ref,
                user_name,
                api_action_type,

                dbo.UtcToLocal(created_at) AS created_at,
                dbo.UtcToLocal(updated_at) AS updated_at,

                JSON_MODIFY(
                    JSON_MODIFY(
                        JSON_MODIFY(
                            properties,
                            '$.data.created_at',
                            CONVERT(
                                nvarchar(30),
                                dbo.UtcToLocal(
                                    TRY_CAST(JSON_VALUE(properties, '$.data.created_at') AS datetime2)
                                ),
                                126
                            )
                        ),
                        '$.data.ship_date',
                        CONVERT(
                            nvarchar(30),
                            dbo.UtcToLocal(
                                TRY_CAST(JSON_VALUE(properties, '$.data.ship_date') AS datetime2)
                            ),
                            126
                        )
                    ),
                    '$.data.updated_at',
                    CONVERT(
                        nvarchar(30),
                        dbo.UtcToLocal(
                            TRY_CAST(JSON_VALUE(properties, '$.data.updated_at') AS datetime2)
                        ),
                        126
                    )
                ) AS properties

            FROM Cus_ActivityLog
            WHERE module_id = @ModuleId
              AND sub_module_id = @SubModuleId
              AND subject_id = @SubjectId;
            ";
            return await _dataAccess.GetDataInline<ActivityLog, dynamic>(query, new { ModuleId = moduleId, SubModuleId = subModuleId, SubjectId = subjectId });
        }
        private async Task<IEnumerable<ActivityLog>> GetTargetedLogsfororders_Postgres( int moduleId, IEnumerable<int> subModuleId, int subjectId)
        {
            string query = @"
        SELECT * FROM mw.get_targeted_logs( @ModuleId, @SubModuleId, @SubjectId)";

            return await _dataAccess.GetDataPostgres<ActivityLog, dynamic>(
                query,
                new
                {
                    ModuleId = moduleId,
                    SubModuleId = subModuleId.ToArray(),
                    SubjectId = subjectId
                }
            );
        }
        private async Task<IEnumerable<ActivityLog>> GetTargetedLogsfororders_Old(int moduleId, IEnumerable<int> subModuleId, int subjectId)
        {
            string query = @"
                SELECT
                    log_name,
                    description,
                    subject_type,
                    subject_id,
                    causer_type,
                    causer_id,
                    event,
                    batch_uuid,
                    module_id,
                    sub_module_id,
                    subject_ref,
                    user_name,
                    api_action_type,
                   -- New Jersey local time
                    dbo.UtcToLocal(created_at) AS created_at,
                    dbo.UtcToLocal(updated_at) AS updated_at,

                    -- JSON conversion (only created_at & updated_at)
                    JSON_MODIFY(
                        JSON_MODIFY(
                            properties,
                            '$.data.created_at',
                            CONVERT(
                                nvarchar(30),
                                dbo.UtcToLocal(
                                    TRY_CAST(JSON_VALUE(properties, '$.data.created_at') AS datetime2)
                                ),
                                126
                            )
                        ),
                        '$.data.updated_at',
                        CONVERT(
                            nvarchar(30),
                            dbo.UtcToLocal(
                                TRY_CAST(JSON_VALUE(properties, '$.data.updated_at') AS datetime2)
                            ),
                            126
                        )
                    ) AS properties
                FROM Cus_ActivityLog
                WHERE module_id = @ModuleId
                  AND sub_module_id IN @SubModuleId
                  AND subject_id = @SubjectId
            ";

            return await _dataAccess.GetDataInline<ActivityLog, dynamic>(
                query,
                new
                {
                    ModuleId = moduleId,
                    SubModuleId = subModuleId,
                    SubjectId = subjectId
                }
            );
        }
        private async Task<ApisResponse> ArchiveActivityLogs_Postgres()
        {
            try
            {

                await _dataAccess.ExecutePostgresProcedureAsync("mw.sp_archive_activitylog_history");
                return new ApisResponse
                {
                    Error = 0,
                    Message = "Activity logs have been successfully archived."
                };
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = $"Error while archiving activity logs | {ex.Message}"
                };
            }
        }
        private async Task<ApisResponse> ArchiveActivityLogs_Old()
        {
            try
            {
                await _dataAccess.SaveData("[dbo].[CUS_SP_Archive_ActivityLog_History]",new{ });          
                return new ApisResponse
                {
                    Error = 0,
                    Message = "Activity logs have been successfully archived."
                };
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = $"Error while archiving activity logs | {ex.Message}"
                };
            }
        }
        private async Task ActivityLog_Postgres(ActivityLog log)
        {
            try
            {
                using (var connection = new NpgsqlConnection(_pgConStr))
                {
                    await connection.OpenAsync();

                    var sql = @"CALL mw.insert_activity_log(@p_log_name::varchar,@p_description::text, @p_subject_type::varchar,@p_subject_id::bigint, @p_causer_type::varchar,@p_causer_id::bigint,
                @p_properties::jsonb,@p_created_at::timestamp,@p_updated_at::timestamp,@p_event::varchar, @p_batch_uuid::uuid,@p_module_id::integer,
                @p_sub_module_id::integer, @p_subject_ref::varchar,@p_user_name::varchar,@p_api_action_type::varchar,NULL, NULL, NULL);";
                    var parameters = new DynamicParameters();
                    parameters.Add("p_log_name", log.log_name);
                    parameters.Add("p_description", log.description);
                    parameters.Add("p_subject_type", log.subject_type);
                    parameters.Add("p_subject_id", log.subject_id);
                    parameters.Add("p_causer_type", log.causer_type);
                    parameters.Add("p_causer_id", log.causer_id);
                    parameters.Add("p_properties",
                        !string.IsNullOrEmpty(log.properties) ? log.properties : "{}");
                    parameters.Add("p_created_at", log.created_at ?? DateTime.UtcNow);
                    parameters.Add("p_updated_at", log.updated_at);
                    parameters.Add("p_event", log.@event);
                    Guid batchUuid = log.batch_uuid.HasValue
                  ? Guid.Parse($"00000000-0000-0000-0000-{log.batch_uuid.Value.ToString().PadLeft(12, '0')}") : Guid.NewGuid();
                    parameters.Add("p_batch_uuid", batchUuid);
                    parameters.Add("p_module_id", log.module_id);
                    parameters.Add("p_sub_module_id", log.sub_module_id);
                    parameters.Add("p_subject_ref", log.subject_ref);
                    parameters.Add("p_user_name", log.user_name);
                    parameters.Add("p_api_action_type", log.api_action_type);
                    var result = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, parameters);

                    if (result != null)
                    {
                        bool success = result.o_success;
                        string message = result.o_message;
                        long? insertedId = result.o_inserted_id;

                        if (!success)
                        {
                            throw new Exception(message);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error while inserting activity log: " + ex.Message);
            }
        }
        private async Task ActivityLog_Old(ActivityLog log)
        {
            try
            {
                var sql = @"INSERT INTO Cus_ActivityLog 
                        (log_name, module_id, sub_module_id, event, subject_id, properties,subject_ref, description, causer_type, created_at, user_name, api_action_type)
                        VALUES 
                        (@log_name, @module_id, @sub_module_id, @event, @subject_id, @properties, @subject_ref, @description, @causer_type, @created_at, @user_name,@api_action_type)";
                await _dataAccess.SaveDataInline(sql, log);
            }
            catch (Exception)
            {
                throw;
            }
        }
        private async Task<OutboundLogResponse> GetOutboundLogs_Postgres(OutboundLogRequest request)
        {
            var parameters = new DynamicParameters();

       
            var filtersJson = new Dictionary<string, string>();
            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrWhiteSpace(filter.Value?.value))
                    {
                        filtersJson[filter.Key] = filter.Value.value.Trim();
                    }
                }
            }

            parameters.Add("@p_filters", JsonSerializer.Serialize(filtersJson), DbType.String);
            parameters.Add("@p_sort_field", string.IsNullOrEmpty(request.sortField) ? "id" : request.sortField);
            parameters.Add("@p_sort_order", request.sortOrder == "1" ? "ASC" : "DESC");
            parameters.Add("@p_offset", request.first);
            parameters.Add("@p_limit", request.rows);
            parameters.Add("@p_log_name", "outbound");

            var query = @"SELECT * FROM mw.get_activity_logs_common(
                    @p_filters::jsonb,
                    @p_sort_field,
                    @p_sort_order,
                    @p_offset,
                    @p_limit,
                    @p_log_name)";

            var data = await _dataAccess.GetDataPostgres<OutboundActivityLog, dynamic>(query, parameters);

            var totalCount = data.FirstOrDefault()?.total_count ?? 0;

            // Get History Created At
            var history = (await _dataAccess.GetDataPostgres<OutboundHistoryCreated, dynamic>(
                "SELECT history_created_at FROM mw.activity_log_history ORDER BY id DESC LIMIT 1",
                null)).FirstOrDefault();

            return new OutboundLogResponse
            {
                Data = data,
                TotalCount = (int)totalCount,
                HistoryCreatedAt = history?.history_created_at
            };
        }
        private async Task<OutboundLogResponse> GetOutboundLogs_Old(OutboundLogRequest request)
        {
            var query = @"
            SELECT
            log_name,
            description,
            subject_type,
            subject_id,
            causer_type,
            causer_id,
            event,
            batch_uuid,
            module_id,
            sub_module_id,
            subject_ref,
            user_name,
            api_action_type,

            dbo.UtcToLocal(created_at) AS created_at,
            dbo.UtcToLocal(updated_at) AS updated_at,

            CASE 
                WHEN ISJSON(properties) = 1
                THEN JSON_MODIFY(
                    JSON_MODIFY(
                        properties,
                        '$.data.created_at',
                        CASE
                            WHEN TRY_CAST(JSON_VALUE(properties, '$.data.created_at') AS datetime2) IS NOT NULL
                            THEN CONVERT(
                                nvarchar(30),
                                dbo.UtcToLocal(
                                    TRY_CAST(JSON_VALUE(properties, '$.data.created_at') AS datetime2)
                                ),
                                126
                            )
                            ELSE JSON_VALUE(properties, '$.data.created_at')
                        END
                    ),
                    '$.data.updated_at',
                    CASE
                        WHEN TRY_CAST(JSON_VALUE(properties, '$.data.updated_at') AS datetime2) IS NOT NULL
                        THEN CONVERT(
                            nvarchar(30),
                            dbo.UtcToLocal(
                                TRY_CAST(JSON_VALUE(properties, '$.data.updated_at') AS datetime2)
                            ),
                            126
                        )
                        ELSE JSON_VALUE(properties, '$.data.updated_at')
                    END
                        )
                        ELSE properties
                    END AS properties
                FROM Cus_ActivityLog
                WHERE 1 = 1
            ";

            var countQuery = @"
                SELECT COUNT(id)
                FROM Cus_ActivityLog
                WHERE 1 = 1
            ";

            var parameters = new DynamicParameters();

            // Filters
            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) ||
                        string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;

                    if (filter.Key.Equals("created_at", StringComparison.OrdinalIgnoreCase) &&
                        DateTime.TryParse(filter.Value.value, out var parsedDate))
                    {
                        query += " AND created_at >= @FromDate AND created_at < @ToDate";
                        countQuery += " AND created_at >= @FromDate AND created_at < @ToDate";

                        parameters.Add("@FromDate", parsedDate.Date);
                        parameters.Add("@ToDate", parsedDate.Date.AddDays(1));
                    }
                    else
                    {
                        query += $" AND {filter.Key} LIKE @{filter.Key}";
                        countQuery += $" AND {filter.Key} LIKE @{filter.Key}";
                        parameters.Add($"@{filter.Key}", $"%{filter.Value.value}%");
                    }
                }
            }

            // Sorting
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                var order = request.sortOrder == "1" ? "ASC" : "DESC";
                query += $" ORDER BY {request.sortField} {order}";
            }
            else
            {
                query += " ORDER BY id DESC";
            }

            // Pagination
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            var historyQuery = @"
                SELECT TOP 1 history_created_at
                FROM Cus_ActivityLog_History
                ORDER BY id DESC
            ";

            var history = (await _dataAccess
                .GetDataInline<OutboundHistoryCreated, dynamic>(historyQuery, new { }))
                .FirstOrDefault();

            var data = await _dataAccess
                .GetDataInline<OutboundActivityLog, dynamic>(query, parameters);

            var totalCount = (await _dataAccess
                .GetDataInline<int, dynamic>(countQuery, parameters))
                .FirstOrDefault();

            return new OutboundLogResponse
            {
                Data = data,
                TotalCount = totalCount,
                HistoryCreatedAt = history?.history_created_at
            };
        }
        private async Task<InboundLogResponse> GetInboundLogs_Postgres(InboundLogRequest request)
        {
            try
            {
                var parameters = new DynamicParameters();

                // Prepare Filters as JSONB
                var filtersJson = new Dictionary<string, string>();
                if (request.filters != null)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrWhiteSpace(filter.Value?.value))
                        {
                            filtersJson[filter.Key] = filter.Value.value.Trim();
                        }
                    }
                }

                parameters.Add("@p_filters", JsonSerializer.Serialize(filtersJson), DbType.String);
                parameters.Add("@p_sort_field", string.IsNullOrEmpty(request.sortField) ? "id" : request.sortField);
                parameters.Add("@p_sort_order", request.sortOrder == "1" ? "ASC" : "DESC");
                parameters.Add("@p_offset", request.first);
                parameters.Add("@p_limit", request.rows);
                parameters.Add("@p_log_name", "inbound"); // Fixed for Inbound

                var query = @"SELECT * FROM mw.get_activity_logs_common(
                        @p_filters::jsonb,
                        @p_sort_field,
                        @p_sort_order,
                        @p_offset,
                        @p_limit,
                        @p_log_name)";

                var data = await _dataAccess.GetDataPostgres<InboundActivityLog, dynamic>(query, parameters);

                var totalCount = data.FirstOrDefault()?.total_count ?? 0;

                // Get History Created At
                var historyQuery = "SELECT history_created_at FROM mw.activity_log_history ORDER BY id DESC LIMIT 1";

                var history = (await _dataAccess.GetDataPostgres<InboundHistory, dynamic>(historyQuery, null))
                                .FirstOrDefault();

                return new InboundLogResponse
                {
                    Data = data,
                    TotalCount = (int)totalCount,
                    HistoryCreatedAt = history?.history_created_at
                };
            }
            catch (Exception ex)
            {         
                // _logger.LogError(ex, "Error in GetInboundLogs");

                return new InboundLogResponse
                {
                    Data = new List<InboundActivityLog>(),
                    TotalCount = 0,
                    HistoryCreatedAt = null,
                    // If your response supports message:
                    // Message = ex.Message
                };
            }
        }
        private async Task<InboundLogResponse> GetInboundLogs_Old(InboundLogRequest request)
        {
            var query = @"
                    SELECT
                        log_name,
                        description,
                        subject_type,
                        subject_id,
                        causer_type,
                        causer_id,
                        event,
                        batch_uuid,
                        module_id,
                        sub_module_id,
                        subject_ref,
                        user_name,
                        api_action_type,

                        dbo.UtcToLocal(created_at) AS created_at,
                        dbo.UtcToLocal(updated_at) AS updated_at,

                        JSON_MODIFY(
                            JSON_MODIFY(
                                properties,
                                '$.data.created_at',
                                CASE
                                    WHEN TRY_CAST(JSON_VALUE(properties, '$.data.created_at') AS datetime2) IS NOT NULL
                                    THEN CONVERT(
                                        nvarchar(30),
                                        dbo.UtcToLocal(
                                            TRY_CAST(JSON_VALUE(properties, '$.data.created_at') AS datetime2)
                                        ),
                                        126
                                    )
                                    ELSE JSON_VALUE(properties, '$.data.created_at')
                                END
                            ),
                            '$.data.updated_at',
                            CASE
                                WHEN TRY_CAST(JSON_VALUE(properties, '$.data.updated_at') AS datetime2) IS NOT NULL
                                THEN CONVERT(
                                    nvarchar(30),
                                    dbo.UtcToLocal(
                                        TRY_CAST(JSON_VALUE(properties, '$.data.updated_at') AS datetime2)
                                    ),
                                    126
                                )
                                ELSE JSON_VALUE(properties, '$.data.updated_at')
                            END
                        ) AS properties
                 FROM Cus_ActivityLog
                 WHERE 1 = 1
                ";

            var countQuery = @"
                    SELECT COUNT(id)
                    FROM Cus_ActivityLog
                    WHERE 1 = 1
                ";

            var parameters = new DynamicParameters();

            //  FILTERS 
            if (request.filters != null && request.filters.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Key) ||
                        string.IsNullOrWhiteSpace(filter.Value?.value))
                        continue;

                    // DATE FILTER (created_at)
                    if (filter.Key.Equals("created_at", StringComparison.OrdinalIgnoreCase))
                    {
                        if (DateTime.TryParse(filter.Value.value, out var parsedDate))
                        {
                            query += " AND created_at >= @CreatedFrom AND created_at < @CreatedTo";
                            countQuery += " AND created_at >= @CreatedFrom AND created_at < @CreatedTo";

                            parameters.Add("@CreatedFrom", parsedDate.Date);
                            parameters.Add("@CreatedTo", parsedDate.Date.AddDays(1));
                        }
                    }
                    else
                    {
                        query += $" AND {filter.Key} LIKE @{filter.Key}";
                        countQuery += $" AND {filter.Key} LIKE @{filter.Key}";

                        parameters.Add($"@{filter.Key}", $"%{filter.Value.value}%");
                    }
                }
            }

            //  SORTING 
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                var sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                query += $" ORDER BY {request.sortField} {sortOrder}";
            }
            else
            {
                query += " ORDER BY id DESC";
            }

            //  PAGINATION 
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";

            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            //  HISTORY DATE 
            var historyCreatedQuery = @"
                    SELECT TOP 1 history_created_at
                    FROM Cus_ActivityLog_History
                    ORDER BY id DESC
                ";

            var historyCreatedResult = (await _dataAccess
                .GetDataInline<InboundHistory, dynamic>(historyCreatedQuery, new { }))
                .FirstOrDefault();

            //  EXECUTION 
            var data = await _dataAccess
                .GetDataInline<InboundActivityLog, dynamic>(query, parameters);

            var totalCount = (await _dataAccess
                .GetDataInline<int, dynamic>(countQuery, parameters))
                .FirstOrDefault();

            return new InboundLogResponse
            {
                Data = data,
                TotalCount = totalCount,
                HistoryCreatedAt = historyCreatedResult?.history_created_at
            };

        }


    }

}



