using System;
using System.Collections.Generic;
using System.Data;
using System.Formats.Asn1;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Resources;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web.Mvc.Html;
using CsvHelper;
using CsvHelper.Configuration;
using ExcelDataReader;
using Hangfire;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualBasic;
using Middleware.Data.Repository;
using MiddlewareWebAPI.Common.Enum;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using OfficeOpenXml;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Bcpg;
using static MiddlewareWebAPI.Common.Enum.EnumData;
using System.Linq;
using System.Xml.Linq;
using static System.Runtime.InteropServices.JavaScript.JSType;
using SendGrid.Helpers.Mail;
using SendGrid;
using static iTextSharp.text.pdf.AcroFields;
using System.Net.Mail;
using iText.Commons.Actions.Contexts;

namespace MiddlewareWebAPI.Services.Services
{
    public class ImportedOrdersService : IImportedOrdersService
    {
        private readonly IImportedOrdersRepository _importedOrdersRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IValidateItemHelper _validateItemHelper;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly INotificationLogsService _notificationLogsService;
        private readonly IActivityLogRepository _IActivityLogRepository;

        public ImportedOrdersService(IImportedOrdersRepository importedOrdersRepository, IBackgroundJobClient backgroundJobClient, HttpClient httpClient, IConfiguration configuration, IValidateItemHelper validateItemHelper, IHttpClientFactory httpClientFactory, INotificationLogsService notificationLogsService, IActivityLogRepository iActivityLogRepository)
        {
            _importedOrdersRepository = importedOrdersRepository;
            _backgroundJobClient = backgroundJobClient;
            _httpClient = httpClient;
            _configuration = configuration;
            _validateItemHelper = validateItemHelper;
            _httpClientFactory = httpClientFactory;
            _notificationLogsService = notificationLogsService;
            _IActivityLogRepository = iActivityLogRepository;
        }

        public async Task<ImportedOrdersResponse> GetImportedOrdersGrid(ImportedOrdersRequest request)
        {
            return await _importedOrdersRepository.GetImportedOrdersGrid(request);
        }
        public async Task<IEnumerable<OrderTypeRequest>> GetOrderTypes()
        {
            return await _importedOrdersRepository.GetOrderTypes();
        }

        public async Task<IEnumerable<ImportedOrder>> GetImportedOrderDetail(int id)
        {
            return await _importedOrdersRepository.GetImportedOrderDetail(id);
        }

        public async Task<OrderLinesResponse> GetImportedOrderLinesById(OrderLinesRequest request, int id)
        {
            return await _importedOrdersRepository.GetImportedOrderLinesById(request, id);
        }

