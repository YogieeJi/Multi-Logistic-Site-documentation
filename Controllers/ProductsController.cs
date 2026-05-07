using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;


namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductsService _IProductsServices;
        public ProductsController(IProductsService ProductsService)
        {
            _IProductsServices = ProductsService;
        }
        [HttpPost("get-products")]
        public async Task<IActionResult> getProductsGrid([FromBody] ProductGridRequest1 request)
        {
            try
            {
                var result = await _IProductsServices.GetProductsGrid(request);
                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = "Successfully fetched data", template_url = result.TemplateUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Error while getting order task: {ex.Message}" });
            }

        }


        [HttpPost("get-products/{id}")]
        public async Task<IActionResult> getProductsDetails(int id)
        {
            try
            {
                var result = await _IProductsServices.GetProductsDetails(id);
                return Ok(new { data = result.Data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Error while getting order task: {ex.Message}" });
            }
        }
        [HttpPost("update-product/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        {
            var response = await _IProductsServices.UpdateProductAsync(request, id);

            if (response.Error == 0)
                return Ok(response);

            return BadRequest(response);
        }
        [HttpPost("add-product")]
        public async Task<IActionResult> addItems([FromBody] UpdateProductRequest request)
        {
            var response = await _IProductsServices.UpdateProductAsync(request, 0);

            if (response.Error == 0)
                return Ok(response);

            return Ok(new { error = 1, message = response.Message });
        }
       

        [HttpPost("delete-product")]
        public async Task<IActionResult> deleteproduct([FromBody] UpdateProductRequest request)
        {
            var response = await _IProductsServices.UpdateProductAsync(request, 1);

            if (response.Error == 0)
                return Ok(response);

            return Ok(new { error = 1, message = response.Message });
            //return BadRequest(response);
        }
        [HttpPost("get-product-desc")]
        public async Task<IActionResult> GetItemDesc([FromBody] Requestdesc request)
        {
            var result = await _IProductsServices.GetItemDescAsync(request);
            return Ok(new
            {
                error = result.error,
                desc = new Dictionary<string, string> { { "Product_Name", result.desc } }
            });
        }
        [HttpPost("mantis-product/search")]
        public async Task<IActionResult> GetMantisProduct([FromBody] MantisProductRequest request)
        {
                var response = await _IProductsServices.GetMantisProduct(request.item_sku);
            if (response.error == 0)
            {
                return Ok(response);
            }
                return NotFound(response);
        }
        [HttpPost("update-mantis-product")]
        public async Task<IActionResult> UpdateMantisProduct([FromBody] MantisProductupdateRequest request)
        {
            var response = await _IProductsServices.UpdateMantisProductAsync(request);

            if (response.Error == 0)
                return Ok(response);

            return BadRequest(response);
        }

        [HttpPost("upload-products")]
        public async Task<IActionResult> uploadProducts([FromBody] List<ProductUploadPayload> items)
        {
            try
            {
                var result = await _IProductsServices.UpdateItems(items);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Could not upload file | " + ex.Message });
            }
        }
    }
}

