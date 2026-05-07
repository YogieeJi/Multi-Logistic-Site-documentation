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
    public class PendingReceiptController : ControllerBase
    {
        private readonly IPendingReceiptService _pendingreceiptservice;

        public PendingReceiptController(IPendingReceiptService pendingreceiptservice)
        {
            _pendingreceiptservice = pendingreceiptservice;
        }
        [HttpPost("pending-receipts/get-list")]
        public async Task<IActionResult> getPendingReceiptList()
        {
            try
            {
                var data = await _pendingreceiptservice.getPendingReceiptList();

                return Ok(new
                {
                    Message = data.Message,
                    IsSuccess = data.IsSuccess,
                    Data = data.Data

                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while fetching picklist IDs" + ex.Message
                });
            }
        }
        [HttpGet("get-lane-status")]
        public async Task<IActionResult> getLaneStatus()
        {
            try
            {
                var data = await _pendingreceiptservice.getLaneStatus();

                return Ok(new
                {
                    error = 0,
                    laneData = data.laneData,
                    ErrorLane = data.ErrorLane,
                    message = data.message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while fetching picklist IDs" + ex.Message
                });
            }
        }
        [HttpGet("laneusers")]
        public async Task<IActionResult> getUserLane()
        {
            var data = await _pendingreceiptservice.getUserLane();
            return Ok(data);
        }
        [HttpGet("get-all-products/{id}")]
        public async Task<IActionResult> getAllProducts(string id)
        {
            var result = await _pendingreceiptservice.GetAllProductsAsync(id);
            return Ok(result);
        }
        [HttpGet("get-all-slots")]
        public async Task<IActionResult> getAllSlots()
        {
            var result = await _pendingreceiptservice.GetAllSlotsAsync();
            return Ok(result);
        }
        [HttpGet("get-receiving-plan/{id}")]
        public async Task<IActionResult> GetReceivingPlan(string id) //HMMU6327768 C
        {
            var result = await _pendingreceiptservice.GetReceivingPlanAsync(id);
            return Ok(result);
        }
        [HttpPost("create-receiving-item")]
        public async Task<IActionResult> CreateReceivingItem([FromBody] CreateReceivingItemRequest request)
        {
            var result = await _pendingreceiptservice.CreateReceivingItemAsync(request);
            return Ok(result);
        }
        [HttpPost("generate-receiving-plan/{id}")]
        public async Task<IActionResult> GenerateReceivingPlan(int id, [FromBody] GeneratePlanRequest request)
        {
            var result = await _pendingreceiptservice.GenerateReceivingPlanAsync(id, request.RemoveOldPlan);
            return Ok(result);
        }
        [HttpPost("receipt/delete/{id}")]
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            try
            {
                var result = await _pendingreceiptservice.DeleteReceiptAsync(id);

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
                    message = $"Error while processing receipt deletion: {ex.Message}"
                });
            }
        }
        [HttpGet("delete-receiving-plan/{id}")]
        public async Task<IActionResult> DeleteReceivingPlan(int id)
        {
            try
            {
                var response = await _pendingreceiptservice.DeleteReceivingPlanAsync(id);

                return Ok(new
                {
                    error = response.error,
                    message = response.message
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
        [HttpPost("update-receiving-plan/{id}")]
        public async Task<IActionResult> UpdateReceivingPlan(int id, [FromBody] UpdateReceivingPlanRequest request)
        {
            var result = await _pendingreceiptservice.UpdateReceivingPlanAsync(id, request);
            return Ok(result);
        }
        [HttpPost("MarkReceiptBulk")]
        public async Task<IActionResult> MarkReceiptBulk([FromBody] MarkReceiptBulkRequest request)
        {
            var result = await _pendingreceiptservice.MarkReceiptBulkAsync(request.id, request.value);
            return Ok(result);
        }
        [HttpPost("reset-receipt")]
        public async Task<IActionResult> ResetReceipt([FromBody] ResetReceiptRequest request)
        {
            try
            {
                var result = await _pendingreceiptservice.ResetReceiptAsync(request.Id);

                return Ok(new
                {
                    error = result.Error,
                    code = result.Code,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = $"Error while resetting receipt: {ex.Message}"
                });
            }
        }
        [HttpPost("mark-container-status")]
        public async Task<IActionResult> MarkContainerStatus([FromBody] MarkContainerStatusRequest request)
        {
            try
            {
                var result = await _pendingreceiptservice.MarkContainerStatusAsync(request.Id, request.Action);

                return Ok(new
                {
                    error = result.Error,
                    code = result.Code,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = $"Error while processing container status: {ex.Message}"
                });
            }
        }
    }
}
