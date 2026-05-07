using System.Web.Http.Controllers;
using iText.StyledXmlParser.Css.Resolve.Shorthand.Impl;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemLotExpiryController : ControllerBase
    {
        private readonly IItemLotExpiryService _expiryService;

        public ItemLotExpiryController(IItemLotExpiryService expiryService)
        {
            _expiryService = expiryService;
        }

        [HttpPost("get-item-lot-exp")]
        public async Task<IActionResult> GetGrid(GridRequest request)
        {
            try
            {
                var result = await _expiryService.GetGrid(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });

            }
        }

        [HttpPost("get-item-lot-exp/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            try
            {
                var result = await _expiryService.GetDetail(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });

            }
        }

        [HttpGet("get-lv-products")]
        public async Task<IActionResult> GetLVProducts()
        {
            try
            {
                var result = await _expiryService.GetLVProducts();

                if (result.error == 0)
                    return Ok(result);
                else
                    return StatusCode(500, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });

            }
        }

        [HttpPost("update-item-lot-exp/{id}")]
        public async Task<IActionResult> Update([FromBody] UpdateItemLotExpiryRequest request, int id)
        {
            try
            {
                var result = await _expiryService.Update(request, id);
                if (result.Error == 0)
                    return Ok(new { error = result.Error, message = result.Message });
                else
                    return StatusCode(500, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });

            }
        }


        [HttpPost("add-item-lot-exp")]
        public async Task<IActionResult> Add([FromBody] AddItemLotExpiryRequest request)
        {
            try
            {
                var result = await _expiryService.Add(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApisResponse
                {
                    Error = 1,
                    Message = "Internal Server Error | " + ex.Message
                });
            }
        }
    }

}

