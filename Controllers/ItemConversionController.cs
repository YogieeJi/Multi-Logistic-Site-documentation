using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemConversionController : ControllerBase
    {
        private readonly IItemConversionService _service;

        public ItemConversionController(IItemConversionService service)
        {
            _service = service;
        }

        [HttpPost("get-item-conversions")]
        public async Task<IActionResult> GetGrid([FromBody] GridRequest request)
        {
            try
            {
                var result = await _service.GetGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    message = "Successful",
                    template_url = result.TemplateUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-uoms")]
        public async Task<IActionResult> GetUOMList([FromBody] UOMRequest request)
        {
            var result = await _service.GetUOMList(request.sku);
            return Ok(new { data = result });
        }

        [HttpPost("add-item-conversion")]
        public async Task<IActionResult> AddItem([FromBody] AddItemRequest request)
        {
            var result = await _service.AddItem(request);
            return Ok(result);
        }

        [HttpPost("delete-item-conversion")]
        public async Task<IActionResult> DeleteItem([FromBody] DeleteItemRequest request)
        {
            try
            {
                await _service.DeleteItem(request.id);
                return Ok(new { error = 0, message = "Item Conversion Deleted Successfully" });
            }
            catch(Exception ex)
            {
                return Ok(new { error = 1, message = "Error while deleting item | " + ex.Message });
            }
        }

        [HttpPost("get-item-conversion/{sku_mantis}")]
        public async Task<IActionResult> GetDetail(string? sku_mantis)
        {
            try
            {
                var result = await _service.GetDetail(sku_mantis);
                return Ok(new { data = result });
            }
            catch (Exception ex) 
            {
                return Ok(new { error = 1, message = "Error Fetching item Details | " + ex.Message });
            }
        }

        [HttpPost("update-item-conversion/{sku_mantis}")]
        public async Task<IActionResult> UpdateItem(AddItemRequest request,string? sku_mantis)
        {
            try
            {
                var success = await _service.UpdateItem(request, sku_mantis);
                if (success)
                {
                    return Ok(new { error = 0, message = "Item updated Successfully" });
                }
                else
                    return Ok(new { error = 1, message = "Item not found or no changes made" });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Error while updating Item | " + ex.Message });
            }
        }

        [HttpPost("upload-item-conversion")]
        public async Task<IActionResult> UpdateItems([FromBody] List<ItemConversions> items)
        {
            try
            {
                var result = await _service.UpdateItems(items);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Could not upload file | " + ex.Message });
            }
        }
    }
}
