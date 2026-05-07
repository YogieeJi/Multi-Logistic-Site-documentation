using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;

namespace MiddlewareWebAPI.Services.Services
{
    public class LocationService : ILocationService
    {
        private readonly ILocationRepository _locationRepository;

        public LocationService(ILocationRepository locationRepository)
        {
            _locationRepository = locationRepository;
        }

        public async Task<ShippingLocationResponse> GetShippingLocations(ShippingLocationRequest request)
        {
            var data = await _locationRepository.GetShippingLocations(request.pick_list_id);
            var selectedLocations = await _locationRepository.GetSelectedLocations(request.pick_list_id);

            var selectedLocationsArr = selectedLocations.Select(loc => loc.LocationLevelIdentifier).ToList();
            var disabledLocations = selectedLocations.Where(loc => !string.IsNullOrEmpty(loc.Lpn))
                                                     .Select(loc => loc.AssignedShipLoc).ToList();

            var dataList = data.Select(d => new ShippingLocationDto
            {
                id = d.id,
                loc_Code = d.loc_Code,
            }).ToList();

            return new ShippingLocationResponse
            {
                Data = dataList,
                SelectedLocations = selectedLocationsArr
            };
        }
        public async Task<OrderShipmentLocationResponse> getshipmentLocations(GridRequestLocaation request)
        {
            return await _locationRepository.getshipmentLocations(request);
        }
        public async Task<DetailOrderShipmentLocationResponse> getshipmentLocationDetail(string code)
        {
            return await _locationRepository.getshipmentLocationDetail(code);
        }
        public async Task<Data.Model.Response> deleteLocation(string code)
        {
            try
            {
                await _locationRepository.deleteLocation(code);
                return new Data.Model.Response { Error = 0, Message = "Location Deleted successfully" };

            }
            catch (Exception ex)
            {
                return new Data.Model.Response { Error = 1, Message = $"Error while Deleting Location: {ex.Message}" };
            }
        }
        public async Task<IEnumerable<LaneLookupResponse>> LanesLookup()
        {
            return await _locationRepository.LanesLookup();
        }
        public async Task<IEnumerable<LocationLookupResponse>> getshipmentLocationLookups()
        {
            return await _locationRepository.getshipmentLocationLookups();
        }
        public async Task<LocationResponse> getMantisLocations(Mantislocationrequest request)
        {
            return await _locationRepository.getMantisLocations(request);
        }
        public async Task<ResponseModel> createUpdateShipmentLocation(ShipmentLocationRequest request)
        {
            try
            {

                return await _locationRepository.createUpdateShipmentLocation(request);

            }
            catch (Exception ex)
            {
                return new ResponseModel { Error = "1", Message = $"Error occured while operation: {ex.Message}" };
            }
        }
    }
}
