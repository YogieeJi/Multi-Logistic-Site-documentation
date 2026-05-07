using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Hangfire;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class NotificationSettingsService : INotificationSettingsService
    {
        private readonly INotificationSettingsRepository _notificationSettingsRepository;

        public NotificationSettingsService(INotificationSettingsRepository notificationSettingsRepository)
        {
            _notificationSettingsRepository = notificationSettingsRepository;
        }

        public async Task<NotificationSettingsResponse> GetNotificationSettings(NotificationSettingsRequest request)
        {
            return await _notificationSettingsRepository.GetNotificationSettings(request);
        }

        public async Task<OrderPrimaryEmailResponse> GetOrderPrimaryEmail()
        {
            return await _notificationSettingsRepository.GetOrderPrimaryEmail();
        }

        public async Task<ResponseResult> UpdatedNotification(UpdatedNotificationRequest request)
        {
            try
            {
                var affectedRows = await _notificationSettingsRepository.UpdatedNotification(request);

                return new ResponseResult { Error = 0, Message = "Tasks updated successfully." };
            }
            catch (Exception ex)
            {
                return new ResponseResult { Error = 1, Message = $"Task update failed: {ex.Message}" };
            }
        }
    }
}
