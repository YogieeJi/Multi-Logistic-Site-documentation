using System.Web.Http.Controllers;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AsnController : ControllerBase
    {
        private readonly IAsnService _asnService;
        public AsnController(IAsnService asnService)
        {
            _asnService = asnService;
        }

        [HttpPost("sync-shipments")]
        public async Task<IActionResult> SyncShipments()
        {
            try
            {
                var response = await _asnService.GetAsns();
                if (response.Error == 0)
                {
                    return StatusCode(201, response);
                }
                else
                {
                    return Ok(response);
                }
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Error while syncing data | " + ex.Message });
            }
        }

        [HttpPost("get-shipments")]
        public async Task<IActionResult> GetShipmentsGrid([FromBody] ShipmentsRequest request)
        {
            try
            {
                var result = await _asnService.GetShipmentsGrid(request);
                return Ok(new { data = result.Data,
                    next_cursor = result.next_cursor,
                    next_page_url = result.next_page_url,
                    path = result.path,
                    per_page = result.per_page,
                    prev_cursor = result.prev_cursor,
                    prev_page_url = result.prev_page_url,
                    totalRecords = result.TotalCount, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-shipments/{id}")]
        public async Task<IActionResult> GetShipmentDetail(int id)
        {
            var shipment = await _asnService.GetShipmentDetail(id);
            if (shipment == null)
            {
                return NotFound(new { message = "Shipment not found" });
            }
            return Ok(new { data = shipment });
        }

        [HttpPost("get-shipment-lines/{id}")]
        public async Task<IActionResult> GetShipmentLines([FromBody] ShipmentLinesRequest request, int id)
        {
            try
            {
                var result = await _asnService.GetShipmentLines(request, id);
                return Ok(new { data = result.Data, totalRecords = result.TotalCount, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("update-shipments-import-ready")]
        public async Task<IActionResult> UpdateImportReady([FromBody] UpdateShipmentRequest request)
        {
            try
            {
                bool isUpdated = await _asnService.UpdateImportReady(request);

                if (isUpdated)
                    return Ok(new { error = 0, message = "Shipment Updated Successfully" });

                return BadRequest(new { error = 1, message = "Update Failed" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("revalidate-shipment-items/{id}")]
        public async Task<IActionResult> RevalidateItems(int id)
        {
            try
            {
                var result = await _asnService.RevalidateItems(id);
                return Ok(new { error = 0, message = "Items Revalidated" });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Could not revalidate item | " + ex.Message });
            }
        }

        [HttpGet("get-item-attributes/{code}")]
        public async Task<IActionResult> GetItemAttributes(string code)
        {
            try
            {
                var response = await _asnService.GetItemAttributes(code);

                if (response.error == 1)
                {
                    return BadRequest(new
                    {
                        error = response.error,
                        message = response.message
                    });
                }

                return Ok(new
                {
                    error = response.error,
                    data = response.data,
                    message = response.message
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("update-item-attributes")]
        public async Task<IActionResult> UpdateItemAttributes([FromBody] UpdateItemAttributeRequest request)
        {
            try
            {
                var result = await _asnService.UpdateItemAttributes(request);
                return Ok(new 
                {
                    error=result.Error, 
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

         [HttpGet("revalidate-conveyable-items/{id}")]
        public async Task<IActionResult> RevalidateConveyAbleItems(int id)
        {
            try
            {
                var result = await _asnService.RevalidateConveyAbleItems(id);
                return Ok(new
                {
                    error = result.Error,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    error = 1,
                    message = "Unexpected server error while syncing data | " + ex.Message
                });
            }

        }

        [HttpGet("shipment-lines/{id}")]
        public async Task<IActionResult> DownloadShipmentLinesPdf(int id)
        {
            try
            {
                // Fetch a single record from DB
                var returnData = await _asnService.GetShipmentLinesByAsnId(id);

                // Check if null (record not found)
                if (returnData == null)
                {
                    return NotFound(new { error = 1, message = "No data found" });
                }

                // Wrap single object in a list to match method parameter
                var pdfBytes = PdfGenerator.GeneratePdf(returnData);

                // Return PDF file
                return File(pdfBytes, "application/pdf", $"shipment_lines_{id}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, error_message = ex.Message });
            }
        }

        [HttpPost("create-shipment-detail")]
        public async Task<IActionResult> CreateShipmentDetail([FromBody] CreateShipmentRequest request)
        {
            try
            {
                var result = await _asnService.CreateShipmentDetail(request);
                if (result.Error == 0)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            };
        }
            


    }
}
