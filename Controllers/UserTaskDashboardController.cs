using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserTaskDashboardController : ControllerBase
    {
        private readonly IUserTaskDashboardService _userTaskDashboardService;
        public UserTaskDashboardController(IUserTaskDashboardService userTaskDashboardService)
        {
            _userTaskDashboardService = userTaskDashboardService;
        }
        [HttpPost("getUserTaskGrid")]
        public async Task<IActionResult> GetUserTaskGrid([FromBody] UserTaskGridRequest request)
        {
            try
            {
                var result = await _userTaskDashboardService.GetUserTaskGrid(request);

                // If there is an error but it's not a system failure (e.g., "No record found"), return 200
                if (result.Error == 1 && result.Message == "No record found.")
                {
                    return Ok(new { error = result.Error, message = result.Message, totalRecords = result.TotalRecords });

                }
                // For actual internal failures, return 500
                if (result.Error == 1)
                {
                    return StatusCode(500, result);

                }

                return Ok(new { error = result.Error, data = result.data, totalRecords = result.TotalRecords });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-task-report")]
        public async Task<IActionResult> GetTaskReport(TaskReportRequest request)
        {
            var result = await _userTaskDashboardService.GetTaskReport(request);
            try
            {

                if (result.Error == 1)
                {
                    return Ok(result);

                }
                else
                {
                    return Ok(new { data = result.Data, error = result.Error, message = result.Message, totalRecords = result.TotalRecords });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-task-pdf-report")]
        public async Task<IActionResult> GetTaskPdfReport([FromBody] TaskReportRequest request)
        {
            try
            {
                var result = await _userTaskDashboardService.GetTaskReport(request);

                if (request.Pdf)
                {
                    // Extract the data
                    var dataForPdf = result.Data?.ToList() ?? new List<TaskReportModel>();

                    var totalDurationFilter = request.LazyState.Filters["TotalDuration"]?.Value;
                    var breakTimeFilter = request.LazyState.Filters["BreakTime"]?.Value;


                    // Call  PDF generator
                    var pdfBytes = await PdfGenerator.GenerateTaskReportPdf(
                        dataForPdf,
                        request.DateFrom,
                        totalDurationFilter,
                        breakTimeFilter
                    );


                    // Return as a downloadable PDF
                    return File(pdfBytes, "application/pdf", "TaskReport.pdf");
                }

                // Normal JSON response
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfully fetched log details"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("getUserTaskDetail")]
        public async Task<IActionResult> GetUserTaskDetail([FromBody] UserTaskDetailRequest request)
        {
            try
            {
                var response = await _userTaskDashboardService.GetUserTaskDetail(request);
                return Ok(new { data = response.data, error = response.error, TotalRecords = response.TotalRecords });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("getUserTaskLogDetail")]
        public async Task<IActionResult> GetUserTaskLogDetail([FromBody] LogDetailsRequest request)
        {
            try
            {
                var result = await _userTaskDashboardService.GetUserTaskLogDetail(request);

                return Ok(new
                {
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "Successfully fetched log details"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("get-user-order-detail")]
        public async Task<IActionResult> GetUserOrderDetail([FromBody] UserOrderDetailRequest request)
        {
            try
            {
                var data = await _userTaskDashboardService.GetUserOrderDetail(request);

                return Ok(new
                {
                    error = 0,
                    data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = ex.Message
                });
            }
        }

    }
}
