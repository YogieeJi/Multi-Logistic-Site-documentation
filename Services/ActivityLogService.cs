using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly IActivityLogRepository _repository;


        public ActivityLogService(IActivityLogRepository repository)
        {
            _repository = repository;
        }
        //public async Task<ActivityLogResponse> GetLogs(OutboundLogRequest request, string? logType)
        //{
        //    return await _repository.GetActivityLogs(request, logType);
        //}

        public async Task<InboundLogResponse> GetInboundLogs(InboundLogRequest request)
        {
            return await _repository.GetInboundLogs(request);
        }

        public async Task<IEnumerable<ActivityLog>> GetTargetedLogs(int moduleId, int subModuleId, int subjectId)
        {
            return await _repository.GetTargetedLogs(moduleId, subModuleId, subjectId);
        }
        public async Task<IEnumerable<ActivityLog>> GetTargetedLogsfororders(int moduleId, IEnumerable<int> subModuleId, int subjectId)
        {
            return await _repository.GetTargetedLogsfororders(moduleId, subModuleId, subjectId);
        }

        public async Task<OutboundLogResponse> GetOutboundLogs(OutboundLogRequest request)
        {
            return await _repository.GetOutboundLogs(request);
        }

        public async Task<ApisResponse> ArchiveActivityLogs()
        {
           
         return await _repository.ArchiveActivityLogs();
        }
    }
}
