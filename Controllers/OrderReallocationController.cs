using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderReallocationController : ControllerBase
    {
        private readonly IOrderReallocationService _orderReallocationService;

        public OrderReallocationController(IOrderReallocationService orderReallocationService)
        {
            _orderReallocationService = orderReallocationService;
        }

        [HttpPost("get-orders")]
        public async Task<IActionResult> GetOrders([FromBody] GridRequest request)
        {
            try
            {
                var result = await _orderReallocationService.GetOrders(request);
                if (result.Error == 1)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new
                    {
                        error = result.Error,
                        data = result.Data,
                        totalRecords = result.TotalRecords,
                        message = "Successfully fetched data"
                    });
                }

            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while getting orders",
                    exception = ex.Message
                });
            }
        }

        [HttpPost("get-order-ship-items")]
        public async Task<IActionResult> GetOrderShipItems([FromBody] OrderItemsGridRequest request)
        {
            try
            {
                var result = await _orderReallocationService.GetOrderShipItems(request);
                if (result.Error == 1)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new
                    {
                        data = result.Data,
                        error = result.Error,
                        totalRecords = result.TotalRecords,
                        message = result.Message,
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while getting orders",
                    exception = ex.Message
                });
            }
         
        }
    }
}
