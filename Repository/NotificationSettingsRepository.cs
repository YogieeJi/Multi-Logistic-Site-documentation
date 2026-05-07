using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class NotificationSettingsRepository : INotificationSettingsRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public NotificationSettingsRepository(ISqlDataAccess dataAccess) 
        {
            _dataAccess = dataAccess;
        }

        public async Task<NotificationSettingsResponse> GetNotificationSettings(NotificationSettingsRequest request)
        {
            var flatData = await _dataAccess.GetData<NotificationFlatDto, dynamic>(
                "Cus_SP_GetNotificationSettings",
                new { ModuleName = request.ModuleName }
            );

            var first = flatData.FirstOrDefault();

            if (first == null)
                return null;

            var result = new NotificationSettingsResponse
            {
                SettingId = first.SettingId,
                DefaultEmails = first.DefaultEmails?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                        .Select(x => x.Trim()).ToList(),
                PrimaryEmail = first.PrimaryEmail?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                        .Select(x => x.Trim()).ToList(),

                SecondaryEmail = first.SecondaryEmail?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                        .Select(x => x.Trim()).ToList(),

                Triggers = flatData
                    .GroupBy(t => new { t.TriggerId, t.TriggerName, t.IsEnabled, t.EventCode })
                    .Select(trigger => new TriggerDto
                    {
                        TriggerId = trigger.Key.TriggerId,
                        TriggerName = trigger.Key.TriggerName,
                        IsActive = trigger.Key.IsEnabled,
                        EventCode = trigger.Key.EventCode,

                        Templates = trigger
                            .Where(x => x.TemplateId.HasValue)
                            .Select(x => new TemplateDto
                            {
                                TemplateId = x.TemplateId.Value,
                                Subject = x.Subject,
                                Body = x.Body,
                                IsDefault = x.IsDefault,
                                AvailableTags = x.AvailableTags != null
                                    ? x.AvailableTags
                                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                        .Select(tag => tag.Trim())
                                        .ToList()
                                    : new List<string>()
                            })
                            .ToList()
                    }).ToList()
            };

            return result;
        }

        public async Task<OrderPrimaryEmailResponse?> GetOrderPrimaryEmail()
        {
            string sql = @"
                SELECT TOP 1 
                    id AS Id, 
                    pick_list_id AS PickListId, 
                    creator_email AS CreatorEmail,
                    created_at AS CreatedAt
                FROM Cus_T_ImportedOrders
                ORDER BY id DESC;
            ";

            var result = await _dataAccess.GetDataInline<OrderPrimaryEmailResponse, dynamic>(sql, new { });

            return result.FirstOrDefault();
        }

        public async Task<ResponseResult> UpdatedNotification(UpdatedNotificationRequest request)
        {
            var sql = "Cus_SP_UpdateNotificationSettings";

            // JSON 
            var payload = new
            {
                triggers = request.Triggers.Select(t => new
                {
                    triggerId = t.TriggerId,
                    triggerName = t.TriggerName,
                    isActive = t.IsActive,
                    templates = t.Templates.Select(temp => new
                    {
                        templateId = temp.TemplateId,
                        subject = temp.Subject,
                        body = temp.Body,
                        isDefault = temp.IsDefault
                    }).ToList()
                }).ToList()
            };

            var json = JsonConvert.SerializeObject(payload);

            // Parameters
            var dynamicParams = new DynamicParameters();
            dynamicParams.Add("@ModuleName", request.ModuleName);
            dynamicParams.Add("@SettingId", request.SettingId);
            dynamicParams.Add("@DefaultEmails", request.DefaultEmails);
            dynamicParams.Add("@PrimaryEmail", request.PrimaryEmail);
            dynamicParams.Add("@SecondaryEmail", request.SecondaryEmail);
            dynamicParams.Add("@IsActive", request.IsActive);
            dynamicParams.Add("@TriggersJson", json);

            // Execute SP
            await _dataAccess.SaveData(sql, dynamicParams);

            return new ResponseResult
            {
                Error = 0,
                Message = "Notification updated successfully"
            };
        }

    }
}
