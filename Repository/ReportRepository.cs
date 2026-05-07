using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using MiddlewareWebAPI.Data.IRepository;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.Model;
using Microsoft.Extensions.Configuration;
using System.Collections;
using iText.Signatures.Validation.Report;
using System.Collections.Frozen;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ReportRepository: IReportRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly string? _connectionString;
        private readonly UrlConstants _urlConstants;
        private readonly IWebHostEnvironment _env;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ReportRepository(ISqlDataAccess dataAccess, IWebHostEnvironment env,IConfiguration configuration, UrlConstants urlConstants, IHttpContextAccessor httpContextAccessor)
        {
            _dataAccess = dataAccess;
            _connectionString = configuration.GetConnectionString("con");
            _urlConstants = urlConstants;
            _env = env;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<ReportResponseResult> getReports(string module)
        {
            try
            {
                var query = "SELECT id, report_name, add_filter, filter_type FROM Cus_DynamicReports WHERE is_active = 1 and module = @module";

                var parameters = new DynamicParameters();

                parameters.Add("@module", module);

                var result = await _dataAccess.GetDataInline<Reportdata, dynamic>(query, parameters);

                return new ReportResponseResult
                {
                    data = result.ToList()
                };
            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task<ReportFilterResponseResult> getReportFilter(int id)
        {
            try
            {
                var reports = "SELECT TOP 1 * FROM cus_dynamicreports WHERE id = @id  AND add_filter = 1  AND filter_type = 'drop_down'";

                var parameters = new DynamicParameters();

                parameters.Add("@id", id);

                var result = await _dataAccess.GetDataInline<reportItem, dynamic>(reports, parameters);
                var report = result.FirstOrDefault();
                if (report != null)
                {
                    if (!string.IsNullOrWhiteSpace(report.filter_query))
                    {
                         var filter = await _dataAccess.GetDataInline<dynamic, dynamic>(report.filter_query, new { });
                       
                        if (filter == null || !filter.Any())
                        {
                            return new ReportFilterResponseResult
                            {
                                error = 1,
                                message = "No record found",
                            };
                        }
                        return new ReportFilterResponseResult
                        {
                            error = 0,
                            data = filter.ToList(),
                        };
                    }
                    return new ReportFilterResponseResult
                    {
                        error = 1,
                        message = "No record found",
                    };
                }
                else
                {
                    return new ReportFilterResponseResult
                    {
                        error = 1,
                        message = "No record found",
                    };
                }

                   
            }
            catch (Exception ex)
            {
                return new ReportFilterResponseResult { error = 1, message = "Internal Server Error | " + ex.Message };
            }
        }

        //public async Task<ReportFilterResponseResult> exportReport(reportexportrequest request, int id)
        //{
        //    try
        //    {
        //        string finalQuery = "";
        //        if (request != null)
        //        {
        //            var query = "SELECT * FROM Cus_DynamicReports WHERE id = @id";
        //            var parameters = new DynamicParameters();
        //            parameters.Add("@id", id);
        //            var result = await _dataAccess.GetDataInline<reportItem, dynamic>(query, parameters);
        //            var report = result.FirstOrDefault();
        //             finalQuery = report.query.Replace("$id", request.filteredData);
        //        }
        //        else
        //        {
        //            var sql = "SELECT * FROM Cus_DynamicReports WHERE id = @id";
        //            var parameters = new DynamicParameters();
        //            parameters.Add("@id", id);

        //            var reportDetails = await _dataAccess.GetDataInline<reportItem, dynamic>(sql, parameters);
        //            var reportDetail = reportDetails.FirstOrDefault();

        //             finalQuery = reportDetail?.query;
        //        }
        //        var results = await _dataAccess.GetDataInline<dynamic, dynamic>(finalQuery, new { });

        //    }
        //    catch (Exception ex)
        //    {
        //        return new ReportFilterResponseResult { error = 1, message = "Internal Server Error | " + ex.Message };
        //    }
        //}

        public async Task<ReportDataResponseResult> exportReport(reportexportrequest? request, int id)
        {
            try
            {
                string finalQuery = "";
                string fileName = "";
                string reportName = "";

                var parameters = new DynamicParameters();
                parameters.Add("@id", id);

                var reportResult = await _dataAccess.GetDataInline<reportItem, dynamic>(
                    "SELECT * FROM Cus_DynamicReports WHERE id = @id",
                    parameters
                );

                var report = reportResult.FirstOrDefault();

                if (report == null)
                {
                    return new ReportDataResponseResult { Error = 1, Message = "Report not found." };
                }

                if (!string.IsNullOrWhiteSpace(request?.filteredData))
                {
                    finalQuery = report.query.Replace("$id", request.filteredData);
                }
                else
                {
                    finalQuery = report.query;
                }

                var results = await _dataAccess.GetDataInline<dynamic, dynamic>(finalQuery, new { });

                if (results == null || !results.Any())
                {
                    return new ReportDataResponseResult { Error = 1, Message = "No data found." };
                }

                fileName = report.report_name?.Replace(" ", "") ?? "Report_" + id;
                reportName = fileName + ".csv";

                var exportFolder = Path.Combine(_env.ContentRootPath, "Storage", "report");
                Directory.CreateDirectory(exportFolder);

                string filePath = Path.Combine(exportFolder, reportName);

                // Delete old file if exists
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }

                // Write to CSV
                using (var writer = new StreamWriter(filePath))
                {
                    var headerWritten = false;

                    foreach (IDictionary<string, object> row in results)
                    {
                        if (!headerWritten)
                        {
                            await writer.WriteLineAsync(string.Join(",", row.Keys));
                            headerWritten = true;
                        }
                        await writer.WriteLineAsync(string.Join(",", row.Values.Select(v => $"\"{v}\"")));
                    }
                }

                // Build absolute URL
                var requestContext = _httpContextAccessor.HttpContext?.Request;
                var baseUrl = $"{requestContext?.Scheme}://{requestContext?.Host}";
                var fileUrl = $"{baseUrl}/Storage/report/{reportName}";

                return new ReportDataResponseResult
                {
                    Error = 0,
                    Data = fileUrl,
                    Message = ""
                };
            }
            catch (Exception ex)
            {
                return new ReportDataResponseResult
                {
                    Error = 1,
                    Message = "Internal Server Error | " + ex.Message
                };
            }
        }

        public async Task<viewReportDataResponseResult> viewReport(reportexportrequest request, int id)
        {
            try
            {
                string finalQuery = "";
                string reportName = "";

                // Step 1: Get report details by ID
                var parameters = new DynamicParameters();
                parameters.Add("@id", id);

                var reportResult = await _dataAccess.GetDataInline<reportItem, dynamic>(
                    "SELECT * FROM Cus_DynamicReports WHERE id = @id",
                    parameters
                );

                var report = reportResult.FirstOrDefault();

                if (report == null)
                {
                    return new viewReportDataResponseResult { error = 1, message = "Report not found." };
                }

                // Step 2: Handle query replacement if filteredData exists
                if (!string.IsNullOrWhiteSpace(request?.filteredData))
                {
                    finalQuery = report.query.Replace("$id", request.filteredData);
                }
                else
                {
                    finalQuery = report.query;
                }

                // Step 3: Execute final query
                var results = await _dataAccess.GetDataInline<dynamic, dynamic>(finalQuery, new { });
                if (results == null || !results.Any())
                {
                    return new viewReportDataResponseResult { error = 1, message = "No Record Found!" };
                }

                // Step 4: Add "id" column to each result AND FIX log_day DATE
                int i = 0;
                foreach (IDictionary<string, object> row in results)
                {
                    row["id"] = i++;
                    // Convert log_day datetime to ONLY date (yyyy-MM-dd)
                    if (row.ContainsKey("log_day") && row["log_day"] != null)
                    {
                        try
                        {
                            if (row["log_day"] is DateTime dt)
                            {
                                row["log_day"] = dt.ToString("yyyy-MM-dd");
                            }
                            else
                            {
                                // for string values that contain datetime
                                DateTime parsed;
                                if (DateTime.TryParse(row["log_day"].ToString(), out parsed))
                                {
                                    row["log_day"] = parsed.ToString("yyyy-MM-dd");
                                }
                            }
                        }
                        catch { }
                    }
                }

                // Step 5: Prepare column list from first row
                var firstRow = (IDictionary<string, object>)results.First();

                // Step 6: Return report data response
                return new viewReportDataResponseResult
                {
                    error = 0,
                    message = "Successful",
                    totalRecords = results.Count(),
                    columns_array = firstRow.Keys.ToList(),
                    report_name = report.report_name,
                    data = results.ToList<dynamic>()
                };
            }
            catch (Exception ex)
            {
                return new viewReportDataResponseResult
                {
                    error = 1,
                    message = "Error while generating reports | " + ex.Message
                };
            }
        }


    }
}
