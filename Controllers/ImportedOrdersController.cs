using System.Runtime.CompilerServices;
using System.Text.Json;
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
    public class ImportedOrdersController : ControllerBase
    {
        private readonly IImportedOrdersService _importedOrdersService;
        private readonly IDeliveryService _deliveryService;


        public ImportedOrdersController(IImportedOrdersService importedOrdersService, IDeliveryService deliveryService)
        {
            _importedOrdersService = importedOrdersService;
            _deliveryService = deliveryService;
        }

        [HttpPost("get-imported-orders")]
        public async Task<IActionResult> GetImportedOrdersGrid([FromBody] ImportedOrdersRequest request)
        {
            try
            {
                var result = await _importedOrdersService.GetImportedOrdersGrid(request);
                return Ok(new
                {
                    data = result.Data,
                    next_cursor = result.Next_cursor,
                    next_page_url = result.Next_page_url,
                    path = result.Path,
                    per_page = result.Per_page,
                    prev_cursor = result.Prev_cursor,
                    prev_page_url = result.Prev_page_url,
                    totalRecords = result.TotalCount,
                    message = "Successful",
                    template_url = result.TemplateUrl,
                    bulk_order_template_url = result.BulkOrderTemplateUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-imported-orders/{id}")]
        public async Task<IActionResult> GetImportedOrderDetail(int id)
        {
            var result = await _importedOrdersService.GetImportedOrderDetail(id);
            if (result == null)
            {
                return NotFound(new { message = "Order not found" });
            }
            return Ok(new { data = result });
        }

        [HttpPost("get-imported-orders-lines/{id}")]
        public async Task<IActionResult> GetImportedOrderLinesById(OrderLinesRequest request, int id)
        {
            try
            {
                var result = await _importedOrdersService.GetImportedOrderLinesById(request, id);
                return Ok(new { data = result.Data, totalRecords = result.TotalCount, Message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("manual-sync-picklist-details")]
        public async Task<IActionResult> ManualSyncPickListDetails([FromBody] PickListRequest request)
        {
            try
            {
                var result = await _importedOrdersService.ManualSyncPickListDetails(request);
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
                return StatusCode(500, new { error = 1, message = $"Error while syncing data | {ex.Message}" });
            }
        }

        [HttpPost("get-pick-list-details")]
        public async Task<IActionResult> processPickListOrders([FromBody] PickListRequestSync request)
        {
            try
            {
                foreach (var pickListId in request.orders)
                {
                    var response = await _importedOrdersService.SyncPickListDetails(pickListId, request.UserId, request.UserName, request.UserEmail);

                    if (response.Message == "No Picklist details found in Sage")
                    {
                        return Ok(new { error = 0, message = "No Picklist details found in Sage" });
                    }
                    return Ok(new { error = 0, message = "Data Synced Successfully" });
                }
                return Ok(new { error = 0, message = "Data Synced Successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while syncing data | {ex.Message}" });
            }
        }

        [HttpPost("manual-order-complete")]
        public async Task<IActionResult> ManualOrderComplete([FromBody] ManualOrderCompleteRequest request)
        {
            try
            {
                var result = await _importedOrdersService.ManualOrderComplete(request.Orders);
                return Ok(new { error = 0, message = "Order Marked Manual Complete Successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-order-pallets-count")]
        public async Task<IActionResult> GetOrderPalletsCount([FromBody] List<OrderPalletsRequest> request)
        {
            try
            {
                int count = await _importedOrdersService.GetOrderPalletsCount(request[0].pick_list_id);
                if (count == 0)
                {
                    return Ok(new { error = 0, data = count, message = "Data Found Successfully" });
                }
                else
                {
                    return NotFound(new { error = 1, message = "Data Not Found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("assign-imported-orders-to-user-loc")]
        public async Task<IActionResult> AssignOrdersToUserLoc([FromBody] AssignOrdersRequest request)
        {
            try
            {
                var response = await _importedOrdersService.AssignOrdersToUserLoc(request);
                if (response.Error == 0)
                {
                    return Ok(new { error = 0, message = "Order Assigned Successfully" });
                }
                return Ok(new { error = 1, message = response.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }
        [HttpPost("assign-imported-order-lines-to-user-loc")]
        public async Task<IActionResult> AssignOrderLinesToUserLoc([FromBody] AssignOrderLinesRequest request)
        {
            try
            {
                var response = await _importedOrdersService.AssignOrderLinesToUserLoc(request);
                if (response.Error == 0)
                {
                    return Ok(new { error = 0, message = "Order Assigned Successfully" });
                }
                return Ok(new { error = 1, message = response.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }
        [HttpPost("delete-order")]
        public async Task<IActionResult> DeleteOrder([FromBody] DeleteOrderRequest request)
        {
            if (request.OrderIds == null || request.OrderIds.Count == 0)
            {
                return BadRequest(new { error = 1, message = "Invalid order IDs." });
            }

            var result = await _importedOrdersService.DeleteOrders(request.OrderIds);
            return Ok(result);
        }

        [HttpPost("get-all-order-pallets-count")]
        public async Task<IActionResult> GetAllOrderPalletsCount([FromBody] List<OrderRequestDto> orders)
        {
            try
            {
                if (orders == null || !orders.Any())
                {
                    return BadRequest(new { error = 1, message = "Invalid request data" });
                }

                var totalCount = await _importedOrdersService.GetAllOrderPalletsCount(orders);
                return Ok(new { error = 0, data = totalCount, message = "Data Found Successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("assign-lanes-to-imported-orders")]
        public async Task<IActionResult> AssignLanes([FromBody] AssignLanesRequest request)
        {
            try
            {
                var result = await _importedOrdersService.AssignLanes(request);

                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return BadRequest(new { error = result.Error, message = result.Message });
                }
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

        [HttpPost("load-imported-orders")]
        public async Task<IActionResult> LoadOrders([FromBody] LoadOrdersResquest? orders)
        {
            try
            {
                await _importedOrdersService.LoadOrders(orders);
                return Ok(new { error = 0, message = "Load & Close Initiated Successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("load-and-close")]
        public async Task<IActionResult> MiddlewareJobs([FromBody] PayloadModel payload)
        {
            try
            {
                var result = await _importedOrdersService.MiddlewareJobs(payload);

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
                return StatusCode(500, new { error = 1, message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("re-execute-order")]
        public async Task<IActionResult> ReExecuteOrder([FromBody] ReExecuteOrderRequest request)
        {
            try
            {
                await _importedOrdersService.ReExecuteOrders(request.Orders);
                return Ok(new { error = 0, message = "Order(s) marked as Re-executed" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }


        [HttpPost("append-orders")]
        public async Task<IActionResult> AppendOrders([FromBody] AppendOrdersRequest request)
        {
            if (request.Orders == null || !request.Orders.Any())
            {
                return BadRequest(new { error = 1, message = "No Record Selected" });
            }

            try
            {
                var result = await _importedOrdersService.AppendOrders(request.Orders);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Error while appending orders | " + ex.Message });
            }
        }

        [HttpPost("not-re-execute-order")]
        public async Task<IActionResult> NotReExecuteOrder([FromBody] NotReExecuteOrderRequest request)
        {
            try
            {
                await _importedOrdersService.NotReExecuteOrder(request.Orders);
                return Ok(new { error = 0, message = "Order(s) marked as 'Not re-executed'" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpGet("archive-compeleted-order")]
        public async Task<IActionResult> ArchiveCompletedOrders()
        {
            try
            {
                var result = await _importedOrdersService.ArchiveCompletedOrders();

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

        [HttpPost("upload-imported-orders")]
        public async Task<IActionResult> UploadOrders([FromBody] List<ImportedOrderDetail> request)
        {
            try
            {
                var result = await _importedOrdersService.UploadedOrders(request);
                return StatusCode(result.StatusCode, result.Response);
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Could not upload file | " + ex.Message });
            }
        }

        [HttpPost("get-order-tasks")]
        public async Task<IActionResult> GetOrderTasks([FromBody] OrderTaskRequest request)
        {
            try
            {
                var result = await _importedOrdersService.GetOrderTasks(request);
                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = "Successfully fetched data" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Error while getting order task: {ex.Message}" });
            }
        }

        [HttpGet("get-orders-list")]
        public async Task<IActionResult> SyncOrder()
        {
            try
            {
                /* Pass 'Manual' when called from syncOrder*/
                await _importedOrdersService.GetList("Scheduler");
                await _importedOrdersService.GetPickListDetails("Scheduler");

                return Ok(new { error = 0, message = "Synced Order request posted to X3" });
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error syncing order");
                return StatusCode(500, new { error = 1, message = "Error syncing order | " + ex.Message });
            }
        }

        [HttpPost("revalidate-order-items/{id}")]
        public async Task<IActionResult> RevalidateItems(int id)
        {
            try
            {
                var result = await _importedOrdersService.RevalidateItems(id);
                return Ok(new { error = 0, message = "Items Revalidated" });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Could not revalidate item | " + ex.Message });
            }
        }

        [HttpPost("manual-order-status-complete")]
        public async Task<IActionResult> ManualOrderStatusComplete([FromBody] ManualOrderRequest request)
        {
            try
            {
                var result = await _importedOrdersService.ManualOrderStatusComplete(request);
                return Ok(new { error = result.Error, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("order-shipment-locaiton-release")]
        public async Task<IActionResult> OrderShipmentRelease([FromBody] OrderShipmentReleaseRequest request)
        {
            try
            {
                var result = await _importedOrdersService.OrderShipmentRelease(request);

                if (result.Error == 1)
                    return Ok(new { error = result.Error, message = result.Message });

                return Ok(new { error = result.Error, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = 1,
                    Code = 500,
                    Message = $"Internal Server Error | {ex.Message}"
                });
            }
        }

        [HttpGet("order-types")]
        public async Task<IActionResult> GetOrderTypes()
        {
            try
            {
                var orderTypes = await _importedOrdersService.GetOrderTypes();
                return Ok(new { error = 0, message = "Order Types fetched", data = orderTypes });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("assign-order-type")]
        public async Task<IActionResult> AssignOrderType([FromBody] AssignOrderTypeRequest? request)
        {
            try
            {
                await _importedOrdersService.AssignOrderType(request);
                return Ok(new { error = 0, message = "Order Type Assigned Successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal Server Error | {ex.Message}" });
            }
        }

        [HttpPost("get-order-item")]
        public async Task<IActionResult> GetOrderItem([FromBody] OrderItemGridRequest request)
        {
            try
            {
                var result = await _importedOrdersService.GetOrderItem(request);
                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = "successfully fetched data" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("create-delivery-imported-orders")]
        public async Task<IActionResult> manualCreateDelivery([FromBody] PickListRequest request)
        {
            try
            {
                var response = await _importedOrdersService.ManualSyncPickListDetails(request);
                return StatusCode(response.StatusCode, response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while syncing data | {ex.Message}" });
            }
        }

        [HttpPost("bulk-load-orders")]
        public async Task<IActionResult> BulkLoadOrders([FromBody] BulkLoadOrderRequest request)
        {
            try
            {
                var result = await _importedOrdersService.BulkLoadOrders(request);

                if (result.Error == 0)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }

                return BadRequest(new { error = 1, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "An error occurred while processing the file.", details = ex.Message });
            }
        }

        [HttpPost("get-order-export")]
        public async Task<IActionResult> GetOrderExport([FromBody] OrderExportFilter request)
        {
            var result = await _importedOrdersService.GetOrderExportData(request);
            return Ok(result);
        }
        [HttpPost("create-delivery-imported-orders-new")]
        public async Task<IActionResult> manualCreateDeliveryNew([FromBody] DeliveryOrderRequest orders)
        {
            var result = await _deliveryService.CreateDeliveriesNew(orders);
            return Ok(result);
        }
        [HttpPost("create-delivery-imported-orders-new-Changes")]
        public async Task<IActionResult> manualCreateDeliveryNewChanges([FromBody] DeliveryOrderRequest orders)
        {
            var result = await _deliveryService.CreateDeliveriesNewChanges(orders);
            return Ok(result);
        }
        [HttpGet("get-picklist-ids")]
        public async Task<IActionResult> GetPickListIds()
        {
            var (error, data, totalRecords) = await _importedOrdersService.GetPickListIdsAsync();

            if (error == 0)
            {
                return Ok(new
                {
                    error = 0,
                    data = data,
                    totalRecords = totalRecords
                });
            }
            else
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while fetching picklist IDs"
                });
            }
        }

        [HttpPost("get-order-short-data-export")]
        public async Task<IActionResult> GetOrderShortDataExport(OrderShortDataExportRequest request)
        {
            var result = await _importedOrdersService.GetOrderShortDataExportAsync(request);
            return Ok(result);
        }

        [HttpPost("get-order-export-detail")]
        public async Task<IActionResult> GetOrderTaskDetails([FromBody] OrderTaskDetailRequest request)
        {
            try
            {
                var (data, total) = await _importedOrdersService.GetOrderTaskDetailsAsync(request);
                return Ok(new
                {
                    error = 0,
                    data = data,
                    totalRecords = total,
                    message = "Success"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("cancel-orders")]
        public async Task<IActionResult> CancelOrders([FromBody] CancelOrderRequest request)
        {
            try
            {
                var result = await _importedOrdersService.CancelOrders(request);

                if (!string.IsNullOrEmpty(result.Message) && result.Message.Contains("Success(1)", StringComparison.OrdinalIgnoreCase))
                {
                    var nextStep = await _importedOrdersService.CancelOrderSageX3(request);
                }


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
                return StatusCode(500, new { error = 1, message = ex.Message });
            }

        }

        [HttpPost("cancel-item")]
        public async Task<IActionResult> CancelItems([FromBody] CancelOrderRequest request)
        {
            try
            {
                var result = await _importedOrdersService.CancelItems(request);
                if (result.Error == 0)
                {
                    var result1 = await _importedOrdersService.CancelItemSageX3(request);
                }

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
                return StatusCode(500, new { error = 1, message = ex.Message });
            }

        }

        [HttpPost("sector-codes/{orderCode}")]
        public async Task<IActionResult> GetSectorCodes(string? orderCode)
        {
            if (string.IsNullOrWhiteSpace(orderCode))
            {
                return BadRequest(new { error = true, message = "OrderCode is required." });
            }

            try
            {
                var result = await _importedOrdersService.GetSectorCodes(orderCode);
                return Ok(new { data = result, error = 0 });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = true,
                    message = "Failed to fetch sector codes. Please try again later.",
                    exception = ex.Message
                });
            }
        }

        [HttpPost("update-task")]
        public async Task<IActionResult> UpdateTasks([FromBody] UpdateTaskRequest request)
        {
            try
            {
                var result = await _importedOrdersService.UpdateTasks(request); ;

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
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("get-task-wise-mantis-users")]
        public async Task<IActionResult> GettaskwiseMantisUsers([FromBody] List<taskwiseuser> request)
        {
            var cust_code = request[0].customer_code != null
                ? request[0].customer_code
                : request[0].bpcord;
            var users = await _importedOrdersService.GettaskwiseMantisUsers(cust_code);
            return Ok(new { data = users, error = 0 });
        }

    }
}

