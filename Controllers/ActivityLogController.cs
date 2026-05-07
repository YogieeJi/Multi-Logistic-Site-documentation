using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogService _service;

        public ActivityLogController(IActivityLogService service)
        {
            _service = service;
        }

        [HttpPost("get-inbound-logs")]
        public async Task<IActionResult> GetInboundLogs([FromBody] InboundLogRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                //var result = await _service.GetLogs(request, "Inbound");
                var result = await _service.GetInboundLogs(request);


                return Ok(new { data = result.Data, totalRecords = result.TotalCount, Message = "Successful", historyCreatedAt=result.HistoryCreatedAt});
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-targeted-logs")]
        public async Task<IActionResult> GetTargetedLogs([FromBody] TargetedLogsRequest request)
        {
            try
            {
                var logs = await _service.GetTargetedLogs(request.ModuleId, request.SubModuleId, request.SubjectId);
                return Ok(new { error = 0, data = logs });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-targeted-logs-for-orders")]
        public async Task<IActionResult> GetTargetedLogsfororders([FromBody] TargetedLogsRequestfororders request)
        {
            try
            {
                var logs = await _service.GetTargetedLogsfororders(request.ModuleId, request.SubModuleId, request.SubjectId);
                return Ok(new { error = 0, data = logs });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }


        [HttpPost("get-outbound-logs")]
        public async Task<IActionResult> GetOutboundLogs([FromBody] OutboundLogRequest request)
        {
            try
            {
                var result = await _service.GetOutboundLogs(request);
                //var result = await _service.GetLogs(request ,"Outbound");


                return Ok(new { data = result.Data, totalRecords = result.TotalCount, Message = "Successful",historyCreatedAt=result.HistoryCreatedAt });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpGet("archive-activity-logs")]
        public async Task<IActionResult> ArchiveActivityLogs()
        {
            var result = await _service.ArchiveActivityLogs();
            if (result.Error == 0)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result);
            }
        }

    }
}
