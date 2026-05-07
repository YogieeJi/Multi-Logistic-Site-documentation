using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Swashbuckle.Swagger;

namespace MiddlewareWebAPI.Services.Services
{
    public class ProductService: IProductsService
    {
        private readonly IProductsRepository _ProductRepository;
        private readonly IActivityLogRepository _activityLogger;  // Activity Logging Service
        public ProductService(IProductsRepository repository, IActivityLogRepository activityLogger)
        {
            _ProductRepository = repository;
            _activityLogger = activityLogger;
        }
        public async Task<ProductGridResponse> GetProductsGrid([FromBody] ProductGridRequest1 request)
        {
            return await _ProductRepository.GetProductsGrid(request);
        }
        public async Task<MantisProductResponse> GetMantisProduct([FromBody] string item_sku)
        {
            return await _ProductRepository.GetMantisProduct(item_sku);
        }

        public async Task<ProductDetailsResponse> GetProductsDetails( int id)
        {
            return await _ProductRepository.GetProductsDetails(id);
        }
        public async Task<Data.Model.Response> UpdateProductAsync(UpdateProductRequest request, int id)
        {
            try
            {
                if(id == 0)
                {
                    if (string.IsNullOrEmpty(request.Sku) || string.IsNullOrWhiteSpace(request.Sku))
                    {
                        return new Data.Model.Response { Error = 1, Message = "SKU is Mandatory" };
                    }
                    if (string.IsNullOrEmpty(request.upc) || string.IsNullOrWhiteSpace(request.upc))
                    {
                        return new Data.Model.Response { Error = 1, Message = "Upc is Mandatory" };
                    }
                    if ((string.IsNullOrEmpty(request.sku_x3) || string.IsNullOrWhiteSpace(request.sku_x3)) && (string.IsNullOrEmpty(request.sku_x3_2) || string.IsNullOrWhiteSpace(request.sku_x3_2)))
                    {
                        return new Data.Model.Response { Error = 1, Message = "SKU X3 is Mandatory" };
                    }
                    await _ProductRepository.UpdateItemConversionAsync(request.Sku, request.x3_uom);

                    var product = await _ProductRepository.GetProductByIdAsync(id);

                    if(request.sku_x3 != null && request.sku_x3 != "")
                    {
                        await _ProductRepository.ADDItemConversionAsync(request.sku_x3, request.Sku, request.uom);
                    }
                     if(request.sku_x3_2 != null && request.sku_x3_2 != "")
                    {
                        await _ProductRepository.ADDItemConversionAsync(request.sku_x3_2, request.Sku, request.uom_2);
                    }
                    if(request.sku_x3_3 != null && request.sku_x3_3 != "")
                    {
                        await _ProductRepository.ADDItemConversionAsync(request.sku_x3_3, request.Sku, request.uom_3);
                    }
                     if(request.x3_uom != null && request.x3_uom != "")
                    {
                        await _ProductRepository.UpdateItemConversionAsync(request.Sku,  request.x3_uom);
                    }
                    if (request.zone != null && request.zone != "")
                    {
                        await _ProductRepository.Addzone(request.Sku, request.zone);
                    }

                    await _ProductRepository.UpdateProductAsync(request);


                    return new Data.Model.Response { Error = 0, Message = "Product Added successfully" };
                }
                if (id == 1)
                {
                    var idetails = await _ProductRepository.DGetProductsDetails(request.id);
                    if (idetails.Data == null)
                    {
                        await _ProductRepository.UpdateProductAsync(request.id);
                        return new Data.Model.Response { Error = 0, Message = "Product Deleted successfully" };
                    }
                    else
                    {
                        return new Data.Model.Response { Error = 1, Message = "Imported Product cannot be deleted" };
                    }

                   
                }
                else
                {
                    if (!string.IsNullOrEmpty(request.x3_uom))
                        await _ProductRepository.UpdateItemConversionAsync(request.Sku, request.x3_uom);

                    var product = await _ProductRepository.GetProductByIdAsync(id);

                    if (product == null)
                        return new Data.Model.Response { Error = 1, Message = "Product not found" };

                    // Merge updated values
                    product.MantisImported = "0";
                    // Merge other fields (you can map fields as needed from the request)

                    await _ProductRepository.UpdateProductAsync(request, id);

                    // Log Activity
                    //await _activityLogger.LogActivityAsync(product, "updated", "product");

                    return new Data.Model.Response { Error = 0, Message = "Product updated successfully" };
                }
                
            }
            catch (Exception ex)
            {
                // Log the error
                //await _activityLogger.LogErrorAsync(ex, "product", "error");
                return new Data.Model.Response { Error = 1, Message = $"Error while updating product: {ex.Message}" };
            }
        }

        public async Task<Data.Model.Response> UpdateMantisProductAsync(MantisProductupdateRequest request)
        {
            try
            {
                 await _ProductRepository.UpdateMantisProductAsync(request);
                 return new Data.Model.Response { Error = 0, Message = "Product Updated successfully" };

            }
            catch (Exception ex)
            {
                // Log the error
                //await _activityLogger.LogErrorAsync(ex, "product", "error");
                return new Data.Model.Response { Error = 1, Message = $"Error while updating product: {ex.Message}" };
            }
        }
        public async Task<ResponseResult> UpdateItems(List<ProductUploadPayload> items)
        {
            if (items == null || !items.Any())
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "No items found in uploaded data"
                };
            }

            await _ProductRepository.UpdateItems(items);

            return new ResponseResult
            {
                Error = 0,
                Message = "Excel file uploaded successfully"
            };
        }
        public async Task<(int error, string desc)> GetItemDescAsync(Requestdesc request)
        {
            var item = await _ProductRepository.GetItemDescAsync(request);
            if (item == null)
                return (1, "");

            return (0, item.Product_Name);
        }
    }
}
