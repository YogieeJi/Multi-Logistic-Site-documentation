using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class SettingRepository : ISettingRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        public SettingRepository(ISqlDataAccess dataAccess) 
        { 
            _dataAccess = dataAccess;
        }

        public async Task<IEnumerable<SchedulerSetting>> GetSchedulerList()
        {
            //var sql = "SELECT * FROM Cus_SchedulerSettings";
            //return await _dataAccess.GetDataInline<SchedulerSetting, dynamic>(sql, new {});
            var storedProcedure = "[dbo].[Cus_Sp_GetAllSchedulerSettings_v1]";
            return await _dataAccess.GetData<SchedulerSetting, dynamic>(storedProcedure, new { });

        }

        public async Task<IEnumerable<SchedulerSetting>> GetSchedulerById(int id)
        {
            //var query = "SELECT * FROM Cus_SchedulerSettings WHERE Id = @Id";
            //return await _dataAccess.GetFirstDataInline<SchedulerSetting,dynamic>(query, new { Id = id });
            var storedProcedure = "[dbo].[Cus_Sp_GetSchedulerSettingById_v1]";
            return await _dataAccess.GetFirstData<SchedulerSetting, dynamic>(storedProcedure, new { Id = id } );

        }

        public async Task UpdateFrequency(int id, string? newFrequency)
        {
            //var query = "UPDATE Cus_SchedulerSettings SET frequency = @Frequency, updated_at = GETDATE() WHERE Id = @Id";
            //await _dataAccess.SaveDataInline(query, new { Frequency = newFrequency, Id = id });
            var storedProcedure = "Cus_UpdateSchedulerFrequency";
            await _dataAccess.SaveData(storedProcedure, new { Id = id, Frequency = newFrequency });

        }
    }
}
