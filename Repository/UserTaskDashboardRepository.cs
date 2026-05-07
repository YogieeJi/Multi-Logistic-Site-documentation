using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using iText.Layout.Borders;
using static System.Net.WebRequestMethods;
using static iText.IO.Image.Jpeg2000ImageData;
using System.Collections;
using Dapper;
using System.Linq.Expressions;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Globalization;

namespace MiddlewareWebAPI.Data.Repository
{
    public class UserTaskDashboardRepository : IUserTaskDashboardRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        public UserTaskDashboardRepository(ISqlDataAccess dataAccess, IConfiguration configuration, HttpClient httpClient)
        {
            _dataAccess = dataAccess;
            _configuration = configuration;
            _httpClient = httpClient;
        }
        public async Task<Root> GetUserTaskGrid(UserTaskGridRequest request)
        {
            var lazyState = request.LazyState ?? new LazyStates();
            int pageNumber = (lazyState.Page ?? 0) + 1;
            int pageSize = lazyState.Rows ?? 10;

            string? sortOrderStr = lazyState.sortOrder?.ToString()?.Trim();

            string? sortType = sortOrderStr == "1" || sortOrderStr?.Equals("asc", StringComparison.OrdinalIgnoreCase) == true
                ? "asc"
                : sortOrderStr == "-1" || sortOrderStr?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true
                    ? "desc"
                    : null;


            string? dateFilter = request.Date;
            string? nameFilter = lazyState.Filters != null && lazyState.Filters.ContainsKey("userName") ? lazyState.Filters["userName"].Value : null;

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

            var requestUrl = new StringBuilder($"/api/Reports/GetDailyEmployeeProductivity?pageNumber={pageNumber}&pageSize={pageSize}");

            //if (!string.IsNullOrEmpty(dateFilter))
            //    requestUrl.Append($"&date={HttpUtility.UrlEncode(dateFilter)}");

            //if (!string.IsNullOrEmpty(nameFilter))
            //    requestUrl.Append($"&username={HttpUtility.UrlEncode(nameFilter)}");

            //if (!string.IsNullOrEmpty(lazyState.SortField))
            //    requestUrl.Append($"&sortBy={HttpUtility.UrlEncode(lazyState.SortField)}");

            //if (!string.IsNullOrEmpty(sortType))
            //    requestUrl.Append($"&sortOrder={HttpUtility.UrlEncode(sortType)}");

            var queryParams = new Dictionary<string, string?>
            {
                { "date", dateFilter },
                { "username", nameFilter },
                { "sortBy", lazyState.sortField },
                { "sortOrder", sortType }
            };

            foreach (var param in queryParams)
            {
                if (!string.IsNullOrEmpty(param.Value))
                    requestUrl.Append($"&{param.Key}={HttpUtility.UrlEncode(param.Value)}");
            }

            var fullUrl = new Uri(client.BaseAddress, requestUrl.ToString());

            try
            {
                var response = await client.GetAsync(fullUrl);
                var responseContent = await response.Content.ReadAsStringAsync();
                if (response.IsSuccessStatusCode)
                {
                    var result = JsonConvert.DeserializeObject<Root>(responseContent);

                    // Check if result has no data or empty list
                    if (result == null || result.data == null || !result.data.Any())
                    {
                        return new Root
                        {
                            Error = 1,
                            data = new List<EmployeeProductivity>(),
                            TotalRecords = result.TotalRecords


                        };
                    }

                    return new Root
                    {
                        Error = 0,
                        data = result.data,
                        TotalRecords = result.TotalRecords
                    };
                }
                else
                {
                    string? apiMessage = null;
                    try
                    {
                        var errorObj = JsonConvert.DeserializeObject<dynamic>(responseContent);
                        apiMessage = errorObj?.message ?? errorObj?.Message ?? errorObj?.error?.ToString();
                    }
                    catch { }

                    return new Root
                    {
                        Message = apiMessage ?? $"External API returned error: {(int)response.StatusCode} ({response.StatusCode})",
                        data = null,
                        Error = 1
                    };
                }
            }
            catch (Exception ex)
            {
                return new Root
                {
                    Message = $"Exception occurred: {ex.Message}",
                    data = null,
                    Error = 1
                };
            }
        }

