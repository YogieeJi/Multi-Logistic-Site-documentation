using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Services.Services
{
    public class ItemLotExpiryService : IItemLotExpiryService
    {
        private readonly IItemLotExpiryRepository _expiryRepository;
        public ItemLotExpiryService(IItemLotExpiryRepository expiryRepository)
        {
            _expiryRepository = expiryRepository;
        }

        public async Task<ItemLotExpiryResponse> GetGrid(GridRequest request)
        {
            return await _expiryRepository.GetGrid(request);
        }
        public async Task<ItemLotExpiryDetailResponse> GetDetail(int id)
        {
            return await _expiryRepository.GetDetail(id);

        }


        public async Task<EditItemLotExpiryResponse> GetLVProducts()
        {
            try
            {
                return await _expiryRepository.GetLVProducts();

            }
            catch (Exception ex)
            {
                return new EditItemLotExpiryResponse
                {
                    error = 1,
                    message = "Error while fetching Data |" + ex.Message
                };


            }
        }
        public async Task<ApisResponse> Update(UpdateItemLotExpiryRequest request,int id)
        {
            try
            {
                var result = await _expiryRepository.Update(request, id);

                if (result)
                {
                    return new ApisResponse
                    {
                        Error = 0,
                        Message = "Data updated Successfully"
                    };
                }
                else
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = "Update failed. No rows were affected."
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = "Error while updating Data | " + ex.Message
                };
            }
        }

        public async Task<ApisResponse> Add(AddItemLotExpiryRequest request)
        {
            try
            {
                var result = await _expiryRepository.Add(request);

                if (result)
                {
                    return new ApisResponse
                    {
                        Error = 0,
                        Message = "Data created successfully."
                    };
                }

                return new ApisResponse
                {
                    Error = 1,
                    Message = "Creation failed. No rows were affected."
                };
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("same Item and Lot Number already exists"))
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = "This Item and Lot Number combination already exists."
                    };
                }

                return new ApisResponse
                {
                    Error = 1,
                    Message = "Error while saving data."
                };
            }
        }
    }
}
