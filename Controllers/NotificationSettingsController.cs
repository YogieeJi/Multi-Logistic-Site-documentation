using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationSettingsController : ControllerBase
    {
        private readonly INotificationSettingsService _notificationSettingsService;

        public NotificationSettingsController(INotificationSettingsService notificationSettingsService)
        {
            _notificationSettingsService = notificationSettingsService;
        }

        [HttpPost("get-notification-settings")]
        public async Task<IActionResult> GetNotificationSettings([FromBody] NotificationSettingsRequest request)
        {
            try
            {
                var result = await _notificationSettingsService.GetNotificationSettings(request);
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

        [HttpGet("get-order-primary-email")]
        public async Task<IActionResult> GetOrderPrimaryEmail()
        {
            try
            {
                var result = await _notificationSettingsService.GetOrderPrimaryEmail();

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

        [HttpPost("updated-notification")]
        public async Task<IActionResult> UpdatedNotification([FromBody] UpdatedNotificationRequest request)
        {
            try
            {
                var result = await _notificationSettingsService.UpdatedNotification(request); ;

                if (result.Error == 1)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }
    }
}
