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
    public class NotificationLogsService : INotificationLogsService
    {
        private readonly INotificationLogsRepository _notificationLogsRepository;

        public NotificationLogsService(INotificationLogsRepository notificationLogsRepository)
        {
            _notificationLogsRepository = notificationLogsRepository;
        }

        public async Task<(int StatusCode, object Response)> CreateNotificationLogs(CreateNotificationLogRequest request)
        {
            return await _notificationLogsRepository.CreateNotificationLogs(request);
        }

        public async Task<List<NotificationLogsResponse>> GetNotificationLogs(NotificationLogsRequest request)
        {
            return await _notificationLogsRepository.GetNotificationLogs(request);
        }
    }
}
