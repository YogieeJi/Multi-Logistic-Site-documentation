using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryController : ControllerBase
    {
        private readonly IDeliveryService _deliveryService;

        public DeliveryController(IDeliveryService deliveryService)
        {
            _deliveryService = deliveryService;
        }

        [HttpPost("create-delivery-imported-orders")]
        public async Task<IActionResult> manualCreateDelivery([FromBody] DeliveryOrderRequest orders)
        {
            var result = await _deliveryService.CreateDeliveriesNew(orders);
            return Ok(result);
        }
        //[HttpPost("create-delivery-imported-orders-new")]
        //public async Task<IActionResult> manualCreateDeliveryNew([FromBody] DeliveryOrderRequest orders)
        //{
        //    var result = await _deliveryService.CreateDeliveriesNew(orders);
        //    return Ok(result);
        //}
        [HttpPost("Check-PickList-Item-Job-new")]
        public async Task<IActionResult> CheckPickListItemLotJobNew([FromBody] CheckPickListItemJobPayload payload)
        {
            try
            {
                var result = await _deliveryService.CheckPickListItemLotJobNew(payload);

                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return BadRequest(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("order-export-new")]
        public async Task<IActionResult> orderexportnew([FromBody] OrderExportPayload payload)
        {
            try
            {
                var result = await _deliveryService.orderexportNEW(payload);

                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return BadRequest(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("Check-PickList-Item-Job")]
        public async Task<IActionResult> CheckPickListItemLotJob([FromBody] CheckPickListItemJobPayload payload)
        {
            try
            {
                var result = await _deliveryService.CheckPickListItemLotJob(payload);

                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return BadRequest(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("order-export")]
        public async Task<IActionResult> orderexport([FromBody] OrderExportPayload payload)
        {
            try
            {
                var result = await _deliveryService.orderexport(payload);

                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return BadRequest(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }
    }
}
