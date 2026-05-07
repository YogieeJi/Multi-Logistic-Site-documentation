using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Runtime.Intrinsics.X86;
using System.Text;
using System.Threading.Tasks;
using iText.Layout.Element;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using Org.BouncyCastle.Asn1.Ocsp;

namespace MiddlewareWebAPI.Services.Services
{
    public class ItemStockService : IItemStockService
    {
        private readonly IItemStockRepository _itemStockrepository;
        private readonly IConfiguration _configuration;

        public ItemStockService(IItemStockRepository repository, IConfiguration configuration)
        {
            _itemStockrepository = repository;
            _configuration = configuration;
        }

        public async Task<ItemStockResponse> GetItemStock(GridRequest request)
        {
            return await _itemStockrepository.GetItemStock(request);
        }
        public async Task<StockReserveReasonsResponse> GetStockReserveReasons()
        {
            return await _itemStockrepository.GetStockReserveReasons();
        }

        public async Task<ReservationReasonResponse> AddReservationReason(SplitStockRequest request)
        {
            try
            {
                if (request == null || request.stock == null || request.quatity == null || request.location == null)
                {
                    return new ReservationReasonResponse
                    {
                        error = 1,
                        message = "Invalid request data."
                    };
                }

                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = "api/Stocks/SplitStock";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var errors = new List<string>();
                var successMessages = new List<string>();

                for (int i = 0; i < request.stock.Count; i++)
                {
                    try
                    {
                        int stockId = Convert.ToInt32(request.stock[i]);
                        double quantity = request.quatity[i];
                        int reasonId = Convert.ToInt32(request.reason);

                        string url = $"{urlBase}?StockPackTypeID={stockId}&Quantity={quantity}&ReserveReasonID={reasonId}";

                        var response = await client.PutAsync(url, null);
                        var jsonResponse = await response.Content.ReadAsStringAsync();

                        var result = JsonConvert.DeserializeObject<dynamic>(jsonResponse);

                        if (result != null && result.IsSuccess == true)
                        {
                            successMessages.Add((string)result.Message);
                        }
                        else
                        {
                            errors.Add(result?.Message?.ToString() ?? "Unknown error");
                        }
                    }
                    catch (Exception exInner)
                    {
                        errors.Add($"Stock {request.stock[i]} failed: {exInner.Message}");
                    }
                }

                if (errors.Count > 0 && successMessages.Count == 0)
                {
                    return new ReservationReasonResponse
                    {
                        error = 1,
                        message = "Some or all stock updates failed.",
                        errors = errors
                    };
                }

                return new ReservationReasonResponse
                {
                    error = 0,
                    message = successMessages.Count > 0 ? string.Join("; ", successMessages) : "Processed with warnings.",
                    errors = errors
                };
            }
            catch (Exception ex)
            {
                return new ReservationReasonResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }

        public async Task<ReservationReasonResponse> RemoveReservationReason(RemoveSplitStockRequest request)
        {
          
            try
            {
                if (request == null || request.stock == null || request.quatity == null || request.location == null)
                {
                    return new ReservationReasonResponse
                    {
                        error = 1,
                        message = "Invalid request data."
                    };
                }

                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = "api/Stocks/SplitStock";

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var errors = new List<string>();
                var successMessages = new List<string>();

                for (int i = 0; i < request.stock.Count; i++)
                {
                    try
                    {
                        int stockId = Convert.ToInt32(request.stock[i]);
                        double quantity = Convert.ToDouble(request.quatity[i]);
                        int reasonId = Convert.ToInt32(request.reason);

                        string url = $"{urlBase}?StockPackTypeID={stockId}&Quantity={quantity}&ReserveReasonID={reasonId}";

                        var response = await client.PutAsync(url, null);
                        var jsonResponse = await response.Content.ReadAsStringAsync();

                        var result = JsonConvert.DeserializeObject<dynamic>(jsonResponse);

                        if (result != null && result.IsSuccess == true)
                        {
                            successMessages.Add((string)result.Message);
                        }
                        else
                        {
                            errors.Add(result?.Message?.ToString() ?? "Unknown error");
                        }
                    }
                    catch (Exception exInner)
                    {
                        errors.Add($"Stock {request.stock[i]} failed: {exInner.Message}");
                    }
                }

                if (errors.Count > 0 && successMessages.Count == 0)
                {
                    return new ReservationReasonResponse
                    {
                        error = 1,
                        message = "Some or all stock updates failed.",
                        errors = errors
                    };
                }

                return new ReservationReasonResponse
                {
                    error = 0,
                    message = successMessages.Count > 0 ? string.Join("; ", successMessages) : "Processed with warnings.",
                    errors = errors
                };
            }
            catch (Exception ex)
            {
                return new ReservationReasonResponse
                {
                    error = 1,
                    message = ex.Message
                };
            }
        }

    }
}





