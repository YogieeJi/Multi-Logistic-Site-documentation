using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using System.Data.Common;
using Microsoft.Extensions.Options;
using System.IO;
using Newtonsoft.Json.Linq;
using System.Collections;
using Swashbuckle.Swagger;
using Microsoft.AspNetCore.Http.Extensions;
using static Dapper.SqlMapper;
using System.Data;
using System.Collections.Generic;
using static OfficeOpenXml.ExcelErrorValue;
using Newtonsoft.Json;
using System.Web.Mvc;
using static MiddlewareWebAPI.Data.Model.Zone;
using static Org.BouncyCastle.Math.EC.ECCurve;
using System.Data.SqlClient;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using System.Web.Http;
using static iText.IO.Image.Jpeg2000ImageData;
using Org.BouncyCastle.Asn1.Ocsp;
namespace MiddlewareWebAPI.Data.Repository
{
    public class RoleRepository : IRoleRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public UserPermission? UserPermission { get; private set; }

        public RoleRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<UserResponse> GetRolesGrid(RolesRequest request)
        {
            var query = @"SELECT cur.[id]    AS [roleId],
                                     cur.[name]         AS [roleName],
                                     cur.[created_at],
                                     cur.[updated_at],
                                     CASE
                                       WHEN cur.[is_active] = 1 THEN 'Active'
                                       ELSE 'Inactive'
                                     END  AS [status],
                                     cur.[is_active],
                                     -- Get comma-separated list of operation domains for this role
                                     (SELECT String_agg(cod.[domain_name], ', ')
                                      FROM   [dbo].[cus_role_operation_domains] crod
                                             JOIN [dbo].[cus_operation_domains] cod
                                               ON cod.[id] = crod.[operation_domain_id]
                                      WHERE  crod.[role_id] = cur.[id])              AS [domains],
                                     -- Get count of unique modules this role has permissions for
                                     (SELECT Count(DISTINCT cp.[module_id])
                                      FROM   [dbo].[cus_role_permissions] rp
                                             JOIN [dbo].cus_permissionsmaster pm
                                               ON pm.[permission_id] = rp.[permission_id]
                                             JOIN [dbo].cus_pagemaster cp
                                               ON cp.[id] = pm.page_id
                                      WHERE  rp.[role_id] = cur.[id]
                                             AND Isnull(rp.is_deleted, 0) = 0)       AS [moduleCount],
                                     -- Get formatted modules display (e.g., ""8 modules"" or ""All"")
                                     CASE
                                       WHEN (SELECT Count(DISTINCT cp.[module_id])
                                             FROM   [dbo].[cus_role_permissions] rp
                                                    JOIN [dbo].cus_permissionsmaster pm
                                                      ON pm.[permission_id] = rp.[permission_id]
                                                    JOIN [dbo].cus_pagemaster cp
                                                      ON cp.[id] = pm.page_id
                                             WHERE  rp.[role_id] = cur.[id]
                                                    AND Isnull(rp.is_deleted, 0) = 0) =
                                            (SELECT Count(*)
                                             FROM   [dbo].cus_modulemaster) THEN 'All'
                                       ELSE Cast( ( SELECT Count(DISTINCT cp.[module_id]) FROM
                                            [dbo].[cus_role_permissions]
                                            rp JOIN [dbo].cus_permissionsmaster pm ON pm.[permission_id] =
                                            rp.[permission_id] JOIN [dbo].cus_pagemaster cp ON cp.[id] =
                                            pm.page_id
                                            WHERE rp.[role_id]
                                            = cur.[id] AND Isnull(rp.is_deleted, 0) = 0 ) AS NVARCHAR(10) )
                                            + ' modules'
                                     END                                             AS [modules],
                                     -- Get count of users assigned to this role
                                     Isnull((SELECT Count(*)
                                             FROM   [dbo].[cus_users] cu
                                             WHERE  cu.[user_role_id] = cur.[id]
                                                    AND cu.[is_deleted] = 0), 0)     AS [usersCount],
                                     Isnull((SELECT Count(*)
                                             FROM   [dbo].[cus_userroles_v1] cu
                                             WHERE  cu.is_active = 1 and cu.[is_deleted] = 0), 0)            AS [activerolesCount],
                                     Isnull((SELECT Count(*)
                                             FROM   [dbo].[cus_userroles_v1] cu
                                             WHERE  cu.is_active = 0 and cu.[is_deleted] = 0), 0)            AS [inactiverolesCount],
                                     Isnull((SELECT Count(*)
                                             FROM   [dbo].[cus_userroles_v1] cu WHERE cu.[is_deleted] = 0), 0) AS [totalrolesCount],
                              			   Isnull((SELECT Count(*)
                                     FROM [dbo].[cus_users] cu
                                     WHERE isnull(cu.[is_deleted],0) = 0 and isnull(cu.is_active, 0) = 1) , 0) AS totalUsersAssigned
                              FROM   [dbo].[cus_userroles_v1] cur
                              WHERE  isnull(cur.[is_deleted],0) = 0 
            ";

            var parameters = new DynamicParameters();
            string totalCountQuery = "SELECT COUNT(id) FROM [Cus_UserRoles_v1] WHERE  [is_deleted] = 0";

            // Handle filters
            if (request.Filters != null && request.Filters.Count > 0)
            {
                foreach (var filter in request.Filters)
                {
                    var key = filter.Key;
                    var value = filter.Value?.value;

                    if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
                    {
                        string paramName = $"@{key}";

                        // Handle specific datetime fields
                        if (key.Equals("created_at", StringComparison.OrdinalIgnoreCase))
                        {
                            string condition = $" AND {key} = {paramName}";
                            query += condition;
                            totalCountQuery += condition;

                            // Replace 'T' with space for ISO datetime
                            string formattedValue = value.Replace("T", " ");
                            parameters.Add(paramName, formattedValue);
                        }
                        else if (key.Equals("roleName", StringComparison.OrdinalIgnoreCase))
                        {
                            // Default LIKE condition for string-based fields
                            var cleanValue = value?.Trim();
                            string condition = $" AND name LIKE {paramName}";
                            query += condition;
                            totalCountQuery += condition;

                            parameters.Add(paramName, $"%{cleanValue}%");
                        }
                        else
                        {
                            // Default LIKE condition for string-based fields
                            string condition = $" AND {key} LIKE {paramName}";
                            query += condition;
                            totalCountQuery += condition;

                            parameters.Add(paramName, $"%{value}%");
                        }
                    }
                }
            }
            if(request.is_active == 1){
                query += $" AND cur.IS_ACTIVE = 1";
                totalCountQuery += $" AND IS_ACTIVE = 1";
            }
            else if(request.is_active ==0){
                query += $" AND cur.IS_ACTIVE = 0";
                totalCountQuery += $" AND IS_ACTIVE = 0";
            }
            // Handle sorting
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                if (!string.IsNullOrWhiteSpace(request.sortField))
                {
                    query += $" ORDER BY {request.sortField} {sortOrder}";
                }
                else
                {
                    query += $" ORDER BY {sortOrder}";
                }
            }
            else
            {
                query += " ORDER BY id Desc";
            }

