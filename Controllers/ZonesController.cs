using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ZonesController : ControllerBase
    {
        private readonly IZoneService _zoneService;

        public ZonesController(IZoneService zoneService)
        {
            _zoneService = zoneService;
        }

        [HttpPost("zones/lookup")]
        public async Task<IActionResult> Lookup()
        {
            var result = await _zoneService.GetAllZonesAsync();
            return Ok(new { data = result, error = 0 });
        }
        [HttpPost("get-zones")]
        public async Task<IActionResult> GetZonesGrid([FromBody] GridRequest request)
        {
            try
            {
                var result = await _zoneService.GetZonesGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    Message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-zone/{id}")]
        public async Task<IActionResult> GetZoneDetail(int id)
        {
            var result = await _zoneService.GetZoneDetail(id);
            return Ok(new { data = result });
        }

        [HttpPost("get-zone-locations/{zone_desc}")]
        public async Task<IActionResult> GetLocationGrid([FromBody] GridRequest request, string zone_desc)
        {
            try
            {
                var result = await _zoneService.GetLocationGrid(request, zone_desc);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfull"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-zone-items/{zone_desc}")]
        public async Task<IActionResult> GetItemsGrid([FromBody] GridRequest request, string zone_desc)
        {
            try
            {
                var result = await _zoneService.GetItemsGrid(request, zone_desc);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    message = "Successfull"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });

            }

        }

        [HttpPost("add-zone-items/{zone_desc}")]
        public async Task<IActionResult> AddItem([FromBody] AssignItemRequest item, string zone_desc)
        {
            try
            {
                var result = await _zoneService.AddItem(item, zone_desc);

                return Ok(new { error = result.Error, message = result.Message });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }

        [HttpPost("remove-zone-items/{zone_desc}")]
        public async Task<IActionResult> RemoveItem(string zone_desc, RemoveItemRequest request)
        {
            try
            {
                var result = await _zoneService.RemoveItem(zone_desc, request);

                return Ok(new { error = result.Error, message = result.Message });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }

        [HttpPost("get-zone-universal-items/grid")]
        public async Task<IActionResult> GetUniversalZonesItemsGrid([FromBody] GridRequestitemxone request)
        {
            try
            {
                var result = await _zoneService.GetUniversalZonesItemsGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    Message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-zone-stock-items/grid")]
        public async Task<IActionResult> GetStockZonesItemsGrid([FromBody] GridRequestitemxone request)
        {
            try
            {
                var result = await _zoneService.GetStockZonesItemsGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    Message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-zones-storage-mapping/grid")]
        public async Task<IActionResult> GetZonesStorageMappingGrid([FromBody] GridRequest request)
        {
            try
            {
                var result = await _zoneService.GetZonesStorageMappingGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    Message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-zones-storage-mapping/{id}")]
        public async Task<IActionResult> GetZonesStorageMappingDetail(int id)
        {
            try
            {
                var result = await _zoneService.GetZonesStorageMappingDetail(id);
                return Ok(new
                {
                    data = result,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("zones-storage-mapping/lookup")]
        public async Task<IActionResult> ZonesStorageMappingLookup()
        {
            try
            {
                var result = await _zoneService.ZonesStorageMappingLookup();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error | " + ex.Message
                });
            }

        }
        [HttpPost("update-zones-storage-mapping/{id}")]
        public async Task<IActionResult> UpdateZonesStorageMapping([FromBody] UpdateZoneStorageRequest request, int id)
        {
            try
            {
                var result = await _zoneService.UpdateZonesStorageMapping(request, id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }
        [HttpPost("remove-zones-storage-mapping/{id}")]
        public async Task<IActionResult> RemoveZonesStorageMapping(int id)
        {
            try
            {
                var result = await _zoneService.RemoveZonesStorageMapping(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }

        [HttpPost("add-zones-storage-mapping")]
        public async Task<IActionResult>AddZonesStorageMapping(CreateZoneStorageMappingRequest request)
        {
            try
            {
                var result = await _zoneService.AddZonesStorageMapping(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }

        }
    }
}