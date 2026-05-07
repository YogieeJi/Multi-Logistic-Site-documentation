using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LanesController : ControllerBase
    {
        private readonly IItemConversionService _service;

        private readonly IConveyorService _conveyorservice;
        public LanesController(IItemConversionService service, IConveyorService conveyorService)
        {
            _service = service;
            _conveyorservice = conveyorService;
        }

        [HttpPost("get-lanes")]
        public async Task<IActionResult> getlanes([FromBody] GridRequest request)
        {
            try
            {
                var result = await _service.GetLanesGrid(request);
                return Ok(new
                {
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-user-lane")]
        public async Task<IActionResult> getUserToLane([FromBody] UserGridRequest request)
        {
            try
            {
                var result = await _service.getUserToLane(request);
                return Ok(new
                {
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-occupied-zones")]
        public async Task<IActionResult> occupiedLanesGrid([FromBody] GridRequest request)
        {
            try
            {
                var result = await _conveyorservice.occupiedLanesGrid(request);
                return Ok(new
                {
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("add-user-lane")]
        public async Task<IActionResult> addUserToLane([FromBody] AddUsersRequest request)
        {
            try
            {
                var result = await _service.addUserToLane(request);
                return Ok(new
                {
                    error = 0,
                    message = "User added to lane successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }


        [HttpPost("remove-user-lane")]
        public async Task<IActionResult> removeUserToLane([FromBody] DeletelanesRequest request)
        {
            try
            {
                await _service.removeUserToLane(request);
                return Ok(new { error = 0, message = "User remove from lane successfully" });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Error while removing Lane | " + ex.Message });
            }
        }
       
    }
    
}
