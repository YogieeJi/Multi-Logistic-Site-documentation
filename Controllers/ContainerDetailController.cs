using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;
using Org.BouncyCastle.Asn1.Ocsp;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContainerDetailController : ControllerBase
    {
        #region constructor 
        private readonly IContainerDetailsService _containerService;
        public ContainerDetailController(IContainerDetailsService containerService)
        {
            _containerService = containerService;
        }
        #endregion

        #region getManualContainersGrid
        [HttpPost("get-manual-containers")]
        public async Task<IActionResult> GetManualContainersGrid([FromBody] ContainerRequest request)
        {
            try
            {
                var result = await _containerService.GetManualContainersGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    totalRecords = result.TotalCount,
                    Message = "Successful",
                    template_url = result.TemplateUrl,
                    bulk_template_url = result.BulkTemplateUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        #endregion

        #region getManualContainerById
        [HttpPost("get-manual-containers/{id}")]
        public async Task<IActionResult> GetManualContainerDetail(int id)
        {
            var data = await _containerService.GetManualContainerById(id);
            if (data == null)
            {
                return NotFound(new { Message = "Container not found" });
            }
            return Ok(new { Data = data });
        }
        #endregion

        #region GetManualContainerLinesById
        [HttpPost("get-manual-container-lines/{id}")]
        public async Task<IActionResult> GetManualContainerLines([FromBody] ManualContainerDetailRequest request, int id)
        {
            try
            {
                var result = await _containerService.GetManualContainerLines(request, id);
                return Ok(new { data = result.Data, totalRecords = result.TotalCount, Message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal Server Error | " + ex.Message });
            }
        }
        #endregion

        [HttpPost("update-container-import-ready")]
        public async Task<IActionResult> UpdateImportReady([FromBody] UpdateManualContainerRequest request)
        {
            try
            {
                bool isUpdated = await _containerService.UpdateImportReady(request);

                if (isUpdated)
                {
                    return Ok(new { error = 0, message = "Container Updated Successfully" });
                }

                return BadRequest(new { error = 1, message = "No containers were updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("delete-containers")]
        public async Task<IActionResult> deleteContainer([FromBody] ManualContainerDeleteRequest request)
        {
            try
            {
                var isDeleted = await _containerService.deleteContainer(request);

                if (isDeleted.error == 0)
                {
                    return Ok(new { error = 0, message = "Container(s) deleted Successfully." });
                }

                return BadRequest(new { error = 1, message = isDeleted.message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpGet("sync-intersite-transfer")]
        public async Task<IActionResult> SyncIntersiteShipment()
         {
            try
            {
                var result = await _containerService.SyncIntersiteShipment();

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

        [HttpPost("revalidate-container-conveyable-items/{id}")]
        public async Task<IActionResult> RevalidateConveyAbleItems(int id)
        {
            try
            {
                var result = await _containerService.RevalidateConveyAbleItems(id);
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
       
        [HttpPost("revalidate-container-items/{id}")]
        public async Task<IActionResult> RevalidateItems(int id)
        {
            try
            {
                var result = await _containerService.RevalidateItems(id);
                if (result.Error == 1)
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
                return StatusCode(500, new { error = 1, message = $"Could not revalidate item | {ex.Message}" });
            }
        }

        [HttpGet("container-lines/{id}")]
        public async Task<IActionResult> downloadshipmentlinespdf(int id)
        {
            try
            {

                var returndata = await _containerService.GetContainerLinesByAsnId(id);

                // check if null (record not found)
                if (returndata == null)
                {
                    return NotFound(new { error = 1, message = "no data found" });
                }

                //wrap single object in a list to match method parameter
                var pdfbytes = PdfGenerator.GeneratePdf(returndata);


                //return pdf file
                return File(pdfbytes, "application/pdf", $"container_lines_{id}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, error_message = ex.Message });
            }
        }

        [HttpPost("upload-manual-containers")]
        public async Task<IActionResult> UploadContainers([FromBody] UploadContainerRequest request)
        {
            try
            {
                var result = await _containerService.UploadContainers(request);
                return Ok(new { error = result.Error, message = result.Message });

}
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }

        }
        [HttpPost("Mark-Receipt-Complete")]
        public async Task<IActionResult> MarkReceiptComplete([FromBody] MarkReceiptCompleteRequest request)
        {

            try
            {
                var result = await _containerService.MarkReceiptComplete(request);
                if (result.Error == 1)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message });

                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("remove-reservation")]
        public async Task<IActionResult> RemoveReservation([FromBody] RemoveReservationRequest request)
        {
            try
            {
                var result = await _containerService.RemoveReservation(request);
                if (result.Error == 1)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }
                else
                {
                    return Ok(new { error = result.Error, message = result.Message });

                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("create-container-detail")]
        public async Task<IActionResult> CreateContainerDetail([FromBody] CreateContainerDetailRequest request)
        {
            try

            {
                var result = await _containerService.CreateContainerDetail(request);
                if (result.Error == 1)
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }
                else
                {
                    return Ok(new
                    {
                        error = result.Error,
                        message = result.Message
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
            
        }

    }

}
