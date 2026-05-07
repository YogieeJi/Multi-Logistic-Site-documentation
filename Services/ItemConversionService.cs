using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using OfficeOpenXml.Style;

namespace MiddlewareWebAPI.Services.Services
{
    public class ItemConversionService : IItemConversionService
    {
        private readonly IItemConversionRepository _repository;
        public ItemConversionService(IItemConversionRepository repository)
        {
            _repository = repository;
        }

        public async Task<ItemConversionsResponse> GetGrid(GridRequest request)
        {
            return await _repository.GetGrid(request);
        }
        public async Task<LanesResponse> GetLanesGrid(GridRequest request)
        {
            return await _repository.GetLanesGrid(request);
        }
        public async Task<GetUserResponse> getUserToLane(UserGridRequest request)
        {
            return await _repository.getUserToLane(request);
        }
        public async Task<GetUserResponse> GetAllUsers()
        {
            return await _repository.GetAllUsers();
        }
        public async Task<IEnumerable<UOMResponse>> GetUOMList(string? sku)
        {
            return await _repository.GetUOMList(sku);
        }
        public async Task<ResponseResult> AddItem(AddItemRequest request)
        {
            try
            {
                bool exists = await _repository.CheckSkuX3Exists(request.sku_x3);
                if (exists)
                {
                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "sku_x3 is already exists."
                    };
                }

                await _repository.UpdateOrCreateItem(request);
                return new ResponseResult
                {
                    Error = 0,
                    Message = "Item created Successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Error while creating Item | " + ex.Message
                };
            }
        }
        public async Task removeUserToLane(DeletelanesRequest request)
        {
            await _repository.removeUserToLane(request);
        }
        
        public async Task DeleteItem(int id)
        {
            await _repository.DeleteItem(id);
        }

        public async Task<IEnumerable<ItemConversions>> GetDetail(string? sku_mantis)
        {
            return await _repository.GetDetail(sku_mantis);
        }

        public async Task<bool> UpdateItem(AddItemRequest request, string? sku_mantis)
        {
            var rowsAffected = await _repository.UpdateItem(request,sku_mantis);
            return rowsAffected > 0;
        }
        public async Task<bool> addUserToLane(AddUsersRequest request)
        {
            var rowsAffected = await _repository.addUserToLane(request);
            return rowsAffected > 0;
        }
        public async Task<ResponseResult> UpdateItems(List<ItemConversions> items)
        {
            if (items == null || !items.Any())
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "No items found in uploaded data"
                };
            }

            await _repository.UpdateItems(items);

            return new ResponseResult
            {
                Error = 0,
                Message = "Excel file uploaded successfully"
            };
        }

    }
}
