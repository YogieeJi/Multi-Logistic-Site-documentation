using System.Data.SqlClient;
using System.Data;
using System.Text;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Data.Common;
using Microsoft.AspNetCore.Components;
using static MiddlewareWebAPI.Data.Model.Conveyordashboard;
using Microsoft.AspNetCore.Http.HttpResults;

namespace MiddlewareWebAPI.Data.Repository
{
    public class PendingReceiptRepository : IPendingReceiptRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly string? _connectionString;
        private readonly UrlConstants _urlConstants;
        public PendingReceiptRepository(ISqlDataAccess dataAccess, IConfiguration configuration, UrlConstants urlConstants)
        {
            _dataAccess = dataAccess;
            _connectionString = configuration.GetConnectionString("con");
            _urlConstants = urlConstants;
        }
        public async Task<List<UserLanes>> getUserLane()
        {
            try
            {
                var query = @"
            SELECT
                C.title AS lane,
                STRING_AGG(LU.usr_Login + ',' + ISNULL(EC.color, 'Black'), '| ') AS usr_Logins
            FROM
                CUS_Con_Lanes AS C WITH (NOLOCK)
            LEFT JOIN
                CUS_Conv_LaneUsers AS LUJ WITH (NOLOCK) ON C.id = LUJ.lane_id
            LEFT JOIN
                LV_Users AS LU WITH (NOLOCK) ON LUJ.mantis_user_id = LU.usr_ID
            LEFT JOIN
                Cus_Conv_EmployeeToColor AS EC WITH (NOLOCK) ON EC.mantis_id = LU.usr_ID
            GROUP BY
                C.title
            ORDER BY
                C.title;
        ";

                var result = await _dataAccess.GetDataInline<UserLanes, dynamic>(query, new { });
                return (result ?? Enumerable.Empty<UserLanes>()).ToList(); // <-- explicit conversion
            }
            catch
            {
                return new List<UserLanes>();
            }
        }



    }
}
