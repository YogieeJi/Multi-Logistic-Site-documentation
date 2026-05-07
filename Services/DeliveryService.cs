using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Diagnostics.Eventing.Reader;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http.Headers;
using System.Resources;
using System.Security.AccessControl;
using System.Text;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.Common;
using iText.Layout.Element;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MiddlewareWebAPI.Common.Enum;
using MiddlewareWebAPI.Data.DataAccess;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using OfficeOpenXml.Style;
using Org.BouncyCastle.Asn1.Cmp;
using Org.BouncyCastle.Asn1.Ocsp;
using SendGrid.Helpers.Mail;
using SendGrid;
using Swashbuckle.Swagger;
using static System.Runtime.InteropServices.JavaScript.JSType;
using static Hangfire.Storage.JobStorageFeatures;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using static MiddlewareWebAPI.Common.Enum.EnumData;
using System.Net.Mail;

namespace MiddlewareWebAPI.Services.Services
{
    public class DeliveryService : IDeliveryService
    {
        private readonly IDeliveryRepository _deliveryRepository;
        private readonly ILogger<DeliveryService> _logger;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IImportedOrdersRepository _importedOrdersRepository;
        private readonly INotificationLogsService _notificationLogsService;
        private readonly IActivityLogRepository _IActivityLogRepository;
        public ISqlDataAccess _oedataAccess { get; }
        public DeliveryService(IDeliveryRepository deliveryRepository, ILogger<DeliveryService> logger, IBackgroundJobClient backgroundJobClient, HttpClient httpClient, IConfiguration configuration, ISqlDataAccess dataAccess, IImportedOrdersRepository importedOrdersRepository, INotificationLogsService notificationLogsService, IActivityLogRepository iActivityLogRepository)
        {
            _deliveryRepository = deliveryRepository;
            _logger = logger;
            _backgroundJobClient = backgroundJobClient;
            _httpClient = httpClient;
            _configuration = configuration;
            _oedataAccess = dataAccess;
            _importedOrdersRepository = importedOrdersRepository;
            _notificationLogsService = notificationLogsService;
            _IActivityLogRepository = iActivityLogRepository;
        }


        public async Task<DeliveryOrderResponse> CreateDeliveries(DeliveryOrderRequest orders)
        {
            try
            {
                //if (orders.Orders == null || orders.Orders.Count == 0)
                if (orders == null || orders.Orders == null || !orders.Orders.Any())
                    return new DeliveryOrderResponse { error = 1, message = "Invalid data format" };

                foreach (var order in orders.Orders)
                {
                    var orderData = await _deliveryRepository.GetImportedOrderByPickListId(orders.Orders[0].pick_list_id);
                    if (orderData != null)
                    {
                        await _deliveryRepository.ExecuteDeliveryProcedure(orders.Orders[0].pick_list_id);
                    }
                }


                int failJobs = orders.FailJobs != null ? 2 : 0;

                if (failJobs > 0)
                {
                    foreach (var order in orders.Orders)
                    {
                        if (order.is_exported == null || order.is_exported != 3)
                        {
                            return new DeliveryOrderResponse
                            {
                                error = 1,
                                message = "Please select only failed jobs."
                            };
                        }
                    }
                }

                if (failJobs == 0)
                {
                    var data = orders.Orders.FirstOrDefault();
                    if (data.is_exported == 3)
                    {
                        return new DeliveryOrderResponse
                        {
                            error = 1,
                            message = "Please Do Not Select failed jobs while performing Order Export. Perform Re-run For Failed Jobs."
                        };
                    }
                    else if (data.is_exported == 2)
                    {
                        return new DeliveryOrderResponse
                        {
                            error = 1,
                            message = "This Order is Already Exported"
                        };
                    }
                }

                foreach (var order in orders.Orders)
                {
                    string pickListId = order.pick_list_id;
                    bool isAlreadyQueued = await _deliveryRepository.IsPickListAlreadyQueued(order.pick_list_id);
                    if (!isAlreadyQueued)
                    {
                        var ord = await _deliveryRepository.GetImportedOrderByPickListId(pickListId);
                        //_deliveryRepository.ExecuteDeliveryProcedure(pickListId);
                        var job = new JobModel
                        {
                            queue = "orderexport",
                            payload = JsonConvert.SerializeObject(new
                            {
                                user = orders.userName,
                                pick_list_id = order.pick_list_id,
                                id = order.id,
                                failJobs = failJobs
                            }),
                            attempts = 0,
                            reserved_at = null,
                            available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                            created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        };
                        //var job1 = new PayloadModel
                        //{
                        //    user = orders.userName,
                        //    pick_list_id = order.pick_list_id,
                        //    id = order.id,
                        //    failJobs = failJobs
                        //};
                        //var d = CheckPickListItemLotJob(job1);
                        await _deliveryRepository.InsertLoadOrdersJob(job);
                    }
                    else
                    {
                        return new DeliveryOrderResponse { error = 1, message = "Delivery already Initiated" };
                    }
                }
                return new DeliveryOrderResponse { error = 0, message = "Delivery Process Initiated" };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Delivery Process Failed: {ex.Message}");
                return new DeliveryOrderResponse { error = 1, message = $"Error while syncing data | {ex.Message}" };
            }
        }

