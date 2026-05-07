using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingController : ControllerBase
    {
        private readonly ISettingService _settingService;

        public SettingController(ISettingService settingService)
        {
            _settingService = settingService;
        }

        [HttpPost("settings/schedulers/get")]
        public async Task<IActionResult> GetSchedulerList()
        {
            var result = await _settingService.GetSchedulerList();
            return Ok(new { data = result.Data, error = result.Error, message = result.Message });
        }

        [HttpPost("settings/schedulers/set")]
        public async Task<IActionResult> SetSchedulerList([FromBody] SetSchedulerRequest request)
        {
            var (isSuccess, message) = await _settingService.SetSchedulerList(request);
            return StatusCode(isSuccess ? 201 : 200, new { error = isSuccess ? 0 : 1, message });
        }
    }
}
