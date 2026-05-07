using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CountController : ControllerBase
    {
        private readonly ICountService _countService;
        public CountController(ICountService countService)
        {
            _countService = countService;
        }

        [HttpGet("GetUsers")]
        public async Task<IActionResult> GetUsers()
        {
            var response = await _countService.GetUsers();
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }


        [HttpPost("CreateCount")]
        public async Task<IActionResult> CreateCount([FromBody] CreateCountRequest request)
        {
            var result = await _countService.CreateCount(request);
            if (result.Error == 1)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("GetCountCondition")]
        public async Task<IActionResult> GetCountCondition([FromBody] CountRequest request)
        {
            try
            {
                var result = await _countService.GetCountCondition(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = true, message = $"An error occurred while processing the request: {ex.Message}" });
            }
        }

        //[HttpPost("GetSecondUser")]
        //public async Task<IActionResult> GetSecondUser([FromQuery] int discCountId)
        //{
        //    try
        //    {
        //        var users = await _countService.GetSecondUser(discCountId);

        //        if (users == null || !users.Any())
        //        {
        //            return NotFound(new { error = 1, message = "No users found" });
        //        }

        //        return Ok(new { error = 0, message = "Users retrieved successfully.", data = users });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { error = 1, message = ex.Message });
        //    }
        //}

        [HttpPost("UpdateAssign")]
        public async Task<IActionResult> UpdateAssignTo([FromBody] UpdateAssignRequest request)
        {
            try
            {
                var updated = await _countService.UpdateAssignTo(request.CountId, request.User);

                if (updated == null)
                {
                    return Ok(new { error = 0, message = "User updated successfully." });
                }
                else
                {
                    return NotFound(new { error = 1, message = "Count ID not found." });
                }
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

    }
}
