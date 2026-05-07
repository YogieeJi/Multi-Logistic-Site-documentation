using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class ManageTrucksService : IManageTrucksService
    {
        private readonly IManageTrucksRepository _repository;

        public ManageTrucksService(IManageTrucksRepository repository)
        {
            _repository = repository;
        }

        public async Task<AddTruckResponse> AddTruck(AddTruckRequest request)
        {
            return await _repository.AddTruck(request);
        }


        public async Task<TruckListResponse> GetTruckList(GridRequest request)
        {
            return await _repository.GetTruckList(request);
        }

        public async Task<TruckShipmentResponse> GetTruckShipments(GridRequest request)
        {
            return await _repository.GetTruckShipments(request);
        }

        public async Task<ShipmentDetailsResponse> GetShipments(ShipmentGridRequest request)
        {
            return await _repository.GetShipments(request);
        }
    }
}
