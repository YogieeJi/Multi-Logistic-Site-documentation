using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        public OrderService(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<OrderDetailResponse> GetOrderDetail(OrderDetailRequest request)
        {
            try
            {
                var response = await _orderRepository.GetOrderDetail(request);

                if (response == null || !response.Data.Any())
                {
                    return new OrderDetailResponse
                    {
                        Error = 1,
                        Message = "Product not found",
                        Data = Enumerable.Empty<OrderDetailRow>()
                    };
                }

                return new OrderDetailResponse
                {
                    Error = 0,
                    Message = "Success",
                    Data = response.Data
                };
            }
            catch (Exception ex)
            {
                return new OrderDetailResponse { Error = 1, Message = $"Internal Server Error | {ex.Message}" };
            }
            
        }
    }
}