        public async Task<PickListResponse> ManualSyncPickListDetails(PickListRequest request)
        {
            try
            {
                var firstOrder = request.Order?.FirstOrDefault();
                if (firstOrder == null)
                {
                    return new PickListResponse { Error = 1, Message = "No picklist orders" };
                }

                var data = await _importedOrdersRepository.GetImportedOrderById(firstOrder.id);
                var syncPickListData = data.FirstOrDefault();
                if (data == null)
                {
                    return new PickListResponse { Error = 1, Message = "Order not found" };
                }

                if (syncPickListData?.is_sync == 1 || syncPickListData?.source?.ToLower() != "x3")
                {
                    return new PickListResponse { Error = 1, Message = "Picklist already synced" };
                }

                // This condition is used while calling the Sync Details API.
                //if (syncPickListData?.is_sync == 1 || (syncPickListData?.source != null && syncPickListData.source.ToLower() != "x3"))
                //{
                //    return new PickListResponse { Error = 1, Message = "Picklist already synced" };
                //}

                var response = await picklistDetailApiCall(syncPickListData, "Scheduler");

                return new PickListResponse
                {
                    Error = response.Error,
                    Message = response.Message
                };
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "error",
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    api_action_type = "PickList Lines Scheduler",
                    description = "PickList Lines Scheduler | Exception",
                    created_at = DateTime.UtcNow
                });
                return new PickListResponse { Error = 1, Message = $"Error while syncing data | {ex.Message}" };
            }
        }

        public async Task<bool> ManualOrderComplete(List<ManualOrderCompleteOrder> orders)
        {
            foreach (var order in orders)
            {
                var existingOrder = (await _importedOrdersRepository.GetOrderById(order.id))?.FirstOrDefault();
                if (existingOrder != null && existingOrder.is_exported != 2)
                {
                    //existingOrder.is_exported = 6;
                    await _importedOrdersRepository.UpdateOrder(existingOrder);
                }
            }
            return true;
        }

        public async Task AssignOrderType(AssignOrderTypeRequest request)
        {
            foreach (var order in request.Orders)
            {
                await _importedOrdersRepository.UpdateOrderType(order.id, request.order_type);
            }
        }

        public async Task<int> GetOrderPalletsCount(string pick_list_id)
        {
            return await _importedOrdersRepository.GetOrderPalletsCount(pick_list_id);
        }

        public async Task<AssignOrdersResponse> AssignOrdersToUserLoc(AssignOrdersRequest request)
        {
            try
            {
                return await _importedOrdersRepository.AssignOrdersToUserLoc(request);
            }
            catch (Exception ex)
            {
                return new AssignOrdersResponse { Error = 1, Message = $"Internal Server Error | {ex.Message}" };
            }
        }

        public async Task<ResponseDto> DeleteOrders(List<int> orderIds)
        {
            return await _importedOrdersRepository.DeleteOrders(orderIds);
        }

        public async Task<int> GetAllOrderPalletsCount(List<OrderRequestDto> orders)
        {
            var pickListIds = orders.Select(o => o.pick_list_id).ToList();
            return await _importedOrdersRepository.GetAllOrderPalletsCount(pickListIds);
        }

        public async Task<ResponseResult> AssignLanes(AssignLanesRequest request)
        {
            try
            {
                await _importedOrdersRepository.AssignLanes(request);

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Lanes Assigned Successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Internal Server Error | " + ex.Message
                };
            }
        }

        public async Task LoadOrders(LoadOrdersResquest? orders)
        {
            try
            {
                foreach (var order in orders?.selectedDelivery)
                {
                    var importedOrder = (await _importedOrdersRepository.GetOrderByPickListId(order.pick_list_id))?.FirstOrDefault();
                    if (importedOrder != null)
                    {
                        importedOrder.lv_status = "In-Progress";
                        await _importedOrdersRepository.UpdateLoadOrders(importedOrder);

                        // Insert jobs data from the cus_jobs table. 
                        var job = new JobModel
                        {
                            queue = "loadclose",
                            payload = JsonConvert.SerializeObject(new
                            {
                                user = orders.userName,
                                picklist_id = importedOrder.id,
                                pick_list_id = importedOrder.pick_list_id,
                                failJobs = 0
                            }),
                            attempts = 0,
                            reserved_at = null,
                            available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                            created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        };

                        await _importedOrdersRepository.InsertLoadOrdersJob(job);

                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<ResponseResult> MiddlewareJobs(PayloadModel payload)
        {
            if (payload == null) return new ResponseResult { Error = 1, Message = "Payload is null." }; ;

            var pickListId = payload.pick_list_id;
            var user = payload.user;

            try
            {
                // Get Order‑ID
                var orderId = await _importedOrdersRepository.GetOrderIdByPickListId(pickListId!);
                if (orderId is null or 0) return new ResponseResult { Error = 1, Message = "Order not found for Pick‑List." }; ;

                // Call For External Mantis API 
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                // Add the ApiKey to the request headers (like Postman)
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);

                // Optional: Accept JSON response
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                string request = $"/api/Order/LoadOrder?OrderID={orderId}&LoadAndClose=true&DeletePendingTask=true";
                var fullUrl = new Uri(client.BaseAddress, request);

                var urlResponse = await client.PutAsync(fullUrl, null);
                urlResponse.EnsureSuccessStatusCode();

                var response = await urlResponse.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(response);

                //  Log Sync attempt
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "sync",
                    user_name = user,
                    subject_ref = pickListId,
                    properties = JsonConvert.SerializeObject(new { request = fullUrl, response = result }),
                    api_action_type = "Order Load & Close Job",
                    description = "Order Load & Close Job",
                    created_at = DateTime.UtcNow
                });

                // Log success / error
                var eventName = (bool)(result?.IsSuccess ?? false) ? "success" : "error";
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = eventName,
                    user_name = user,
                    subject_ref = pickListId,
                    properties = JsonConvert.SerializeObject(
                                        new { data = new { message = (string?)result?.Message ?? "Order Load & Closed Successfully" } }),
                    api_action_type = "Order Load & Close Job",
                    description = "Order Load & Close Job",
                    created_at = DateTime.UtcNow
                });

                if (eventName == "error")
                    return new ResponseResult { Error = 1, Message = "Job is failed." };

                //  Lane / pallet clean‑up
                var pallets = await _importedOrdersRepository.GetOrderLaneAssignments(pickListId!);
                foreach (var p in pallets)
                {
                    await _importedOrdersRepository.DeleteOrderLaneAssignment(p.id);
                    await _importedOrdersRepository.UpdateLaneSlotAvailability(p.lane, true);
                    await _importedOrdersRepository.UpdateImportedOrderLaneAssigned(p.order_code!);
                }

                // Mark order closed
                await _importedOrdersRepository.UpdateImportedOrderStatus(pickListId, "Closed");

                return new ResponseResult { Error = 0, Message = "Job created successfully." };
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "error",
                    user_name = payload.user,
                    subject_ref = payload.pick_list_id,
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    api_action_type = "Order Load & Close Job",
                    description = "Order Load & Close Job",
                    created_at = DateTime.UtcNow
                });

                return new ResponseResult { Error = 1, Message = $"Job failed | {ex.Message}" };
            }
        }

        public async Task ReExecuteOrders(List<ReExecuteOrder>? orders)
        {
            foreach (var order in orders)
            {
                await _importedOrdersRepository.UpdateReExecuteStatus(order.id);
            }
        }

        public async Task<AppendOrdersResponseModel> AppendOrders(List<AppendOrdersDto>? orders)
        {
            foreach (var order in orders)
            {
                await _importedOrdersRepository.ExecuteUpdateMissingOrderLines(order.pick_list_id);
            }

            return new AppendOrdersResponseModel { Error = 0, Message = "Order Appended." };
        }

        public async Task NotReExecuteOrder(List<NotReExecuteOrderDto>? orders)
        {
            var orderIds = orders.Select(o => o.id).ToList();
            if (orderIds.Any())
            {
                await _importedOrdersRepository.UpdateReExecuteStatus(orderIds);
            }
        }

        public async Task<ResponseResult> ArchiveCompletedOrders()
        {
            return await _importedOrdersRepository.ArchiveCompletedOrders();
        }

        public async Task<OrderTaskResponse> GetOrderTasks(OrderTaskRequest request)
        {
            return await _importedOrdersRepository.GetOrderTasks(request);
        }

        public async Task<(int StatusCode, object Response)> UploadedOrders(List<ImportedOrderDetail> orders)
        {
            if (orders == null || !orders.Any())
            {
                return (201, new { error = 1, message = "No orders found in uploaded data" });
            }

            await _importedOrdersRepository.UploadedOrders(orders);

            return (200, new { error = 0, message = "Excel file uploaded successfully" });
        }

        public async Task<object> GetList(string actionType = "Scheduler")
        {
            try
            {
                var lastOrder = await _importedOrdersRepository.GetLastImportedOrder("x3");
                // 1. Build the HTTP client and request
                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];

                //2.SSL Error Fixed this code
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler);
                client.BaseAddress = new Uri(baseUrl);
                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
                string request;

                if (lastOrder != null)
                {
                    var date = lastOrder.sage_created_at.Value.ToString("yyyy-MM-ddTHH:mm:ssZ");
                    //url = $"YSTOPREH?representation=YSTOPRE.$query&key=gt.PIC2411-02507&orderBy=PRHNUM&where=CREDATTIM ge @2024-01-04T19:33:03Z@and STOFCY eq %27NYMT%27&count=50";
                    request = $"YSTOPREH?representation=YSTOPRE.$query&key=gt.{lastOrder.pick_list_id}&orderBy=PRHNUM&where=CREDATTIM ge @{date}@and STOFCY eq %27NYMT%27&count=20";
                }
                else
                {
                    var date = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ");
                    //url = $"YSTOPREH?representation=YSTOPRE.$query&orderBy=PRHNUM&where=CREDATTIM ge @{date}@and STOFCY eq %27NYMT%27&count=50";
                    request = $"YSTOPREH?representation=YSTOPRE.$query&orderBy=PRHNUM&where=CREDATTIM ge @{date}@and STOFCY eq %27NYMT%27&count=20";
                }

                /* Static data fecthing stage x3 Api*/
                //request = $"YSTOPREH?representation=YSTOPRE.$query&key=gt.PIC2506-01346&orderBy=PRHNUM&where=CREDATTIM ge @2025-06-06T00:00:01Z@and STOFCY eq %27NYMT%27&count=30";
                //https://38.147.85.148:28843/api1/x3/erp/DYN01/YSTOPREH?representation=YSTOPRE.$query&key=gt.PIC2506-00001&orderBy=PRHNUM&where=CREDATTIM ge @2025-07-22T10:45:19Z@and STOFCY eq %27NYMT%27&count=1000

                var fullUrl = new Uri(client.BaseAddress, request);
                var urlResponse = await client.GetAsync(fullUrl);
                urlResponse.EnsureSuccessStatusCode();

                var result = await urlResponse.Content.ReadAsStringAsync();
                var response = JsonConvert.DeserializeObject<dynamic>(result);
                var orderData = response?["$resources"];

                /* 3. The method is called ActivityLog */
                var properties = new { request, response };
                var log = new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "sync",
                    properties = JsonConvert.SerializeObject(properties),
                    description = $"PickList {actionType}",
                    api_action_type = $"PickList {actionType}",
                    created_at = DateTime.UtcNow
                };

                await _IActivityLogRepository.ActivityLog(log);

                foreach (var resource in orderData)
                {
                    var pickListId = resource["PRHNUM"]?.ToString();
                    var CustomerCode = resource["BPCORD"]?.ToString();
                    var existing = await _importedOrdersRepository.GetByPickListId(pickListId);
                    var status = PicklistStatuses.Pending;
                    string description = EnumData.GetDescription(status);
                    var order = new ImportedOrder
                    {
                        pick_list_id = pickListId,
                        sage_created_at = Convert.ToDateTime(resource["CREDATTIM"].ToString()),
                        status = description,
                        customer_code = CustomerCode,
                        source = "x3"
                    };
                    if (existing != null)
                    {
                        var createOrder = await _importedOrdersRepository.CreatedOrder(order);

                        var ordersData = new
                        {
                            pick_list_id = order.pick_list_id,
                            sage_created_at = order.sage_created_at,
                            status = order.status,
                            source = "x3",
                            updated_at = createOrder.updated_at,
                            created_at = createOrder.created_at,
                            id = createOrder.id
                        };

                        var propertiesData = new
                        {
                            data = ordersData
                        };

                        var logData = new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.picklist,
                            @event = "created",
                            description = $"PickList Created | {pickListId}",
                            properties = JsonConvert.SerializeObject(propertiesData),
                            subject_ref = pickListId,
                            subject_id = createOrder.id,
                            api_action_type = $"PickList {actionType}",
                            created_at = DateTime.UtcNow,
                            updated_at = DateTime.UtcNow,
                        };

                        log.subject_ref = pickListId;
                        await _IActivityLogRepository.ActivityLog(logData);
                    }
                }
                return (new { error = 0, message = "Data Synced Successfully" });
            }
            catch (Exception ex)
            {
                var log = new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "error",
                    description = $"PickList {actionType}",
                    properties = JsonConvert.SerializeObject(ex.Message),
                    api_action_type = $"PickList {actionType}",
                    causer_type = null,
                    created_at = DateTime.UtcNow
                };

                await _IActivityLogRepository.ActivityLog(log);
                return new { error = 1, message = $"Error while syncing data | {ex.Message}" };
            }
        }

        public async Task<ResponseResult> GetPickListDetails(string actionType = "Scheduler")
        {
            try
            {
                var orders = await _importedOrdersRepository.GetUnsyncedOrdersFromX3(30);

                if (orders == null || !orders.Any())
                {
                    return new ResponseResult { Error = 0, Message = "New data not found" };
                }

                foreach (var order in orders)
                {
                    var pickListId = order.pick_list_id;
                    var picklist_id = order.id;

                    try
                    {
                        // External API details
                        var baseUrl = _configuration["ExternalApi:Endpoint"];
                        var username = _configuration["ExternalApi:Username"];
                        var password = _configuration["ExternalApi:Password"];
                        var handler = new HttpClientHandler
                        {
                            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                        };

                        using var client = new HttpClient(handler)
                        {
                            BaseAddress = new Uri(baseUrl)
                        };

                        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                        string request = $"YSTOPREH(\"{pickListId}\")?representation=YSTOPRE.$details";
                        var fullUrl = new Uri(client.BaseAddress, request);

                        var urlResponse = await client.GetAsync(fullUrl);
                        urlResponse.EnsureSuccessStatusCode();

                        var response = await urlResponse.Content.ReadAsStringAsync();
                        var result = JsonConvert.DeserializeObject<dynamic>(response);
                        var (jsonTable, creatorEmail) = await FetchAndPrintJsonAsTableAsync(response);

                        // Log sync activity
                        var activity = new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.picklist,
                            @event = "sync",
                            description = $"PickList Lines {actionType}",
                            api_action_type = $"PickList Lines {actionType}",
                            properties = JsonConvert.SerializeObject(new { request, response = result }),
                            subject_id = picklist_id,
                            created_at = DateTime.UtcNow
                        };
                        await _IActivityLogRepository.ActivityLog(activity);

                        // Process and validate lines
                        bool trueInvalid = false;
                        int orderInvalidItems = 0;
                        int orderCanExport = 1;
                        List<OrderLinesDto> details = new();

                        foreach (DataRow row in jsonTable.Rows)
                        {
                            string? sku = row["ITMREF"].ToString();
                            string? uom = row["PCU"].ToString();
                            bool isKitItem = false;
                            bool isShipItem = false;
                            bool isValid = false;
                            int canExport = 1;

                            if (Convert.ToInt32(row["LINTYP"]) != 2)
                            {
                                var conversions = await _importedOrdersRepository.GetSkuConversionAsync(sku);
                                var conversion = conversions.FirstOrDefault();

                                if (conversion != null)
                                {
                                    sku = conversion.sku_mantis;
                                    uom = conversion.uom_mantis;
                                    isKitItem = conversion.is_kit_item;
                                    isShipItem = conversion.is_ship_item;

                                    var product = await _importedOrdersRepository.GetProductBySkuAsync(sku);
                                    isValid = product != null ? true : false;
                                }
                                else
                                {
                                    sku = null;
                                    uom = null;
                                    isValid = false;
                                    orderInvalidItems = 1;
                                }

                                if (orderInvalidItems == 1 && !row["ITMREF"].ToString().Contains("SHIP"))
                                {
                                    trueInvalid = true;
                                }

                                if (isValid == false)
                                {
                                    orderInvalidItems = 1;
                                }
                            }
                            if ((Convert.ToInt32(row["LINTYP"]) != 3 && Convert.ToInt32(row["LINTYP"]) != 1) || Convert.ToInt32(row["STOMGTCOD"]) == 1)
                            {
                                canExport = 0;
                                orderCanExport = 0;

                                var conversions = await _importedOrdersRepository.GetSkuConversionAsync(sku);
                                var conversion = conversions.FirstOrDefault();

                                if (conversion != null)
                                {
                                    sku = conversion.sku_mantis;
                                    uom = conversion.uom_mantis;
                                    isKitItem = conversion.is_kit_item;
                                    isShipItem = conversion.is_ship_item;

                                    var product = await _importedOrdersRepository.GetProductBySkuAsync(sku);
                                    isValid = product != null ? true : false;
                                }
                                else
                                {
                                    sku = null;
                                    uom = null;
                                    isValid = true;
                                    orderInvalidItems = 1;
                                }

                                if (orderInvalidItems == 1 && !row["ITMREF"].ToString().Contains("SHIP"))
                                {
                                    trueInvalid = true;
                                }

                                if (isValid == false)
                                {
                                    orderInvalidItems = 1;
                                }
                            }
                            canExport = 0;
                            orderCanExport = 0;

                            var dto = new OrderLinesDto
                            {
                                pick_list_id = pickListId,
                                pick_list_line = Convert.ToInt16(row["PRELIN"]),
                                //pick_list_line = row["PRELIN"].ToString(), Commented by yogesh kaushik for order export
                                order_code = row["ORINUM"].ToString(),
                                order_type = row["ORITYP"].ToString(),
                                line_type = Convert.ToInt32(row["LINTYP"]),
                                item_reference = sku,
                                item_description = row["ITMDES1"].ToString(),
                                qty = Convert.ToInt32(row["ALLQTY"]),
                                item_no = Convert.ToInt32(row["ORILIN"]),
                                uom = uom,
                                create_datetime = Convert.ToDateTime(row["CREDATTIM"]),
                                bpcord = row["BPCORD"].ToString(),
                                ship_to = row["BPAADD"].ToString(),
                                delivery_at = Convert.ToDateTime(row["DLVDAT"]),
                                shidat = Convert.ToDateTime(row["SHIDAT"]),
                                site = row["STOFCY"].ToString(),
                                picklist_id = picklist_id,
                                status = EnumData.PicklistDetailsStatus.Unprocessed.ToString(),
                                stock_manage = Convert.ToInt32(row["STOMGTCOD"]),
                                input_sku = row["ITMREF"].ToString(),
                                input_uom = row["PCU"].ToString(),
                                input_qty = Convert.ToInt32(row["ALLQTY"]),
                                is_kit_item = isKitItem,
                                is_ship_item = isShipItem,
                                is_valid_item = isValid,
                                is_exported = (isValid == false) ? 4 : 0,
                                can_export = canExport == 1,
                                mantis_imported = 9
                            };

                            details.Add(dto);
                        }

                        // Batch insert
                        var batches = details
                            .Select((detail, index) => new { detail, index })
                            .GroupBy(x => x.index / 50)
                            .Select(g => g.Select(x => x.detail).ToList());

                        foreach (var batch in batches)
                        {
                            await _importedOrdersRepository.UpsertPickListDetailsAsync(batch);
                        }

                        // Save creator_email ONLY in header table
                        await _importedOrdersRepository.UpdateCreatorEmail(pickListId, creatorEmail);

                        await _importedOrdersRepository.UpdateNotificationEmail("Picklist Notifications", creatorEmail);

                        await _importedOrdersRepository.UpdateMantisImportedFlagAsync(pickListId);

                        // Update picklist summary
                        var summary = await _importedOrdersRepository.GetPickListByIdAsync(pickListId);
                        summary.is_sync = 1;
                        summary.invalid_items = trueInvalid;
                        summary.sync_at = DateTime.UtcNow;
                        summary.status = EnumData.PicklistDetailsStatus.Unprocessed.ToString();
                        summary.customer_code = details.FirstOrDefault()?.bpcord;
                        summary.ship_to = details.FirstOrDefault()?.ship_to;
                        summary.api_export = details.All(d => d.can_export);

                        await _importedOrdersRepository.UpdatePickListAsync(summary);

                        if (!await _importedOrdersRepository.HasUnexportedLinesAsync(picklist_id))
                        {
                            summary.is_exported = 5;
                            await _importedOrdersRepository.UpdatePickListAsync(summary);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log exception and mark as failed sync
                        var failedPickList = await _importedOrdersRepository.GetPickListByIdAsync(pickListId);
                        if (failedPickList != null)
                        {
                            failedPickList.is_sync = 2;
                            failedPickList.status = EnumData.PicklistDetailsStatus.Unprocessed.ToString();
                            await _importedOrdersRepository.UpdatePickListAsync(failedPickList);
                        }

                        var errorLog = new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.picklist,
                            @event = "error",
                            description = $"PickList Lines {actionType} | {pickListId} | Exception",
                            api_action_type = $"PickList Lines {actionType}",
                            properties = JsonConvert.SerializeObject(new { error = ex.Message }),
                            created_at = DateTime.UtcNow
                        };

                        await _IActivityLogRepository.ActivityLog(errorLog);

                        return new ResponseResult { Error = 1, Message = $"Exception occurred: {ex.Message}" };
                    }
                }

                return new ResponseResult { Error = 0, Message = "Data Synced Successfully" };
            }
            catch (Exception ex)
            {
                var log = new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "error",
                    description = $"PickList Lines {actionType} | Exception",
                    api_action_type = $"PickList Lines {actionType}",
                    properties = JsonConvert.SerializeObject(new { ex.Message }),
                    created_at = DateTime.UtcNow
                };

                await _IActivityLogRepository.ActivityLog(log);

                return new ResponseResult { Error = 1, Message = $"Error while syncing data | {ex.Message}" };
            }
        }

        //public async Task<DataTable> FetchAndPrintJsonAsTableAsync(string jsonString)
        //{
        //    using JsonDocument doc = JsonDocument.Parse(jsonString);
        //    var root = doc.RootElement;

        //    // Check if PRHPRE exists and is an array
        //    if (!root.TryGetProperty("PRHPRE", out JsonElement prhpreArray) || prhpreArray.ValueKind != JsonValueKind.Array)
        //        throw new Exception("Invalid JSON format: PRHPRE array not found");

        //    var table = new DataTable("PRHPRE");
        //    var columnNames = new HashSet<string>();

        //    // Add root-level columns you're going to include in each row
        //    string[] rootFields = { "CREDATTIM", "DLVDAT", "SHIDAT", "BPCORD", "BPAADD", "STOFCY" };
        //    foreach (var field in rootFields)
        //    {
        //        if (root.TryGetProperty(field, out _))
        //        {
        //            if (columnNames.Add(field))
        //                table.Columns.Add(field);
        //        }
        //    }

        //    // Dynamically create columns from PRHPRE[0]
        //    var firstItem = prhpreArray[0];
        //    foreach (var prop in firstItem.EnumerateObject())
        //    {
        //        if (prop.Value.ValueKind == JsonValueKind.Object)
        //        {
        //            foreach (var nested in prop.Value.EnumerateObject())
        //            {
        //                string colName = $"{prop.Name}_{nested.Name}";
        //                if (columnNames.Add(colName))
        //                    table.Columns.Add(colName);
        //            }
        //        }
        //        else
        //        {
        //            if (columnNames.Add(prop.Name))
        //                table.Columns.Add(prop.Name);
        //        }
        //    }

        //    // Add rows
        //    foreach (var item in prhpreArray.EnumerateArray())
        //    {
        //        var row = table.NewRow();

        //        // Add root-level fields
        //        foreach (var field in rootFields)
        //        {
        //            if (root.TryGetProperty(field, out JsonElement value))
        //            {
        //                row[field] = value.ToString();
        //            }
        //        }

        //        // Add PRHPRE-specific fields
        //        foreach (var prop in item.EnumerateObject())
        //        {
        //            if (prop.Value.ValueKind == JsonValueKind.Object)
        //            {
        //                foreach (var nested in prop.Value.EnumerateObject())
        //                {
        //                    string colName = $"{prop.Name}_{nested.Name}";
        //                    if (table.Columns.Contains(colName))
        //                        row[colName] = nested.Value.ToString();
        //                }
        //            }
        //            else
        //            {
        //                if (table.Columns.Contains(prop.Name))
        //                    row[prop.Name] = prop.Value.ToString();
        //            }
        //        }

        //        table.Rows.Add(row);
        //    }

        //    return table;
        //}

        public async Task<(DataTable table, string? creatorEmail)> FetchAndPrintJsonAsTableAsync(string jsonString)
        {
            using JsonDocument doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            // Extract creator email from PRHCUSR
            string? creatorEmail = null;

            if (root.TryGetProperty("PRHCUSR", out JsonElement prhcusrArray) &&
                prhcusrArray.ValueKind == JsonValueKind.Array &&
                prhcusrArray.GetArrayLength() > 0)
            {
                var firstUser = prhcusrArray[0];

                if (firstUser.TryGetProperty("ADDEML", out JsonElement emailElement))
                {
                    creatorEmail = emailElement.ToString();
                }
            }

            // Validate PRHPRE
            if (!root.TryGetProperty("PRHPRE", out JsonElement prhpreArray) ||
                prhpreArray.ValueKind != JsonValueKind.Array)
            {
                throw new Exception("Invalid JSON format: PRHPRE array not found");
            }

            var table = new DataTable("PRHPRE");
            var columnNames = new HashSet<string>();

            // Root-level fields
            string[] rootFields = { "CREDATTIM", "DLVDAT", "SHIDAT", "BPCORD", "BPAADD", "STOFCY" };

            foreach (var field in rootFields)
            {
                if (root.TryGetProperty(field, out _))
                {
                    if (columnNames.Add(field))
                        table.Columns.Add(field);
                }
            }

            // Dynamic columns from PRHPRE[0]
            var firstItem = prhpreArray[0];
            foreach (var prop in firstItem.EnumerateObject())
            {
                if (prop.Value.ValueKind == JsonValueKind.Object)
                {
                    foreach (var nested in prop.Value.EnumerateObject())
                    {
                        string colName = $"{prop.Name}_{nested.Name}";
                        if (columnNames.Add(colName))
                            table.Columns.Add(colName);
                    }
                }
                else
                {
                    if (columnNames.Add(prop.Name))
                        table.Columns.Add(prop.Name);
                }
            }

            // Fill rows
            foreach (var item in prhpreArray.EnumerateArray())
            {
                var row = table.NewRow();

                // Root fields
                foreach (var field in rootFields)
                {
                    if (root.TryGetProperty(field, out JsonElement value))
                    {
                        row[field] = value.ToString();
                    }
                }

                // PRHPRE fields
                foreach (var prop in item.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var nested in prop.Value.EnumerateObject())
                        {
                            string colName = $"{prop.Name}_{nested.Name}";
                            if (table.Columns.Contains(colName))
                                row[colName] = nested.Value.ToString();
                        }
                    }
                    else
                    {
                        if (table.Columns.Contains(prop.Name))
                            row[prop.Name] = prop.Value.ToString();
                    }
                }

                table.Rows.Add(row);
            }

            return (table, creatorEmail);
        }

        public async Task<ResponseResult> RevalidateItems(int id)
        {
            try
            {
                var orderHeaders = await _importedOrdersRepository.GetImportedOrderByIdAsync(id);
                var orderHeader = orderHeaders.FirstOrDefault();
                var pick_list_id = orderHeader.id;
                var orderDetails = await _importedOrdersRepository.GetOrderDetailsByPicklistId(pick_list_id);

                int invalidCount = orderDetails.Count();
                int invalidDetailsCount = 0;

                foreach (var item in orderDetails)
                {
                    var validation = await _validateItemHelper.ValidateItem(item.input_sku); // Called an external class ValidateItemHelper

                    if (validation.Error == 0 && validation.IsValid == 1)
                    {
                        item.item_reference = validation.Sku;
                        item.uom = validation.Uom;
                        item.is_valid_item = true;

                        if (item.mantis_imported == 1 && item.is_valid_item == false)
                        {
                            item.mantis_imported = 0;
                            orderHeader.mantis_imported = 0;

                            await _importedOrdersRepository.UpdateOrderDetail(item);
                            invalidCount++;
                        }
                        else if (item.mantis_imported == 0)
                        {
                            await _importedOrdersRepository.UpdateOrderDetail(item);
                            invalidCount--;
                        }
                    }
                }

                if (invalidCount == 0)
                {
                    await _importedOrdersRepository.UpdateInvalidItemsFlag(id, false);
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Items Revalidated"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = $"Could not revalidate items | {ex.Message}"
                };
            }
        }
        public async Task<ResponseResult> SyncPickListDetails(string requests, int UserId, string? UserName, string UserEmail)
        {
            try
            {

                //var orders = await _importedOrdersRepository.GetUnsyncedOrdersFromX3(30);
                //if (requests == null)
                //{
                //    return new ResponseResult { Error = 0, Message = "New data not found" };
                //}

                var orderHeaders = await _importedOrdersRepository.GetImportedOrderByIdAsync(requests);
                var orderHeader = orderHeaders.FirstOrDefault();
                //var pick_list_id = orderHeader.id;
                var is_sync = orderHeader.is_sync;
                var source = orderHeader.source;

                if (requests != null && requests == "")
                {
                    if (is_sync == 1 || source == "x3")
                    {
                        //return new ResponseResult { Error = 0, Message = "Picklist already synced" };
                        return new ResponseResult { StatusCode = 500, Error = 1, Message = "Picklist already synced" };
                    }
                }
                var pickListId = orderHeader.pick_list_id;
                var picklist_id = orderHeader.id;

                try
                {
                    // External API details
                    var baseUrl = _configuration["ExternalApi:Endpoint"];
                    var username = _configuration["ExternalApi:Username"];
                    var password = _configuration["ExternalApi:Password"];
                    var handler = new HttpClientHandler
                    {
                        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                    };

                    using var client = new HttpClient(handler)
                    {
                        BaseAddress = new Uri(baseUrl)
                    };

                    var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                    string request = $"YSTOPREH(\"{pickListId}\")?representation=YSTOPRE.$details";
                    var fullUrl = new Uri(client.BaseAddress, request);

                    var urlResponse = await client.GetAsync(fullUrl);
                    urlResponse.EnsureSuccessStatusCode();

                    var response = await urlResponse.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<dynamic>(response);
                    var (jsonTable, creatorEmail) = await FetchAndPrintJsonAsTableAsync(response);

                    // Log sync activity
                    var activity = new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.picklist,
                        @event = "sync",
                        description = $"PickList Lines {"Scheduler"}",
                        properties = JsonConvert.SerializeObject(new { request, response = result }),
                        subject_id = picklist_id,
                        created_at = DateTime.UtcNow
                    };
                    await _IActivityLogRepository.ActivityLog(activity);

                    // Process and validate lines
                    bool trueInvalid = false;
                    int orderInvalidItems = 0;
                    int orderCanExport = 1;
                    List<OrderLinesDto> details = new();


                    foreach (DataRow row in jsonTable.Rows)
                    {
                        string? sku = row["ITMREF"].ToString();
                        string? uom = row["PCU"].ToString();
                        bool isKitItem = false;
                        bool isShipItem = false;
                        bool isValid = false;
                        int canExport = 1;

                        if (Convert.ToInt32(row["LINTYP"]) != 2)
                        {
                            var conversions = await _importedOrdersRepository.GetSkuConversionAsync(sku);
                            var conversion = conversions.FirstOrDefault();

                            if (conversion != null)
                            {
                                sku = conversion.sku_mantis;
                                uom = conversion.uom_mantis;
                                isKitItem = conversion.is_kit_item;
                                isShipItem = conversion.is_ship_item;

                                var product = await _importedOrdersRepository.GetProductBySkuAsync(sku);
                                isValid = product != null ? true : false;
                            }
                            else
                            {
                                sku = null;
                                uom = null;
                                isValid = false;
                                orderInvalidItems = 1;
                            }

                            if (orderInvalidItems == 1 && !row["ITMREF"].ToString().Contains("SHIP"))
                            {
                                trueInvalid = true;
                            }

                            if (isValid == false)
                            {
                                orderInvalidItems = 1;
                            }
                        }
                        if ((Convert.ToInt32(row["LINTYP"]) != 3 && Convert.ToInt32(row["LINTYP"]) != 1) || Convert.ToInt32(row["STOMGTCOD"]) == 1)
                        {
                            canExport = 0;
                            orderCanExport = 0;

                            var conversions = await _importedOrdersRepository.GetSkuConversionAsync(sku);
                            var conversion = conversions.FirstOrDefault();

                            if (conversion != null)
                            {
                                sku = conversion.sku_mantis;
                                uom = conversion.uom_mantis;
                                isKitItem = conversion.is_kit_item;
                                isShipItem = conversion.is_ship_item;

                                var product = await _importedOrdersRepository.GetProductBySkuAsync(sku);
                                isValid = product != null ? true : false;
                            }
                            else
                            {
                                sku = null;
                                uom = null;
                                isValid = true;
                                orderInvalidItems = 1;
                            }

                            if (orderInvalidItems == 1 && !row["ITMREF"].ToString().Contains("SHIP"))
                            {
                                trueInvalid = true;
                            }

                            if (isValid == false)
                            {
                                orderInvalidItems = 1;
                            }
                        }
                        canExport = 0;
                        orderCanExport = 0;

                        var dto = new OrderLinesDto
                        {
                            pick_list_id = pickListId,
                            pick_list_line = Convert.ToInt16(row["PRELIN"]),
                            //pick_list_line = row["PRELIN"].ToString(),  Commented by yogesh kaushik for order export
                            order_code = row["ORINUM"].ToString(),
                            order_type = row["ORITYP"].ToString(),
                            line_type = Convert.ToInt32(row["LINTYP"]),
                            item_reference = sku,
                            item_description = row["ITMDES1"].ToString(),
                            qty = Convert.ToInt32(row["ALLQTY"]),
                            item_no = Convert.ToInt32(row["ORILIN"]),
                            uom = uom,
                            create_datetime = Convert.ToDateTime(row["CREDATTIM"]),
                            bpcord = row["BPCORD"].ToString(),
                            ship_to = row["BPAADD"].ToString(),
                            delivery_at = Convert.ToDateTime(row["DLVDAT"]),
                            shidat = Convert.ToDateTime(row["SHIDAT"]),
                            site = row["STOFCY"].ToString(),
                            picklist_id = picklist_id,
                            status = EnumData.PicklistDetailsStatus.Unprocessed.ToString(),
                            stock_manage = Convert.ToInt32(row["STOMGTCOD"]),
                            input_sku = row["ITMREF"].ToString(),
                            input_uom = row["PCU"].ToString(),
                            input_qty = Convert.ToInt32(row["ALLQTY"]),
                            is_kit_item = isKitItem,
                            is_ship_item = isShipItem,
                            is_valid_item = isValid,
                            is_exported = (isValid == false) ? 4 : 0,
                            can_export = canExport == 1,
                            mantis_imported = 9
                        };

                        details.Add(dto);
                    }

                    // Batch insert
                    var batches = details
                        .Select((detail, index) => new { detail, index })
                        .GroupBy(x => x.index / 50)
                        .Select(g => g.Select(x => x.detail).ToList());

                    foreach (var batch in batches)
                    {
                        await _importedOrdersRepository.UpsertPickListDetailsAsync(batch);
                    }

                    await _importedOrdersRepository.UpdateMantisImportedFlagAsync(pickListId);

                    // Update picklist summary
                    var summary = await _importedOrdersRepository.GetPickListByIdAsync(pickListId);
                    summary.is_sync = 1;
                    summary.invalid_items = trueInvalid;
                    summary.sync_at = DateTime.UtcNow;
                    summary.status = EnumData.PicklistDetailsStatus.Unprocessed.ToString();
                    summary.customer_code = details.FirstOrDefault()?.bpcord;
                    summary.ship_to = details.FirstOrDefault()?.ship_to;
                    summary.api_export = details.All(d => d.can_export);

                    await _importedOrdersRepository.UpdatePickListAsync(summary);

                    if (!await _importedOrdersRepository.HasUnexportedLinesAsync(picklist_id))
                    {
                        summary.is_exported = 5;
                        await _importedOrdersRepository.UpdatePickListAsync(summary);
                    }

                    await SendPicklistNotificationAsync(
                        pickListId: pickListId,
                        eventName: NotificationEvent.Picklist_Line_Cancellation.ToString(),
                        actionDescription: "Picklist Lines Update",
                        itemId: string.Join(",", details.Where(x => !string.IsNullOrEmpty(x.item_reference)).Select(x => x.item_reference).Distinct()),
                        modifiedBy: UserName,
                        userEmail: UserEmail,
                        userId: UserId,
                        warehouse: "NYMT"
                    );
                }
                catch (Exception ex)
                {
                    // Log exception and mark as failed sync
                    var failedPickList = await _importedOrdersRepository.GetPickListByIdAsync(pickListId);
                    if (failedPickList != null)
                    {
                        failedPickList.is_sync = 2;
                        failedPickList.status = EnumData.PicklistDetailsStatus.Unprocessed.ToString();
                        await _importedOrdersRepository.UpdatePickListAsync(failedPickList);
                    }

                    var errorLog = new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.picklist,
                        @event = "error",
                        description = $"PickList Lines {"Schedulers"} | {pickListId} | Exception",
                        properties = JsonConvert.SerializeObject(new { error = ex.Message }),
                        created_at = DateTime.UtcNow
                    };

                    await _IActivityLogRepository.ActivityLog(errorLog);

                    return new ResponseResult { StatusCode = 500, Error = 1, Message = $"Exception occurred: {ex.Message}" };
                }


                return new ResponseResult { StatusCode = 200, Error = 0, Message = "Data Synced Successfully" };
            }

            catch (Exception ex)
            {
                var log = new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "error",
                    description = $"PickList Lines {"Scheduler"} | Exception",
                    properties = JsonConvert.SerializeObject(new { ex.Message }),
                    created_at = DateTime.UtcNow
                };

                await _IActivityLogRepository.ActivityLog(log);

                return new ResponseResult { StatusCode = 500, Error = 1, Message = $"Error while syncing data | {ex.Message}" };
            }

        }
        public async Task<ResponseResult> ManualOrderStatusComplete(ManualOrderRequest request)
        {
            try
            {
                foreach (var order in request.Orders)
                {
                    if (order.lv_status == "Pending")
                    {
                        bool isStatusCompleted = await _importedOrdersRepository.IsOrderStatusCompleted(order.pick_list_id);

                        if (isStatusCompleted)
                        {
                            await _importedOrdersRepository.UpdateLvStatus(order.id, "Completed");
                        }
                        else
                        {
                            int? total = await _importedOrdersRepository.GetOrderShipmentItemCount(order.pick_list_id, false);
                            int actual = await _importedOrdersRepository.GetOrderShipmentItemCount(order.pick_list_id, true);

                            if (total == actual)
                            {
                                await _importedOrdersRepository.UpdateLvStatus(order.id, "Task Completed");
                            }
                        }
                    }
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = "order status marked completed successfully"
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<ApisResponse> OrderShipmentRelease(OrderShipmentReleaseRequest request)
        {
            try
            {
                var emptyLpnCount = await _importedOrdersRepository.GetEmptyLpnCount(request.Order.pick_list_id);

                if (emptyLpnCount > 0 && !request.flag)
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Code = 409,
                        Message = "Order is not completely transferred! Do you still want to release shipment location?"
                    };
                }
                await _importedOrdersRepository.OrderShipmentRelease(request);

                return new ApisResponse
                {
                    Error = 0,
                    Code = 200,
                    Message = "Order shipment locations released Successfully"
                };
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Code = 500,
                    Message = $"Internal Server Error | {ex.Message}"
                };
            }
        }

        public async Task<OrderItemResponse> GetOrderItem(OrderItemGridRequest request)
        {
            return await _importedOrdersRepository.GetOrderItem(request);
        }

        public async Task<AssignOrdersResponse> AssignOrderLinesToUserLoc(AssignOrderLinesRequest request)
        {
            try
            {
                return await _importedOrdersRepository.AssignOrderLinesToUserLoc(request);
            }
            catch (Exception ex)
            {
                return new AssignOrdersResponse { Error = 1, Message = $"Internal Server Error | {ex.Message}" };
            }
        }

        //public async Task<ApisResponse> BulkLoadOrders(BulkLoadOrderRequest request)
        //{
        //    try
        //    {
        //        if (request?.PicklistIds == null || !request.PicklistIds.Any())
        //        {
        //            return new ApisResponse
        //            {
        //                Error = 1,
        //                Message = "No picklist IDs provided"
        //            };
        //        }

        //        var validPicklistIds = new List<string>();

        //        foreach (var picklistId in request.PicklistIds)
        //        {
        //            try
        //            {
        //                var order = (await _importedOrdersRepository.GetOrderByPickListId(picklistId)).FirstOrDefault();
        //                if (order != null)
        //                {
        //                    order.lv_status = "In-Progress";
        //                    await _importedOrdersRepository.UpdateLoadOrders(order);

        //                    validPicklistIds.Add(picklistId);
        //                }
        //            }
        //            catch (Exception ex)
        //            {
        //              // continue to next picklistId
        //            }
        //        }

        //        if (validPicklistIds.Any())
        //        {
        //            var now = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        //            var job = new JobModel
        //            {
        //                queue = "loadclose",
        //                payload = JsonConvert.SerializeObject(new
        //                {
        //                    user = request.userName,
        //                    pick_list_ids = validPicklistIds
        //                }),
        //                attempts = 0,
        //                reserved_at = null,
        //                available_at = now,
        //                created_at = now
        //            };

        //            await _importedOrdersRepository.InsertLoadOrdersJob(job);
        //        }

        //        return new ApisResponse
        //        {
        //            Error = 0,
        //            Message = "Load & Close Initiated Successfully"
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ApisResponse
        //        {
        //            Error = 1,
        //            Message = "An unexpected error occurred while processing the request."
        //        };
        //    }
        //}

        public async Task<ApisResponse> BulkLoadOrders(BulkLoadOrderRequest request)
        {
            if (request?.PicklistIds == null || !request.PicklistIds.Any())
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = "No picklist IDs provided"
                };
            }

            foreach (var picklistId in request.PicklistIds)
            {
                var order = (await _importedOrdersRepository.GetOrderByPickListId(picklistId)).FirstOrDefault();
                if (order != null)
                {
                    order.lv_status = "In-Progress";
                    await _importedOrdersRepository.UpdateLoadOrders(order);

                    // simulated background job
                    var now = (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                    var job = new JobModel
                    {
                        queue = "loadclose",
                        payload = JsonConvert.SerializeObject(new
                        {
                            user = request.userName,
                            picklist_id = order.id,
                            pick_list_id = picklistId
                        }),
                        attempts = 0,
                        reserved_at = null,
                        available_at = now,
                        created_at = now
                    };

                    await _importedOrdersRepository.InsertLoadOrdersJob(job);
                }
            }

            return new ApisResponse
            {
                Error = 0,
                Message = "Load & Close Initiated Successfully"

            };
        }
        public async Task<OrderExportResponse> GetOrderExportData(OrderExportFilter request)
        {
            var (data, total) = await _importedOrdersRepository.GetOrderExportDataAsync(request);

            return new OrderExportResponse
            {
                error = 0,
                data = data,
                totalRecords = total,
                message = "Success"
            };
        }
        public async Task<(int error, List<PickListIdResponse> data, int totalRecords)> GetPickListIdsAsync()
        {
            var data = await _importedOrdersRepository.GetPickListIdsAsync();
            return (0, data, data.Count);
        }
        public async Task<ordershortDataResponseResult> GetOrderShortDataExportAsync(OrderShortDataExportRequest request)
        {
            try
            {
                var data = await _importedOrdersRepository.GetOrderShortDataExportAsync(request.order);
                if (data.Any())
                {
                    return new ordershortDataResponseResult
                    {
                        Error = 0,
                        Data = new { grid_data = data },
                        Message = "Successful"
                    };
                }
                else
                {
                    return new ordershortDataResponseResult
                    {
                        Error = 0,
                        Message = "No record found"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ordershortDataResponseResult
                {
                    Error = 1,
                    Message = ex.Message
                };
            }
        }
        public async Task<(IEnumerable<OrderTaskDetailResponse> data, int totalRecords)> GetOrderTaskDetailsAsync(OrderTaskDetailRequest request)
        {
            return await _importedOrdersRepository.GetOrderTaskDetailsAsync(request);
        }
        //public async Task<ResponseResult> CancelOrderSageX3(CancelOrderRequest request)
        //{
        //    string? pickListId = request.Ids[0];
        //    var orderdetail = await _importedOrdersRepository.GetImportedOrderByIdAsync(request.Ids[0]);
        //    var data = orderdetail.FirstOrDefault();
        //    try
        //    {
        //        var baseUrl = _configuration["ExternalApi:Endpoint"];
        //        var username = _configuration["ExternalApi:Username"];
        //        var password = _configuration["ExternalApi:Password"];
        //        string? poolAlias = _configuration["SageX3Config:SAGE_X3_API_POOLALIAS"];
        //        string? sdhTyp = _configuration["SageX3Config:SDHTYP"];

        //        var handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        //        };

        //        using var client = new HttpClient(handler)
        //        {
        //            BaseAddress = new Uri(baseUrl)
        //        };

        //        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        //        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        //        //string poolAlias = ConfigDefaults.ProgressIDValue;
        //        string bodwy = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:wss=""http://www.adonix.com/WSS"">
        //                         <soapenv:Header/>
        //                         <soapenv:Body>
        //                            <wss:delete soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
        //                               <callContext xsi:type=""wss:CAdxCallContext"">
        //                                  <codeLang xsi:type=""xsd:string"">ENG</codeLang>
        //                                  <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
        //                                  <poolId xsi:type=""xsd:string""></poolId>
        //                                  <requestConfig xsi:type=""xsd:string""></requestConfig>
        //                               </callContext>
        //                               <publicName xsi:type=""xsd:string"">YPICKTICKT</publicName>
        //                              <objectKeys xsi:type=""wss:ArrayOfCAdxParamKeyValue"" soapenc:arrayType=""wss:CAdxParamKeyValue[]"">
        //                               <CAdxParamKeyValue>
        //                               	<key>PRHNUM</key>
        //                               	<value>{pickListId}</value>
        //                               </CAdxParamKeyValue>         
        //                               </objectKeys>
        //                           </wss:delete>
        //                         </soapenv:Body>
        //                      </soapenv:Envelope>";

        //        var requestsoap = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
        //        {
        //            Content = new StringContent(bodwy, Encoding.UTF8, "text/plain")
        //        };

        //        // Correct SOAPAction casing
        //        requestsoap.Headers.Add("SOAPAction", "run");

        //        var response = await client.SendAsync(requestsoap);
        //        response.EnsureSuccessStatusCode();
        //        var xmlResult = await response.Content.ReadAsStringAsync();
        //        var doc = XDocument.Parse(xmlResult);
        //        var properties = new { request = System.Net.WebUtility.HtmlEncode(bodwy), response = xmlResult };
        //        await _importedOrdersRepository.ActivityLog(new ActivityLog
        //        {
        //            log_name = "outbound",
        //            subject_ref = data.pick_list_id,
        //            module_id = (int)EnumData.Module.outbound,
        //            sub_module_id = (int)EnumData.SubModule.cancelorder,
        //            @event = "sync",
        //            user_name = request.userName,
        //            api_action_type = "Cancel Order Sage",
        //            subject_id = data.id,
        //            properties = JsonConvert.SerializeObject(properties),
        //            description = $"Cancel Order Sage | {data.pick_list_id}",
        //            created_at = DateTime.UtcNow
        //        });
        //        // Extract <message> node
        //        var message = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "message")?.Value;
        //        var statusValue = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "status")?.Value;
        //        if (int.TryParse(statusValue, out int status) && status == 1 || message == "Record does not exist")
        //        {
        //            await _importedOrdersRepository.UpdateOrderStatus(request.Ids, "Cancelled");

        //            await _importedOrdersRepository.ActivityLog(new ActivityLog
        //            {
        //                log_name = "outbound",
        //                module_id = (int)EnumData.Module.outbound,
        //                sub_module_id = (int)EnumData.SubModule.cancelorder,
        //                subject_id = data.id,
        //                @event = "success",
        //                user_name = request.userName,
        //                subject_ref = data.pick_list_id,
        //                api_action_type = "Cancel Order Sage",
        //                properties = JsonConvert.SerializeObject(new { data = new { message = "Order Cancelled successfully" } }),
        //                description = $"Cancel Order Process Sage | {data.pick_list_id}",
        //                created_at = DateTime.UtcNow
        //            });

        //        }
        //        else
        //        {
        //            await _importedOrdersRepository.ActivityLog(new ActivityLog
        //            {
        //                log_name = "outbound",
        //                module_id = (int)EnumData.Module.outbound,
        //                sub_module_id = (int)EnumData.SubModule.cancelorder,
        //                subject_id = data.id,
        //                @event = "error",
        //                user_name = request.userName,
        //                subject_ref = data.pick_list_id,
        //                api_action_type = "Cancel Order",
        //                properties = JsonConvert.SerializeObject(new { data = new { message = message } }),
        //                description = $"Cancel Order Process Sage | {data.pick_list_id}",
        //                 created_at = DateTime.UtcNow
        //            });
        //        }
        //            return new ResponseResult { Error = 1, Message = message };


        //    }
        //    catch (Exception ex)
        //    {
        //        return new ResponseResult { StatusCode = 500, Error = 1, Message = $"Error deleting order | {ex.Message}" };
        //    }
        //}

        public async Task<ResponseResult> CancelOrderSageX3(CancelOrderRequest request)
        {
            string? pickListId = request.Ids.FirstOrDefault();
            var orderdetail = await _importedOrdersRepository.GetImportedOrderByIdAsync(pickListId);
            var data = orderdetail.FirstOrDefault();

            if (data == null) return new ResponseResult { Error = 1, Message = "Order not found" };
            try
            {
                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];
                string? poolAlias = _configuration["SageX3Config:SAGE_X3_API_POOLALIAS"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                string body = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
                        xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" 
                        xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" 
                        xmlns:wss=""http://www.adonix.com/WSS"">
                        <soapenv:Header/>
                        <soapenv:Body>
                            <wss:delete soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
                                <callContext xsi:type=""wss:CAdxCallContext"">
                                    <codeLang xsi:type=""xsd:string"">ENG</codeLang>
                                    <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
                                    <poolId xsi:type=""xsd:string""></poolId>
                                    <requestConfig xsi:type=""xsd:string""></requestConfig>
                                </callContext>
                                <publicName xsi:type=""xsd:string"">YPICKTICKT</publicName>
                                <objectKeys xsi:type=""wss:ArrayOfCAdxParamKeyValue"">
                                    <CAdxParamKeyValue>
                                        <key>PRHNUM</key>
                                        <value>{pickListId}</value>
                                    </CAdxParamKeyValue>
                                </objectKeys>
                            </wss:delete>
                        </soapenv:Body>
                    </soapenv:Envelope>
                ";

                var soapRequest = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                {
                    Content = new StringContent(body, Encoding.UTF8, "text/xml")
                };

                soapRequest.Headers.Add("SOAPAction", "run");

                var response = await client.SendAsync(soapRequest);
                response.EnsureSuccessStatusCode();

                var xmlResult = await response.Content.ReadAsStringAsync();
                var doc = XDocument.Parse(xmlResult);

                var message = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "message")?.Value;
                var statusValue = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "status")?.Value;

                bool isSuccess = int.TryParse(statusValue, out int status) && (status == 1 || message == "Record does not exist");

                // Log request/response
                var properties = new
                {
                    request = System.Net.WebUtility.HtmlEncode(body),
                    response = xmlResult
                };

                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    subject_ref = data.pick_list_id,
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.cancelorder,
                    @event = "sync",
                    user_name = request.userName,
                    api_action_type = "Cancel Order Sage",
                    subject_id = data.id,
                    properties = JsonConvert.SerializeObject(properties),
                    description = $"Cancel Order Sage | {data.pick_list_id}",
                    created_at = DateTime.UtcNow
                });

                bool isMantisCancelled = string.Equals(
                    data?.lv_status,
                    "Mantis Cancelled",
                    StringComparison.OrdinalIgnoreCase
                );

                if (isSuccess)
                {
                    if (!isMantisCancelled)
                    {
                        await _importedOrdersRepository.UpdateOrderStatus(request.Ids, "Cancelled");
                        // Send Notification Email
                        await SendPicklistNotificationAsync(
                            pickListId: pickListId,
                            eventName: NotificationEvent.Picklist_Cancellation.ToString(),
                            actionDescription: "Full Picklist Cancellation",
                            modifiedBy: request?.userName,
                            userEmail: request?.userEmail,
                            userId: request?.UserId ?? 0,
                            warehouse: "NYMT"
                        );
                    }

                    // Activity Log
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        subject_id = data.id,
                        @event = "success",
                        user_name = request.userName,
                        subject_ref = data.pick_list_id,
                        api_action_type = "Cancel Order Sage",
                        properties = JsonConvert.SerializeObject(new { message = "Order Cancelled successfully" }),
                        description = $"Cancel Order Process Sage | {data.pick_list_id}",
                        created_at = DateTime.UtcNow
                    });

                    return new ResponseResult { Error = 0, Message = "Order Cancelled successfully" };
                }
                else
                {
                    // Error Log
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        subject_id = data.id,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = data.pick_list_id,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { message }),
                        description = $"Cancel Order Process Sage | {data.pick_list_id}",
                        created_at = DateTime.UtcNow
                    });

                    return new ResponseResult { Error = 1, Message = message };
                }
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    StatusCode = 500,
                    Error = 1,
                    Message = $"Error deleting order | {ex.Message}"
                };
            }
        }

        public async Task<ResponseResult> CancelOrderSageX3Conditional(string code, int? picklist_id, string user, string? Item, string? userEmail, int UserId)
        {
            string? pickListId = code;
            try
            {
                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];
                string? poolAlias = _configuration["SageX3Config:SAGE_X3_API_POOLALIAS"];
                string? sdhTyp = _configuration["SageX3Config:SDHTYP"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
                //string poolAlias = ConfigDefaults.ProgressIDValue;
                string bodwy = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:wss=""http://www.adonix.com/WSS"">
                                 <soapenv:Header/>
                                 <soapenv:Body>
                                    <wss:delete soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
                                       <callContext xsi:type=""wss:CAdxCallContext"">
                                          <codeLang xsi:type=""xsd:string"">ENG</codeLang>
                                          <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
                                          <poolId xsi:type=""xsd:string""></poolId>
                                          <requestConfig xsi:type=""xsd:string""></requestConfig>
                                       </callContext>
                                       <publicName xsi:type=""xsd:string"">YPICKTICKT</publicName>
                                      <objectKeys xsi:type=""wss:ArrayOfCAdxParamKeyValue"" soapenc:arrayType=""wss:CAdxParamKeyValue[]"">
                                       <CAdxParamKeyValue>
                                       	<key>PRHNUM</key>
                                       	<value>{pickListId}</value>
                                       </CAdxParamKeyValue>         
                                       </objectKeys>
                                   </wss:delete>
                                 </soapenv:Body>
                              </soapenv:Envelope>";

                var requestsoap = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                {
                    Content = new StringContent(bodwy, Encoding.UTF8, "text/plain")
                };

                // Correct SOAPAction casing
                requestsoap.Headers.Add("SOAPAction", "run");

                var response = await client.SendAsync(requestsoap);
                response.EnsureSuccessStatusCode();
                var xmlResult = await response.Content.ReadAsStringAsync();
                var doc = XDocument.Parse(xmlResult);
                var properties = new { request = System.Net.WebUtility.HtmlEncode(bodwy), response = xmlResult };
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    subject_ref = code,
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.cancelorder,
                    @event = "sync",
                    user_name = user,
                    api_action_type = "Cancel Order Sage",
                    subject_id = picklist_id,
                    properties = JsonConvert.SerializeObject(properties),
                    description = $"Cancel Order Sage | {code}",
                    created_at = DateTime.UtcNow
                });

                if (response.IsSuccessStatusCode)
                {

                    await SendPicklistNotificationAsync(
                        pickListId: pickListId,
                        eventName: NotificationEvent.Picklist_Cancellation.ToString(),
                        actionDescription: "Full Picklist Cancellation",
                        modifiedBy: user,
                        userEmail: userEmail,
                        userId: UserId,
                        warehouse: "NYMT"
                    );

                }

                // Extract <message> node
                var message = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "message")?.Value;
                var statusValue = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "status")?.Value;
                if (int.TryParse(statusValue, out int status) && status == 1)
                {
                    await _importedOrdersRepository.UpdateOrderStatusConditional(code, "Cancelled");
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        subject_id = picklist_id,
                        @event = "success",
                        user_name = user,
                        subject_ref = code,
                        api_action_type = "Cancel Order Sage",
                        properties = JsonConvert.SerializeObject(new { data = new { message = "Order Cancelled successfully" } }),
                        description = $"Cancel Order Process Sage | {code}",
                        created_at = DateTime.UtcNow
                    });

                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        subject_id = picklist_id,
                        @event = "error",
                        user_name = user,
                        subject_ref = code,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { data = new { message = message } }),
                        description = $"Cancel Order Process Sage | {code}",
                        created_at = DateTime.UtcNow
                    });
                }
                return new ResponseResult { Error = 1, Message = message };


            }
            catch (Exception ex)
            {
                return new ResponseResult { Error = 1, Message = $"Error deleting order | {ex.Message}" };
            }
        }
        public async Task<ResponseResult> CancelOrders(CancelOrderRequest request)
        {
            try
            {
                var allocatedstockcheck = await _importedOrdersRepository.GetAllocatedStockDetailsfororder(request.Ids[0]);
                var statusid = await _importedOrdersRepository.getorderstaus(request.Ids[0]);
                var sdata = statusid.FirstOrDefault();
                var email = await _importedOrdersRepository.GetEmailByPicklist(request.Ids[0]);
                var creatorEmail = email?.creator_email;
                if (!string.IsNullOrWhiteSpace(creatorEmail))
                {
                    await _importedOrdersRepository.UpdateNotificationEmail("Picklist Notifications", creatorEmail);
                }

                var manualEmail = await _importedOrdersRepository.GetManualEmail("Picklist Notifications");
                var primaryEmails = manualEmail.FirstOrDefault();

                var manualPrimaryEmail = primaryEmails?.nst_Primary_Emails?.Trim();
                var defaultPrimaryEmail = primaryEmails?.default_Emails?.Trim();

                var primaryEmail = !string.IsNullOrWhiteSpace(manualPrimaryEmail) ? manualPrimaryEmail : defaultPrimaryEmail;

                if (primaryEmail?.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase) == true)
                {
                    primaryEmail = creatorEmail;
                }

                if (string.IsNullOrWhiteSpace(creatorEmail) && string.IsNullOrWhiteSpace(primaryEmail))
                {
                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "Please enter the manual email."
                    };

                }

                //var template = await _importedOrdersRepository.GetDefaultTemplateByEvent(NotificationEvent.Picklist_Cancellation.ToString());

                //if (template == null)
                //    return new ResponseResult
                //    {
                //        Error = 0,
                //        Message = "Template not found."
                //    };

                //int isEnabled = Convert.ToInt32(template.IsEnabled);

                //// if IsEnabled = 0 => do not send mail, return error
                //if (isEnabled == 0 || template.IsEnabled == false)
                //{
                //    return new ResponseResult
                //    {
                //        Error = 1,
                //        Message = "Notification trigger is off."
                //    };
                //}

                if (sdata == null)
                {
                    return new ResponseResult { Error = 1, Message = "Order cancellation failed: the order is not imported into Mantis." };
                }
                if (sdata.ord_statusid == 4)
                {
                    CancelOrderSageX3(request);
                    return new ResponseResult { Error = 0, Message = "Order Cancelled Successfully" };
                }
                var orderdetail = await _importedOrdersRepository.GetImportedOrderByIdAsync(request.Ids[0]);
                var data = orderdetail.FirstOrDefault();
                if (allocatedstockcheck.Count() > 0)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = data.pick_list_id,
                        subject_id = data.id,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { data = new { message = "Order cancellation failed: some items still have allocated stock. Please deallocate stock before proceeding." } }),
                        description = $"Cancel Order Process | {data.pick_list_id}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 1, Message = "Order cancellation failed: some items still have allocated stock. Please deallocate stock before proceeding." };
                }

                var url = "api/Order/CancelOrderBulk";
                var body = new { OrderCodes = request.Ids };

                var client = _httpClientFactory.CreateClient("MantisApi");
                var httpRequest = new HttpRequestMessage(HttpMethod.Put, url)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json")
                };

                var response = await client.SendAsync(httpRequest);
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<WmsCancelOrderResponse>(content);

                if (result == null)
                {
                    var properties = new
                    {
                        request = System.Net.WebUtility.HtmlEncode(url),                                           // Encode URL if required
                        response = "An error occurred while canceling order(s)."                                  //  raw response or encode if required
                    };
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = data.pick_list_id,
                        subject_id = data.id,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { data = new { message = "An error occurred while canceling order(s)." } }),
                        description = $"Cancel Order Process | {data.pick_list_id}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 1, Message = "An error occurred while canceling order(s)." };
                }


                if (result.Message.Contains("Success(1)", StringComparison.OrdinalIgnoreCase))
                {

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "success",
                        user_name = request.userName,
                        subject_ref = data.pick_list_id,
                        subject_id = data.id,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { data = new { message = result.Message } }),
                        description = $"Cancel Order | {data.pick_list_id}",
                        created_at = DateTime.UtcNow
                    });
                    await _importedOrdersRepository.UpdateOrderStatus(request.Ids, "Mantis Cancelled");
                    return new ResponseResult { Error = 0, Message = result.Message };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = data.pick_list_id,
                        subject_id = data.id,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { data = new { message = result.Message } }),
                        description = $"Cancel Order Process | {data.pick_list_id}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 1, Message = result.Message };
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.cancelorder,
                    @event = "error",
                    user_name = request.userName,
                    subject_ref = request.pick_list_id,
                    subject_id = request.picklist_id,
                    api_action_type = "Cancel Order",
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    description = $"Cancel Order Process | {request.pick_list_id}",
                    created_at = DateTime.UtcNow
                });
                return new ResponseResult { StatusCode = 500, Error = 1, Message = $"Error deleting order | {ex.Message}" };
            }
        }
        public async Task<ResponseResult> CancelItemSageX3(CancelOrderRequest request)
        {
            try
            {
                var data = await _importedOrdersRepository.GetOrderItemdetail(request.pick_list_id);
                var cancelleditemquantity = await _importedOrdersRepository.GetOrderItemcancelleddetail(request.pick_list_id, request.osiorderitemid);
                if (data.Data.Count() < 1)
                {
                    CancelOrderSageX3Conditional(request.pick_list_id, request.picklist_id, request.userName, request.itemids[0].itemId, request.userEmail, request.UserId);
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        subject_id = request.picklist_id,
                        @event = "success",
                        user_name = request.userName,
                        subject_ref = request.pick_list_id,
                        api_action_type = "Cancel Order",
                        properties = JsonConvert.SerializeObject(new { data = new { message = "Only one item found. Order cancelled successfully." } }),
                        description = $"Cancel Order Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "Only one item found. Order cancelled successfully."
                    };
                }
                var allItemIds = string.Join(",", request.itemids.Select(x => x.itemId));
                var orderDetails = await _importedOrdersRepository.GetPicklistLine(request.picklist_id, allItemIds);
                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];
                string? poolAlias = _configuration["SageX3Config:SAGE_X3_API_POOLALIAS"];
                string? sdhTyp = _configuration["SageX3Config:SDHTYP"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                //string poolAlias = ConfigDefaults.ProgressIDValue;

                foreach (var item in request.itemids)
                {
                    var dbRow = orderDetails.Where(x => x.qty == item.ori_Quantity).ToList();
                    var REMAINING = cancelleditemquantity.Data.ToList();
                    if (REMAINING[0].remaining > 0) //Update Case
                    {
                        var adjustedquantity = REMAINING[0].remaining;
                        string body = $@"
                         <soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:wss=""http://www.adonix.com/WSS"">
                               <soapenv:Header/>
                               <soapenv:Body>
                                  <wss:modify soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
                                     <callContext xsi:type=""wss:CAdxCallContext"">
                                        <codeLang xsi:type=""xsd:string"">ENG</codeLang>
                                        <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
                                        <poolId xsi:type=""xsd:string""></poolId>
                                        <requestConfig xsi:type=""xsd:string""></requestConfig>
                                     </callContext>
                                     <publicName xsi:type=""xsd:string"">YPICKTICKT</publicName>
                                    <objectKeys xsi:type=""wss:ArrayOfCAdxParamKeyValue"" soapenc:arrayType=""wss:CAdxParamKeyValue[]"">
                                     <CAdxParamKeyValue>
                                     	<key>PRHNUM</key>
                                     	<value>{request.pick_list_id}</value>
                                     </CAdxParamKeyValue>         
                                     </objectKeys>         
                                     <objectXml xsi:type=""xsd:string""> <![CDATA[<PARAM>
                            <TAB DIM=""1000"" ID=""PRH1_2"" SIZE=""1"">";

                        StringBuilder tabLines = new StringBuilder();

                        tabLines.AppendLine($@"
                                       <LIN NUM=""{dbRow[0].pick_list_line}"">
                                       <FLD NAME=""PRELIN"" >{dbRow[0].pick_list_line}</FLD>
                                       <FLD NAME=""ITMREF"" TYPE=""Char"">{item.itemId}</FLD>
                                       <FLD NAME=""QTYSTU"" TYPE=""Decimal"">{adjustedquantity}</FLD>
                                       <FLD NAME=""STU"" TYPE=""Char"">{dbRow[0].input_uom}</FLD>
                                       </LIN>");

                        body += tabLines.ToString();

                        body += @"
                                   </TAB>
                                   </PARAM>]]></objectXml>
                                   </wss:modify>
                                   </soapenv:Body>
                                   </soapenv:Envelope>"
                        ;


                        var soaprequest = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                        {
                            Content = new StringContent(body, Encoding.UTF8, "text/plain") // or "text/xml" if expected by the service
                        };

                        // Correct SOAPAction casing
                        soaprequest.Headers.Add("SOAPAction", "run");

                        var response = await client.SendAsync(soaprequest);
                        response.EnsureSuccessStatusCode();
                        var xmlResult = await response.Content.ReadAsStringAsync();

                        if (response.IsSuccessStatusCode)
                        {

                            await SendPicklistNotificationAsync(
                                pickListId: request.pick_list_id,
                                eventName: NotificationEvent.Picklist_Line_Cancellation.ToString(),
                                actionDescription: "Picklist Item Line Cancelled",
                                itemId: request.itemids?[0]?.itemId,
                                modifiedBy: request.userName,
                                userEmail: request.userEmail,
                                userId: request.UserId,
                                warehouse: "NYMT"
                            );

                        }

                        var properties = new { request = System.Net.WebUtility.HtmlEncode(body), response = xmlResult };

                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            subject_ref = request.pick_list_id,
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.cancelorder,
                            @event = "sync",
                            user_name = request.userName,
                            api_action_type = "Cancel OrderShip Item Sage",
                            subject_id = request.picklist_id,
                            properties = JsonConvert.SerializeObject(properties),
                            description = $"Update Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                            created_at = DateTime.UtcNow
                        });
                        var doc = XDocument.Parse(xmlResult);

                        // Extract <message> node
                        var message = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "message")?.Value;
                        var statusValue = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "status")?.Value;
                        if (statusValue == "1")
                        {

                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.cancelorder,
                                subject_id = request.picklist_id,
                                @event = "success",
                                user_name = request.userName,
                                subject_ref = request.pick_list_id,
                                api_action_type = "Cancel OrderShip Item Sage",
                                properties = JsonConvert.SerializeObject(new { data = new { message = "Quantity Updated successfully" } }),
                                description = $"Update Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                                created_at = DateTime.UtcNow
                            });
                        }
                        else
                        {
                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.cancelorder,
                                subject_id = request.picklist_id,
                                @event = "error",
                                user_name = request.userName,
                                subject_ref = request.pick_list_id,
                                api_action_type = "Update Cancel OrderShip Item Sage",
                                properties = JsonConvert.SerializeObject(new { data = new { message = message } }),
                                description = $"Update Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}"
                            });
                        }
                    }
                    else
                    {
                        string body = $@"
                       <soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/"" xmlns:wss=""http://www.adonix.com/WSS"">
                              <soapenv:Header/>
                              <soapenv:Body>
                                 <wss:run soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
                                    <callContext xsi:type=""wss:CAdxCallContext"">
                                       <codeLang xsi:type=""xsd:string"">ENG</codeLang>
                                       <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
                                       <poolId xsi:type=""xsd:string""></poolId>
                                       <requestConfig xsi:type=""xsd:string""></requestConfig>
                                    </callContext>
                                    <publicName xsi:type=""xsd:string"">YDELPKLIN2</publicName>
                                    <inputXml xsi:type=""xsd:string""> <![CDATA[<PARAM>
                           <GRP ID=""GRP1"">
                           <FLD NAM=""PRHNUM"">{request.pick_list_id}</FLD>
                           </GRP>
                           <TAB DIM=""30"" ID=""GRP2"" SIZE=""{orderDetails.Count()}"">";

                        int counter = 1;
                        StringBuilder tabLines = new StringBuilder();
                        foreach (var detail in dbRow)
                        {
                            tabLines.AppendLine($@"
                                    <LIN NUM=""{counter++}"">
                                    <FLD NAME=""PRELIN"" >{detail.pick_list_line}</FLD>
                                    </LIN>")
                            ;
                        }
                        body += tabLines.ToString();

                        body += @"
                                         </TAB>
                                         </PARAM>]]></inputXml>
                                         </wss:run>
                                         </soapenv:Body>
                                         </soapenv:Envelope>"
                        ;


                        var soaprequest = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                        {
                            Content = new StringContent(body, Encoding.UTF8, "text/plain") // or "text/xml" if expected by the service
                        };

                        // Correct SOAPAction casing
                        soaprequest.Headers.Add("SOAPAction", "run");

                        var response = await client.SendAsync(soaprequest);
                        response.EnsureSuccessStatusCode();
                        var xmlResult = await response.Content.ReadAsStringAsync();
                        var doc = XDocument.Parse(xmlResult);

                        if (response.IsSuccessStatusCode)
                        {
                            await SendPicklistNotificationAsync(
                                pickListId: request.pick_list_id,
                                eventName: NotificationEvent.Picklist_Line_Cancellation.ToString(),
                                actionDescription: "Picklist Item Line Cancelled",
                                itemId: request.itemids?[0]?.itemId,
                                modifiedBy: request.userName,
                                userEmail: request.userEmail,
                                userId: request.UserId,
                                warehouse: "NYMT"
                            );

                        }

                        // Extract <message> node
                        var message = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "message")?.Value;
                        var statusValue = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "status")?.Value;
                        var messages = doc.Descendants()
                        .Where(x => x.Name.LocalName == "multiRef")
                        .Select(x => new
                        {
                            Type = x.Descendants()
                                    .FirstOrDefault(e => e.Name.LocalName == "type")?.Value,
                            Message = x.Descendants()
                                       .FirstOrDefault(e => e.Name.LocalName == "message")?.Value
                        })
                        .ToList();

                        var properties = new { request = System.Net.WebUtility.HtmlEncode(body), response = xmlResult };

                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            subject_ref = request.pick_list_id,
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.cancelorder,
                            @event = "sync",
                            user_name = request.userName,
                            api_action_type = "Cancel OrderShip Item Sage",
                            subject_id = request.picklist_id,
                            properties = JsonConvert.SerializeObject(properties),
                            description = $"Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                            created_at = DateTime.UtcNow
                        });

                        if (statusValue == "1")
                        {

                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.cancelorder,
                                subject_id = request.picklist_id,
                                @event = "success",
                                user_name = request.userName,
                                subject_ref = request.pick_list_id,
                                api_action_type = "Cancel OrderShip Item Sage",
                                properties = JsonConvert.SerializeObject(new { data = new { message = "Item Cancelled successfully" } }),
                                description = $"Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                                created_at = DateTime.UtcNow
                            });
                        }
                        else
                        {
                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.cancelorder,
                                subject_id = request.picklist_id,
                                @event = "error",
                                user_name = request.userName,
                                subject_ref = request.pick_list_id,
                                api_action_type = "Cancel OrderShip Item Sage",
                                properties = JsonConvert.SerializeObject(new { data = new { message = message } }),
                                description = $"Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                                created_at = DateTime.UtcNow
                            });
                        }

                        return new ResponseResult { Error = 1, Message = "result.Message" };
                    }

                }
                return new ResponseResult { Error = 1, Message = "result.Message" };

            }
            catch (Exception ex)
            {
                return new ResponseResult { Error = 1, Message = $"Error deleting order | {ex.Message}" };
            }
        }
        public async Task<ResponseResult> CancelItems(CancelOrderRequest request)
        {
            try
            {
                var allocatedstockcheck = await _importedOrdersRepository.GetAllocatedStockDetailsforordershipitem(request.pick_list_id, Convert.ToInt32(request.Ids[0]));
                var email = await _importedOrdersRepository.GetEmailByPicklist(request.pick_list_id);
                var creatorEmail = email?.creator_email;
                if (!string.IsNullOrWhiteSpace(creatorEmail))
                {
                    await _importedOrdersRepository.UpdateNotificationEmail("Picklist Notifications", creatorEmail);
                }

                var manualEmail = await _importedOrdersRepository.GetManualEmail("Picklist Notifications");
                var primaryEmails = manualEmail.FirstOrDefault();

                var manualPrimaryEmail = primaryEmails?.nst_Primary_Emails?.Trim();
                var defaultPrimaryEmail = primaryEmails?.default_Emails?.Trim();

                var primaryEmail = !string.IsNullOrWhiteSpace(manualPrimaryEmail) ? manualPrimaryEmail : defaultPrimaryEmail;

                if (primaryEmail?.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase) == true)
                {
                    primaryEmail = creatorEmail;
                }

                if (string.IsNullOrWhiteSpace(creatorEmail) && string.IsNullOrWhiteSpace(primaryEmail))
                {
                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "Please enter the manual email."
                    };
                }

                //var template = await _importedOrdersRepository.GetDefaultTemplateByEvent(NotificationEvent.Picklist_Line_Cancellation.ToString());

                //if (template == null)
                //    return new ResponseResult
                //    {
                //        Error = 0,
                //        Message = "Template not found."
                //    };

                //int isEnabled = Convert.ToInt32(template.IsEnabled);

                //// if IsEnabled = 0 => do not send mail, return error
                //if (isEnabled == 0 || template.IsEnabled == false)
                //{
                //    return new ResponseResult
                //    {
                //        Error = 1,
                //        Message = "Notification trigger is off."
                //    };
                //}

                if (allocatedstockcheck.Count() > 0)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        subject_id = request.picklist_id,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = request.pick_list_id,
                        api_action_type = "Cancel OrderShip Item",
                        properties = JsonConvert.SerializeObject(new { data = new { message = "Item cancellation failed: stock is still allocated for this order line. Please deallocate stock before retrying." } }),
                        description = $"Update Cancel Order Ship Item Process Sage | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 1, Message = "Item cancellation failed: stock is still allocated for this order line. Please deallocate stock before retrying." };
                }

                var url = $"api/Order/CancelOrderShipItem?OrderShipItemID={request.Ids[0]}";

                var body = new { headerIDs = request.Ids };

                var client = _httpClientFactory.CreateClient("MantisApi");
                var httpRequest = new HttpRequestMessage(HttpMethod.Put, url)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json")
                };

                var response = await client.SendAsync(httpRequest);
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<WmsCancelOrderResponse>(content);


                if (result == null)
                {
                    var properties = new
                    {
                        data = "An error occurred while cancelling item(s)."                                   // raw response or encode if required
                    };

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = request.pick_list_id,
                        subject_id = request.picklist_id,
                        api_action_type = "Cancel OrderShip Item",
                        //properties = JsonConvert.SerializeObject(properties),
                        properties = JsonConvert.SerializeObject(new { data = new { message = "An error occurred while cancelling item(s)." } }),
                        description = $"Cancel Order Ship Item Process | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 1, Message = "An error occurred while cancelling item(s)." };
                }

                if (result.IsSuccess)
                {
                    var properties = new
                    {
                        data = result                               // raw response or encode if required
                    };

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "success",
                        user_name = request.userName,
                        subject_ref = request.pick_list_id,
                        subject_id = request.picklist_id,
                        api_action_type = "Cancel OrderShip Item",
                        //properties = JsonConvert.SerializeObject(properties),
                        properties = JsonConvert.SerializeObject(new { data = new { message = result.Message } }),
                        description = $"Cancel Order Ship Item Process | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 0, Message = result.Message };
                }
                else
                {
                    var properties = new
                    {
                        data = result.Message                                   // raw response or encode if required
                    };

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.cancelorder,
                        @event = "error",
                        user_name = request.userName,
                        subject_ref = request.pick_list_id,
                        subject_id = request.picklist_id,
                        api_action_type = "Cancel OrderShip Item",
                        //properties = JsonConvert.SerializeObject(properties),
                        properties = JsonConvert.SerializeObject(new { data = new { message = result.Message } }),
                        description = $"Cancel Order Ship Item Process | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                        created_at = DateTime.UtcNow
                    });
                    return new ResponseResult { Error = 1, Message = result.Message };
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.cancelorder,
                    @event = "error",
                    user_name = request.userName,
                    subject_ref = request.pick_list_id,
                    subject_id = request.picklist_id,
                    api_action_type = "Cancel OrderShip Item",
                    //properties = JsonConvert.SerializeObject(properties),
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    description = $"Cancel Order Ship Item Process | {request.pick_list_id} | Item Code | {request.itemids[0].itemId}",
                    created_at = DateTime.UtcNow
                });
                return new ResponseResult { StatusCode = 500, Error = 1, Message = $"Error deleting order | {ex.Message}" };
            }
        }

        public async Task<IEnumerable<SectorCodeDto>> GetSectorCodes(string? orderCode)
        {
            return await _importedOrdersRepository.GetSectorCodes(orderCode);
        }

        public async Task<ResponseResult> UpdateTasks(UpdateTaskRequest request)
        {
            try
            {
                var fromLocationCodes = request.Task
                    .Select(t => t.Tsk_FromLocationCode)
                    .ToList();

                var affectedRows = await _importedOrdersRepository.UpdateTasks(request.Orders, request.User, fromLocationCodes);

                return new ResponseResult { Error = 0, Message = "Tasks updated successfully." };
            }
            catch (Exception ex)
            {
                return new ResponseResult { Error = 1, Message = $"Task update failed: {ex.Message}" };
            }
        }
        public async Task<IEnumerable<MantisUser>> GettaskwiseMantisUsers(string customercode)
        {
            return await _importedOrdersRepository.GettaskwiseMantisUsers(customercode);
        }

        private async Task<ResponseResult> picklistDetailApiCall(PickListOrders order, string? actionType)
        {
            var pickListId = order.pick_list_id;
            var picklist_id = order.id;

            try
            {
                // External API setup
                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                string request = $"YSTOPREH(\"{pickListId}\")?representation=YSTOPRE.$details";
                var urlResponse = await client.GetAsync(request);
                urlResponse.EnsureSuccessStatusCode();

                var response = await urlResponse.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(response);
                var (jsonTable, creatorEmail) = await FetchAndPrintJsonAsTableAsync(response);

                // Log sync activity
                var activity = new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "sync",
                    description = $"PickList Lines {actionType}",
                    api_action_type = $"PickList Lines {actionType}",
                    properties = JsonConvert.SerializeObject(new { request, response = result }),
                    subject_id = picklist_id,
                    created_at = DateTime.UtcNow
                };
                await _IActivityLogRepository.ActivityLog(activity);

                // Process and validate lines
                bool trueInvalid = false;
                int orderCanExport = 1;
                List<OrderLinesDto> details = new();

                foreach (DataRow row in jsonTable.Rows)
                {
                    string? sku = row["ITMREF"].ToString();
                    string? uom = row["PCU"].ToString();
                    bool isKitItem = false;
                    bool isShipItem = false;
                    bool isValid = false;
                    int canExport = 1;

                    int lintyp = Convert.ToInt32(row["LINTYP"]);
                    int stockManage = Convert.ToInt32(row["STOMGTCOD"]);

                    if (lintyp != 2)
                    {
                        var conversions = await _importedOrdersRepository.GetSkuConversionAsync(sku);
                        var conversion = conversions.FirstOrDefault();

                        if (conversion != null)
                        {
                            sku = conversion.sku_mantis;
                            uom = conversion.uom_mantis;
                            isKitItem = conversion.is_kit_item;
                            isShipItem = conversion.is_ship_item;

                            var product = await _importedOrdersRepository.GetProductBySkuAsync(sku);
                            isValid = product != null;
                        }
                        else
                        {
                            sku = null;
                            uom = null;
                            isValid = false;
                        }

                        if (!isValid && !row["ITMREF"].ToString().Contains("SHIP"))
                            trueInvalid = true;
                    }

                    // Export check
                    if ((lintyp != 3 && lintyp != 1) || stockManage == 1)
                    {
                        canExport = 0;
                        orderCanExport = 0;
                    }

                    var dto = new OrderLinesDto
                    {
                        pick_list_id = pickListId,
                        pick_list_line = Convert.ToInt16(row["PRELIN"]),
                        order_code = row["ORINUM"].ToString(),
                        order_type = row["ORITYP"].ToString(),
                        line_type = lintyp,
                        item_reference = sku,
                        item_description = row["ITMDES1"].ToString(),
                        qty = Convert.ToInt32(row["ALLQTY"]),
                        item_no = Convert.ToInt32(row["ORILIN"]),
                        uom = uom,
                        create_datetime = Convert.ToDateTime(row["CREDATTIM"]),
                        bpcord = row["BPCORD"].ToString(),
                        ship_to = row["BPAADD"].ToString(),
                        delivery_at = Convert.ToDateTime(row["DLVDAT"]),
                        shidat = Convert.ToDateTime(row["SHIDAT"]),
                        site = row["STOFCY"].ToString(),
                        picklist_id = picklist_id,
                        status = EnumData.PicklistDetailsStatus.Unprocessed.ToString(),
                        stock_manage = stockManage,
                        input_sku = row["ITMREF"].ToString(),
                        input_uom = row["PCU"].ToString(),
                        input_qty = Convert.ToInt32(row["ALLQTY"]),
                        is_kit_item = isKitItem,
                        is_ship_item = isShipItem,
                        is_valid_item = isValid,
                        is_exported = isValid ? 0 : 4,
                        can_export = (canExport == 1),
                        mantis_imported = 9
                    };

                    details.Add(dto);
                }

                // Batch insert
                var batches = details
                    .Select((detail, index) => new { detail, index })
                    .GroupBy(x => x.index / 50)
                    .Select(g => g.Select(x => x.detail).ToList());

                foreach (var batch in batches)
                {
                    await _importedOrdersRepository.UpsertPickListDetailsAsync(batch);
                }

                await _importedOrdersRepository.UpdateMantisImportedFlagAsync(pickListId);

                // Update picklist summary
                var summary = await _importedOrdersRepository.GetPickListByIdAsync(pickListId);
                summary.is_sync = 1;
                summary.invalid_items = trueInvalid;
                summary.sync_at = DateTime.UtcNow;
                summary.status = EnumData.PicklistDetailsStatus.Unprocessed.ToString();
                summary.customer_code = details.FirstOrDefault()?.bpcord;
                summary.ship_to = details.FirstOrDefault()?.ship_to;
                summary.api_export = details.All(d => d.can_export);

                await _importedOrdersRepository.UpdatePickListAsync(summary);

                // Mark as fully exported if no unexported lines
                if (!await _importedOrdersRepository.HasUnexportedLinesAsync(picklist_id))
                {
                    summary.is_exported = 5;
                    await _importedOrdersRepository.UpdatePickListAsync(summary);
                }

                return new ResponseResult { Error = 0, Message = "Data Synced Successfully" };
            }
            catch (Exception ex)
            {
                var failedPickList = await _importedOrdersRepository.GetPickListByIdAsync(pickListId);
                if (failedPickList != null)
                {
                    failedPickList.is_sync = 2;
                    failedPickList.status = EnumData.PicklistDetailsStatus.Unprocessed.ToString();
                    await _importedOrdersRepository.UpdatePickListAsync(failedPickList);
                }

                var errorLog = new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.picklist,
                    @event = "error",
                    description = $"PickList Lines {actionType} | {pickListId} | Exception",
                    api_action_type = $"PickList Lines {actionType}",
                    properties = JsonConvert.SerializeObject(new { error = ex.Message }),
                    created_at = DateTime.UtcNow
                };

                await _IActivityLogRepository.ActivityLog(errorLog);

                return new ResponseResult { Error = 1, Message = $"Error while syncing data | {ex.Message}" };
            }
        }


        /// <summary>
        /// Sends a notification email for Picklist-related events (Cancellation, Line Cancellation, etc.)
        /// and logs the result using NotificationLogsService.
        /// </summary>
        private async Task SendPicklistNotificationAsync(string pickListId, string eventName, string actionDescription, string? itemId = null, string? modifiedBy = null, string? userEmail = null, int userId = 0, string? warehouse = "NYMT")
        {
            try
            {
                var allowedDomains = _configuration.GetSection("EmailSettings:AllowedDomains").Get<List<string>>()?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim().ToLower()).Distinct().ToHashSet() ?? new HashSet<string>();
                var senderEmail = _configuration["EmailSettings:SenderEmail"];

                if (!IsValidEmail(senderEmail) || !IsAllowedDomain(senderEmail, allowedDomains))
                {
                    throw new Exception("Sender email is invalid or sender domain is not allowed. Please use dynarex.com or dynarextech.com");
                }

                var creatorEmailResult = await _importedOrdersRepository.GetEmailByPicklist(pickListId);
                string? creatorEmail = creatorEmailResult?.creator_email;

                var manualEmail = await _importedOrdersRepository.GetManualEmail("Picklist Notifications");
                var emailConfig = manualEmail?.FirstOrDefault();

                var template = await _importedOrdersRepository.GetDefaultTemplateByEvent(eventName.ToUpper());

                if (template == null || template.IsEnabled == false)
                {
                    return;
                }

                var estTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"));

                var templateData = new
                {
                    PicklistID = pickListId,
                    Action = actionDescription,
                    LineItem = itemId ?? "",
                    ModifiedBy = modifiedBy ?? "System",
                    Date = estTime.ToString("dd/MM/yyyy hh:mm tt"),
                    Warehouse = warehouse
                };

                string finalBody = BuildEmailBody(template.Body, templateData);
                string finalSubject = BuildEmailBody(template.Subject, templateData);

                var primaryEmailRaw = string.IsNullOrWhiteSpace(creatorEmail) ? emailConfig?.nst_Primary_Emails : creatorEmail;
                var secondaryEmailsRaw = emailConfig?.nst_Secondary_Emails;

                var primaryEmails = ParseEmails(primaryEmailRaw);
                var secondaryEmails = ParseEmails(secondaryEmailsRaw);

                var validPrimaryEmails = primaryEmails.Where(email => IsValidEmail(email) && IsAllowedDomain(email, allowedDomains)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var invalidPrimaryEmails = primaryEmails.Where(email => !IsValidEmail(email) || !IsAllowedDomain(email, allowedDomains)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                var validSecondaryEmails = secondaryEmails.Where(email => IsValidEmail(email) && IsAllowedDomain(email, allowedDomains)).Distinct(StringComparer.OrdinalIgnoreCase).Where(email => !validPrimaryEmails.Contains(email, StringComparer.OrdinalIgnoreCase)).ToList();
                var invalidSecondaryEmails = secondaryEmails.Where(email => !IsValidEmail(email) || !IsAllowedDomain(email, allowedDomains)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                var allValidRecipients = validPrimaryEmails.Concat(validSecondaryEmails).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var allInvalidRecipients = invalidPrimaryEmails.Concat(invalidSecondaryEmails).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                if (!allValidRecipients.Any())
                {
                    await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                    {
                        NotificationSettingID = emailConfig?.nst_ID ?? 0,
                        TriggerID = template.TriggerID,
                        UserID = userId,
                        NotificationType = emailConfig?.nst_ModuleName,
                        OpertionType = eventName.ToUpper(),
                        Status = "ERROR",
                        CreatedBy = userEmail ?? "System",
                        Subject = finalSubject,
                        Body = finalBody,
                        PrimaryEmail = string.Join(", ", invalidPrimaryEmails),
                        SecondaryEmail = string.Join(", ", invalidSecondaryEmails),
                        ErrorMessage = $"No valid recipient email found. Invalid/Skipped: {string.Join(", ", allInvalidRecipients)}"
                    });

                    throw new Exception($"No valid recipient email found. Invalid/Skipped: {string.Join(", ", allInvalidRecipients)}");
                }

                var sendGrid = new SendGridClient(_configuration["SendGrid:ApiKey"]);
                // Capture MessageId
                var messageId = Guid.NewGuid().ToString();

                var msg = new SendGridMessage
                {
                    From = new EmailAddress(senderEmail, template.EventName),
                    Subject = finalSubject,
                    HtmlContent = finalBody
                };

                foreach (var email in validPrimaryEmails)
                {
                    msg.AddTo(new EmailAddress(email));
                }

                foreach (var email in validSecondaryEmails)
                {
                    msg.AddCc(new EmailAddress(email));
                }

                msg.CustomArgs = new Dictionary<string, string>
                {
                    { "MessageId", messageId },
                    { "PickListId", pickListId },
                    { "ProjectName", "MW" }
                };

                var emailResponse = await sendGrid.SendEmailAsync(msg);

                // Status
                var finalStatus = allInvalidRecipients.Any() ? "PARTIAL" : "SENT";

                var skippedRecipientsMessage = allInvalidRecipients.Any() ? $"Skipped invalid emails: {string.Join(", ", allInvalidRecipients)}" : null;

                if (!emailResponse.IsSuccessStatusCode)
                {
                    var error = await emailResponse.Body.ReadAsStringAsync();

                    await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                    {
                        NotificationSettingID = emailConfig?.nst_ID ?? 0,
                        TriggerID = template.TriggerID,
                        UserID = userId,
                        NotificationType = emailConfig?.nst_ModuleName,
                        OpertionType = eventName.ToUpper(),
                        Status = "ERROR",
                        CreatedBy = userEmail ?? "System",
                        Subject = finalSubject,
                        Body = finalBody,
                        PrimaryEmail = string.Join(", ", validPrimaryEmails),
                        SecondaryEmail = string.Join(", ", validSecondaryEmails),
                        ErrorMessage = string.IsNullOrWhiteSpace(skippedRecipientsMessage) ? error : $"{error} | {skippedRecipientsMessage}",
                        MessageId = messageId
                    });

                    throw new Exception($"Email sending failed: {error}");
                }

                await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                {
                    NotificationSettingID = emailConfig?.nst_ID ?? 0,
                    TriggerID = template.TriggerID,
                    UserID = userId,
                    NotificationType = emailConfig?.nst_ModuleName,
                    OpertionType = eventName.ToUpper(),
                    Status = finalStatus,
                    CreatedBy = userEmail ?? "System",
                    Subject = finalSubject,
                    Body = finalBody,
                    PrimaryEmail = string.Join(", ", validPrimaryEmails),
                    SecondaryEmail = string.Join(", ", validSecondaryEmails),
                    ErrorMessage = skippedRecipientsMessage,
                    MessageId = messageId
                });
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        private static List<string> ParseEmails(string? emails)
        {
            if (string.IsNullOrWhiteSpace(emails))
            {
                return new List<string>();
            }

            return emails.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        }

        private static bool IsAllowedDomain(string? email, HashSet<string> allowedDomains)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            var parts = email.Split('@');

            if (parts.Length != 2 || string.IsNullOrWhiteSpace(parts[1]))
            {
                return false;
            }

            return allowedDomains.Contains(parts[1].Trim().ToLower());
        }

        private static bool IsValidEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            try
            {
                var addr = new MailAddress(email);
                return addr.Address.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private string BuildEmailBody(string templateBody, object data)
        {
            if (string.IsNullOrWhiteSpace(templateBody))
                return string.Empty;

            var properties = data.GetType().GetProperties();

            foreach (var prop in properties)
            {
                var key = prop.Name;
                var value = prop.GetValue(data)?.ToString() ?? "";

                templateBody = templateBody.Replace($"{{{key}}}", value);
            }

            return templateBody.Replace("\n", "<br>");
        }

    }
}