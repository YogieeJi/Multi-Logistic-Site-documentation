using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FailedJobsController : ControllerBase
    {
        private readonly IFailedJobsService _service;

        public FailedJobsController(IFailedJobsService service)
        {
            _service = service;
        }

        [HttpPost("failed-jobs")]
        public async Task<IActionResult> GetFailedJobs([FromBody] GridRequest request)
        {
            try
            {
                var result = await _service.GetFailedJobs(request);
                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("failed-jobs/delete/{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                var result = await _service.Delete(id);
                if (result.Error == 0)
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
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }


        [HttpPost("failed-jobs/retry/{id}")]
        public async Task<IActionResult> Retry(long id)
        {
            try
            {
                var result = await _service.Retry(id);
                if (result.Error == 0)
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
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }
    }
}
