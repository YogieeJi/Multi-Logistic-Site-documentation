using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class OrderReallocationService : IOrderReallocationService
    {
        private readonly IOrderReallocationRepository _orderReallocationRepository;
        
        public OrderReallocationService(IOrderReallocationRepository orderReallocationRepository)
        {
            _orderReallocationRepository = orderReallocationRepository;
        }

        public async Task<OrdersReponse> GetOrders(GridRequest request)
        {
            return await _orderReallocationRepository.GetOrders(request);
        }

        public async Task<OrderShipItemsReponse> GetOrderShipItems(OrderItemsGridRequest request)
        {
            return await _orderReallocationRepository.GetOrderShipItems(request);
        }
    }
}
