using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConveyorController : ControllerBase
    {
        private readonly IConveyorService _conveyorService;
        public ConveyorController(IConveyorService conveyorService)
        {
            _conveyorService = conveyorService;
        }

        [HttpPost("conveyor-setting/getLane")]
        public async Task<IActionResult> GetLane([FromBody] LaneRequest request)
        {
            try
            {
                var response = await _conveyorService.GetLanes(request);

                if (!response.IsSuccess)
                {
                    return BadRequest(new { error = 1, message = response.Message });
                }

                return Ok(new
                {
                    error = 0,
                    data = response.Data,
                    totalRecords = response.TotalRecords
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("get-conveyor-lanes/{id}")]
        public async Task<IActionResult> getLaneDetail(int id)
        {
            try
            {
                var result = await _conveyorService.getLaneDetail(id);
                return Ok(new { data = result.data });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Error Fetching item Details | " + ex.Message });
            }
        }

        [HttpPost("get-conveyor-slots")]
         public async Task<IActionResult> GetSlotsGrid([FromBody] GridRequest request)
         {
                try
                {
                    var result = await _conveyorService.GetSlotsGrid(request);
                    return Ok(result);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-conveyor-slots/{id}")]
        public async Task<IActionResult> GetSlotsDetail(int id)
        {
            try
            {
                var result = await _conveyorService.GetSlotsDetail(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpGet("location-form-obj")]
        public async Task<IActionResult> GetFormObj()
        {
            var result = await _conveyorService.GetFormObj();
            return Ok(result);
        }

        [HttpPost("add-conveyor-slots")]
        public async Task<IActionResult> AddSlot([FromBody] ConveyorSlotRequest slot)
        {
            var result = await _conveyorService.AddSlot(slot);
            return Ok(result);
        }

        [HttpPost("update-conveyor-slots/{id}")]
        public async Task<IActionResult> UpdateSlot( [FromBody] SlotInputModel model,int id)
        {
            var (isSuccess, message) = await _conveyorService.UpdateSlot(model,id);

            return Ok(new
            {
                error = isSuccess ? 0 : 1,
                message
            });
        }

        [HttpGet("order-ship")]
        public async Task<IActionResult> GetOrdersByStatus()
        {
            try
            {
                var result = await _conveyorService.GetOrdersByStatus();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "error", message = ex.Message }); 
            }
        }

        [HttpPost("get-order-slot")]
        public async Task<IActionResult> GetOrderSlot([FromBody] GridRequest request)
        {
            try
            {
                var result = await _conveyorService.GetOrderSlot(request);
                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("update-order-slot")]
        public async Task<IActionResult> UpdateOrderSlot([FromBody] UpdateOrderSlotRequest request)
        {
            try
            {
                var response = await _conveyorService.UpdateOrderSlot(request);
                return Ok(new { error = response.Error, message = response.Message});

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-conveyor-lanes")]
        public async Task<IActionResult> GetConveyorLanesGrid([FromBody] GridRequest request)
        {
            try
            {
                var result = await _conveyorService.GetConveyorLanesGrid(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("add-conveyor-lanes")]
        public async Task<IActionResult> AddLane([FromBody] CreateLaneRequest request)
        {
            try
            {
                var result = await _conveyorService.AddLane(request);

                if (result.Error == 0)
                {
                    return Ok(new { error = 0, message = result.Message, data = result });
                }
                else
                {
                    return Ok(new { error = 1, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while creating Lane | {ex.Message}" });
            }
        }

        [HttpPost("update-conveyor-lanes/{id}")]
        public async Task<IActionResult> UpdateLanes([FromBody] UpdateLanesRequest request, int id)
        {
            try
            {
                var result = await _conveyorService.UpdateLanes(request, id);

                if (result.Error == 0)
                {
                    return Ok(new { error = 0, message = result.Message, data = result });
                }
                else
                {
                    return Ok(new { error = 1, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while updating lane | {ex.Message}" });
            }
        }
    }
}


