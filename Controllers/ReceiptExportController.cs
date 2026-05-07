using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReceiptExportController : ControllerBase
    {
        private readonly IReceiptExportService _receiptExportService;

        public ReceiptExportController(IReceiptExportService receiptExportService)
        {
            _receiptExportService = receiptExportService;
        }

        [HttpPost("get-receipt-export")]
        public async Task<IActionResult> GetReceiptExportGrid(GridRequest request)
        {
            try
            {
                var result = await _receiptExportService.GetReceiptExportGrid(request);

                return Ok(new
                {
                    error = 0,
                    data = result.Data,
                    totalRecords = result.TotalRecords
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = ex.Message
                });
            }
        }

        [HttpPost("get-receipt-export/{id}")]
        public async Task<IActionResult> GetReceiptExportById(int id)
        {
            try
            {
                var result = await _receiptExportService.GetReceiptExportById(id);

                if (result != null && result.Any())
                {
                    return Ok(new
                    {
                        error = 0,
                        message = "Receipt export details successfully",
                        data = result
                    });
                }

                return Ok(new
                {
                    error = 1,
                    message = "No receipt export details found"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = ex.Message
                });
            }
        }

        [HttpPost("get-receipt-export-detail/{receiptCode}")]
        public async Task<IActionResult> GetReceiptExportDetails([FromBody] GridRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptExportService.GetReceiptExportDetails(request, receiptCode);
                return Ok(new { error = 0, data = result.Data, totalRecords = result.TotalRecords, message = "successfully fetched data" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-receipt-export-detail-lot/{receiptCode}")]
        public async Task<IActionResult> GetReceiptExportDetailLOT([FromBody] GridRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptExportService.GetReceiptExportDetailLOT(request, receiptCode);
                return Ok(new { error = 0, data = result.Data, totalRecords = result.TotalRecords, message = "successfully fetched data" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("create-po-receipt-lots")]
        public async Task<IActionResult> CreatePoReceiptLotsSagex3([FromBody] CreatePoReceiptLotRequest request)
        {
            try
            {
                var result = await _receiptExportService.CreatePoReceiptLotsSagex3(request);
                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }

        }

        [HttpPost("mark-as-manual-export-receipt")]
        public async Task<IActionResult> MarkAsManualExportReceipt([FromBody] MarkAsExportedRequest request)
        {
            try
            {
                var result = await _receiptExportService.MarkAsManualExportReceipt(request);
                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }

        }

    }
}
