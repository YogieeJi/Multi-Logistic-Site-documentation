using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using OfficeOpenXml.Style;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SetupController:ControllerBase
    {
        private readonly ISetupService _ISetupServices;
        public SetupController(ISetupService SetupService)
        {
            _ISetupServices = SetupService;
        }
        [HttpPost("get-dynamic-reports")]
        public async Task<IActionResult> viewReportstsGrid([FromBody] GridRequest request)
        {
            try
            {
                var result = await _ISetupServices.viewReports(request);
                return Ok(new { data = result.data, totalRecords = result.totalRecords, message = "Successfull" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Internal Server Error | {ex.Message}" });
            }

        }
        [HttpPost("get-dynamic-report/{id}")]
        public async Task<IActionResult> viewReportstsdetails(int id)
        {
            try
            {
                var result = await _ISetupServices.viewReports(id);
                return Ok(new { data = result.data[0] });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Internal Server Error | {ex.Message}" });
            }

        }
        [HttpPost("update-dynamic-report/{id}")]
        public async Task<IActionResult> updateReport(reportupdateItem request, int id)
        {
            try
            {
                await _ISetupServices.updateReport(request,id);
                return Ok(new { error = 0 , message = "Report Updated Successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Internal Server Error | {ex.Message}" });
            }

        }
        [HttpPost("add-dynamic-report")]
        public async Task<IActionResult> addReport(reportupdateItem request)
        {
            try
            {
                await _ISetupServices.updateReport(request, 0);
                return Ok(new { error = 0, message = "Report Updated Successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Internal Server Error | {ex.Message}" });
            }

        }
    }
}
