using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;


namespace MiddlewareWebAPI.Data.Repository
{
    public class LoadAndCloseJob : BackgroundService //IHostedService
    {
        private readonly ImportedOrdersRepository _importedOrdersRepository;
        private readonly IHttpClientFactory _httpClientFactory;

        public LoadAndCloseJob(ImportedOrdersRepository importedOrdersRepository, IHttpClientFactory httpClientFactory)
        {
            _importedOrdersRepository = importedOrdersRepository;
            _httpClientFactory = httpClientFactory;
        }

        public async Task Execute(int orderId, string? pick_list_id)
        {
            try
            {
                int? id = await _importedOrdersRepository.GetOrderIdFromPickList(pick_list_id);
                if (id == null)
                    throw new Exception("Order ID not found for the given pick_list_id.");

                string url = $"Order/LoadOrder?OrderID={id}&LoadAndClose=true&DeletePendingTask=true";

                using var client = _httpClientFactory.CreateClient();
                var response = await client.PutAsync(url, null);
                var result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Order Load & Closed Successfully");
                }
                else
                {
                    Console.WriteLine($"Error: {result}");
                }

                // Update lane and order status
                await _importedOrdersRepository.UpdateLaneStatus(pick_list_id);
            }
            catch (Exception ex)
            {
                Console.WriteLine("LoadAndCloseJob Error: " + ex.Message);
            }
        }

        /* Calling for Background Jobs using in IHostedService*/
        private readonly ILogger _logger;
        private Timer? _timer;

        public LoadAndCloseJob(ILogger<LoadAndCloseJob> logger)
        {
            _logger = logger;
        }
        public Task StartAsync(CancellationToken cancellationToken)
        {
            _timer = new Timer(_timer_Callback, null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _timer.Dispose();
            return Task.CompletedTask;
        }

        private void _timer_Callback(object? state) 
        {
            _logger.LogInformation("Timer Callback form sample service.");
        }

        /* Calling for Background Jobs using in BackgroundService*/
        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _timer = new Timer(_timer_Callback, null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
            return Task.CompletedTask;
        }
    }
}
