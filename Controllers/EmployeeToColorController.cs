using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeToColorController : ControllerBase
    {
        private readonly IEmployeeToColorService _colorService;

        public EmployeeToColorController(IEmployeeToColorService colorService)
        {
            _colorService = colorService;
        }

        [HttpPost("get-employee-color")]
        public async Task<IActionResult> Index(GridRequest request)
        {
            try
            {
                var result = await _colorService.Index(request);

                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }

        }

        [HttpGet("mantis-all-employees-lookup")]
        public async Task<IActionResult> MantisAllEmployeesLookup()
        {
            try
            {
                var result = await _colorService.MantisAllEmployeesLookup();

                return Ok(new { error = result.Error, data = result.Data, });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }

        }

        [HttpPost("add-employee-color")]
        public async Task<IActionResult> Store(AddEmployeeColorRequest request)
        {
            try
            {
                var result = await _colorService.Store(request);

                return Ok(new { error = result.Error, mesage = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }

        }

        [HttpPost("get-employee-color/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            try
            {
                var result = await _colorService.Show(id);

                return Ok(new { data = result.Data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }

        }
        [HttpPost("update-employee-color/{id}")]
        public async Task<IActionResult> UpdateEmployeeToColor([FromBody] UpdateEmployeeToColorRequest request, int id)
        {

            var result = await _colorService.Update(request, id);
            return Ok(new
            {
                error = result.Error,
                message = result.Message,
            });
        }
     
    }
}