            // Pagination
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.Rows);

            // Get data
            var result = await _dataAccess.GetDataInline<Userss, dynamic>(query, parameters);

            foreach (var user in result)
            {
                if (!string.IsNullOrEmpty(user.user_permissionsraw))
                {
                    try
                    {
                        user.user_permissions = JsonConvert.DeserializeObject<UserPermission>(user.user_permissionsraw);
                    }
                    catch
                    {
                        user.user_permissions = null;
                    }
                }

                if (user.is_active != "1" && user.is_active != "0")
                {
                    user.is_active = user?.is_active?.ToLower() == "true" ? "1" : "0";
                }
            }

            var totalCount = (await _dataAccess.GetDataInline<int, dynamic>(totalCountQuery, parameters)).FirstOrDefault();


            return new UserResponse
            {
                data = result,
                totalRecords = totalCount,
                message = "Successfull"
            };
        }
        public async Task<List<RoleMasterRawDto>> GetRoleMasterData()
        {
            var result = await _dataAccess.GetDataInline<RoleMasterRawDto, dynamic>(
                "CUS_ROLES_MDATA_V2",
                new { }
            );

            return result.ToList();
        }

        public async Task<List<RoleDetailsRawDto>> GetRolesGridById(int id)
        {
            var result = await _dataAccess.GetDataInline<RoleDetailsRawDto, dynamic>(
                "USP_GetRoleDetails_v3 @role_id",
                new { role_id = id }
            );

            return result.ToList();
        }
        public async Task<int> UpdateRoleAsync(int id)
        {
            try
            {
                var query = @"
                  update cus_role_permissions set is_deleted = 1 where role_id = @id";
                var parameters = new
                {
                    id
                };
                return await _dataAccess.SaveDataInline(query, parameters);
            }
            catch (Exception ex)
            {

                return 0;
            }
        }

        //public async Task<int> AddRoleAsync(AdRoleRequest request)
        //{
        //    try
        //    {
        //        string userPermissionsString = request.user_permissions.ToString();
        //        var query = @"
        //          insert into Cus_UserRoles_v1
        //          (
        //          name,
        //          is_active,
        //          created_at,
        //          updated_at,
        //          user_permissions)
        //          values (@name,
        //                 @is_active,
        //                @created_at,
        //                 @updated_at,
        //          @user_permissions)";
        //        var parameters = new
        //        {
        //            name = request.name,
        //            is_active =  1,
        //            created_at = DateTime.Now,
        //            updated_at = DateTime.Now,
        //            user_permissions = userPermissionsString

        //        };
        //        return await _dataAccess.SaveDataInline(query, parameters);
        //    }
        //    catch (Exception ex)
        //    {

        //        return 0;
        //    }
        //}
        public async Task<long> AddRoleAsync(AdRoleRequest request)
        {
            try
            {
                var domainIds = request.Role_Operation_Domains
                    .Select(x => x.Operation_Domain_Id);

                var actionIds = request.Role_Permissions ?? new List<RolePermissionDto>();

                var parameters = new DynamicParameters();

                parameters.Add("@role_name", request.Role_Name);
                parameters.Add("@urole_id", 0);
                parameters.Add("@domains", JsonConvert.SerializeObject(domainIds));
                parameters.Add("@actions", JsonConvert.SerializeObject(actionIds));
                parameters.Add("@new_role_id", dbType: DbType.Int64, direction: ParameterDirection.Output);

                await _dataAccess.SaveData("USP_InsertRole_v14", parameters);

                var roleId = parameters.Get<long>("@new_role_id");

                return roleId;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
        public async Task<bool> Reassignroles(ReassignUsersRequest request)
        {
            try
            {
                foreach (var user in request.Users)
                {
                    var query = @"UPDATE cus_users 
                          SET user_role_id = @RoleId 
                          WHERE id = @UserId";

                    await _dataAccess.SaveDataInline(query, new
                    {
                        RoleId = user.RoleId,
                        UserId = user.UserId
                    });
                }


                return true;
            }
            catch(Exception ex)
            {
                return false;
            }
            
        }
        public async Task<long> AddRoleAsync(AdRoleRequest request, int id)
        {
            try
            {
                var domainIds = request.Role_Operation_Domains
                    .Select(x => x.Operation_Domain_Id);

                var actionIds = request.Role_Permissions ?? new List<RolePermissionDto>();

                var parameters = new DynamicParameters();

                parameters.Add("@role_name", request.Role_Name);
                parameters.Add("@urole_id", id);
                parameters.Add("@domains", JsonConvert.SerializeObject(domainIds));
                parameters.Add("@actions", JsonConvert.SerializeObject(actionIds));
                parameters.Add("@new_role_id", dbType: DbType.Int64, direction: ParameterDirection.Output);

                await _dataAccess.SaveData("USP_InsertRole_v15", parameters);

                var roleId = parameters.Get<long>("@new_role_id");

                return roleId;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
        public async Task<IEnumerable<roles>> RoleLookup()
        {
            var query = @"SELECT 
                      cur.id as code,
                      cur.name ,
                       STRING_AGG(crd.operation_domain_id, ',') AS domain_id
                      FROM Cus_UserRoles_v1 cur
                      LEFT JOIN cus_role_operation_domains crd on cur.id = crd.role_id
                      where
                      isnull(cur.is_active,0) = 1 and
                      isnull(cur.is_deleted,0) = 0
                      GROUP BY cur.id,cur.name";
            var parameters = new { };
            return await _dataAccess.GetDataInline<roles, dynamic>(query, parameters);
        }
        public async Task<IEnumerable<roles>> RoleLookup(int id)
        {
            var query = @"SELECT id as code, name as name FROM CUS_USERS WHERE USER_ROLE_ID = @id";
            var parameters = new DynamicParameters();
            parameters.Add("@id", id);
            return await _dataAccess.GetDataInline<roles, dynamic>(query, parameters);
        }
        public async Task<IEnumerable<roles>> RoleLookupwi(int id)
        {
            var query = @"SELECT cur.id AS code, cur.name AS name
                    FROM Cus_UserRoles_v1 cur
                    WHERE cur.id <> @id and
                    isnull(cur.is_active,0) = 1
                    AND ISNULL(cur.is_deleted, 0) = 0
                    
                    -- Must contain ALL domains of role 214
                    AND NOT EXISTS (
                        SELECT operation_domain_id
                        FROM cus_role_operation_domains
                        WHERE role_id = @id
                    
                        EXCEPT
                    
                        SELECT operation_domain_id
                        FROM cus_role_operation_domains
                        WHERE role_id = cur.id
                    )
                    
                    -- Must NOT have extra domains
                    AND NOT EXISTS (
                        SELECT operation_domain_id
                        FROM cus_role_operation_domains
                        WHERE role_id = cur.id
                    
                        EXCEPT
                    
                        SELECT operation_domain_id
                        FROM cus_role_operation_domains
                        WHERE role_id = @id
                       )";
            var parameters = new DynamicParameters();
            parameters.Add("@id", id);
            return await _dataAccess.GetDataInline<roles, dynamic>(query, parameters);
        }
        public async Task<IEnumerable<roles>> operationdomainLookup()
        {
            var query = "select id as code, domain_name as name from cus_operation_domains";
            var parameters = new { };
            return await _dataAccess.GetDataInline<roles, dynamic>(query, parameters);
        }
        public async Task<IEnumerable<roles>> mantisuserlookup()
        {
            var query = "\r\nselect usr_id  as code, usr_Login as name from lv_users";
            var parameters = new { };
            return await _dataAccess.GetDataInline<roles, dynamic>(query, parameters);
        }
        public async Task<IEnumerable<roles>> logisticSitelookup()
        {
            var query = "select Los_id  as code, los_description as name from COM_LogisticSite";
            var parameters = new { };
            return await _dataAccess.GetDataInline<roles, dynamic>(query, parameters);
        }
        public async Task<IEnumerable<mlogistcsite>> logisticSitelookup(int id)
        {
            var query = "select lua_LogisticSiteID  as logisticsiteid from COM_LSUserAccess  where lua_userid = @id";
            var dynamicParams = new DynamicParameters();
            dynamicParams.Add("@id", id);
            return await _dataAccess.GetDataInline<mlogistcsite, dynamic>(query, dynamicParams);
        }
        public async Task<int> DeactivateRole(int id)
        {
            try
            {
                var query = "UPDATE Cus_UserRoles_v1 SET is_active = 0 WHERE id = @id";

                var dynamicParams = new DynamicParameters();
                dynamicParams.Add("@id", id);

                return await _dataAccess.SaveDataInline(query, dynamicParams);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
        public async Task<int> activateRole(int id)
        {
            try
            {
                var query = "UPDATE Cus_UserRoles_v1 SET is_active = 1 WHERE id = @id";

                var dynamicParams = new DynamicParameters();
                dynamicParams.Add("@id", id);

                return await _dataAccess.SaveDataInline(query, dynamicParams);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<int> DeleteRole(int id)
        {
            try
            {
                var query = "UPDATE Cus_UserRoles_v1 SET is_deleted = 1 WHERE id = @id";

                var dynamicParams = new DynamicParameters();
                dynamicParams.Add("@id", id);

                return await _dataAccess.SaveDataInline(query, dynamicParams);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
    }
}
