using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IMantisService _itemsService;
        private readonly IOrderService _orderService;
        public OrderController(IMantisService itemsService, IOrderService orderService)
        {
            _itemsService = itemsService;
            _orderService = orderService;
        }
        [HttpGet]
        [Route("GetDetails")]
        public async Task<IActionResult> GetDetails()
        {
            Mantis mentis1 = new Mantis();
            try
            {
                var Data = await _itemsService.GetVendorDetails(mentis1);
                return Ok(new
                {
                    Data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpGet]
        [Route("GetVendorById")]
        public async Task<IActionResult> GetVendorById(int Id)
        {
            Mantis mentis2 = new Mantis();
            try
            {
                var Data = await _itemsService.GetVendorDataById(Convert.ToInt32(Id));
                return Ok(new
                {
                    Data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("orders")]
        public async Task<IActionResult> Getordertasks([FromBody] GridRequest request)
        {
            try
            {
                var result = await _itemsService.Getordertasks(request);
                return Ok(new { result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("order/delete")]
        public async Task<IActionResult> deleteTask([FromBody] DeleteOutboundShipmentRequest request)
        {
            try
            {
                var result = await _itemsService.deleteTask(request.Id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while processing shipment deletion: {ex.Message}" });
            }
        }

        [HttpPost("getOrderDetail")]
        public async Task<IActionResult> GetOrderDetail([FromBody] OrderDetailRequest request)
        {
            try
            {
                var result = await _orderService.GetOrderDetail(request);

                if (result.Error == 1)
                    return Ok(new { error = 1, message = result.Message });

                return Ok(new
                {
                    error = result.Error,
                    data = result.Data,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
            
        }
    }
}
