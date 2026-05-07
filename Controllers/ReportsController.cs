using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController:ControllerBase
    {
        private readonly IReportService _ReportService;

        public ReportsController(IReportService reportService)
        {
            _ReportService = reportService;
        }
        [HttpPost("get-reports")]
        public async Task<IActionResult> getReports([FromBody] ReportRequest request)
        {
            try
            {
                var result = await _ReportService.getReports(request.module);

                if (result.error == 0)
                {
                    return Ok(new { error = result.error, data = result.data});
                }
                else
                {
                    return BadRequest(new { error = result.error, message = "No record found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while searching reports | " + ex.Message
                });
            }
        }
        [HttpPost("get-report-filter/{id}")]
        public async Task<IActionResult> getReportFilter(int id)
        {
            try
            {
                var result = await _ReportService.getReportFilter(id);
                if (result.error == 0)
                {
                    return Ok(new { error = 0, data = result.data });
                }
                else
                {
                    return Ok(new { error = result.error, message = result.message ?? "No record found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while searching reports | " + ex.Message
                });
            }
        }
        [HttpPost("export-report/{id}")]
        public async Task<IActionResult> exportReport([FromBody] reportexportrequest? request , int id)
        {
            try
            {
                var result = await _ReportService.exportReport(request,id);
                if (result.Error == 0)
                {
                    return Ok(new { error = 0, data = result.Data });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message ?? "No record found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while searching reports | " + ex.Message
                });
            }
        }
  
        [HttpPost("view-report/{id}")]
        public async Task<IActionResult> viewReport(reportexportrequest? request, int id)
        {
            try
            {
                var result = await _ReportService.viewReport(request, id);
                if (result.error == 0)
                {
                    return Ok(new
                    {
                        error = 0,
                        message = result.message ?? "Successfull",
                        data = result.data,
                        totalRecords = result.totalRecords,
                        columns_array = result.columns_array,
                        report_name = result.report_name
                    });
                }
                else
                {
                    return Ok(new { error = result.error, message = result.message ?? "No record found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while searching reports | " + ex.Message
                });
            }
        }

    }
}
