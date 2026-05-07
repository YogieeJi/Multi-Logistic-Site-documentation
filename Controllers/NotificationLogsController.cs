using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationLogsController : ControllerBase
    {
        private readonly INotificationLogsService _notificationLogsService;

        public NotificationLogsController(INotificationLogsService notificationLogsService)
        {
            _notificationLogsService = notificationLogsService;
        }

        [HttpPost("get-notification-logs")]
        public async Task<IActionResult> GetNotificationLogs([FromBody] NotificationLogsRequest request)
        {
            try
            {
                var result = await _notificationLogsService.GetNotificationLogs(request);
                return Ok(new
                {
                    data = result,
                    message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
    }
}
