using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManageTrucksController : ControllerBase
    {
        private readonly IManageTrucksService _truckService;

        public ManageTrucksController(IManageTrucksService truckService)
        {
            _truckService = truckService;
        }

        [HttpPost("get-trucks")]
        public async Task<IActionResult> GetTruckList([FromBody] GridRequest request)
        {
            try
            {
                var result = await _truckService.GetTruckList(request);
                return Ok(new {
                    data = result.Data, 
                    totalRecords = result.TotalCount, 
                    message = "Successful" 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("add-truck")]
        public async Task<IActionResult> AddTruck([FromBody] AddTruckRequest request)
        {
            try
            {
                var result = await _truckService.AddTruck(request);
                if (result.IsSuccess)
                    return Ok(new { error = 0, message = result.Message });

                return Ok(new { error = 1, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("get-truck-shipment")]
        public async Task<IActionResult> GetTruckShipments([FromBody] GridRequest request)
        {
            try
            {
                var result = await _truckService.GetTruckShipments(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    message = result.Message,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-shipment-list")]
        public async Task<IActionResult> GetShipment([FromBody] ShipmentGridRequest request)
        {
            try
            {
                var result = await _truckService.GetShipments(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    message = result.Message,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
    }
}
