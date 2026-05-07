using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using Swashbuckle.Swagger;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OutboundShipmentController : ControllerBase
    {
        #region constructor 
        private readonly IOutboundShipmentService _outboundShipmentService;

        public OutboundShipmentController(IOutboundShipmentService outboundShipmentService)
        {
            _outboundShipmentService = outboundShipmentService;
        }
        #endregion

        #region OutboundShipments 
        [HttpPost("outbound-shipments")]
        public async Task<IActionResult> GetOutboundShipments([FromBody] GridRequest request)
        {
            try
            {
                var result = await _outboundShipmentService.GetOutboundShipments(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("outbound-shipment-detail/{id}")]
        public async Task<IActionResult> GetShipmentDetailById([FromBody] GridRequest request, int id)
        {
            try
            {
                var result = await _outboundShipmentService.GetShipmentDetailById(request, id);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    message = "Successfully fetched data"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("outbound-shipment-detailTruck/{id}")]
        public async Task<IActionResult> GetShipmentDetailTruck([FromBody] GridRequest request, int id)
        {
            try
            {
                var result = await _outboundShipmentService.GetShipmentDetailTruck(request, id);
                if (result == null)
                {
                    return NotFound(new
                    {
                        data = (object)null,
                        totalRecords = 0,
                        message = "No data found"
                    });
                }
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    message = "Successfully fetched data"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("outbound-getshipmentHeader/{id}")]
        public async Task<IActionResult> GetShipmentHeaderById(int id)
        {
            try
            {
                var Data = await _outboundShipmentService.GetShipmentHeaderById(id);
                return Ok(new
                {
                    data = Data,
                    message = "Successfully fetched data"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error fetching data",
                    error = ex.Message
                });
            }
        }


        [HttpPost("outbound-shipments/delete")]
        public async Task<IActionResult> DeleteOutboundShipment([FromBody] DeleteOrdertaskrequest request)
        {
            try
            {
                var result = await _outboundShipmentService.DeleteOutboundShipment(request.id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while processing shipment deletion: {ex.Message}" });
            }
        }

        [HttpPost("assign-lanes-to-outbound-shipment-orders")]
        public async Task<IActionResult> OutboundAssignLanes([FromBody] OutboundAssignLanesRequest request)
        {
            var lanesResult = await _outboundShipmentService.OutboundAssignLanes(request);
            if (lanesResult)
            {
                return Ok(new { error = 0, message = "Lanes Assigned Successfully" });
            }
            else
            {
                return BadRequest(new { error = 1, message = "Lane assignment failed" });
            }
        }

        [HttpPost("outbound-shipments-order/release-locations")]
        public async Task<IActionResult> ReleaseLocations([FromBody] ReleaseLocationsRequest request)
        {
            var (isSuccess, message) = await _outboundShipmentService.ReleaseLocations(request.shp_ID);

            if (isSuccess)
            {
                return Ok(new { error = 0, message });
            }
            else
            {
                return StatusCode(500, new { message });
            }
        }
        [HttpGet("trucks")]
        public async Task<IActionResult> getAllTrucks()
        {
            try
            {
                var result = await _outboundShipmentService.getAllTrucks();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpGet("truck-id/{id}")]
        public async Task<IActionResult> GetTruckById(int id)
        {
            var truck = await _outboundShipmentService.GetTruckById(id);

            if (truck == null)
                return NotFound(new { message = "Truck not found" });

            return Ok(truck);
        }

        [HttpGet("trucks-location")]
        public async Task<IActionResult> GetAlllocation()
        {
            try
            {
                var result = await _outboundShipmentService.GetAlllocation();
                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, data = result.Data });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("order-shipments")]
        public async Task<IActionResult> GetOrderShipments([FromBody] GridRequest request)
        {
            try
            {
                var response = await _outboundShipmentService.GetOrderShipments(request);
                if (response.IsSuccess)
                    return Ok(new
                    {
                        currentPage = response.CurrentPage,
                        data = response.Data,
                        isSuccess = response.IsSuccess,
                        message = response.Message,
                        pagseSize = response.PageSize,
                        totalPage = response.TotalPages,
                        totalRecords = response.TotalRecords
                    });

                return Ok(new { error = 1, message = response.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("add-shipment")]
        public async Task<IActionResult> CreateShipments([FromBody] CreateShipmentResquest request)
        {
            try
            {
                var result = await _outboundShipmentService.CreateShipments(request);
                if (result.Error == 1)
                    return Ok(new { error = 1, message = result.Message });

                return Ok(new { error = 0, message = result.Message });
            }
            catch (Exception ex)
            {
                // Optionally log the exception here
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("update-shipment/{id}")]
        public async Task<IActionResult> UpdateShipments([FromBody] CreateShipmentResquest request)
        {
            try
            {
                var result = await _outboundShipmentService.UpdateShipments(request);
                if (result.Error == 1)
                    return Ok( new { error = 1, message = result.Message });

                return Ok(new { error = 0, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }

        }

        [HttpPost("outbound-shipments/edit/{id}")]
        public async Task<IActionResult> EditOrderShipment(int id)
        {
            try
            {
                var result = await _outboundShipmentService.GetShipmentById(id);
                if (result.Error == 1)
                {
                    return Ok(new { error = 1, message = result.Message });
                }
                else
                {
                    return Ok(new { error = 0, message = result.Message });
                }

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("outbound-shipmentsTruck/edit/{id}")]
        public async Task<IActionResult> EditOrderShipmentTruck(int id)
        {
            try
            {
                var data = await _outboundShipmentService.EditOrderShipmentTruck(id);

                if (data != null && data.Any())
                {
                    return Ok(new { error = 0, data });
                }

                return Ok(new { error = 1, message = "unable to fetch data" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("mark-shipment-complete")]
        public async Task<IActionResult> MarkShipmentComplete([FromBody] MarkShipmentCompleteRequest request)
        {
            try
            {
                var result = await _outboundShipmentService.MarkShipmentComplete(request);
                if (result.Error == 1) { 
                    return Ok(new { error = 1, message = result.Message });
                }
                else
                {
                    return Ok(new { error = 0, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("add-Truck-Dock")]
        public async Task<IActionResult> AddTruckAndDock([FromBody] AddTruckAndDockRequest request)
        {
            try
            {
                var result = await _outboundShipmentService.AddTruckAndDock(request);
                if (result.Error == 0)
                    return Ok(result);
                return Ok(new { error = 1, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }

        }

        [HttpPost("outbound-shipments-order/delete")]
        public async Task<IActionResult> DeleteOrderShipment([FromBody] DeleteOrderShipmentRequest request)
        {
            try
            {
                var result = await _outboundShipmentService.DeleteOrderShipment(request);
                if (result.Error == 0)
                    return Ok(result);
                else
                    return Ok(new { error = 1, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
            
        }

        [HttpPost("multiple-shipment")]
        public async Task<IActionResult> CreateMultipleShipments([FromBody] MultipleShipmentResquest request)
        {
            try
            {
                var response = await _outboundShipmentService.CreateMultipleShipments(request);
                if (response.Error == 1)
                {
                    return Ok(new { error = 1, message = response.Message });
                }
                else
                {
                    return Ok(new { error = 0, message = response.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("multiple-update-shipment/{id}")]
        public async Task<IActionResult> UpdateMultipleShipments([FromBody] MultipleShipmentResquest request)
        {
            try
            {
                var result = await _outboundShipmentService.UpdateMultipleShipments(request);
                if (result.Error == 1)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new { error = 0, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        #endregion
    }
}