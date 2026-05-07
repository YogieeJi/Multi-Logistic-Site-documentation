using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class NotificationLogsRepository : INotificationLogsRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public NotificationLogsRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<List<NotificationLogsResponse>> GetNotificationLogs(NotificationLogsRequest request)
        {
            var flatData = await _dataAccess.GetData<NotificationLogsResponse, dynamic>(
                "Cus_SP_Get_NotificationLogs",
                new { ModuleName = request.moduleName }
            );

            return flatData.ToList();
        }

        public async Task<(int StatusCode, object Response)> CreateNotificationLogs(CreateNotificationLogRequest request)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@NotificationSettingID", request.NotificationSettingID);
            parameters.Add("@TriggerID", request.TriggerID);
            parameters.Add("@UserID", request.UserID);
            parameters.Add("@NotificationType", request.NotificationType);
            parameters.Add("@OpertionType", request.OpertionType);
            parameters.Add("@Status", request.Status);
            parameters.Add("@CreatedDate", request.CreatedDate);
            parameters.Add("@CreatedBy", request.CreatedBy);
            parameters.Add("@Subject", request.Subject);
            parameters.Add("@Body", request.Body);
            parameters.Add("@PrimaryEmail", request.PrimaryEmail ?? "");
            parameters.Add("@SecondaryEmail", request.SecondaryEmail ?? "");
            parameters.Add("@ErrorMessage", request.ErrorMessage ?? "");
            parameters.Add("@MessageId", request.MessageId ?? "");

            try
            {
                await _dataAccess.SaveData("Cus_SP_Create_NotificationLog", parameters); 

                return (200, new
                {
                    error = 0,
                    message = "Notification log created successfully"
                });
            }
            catch (Exception ex)
            {
                return (500, new
                {
                    error = 1,
                    message = "Internal error: " + ex.Message
                });
            }
        }
    }
}
