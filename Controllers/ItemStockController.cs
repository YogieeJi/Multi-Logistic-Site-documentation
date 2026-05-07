using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemStockController : ControllerBase
    {
        private readonly IItemStockService _itemStockService;
        public ItemStockController(IItemStockService service)
        {
            _itemStockService = service;
        }
        [HttpPost("item-stock")]
        public async Task<IActionResult> GetItemStock(GridRequest request)
        {
            try
            {
                var result = await _itemStockService.GetItemStock(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpGet("get-stock-reservereasons")]
        public async Task<IActionResult>GetStockReserveReasons()
        {
            try
            {
                var result = await _itemStockService.GetStockReserveReasons();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("add-reservation-reason")]
        public async Task<IActionResult> AddReservationReason([FromBody] SplitStockRequest request)
        {
            try
            {
                var response = await _itemStockService.AddReservationReason(request);
                return Ok(response);
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }
        [HttpPost("remove-reservation-reason")]
        public async Task<IActionResult> RemoveReservationReason([FromBody] RemoveSplitStockRequest request)
        {
            try
            {
                var response = await _itemStockService.RemoveReservationReason(request);
                return Ok(response);
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }

    }
}

