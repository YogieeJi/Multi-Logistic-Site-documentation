using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TruckController : ControllerBase
    {
        private readonly ITruckService _truckService;

        public TruckController(ITruckService truckService)
        {
            _truckService = truckService;
        }

        [HttpPost("get-truck-list")]
        public async Task<IActionResult> GetTruckList()
        {
            try
            {
                var result = await _truckService.GetTruckList();
                return Ok( new {
                    data = result.Data,
                    error = result.Error,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-all-trucks-details")]
        public async Task<IActionResult> GetAllTrucksDetails()
        {
            try
            {
                var result = await _truckService.GetAllTrucksDetails();
                if (result.Error == 1)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message ?? "All truck details do not exist"
                    });
                }
                return Ok(new
                {
                    data = result.Data,
                    error = result.Error,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-truck-detail")]
        public async Task<IActionResult> GetTruckDetail([FromBody] TruckDetailRequest request)
        {
            try
            {
                var result = await _truckService.GetTruckDetail(request);
                if (result.Error == 1)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message ?? "Truck details do not exist"
                    });
                }

                return Ok(new
                {
                    error = 0,
                    data = result.Data,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
           
        }
    }
}
