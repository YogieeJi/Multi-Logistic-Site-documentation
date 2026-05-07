using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using System.Text.Json;
using static MiddlewareWebAPI.Data.Model.Conveyordashboard;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using System.Web.Helpers;

namespace MiddlewareWebAPI.Services.Services
{
    public class PendingReceiptService : IPendingReceiptService
    {
        private readonly IPendingReceiptRepository _pendingreceiptrepository;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        public PendingReceiptService(IPendingReceiptRepository pendingreceiptrepository, IConfiguration configuration, HttpClient httpClient)
        {
            _pendingreceiptrepository = pendingreceiptrepository;
            _configuration = configuration;
            _httpClient = httpClient;
        }
        public async Task<PendingReceiptResponse> getPendingReceiptList()
        {
            try
            {
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = "api/Receipts/GetPendingReceipts";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.GetAsync(urlBase);

                if (!response.IsSuccessStatusCode)
                {
                    return new PendingReceiptResponse
                    {
                        Message = "API request failed.",
                        IsSuccess = false,
                        Data = new List<PendingReceiptList>()
                    };
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var parsedResponse = JsonConvert.DeserializeObject<PendingReceiptResponse>(responseBody);

                return parsedResponse ?? new PendingReceiptResponse
                {
                    Message = "Empty or invalid response.",
                    IsSuccess = false,
                    Data = new List<PendingReceiptList>()
                };
            }
            catch (Exception ex)
            {
                return new PendingReceiptResponse
                {
                    Message = $"Error while fetching pending receipt list: {ex.Message}",
                    IsSuccess = false,
                    Data = new List<PendingReceiptList>()
                };
            }
        }
        public async Task<Data.Model.Conveyordashboard.LaneResponse> getLaneStatus()
        {
            try
            {
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = "api/Lanes/GetLaneStatus";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.GetAsync(urlBase);

                if (!response.IsSuccessStatusCode)
                {
                    return new Data.Model.Conveyordashboard.LaneResponse
                    {
                        error = 1,
                        laneData = new List<Data.Model.Conveyordashboard.LaneData>(),
                        ErrorLane = new List<object>(),
                        message = "API request failed."
                    };
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var parsedResponse = JsonConvert.DeserializeObject<Data.Model.Conveyordashboard.LaneResponse1>(responseBody);

                // Ensure we never return null lists
                return new Data.Model.Conveyordashboard.LaneResponse
                {
                    laneData = parsedResponse?.Data?.laneData ?? new List<Data.Model.Conveyordashboard.LaneData>(),
                    ErrorLane = parsedResponse?.ErrorLane ?? new List<object>(),
                    message = parsedResponse?.Message ?? "Empty or invalid response."
                };
            }
            catch (Exception ex)
            {
                return new Data.Model.Conveyordashboard.LaneResponse
                {
                    error = 1,
                    laneData = new List<Data.Model.Conveyordashboard.LaneData>(),
                    ErrorLane = new List<object>(),
                    message = "Exception occurred: " + ex.Message
                };
            }
        }
        public async Task<UserLaneResponse> getUserLane()
        {
            try
            {
                var data = await _pendingreceiptrepository.getUserLane();

                if (data == null || data.Count() == 0)
                {
                    return new UserLaneResponse
                    {
                        error = 1,
                        message = "No result found!",
                        data = new List<UserLanes>()
                    };
                }

                return new UserLaneResponse
                {
                    error = 0,
                    message = "Data fetched successfully",
                    data = data
                };
            }
            catch (Exception ex)
            {
                return new UserLaneResponse
                {
                    error = 1,
                    message = ex.Message,
                    data = new List<UserLanes>()
                };
            }
        }
        public async Task<SlotResponse> GetAllSlotsAsync()
        {
            try
            {
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = "api/Slot/GetAllSlots";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.GetAsync(urlBase);

                if (!response.IsSuccessStatusCode)
                {
                    return new SlotResponse
                    {
                        error = 1,
                        message = $"API request failed with status code {response.StatusCode}",
                        data = new List<Slot>()
                    };
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                var apiResult = JsonConvert.DeserializeObject<ApiResponse<List<Slot>>>(jsonString);

                if (apiResult == null)
                {
                    return new SlotResponse
                    {
                        error = 1,
                        message = "Invalid API response",
                        data = new List<Slot>()
                    };
                }

                if (apiResult.IsSuccess)
                {
                    return new SlotResponse
                    {
                        error = 0,
                        message = apiResult.Message ?? "Operation succeeded!",
                        data = apiResult.Data ?? new List<Slot>()
                    };
                }
                else
                {
                    return new SlotResponse
                    {
                        error = 1,
                        message = apiResult.Message ?? "API returned failure",
                        data = new List<Slot>()
                    };
                }
            }
            catch (Exception ex)
            {
                return new SlotResponse
                {
                    error = 1,
                    message = ex.Message,
                    data = new List<Slot>()
                };
            }
        }
        public async Task<ProductResponse> GetAllProductsAsync(string id)
        {
            try
            {



                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = id == "null"
                     ? "api/Items/GetProductDetails"
                     : $"api/Items/GetProductDetailsByReceipt?receiptPlan={id}";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.GetAsync(urlBase);

                if (!response.IsSuccessStatusCode)
                {
                    return new ProductResponse
                    {
                        error = 1,
                        message = "An error occurred while fetching the record."
                    };
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = System.Text.Json.JsonSerializer.Deserialize<RootWmsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new ProductResponse
                    {
                        error = 1,
                        message = "Invalid response from server."
                    };
                }

                if (result.IsSuccess)
                {
                    return new ProductResponse
                    {
                        error = 0,
                        data = result.Data,
                        message = result.Message
                    };
                }
                else
                {
                    return new ProductResponse
                    {
                        error = 1,
                        message = result.Message
                    };
                }
            }
            catch (Exception ex)
            {
                return new ProductResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }
        public async Task<ReceivingPlanResponse> GetReceivingPlanAsync(string id)
        {
            try
            {
                string urlBase = $"api/Items/GetReceiptPlan?ReceiptID={id}";
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.GetAsync(urlBase);

                if (!response.IsSuccessStatusCode)
                {
                    return new ReceivingPlanResponse
                    {
                        error = 1,
                        message = "An error occurred while fetching the record."
                    };
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = System.Text.Json.JsonSerializer.Deserialize<RoootWmsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new ReceivingPlanResponse
                    {
                        error = 1,
                        message = "Invalid response from server."
                    };
                }

                if (result.IsSuccess)
                {
                    return new ReceivingPlanResponse
                    {
                        error = 0,
                        is_bulk = result.is_bulk,
                        is_arrived = result.arrived,
                        data = result.Data,
                        message = result.Message
                    };
                }

                return new ReceivingPlanResponse
                {
                    error = 1,
                    message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new ReceivingPlanResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }
        public async Task<CreateReceivingItemResponse> CreateReceivingItemAsync(CreateReceivingItemRequest request)
        {
            try
            {
                string urlBase = $"api/Items/AddReceiptItem?upc={request.upc}&title={request.title}&slot_id={request.slot_id}&ReceiptID={request.ReceiptID}&QtyPallet={request.qty}";

                if (!string.IsNullOrWhiteSpace(request.lot_number))
                    urlBase += $"&LotNumber={request.lot_number}";

                if (!string.IsNullOrWhiteSpace(request.iteration))
                    urlBase += $"&total_iteration={request.iteration}";


                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.PostAsync(urlBase, null); // no body, only query params

                var statusCode = (int)response.StatusCode;

                if (!response.IsSuccessStatusCode)
                {
                    return new CreateReceivingItemResponse
                    {
                        error = 1,
                        code = statusCode,
                        message = "An error occurred while fetching the record."
                    };
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = System.Text.Json.JsonSerializer.Deserialize<RooootWmsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new CreateReceivingItemResponse
                    {
                        error = 1,
                        code = statusCode,
                        message = "Invalid response from server."
                    };
                }

                return new CreateReceivingItemResponse
                {
                    error = result.IsSuccess ? 0 : 1,
                    code = statusCode,
                    message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new CreateReceivingItemResponse
                {
                    error = 1,
                    code = 500,
                    message = ex.Message
                };
            }
        }
        public async Task<Data.Model.Conveyordashboard.ApiResponse> GenerateReceivingPlanAsync(int receiptId, string removeOldPlan)
        {
            try
            {
                string url = $"api/Receipts/GenerateReceiptPlan?ReceiptID={receiptId}&removeOldPlan={removeOldPlan.ToString().ToLower()}";
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.PostAsync(url, null);

                var content = await response.Content.ReadAsStringAsync();

                //if (!response.IsSuccessStatusCode)
                //{
                //    return new Data.Model.Conveyordashboard.ApiResponse
                //    {
                //        Error = 1,
                //        Code = 500,//(int)response.StatusCode,
                //        Message = "An error occurred while fetching the record."
                //    };
                //}

                var result = System.Text.Json.JsonSerializer.Deserialize<RootWmsResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new Data.Model.Conveyordashboard.ApiResponse
                    {
                        error = 1,
                        code = (int)response.StatusCode,
                        message = "Invalid response from server."
                    };
                }

                return new Data.Model.Conveyordashboard.ApiResponse
                {
                    error = result.IsSuccess ? 0 : 1,
                    code = (int)response.StatusCode,
                    message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new Data.Model.Conveyordashboard.ApiResponse
                {
                    error = 1,
                    code = 500,
                    message = ex.Message
                };
            }
        }
        public async Task<(int Error, string Message)> DeleteReceiptAsync(int id)
        {
            try
            {
                string url = $"api/Items/DeleteReceiptPlan?ReceiptID={id}";
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));


                var response = await client.DeleteAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return (1, "An error occurred while deleting receipt.");
                }

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<DApiResponse>(content);

                if (result == null)
                    return (1, "An error occurred while deleting receipt.");

                return result.IsSuccess
                    ? (0, result.Message)
                    : (1, result.Message);
            }
            catch (Exception ex)
            {
                return (1, $"Error while processing receipt deletion: {ex.Message}");
            }
        }
        public async Task<DeleteResponseModel> DeleteReceivingPlanAsync(int id)
        {
            try
            {
                string url = $"api/Items/DeleteItem/{id}";
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                var response = await client.DeleteAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new DeleteResponseModel
                    {
                        error = 1,
                        message = "An error occurred while deleting the record."
                    };
                }

                var result = System.Text.Json.JsonSerializer.Deserialize<RootWmsResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new DeleteResponseModel
                    {
                        error = 1,
                        message = "Invalid response from server."
                    };
                }

                return new DeleteResponseModel
                {
                    error = result.IsSuccess ? 0 : 1,
                    message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new DeleteResponseModel
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }
        public async Task<UApiResponse> UpdateReceivingPlanAsync(int id, UpdateReceivingPlanRequest request)
        {
            try
            {
                string url = $"api/Items/UpdateReceiptPlan?ItemID={id}" +
                             $"&SlotID={request.Slot_ID}" +
                             $"&UPC={request.UPC}" +
                             $"&QtyPalletToCases={request.Qty}" +
                             $"&LotNumber={request.Lot_Number}" +
                             $"&total_iteration={request.Iteration}";
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.PutAsync(url, null);
                var json = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new UApiResponse
                    {
                        error = 1,
                        message = "An error occurred while updating the record."
                    };
                }

                var result = System.Text.Json.JsonSerializer.Deserialize<RootWmsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new UApiResponse
                    {
                        error = 1,
                        message = "Invalid response from server."
                    };
                }

                return new UApiResponse
                {
                    error = result.IsSuccess ? 0 : 1,
                    message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new UApiResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }
        public async Task<MApiResponse> MarkReceiptBulkAsync(int receiptId, string isBulk)
        {
            try
            {
                string url = $"api/Receipts/MarkReceiptBulk?ReceiptID={receiptId}&IsBulk={isBulk.ToString().ToLower()}";

                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await client.PostAsync(url, null);

                var json = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new MApiResponse
                    {
                        error = 1,
                        message = "An error occurred while marking the receipt as bulk."
                    };
                }

                var result = System.Text.Json.JsonSerializer.Deserialize<RootWmsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    return new MApiResponse
                    {
                        error = 1,
                        message = "Invalid response from server."
                    };
                }

                return new MApiResponse
                {
                    error = result.IsSuccess ? 0 : 1,
                    message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new MApiResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }
        public async Task<(int Error, int Code, string Message)> ResetReceiptAsync(int id)
        {
            try
            {
                string url = $"api/Receipts/UpdateReceiptStatus?progressID=2&receiptID={id}";
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                var response = await client.PutAsync(url, null);

                var content = await response.Content.ReadAsStringAsync();

                var result = JsonConvert.DeserializeObject<RApiResponse>(content);

                if (result == null)
                    return (1, (int)response.StatusCode, "An error occurred.");

                if (result.IsSuccess)
                    return (0, (int)response.StatusCode, result.Message);
                else
                    return (1, (int)response.StatusCode, result.Message);
            }
            catch (Exception ex)
            {
                return (1, 500, $"Error while processing receipt reset: {ex.Message}");
            }
        }
        public async Task<(int Error, int Code, string Message)> MarkContainerStatusAsync(int id, string action)
        {
            try
            {
                string url;
                HttpResponseMessage response;

                if (action.Equals("arrived", StringComparison.OrdinalIgnoreCase))
                {
                    url = $"api/Receipts/AddReceiptArrive?ReceiptID={id}";
                    var baseUrl = _configuration["MantisApi:Endpoint"];
                    var apiKey = _configuration["MantisApi:ApiKey"];

                    using var client = new HttpClient(new HttpClientHandler
                    {
                        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                    });

                    client.BaseAddress = new Uri(baseUrl);
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    response = await client.PostAsync(url, null);
                }
                else
                {
                    url = $"api/Receipts/UpdateReceiptStatus?progressID=3&receiptID={id}";
                    var baseUrl = _configuration["MantisApi:Endpoint"];
                    var apiKey = _configuration["MantisApi:ApiKey"];

                    using var client = new HttpClient(new HttpClientHandler
                    {
                        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                    });

                    client.BaseAddress = new Uri(baseUrl);
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    response = await client.PutAsync(url, null);
                }

                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<MCApiResponse>(content);

                if (result == null)
                    return (1, (int)response.StatusCode, "An error occurred.");

                if (result.IsSuccess)
                    return (0, (int)response.StatusCode, result.Message);
                else
                    return (1, (int)response.StatusCode, result.Message);
            }
            catch (Exception ex)
            {
                return (1, 500, $"Error while processing container status: {ex.Message}");
            }
        }
    }
}


