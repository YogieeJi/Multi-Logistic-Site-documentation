using System.Diagnostics.Eventing.Reader;
using System.Linq.Expressions;
using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using OfficeOpenXml.Style;
using Org.BouncyCastle.Asn1.Ocsp;
using static MiddlewareWebAPI.Data.Model.Conveyordashboard;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReceiptDashboardController : ControllerBase
    {
        private readonly IReceiptDashboardService _receiptdashboardservice;

        public ReceiptDashboardController(IReceiptDashboardService receiptdashboardservice)
        {
            _receiptdashboardservice = receiptdashboardservice;
        }
        [HttpGet("get-receipt-dropdown")]
        public async Task<IActionResult> getReceiptDropdown()
        {
            try
            {
                var data = await _receiptdashboardservice.getReceiptDropdown();

                return Ok(new
                {
                    error = 0,
                    data = data
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while fetching picklist IDs"
                });
            }
        }
        [HttpPost("get-receipt-detail-lot/{receiptCode}")]
        public async Task<IActionResult> GetReceiptDetailsLOT([FromBody] ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {

                var result = await _receiptdashboardservice.GetReceiptDetailsLot(request, receiptCode);
                var actualDate = result.Data?.FirstOrDefault()?.rct_ActualDate;
                string? formattedDate = actualDate?.ToString("yyyy-MM-dd HH:mm:ss");

                return Ok(new { error = 0, data = result.Data, totalRecords = result.totalRecords, message = "successfully fetched data", date = formattedDate });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-receipt-detail/{receiptCode}")]
        public async Task<IActionResult> getReceiptDetails([FromBody] ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.GetReceiptDetails(request, receiptCode);
                int count = result.Data?.Count() ?? 0;
                //var actualDate = await _receiptdashboardservice.GetReceiptactualdate(receiptCode);
                var actualDate = result.Data?.FirstOrDefault()?.rct_ActualDate;
                string? formattedDate = actualDate?.ToString("yyyy-MM-dd HH:mm:ss");
                return Ok(new { error = 0, data = result.Data, totalRecords = result.totalRecords, message = "successfully fetched data", date = formattedDate });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpGet("generate-PDF/{receiptCode}")]
        public async Task<IActionResult> GeneratePDF(string receiptCode)
        {
            try
            {
                var receiptPoResult = await _receiptdashboardservice.getReceiptDetails(receiptCode);
                var receiptLotResult = await _receiptdashboardservice.GetReceiptDetailsLot(receiptCode);
                var actualDate = await _receiptdashboardservice.GetReceiptactualdate(receiptCode);

                //   count check (forces evaluation, no false positives)
                var poCount = receiptPoResult?.data?.Count() ?? 0;
                var lotCount = receiptLotResult?.Data?.Count() ?? 0;

                //  when no data
                if (poCount == 0 && lotCount == 0)
                {
                    return NoContent(); // 204
                }

                //  PDF is generated ONLY when data exists
                var pdfBytes = PdfGenerator.GenerateReceiptDashboardPdf(
                    receiptCode,
                    actualDate,
                    receiptPoResult.data,
                    receiptLotResult.Data
                );

                return File(
                    pdfBytes,
                    "application/pdf",
                    $"Receipt_Report({receiptCode}).pdf"
                );
            }
            catch { return NoContent(); }
        }

        [HttpGet("generate-transfer-PDF/{receiptCode}")]
        public async Task<IActionResult> GenerateTransferPDF(string receiptCode)
        {
            try
            {
                var receiptData = await _receiptdashboardservice.getInboundTransferReceipt(receiptCode);
                var discrepancyData = await _receiptdashboardservice.GetDiscrepancyData(receiptCode);
                var pdfBytes = PdfGenerator.GenerateInboundTransferReceiptPdf(receiptData.Data.ToList(), receiptCode, discrepancyData.Data.ToList());

                return File(pdfBytes, "application/pdf", $"TransferReceipt_({receiptCode}).pdf"
                );
            }
            catch
            {
                return NoContent();
            }
        }

        [HttpPost("get-receipt-detail-lot-old/{receiptCode}")]
        public async Task<IActionResult> getReceiptDetailsLOT([FromBody] ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.getReceiptDetailsLOT(request, receiptCode);
                var resultc = await _receiptdashboardservice.getReceiptDetailsLOTC(request, receiptCode);
                int count = resultc.data?.Count() ?? 0;
                var actualDate = await _receiptdashboardservice.GetReceiptactualdate(receiptCode);
                string formattedDate = actualDate.HasValue ? actualDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : null;
                return Ok(new { error = 0, data = result.data, totalRecords = count, message = "successfully fetched data", date = formattedDate });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-receipt-detail-old/{receiptCode}")]
        public async Task<IActionResult> getReceiptDetailsOld([FromBody] ReceiptDashboardRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.getReceiptDetails(request, receiptCode);
                int count = result.data?.Count() ?? 0;
                var actualDate = await _receiptdashboardservice.GetReceiptactualdate(receiptCode);
                string formattedDate = actualDate.HasValue ? actualDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : null;
                return Ok(new { error = 0, data = result.data, totalRecords = result.totalRecords, message = "successfully fetched data", date = formattedDate });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpGet("generate-PDF-old/{receiptCode}")]
        public async Task<IActionResult> GeneratePDFOld(string receiptCode)
        {
            try
            {
                var dresult = await _receiptdashboardservice.getReceiptDetailsOld(receiptCode);
                var lresult = await _receiptdashboardservice.getReceiptDetailsLOT(receiptCode);
                var actualDate = await _receiptdashboardservice.GetReceiptactualdate(receiptCode);
                if ((dresult?.data == null || !dresult.data.Any()) && (lresult?.data == null || !lresult.data.Any()))
                {
                    return BadRequest(new
                    {
                        message = "No data found for report pdf"
                    });
                }

                else
                {
                    var pdfBytes = PdfGenerator.GeneratePdf(receiptCode, actualDate, dresult.data, lresult.data);

                    var fileName = $"Receipt_Report({receiptCode}).pdf";

                    return File(pdfBytes, "application/pdf", fileName);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, error_message = ex.Message });
            }
        }

        [HttpPost("get-receipt-inexecution")]
        public async Task<IActionResult> GetReceiptsInExecution([FromBody] ReceiptSelectionRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.GetReceiptsInExecution(request);
                return Ok(new
                {
                    error = 0,
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "successfully fetched data"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("get-all-receipt")]
        public async Task<IActionResult> GetAllReceipt([FromBody] ReceiptSelectionRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.GetAllReceipt(request);
                return Ok(new
                {
                    error = 0,
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "successfully fetched data"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("get-receipt-details/{receiptCode}")]
        public async Task<IActionResult> GetReceiptDetails([FromBody] ReceiptDetailsRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.GetReceiptDetails(request, receiptCode);

                return Ok(new
                {
                    error = result.Error,
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("get-receipt-details-lot/{receiptCode}")]
        public async Task<IActionResult> GetReceiptDetailsLot([FromBody] ReceiptLotDetailsRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.GetReceiptDetailsLots(request, receiptCode);

                return Ok(new
                {
                    error = result.Error,
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("get-discrepancy-items-only/{receiptCode}")]
        public async Task<IActionResult> GetDiscrepancyItemsOnly(string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.GetDiscrepancyItemsOnly(receiptCode);

                return Ok(new
                {
                    error = result.Error,
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("update-receipt-status/{receiptId}")]
        public async Task<IActionResult> UpdateReceiptStatus(int receiptId, [FromBody] UpdateReceiptRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.UpdateReceiptStatus(receiptId, request);

                if (result.Error == 0)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }

                return Ok(new
                {
                    error = result.Error,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("get-ready-to-process-receipts")]
        public async Task<IActionResult> GetReadyToProcessReceipts(ReceiptSelectionRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.GetReadyToProcessReceipts(request);

                return Ok(new
                {
                    error = result.error,
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("get-all-receipts")]
        public async Task<IActionResult> GetAllAccountingReceipts(ReceiptSelectionRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.GetAllAccountingReceipts(request);

                return Ok(new
                {
                    error = result.error,
                    data = result.data,
                    totalRecords = result.totalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }


        }
        [HttpPost("get-discrepancy-items-by-po/{receiptCode}")]
        public async Task<IActionResult> GetDicrepancyItems(ReceiptDiscrepancyItemsRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.GetDicrepancyItems(request, receiptCode);

                return Ok(new
                {
                    error = result.Error,
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }


        }

        [HttpPost("get-discrepancy-items-by-lot/{receiptCode}")]
        public async Task<IActionResult> GetDicrepancyItemsByLot(ReceiptDiscrepancyItemsRequest request, string receiptCode)
        {
            try
            {
                var result = await _receiptdashboardservice.GetDicrepancyItemsByLot(request, receiptCode);

                return Ok(new
                {
                    error = result.Error,
                    data = result.Data,
                    totalRecords = result.TotalRecords,
                    message = "Successfully fetched data."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }


        }

        [HttpPost("create-po-receipt-lots-x3")]
        public async Task<IActionResult> CreatePoReceiptLotsInSagex3(CreatePoReceiptLotRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.CreatePoReceiptLotsInSagex3(request);
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

        [HttpPost("update-receipt-status-executing/{receiptId}")]
        public async Task<IActionResult> UpdateReceiptStatusExecuting(int receiptId, [FromBody] RejectReceiptRequest request)
        {
            try
            {
                var result = await _receiptdashboardservice.UpdateReceiptStatusExecuting(receiptId, request);

                if (result.Success)
                {
                    return Ok(new
                    {
                        error = 0,
                        message = result.Message
                    });
                }

                return Ok(new
                {
                    error = 1,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }
    }
}