        public async Task<IEnumerable<TaskReportModel>> GetTaskReport(string dateFrom)
        {
            string sql = @"
            SELECT
                CAST(MIN(tsk_Quantity) AS INT) AS Tsk_Quantity,
                MIN(unt_code) AS Unt_Code,
                lv_log.log_id AS Log_Id,
                LV_TransactionType.trt_MessageCode AS Trt_MessageCode,
                MIN(LV_Product.prd_PrimaryCode) AS Prd_PrimaryCode,
                CONCAT(per_FirstName, ' ', per_LastName) AS Names,
                LV_Task.tsk_FromLocationCode AS Tsk_FromLocationCode,
                LV_Task.tsk_ToLocationCode AS Tsk_ToLocationCode,
                LV_Task.tsk_Code AS Tsk_Code,
                LEAD(LV_Task.tsk_Code) OVER (PARTITION BY LV_Task.tsk_ActualUserID ORDER BY log_ID) AS NextTaskCode,
                FORMAT(lv_log.log_startdatetime, 'HH:mm:ss') AS StartTime,
                FORMAT(
                    DATEADD(MILLISECOND, ISNULL(lv_log.log_TotalDuration, 0), lv_log.log_startdatetime),
                    'HH:mm:ss'
                ) AS FinishTime,
                FORMAT(
                    CASE
                        WHEN LEAD(log_startdatetime) OVER (PARTITION BY LV_Task.tsk_ActualUserID ORDER BY log_ID) >= 
                             DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), log_startdatetime)
                        THEN DATEADD(
                            SECOND,
                            DATEDIFF(
                                SECOND,
                                DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), log_startdatetime),
                                LEAD(log_startdatetime) OVER (PARTITION BY LV_Task.tsk_ActualUserID ORDER BY log_ID)
                            ),
                            0
                        )
                        ELSE CAST('00:00:00' AS TIME)
                    END,
                    'HH:mm:ss'
                ) AS BreakTime,
                FORMAT(DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), 0), 'HH:mm:ss') AS TotalDuration,
                lv_log.log_TotalDuration AS TotalDurationMs,
                DATEDIFF(SECOND, '00:00:00',
                    CASE
                        WHEN LEAD(log_startdatetime) OVER (PARTITION BY LV_Task.tsk_ActualUserID ORDER BY log_ID) >= 
                             DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), log_startdatetime)
                        THEN DATEADD(
                            SECOND,
                            DATEDIFF(
                                SECOND,
                                DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), log_startdatetime),
                                LEAD(log_startdatetime) OVER (PARTITION BY LV_Task.tsk_ActualUserID ORDER BY log_ID)
                            ),
                            0
                        )
                        ELSE CAST('00:00:00' AS TIME)
                    END
                ) AS BreakTimeSeconds
                FROM lv_log
                INNER JOIN LV_logstock ON lv_log.log_id = LV_logstock.lsk_logid
                INNER JOIN LV_Product ON LV_logstock.lsk_ProductID = LV_Product.prd_id
                INNER JOIN LV_Location ON LV_logstock.lsk_LocationID = LV_Location.loc_id
                INNER JOIN LV_Task ON lv_log.log_taskid = LV_Task.tsk_ID
                INNER JOIN LV_TransactionType ON lv_log.log_TransactionTypeID = LV_TransactionType.trt_id
                INNER JOIN lv_users ON lv_log.log_UserID = lv_users.usr_id
                INNER JOIN COM_Person ON per_ID = usr_PersonID
                LEFT JOIN LV_ItemUnit ON LV_Task.tsk_ItemUnitID = LV_ItemUnit.itu_ID
                LEFT JOIN LV_Unit ON LV_Task.tsk_ContUnitID = LV_Unit.unt_ID OR LV_ItemUnit.itu_UnitID = LV_Unit.unt_ID
                WHERE CAST(lv_log.log_DateTime AS DATE) = @DateFrom
                AND ISNULL(lv_log.log_TotalDuration, 0) > 0
                GROUP BY lv_log.log_id, trt_MessageCode, per_FirstName, per_LastName,
                         tsk_FromLocationCode, tsk_ToLocationCode, tsk_Code,
                         LV_Task.tsk_ActualUserID, log_TotalDuration, log_startdatetime
                ORDER BY log_id;
            ";

            var result = await _dataAccess.GetDataInline<TaskReportModel, dynamic>(sql, new { DateFrom = dateFrom });
            return result;
        }
        public async Task<UserTaskDetailResponse> GetUserTaskDetail(string url)
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

            var fullUrl = new Uri(client.BaseAddress, url);

            try
            {
                var response = await client.GetAsync(fullUrl);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new UserTaskDetailResponse
                    {
                        error = 1,
                        message = $"Error occurred while fetching User Task. Status: {response.StatusCode}"
                    };
                }

                // Deserialize into a dynamic structure to extract fields from API response
                var jsonObject = JsonConvert.DeserializeObject<dynamic>(responseContent);

                bool isSuccess = jsonObject["IsSuccess"];
                string message = jsonObject["Message"];
                int totalRecords = jsonObject["TotalRecords"];

                // Deserialize "Data" array into your model list
                var dataJson = jsonObject["Data"].ToString();
                var data = JsonConvert.DeserializeObject<IEnumerable<UserTaskDetailModel>>(dataJson);

                // Return mapped response
                return new UserTaskDetailResponse
                {
                    error = isSuccess ? 0 : 1,
                    message = message,
                    data = data,
                    TotalRecords = totalRecords
                };
            }
            catch (Exception ex)
            {
                return new UserTaskDetailResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }
        public async Task<LogDetailsResponse> GetUserTaskLogDetail(LogDetailsRequest request)
        {
            // Clean "(India Standard Time)" or any parentheses part
            var cleanedDate = Regex.Replace(request.date ?? string.Empty, @"\s*\(.*\)$", "").Trim();
            string dateFrom;

            string[] formats = {
                "ddd MMM dd yyyy HH:mm:ss 'GMT'K",
                "ddd MMM dd yyyy HH:mm:ss 'GMT'zzz",
                "yyyy-MM-dd"
            };

            if (DateTimeOffset.TryParseExact(cleanedDate, formats, CultureInfo.InvariantCulture,
                                             DateTimeStyles.None, out var parsedDate))
            {
                dateFrom = parsedDate.ToString("yyyy-MM-dd");
            }
            else if (DateTime.TryParse(cleanedDate, out var fallbackDate))
            {
                dateFrom = fallbackDate.ToString("yyyy-MM-dd");
            }
            else
            {
                dateFrom = DateTime.Now.ToString("yyyy-MM-dd");
            }

            int pageSize = request.lazyState?.rows ?? 25;
            int skip = request.lazyState?.first ?? 0;

            var sortColumnMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "tsk_Code", "LV_Task.tsk_Code" },
                { "prd_PrimaryCode", "LV_Product.prd_PrimaryCode" },
                { "usr_Login", "lv_users.usr_Login" },
                { "log_DateTime", "lv_log.log_DateTime" },
                { "log_ID", "lv_log.log_ID" }
            };

            string? sortField = request.lazyState?.sortField?.Trim();
            string sortBy = sortColumnMap.ContainsKey(sortField ?? string.Empty)
                ? sortColumnMap[sortField!]
                : "lv_log.log_ID";

            string? sortOrderStr = request.lazyState?.sortOrder?.ToString()?.Trim();
            string sortType = sortOrderStr == "1" || sortOrderStr?.Equals("asc", StringComparison.OrdinalIgnoreCase) == true
                ? "ASC"
                : sortOrderStr == "-1" || sortOrderStr?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true
                    ? "DESC"
                    : "ASC";

            string? id = request.id;

            // Base FROM + WHERE
            string baseQuery = @"
                FROM lv_log
                INNER JOIN LV_logstock 
                    ON lv_log.log_id = LV_logstock.lsk_logid
                INNER JOIN LV_Product 
                    ON LV_logstock.lsk_ProductID = LV_Product.prd_id
                INNER JOIN LV_Location 
                    ON LV_logstock.lsk_LocationID = LV_Location.loc_id
                INNER JOIN LV_Task 
                    ON lv_log.log_taskid = LV_Task.tsk_ID
                INNER JOIN LV_TransactionType 
                    ON lv_log.log_TransactionTypeID = LV_TransactionType.trt_id
                INNER JOIN lv_users 
                    ON lv_log.log_UserID = lv_users.usr_id
                LEFT JOIN LV_ItemUnit 
                    ON LV_Task.tsk_ItemUnitID = LV_ItemUnit.itu_ID
                LEFT JOIN LV_Unit 
                    ON (LV_Task.tsk_ContUnitID = LV_Unit.unt_ID OR LV_ItemUnit.itu_UnitID = LV_Unit.unt_ID)

                WHERE CAST(lv_log.log_DateTime AS DATE) = @Date
                AND lv_users.usr_ID = @UserId
             ";

            if (request.lazyState?.filters != null)
            {
                foreach (var filter in request.lazyState.filters)
                {
                    var filterValue = filter.Value?.value?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(filterValue))
                        baseQuery += $" AND {filter.Key} LIKE '%' + @{filter.Key} + '%' ";
                }
            }

            string groupByClause = @"
                GROUP BY
                    lv_log.log_id,
                    LV_TransactionType.trt_MessageCode,
                    LV_Product.prd_PrimaryCode,
                    lv_users.usr_Login,
                    LV_Task.tsk_FromLocationCode,
                    LV_Task.tsk_ToLocationCode,
                    LV_Task.tsk_Code,
                    LV_Task.tsk_Quantity,
                    LV_Unit.unt_code,
                    lv_log.log_TotalDuration,
                    lv_log.log_startdatetime,
                log_TotalDuration
            ";

            // FIX: COUNT must match GROUP BY count
            string countQuery = $@"
                SELECT COUNT(*) FROM (
                    SELECT lv_log.log_id
                    {baseQuery}
                    {groupByClause}
                ) AS X;
            ";

            string orderByClause = $"ORDER BY {sortBy} {sortType}";

            string selectQuery = $@"
                SELECT 
                    lv_log.log_id,
                    LV_TransactionType.trt_MessageCode,
                    LV_Product.prd_PrimaryCode,
                    lv_users.usr_Login,
                    LV_Task.tsk_FromLocationCode,
                    LV_Task.tsk_ToLocationCode,
                    LV_Task.tsk_Code,
                    CAST(LV_Task.tsk_Quantity AS INT) AS tsk_Quantity,
                    LV_Unit.unt_code,
                    lv_log.log_TotalDuration,
                    FORMAT(lv_log.log_startdatetime, 'HH:mm:ss') AS StartTime,
                    FORMAT(
                        DATEADD(MILLISECOND, ISNULL(lv_log.log_TotalDuration, 0), lv_log.log_startdatetime),
                        'HH:mm:ss'
                    ) AS FinishTime,
                    FORMAT(
                        CASE
                            WHEN LEAD(log_startdatetime) OVER (ORDER BY log_ID) 
                                 >= DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), log_startdatetime)
                            THEN DATEADD(
                                SECOND,
                                DATEDIFF(
                                    SECOND,
                                    DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), log_startdatetime),
                                    LEAD(log_startdatetime) OVER (ORDER BY log_ID)
                                ),
                                0
                            )
                            ELSE '00:00:00'
                        END,
                        'HH:mm:ss'
                    ) AS BreakTime,
                    FORMAT(
                        DATEADD(MILLISECOND, ISNULL(log_TotalDuration, 0), 0),
                        'HH:mm:ss'
                    ) AS TotalDuration

                    {baseQuery}
                    {groupByClause}
                    {orderByClause}
                    OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY;
            ";

            var parameters = new DynamicParameters();
            parameters.Add("@Date", dateFrom);
            parameters.Add("@UserId", id);
            parameters.Add("@Skip", skip);
            parameters.Add("@Take", pageSize);

            if (request.lazyState?.filters != null)
            {
                foreach (var filter in request.lazyState.filters)
                {
                    var filterValue = filter.Value?.value?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(filterValue))
                        parameters.Add($"@{filter.Key}", filterValue);
                }
            }

            var totalRecords = (await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters)).FirstOrDefault();
            var data = await _dataAccess.GetDataInline<LogDetailsData, dynamic>(selectQuery, parameters);

            return new LogDetailsResponse
            {
                data = data,
                totalRecords = totalRecords,
                message = "Successfully fetched log details"
            };
        }

        public async Task<IEnumerable<UserOrderDetailDto>> GetUserOrderDetail(UserOrderDetailRequest request)
        {
            var sql = @"
                SELECT 
                    OrderDetail.OrderCode,
                    OrderDetail.OrderStatus
                FROM COM_Employee e
                JOIN LV_Users u ON e.emp_PersonID = u.usr_PersonID
                JOIN COM_Person p ON u.usr_PersonID = p.per_ID
                JOIN (
                    SELECT DISTINCT 
                        t.tsk_ExpUserID,
                        o.ord_Code AS OrderCode,
                        REPLACE(os.pst_MessageCode, 'Status_', '') AS OrderStatus
                    FROM LV_Task t
                    LEFT JOIN LV_OrderShipItemStock oss ON t.tsk_ID = oss.oss_TaskID
                    LEFT JOIN LV_OrderShipItem osi ON oss.oss_OrderShipItemID = osi.osi_ID
                    LEFT JOIN LV_OrderItem oi ON osi.osi_OrderItemID = oi.ori_ID
                    JOIN LV_Order o ON oi.ori_OrderID = o.ord_ID
                    JOIN LV_ProgressStatus os ON o.ord_StatusID = os.pst_ID
                    WHERE t.tsk_StatusID IN (1, 2)
                    AND CAST(t.tsk_CreateTime AS DATE) = @DateFilter
                ) AS OrderDetail
                    ON OrderDetail.tsk_ExpUserID = e.emp_id
                WHERE (p.per_FirstName + ' ' + p.per_LastName) LIKE @NameFilter
            ";

            var parameters = new
            {
                DateFilter = DateTime.Parse(request.Date).ToString("yyyy-MM-dd"),
                NameFilter = $"%{request.User_Name}%"
            };

            return await _dataAccess.GetDataInline<UserOrderDetailDto, dynamic>(sql, parameters);
        }

    }
}


