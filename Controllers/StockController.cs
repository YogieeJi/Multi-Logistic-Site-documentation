using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockController : ControllerBase
    {
        private readonly IStockService _stockService;

        public StockController(IStockService service)
        {
            _stockService = service;
        }
        [HttpPost("get-customer-attributes")]
        public async Task<IActionResult> GetCustomerAttributes(GridRequest request)
        {
            try
            {
                var result = await _stockService.GetCustomerAttributes(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpGet("get-Order-Type")]
        public async Task<IActionResult> GetOrderTypes()
        {
            try
            {
                var result = await _stockService.GetOrderTypes();

                return Ok(new
                {
                    error = 0,
                    data = result.Data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Failed to fetch order types: " + ex.Message
                });
            }
        }
        [HttpPost("insert-customer-attribute")]
        public async Task<IActionResult> InsertCustomerAttribute([FromBody] CustomerAttributeRequest request)
        {
            try
            {
                var result = await _stockService.InsertCustomerAttribute(request);
                return Ok(new
                {
                    error=result.Error,
                    message=result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApisResponse
                {
                    Error = 1,
                    Message = "Error: " + ex.Message
                });
            }
        }
    }
}
