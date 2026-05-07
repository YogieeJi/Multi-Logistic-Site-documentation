using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Services.Services
{
    public class MantisService : IMantisService
    {
        private readonly IItemRepository _itemRepository;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public MantisService(IItemRepository itemRepository, HttpClient httpClient, IConfiguration configuration)
        {
            _itemRepository = itemRepository;
            _httpClient = httpClient;
            _configuration = configuration;
        }
        public Task<IEnumerable<Mantis>> GetVendorDetails(Mantis mentis)
        {
            return _itemRepository.GetAllVData(mentis);
        }
        public Task<IEnumerable<Mantis>> GetVendorDataById(int Id)
        {
            return _itemRepository.GetVendorDataById(Id);
        }
        public async Task<OrderTasksResponse> Getordertasks(GridRequest request)
        {
            return await _itemRepository.Getordertasks(request);
        }
        public async Task<object> deleteTask(int? shipmentId)
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

                string request = $"/api/Task/DeleteOrderTasks?orderID={shipmentId}";
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
    }
}
