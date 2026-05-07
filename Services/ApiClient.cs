using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class ApiClient : IApiClient
    {
        private readonly HttpClient _httpClient;

        public ApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://38.147.85.148:28843/api1/x3/erp/DYN01/");
        }

        public async Task<string> GetAsync(string url)
        {
            var fullUrl = new Uri(_httpClient.BaseAddress, url);
            var response = await _httpClient.GetStringAsync(url);
            return response;
        }
    }
}