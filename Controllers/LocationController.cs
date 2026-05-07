using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [HttpPost("get-shipping-locations/lookup")]
        public async Task<IActionResult> ShippingLocationLookup([FromBody] List<ShippingLocationRequest> request)
        {
            try
            {
                var result = await _locationService.GetShippingLocations(request[0]);
                return Ok(new { error = 0, data = result.Data, selectedLocations = result.SelectedLocations });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-shipment-lcoations")]
        public async Task<IActionResult> getshipmentLocations([FromBody] GridRequestLocaation request)
        {
            try
            {
                var result = await _locationService.getshipmentLocations(request);
                return Ok(new { error = 0, data = result.data, message = result.message, totalRecords = result.totalRecords });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpGet("get-shipment-lcoation-detail/{code}")]
        public async Task<IActionResult> getshipmentLocationDetail(string code)
        {
            try
            {
                var result = await _locationService.getshipmentLocationDetail(code);
                return Ok(new { data = result.data, message = "Successfull" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }


        [HttpPost("get-lanes/lookup")]
        public async Task<IActionResult> LanesLookup()
        {
            try
            {
                var data = await _locationService.LanesLookup();
                return Ok(new { error = 0, data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpGet("get-shipment-lcoation-lookups")]
        public async Task<IActionResult> getshipmentLocationLookups()
        {
            try
            {
                var data = await _locationService.getshipmentLocationLookups();
                return Ok(new { error = 0, data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-mantis-locations")]
        public async Task<IActionResult> getMantisLocations([FromBody] Mantislocationrequest request)
        {
            try
            {
                var data = await _locationService.getMantisLocations(request);
                return Ok(new { error = 0, data = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("delete-shipment-location/{code}")]
        public async Task<IActionResult> deleteLocation(string code)
        {
            var response = await _locationService.deleteLocation(code);

            if (response.Error == 0)
                return Ok(response);

            return Ok(new { error = 1, message = response.Message });
            //return BadRequest(response);
        }
        [HttpPost("create-update-shipment-lcoation")]
        public async Task<IActionResult> createUpdateShipmentLocation([FromBody] ShipmentLocationRequest request)
        {
            var response = await _locationService.createUpdateShipmentLocation(request);

            if (response.Error == "0")
                return Ok(response);

            return Ok(new { error = 1, message = response.Message });
        }

    }
}