        public async Task<DeliveryOrderResponse> CreateDeliveriesNew(DeliveryOrderRequest orders)
        {
            try
            {
                if (orders == null || orders.Orders == null || !orders.Orders.Any())
                    return new DeliveryOrderResponse { error = 1, message = "Invalid data format" };

                int failJobs = orders.FailJobs != null ? 2 : 0;

                if (failJobs > 0)
                {
                    foreach (var order in orders.Orders)
                    {
                        if (order.is_exported == null || order.is_exported != 3)
                        {
                            return new DeliveryOrderResponse
                            {
                                error = 1,
                                message = "Please select only failed jobs."
                            };
                        }
                    }
                }

                //var template = await _importedOrdersRepository.GetDefaultTemplateByEvent(NotificationEvent.Order_Export_Dashboard.ToString());

                //if (template == null)
                //    return new DeliveryOrderResponse
                //    {
                //        error = 0,
                //        message = "Template not found."
                //    };

                //int isEnabled = Convert.ToInt32(template.IsEnabled);

                //// if IsEnabled = 0 => do not send mail, return error
                //if (isEnabled == 0 || template.IsEnabled == false)
                //{
                //    return new DeliveryOrderResponse
                //    {
                //        error = 1,
                //        message = "Notification trigger is off."
                //    };
                //}

                foreach (var order in orders.Orders)
                {
                    string pickListId = order.pick_list_id;
                    bool isAlreadyQueued = await _deliveryRepository.IsPickListAlreadyQueued(order.pick_list_id);
                    if (!isAlreadyQueued)
                    {
                        var ord = await _deliveryRepository.GetImportedOrderByPickListId(pickListId);
                        //_deliveryRepository.ExecuteDeliveryProcedure(pickListId);
                        var job = new JobModel
                        {
                            queue = "orderexportnew",
                            payload = JsonConvert.SerializeObject(new
                            {
                                user = orders.userName,
                                pick_list_id = order.pick_list_id,
                                id = order.id,
                                failJobs = failJobs
                            }),
                            attempts = 0,
                            reserved_at = null,
                            available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                            created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        };

                        var email = await _importedOrdersRepository.GetEmailByPicklist(pickListId);
                        var creatorEmail = email?.creator_email;
                        if (!string.IsNullOrWhiteSpace(creatorEmail))
                        {
                            await _importedOrdersRepository.UpdateNotificationEmail("Order Export Dashboard Notifications", creatorEmail);
                        }

                        var manualEmail = await _importedOrdersRepository.GetManualEmail("Order Export Dashboard Notifications");
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
                            return new DeliveryOrderResponse
                            {
                                error = 1,
                                message = "Please enter the manual email."
                            };

                        }

                        var payloadObj = JsonConvert.DeserializeObject<CheckPickListItemJobPayload>(job.payload);
                        CheckPickListItemLotJobNew(payloadObj);
                        //await _deliveryRepository.InsertLoadOrdersJob(job);
                    }
                    else
                    {
                        return new DeliveryOrderResponse { error = 1, message = "Delivery already Initiated" };
                    }
                }
                return new DeliveryOrderResponse { error = 0, message = "Delivery Process Initiated" };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Delivery Process Failed: {ex.Message}");
                return new DeliveryOrderResponse { error = 1, message = $"Error while syncing data | {ex.Message}" };
            }
        }
        public async Task<DeliveryOrderResponse> CreateDeliveriesNewChanges(DeliveryOrderRequest orders)
        {
            try
            {
                if (orders == null || orders.Orders == null || !orders.Orders.Any())
                    return new DeliveryOrderResponse { error = 1, message = "Invalid data format" };

                int failJobs = orders.FailJobs != null ? 2 : 0;

                if (failJobs > 0)
                {
                    foreach (var order in orders.Orders)
                    {
                        if (order.is_exported == null || order.is_exported != 3)
                        {
                            return new DeliveryOrderResponse
                            {
                                error = 1,
                                message = "Please select only failed jobs."
                            };
                        }
                    }
                }

                //var template = await _importedOrdersRepository.GetDefaultTemplateByEvent(NotificationEvent.Order_Export_Dashboard.ToString());

                //if (template == null)
                //    return new DeliveryOrderResponse
                //    {
                //        error = 0,
                //        message = "Template not found."
                //    };

                //int isEnabled = Convert.ToInt32(template.IsEnabled);

                //// if IsEnabled = 0 => do not send mail, return error
                //if (isEnabled == 0 || template.IsEnabled == false)
                //{
                //    return new DeliveryOrderResponse
                //    {
                //        error = 1,
                //        message = "Notification trigger is off."
                //    };
                //}

                foreach (var order in orders.Orders)
                {
                    string pickListId = order.pick_list_id;
                    bool isAlreadyQueued = await _deliveryRepository.IsPickListAlreadyQueued(order.pick_list_id);
                    if (!isAlreadyQueued)
                    {
                        var ord = await _deliveryRepository.GetImportedOrderByPickListId(pickListId);
                        //_deliveryRepository.ExecuteDeliveryProcedure(pickListId);
                        var job = new JobModel
                        {
                            queue = "orderexportnew",
                            payload = JsonConvert.SerializeObject(new
                            {
                                user = orders.userName,
                                pick_list_id = order.pick_list_id,
                                id = order.id,
                                failJobs = failJobs
                            }),
                            attempts = 0,
                            reserved_at = null,
                            available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                            created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                        };

                        var email = await _importedOrdersRepository.GetEmailByPicklist(pickListId);
                        var creatorEmail = email?.creator_email;
                        if (!string.IsNullOrWhiteSpace(creatorEmail))
                        {
                            await _importedOrdersRepository.UpdateNotificationEmail("Order Export Dashboard Notifications", creatorEmail);
                        }

                        var manualEmail = await _importedOrdersRepository.GetManualEmail("Order Export Dashboard Notifications");
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
                            return new DeliveryOrderResponse
                            {
                                error = 1,
                                message = "Please enter the manual email."
                            };

                        }

                        var payloadObj = JsonConvert.DeserializeObject<CheckPickListItemJobPayload>(job.payload);
                        CheckPickListItemLotJobNewChanges(payloadObj);
                        //await _deliveryRepository.InsertLoadOrdersJob(job);
                    }
                    else
                    {
                        return new DeliveryOrderResponse { error = 1, message = "Delivery already Initiated" };
                    }
                }
                return new DeliveryOrderResponse { error = 0, message = "Delivery Process Initiated" };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Delivery Process Failed: {ex.Message}");
                return new DeliveryOrderResponse { error = 1, message = $"Error while syncing data | {ex.Message}" };
            }
        }
        public async Task<ResponseResult> CheckPickListItemLotJob(CheckPickListItemJobPayload payload)
        {
            if (payload == null) return new ResponseResult { Error = 1, Message = "Payload is null." }; ;

            var pickListId = payload.pick_list_id;
            var user = payload.user;
            try
            {
                var ids = await _deliveryRepository.GetOrderIdByPickListId(pickListId!);
                var activityid = ids.Data.FirstOrDefault();
                int count = 0;
                string datetime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                var lot_string_array = new List<string>(); 
                var lots_qty_array = new Dictionary<int, Dictionary<string, decimal>>();
                int main_found_count = 0;
                if (ids.Data.Count > 0)
                {
                    foreach (var id in ids.Data)
                    {
                        if (!string.IsNullOrEmpty(id.lot_detail))
                        {
                            var lotdetail = id.lot_detail ?? string.Empty;
                            lot_string_array = lotdetail.Split(new[] { "\\n;" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                            if (lot_string_array.Count > 1)
                            {
                                foreach (var value in lot_string_array)
                                {
                                    var parts = value.Split(';');
                                    if (parts.Length >= 5)
                                    {
                                        string lotNumber = parts[4];
                                        if (decimal.TryParse(parts[2], out decimal quantity))
                                        {
                                            if (!lots_qty_array.ContainsKey(id.pick_list_line))
                                                lots_qty_array[id.pick_list_line] = new Dictionary<string, decimal>();

                                            if (lots_qty_array[id.pick_list_line].ContainsKey(lotNumber))
                                                lots_qty_array[id.pick_list_line][lotNumber] += quantity;
                                            else
                                                lots_qty_array[id.pick_list_line][lotNumber] = quantity;
                                        }
                                    }
                                }
                            }
                            else
                            {
                                var parts = lot_string_array[0].Split(';');
                                if (parts.Length >= 5)
                                {
                                    string lotNumber = parts[4];
                                    if (decimal.TryParse(parts[2], out decimal quantity))
                                    {
                                        if (!lots_qty_array.ContainsKey(id.pick_list_line))
                                            lots_qty_array[id.pick_list_line] = new Dictionary<string, decimal>();

                                        if (lots_qty_array[id.pick_list_line].ContainsKey(lotNumber))
                                            lots_qty_array[id.pick_list_line][lotNumber] += quantity;
                                        else
                                            lots_qty_array[id.pick_list_line][lotNumber] = quantity;
                                    }
                                }
                            }
                        }
                        // Mark order closed
                        //await _importedOrdersRepository.UpdateImportedOrderStatus(pickListId, "Closed");
                    }
                    foreach (var id in ids.Data)
                    {

                        var lots_array = new List<string>();
                        count++;
                        int found_count = 0;
                        int qty_count = 0;
                        if (!string.IsNullOrEmpty(id.lot_detail))
                        {
                            var lotdetail = id.lot_detail ?? string.Empty;
                            lot_string_array = lotdetail.Split(new[] { "\\n;" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                            if (lot_string_array.Count > 1)
                            {
                                // Log: Inventory Lot Detail api request: 2nd if
                                foreach (var value in lot_string_array)
                                {
                                    var parts = value.Split(';');
                                    if (parts.Length > 4)
                                    {
                                        var lotNumber = parts[4];
                                        if (!lots_array.Contains(lotNumber))
                                        {
                                            lots_array.Add(lotNumber);
                                        }
                                    }
                                }
                            }
                            else
                            {
                                // Log: Inventory Lot Detail api request: 2nd else
                                var parts = lot_string_array[0].Split(';');
                                if (parts.Length > 4)
                                {
                                    lots_array.Add(parts[4]);
                                }
                            }


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

                            //string request = $"YSTOPREH(\"{pickListId}\")?representation=YSTOPRE.$details";
                            //string request = 'YSTOLOTFCY?representation=YSTOLOTFCY.$query&count=100&where=STOFCY eq '."'".''.$id->site.''."'".' and ITMREF eq '."'".''.$id->input_sku.''."'".'';
                            string request = $"YSTOLOTFCY?representation=YSTOLOTFCY.$query&count=100&where=STOFCY eq '{id.site}' and ITMREF eq '{id.input_sku}'";

                            var fullUrl = new Uri(client.BaseAddress, request);

                            var urlResponse = await client.GetAsync(fullUrl);
                            urlResponse.EnsureSuccessStatusCode();

                            var response = await urlResponse.Content.ReadAsStringAsync();
                            var result1 = JsonConvert.DeserializeObject<dynamic>(response);
                            var result = JsonConvert.DeserializeObject<YSTOLOTFCYResponse>(response);

                            //DataTable jsonTable = await FetchAndPrintJsonAsTableAsync(response);


                            _logger.LogInformation("Inventory Lot Detail api request: " + lots_array);
                            _logger.LogInformation("Inventory Lot Detail api request qty arr: " + lots_qty_array);
                            _logger.LogInformation("Inventory Lot Detail api response: " + result);

                            /*----------------To Be Implemented--------------------------
                            activity logs
                            ctivity()
                            >causedBy($this->user)
                            >performedOn($this->picklist)
                            >event('sync')
                            >tap(function(Activity $activity) {
                               $activity->log_name  = 'outbound';
                               $activity->subject_ref = $this->pick_list_id;
                               $activity->module_id = config('enum.modules.outbound');
                               $activity->sub_module_id = config('enum.sub_module.order_export');
                               $activity->user_name = $this->user->name;
                               $activity->api_action_type = 'Order Export';
                            )
                            >withProperties(['request' => json_encode($url), 'response' => $result])
                            >log('Order Export Process | Lot sync Job | Api Call | Line Number: '.$id->pick_list_line.' | Item Code |'.$id->input_sku);
                            * -*/
                            var properties = new { request = request, response = result1 };
                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                @event = "sync",
                                user_name = user,
                                subject_ref = pickListId,
                                subject_id = id.picklist_id,
                                api_action_type = "Order Export",
                                description = $"Order Export Process | Lot sync Job | Api Call | Line Number: {id.pick_list_line} | Item Code | {id.input_sku}",

                                properties = JsonConvert.SerializeObject(properties),
                            });


                            _logger.LogInformation("Inventory Lot Detail api request: {LotsArray}", JsonConvert.SerializeObject(lots_array));
                            _logger.LogInformation("Inventory Lot Detail api request qty arr: {LotsQtyArray}", JsonConvert.SerializeObject(lots_qty_array));
                            _logger.LogInformation("Inventory Lot Detail api response: {Result}", JsonConvert.SerializeObject(result));



                            var api_lots_array = new List<string>();
                            if (result.resources.Count > 0)
                            {
                                foreach (var value in result.resources)
                                {
                                    if (lots_qty_array.ContainsKey(id.pick_list_line) &&
                                        lots_qty_array[id.pick_list_line].ContainsKey(value.LOT) &&
                                        lots_array.Contains(value.LOT))
                                    {
                                        if (Convert.ToInt32(lots_qty_array[id.pick_list_line][value.LOT]) <= value.AAACUMQTY)
                                        {
                                            found_count++;
                                        }
                                        else
                                        {
                                            qty_count++;
                                        }
                                    }
                                }
                                //Log::info('found count '.$found_count); //To be implemented
                                _logger.LogInformation("found count " + found_count);
                            }
                            else
                            {

                                _logger.LogInformation("Inventory Lot Detail api response: no lines");

                                await _IActivityLogRepository.ActivityLog(new ActivityLog
                                {
                                    log_name = "outbound",
                                    module_id = (int)EnumData.Module.outbound,
                                    sub_module_id = (int)EnumData.SubModule.orderExport,
                                    @event = "error",
                                    user_name = user,
                                    subject_ref = pickListId,
                                    subject_id = id.picklist_id,
                                    api_action_type = "Order Export",
                                    description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {id.pick_list_line} | Item Code | {id.input_sku}",
                                    properties = JsonConvert.SerializeObject(new
                                    {
                                        data = new { message = "No Line Items found in Response" }
                                    })
                                });

                            }
                            if (found_count >= lots_array.Count)
                            {
                                _logger.LogInformation("Inventory Lot Detail api response: count matched");

                                await _IActivityLogRepository.ActivityLog(new ActivityLog
                                {
                                    log_name = "outbound",
                                    module_id = (int)EnumData.Module.outbound,
                                    sub_module_id = (int)EnumData.SubModule.orderExport,
                                    @event = "success",
                                    user_name = user,
                                    subject_ref = pickListId,
                                    subject_id = id.picklist_id,
                                    api_action_type = "Order Export",
                                    description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {id.pick_list_line} | Item Code | {id.input_sku}",
                                    properties = JsonConvert.SerializeObject(new
                                    {
                                        data = new { message = "Lot counts matched" }
                                    })
                                });

                                var job = new JobModel
                                {
                                    queue = "orderexport",
                                    payload = JsonConvert.SerializeObject(new
                                    {
                                        user = user,
                                        picklist_id = id.picklist_id,
                                        pick_list_id = id.pick_list_id,
                                        line_id = id.id
                                    }),
                                    attempts = 0,
                                    reserved_at = null,
                                    available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                                    created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                                };

                                var job1 = new OrderExportPayload
                                {
                                    user = user,
                                    picklist_id = id.picklist_id,
                                    pick_list_id = id.pick_list_id,
                                    line_id = id.id
                                };

                                //await orderexport(job1);

                                await _deliveryRepository.InsertLoadOrdersJob(job);

                                //await _deliveryRepository.updatejobs(id.pick_list_id);
                            }
                            else
                            {
                                if (qty_count > 0)
                                {
                                    _logger.LogInformation("Inventory Lot Detail API response: qty is short");

                                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                                    {
                                        log_name = "outbound",
                                        module_id = (int)EnumData.Module.outbound,
                                        sub_module_id = (int)EnumData.SubModule.orderExport,
                                        @event = "error",
                                        user_name = user,
                                        subject_ref = pickListId,
                                        subject_id = id.picklist_id,
                                        api_action_type = "Order Export",
                                        description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {id.pick_list_line} | Item Code | {id.input_sku}",
                                        properties = JsonConvert.SerializeObject(new
                                        {
                                            data = new { message = "Lot Qty is short" }
                                        })
                                    });
                                }
                                else
                                {
                                    _logger.LogInformation("Inventory Lot Detail API response: count not matched");
                                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                                    {
                                        log_name = "outbound",
                                        module_id = (int)EnumData.Module.outbound,
                                        sub_module_id = (int)EnumData.SubModule.orderExport,
                                        @event = "error",
                                        user_name = user,
                                        subject_ref = pickListId,
                                        subject_id = id.picklist_id,
                                        api_action_type = "Order Export",
                                        description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {id.pick_list_line} | Item Code | {id.input_sku}",
                                        properties = JsonConvert.SerializeObject(new
                                        {
                                            data = new { message = "Lot counts not matched" }
                                        })
                                    });

                                }
                                await _deliveryRepository.UpdateExportStatus(id.id); // Update export status to 3
                            }

                        }
                        else
                        {
                            _logger.LogInformation("Inventory Lot Detail API response: no lot_detail string found");
                            //await _deliveryRepository.UpdateExportStatus(id.id); // Update export status to 3
                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                @event = "error",
                                user_name = user,
                                subject_ref = pickListId,
                                subject_id = id.picklist_id,
                                api_action_type = "Order Export",
                                description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {id.pick_list_line} | Item Code | {id.input_sku}",
                                properties = JsonConvert.SerializeObject(new
                                {
                                    data = new { message = "Lot Detail string is empty" }
                                })
                            });
                        }

                    }
                    return new ResponseResult { Error = 0, Message = "Data Synced Successfully." };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.orderExport,
                        @event = "error",
                        user_name = user,
                        subject_ref = pickListId,
                        subject_id = activityid.picklist_id,
                        api_action_type = "Order Export",
                        description = "Order Export Process | Lot sync Job",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new { message = "No Line Items found" }
                        })
                    });

                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "No Line Items found"
                    };
                }
            }

            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "error",
                    user_name = payload.user,
                    subject_ref = payload.pick_list_id,
                    api_action_type = "Order Export",
                    description = "Order Export Process | Lot sync Job",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Catch Block: " + ex.Message }
                    })
                });

                _logger.LogInformation("Inventory Lot Detail API catch block | {Message}", ex.Message);

                return new ResponseResult { Error = 1, Message = $"Job failed | {ex.Message}" };
            }
        }
        public async Task<ResponseResult> CheckPickListItemLotJobNew(CheckPickListItemJobPayload payload)
        {
            if (payload == null) return new ResponseResult { Error = 1, Message = "Payload is null." }; ;

            var pickListId = payload.pick_list_id;
            var user = payload.user;
            try
            {
                _logger.LogInformation("Starting CheckPickListItemLotJob_New for pick_list_id: " + pickListId);
                var orderDetails = await _deliveryRepository.GetOrderIdByPickListId(pickListId!);
                var activityid = orderDetails.Data.FirstOrDefault();
                if (orderDetails.Data.Count < 0)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.orderExport,
                        @event = "error",
                        user_name = user,
                        subject_ref = pickListId,
                        subject_id = activityid.picklist_id,
                        api_action_type = "Order Export",
                        description = "Order Export Process | Lot sync Job",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new { message = "No Line Items found" }
                        })
                    });

                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "No Line Items found"
                    };

                }
                _logger.LogInformation("OrderDetail " + pickListId);
                List<OrderLinesDto> detailsToProcess = new List<OrderLinesDto>();
                foreach (var detail in orderDetails.Data)
                {
                    var isExported = detail.is_exported;
                    //_logger.LogInformation($"This Job Export. Status: {(payload.failJobs ? 1 : 0)}");
                    _logger.LogInformation($"Processing Order ID {detail.id}: is_exported = {isExported}");
                    if (isExported != 1)
                    {
                        detailsToProcess.Add(detail);
                    }
                }
                if (!detailsToProcess.Any())
                {
                    _logger.LogInformation("no order line found for exported");

                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "No items to process"
                    };
                }
                var resourcesBySku = new Dictionary<string, List<YSTOLOTFCYResource>>();
                foreach (var detail in orderDetails.Data)
                {
                    var request = new StoreLotDetailsrequest
                    {
                        is_exported = detail.is_exported,
                        pick_list_id = detail.pick_list_id,
                        pick_list_line = detail.pick_list_line,
                        site = detail.site,
                        input_sku = detail.input_sku
                    };

                    var result = await fetchAndStoreStockLots(request);
                    if (result != null && result.resources != null)
                    {
                        resourcesBySku[detail.input_sku] = result.resources.ToList();
                    }
                    else
                    {
                        _logger.LogError("No Line Items found in Response", detail);
                        if (detail.is_exported != 1)
                        {
                            await _deliveryRepository.UpdateExportStatus(detail.id);
                        }
                    }
                }
                await _oedataAccess.SaveDataInline("sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode_optimized @OrderCode", new { OrderCode = pickListId });
                var properties = new
                {
                    response = new
                    {
                        response = $"sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode_optimized {pickListId}"
                    }
                };

                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "sync",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "sync",
                    user_name = user,
                    subject_ref = pickListId,
                    subject_id = activityid.picklist_id,
                    api_action_type = "Order Export",
                    description = $"Order Export Process | Lot sync Job | Stored Procedure Call | {pickListId}",
                    //properties = JsonConvert.SerializeObject(new { message = $"sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode {pickListId}" })
                    properties = JsonConvert.SerializeObject(new { response = $"sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode_optimized {pickListId}" }),
                });

                var orderDetails1 = await _deliveryRepository.GetOrderIdByPickListId(pickListId!);
                foreach (var detail in orderDetails1.Data)
                {
                    if (detail.lot_detail == "" || detail.lot_detail == null)
                    {
                        _logger.LogError("Lot Detail string is empty after procedure", detail);
                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.orderExport,
                            @event = "error",
                            user_name = payload.user,               // or user if using variable
                            subject_ref = payload.pick_list_id,     // or pickListId if using variable
                            api_action_type = "Order Export",
                            description = $"Order Export Process | Lot sync Job | Stored Procedure Call Response | Line Number: {detail.pick_list_line} | Item Code | {detail.item_reference}",
                            properties = JsonConvert.SerializeObject(new
                            {
                                data = new
                                {
                                    message = "Lot Detail string is empty after procedure",
                                    detail = JsonConvert.SerializeObject(detail)                // included from your original log
                                }
                            })
                        });

                        if (detail.is_exported != 1)
                        {
                            await _deliveryRepository.UpdateExportStatus(detail.id);
                        }
                        continue;
                    }
                    var lotNumbers = ExtractLotNumbers(detail.lot_detail);
                    var lotsQtyArray = ParseLotQtyForDetail(detail.lot_detail);
                    var resources = resourcesBySku.ContainsKey(detail.input_sku) ? resourcesBySku[detail.input_sku] : new List<YSTOLOTFCYResource>();
                    if (resources == null || !resources.Any())
                    {
                        _logger.LogError("No resources available for validation for pick_list_id: {PickListId}, line: {Line}", detail.pick_list_id, detail.pick_list_line);
                        if (detail.is_exported != 1)
                        {
                            await _deliveryRepository.UpdateExportStatus(detail.id);
                        }
                        continue;
                    }
                    ValidateAndDispatch(detail, lotNumbers, lotsQtyArray, resources, user);

                }
                return new ResponseResult
                {
                    Error = 0,
                    Message = "Just because error was coming of no return value will change in the end"
                };
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "error",
                    user_name = payload.user,
                    subject_ref = payload.pick_list_id,
                    api_action_type = "Order Export",
                    description = "Order Export Process | Lot sync Job",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Catch Block: " + ex.Message }
                    })
                });

                _logger.LogInformation("Inventory Lot Detail API catch block | {Message}", ex.Message);

                return new ResponseResult { Error = 1, Message = $"Job failed | {ex.Message}" };
            }
        }
        public async Task<ResponseResult> CheckPickListItemLotJobNewChanges(CheckPickListItemJobPayload payload)
        {
            if (payload == null) return new ResponseResult { Error = 1, Message = "Payload is null." };

            var pickListId = payload.pick_list_id;
            var user = payload.user;
            try
            {
                _logger.LogInformation("Starting CheckPickListItemLotJob_New for pick_list_id: " + pickListId);
                var orderDetails = await _deliveryRepository.GetOrderIdByPickListId(pickListId!);
                var activityid = orderDetails.Data.FirstOrDefault();
                if (orderDetails.Data.Count < 0)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.orderExport,
                        @event = "error",
                        user_name = user,
                        subject_ref = pickListId,
                        subject_id = activityid.picklist_id,
                        api_action_type = "Order Export",
                        description = "Order Export Process | Lot sync Job",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new { message = "No Line Items found" }
                        })
                    });


                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "No Line Items found"
                    };

                }
                _logger.LogInformation("OrderDetail " + pickListId);
                List<OrderLinesDto> detailsToProcess = new List<OrderLinesDto>();
                foreach (var detail in orderDetails.Data)
                {
                    var isExported = detail.is_exported;
                    //_logger.LogInformation($"This Job Export. Status: {(payload.failJobs ? 1 : 0)}");
                    _logger.LogInformation($"Processing Order ID {detail.id}: is_exported = {isExported}");
                    if (isExported != 1)
                    {
                        detailsToProcess.Add(detail);
                    }
                }
                if (!detailsToProcess.Any())
                {
                    _logger.LogInformation("no order line found for exported");
                    await SendOrderExportEmail(pickListId, payload.user, NotificationEvent.Order_Export_Dashboard.ToString());
                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "No items to process"
                    };
                }
                var resourcesBySku = new Dictionary<string, List<YSTOLOTFCYResource>>();
                foreach (var detail in orderDetails.Data)
                {
                    var request = new StoreLotDetailsrequest
                    {
                        is_exported = detail.is_exported,
                        pick_list_id = detail.pick_list_id,
                        pick_list_line = detail.pick_list_line,
                        site = detail.site,
                        input_sku = detail.input_sku,
                        picklist_id = detail.picklist_id,
                        user = user
                    };

                    var result = await fetchAndStoreStockLotsnew(request);
                    if (result != null && result.resources != null)
                    {
                        resourcesBySku[detail.input_sku] = result.resources.ToList();
                    }
                    else
                    {
                        _logger.LogError("No Line Items found in Response", detail);
                        if (detail.is_exported != 1)
                        {
                            await _deliveryRepository.UpdateExportStatus(detail.id);
                        }
                    }
                }
                await _oedataAccess.SaveDataInline("sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode @OrderCode", new { OrderCode = pickListId });
                var properties = new
                {
                    response = new
                    {
                        response = $"sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode_V2 {pickListId}"
                    }
                };

                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "sync",
                    user_name = user,
                    subject_ref = pickListId,
                    subject_id = activityid.picklist_id,
                    api_action_type = "Order Export",
                    description = $"Order Export Process | Lot sync Job | Stored Procedure Call | {pickListId}",
                    //properties = JsonConvert.SerializeObject(new { message = $"sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode {pickListId}" })
                    properties = JsonConvert.SerializeObject(new { response = $"sp_GetPackedStkattrInfo_MOI_WithLotDetail_ByOrderCode_V2 {pickListId}" }),
                });

                var orderDetails1 = await _deliveryRepository.GetOrderIdByPickListId(pickListId!);
                foreach (var detail in orderDetails1.Data)
                {
                    if (detail.lot_detail == "" || detail.lot_detail == null)
                    {
                        _logger.LogError("Lot Detail string is empty after procedure", detail);
                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.orderExport,
                            @event = "error",
                            user_name = payload.user,   
                            subject_id = activityid.picklist_id,
                            subject_ref = payload.pick_list_id,     // or pickListId if using variable
                            api_action_type = "Order Export",
                            description = $"Order Export Process | Lot sync Job | Stored Procedure Call Response | Line Number: {detail.pick_list_line} | Item Code | {detail.item_reference}",
                            properties = JsonConvert.SerializeObject(new
                            {
                                data = new
                                {
                                    message = "Lot Detail string is empty after procedure",
                                    detail = JsonConvert.SerializeObject(detail)                // included from your original log
                                }
                            })
                        });

                        if (detail.is_exported != 1)
                        {
                            await _deliveryRepository.UpdateExportStatus(detail.id);
                        }
                        continue;
                    }
                    var lotNumbers = ExtractLotNumbers(detail.lot_detail);
                    var lotsQtyArray = ParseLotQtyForDetail(detail.lot_detail);
                    var resources = resourcesBySku.ContainsKey(detail.input_sku) ? resourcesBySku[detail.input_sku] : new List<YSTOLOTFCYResource>();
                    if (resources == null || !resources.Any())
                    {
                        _logger.LogError("No resources available for validation for pick_list_id: {PickListId}, line: {Line}", detail.pick_list_id, detail.pick_list_line);
                        if (detail.is_exported != 1)
                        {
                            await _deliveryRepository.UpdateExportStatus(detail.id);
                        }
                        continue;
                    }
                    ValidateAndDispatchNEW(detail, lotNumbers, lotsQtyArray, resources, user);

                }
                return new ResponseResult
                {
                    Error = 0,
                    Message = "Just because error was coming of no return value will change in the end"
                };
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "error",
                    user_name = payload.user,
                    subject_ref = payload.pick_list_id,
                    api_action_type = "Order Export",
                    description = "Order Export Process | Lot sync Job",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Catch Block: " + ex.Message }
                    })
                });

                _logger.LogInformation("Inventory Lot Detail API catch block | {Message}", ex.Message);

                return new ResponseResult { Error = 1, Message = $"Job failed | {ex.Message}" };
            }
        }
        public void ValidateAndDispatch(OrderLinesDto detail, List<string> lotNumbers, Dictionary<string, Double> lotsQtyArray, List<YSTOLOTFCYResource> resources, string user)
        {
            _logger.LogInformation("Validating lots: {Lots}", lotNumbers);
            _logger.LogInformation("Lot quantities: {Qty}", lotsQtyArray);
            var totalAvailableByLot = new Dictionary<string, decimal>();

            foreach (var resource in resources)
            {
                var lotNumber = resource.LOT;   // resource["LOT"] equivalent

                if (!string.IsNullOrEmpty(lotNumber) && lotNumbers.Contains(lotNumber))
                {
                    decimal qty = resource.AAACUMQTY ?? 0;

                    if (totalAvailableByLot.ContainsKey(lotNumber))
                        totalAvailableByLot[lotNumber] += qty;
                    else
                        totalAvailableByLot[lotNumber] = qty;
                }
            }
            _logger.LogInformation("Total available AAACUMQTY by lot: " + totalAvailableByLot);
            int foundCount = 0;
            int qtyShortCount = 0;

            foreach (var kvp in lotsQtyArray)
            {
                var lotNumber = kvp.Key;
                var requiredQty = kvp.Value;

                // Skip if not present in requested lots
                if (!lotNumbers.Contains(lotNumber))
                    continue;

                totalAvailableByLot.TryGetValue(lotNumber, out var available);

                _logger.LogInformation(
                    "Checking lot {lot}: Required={required}, Available={available}",
                    lotNumber, requiredQty, available
                );

                if (requiredQty <= Convert.ToDouble(available))
                {
                    foundCount++;
                }
                else
                {
                    qtyShortCount++;
                }
            }
            if (foundCount >= lotNumbers.Count)
            {
                _logger.LogInformation("Lot counts matched for pick_list_id: {pickListId}", detail.pick_list_id);

                _logger.LogInformation("Inventory Lot Detail api response: count matched");

                _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "success",
                    user_name = user,
                    subject_ref = detail.pick_list_id,
                    subject_id = detail.picklist_id,
                    api_action_type = "Order Export",
                    description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {detail.pick_list_line} | Item Code | {detail.input_sku}",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Lot counts matched" }
                    })
                });

                if (detail.is_exported != 1)
                {
                    var job = new JobModel
                    {
                        queue = "orderexportnew",
                        payload = JsonConvert.SerializeObject(new
                        {
                            user = user,
                            picklist_id = detail.picklist_id,
                            pick_list_id = detail.pick_list_id,
                            line_id = detail.id
                        }),
                        attempts = 0,
                        reserved_at = null,
                        available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                        created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    };
                    var payloadObj = JsonConvert.DeserializeObject<OrderExportPayload>(job.payload);

                    //_deliveryRepository.InsertLoadOrdersJob(job);
                    orderexportNEW(payloadObj);
                    _logger.LogInformation(
                 "Dispatching OrderExportJob with variables: {payload}",
                 JsonConvert.SerializeObject(job)
                    );
                }
                //else
                //{
                //    var job = new JobModel
                //    {
                //        queue = "orderexportnew",
                //        payload = JsonConvert.SerializeObject(new
                //        {
                //            user = user,
                //            picklist_id = detail.picklist_id,
                //            pick_list_id = detail.pick_list_id,
                //            line_id = detail.id
                //        }),
                //        attempts = 1,
                //        reserved_at = null,
                //        available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                //        created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                //    };
                //    var payloadObj = JsonConvert.DeserializeObject<OrderExportPayload>(job.payload);

                //    _deliveryRepository.InsertLoadOrdersJob(job);
                //    //orderexportNEW(payloadObj);
                //    _logger.LogInformation("Dispatching OrderExportJob with variables: {payload}",JsonConvert.SerializeObject(job));
                //}

                //orderexportNEW(payloadObj);


            }
            else
            {
                // Determine error message
                string errorMessage = qtyShortCount > 0 ? "Lot Qty is short" : "Lot counts not matched";

                // Log the error
                _logger.LogInformation("Inventory Lot Detail API response: {ErrorMessage}", errorMessage);

                // Log activity (ActivityLog)
                _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "error",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "Lot Validation",
                    user_name = detail.input_sku,  // adjust based on context
                    subject_ref = detail.pick_list_id,
                    api_action_type = "Order Export | Lot sync Job",
                    description = "Lot validation failed",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = errorMessage }
                    })
                });

                // Update export status if not already exported
                if (detail.is_exported != 1)
                {
                    _deliveryRepository.UpdateExportStatus(detail.id);
                }

            }

        }
        
        public Dictionary<string, double> ParseLotQtyForDetail(string detail)
        {
            var lotsQtyDict = new Dictionary<string, double>();

            if (!string.IsNullOrWhiteSpace(detail))
            {
                var lotStrings = detail.Split(new[] { "\n;" }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var lotString in lotStrings)
                {
                    var lotData = lotString.Split(';');

                    string lotNumber = null;
                    double quantity = 0;

                    if (lotData.Length > 4 && double.TryParse(lotData[2], out quantity))
                    {
                        lotNumber = lotData[4];

                        if (lotsQtyDict.ContainsKey(lotNumber))
                        {
                            lotsQtyDict[lotNumber] += quantity;
                        }
                        else
                        {
                            lotsQtyDict[lotNumber] = quantity;
                        }
                    }
                }
            }

            return lotsQtyDict;
        }
        public List<string> ExtractLotNumbers(string lotDetail)
        {
            var lotNumbers = new List<string>();

            // Split by line separator
            var lotStrings = lotDetail.Split(new[] { "\n;" }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var lotString in lotStrings)
            {
                var lotData = lotString.Split(';');

                if (lotData.Length > 4 && !lotNumbers.Contains(lotData[4]))
                {
                    lotNumbers.Add(lotData[4]);
                }
            }

            return lotNumbers;
        }

        public async Task<YSTOLOTFCYResponse> fetchAndStoreStockLots(StoreLotDetailsrequest request)
        {
            var isExported_line = request.is_exported;
            var pick_list_line_id = request.pick_list_line;
            var pick_list_id = request.pick_list_id;
            YSTOLOTFCYResponse result = null;
            _logger.LogInformation($"The Order {pick_list_id} has Orderline {pick_list_line_id} is_exported {isExported_line}");
            if (isExported_line != 1)
            {
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

                //string request = $"YSTOPREH(\"{pickListId}\")?representation=YSTOPRE.$details";
                //string request = 'YSTOLOTFCY?representation=YSTOLOTFCY.$query&count=100&where=STOFCY eq '."'".''.$id->site.''."'".' and ITMREF eq '."'".''.$id->input_sku.''."'".'';
                string url = $"YSTOLOTFCY?representation=YSTOLOTFCY.$query&count=100&where=STOFCY eq '{request.site}' and ITMREF eq '{request.input_sku}'";

                var fullUrl = new Uri(client.BaseAddress, url);

                var urlResponse = await client.GetAsync(fullUrl);
                urlResponse.EnsureSuccessStatusCode();

                var response = await urlResponse.Content.ReadAsStringAsync();
                result = JsonConvert.DeserializeObject<YSTOLOTFCYResponse>(response);

                if (result.resources.Count > 0) 
                {
                    var rows = result.resources.Select(resource => new PickListRow
                    {
                        PickListId = pick_list_id,
                        Lot = resource.LOT,
                        SubLot = resource.SLO,
                        CumQtyAAA = resource.AAACUMQTY,
                        ItemRef = resource.ITMREF
                    }).ToList();

                    try
                    {
                        var table = new DataTable();
                        table.Columns.Add("PickListId", typeof(string));
                        table.Columns.Add("Lot", typeof(string));
                        table.Columns.Add("SubLot", typeof(string));
                        table.Columns.Add("CumQtyAAA", typeof(decimal));
                        table.Columns.Add("ItemRef", typeof(string));
                        foreach (var row in rows)
                        {
                            table.Rows.Add(
                                row.PickListId,
                                row.Lot,
                                row.SubLot,
                                row.CumQtyAAA,
                                row.ItemRef
                            );
                        }
                        var jsonPayload = JsonConvert.SerializeObject(rows);
                        await _oedataAccess.SaveDataInline(
                               "USP_Insert_PickListLotDetails @LotDetailsJSON",
                               new { LotDetailsJSON = jsonPayload }
                           );

                        _logger.LogInformation($"Insertion completed successfully for pick_list_id: {pick_list_id}. Total rows inserted: {table.Rows.Count}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError("Error saving lot details to database: {Message}", ex.Message);

                    }
                    _logger.LogInformation($"Inventory Lot Detail API response: {JsonConvert.SerializeObject(result)}");
                    var properties = new
                    {
                        request = System.Net.WebUtility.HtmlEncode(url),   // Encode URL if required
                        response = result                                   // raw response or encode if required
                    };

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "sync",    // as per your first snippet
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.orderExport,
                        @event = "sync",
                        subject_ref = pick_list_id,
                        api_action_type = "Order Export",
                        properties = JsonConvert.SerializeObject(properties),
                        description = $"Order Export Process | Lot sync Job | Api Call | Line Number: {request.pick_list_line} | Item Code |  { request.input_sku }" 
                    });

                }
                return result;
            }
            else if (isExported_line == 1)
            {
                _logger.LogInformation($"This Orderline Export is Completed {pick_list_id} has Orderline {pick_list_line_id}");

                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "success",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "success",
                    subject_ref = pick_list_id,
                    api_action_type = "Order Export",
                    description = $"Order Export Process | Line Number | {pick_list_line_id} | Item Code | {request.input_sku}",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Already Exported" }
                    })
                });
                return null;
            }
            return null;
        }
        public async Task<YSTOLOTFCYResponse> fetchAndStoreStockLotsnew(StoreLotDetailsrequest request)
        {
            var isExported_line = request.is_exported;
            var pick_list_line_id = request.pick_list_line;
            var pick_list_id = request.pick_list_id;
            var picklist_id = request.picklist_id;
            var user = request.user;
            YSTOLOTFCYResponse result = null;
            _logger.LogInformation($"The Order {pick_list_id} has Orderline {pick_list_line_id} is_exported {isExported_line}");
            if (isExported_line != 1)
            {
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

                //string request = $"YSTOPREH(\"{pickListId}\")?representation=YSTOPRE.$details";
                //string request = 'YSTOLOTFCY?representation=YSTOLOTFCY.$query&count=100&where=STOFCY eq '."'".''.$id->site.''."'".' and ITMREF eq '."'".''.$id->input_sku.''."'".'';
                string url = $"STOCK?representation=YKSTOCK.$query&count=100&where=STOFCY eq '{request.site}' and ITMREF eq '{request.input_sku}'";

                var fullUrl = new Uri(client.BaseAddress, url);

                var urlResponse = await client.GetAsync(fullUrl);
                urlResponse.EnsureSuccessStatusCode();

                var response = await urlResponse.Content.ReadAsStringAsync();
                result = JsonConvert.DeserializeObject<YSTOLOTFCYResponse>(response);

                if (result.resources.Count > 0)
                {
                    var rows = result.resources.Select(resource => new PickListRow
                    {
                        PickListId = pick_list_id,
                        Lot = resource.LOT,
                        SubLot = resource.SLO,
                        CumQtyAAA = resource.QTYSTU - resource.CUMALLQTY, //QTYSTU - CUMALLQTY
                        ItemRef = resource.ITMREF
                    }).ToList();

                    try
                    {
                        var table = new DataTable();
                        table.Columns.Add("PickListId", typeof(string));
                        table.Columns.Add("Lot", typeof(string));
                        table.Columns.Add("SubLot", typeof(string));
                        table.Columns.Add("CumQtyAAA", typeof(decimal));
                        table.Columns.Add("ItemRef", typeof(string));
                        foreach (var row in rows)
                        {
                            table.Rows.Add(
                                row.PickListId,
                                row.Lot,
                                row.SubLot,
                                row.CumQtyAAA,
                                row.ItemRef
                            );
                        }
                        var jsonPayload = JsonConvert.SerializeObject(rows);
                        await _oedataAccess.SaveDataInline(
                               "USP_Insert_PickListLotDetails @LotDetailsJSON",
                               new { LotDetailsJSON = jsonPayload }
                           );

                        _logger.LogInformation($"Insertion completed successfully for pick_list_id: {pick_list_id}. Total rows inserted: {table.Rows.Count}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError("Error saving lot details to database: {Message}", ex.Message);

                    }
                    _logger.LogInformation($"Inventory Lot Detail API response: {JsonConvert.SerializeObject(result)}");
                    var properties = new
                    {
                        request = System.Net.WebUtility.HtmlEncode(url),   // Encode URL if required
                        response = result                                   // raw response or encode if required
                    };

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",    // as per your first snippet
                        module_id =     (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.orderExport,
                        @event = "sync",
                        subject_id = picklist_id,
                        subject_ref = pick_list_id,
                        api_action_type = "Order Export",
                        user_name = user,
                        properties = JsonConvert.SerializeObject(properties),
                        description = $"Order Export Process | Lot sync Job | Api Call | Line Number: {request.pick_list_line} | Item Code |  {request.input_sku}"
                    });

                }
                return result;
            }
            else if (isExported_line == 1)
            {
                _logger.LogInformation($"This Orderline Export is Completed {pick_list_id} has Orderline {pick_list_line_id}");

                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "success",
                    subject_ref = pick_list_id,
                    subject_id = picklist_id,
                    api_action_type = "Order Export",
                    user_name = user,
                    description = $"Order Export Process | Line Number | {pick_list_line_id} | Item Code | {request.input_sku}",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Already Exported" }
                    })
                });
                return null;
            }
            return null;
        }
        public void ValidateAndDispatchNEW(OrderLinesDto detail, List<string> lotNumbers, Dictionary<string, Double> lotsQtyArray, List<YSTOLOTFCYResource> resources, string user)
        {
            _logger.LogInformation("Validating lots: {Lots}", lotNumbers);
            _logger.LogInformation("Lot quantities: {Qty}", lotsQtyArray);
            var totalAvailableByLot = new Dictionary<string, decimal>();

            foreach (var resource in resources)
            {
                var lotNumber = resource.LOT;   // resource["LOT"] equivalent

                if (!string.IsNullOrEmpty(lotNumber) && lotNumbers.Contains(lotNumber))
                {
                    decimal qty = resource.TOTALALLQTY ?? 0;

                    if (totalAvailableByLot.ContainsKey(lotNumber))
                        totalAvailableByLot[lotNumber] += qty;
                    else
                        totalAvailableByLot[lotNumber] = qty;
                }
            }
            _logger.LogInformation("Total available AAACUMQTY by lot: " + totalAvailableByLot);
            int foundCount = 0;
            int qtyShortCount = 0;

            foreach (var kvp in lotsQtyArray)
            {
                var lotNumber = kvp.Key;
                var requiredQty = kvp.Value;

                // Skip if not present in requested lots
                if (!lotNumbers.Contains(lotNumber))
                    continue;

                totalAvailableByLot.TryGetValue(lotNumber, out var available);

                _logger.LogInformation(
                    "Checking lot {lot}: Required={required}, Available={available}",
                    lotNumber, requiredQty, available
                );

                if (requiredQty <= Convert.ToDouble(available))
                {
                    foundCount++;
                }
                else
                {
                    qtyShortCount++;
                }
            }
            if (foundCount >= lotNumbers.Count)
            {
                _logger.LogInformation("Lot counts matched for pick_list_id: {pickListId}", detail.pick_list_id);

                _logger.LogInformation("Inventory Lot Detail api response: count matched");

                _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "success",
                    user_name = user,
                    subject_ref = detail.pick_list_id,
                    subject_id = detail.picklist_id,
                    api_action_type = "Order Export",
                    description = $"Order Export Process | Lot sync Job | Lot Validation | Line Number: {detail.pick_list_line} | Item Code | {detail.input_sku}",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = "Lot counts matched" }
                    })
                });

                if (detail.is_exported != 1)
                {
                    var job = new JobModel
                    {
                        queue = "orderexportnew",
                        payload = JsonConvert.SerializeObject(new
                        {
                            user = user,
                            picklist_id = detail.picklist_id,
                            pick_list_id = detail.pick_list_id,
                            line_id = detail.id
                        }),
                        attempts = 0,
                        reserved_at = null,
                        available_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                        created_at = (int?)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    };
                    var payloadObj = JsonConvert.DeserializeObject<OrderExportPayload>(job.payload);

                    //_deliveryRepository.InsertLoadOrdersJob(job);
                    orderexportNEW(payloadObj);
                    _logger.LogInformation(
                 "Dispatching OrderExportJob with variables: {payload}",
                 JsonConvert.SerializeObject(job)
                    );
                }


            }
            else
            {
                // Determine error message
                string errorMessage = qtyShortCount > 0 ? "Lot Qty is short" : "Lot counts not matched";

                // Log the error
                _logger.LogInformation("Inventory Lot Detail API response: {ErrorMessage}", errorMessage);

                // Log activity (ActivityLog)
                _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "error",
                    user_name = detail.input_sku,  // adjust based on context
                    subject_ref = detail.pick_list_id,
                    subject_id = detail.picklist_id,
                    api_action_type = "Order Export | Lot sync Job",
                    description = "Lot validation failed",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new { message = errorMessage }
                    })
                });

                // Update export status if not already exported
                if (detail.is_exported != 1)
                {
                    _deliveryRepository.UpdateExportStatus(detail.id);
                }

            }

        }
        public async Task<ResponseResult> orderexportNEW(OrderExportPayload payload)
        {
            try
            {
                _logger.LogInformation($"Order Export Jobs Trigger for: {payload.line_id}");
                var value = await _deliveryRepository.GetByLineIdAsync(payload.line_id);
                _logger.LogInformation("Order Export init query result: {Value}", JsonConvert.SerializeObject(value));
                if (value.Data.is_exported != 1)
                {
                    if (value != null)
                    {
                        var lot_detail_arr = new List<LotDetail>();
                        decimal lot_qty = 0;
                        var lotdetail = value.Data.lot_detail ?? string.Empty;
                        var lot_string_array = lotdetail.Split(new[] { "\\n;" }, StringSplitOptions.RemoveEmptyEntries);
                        if (lot_string_array.Length > 1)
                        {
                            foreach (var lot_value in lot_string_array)
                            {
                                var parts = lot_value.Split(';');

                                var lotDetail = new LotDetail
                                {
                                    IPCU = value.Data.input_uom,
                                    IQTYPCU = parts.Length > 2 ? parts[2] : "",
                                    IQTYSTU = parts.Length > 2 ? parts[2] : "",
                                    ILOC = parts.Length > 3 ? parts[3] : "",
                                    ILOT = parts.Length > 4 ? parts[4] : "",
                                    ISLO = parts.Length > 5 ? parts[5] : ""
                                };

                                lot_detail_arr.Add(lotDetail);

                                if (parts.Length > 2 && decimal.TryParse(parts[2], out decimal qty))
                                {
                                    lot_qty += qty;
                                }
                            }
                        }
                        else
                        {
                            string[] parts = Array.Empty<string>();
                            if (lot_string_array != null && lot_string_array.Length > 0 && !string.IsNullOrWhiteSpace(lot_string_array[0]))
                            {
                                parts = lot_string_array[0].Split(';');
                                // Proceed if parts.Length is valid
                            }

                            var lot_detail_item = new LotDetail
                            {
                                IPCU = value.Data.input_uom,
                                IQTYPCU = parts.Length > 2 ? parts[2] : "",
                                IQTYSTU = parts.Length > 2 ? parts[2] : "",
                                ILOC = parts.Length > 3 ? parts[3] : "",
                                ILOT = parts.Length > 4 ? parts[4] : "",
                                ISLO = parts.Length > 5 ? parts[5] : ""
                            };


                            lot_detail_arr.Add(lot_detail_item);

                            decimal lot_qtye = 0;
                            if (parts.Length > 2 && decimal.TryParse(parts[2], out var parsedQty))
                            {
                                lot_qty = parsedQty;
                            }
                        }
                        var exists = await _deliveryRepository.ExistsForItemReferenceAsync(value.Data.item_reference);
                        if (exists)
                        {
                            _logger.LogInformation("API call skipped because of serialized item in Order Export API: {PickListId} | Line Number | {PickListLine}", value.Data.pick_list_id, value.Data.pick_list_line);
                            await _deliveryRepository.UpdateExportStatus(value.Data.id);
                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                @event = "error",
                                user_name = payload.user,
                                subject_ref = value.Data.pick_list_id,
                                subject_id = value.Data.picklist_id,
                                api_action_type = "Order Export",
                                properties = JsonConvert.SerializeObject(new
                                {
                                    data = new { message = "Skipped because of Serialized item" }
                                }),
                                description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                            });
                        }
                        //else if (lot_qty < value.Data.qty)
                        //{
                        //    _logger.LogInformation("API call skipped because full qty cannot be fulfilled in Order Export API: {PickListId} | Line Number | {PickListLine}", value.Data.pick_list_id, value.Data.pick_list_line);
                        //    await _deliveryRepository.UpdateExportStatus(value.Data.id);
                        //    await _deliveryRepository.ActivityLog(new ActivityLog
                        //    {
                        //        log_name = "outbound",
                        //        module_id = (int)EnumData.Module.outbound,
                        //        sub_module_id = (int)EnumData.SubModule.orderExport,
                        //        @event = "error",
                        //        user_name = payload.user, // or payload.user if within a method
                        //        subject_ref = payload.pick_list_id, // or payload.pick_list_id
                        //        subject_id = value.Data.picklist_id,
                        //        api_action_type = "Order Export",
                        //        description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}",
                        //        properties = JsonConvert.SerializeObject(new
                        //        {
                        //            data = new { message = "Skipped because full qty cannot be fulfilled" }
                        //        })
                        //    });
                        //}
                        else
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
                            string? pickListId = value.Data.pick_list_id;
                            int pickListLine = value.Data.pick_list_line;
                            string itemReference = value.Data.item_reference;
                            string inputsku = value.Data.input_sku;
                            int lotCount = lot_detail_arr.Count;

                            string body = $@"
                             <soapenv:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
                                 xmlns:xsd='http://www.w3.org/2001/XMLSchema'
                                 xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'
                                 xmlns:wss='http://www.adonix.com/WSS'>
                                 <soapenv:Header/>
                                 <soapenv:Body>
                                     <wss:run soapenv:encodingStyle='http://schemas.xmlsoap.org/soap/encoding/'>
                                         <callContext xsi:type='wss:CAdxCallContext'>
                                             <codeLang xsi:type='xsd:string'>ENG</codeLang>
                                             <poolAlias xsi:type='xsd:string'>{poolAlias}</poolAlias>
                                             <poolId xsi:type='xsd:string'></poolId>
                                             <requestConfig xsi:type='xsd:string'><![CDATA[adxwss.tracae.on=on]]></requestConfig>
                                         </callContext>
                                         <publicName xsi:type='xsd:string'>CWSVXABP</publicName>
                                         <inputXml xsi:type='xsd:string'>
                                             <![CDATA[<PARAM>
                                                 <GRP ID='GRP1'>
                                                     <FLD NAME='ISRTNUM'>{sdhTyp}</FLD>
                                                     <FLD NAME='IPRHNUM'>{pickListId}</FLD>
                                                     <FLD NAME='IPRELIN'>{pickListLine}</FLD>
                                                     <FLD NAME='IITMREF'>{inputsku}</FLD>
                                                     <FLD NAME='ISHORTPICK'>0</FLD>
                                                     <FLD NAME='IDELIVERABLE'>0</FLD>
                                                 </GRP>
                                                 <TAB ID='GRP2' SIZE='{lotCount}'>
                            ";

                            int counter = 1;
                            StringBuilder tabLines = new StringBuilder();
                            foreach (var detail in lot_detail_arr)
                            {
                                tabLines.AppendLine($@"
                                       <LIN NUM='{counter++}'>
                                         <FLD NAME='IPCU'>{detail.IPCU}</FLD>
                                         <FLD NAME='IPCUSTUCOE'>1</FLD>
                                         <FLD NAME='IQTYPCU'>{detail.IQTYPCU}</FLD>
                                         <FLD NAME='IQTYSTU'>{detail.IQTYSTU}</FLD>
                                         <FLD NAME='ILOC'>{detail.ILOC}</FLD>
                                         <FLD NAME='ILOT'>{detail.ILOT}</FLD>
                                         <FLD NAME='ISLO'>{detail.ISLO}</FLD>
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

                            _logger.LogInformation(body);

                            var request = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                            {
                                Content = new StringContent(body, Encoding.UTF8, "text/plain") // or "text/xml" if expected by the service
                            };

                            // Correct SOAPAction casing
                            request.Headers.Add("SOAPAction", "run");

                            var response = await client.SendAsync(request);
                            response.EnsureSuccessStatusCode();
                            var xmlResult = await response.Content.ReadAsStringAsync();


                            _logger.LogInformation("Order Export API Response against {PickListId}: {Xml}", value.Data.pick_list_id, xmlResult);
                            var properties = new { request = System.Net.WebUtility.HtmlEncode(body), response = xmlResult };

                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                subject_ref = value.Data.pick_list_id.ToString(),
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                @event = "sync",
                                user_name = payload.user,
                                api_action_type = "Order Export",
                                subject_id = value.Data.picklist_id,
                                //properties = JsonConvert.SerializeObject(new
                                //{
                                //    data = new { message = $"{xmlResult}" }
                                //}),
                                properties = JsonConvert.SerializeObject(properties),
                                description = $"Order Export Process | Order Export Job | API Call | Line Number: {value.Data.pick_list_line} | Item Code: {value.Data.input_sku}"
                            });
                            if (!xmlResult.Contains($"<FLD NAME=\"IPRHNUM\" TYPE=\"Char\">{value.Data.pick_list_id}</FLD>"))
                            {
                                _logger.LogInformation($"Error in Order Export API: {value.Data.pick_list_id} | Line Number | {value.Data.pick_list_line}");
                                await _deliveryRepository.UpdateExportStatus(value.Data.id, 2);

                                await _IActivityLogRepository.ActivityLog(new ActivityLog
                                {
                                    log_name = "outbound",
                                    module_id = (int)EnumData.Module.outbound,
                                    sub_module_id = (int)EnumData.SubModule.orderExport,
                                    @event = "error",
                                    user_name = payload.user, // or payload.user
                                    subject_ref = payload.pick_list_id, // or value.pick_list_id
                                    api_action_type = "Order Export",
                                    subject_id = value.Data.picklist_id,
                                    properties = JsonConvert.SerializeObject(new
                                    {
                                        data = new { message = $"Error in response: {xmlResult}" }
                                    }),
                                    //properties = JsonConvert.SerializeObject(properties),
                                    description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                                });
                                //await SendOrderExportEmail(pickListId,payload.user,NotificationEvent.Order_Export_Dashboard.ToString());
                            }
                            else if (xmlResult.Contains($"<FLD NAME=\"IPRHNUM\" TYPE=\"Char\">{value.Data.pick_list_id}</FLD>"))
                            {
                                _logger.LogInformation("Success Order Export API: {PickListId} | Line Number | {LineNumber}", value.Data.pick_list_id, xmlResult);
                                await _deliveryRepository.UpdateExportStatus(value.Data.id, 1);

                                await _IActivityLogRepository.ActivityLog(new ActivityLog
                                {
                                    log_name = "outbound",
                                    module_id = (int)EnumData.Module.outbound,
                                    sub_module_id = (int)EnumData.SubModule.orderExport,
                                    subject_id = value.Data.picklist_id,
                                    @event = "success",
                                    user_name = payload.user, // replace with value if needed
                                    subject_ref = value.Data.pick_list_id,
                                    api_action_type = "Order Export",
                                    properties = JsonConvert.SerializeObject(new { data = new { message = "Exported successfully" } }),
                                    description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                                });

                                await SendOrderExportEmail(pickListId,payload.user,NotificationEvent.Order_Export_Dashboard.ToString());

                            }
                            else
                            {
                                _logger.LogInformation("Could not parse Order Export API: {PickListId} | Line Number | {LineNumber}", value.Data.pick_list_id, xmlResult);
                                await _deliveryRepository.UpdateExportStatus(value.Data.id, 2);

                                await _IActivityLogRepository.ActivityLog(new ActivityLog
                                {
                                    log_name = "outbound",
                                    module_id = (int)EnumData.Module.outbound,
                                    sub_module_id = (int)EnumData.SubModule.orderExport,
                                    @event = "success",
                                    user_name = payload.user, // replace with value if needed
                                    subject_ref = value.Data.pick_list_id,
                                    subject_id = value.Data.picklist_id,
                                    api_action_type = "Order Export",
                                    properties = JsonConvert.SerializeObject(new { data = new { message = "Exported successfully" } }),
                                    description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                                });

                                await SendOrderExportEmail(pickListId,payload.user,NotificationEvent.Order_Export_Dashboard.ToString());
                            }

                        }
                        var sql = "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId";
                        var totalCount = await _oedataAccess.GetDataInline<int, dynamic>(sql, new { PicklistId = payload.picklist_id });

                        var countExported1 = await _oedataAccess.GetDataInline<int, dynamic>(
                            "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported = 1",
                            new { PicklistId = payload.picklist_id }
                        );

                        var countExported1_4 = await _oedataAccess.GetDataInline<int, dynamic>(
                            "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported IN (1,4)",
                            new { PicklistId = payload.picklist_id }
                        );

                        var countExported2 = await _oedataAccess.GetDataInline<int, dynamic>(
                            "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported = 2",
                            new { PicklistId = payload.picklist_id }
                        );

                        var countExported2_4 = await _oedataAccess.GetDataInline<int, dynamic>(
                            "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported IN (2,4)",
                            new { PicklistId = payload.picklist_id }
                        );

                        var countExported3 = await _oedataAccess.GetDataInline<int, dynamic>(
                            "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported = 3",
                            new { PicklistId = payload.picklist_id }
                        );

                        var countExported3_4 = await _oedataAccess.GetDataInline<int, dynamic>(
                            "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported IN (3,4)",
                            new { PicklistId = payload.picklist_id }
                        );

                        // Decision logic
                        if (countExported1.Count() == totalCount.Count() || countExported1_4.Count() == totalCount.Count())
                        {
                            await _oedataAccess.SaveDataInline(
                                "UPDATE Cus_T_ImportedOrders SET is_exported = 2 WHERE id = @PicklistId",
                                new { PicklistId = payload.picklist_id }
                            );
                        }
                        else if (countExported2.Count() == totalCount.Count() || countExported2_4.Count() == totalCount.Count())
                        {
                            await _oedataAccess.SaveDataInline(
                                "UPDATE Cus_T_ImportedOrders SET is_exported = 3 WHERE id = @PicklistId",
                                new { PicklistId = payload.picklist_id }
                            );
                        }
                        else if (countExported3.Count() == totalCount.Count() || countExported3_4.Count() == totalCount.Count())
                        {
                            await _oedataAccess.SaveDataInline(
                                "UPDATE Cus_T_ImportedOrders SET is_exported = 4 WHERE id = @PicklistId",
                                new { PicklistId = payload.picklist_id }
                            );
                        }
                        else
                        {
                            await _oedataAccess.SaveDataInline("UPDATE Cus_T_ImportedOrders SET is_exported = 1 WHERE id = @PicklistId", new { PicklistId = payload.picklist_id });
                        }
                    }
                }
                else
                {
                    _logger.LogInformation("Order Export already completed for line_id: {LineId}", payload.line_id);
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "error",
                    user_name = payload.user, // assuming 'this.user' is a string; adjust if it's an object
                    subject_ref = payload.pick_list_id,
                    api_action_type = "Order Export",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new
                        {
                            message = $"Catch Block: {ex.Message}"
                        }
                    }),
                    description = "Order Export Process | Order Export Job"
                });


            }
            return new ResponseResult { Error = 1, Message = $"Job failed | " };
        }
        public async Task<ResponseResult> orderexport(OrderExportPayload payload)
        {
            try
            {
                _logger.LogInformation($"Order Export Jobs Trigger for: {payload.line_id}");
                var value = await _deliveryRepository.GetByLineIdAsync(payload.line_id);
                _logger.LogInformation("Order Export init query result: {Value}", JsonConvert.SerializeObject(value));

                if (value != null)
                {
                    var lot_detail_arr = new List<LotDetail>();
                    decimal lot_qty = 0;
                    var lotdetail = value.Data.lot_detail ?? string.Empty;
                    var lot_string_array = lotdetail.Split(new[] { "\\n;" }, StringSplitOptions.RemoveEmptyEntries);
                    if (lot_string_array.Length > 1)
                    {
                        foreach (var lot_value in lot_string_array)
                        {
                            var parts = lot_value.Split(';');

                            var lotDetail = new LotDetail
                            {
                                IPCU = value.Data.input_uom,
                                IQTYPCU = parts.Length > 2 ? parts[2] : "",
                                IQTYSTU = parts.Length > 2 ? parts[2] : "",
                                ILOC = parts.Length > 3 ? parts[3] : "",
                                ILOT = parts.Length > 4 ? parts[4] : "",
                                ISLO = parts.Length > 5 ? parts[5] : ""
                            };

                            lot_detail_arr.Add(lotDetail);

                            if (parts.Length > 2 && decimal.TryParse(parts[2], out decimal qty))
                            {
                                lot_qty += qty;
                            }
                        }
                    }
                    else
                    {
                        string[] parts = Array.Empty<string>();
                        if (lot_string_array != null && lot_string_array.Length > 0 && !string.IsNullOrWhiteSpace(lot_string_array[0]))
                        {
                            parts = lot_string_array[0].Split(';');
                            // Proceed if parts.Length is valid
                        }

                        var lot_detail_item = new LotDetail
                        {
                            IPCU = value.Data.input_uom,
                            IQTYPCU = parts.Length > 2 ? parts[2] : "",
                            IQTYSTU = parts.Length > 2 ? parts[2] : "",
                            ILOC = parts.Length > 3 ? parts[3] : "",
                            ILOT = parts.Length > 4 ? parts[4] : "",
                            ISLO = parts.Length > 5 ? parts[5] : ""
                        };


                        lot_detail_arr.Add(lot_detail_item);

                        decimal lot_qtye = 0;
                        if (parts.Length > 2 && decimal.TryParse(parts[2], out var parsedQty))
                        {
                            lot_qty = parsedQty;
                        }
                    }
                    var exists = await _deliveryRepository.ExistsForItemReferenceAsync(value.Data.item_reference);
                    if (exists)
                    {
                        _logger.LogInformation("API call skipped because of serialized item in Order Export API: {PickListId} | Line Number | {PickListLine}", value.Data.pick_list_id, value.Data.pick_list_line);
                        await _deliveryRepository.UpdateExportStatus(value.Data.id);
                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.orderExport,
                            @event = "error",
                            user_name = payload.user,
                            subject_ref = value.Data.pick_list_id,
                            subject_id = value.Data.picklist_id,
                            api_action_type = "Order Export",
                            properties = JsonConvert.SerializeObject(new
                            {
                                data = new { message = "Skipped because of Serialized item" }
                            }),
                            description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                        });
                    }
                    else if (lot_qty < value.Data.qty)
                    {
                        _logger.LogInformation("API call skipped because full qty cannot be fulfilled in Order Export API: {PickListId} | Line Number | {PickListLine}", value.Data.pick_list_id, value.Data.pick_list_line);
                        await _deliveryRepository.UpdateExportStatus(value.Data.id);
                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.orderExport,
                            @event = "error",
                            user_name = payload.user, // or payload.user if within a method
                            subject_ref = payload.pick_list_id, // or payload.pick_list_id
                            subject_id = value.Data.picklist_id,
                            api_action_type = "Order Export",
                            description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}",
                            properties = JsonConvert.SerializeObject(new
                            {
                                data = new { message = "Skipped because full qty cannot be fulfilled" }
                            })
                        });
                    }
                    else
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

                        //string poolAlias = ConfigDefaults.ProgressIDValue; ;
                        string pickListId = value.Data.pick_list_id;
                        int pickListLine = value.Data.pick_list_line;
                        string itemReference = value.Data.item_reference;
                        int lotCount = lot_detail_arr.Count;

                        string body = $@"
                             <soapenv:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
                                 xmlns:xsd='http://www.w3.org/2001/XMLSchema'
                                 xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'
                                 xmlns:wss='http://www.adonix.com/WSS'>
                                 <soapenv:Header/>
                                 <soapenv:Body>
                                     <wss:run soapenv:encodingStyle='http://schemas.xmlsoap.org/soap/encoding/'>
                                         <callContext xsi:type='wss:CAdxCallContext'>
                                             <codeLang xsi:type='xsd:string'>ENG</codeLang>
                                             <poolAlias xsi:type='xsd:string'>{poolAlias}</poolAlias>
                                             <poolId xsi:type='xsd:string'></poolId>
                                             <requestConfig xsi:type='xsd:string'><![CDATA[adxwss.tracae.on=on]]></requestConfig>
                                         </callContext>
                                         <publicName xsi:type='xsd:string'>CWSVXABP</publicName>
                                         <inputXml xsi:type='xsd:string'>
                                             <![CDATA[<PARAM>
                                                 <GRP ID='GRP1'>
                                                     <FLD NAME='ISRTNUM'>{sdhTyp}</FLD>
                                                     <FLD NAME='IPRHNUM'>{pickListId}</FLD>
                                                     <FLD NAME='IPRELIN'>{pickListLine}</FLD>
                                                     <FLD NAME='IITMREF'>{itemReference}</FLD>
                                                     <FLD NAME='ISHORTPICK'>0</FLD>
                                                     <FLD NAME='IDELIVERABLE'>0</FLD>
                                                 </GRP>
                                                 <TAB ID='GRP2' SIZE='{lotCount}'>
                        ";

                        int counter = 1;
                        StringBuilder tabLines = new StringBuilder();
                        foreach (var detail in lot_detail_arr)
                        {
                            tabLines.AppendLine($@"
                                       <LIN NUM='{counter++}'>
                                         <FLD NAME='IPCU'>{detail.IPCU}</FLD>
                                         <FLD NAME='IPCUSTUCOE'>1</FLD>
                                         <FLD NAME='IQTYPCU'>{detail.IQTYPCU}</FLD>
                                         <FLD NAME='IQTYSTU'>{detail.IQTYSTU}</FLD>
                                         <FLD NAME='ILOC'>{detail.ILOC}</FLD>
                                         <FLD NAME='ILOT'>{detail.ILOT}</FLD>
                                         <FLD NAME='ISLO'>{detail.ISLO}</FLD>
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

                        _logger.LogInformation(body);

                        var request = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                        {
                            Content = new StringContent(body, Encoding.UTF8, "text/plain") // or "text/xml" if expected by the service
                        };

                        // Correct SOAPAction casing
                        request.Headers.Add("SOAPAction", "run");

                        var response = await client.SendAsync(request);
                        response.EnsureSuccessStatusCode();
                        var xmlResult = await response.Content.ReadAsStringAsync();


                        _logger.LogInformation("Order Export API Response against {PickListId}: {Xml}", value.Data.pick_list_id, xmlResult);
                        var properties = new { request = System.Net.WebUtility.HtmlEncode(body), response = xmlResult };

                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "outbound",
                            subject_ref = value.Data.pick_list_id.ToString(),
                            module_id = (int)EnumData.Module.outbound,
                            sub_module_id = (int)EnumData.SubModule.orderExport,
                            @event = "sync",
                            user_name = payload.user,
                            api_action_type = "Order Export",
                            subject_id = value.Data.picklist_id,
                            //properties = JsonConvert.SerializeObject(new
                            //{
                            //    data = new { message = $"{xmlResult}" }
                            //}),
                            properties = JsonConvert.SerializeObject(properties),
                            description = $"Order Export Process | Order Export Job | API Call | Line Number: {value.Data.pick_list_line} | Item Code: {value.Data.input_sku}"
                        });
                        if (!xmlResult.Contains($"<FLD NAME=\"IPRHNUM\" TYPE=\"Char\">{value.Data.pick_list_id}</FLD>"))
                        {
                            _logger.LogInformation($"Error in Order Export API: {value.Data.pick_list_id} | Line Number | {value.Data.pick_list_line}");
                            await _deliveryRepository.UpdateExportStatus(value.Data.id, 2);

                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                @event = "error",
                                user_name = payload.user, // or payload.user
                                subject_ref = payload.pick_list_id, // or value.pick_list_id
                                api_action_type = "Order Export",
                                subject_id = value.Data.picklist_id,
                                properties = JsonConvert.SerializeObject(new
                                {
                                    data = new { message = $"Error in response: {xmlResult}" }
                                }),
                                //properties = JsonConvert.SerializeObject(properties),
                                description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                            });

                        }
                        else if (xmlResult.Contains($"<FLD NAME=\"IPRHNUM\" TYPE=\"Char\">{value.Data.pick_list_id}</FLD>"))
                        {
                            _logger.LogInformation("Success Order Export API: {PickListId} | Line Number | {LineNumber}", value.Data.pick_list_id, xmlResult);
                            await _deliveryRepository.UpdateExportStatus(value.Data.id, 1);

                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                subject_id = value.Data.picklist_id,
                                @event = "success",
                                user_name = payload.user, // replace with value if needed
                                subject_ref = value.Data.pick_list_id,
                                api_action_type = "Order Export",
                                properties = JsonConvert.SerializeObject(new { data = new { message = "Exported successfully" } }),
                                description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                            });

                        }
                        else
                        {
                            _logger.LogInformation("Could not parse Order Export API: {PickListId} | Line Number | {LineNumber}", value.Data.pick_list_id, xmlResult);
                            await _deliveryRepository.UpdateExportStatus(value.Data.id, 2);

                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "outbound",
                                module_id = (int)EnumData.Module.outbound,
                                sub_module_id = (int)EnumData.SubModule.orderExport,
                                @event = "success",
                                user_name = payload.user, // replace with value if needed
                                subject_ref = value.Data.pick_list_id,
                                subject_id = value.Data.picklist_id,
                                api_action_type = "Order Export",
                                properties = JsonConvert.SerializeObject(new { data = new { message = "Exported successfully" } }),
                                description = $"Order Export Process | Order Export Job | Line Number | {value.Data.pick_list_line} | Item Code | {value.Data.input_sku}"
                            });

                        }

                    }
                    var sql = "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId";
                    var totalCount = await _oedataAccess.GetDataInline<int, dynamic>(sql, new { PicklistId = payload.picklist_id });

                    var countExported1 = await _oedataAccess.GetDataInline<int, dynamic>(
                        "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported = 1",
                        new { PicklistId = payload.picklist_id }
                    );

                    var countExported1_4 = await _oedataAccess.GetDataInline<int, dynamic>(
                        "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported IN (1,4)",
                        new { PicklistId = payload.picklist_id }
                    );

                    var countExported2 = await _oedataAccess.GetDataInline<int, dynamic>(
                        "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported = 2",
                        new { PicklistId = payload.picklist_id }
                    );

                    var countExported2_4 = await _oedataAccess.GetDataInline<int, dynamic>(
                        "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported IN (2,4)",
                        new { PicklistId = payload.picklist_id }
                    );

                    var countExported3 = await _oedataAccess.GetDataInline<int, dynamic>(
                        "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported = 3",
                        new { PicklistId = payload.picklist_id }
                    );

                    var countExported3_4 = await _oedataAccess.GetDataInline<int, dynamic>(
                        "SELECT COUNT(*) FROM Cus_T_ImportedOrdersDetails WHERE picklist_id = @PicklistId AND is_exported IN (3,4)",
                        new { PicklistId = payload.picklist_id }
                    );

                    // Decision logic
                    if (countExported1.Count() == totalCount.Count() || countExported1_4.Count() == totalCount.Count())
                    {
                        await _oedataAccess.SaveDataInline(
                            "UPDATE Cus_T_ImportedOrders SET is_exported = 2 WHERE id = @PicklistId",
                            new { PicklistId = payload.picklist_id }
                        );
                    }
                    else if (countExported2.Count() == totalCount.Count() || countExported2_4.Count() == totalCount.Count())
                    {
                        await _oedataAccess.SaveDataInline(
                            "UPDATE Cus_T_ImportedOrders SET is_exported = 3 WHERE id = @PicklistId",
                            new { PicklistId = payload.picklist_id }
                        );
                    }
                    else if (countExported3.Count() == totalCount.Count() || countExported3_4.Count() == totalCount.Count())
                    {
                        await _oedataAccess.SaveDataInline(
                            "UPDATE Cus_T_ImportedOrders SET is_exported = 4 WHERE id = @PicklistId",
                            new { PicklistId = payload.picklist_id }
                        );
                    }
                    else
                    {
                        await _oedataAccess.SaveDataInline("UPDATE Cus_T_ImportedOrders SET is_exported = 1 WHERE id = @PicklistId", new { PicklistId = payload.picklist_id });
                    }
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.orderExport,
                    @event = "error",
                    user_name = payload.user, // assuming 'this.user' is a string; adjust if it's an object
                    subject_ref = payload.pick_list_id,
                    api_action_type = "Order Export",
                    properties = JsonConvert.SerializeObject(new
                    {
                        data = new
                        {
                            message = $"Catch Block: {ex.Message}"
                        }
                    }),
                    description = "Order Export Process | Order Export Job"
                });


            }
            return new ResponseResult { Error = 1, Message = $"Job failed | " };
        }

        public async Task SendOrderExportEmail(
             string pickListId,
             string userName,
             string eventName,
             string? errorMessage = null)
        {
            try
            {
                // Allowed domains
                var allowedDomains = _configuration
                    .GetSection("EmailSettings:AllowedDomains")
                    .Get<List<string>>()?
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim().ToLower())
                    .Distinct()
                    .ToHashSet() ?? new HashSet<string>();

                var senderEmail = _configuration["EmailSettings:SenderEmail"];

                if (!IsValidEmail(senderEmail) || !IsAllowedDomain(senderEmail, allowedDomains))
                {
                    throw new Exception("Sender email is invalid or domain is not allowed.");
                }

                // Data fetch
                var userData = await _deliveryRepository.GetUserDetails(userName);
                var orderdetail = await _importedOrdersRepository.GetImportedOrderByIdAsync(pickListId);
                var data = orderdetail.FirstOrDefault();

                var creatorEmail = data?.creator_email;

                var manualEmail = await _importedOrdersRepository
                    .GetManualEmail("Order Export Dashboard Notifications");

                var emailConfig = manualEmail?.FirstOrDefault();

                var template = await _importedOrdersRepository
                    .GetDefaultTemplateByEvent(eventName.ToUpper());

                if (template == null || template.IsEnabled == false)
                    return;

                // Time
                var estTime = TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time")
                );

                // Template data
                var templateData = new
                {
                    PicklistID = pickListId,
                    ModifiedBy = userName ?? "System",
                    Date = estTime.ToString("dd/MM/yyyy hh:mm tt"),
                    Warehouse = "NYMT"
                };

                string finalBody = BuildEmailBody(template.Body, templateData);
                string finalSubject = BuildEmailBody(template.Subject, templateData);

                // Emails
                var primaryEmailRaw = !string.IsNullOrWhiteSpace(creatorEmail) ? creatorEmail :
                    !string.IsNullOrWhiteSpace(emailConfig?.nst_Primary_Emails) ? emailConfig.nst_Primary_Emails :
                    emailConfig?.default_Emails;

                var secondaryEmailsRaw = emailConfig?.nst_Secondary_Emails;

                var primaryEmails = ParseEmails(primaryEmailRaw);
                var secondaryEmails = ParseEmails(secondaryEmailsRaw);

                var validPrimaryEmails = primaryEmails
                    .Where(e => IsValidEmail(e) && IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var invalidPrimaryEmails = primaryEmails
                    .Where(e => !IsValidEmail(e) || !IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var validSecondaryEmails = secondaryEmails
                    .Where(e => IsValidEmail(e) && IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Where(e => !validPrimaryEmails.Contains(e, StringComparer.OrdinalIgnoreCase))
                    .ToList();

                var invalidSecondaryEmails = secondaryEmails
                    .Where(e => !IsValidEmail(e) || !IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var allValidRecipients = validPrimaryEmails
                    .Concat(validSecondaryEmails)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var allInvalidRecipients = invalidPrimaryEmails
                    .Concat(invalidSecondaryEmails)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                // No valid emails
                if (!allValidRecipients.Any())
                {
                    await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                    {
                        NotificationSettingID = emailConfig?.nst_ID ?? 0,
                        TriggerID = template.TriggerID,
                        UserID = userData.id,
                        NotificationType = emailConfig?.nst_ModuleName,
                        OpertionType = eventName.ToUpper(),
                        Status = "ERROR",
                        CreatedBy = userData.Email,
                        Subject = finalSubject,
                        Body = finalBody,
                        PrimaryEmail = null,
                        SecondaryEmail = null,
                        ErrorMessage = $"No valid recipient email found. Invalid/Skipped: {string.Join(", ", allInvalidRecipients)}"
                    });

                    throw new Exception($"No valid recipient email found.");
                }

                // SendGrid
                var sendGrid = new SendGridClient(_configuration["SendGrid:ApiKey"]);

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

                // Capture MessageId
                var messageId = Guid.NewGuid().ToString();

                msg.CustomArgs = new Dictionary<string, string>
                {
                    { "MessageId", messageId },
                    { "PickListId", pickListId },
                    { "ProjectName", "MW" }
                };

                var response = await sendGrid.SendEmailAsync(msg);

                var finalStatus = allInvalidRecipients.Any() ? "PARTIAL" : "SENT";
                var skippedMsg = allInvalidRecipients.Any() ? $"Skipped invalid emails: {string.Join(", ", allInvalidRecipients)}" : null;

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Body.ReadAsStringAsync();

                    await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                    {
                        NotificationSettingID = emailConfig?.nst_ID ?? 0,
                        TriggerID = template.TriggerID,
                        UserID = userData.id,
                        NotificationType = emailConfig?.nst_ModuleName,
                        OpertionType = eventName.ToUpper(),
                        Status = "ERROR",
                        CreatedBy = userData.Email,
                        Subject = finalSubject,
                        Body = finalBody,
                        PrimaryEmail = string.Join(", ", validPrimaryEmails),
                        SecondaryEmail = string.Join(", ", validSecondaryEmails),
                        ErrorMessage = string.IsNullOrWhiteSpace(skippedMsg)? error : $"{error} | {skippedMsg}",
                        MessageId = messageId
                    });

                    throw new Exception($"Email sending failed: {error}");
                }

                // Success / Partial log
                await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                {
                    NotificationSettingID = emailConfig?.nst_ID ?? 0,
                    TriggerID = template.TriggerID,
                    UserID = userData.id,
                    NotificationType = emailConfig?.nst_ModuleName,
                    OpertionType = eventName.ToUpper(),
                    Status = finalStatus,
                    CreatedBy = userData.Email,
                    Subject = finalSubject,
                    Body = finalBody,
                    PrimaryEmail = string.Join(", ", validPrimaryEmails),
                    SecondaryEmail = string.Join(", ", validSecondaryEmails),
                    ErrorMessage = skippedMsg,
                    MessageId = messageId
                });
            }
            catch
            {
                throw; // keep stack trace
            }
        }
        private static List<string> ParseEmails(string? emails)
        {
            if (string.IsNullOrWhiteSpace(emails))
                return new List<string>();

            return emails.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();
        }

        private static bool IsAllowedDomain(string? email, HashSet<string> allowedDomains)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var parts = email.Split('@');
            if (parts.Length != 2) return false;

            return allowedDomains.Contains(parts[1].Trim().ToLower());
        }

        private static bool IsValidEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

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
