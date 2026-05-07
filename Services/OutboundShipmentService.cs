using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Common.Enum;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Services.Services
{
    public class OutboundShipmentService : IOutboundShipmentService
    {
        private readonly IOutboundShipmentRepository _outboundShipmentRepository;
        private readonly IConfiguration _configuration;
        private readonly IActivityLogRepository _IActivityLogRepository;
        public OutboundShipmentService(IOutboundShipmentRepository outboundShipmentRepository, IConfiguration configuration, IActivityLogRepository iActivityLogRepository)
        {
            _outboundShipmentRepository = outboundShipmentRepository;
            _configuration = configuration;
            _IActivityLogRepository = iActivityLogRepository;
        }
        public async Task<OutboundShipmentsResponse> GetOutboundShipments(GridRequest request)
        {
            return await _outboundShipmentRepository.GetOutboundShipments(request);
        }
        public async Task<IEnumerable<Truckddlresponse>> getAllTrucks()
        {
            return await _outboundShipmentRepository.getAllTrucks();
        }
        public async Task<IEnumerable<TrucksResponse>> GetTruckById(int id)
        {
            return await _outboundShipmentRepository.GetTruckById(id);
        }
        public async Task<TrucklocationResponse> GetAlllocation()
        {
            //return await _outboundShipmentRepository.GetAlllocation();
            
            // Latest Code Changes this api 
            try
            {
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

                // API Key header
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);

                // Accept JSON
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/json")
                );

                var requestUrl = "/api/Locations/GetShipmentLocations";

                var httpResponse = await client.GetAsync(requestUrl);

                var responseString = await httpResponse.Content.ReadAsStringAsync();

                // Deserialize to strong type
                var result = JsonConvert.DeserializeObject<MantisApiResponse>(responseString);

                if (result == null)
                {
                    return new TrucklocationResponse
                    {
                        Error = 1,
                        Message = "Invalid response received from location API."
                    };
                }

                if (result.IsSuccess)
                {
                    return new TrucklocationResponse
                    {
                        Error = 0,
                        Data = result.Data,
                        Message = result.Message
                    };
                }
                else
                {
                    return new TrucklocationResponse
                    {
                        Error = 1,
                        Message = result.Message
                    };
                }
            }
            catch (Exception ex)
            {
                return new TrucklocationResponse
                {
                    Error = 1,
                    Message = "Error while processing Trucks Location: " + ex.Message
                };
            }


        }
        public async Task<OutboundShipmentDetailResponse> GetShipmentDetailById(GridRequest request, int id)
        {
            return await _outboundShipmentRepository.GetShipmentDetailById(request, id);
        }

        public async Task<ShipmentDetailTruckResponse> GetShipmentDetailTruck(GridRequest request, int id)
        {
            return await _outboundShipmentRepository.GetShipmentDetailTruck(request, id);
        }

        public async Task<IEnumerable<OutboundShipmentHeader>> GetShipmentHeaderById(int id)
        {
            return await _outboundShipmentRepository.GetShipmentHeaderById(id);
        }

        public async Task<object> DeleteOutboundShipment(int? shipmentId)
         {
            try
            {
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

                string request = $"/api/Order/DeleteShipment?shipmentID={shipmentId}";
                var fullUrl = new Uri(client.BaseAddress, request);

                var urlResponse = await client.DeleteAsync(fullUrl);
                urlResponse.EnsureSuccessStatusCode();

                var response = await urlResponse.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(response);

                if (result == null || string.IsNullOrWhiteSpace(result.ToString()))
                {
                    return new { error = 1, message = "An error occurred while deleting record." };
                }

                if (result != null && result.IsSuccess == true)
                {
                    return new { error = 0, message = result.Message };
                }
                else
                {
                    return new { error = 1, message = result?.Message ?? "Unknown error occurred." };
                }

            }
            catch (Exception ex)
            {
                return new
                {
                    error = 1,
                    message = "Error while processing shipment deletion: " + ex.Message
                };

            }

        }

        public async Task<bool> OutboundAssignLanes(OutboundAssignLanesRequest request)
        {
            var lanes = await _outboundShipmentRepository.GetAvailableLanes(request.Lanes);
            int counter = 0;

            foreach (var shipment in request.Order)
            {
                var dataShipment = await _outboundShipmentRepository.GetShipmentCodes(shipment.shp_ID);

                foreach (var value in dataShipment)
                {
                    bool isWrapped = await _outboundShipmentRepository.IsWrappedLpn(value);
                    if (!isWrapped)
                    {
                        var pallets = await _outboundShipmentRepository.GetOrderPallets(value);

                        var laneList = lanes.ToList();

                        foreach (var pallet in pallets)
                        {
                            await _outboundShipmentRepository.CreateOrderLaneAssignment(new OrderLaneAssignmentModel
                            {
                                Lane = laneList[counter].Lane,
                                Slot = laneList[counter].Slot,
                                OrderCode = pallet.OrderCode,
                                ShipTo = pallet.AssignedShipLoc,
                                Lpn = pallet.Lpn
                            });

                            await _outboundShipmentRepository.UpdateLaneAvailability(laneList[counter].Lane, laneList[counter].Slot);
                            await _outboundShipmentRepository.MarkOrderAsAssigned(pallet.OrderCode);

                            counter++;
                        }
                    }
                }
            }
            return true;
        }

        public async Task<(bool isSuccess, string message)> ReleaseLocations(List<int> shipmentIds)
        {
            try
            {
                var orderCodes = await _outboundShipmentRepository.GetDistinctOrderCodesByShipmentIds(shipmentIds);

                if (orderCodes.Any())
                {
                    await _outboundShipmentRepository.DeleteOrderShipLocations(orderCodes); 
                }

                return (true, "Locations have been successfully released.");
            }
            catch (Exception ex)
            {
                return (false, $"Internal Server Error | {ex.Message}");
            }
        }

        public async Task<OrderShipmentsResponse> GetOrderShipments(GridRequest request)
        {
            return await _outboundShipmentRepository.GetOrderShipments(request);
        }

        public async Task<CreateShipmentResponse> CreateShipments(CreateShipmentResquest request)
        {
            if (request.selectedOrderShipment == null || !request.selectedOrderShipment.Any())
            {
                return new CreateShipmentResponse { Error = 1, Message = "Please select at least one order from the order grid." };
            }

            try
            {
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                // 2. Setup HttpClient with certificate bypass (use only in dev/test)
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                // 3. Set headers
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                // 4. Create payload
                var payload = new
                {
                    ShipmentCode = request.code,
                    TruckID = request.truck ?? null,
                    LocationCode = string.IsNullOrWhiteSpace(request.location_id) ? null : request.location_id,
                    ShipDate = request.ship_date,
                    ArrOrderShipments = request.selectedOrderShipment
                };

                string requestUrl = "api/Order/CreateShipment";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                // 5. Serialize payload
                var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

                // 6. Call API
                var response = await client.PostAsync(fullUrl, content);

                // 7. Ensure successful status code (optional but good practice)
                response.EnsureSuccessStatusCode();

                // 8. Read and deserialize result
                var responseBody = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                if (result == null)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { error = result }),
                        api_action_type = "Shipment creation",
                        created_at = DateTime.UtcNow,
                        description = "Shipment creation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = "An error occurred while creating the record." };
                }

                if (result.IsSuccess == true)
                {
                    var ship_Id = await _outboundShipmentRepository.GetLatestShipmentId(request.code);
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "created",
                        subject_id = Convert.ToInt32(ship_Id),
                        properties = JsonConvert.SerializeObject(new { data = request }),
                        api_action_type = "Shipment creation",
                        created_at = DateTime.UtcNow,
                        description = "Shipment creation | " + string.Join(",", request.selectedOrderShipment.Select(JsonConvert.SerializeObject))
                    });
                    return new CreateShipmentResponse { Error = 0, Message = "Shipment created successfully" };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { data = new { error = result.Message } }),
                        api_action_type = "Shipment creation",
                        created_at = DateTime.UtcNow,
                        description = "Shipment creation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = result.Message };
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.shipment,
                    @event = "error",
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    api_action_type = "Shipment creation",
                    created_at = DateTime.UtcNow,
                    description = "Shipment creation | Exception"
                });
                return new CreateShipmentResponse { Error = 1, Message = ex.Message };
            }
        }

        public async Task<CreateShipmentResponse> UpdateShipments(CreateShipmentResquest request)
        {
            if (request.selectedOrderShipment == null || !request.selectedOrderShipment.Any())
            {
                return new CreateShipmentResponse { Error = 1, Message = "Please select at least one order from the order grid." };
            }

            try
            {
                var body = new
                {
                    ShipmentCode = request.shp_Code,
                    TruckID = request.truck ?? null,
                    LocationCode = string.IsNullOrWhiteSpace(request.location_id) ? null : request.location_id,
                    ShipDate = request.ship_date ?? null,
                    DispatchMethodID = 2,
                    ArrOrderShipments = request.selectedOrderShipment,
                };

                var endpoint = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var url = "api/Order/UpdateShipment";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(endpoint);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                var fullUrl = new Uri(client.BaseAddress, url);

                var content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");
                var response = await client.PutAsync(fullUrl, content);
                var jsonResponse = await response.Content.ReadAsStringAsync();

                var result = JsonConvert.DeserializeObject<dynamic>(jsonResponse);

                if (result == null)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { error = result }),
                        api_action_type = "Shipment updation",
                        description = "Shipment updation | Error",
                        updated_at = DateTime.UtcNow,
                    });
                    return new CreateShipmentResponse { Error = 1, Message = "An error occurred while updating the record." };
                }

                if (result.IsSuccess == true)
                {
                    // Log activity here if needed
                    var truck_Id = await _outboundShipmentRepository.GetLatestShipmentId(request.truck);
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "update",
                        subject_id = truck_Id,
                        properties = JsonConvert.SerializeObject(new { data = request }),
                        api_action_type = "Shipment updation",
                        updated_at = DateTime.UtcNow,
                        description = "Shipment updation | " + string.Join(",", request.selectedOrderShipment.Select(JsonConvert.SerializeObject))
                    });
                    return new CreateShipmentResponse { Error = 0, Message = "Shipment updated successfully" };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { data = new { error = result.Message } }),
                        api_action_type = "Shipment updation",
                        updated_at = DateTime.UtcNow,
                        description = "Shipment updation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = result.Message.ToString() };
                }
            }
            catch (Exception ex)
            {
                // Log exception here
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.shipment,
                    @event = "error",
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    api_action_type = "Shipment updation",
                    updated_at = DateTime.UtcNow,
                    description = "Shipment updation | Exception"
                });
                return new CreateShipmentResponse { Error = 1, Message = ex.Message };
            }
        }

        public async Task<EditResponse> GetShipmentById(int id)
        {
            try
            {
                var shipment = await _outboundShipmentRepository.GetShipmentById(id);

                if (shipment != null && shipment.Any())
                {
                    return new EditResponse { Error = 0, Data = shipment };
                }

                return new EditResponse { Error = 1, Message = "Unable to fetch data." };
            }
            catch (Exception ex)
            {
                return new EditResponse { Error = 1, Message = "Error while fetching shipment: " + ex.Message };
            }
        }

        public async Task<IEnumerable<OutboundShipmentTruck>> EditOrderShipmentTruck(int id)
        {
            return await _outboundShipmentRepository.EditOrderShipmentTruck(id);
        }

        public async Task<ResponseResult> MarkShipmentComplete(MarkShipmentCompleteRequest request)
        {
            try
            {
                int updatedCount = await _outboundShipmentRepository.MarkShipmentStatusComplete(request.Shp_ID);

                if (updatedCount > 0)
                {
                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "Shipment status updated successfully."
                    };
                }

                return new ResponseResult
                {
                    Error = 1,
                    Message = "Failed to update shipment status."
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

        public async Task<ResponseResult> AddTruckAndDock(AddTruckAndDockRequest request)
        {
            try
            {
                var shipmentCodes = request?.Order?.Select(o => o.Shp_Code).ToList();

                var payload = new
                {
                    LocationCode = request?.Dock,
                    TruckID = request?.Truck,
                    ShipmentCodes = shipmentCodes
                };

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

                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                string requestUrl = "api/Order/UpdateAllShipment";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

                var response = await client.PutAsync(fullUrl, content);

                response.EnsureSuccessStatusCode();

                var responseBody = await response.Content.ReadAsStringAsync();

                if (string.IsNullOrWhiteSpace(responseBody))
                {
                    return new ResponseResult { Error = 1, Message = "An error occurred while editing record." };
                }

                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                if (result?.IsSuccess == true)
                {
                    return new ResponseResult { Error = 0, Message = result.Message };
                }

                return new ResponseResult { Error = 1, Message = result?.Message ?? "Unknown error." };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Error while processing shipment editing: " + ex.Message
                };
            }
        }

        public async Task<ResponseResult> DeleteOrderShipment(DeleteOrderShipmentRequest request)
        {
            var responseModel = new ResponseResult();

            try
            {
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

                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                // Send as query string instead of in body
                string requestUrl = $"api/Order/RemoveShipmentFromOrderShipment?orderShipmentCode={request.Id}";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                var response = await client.DeleteAsync(fullUrl);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    responseModel.Error = 1;
                    responseModel.Message = $"Error from API: {response.ReasonPhrase}";
                    return responseModel;
                }

                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                if (result == null)
                {
                    responseModel.Error = 1;
                    responseModel.Message = "An error occurred while deleting record.";
                }
                else if (result.IsSuccess == true)
                {
                    responseModel.Error = 0;
                    responseModel.Message = result.Message;
                }
                else
                {
                    responseModel.Error = 1;
                    responseModel.Message = result.Message;
                }

                return responseModel;
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Error while processing shipment deletion: " + ex.Message
                };
            }
        }

        public async Task<CreateShipmentResponse> CreateMultipleShipments(MultipleShipmentResquest request)
        {
            if (request.selectedOrderShipment == null || !request.selectedOrderShipment.Any())
            {
                return new CreateShipmentResponse { Error = 1, Message = "Please select at least one order from the order grid." };
            }

            try
            {
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                // 2. Setup HttpClient with certificate bypass (use only in dev/test)
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                // 3. Set headers
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                // 4. Create payload
                var payload = new
                {
                    ShipmentCode = request.code ?? null,
                    TruckID = request.trk_id ?? null,
                    LocationCode = string.IsNullOrWhiteSpace(request.location_id) ? null : request.location_id,
                    ShipDate = request.ship_date,
                    DispatchMethodID = 2,
                    ArrOrderShipments = request.selectedOrderShipment
                };

                string requestUrl = "api/order/CreateShipmentByCustomer";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                // 5. Serialize payload
                var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

                // 6. Call API
                var response = await client.PostAsync(fullUrl, content);

                // 7. Ensure successful status code (optional but good practice)
                response.EnsureSuccessStatusCode();

                // 8. Read and deserialize result
                var responseBody = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                if (result == null)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { error = result }),
                        api_action_type = "Shipment Creation",
                        description = "Shipment Creation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = "An error occurred while creating the record." };
                }

                if (result.IsSuccess == true)
                {
                    var truck_Id = await _outboundShipmentRepository.GetLatestShipmentId(request.trk_id);
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "created",
                        subject_id = Convert.ToInt32(truck_Id),
                        properties = JsonConvert.SerializeObject(new { data = request }),
                        api_action_type = "Shipment Creation",
                        description = "Shipment Creation | " + string.Join(",", request.selectedOrderShipment.Select(JsonConvert.SerializeObject))
                    });
                    return new CreateShipmentResponse { Error = 0, Message = "Shipment created successfully" };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { data = new { error = result.Message } }),
                        api_action_type = "Shipment Creation",
                        description = "Shipment Creation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = result.Message };
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.shipment,
                    @event = "error",
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    api_action_type = "Shipment Creation",
                    description = "Shipment Creation | Exception"
                });
                return new CreateShipmentResponse { Error = 1, Message = ex.Message };
            }
        }

        public async Task<CreateShipmentResponse> UpdateMultipleShipments(MultipleShipmentResquest request)
        {
            if (request.selectedOrderShipment == null || !request.selectedOrderShipment.Any())
            {
                return new CreateShipmentResponse { Error = 1, Message = "Please select at least one order from the order grid." };
            }

            try
            {
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                // 2. Setup HttpClient with certificate bypass (use only in dev/test)
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                // 3. Set headers
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));


                var groupedShipments = new Dictionary<string, ShipmentCustomerModel>();

                foreach (var shipment in request.selectedOrderShipment)
                {
                    var key = $"{shipment.CustomerCode}_{shipment.ShipToCode}";

                    if (!groupedShipments.ContainsKey(key))
                    {
                        groupedShipments[key] = new ShipmentCustomerModel
                        {
                            ShipmentCode = groupedShipments.Count == 0 ? request.code : "",
                            DispatchMethodID = 2,
                            ShipDate = (DateTime)request.ship_date,
                            //TruckID = request.truck.HasValue ? request.truck.Value : (int?)null,
                            LocationCode = string.IsNullOrWhiteSpace(request.location_id) ? null : request.location_id,
                            ArrOrderShipments = new List<ShipmentOrderItem>()
                        };
                    }

                    groupedShipments[key].ArrOrderShipments.Add(new ShipmentOrderItem
                    {
                        ORDERSHIPMENT = shipment.OrderShipment,
                        CUSTOMERCODE = shipment.CustomerCode,
                        SHIPTOCODE = shipment.ShipToCode
                    });
                }

                // 4. Create payload
                var payload = new
                {
                    shipmentCustomerModels = groupedShipments.Values.ToList()
                };

                string requestUrl = "api/Order/UpdateShipmentByCustomer";
                var fullUrl = new Uri(client.BaseAddress, requestUrl);

                // 5. Serialize payload
                var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

                // 6. Call API
                var response = await client.PutAsync(fullUrl, content);

                // 7. Ensure successful status code (optional but good practice)
                response.EnsureSuccessStatusCode();

                // 8. Read and deserialize result
                var responseBody = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                if (result == null)
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { error = result }),
                        api_action_type = "Shipment updation",
                        description = "Shipment updation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = "An error occurred while creating the record." };
                }

                if (result.IsSuccess == true)
                {
                    var ship_Id = await _outboundShipmentRepository.GetLatestShipmentId(request.code);
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "update",
                        subject_id = Convert.ToInt32(ship_Id),
                        properties = JsonConvert.SerializeObject(new { data = request }),
                        api_action_type = "Shipment updation",
                        description = "Shipment updation | " + string.Join(",", request.selectedOrderShipment.Select(JsonConvert.SerializeObject))
                    });
                    return new CreateShipmentResponse { Error = 0, Message = "Shipment updation successfully" };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "outbound",
                        module_id = (int)EnumData.Module.outbound,
                        sub_module_id = (int)EnumData.SubModule.shipment,
                        @event = "error",
                        properties = JsonConvert.SerializeObject(new { data = new { error = result.Message } }),
                        api_action_type = "Shipment updation",
                        description = "Shipment updation | Error"
                    });
                    return new CreateShipmentResponse { Error = 1, Message = result.Message };
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "outbound",
                    module_id = (int)EnumData.Module.outbound,
                    sub_module_id = (int)EnumData.SubModule.shipment,
                    @event = "error",
                    properties = JsonConvert.SerializeObject(new { data = new { message = ex.Message } }),
                    api_action_type = "Shipment updation",
                    description = "Shipment updation | Exception"
                });
                return new CreateShipmentResponse { Error = 1, Message = ex.Message };
            }
        }
    }
}
