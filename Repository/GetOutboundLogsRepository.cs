using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;

namespace MiddlewareWebAPI.Data.Repository
{
    public class GetOutboundLogsRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public GetOutboundLogsRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }
        public async Task<bool> GetOutboundLogsAsync()
        {
            string query = "SELECT * FROM Activity WHERE module_id = 2";
            var result = await _dataAccess.GetData<int, dynamic>(query, new { });
            // Check if the result contains any data and return a boolean
            return result.FirstOrDefault() != null;
        }

    }
}
