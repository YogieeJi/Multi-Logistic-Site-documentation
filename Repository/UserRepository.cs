using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using ExcelDataReader.Log;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;
using static MiddlewareWebAPI.Data.Model.UserType;

namespace MiddlewareWebAPI.Data.Repository
{
    public class UserRepository : IUserRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly IConfiguration _configuration;


        public UserRepository(ISqlDataAccess dataAccess, IConfiguration configuration)
        {
            _dataAccess = dataAccess;
            _configuration = configuration;
        }

        public async Task<IEnumerable<MantisUser>> GetMantisUsers()
        {
            var query = @"
                SELECT per_FirstName + ' ' + per_LastName as Name,
                       emp_ID,
                       emp_PersonID,
                       emp_ActiveLED,
                       LV_USERS.usr_login,
                       COM_Person.per_FirstName,
                       COM_Person.per_LastName,
                       COM_LogisticUnit.lou_Name,
                       usr_ID,
                       0 AS Tasks,
                       CASE WHEN usr_Login IN ('a', 't') THEN 'Yes' ELSE 'No' END AS IsActive
                FROM COM_Employee WITH (NOLOCK)
                INNER JOIN COM_Person WITH (NOLOCK) ON COM_Employee.emp_PersonID = COM_Person.per_ID
                INNER JOIN LV_USERS WITH (NOLOCK) ON LV_USERS.usr_PersonID = COM_Person.per_ID
                INNER JOIN COM_LogisticUnit WITH (NOLOCK) ON COM_Employee.emp_LogisticUnitID = COM_LogisticUnit.lou_ID
                WHERE lou_LogisticSiteID = 5 AND emp_ActiveLED = 1"
            ;

            var parameters = new DynamicParameters();
            return await _dataAccess.GetDataInline<MantisUser, dynamic>(query, parameters);

        }

        public async Task<UsersResponseop> GetUsers(UsersRequest request)
        {
            try
            {
                var query = @"
                       SELECT 
                    ROW_NUMBER() OVER (ORDER BY cu.id desc) AS sr_no,  -- Serial Number
                    cu.id,
                    cu.name as users_name,
                    cur.name AS role_name,
                    STRING_AGG(cod.domain_name, ',') AS domain_names,
                    cu.is_active,
                    cu.email,
                    Isnull((SELECT Count(*)
                    FROM   [dbo].cus_users cu
                    WHERE cu.id <> 1 and isnull(cu.is_active,0) = 1 and ISNULL(cu.is_deleted,0) = 0  ), 0)            AS [activeusersCount],
                    Isnull((SELECT Count(*)
                    FROM   [dbo].cus_users cu
                    WHERE  cu.id <> 1 and isnull(cu.is_active,0) = 0 and ISNULL(cu.is_deleted,0) = 0 ), 0)            AS [inactiveusersCount],
                    Isnull((SELECT Count(*)
                    FROM   [dbo].cus_users cu where cu.id <> 1 and ISNULL(cu.is_deleted,0) = 0 ), 0) AS [totalusersCount]
                    FROM cus_users cu
                  LEFT JOIN Cus_UserRoles_v1 cur ON cu.user_role_id = cur.id
                  LEFT JOIN cus_user_operation_domains cuo ON cu.id = cuo.user_id
                  LEFT JOIN cus_operation_domains cod ON cuo.operation_domain_id = cod.id
                  WHERE cu.id <> 1 and isnull(cu.is_deleted,0) = 0
                
                    
                ";

                var totalCountQuery = @"
                    SELECT COUNT(cu.id)
                    FROM Cus_Users cu WITH (NOLOCK)
                    LEFT JOIN Cus_UserRoles cur ON cur.id = cu.user_role_id
                    WHERE cu.id <> 1 and isnull(is_deleted,0) = 0
                ";

                var parameters = new DynamicParameters();
                if ((request.filters != null && request.filters.Count > 0) || request.is_active !=null)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            string columnName = filter.Key;
                            string paramName = filter.Value.value;


                            if (columnName.Equals("is_active", StringComparison.OrdinalIgnoreCase))
                            {
                                totalCountQuery += $"  AND isnull(CU.is_active,0) = {paramName}";
                                query += $"  AND isnull(CU.is_active,0) = {paramName}";
                            }
                            else
                            {
                                totalCountQuery += $" AND cu.name LIKE @searchValue";
                                // Search on name
                                query += $" AND cu.name LIKE @searchValue";
                                parameters.Add("@searchValue", "%" + filter.Value.value + "%");
                            }
                        }
                    }
                    if(request.is_active == 1)
                    {
                        totalCountQuery += $"  AND isnull(CU.is_active,0) = 1";
                        query += $"  AND isnull(CU.is_active,0) = 1";

                    }
                    else if(request.is_active == 0)
                    {
                        totalCountQuery += $"  AND isnull(CU.is_active,0) = 0";
                        query += $"  AND isnull(CU.is_active,0) = 0";
                    }
                        query += $" GROUP BY cu.id, cu.name, cur.name, cu.is_active, cu.email";
                }
                else
                {
                    query += $"  GROUP BY cu.id, cu.name, cur.name, cu.is_active,\tcu.email";
                }
                if (!string.IsNullOrEmpty(request.sortField) && !string.IsNullOrEmpty(request.sortOrder))
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";

                    // Map frontend fields to DB columns
                    var sortColumnMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                       { "id", "cu.id" },
                       { "users_name", "cu.name" },
                       { "email", "cu.email" },
                       { "role_name", "cur.name" } // 👈 special case handled here
                    };

                    if (sortColumnMap.ContainsKey(request.sortField))
                    {
                        query += $" ORDER BY {sortColumnMap[request.sortField]} {sortOrder}";
                    }
                    else
                    {
                        // fallback if unknown field
                        query += " ORDER BY cu.id DESC";
                    }
                }
                else
                {
                    // Default Laravel fallback
                    query += " ORDER BY cu.id DESC";
                }

                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                var result = await _dataAccess.GetDataInline<Usersop, dynamic>(query, parameters);



                // Get total count
                var totalCount = (await _dataAccess.GetDataInline<int, dynamic>(totalCountQuery, parameters))
                    .FirstOrDefault();

                return new UsersResponseop
                {
                    data = result.ToList(),
                    totalRecords = totalCount,
                    message = "Successful"
                };
            }
            catch (Exception ex)
            {
                throw new Exception("Internal Server Error | " + ex.Message);
            }
        }


        public async Task<UsersResponseop> GetUsersById(int id)
        {
            var query = @"
                    SELECT 
                    cu.created_at,
                    cu.email,
                    cu.email_verified_at,
                    cu.id,
                    cu.name AS users_name,
                    cu.token,
                    cu.updated_at,
                    cur.user_permissions AS user_roleraw,
                    cu.user_role_id,
                    cur.id AS role_id,
                    cur.name AS role_name,
                    cur.is_active AS role_is_active,
                    cur.created_at AS role_created_at,
                    cur.updated_at AS role_updated_at,
                
                    d.domain_names,
                    s.site_names,
                
                    cu.is_active,
                    cu.mantis_usr_id
                
                FROM Cus_Users AS cu WITH (NOLOCK)
                
                LEFT JOIN Cus_UserRoles_v1 cur 
                    ON cur.id = cu.user_role_id 
                
                -- ✅ Domain aggregation (separate)
                LEFT JOIN (
                    SELECT 
                        cuo.user_id,
                        STRING_AGG(cod.domain_name, ',') AS domain_names
                    FROM cus_user_operation_domains cuo
                    INNER JOIN cus_operation_domains cod 
                        ON cuo.operation_domain_id = cod.id
                    WHERE cuo.is_deleted = 0
                    GROUP BY cuo.user_id
                ) d ON d.user_id = cu.id
                
                -- ✅ Site aggregation (separate)
                LEFT JOIN (
                    SELECT 
                        CUL.user_id,
                        STRING_AGG(CLS.los_Description, ',') AS site_names
                    FROM cus_user_Logistic_site CUL
                    INNER JOIN COM_LogisticSite CLS 
                        ON CUL.Logistic_siteid = CLS.los_ID
                    GROUP BY CUL.user_id
                ) s ON s.user_id = cu.id
                
                WHERE cu.id = @id;"
            ;

            var parameters = new DynamicParameters();

            var result = await _dataAccess.GetDataInline<Usersop, dynamic>(query, new { id = id });



            return new UsersResponseop
            {

                data = result.ToList(),
                totalRecords = 0,
                message = "Successful"
            };

        }

        public async Task<IEnumerable<ColorMappingUsers>> GetAllUsers()
        {
            string query = "SELECT usr_ID, usr_Login FROM LV_Users ORDER BY usr_Login";
            return await _dataAccess.GetDataInline<ColorMappingUsers, dynamic>(query, new { });
        }

        public async Task<(IEnumerable<MappedUserResponse> Data, int TotalRecords)> GetMappedUsers(GridRequest request)
        {
            var whereClauses = new List<string>();
            var parameters = new DynamicParameters();

            if (request.filters != null)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Value.value))
                    {
                        var paramName = $"@{filter.Key}";
                        whereClauses.Add($"{filter.Key} LIKE {paramName}");
                        parameters.Add(paramName, $"%{filter.Value.value}%");
                    }
                }
            }

            var whereSql = whereClauses.Count > 0 ? "WHERE " + string.Join(" AND ", whereClauses) : "";

            string sortType = request.sortOrder == "1" ? "ASC" :
                              request.sortOrder == "-1" ? "DESC" : "";

            string orderBySql = !string.IsNullOrEmpty(request.sortField) && !string.IsNullOrEmpty(sortType)
                ? $"ORDER BY {request.sortField} {sortType}"
                : "ORDER BY e.id DESC";

            string query = $@"
                SELECT e.id, e.color, u.usr_Login AS usr_Login
                FROM Cus_Conv_EmployeeToColor e
                JOIN LV_Users u ON u.usr_ID = e.mantis_id
                {whereSql}
                {orderBySql}
                OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY;

                SELECT COUNT(*) 
                FROM Cus_Conv_EmployeeToColor e
                JOIN LV_Users u ON u.usr_ID = e.mantis_id
                {whereSql};
            ";

            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);


            var (data, totalCount) = await _dataAccess.GetDataInlineWithCount<MappedUserResponse, DynamicParameters>(query, parameters);

            return (data, totalCount);
        }

        public async Task<bool> AddOrUpdateUserColor(UserColorRequest request)
        {
            var existing = await _dataAccess.GetDataInline<int?, dynamic>(
                "SELECT id FROM Cus_Conv_EmployeeToColor WHERE mantis_id = @user_id",
                new { request.user_id });

            if (existing.Any())
            {
                // Update
                var rowsAffected = await _dataAccess.SaveDataInline(
                    "UPDATE Cus_Conv_EmployeeToColor SET color = @color_name WHERE mantis_id = @user_id",
                    new { request.color_name, request.user_id });
                return rowsAffected > 0;
            }
            else
            {
                // Insert
                var rowsAffected = await _dataAccess.SaveDataInline(
                    "INSERT INTO Cus_Conv_EmployeeToColor (color, mantis_id) VALUES (@color_name, @user_id)",
                    new { request.color_name, request.user_id });
                return rowsAffected > 0;
            }
        }

        public async Task<bool> UpdateColorToUser(int id, string color)
        {
            var sql = "UPDATE Cus_Conv_EmployeeToColor SET color = @Color WHERE id = @Id";
            var rowsAffected = await _dataAccess.SaveDataInline(sql, new { Id = id, Color = color });
            return rowsAffected > 0;
        }

        public async Task<bool> RemoveColorFromUser(int id)
        {
            var sql = "DELETE FROM Cus_Conv_EmployeeToColor WHERE id = @Id";
            var rowsAffected = await _dataAccess.SaveDataInline(sql, new { Id = id });
            return rowsAffected > 0;
        }

        public async Task<UserType> GetUserTypes(GridRequest request)
        {
            try
            {
                string whereClause = "";
                var parameters = new DynamicParameters();

                // Filtering
                if (request.filters != null)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrWhiteSpace(filter.Value.value))
                        {
                            whereClause += $" AND {filter.Key} LIKE @{filter.Key}";
                            parameters.Add($"@{filter.Key}", $"%{filter.Value.value}%");
                        }
                    }
                }

                // Sorting
                string sortColumn = !string.IsNullOrEmpty(request.sortField) ? request.sortField : "id";
                string sortOrder = request.sortOrder == "1" ? "ASC" :
                                   request.sortOrder == "-1" ? "DESC" : "DESC";

                // Pagination
                int skip = request.first;
                int take = request.rows;

                string baseQuery = $"FROM UserTypes WHERE 1=1 {whereClause}";
                string dataQuery = $"SELECT * {baseQuery} ORDER BY {sortColumn} {sortOrder} OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY";
                string countQuery = $"SELECT COUNT(*) {baseQuery}";

                parameters.Add("@Skip", skip);
                parameters.Add("@Take", take);

                var data = await _dataAccess.GetDataInline<UserTypes, dynamic>(dataQuery, parameters);
                var count = (await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters)).FirstOrDefault();

                return new UserType
                {
                    Data = data.ToList(),
                    TotalRecords = count,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in repo: {ex.Message}");
                return new UserType
                {
                    Data = new List<UserTypes>(),
                    TotalRecords = 0
                };
            }
        }

        public async Task<int> CreateUserType(UserTypeRequest userType)
        {
            string sql = "INSERT INTO UserTypes (type, path) VALUES (@Type, @Path); SELECT SCOPE_IDENTITY();";
            var parameters = new DynamicParameters();
            parameters.Add("@Type", userType.type);
            parameters.Add("@Path", userType.path);
            var result = await _dataAccess.SaveDataReturnInline<int>(sql, parameters);
            return result;
        }

        public async Task<UserTypeResponse> GetUserTypeById(int id)
        {
            var sql = "SELECT * FROM UserTypes WHERE Id = @Id";
            var result = await _dataAccess.GetDataInline<UserTypeResponse, dynamic>(sql, new { Id = id });
            return result.FirstOrDefault();
        }

        public async Task<bool> DeleteUserType(int id)
        {
            var sql = "DELETE FROM UserTypes WHERE Id = @Id";
            var rowsAffected = await _dataAccess.SaveDataInline(sql, new { Id = id });
            return rowsAffected > 0;
        }

        public async Task<UserTypes> GetUserById(int id)
        {
            {
                var sql = "SELECT * FROM UserTypes WHERE id = @Id";
                var result = await _dataAccess.GetFirstDataInline<UserTypes, dynamic>(sql, new { Id = id });
                return result.FirstOrDefault();

            }

        }

        public async Task<bool> UpdateUserType(int id, UpdateUserTypeRequest request)
        {
            var sql = @"
            UPDATE UserTypes
            SET Type = @Type,
                Path = @Path
            WHERE id = @id";

            var affectedRows = await _dataAccess.SaveDataInline(sql, new
            {
                request.type,
                request.path,
                id
            });

            return affectedRows > 0;
        }
        //public async Task<bool> UpdateUser(int id, UpdateUsers request)
        //{
        //    try
        //    {
        //        var epassword = BCrypt.Net.BCrypt.HashPassword(request.password);
        //        var sql = @"
        //          UPDATE Cus_Users
        //          SET name = @name,
        //          email = @email,
        //          user_role_id = @user_role_id,
        //          password = @epassword
        //          WHERE id = @id";

        //        var affectedRows = await _dataAccess.SaveDataInline(sql, new
        //        {
        //            request.name,
        //            request.email,
        //            request.user_role_id,
        //            epassword,
        //            id
        //        });

        //        return affectedRows > 0;
        //    }
        //    catch (Exception ex)
        //    {

        //        Console.WriteLine($"Exception: {ex.Message}");
        //        return false;
        //    }
        //}
        public async Task<bool> UpdateUser(int id, UpdateUsers request)
        {
            try
            {
                // ========================
                // 1️⃣ PASSWORD HANDLING
                // ========================
                string passwordSql = "";
                string? epassword = null;

                if (!string.IsNullOrWhiteSpace(request.password))
                {
                    epassword = BCrypt.Net.BCrypt.HashPassword(request.password);
                    passwordSql = ", password = @password";
                }

                // ========================
                // 2️⃣ UPDATE USER
                // ========================
                var updateSql = $@"
            UPDATE Cus_Users
            SET 
                name = @name,
                email = @email,
                user_role_id = @user_role_id,
                mantis_usr_id = @mantis_user_id
                {passwordSql}
            WHERE id = @id
        ";

                await _dataAccess.SaveDataInline(updateSql, new
                {
                    request.name,
                    request.email,
                    request.user_role_id,
                    mantis_user_id = request.mantis_user_id,
                    password = epassword,
                    id
                });

                // ========================
                // 3️⃣ DELETE OLD DOMAINS
                // ========================
                var deleteDomainSql = @"DELETE FROM cus_user_operation_domains WHERE user_id = @id";
                await _dataAccess.SaveDataInline(deleteDomainSql, new { id });

                // ========================
                // 4️⃣ INSERT NEW DOMAINS
                // ========================
                if (request.domains != null && request.domains.Any())
                {
                    foreach (var domainId in request.domains)
                    {
                        var insertDomainSql = @"
                    INSERT INTO cus_user_operation_domains 
                    (user_id, operation_domain_id, created_at, is_deleted)
                    VALUES (@user_id, @domain_id, GETDATE(), 0)
                ";

                        await _dataAccess.SaveDataInline(insertDomainSql, new
                        {
                            user_id = id,
                            domain_id = domainId
                        });
                    }
                }

                // ========================
                // 5️⃣ DELETE OLD SITES
                // ========================
                var deleteSiteSql = @"DELETE FROM cus_user_Logistic_site WHERE user_id = @id";
                await _dataAccess.SaveDataInline(deleteSiteSql, new { id });

                // ========================
                // 6️⃣ INSERT NEW SITES
                // ========================
                if (request.logistic_sites != null && request.logistic_sites.Any())
                {
                    foreach (var siteId in request.logistic_sites)
                    {
                        var insertSiteSql = @"
                    INSERT INTO cus_user_Logistic_site 
                    (user_id, Logistic_siteid, created_at, is_deleted)
                    VALUES (@user_id, @site_id, GETDATE(), 0)
                ";

                        await _dataAccess.SaveDataInline(insertSiteSql, new
                        {
                            user_id = id,
                            site_id = siteId
                        });
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return false;
            }
        }
        //public async Task<bool> CreateUser(Adduserrequest request)
        //{
        //    try
        //    {
        //        // Check if email already exists
        //        var query = @"SELECT COUNT(1) FROM Cus_Users WHERE email = @Email";

        //        var exists = (await _dataAccess.GetDataInline<int, dynamic>(query, new { Email = request.email })).FirstOrDefault();

        //        if (exists > 0)
        //        {
        //            return false;
        //        }

        //        // Hash password
        //        var epassword = BCrypt.Net.BCrypt.HashPassword(request.password);

        //        // Insert user
        //        var insertSql = @"
        //            INSERT INTO Cus_Users 
        //            (
        //                name,
        //                email,
        //                password,
        //                remember_token,
        //                created_at,
        //                updated_at,
        //                user_role_id,
        //                token
        //            )
        //            VALUES
        //            (
        //                @name,
        //                @email,
        //                @password,
        //                NULL,
        //                @created_at,
        //                @updated_at,
        //                @user_role_id,
        //                NULL
        //            );
        //        ";

        //        var affectedRows = await _dataAccess.SaveDataInline(insertSql, new
        //        {
        //            request.name,
        //            request.email,
        //            password = epassword,
        //            created_at = DateTime.UtcNow,
        //            updated_at = DateTime.UtcNow,
        //            request.user_role_id
        //        });

        //        return affectedRows > 0;
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine($"Exception: {ex.Message}");
        //        throw;
        //    }
        //}
        public async Task<bool> CreateUser(Adduserrequest request)
        {
            try
            {
                var epassword = BCrypt.Net.BCrypt.HashPassword(request.password);

                var query = @"
                      EXEC sp_CreateUser
                      @name,
                      @email,
                      @password,
                      @user_role_id,
                      @mantis_user_id,
                      @domains,
                      @logistic_sites
                ";

                var result = await _dataAccess.GetDataInline<dynamic, dynamic>(
                    query,
                    new
                    {
                        request.name,
                        request.email,
                        password = epassword,
                        request.user_role_id,
                        request.mantis_user_id,
                        domains = string.Join(",", request.domains),
                        logistic_sites = string.Join(",", request.logistic_sites)
                    }
                );

                var response = result.FirstOrDefault();

                return response?.success == 1;
            }
            catch (Exception ex)
            {
                throw new Exception("Error: " + ex.Message);
            }
        }

        public async Task<GetMantisAllUsersResponse> GetMantisAllUsers(GridRequest request)
        {
            try
            {
                int LogisticSiteId = 5;

                // Base FROM clause
                var baseQuery = "FROM V_Users WHERE 1=1";

                var filterBuilder = new StringBuilder();
                var parameters = new DynamicParameters();
                //parameters.Add("@LogisticSiteId", LogisticSiteId);

                // Whitelist of allowed filter keys (only columns you want to allow for filtering/sorting)
                var allowedFilterKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
               "usr_Name","usr_Address","usr_Login","LogisticSite" // <-- update this list as per your table
                };

                // Filter logic
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        string key = filter.Key?.Trim();

                        // Check for null/empty/whitespace or invalid key or space in key
                        if (string.IsNullOrWhiteSpace(key) || key.Contains(" ") || !allowedFilterKeys.Contains(key))
                            continue;

                        if (!string.IsNullOrWhiteSpace(filter.Value?.value))
                        {
                            string paramName = $"@{key}";
                            string filterValue = $"%{filter.Value.value.Trim()}%";

                            filterBuilder.Append($" AND {key} LIKE {paramName}");
                            parameters.Add(key, filterValue);
                        }
                    }
                }

                string whereClause = baseQuery + filterBuilder.ToString();

                // Main paginated query
                string query = $"SELECT * {whereClause}";

                // Count query
                string countQuery = $"SELECT COUNT(usr_ID) {whereClause}";

                // Sorting logic
                if (!string.IsNullOrWhiteSpace(request.sortField) &&
                    allowedFilterKeys.Contains(request.sortField.Trim()) &&
                    !request.sortField.Contains(" "))
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    query += $" ORDER BY {request.sortField.Trim()} {sortOrder}";
                }
                else
                {
                    query += " ORDER BY usr_ID Asc";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Execute queries
                var result = await _dataAccess.GetDataInline<GetMantisAllUsers, dynamic>(query, parameters);
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new GetMantisAllUsersResponse
                {
                    data = result,
                    totalRecords = totalCount.FirstOrDefault(),
                    message = "Successful"
                };
            }
            catch (Exception)
            {
                throw;
            }
        }




        public async Task<EmployeeGroupsResponse> GetEmployeeGroups()
        {
            var sql = "SELECT * FROM COM_EmployeeGroup";
            var result = await _dataAccess.GetDataInline<EmployeeGroups, dynamic>(sql, new { });
            return new EmployeeGroupsResponse
            {
                Data = result
            };
        }

        public async Task<UserCategoriesResponse> GetUserCategories()
        {
            var sql = "SELECT * FROM LV_UserCategory";
            var result = await _dataAccess.GetDataInline<UserCategories, dynamic>(sql, new { });
            return new UserCategoriesResponse
            {
                Data = result
            };
        }

        public async Task<ApisResponse> CreateMantisUsers(CreateMantisUsersRequest request)
        {
            try
            {
                if (request == null)
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = "Invalid request data."
                    };
                }

                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];
                var urlBase = "api/User/AddUser";

                var body = new
                {
                    Login = request.login,
                    Password = request.password,
                    FirstName = request.firstName,
                    LastName = request.lastName,
                    userCategoryIds = (request.userCategoryIds ?? new List<string>())
                    .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries)) // "1,4" → ["1","4"]
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)             // convert to int
                    .Where(id => id != 0).ToList(),

                    employeeGroupIds = (request.employeeGroupIds ?? new List<string>())
                        .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)             // ["1"] → [1]
                        .Where(id => id != 0).ToList(),

                    logisticSiteId = int.TryParse(request.logisticSiteID, out var siteId) ? siteId : 0

                };

                using var client = new HttpClient(new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                });

                client.BaseAddress = new Uri(baseUrl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

                var response = await client.PostAsync(urlBase, content);
                var jsonResponse = await response.Content.ReadAsStringAsync();

                var result = JsonConvert.DeserializeObject<dynamic>(jsonResponse);

                if (result == null)
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = "An error occurred while fetching the record."
                    };
                }

                return new ApisResponse
                {
                    Error = result.IsSuccess == true ? 0 : 1,
                    Message = result.Message
                };
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = $"User Creation Failed. Reason: {ex.Message}"
                };
            }

        }

        public async Task<LogisticSitesResponse> GetLogisticSites()
        {
            try
            {
                var sql = "SELECT * FROM COM_LogisticSite";
                var result = await _dataAccess.GetDataInline<LogisticSites, dynamic>(sql, new { });
                return new LogisticSitesResponse()
                {
                    Data = result
                };
            }
            catch (Exception)
            {
                {
                    throw;
                }

            }
        }

        public async Task<MantisUsersResponse> GetPaginatedMantisUsers(GridRequest request)
        {
            try
            {
                // Base query
                var baseQuery = @"
            SELECT 
                u.usr_ID, 
                u.usr_Login, 
                p.per_FirstName, 
                p.per_LastName, 
                u.usr_RFFolder
            FROM LV_Users u
            INNER JOIN COM_Person p ON u.usr_PersonID = p.per_id
            WHERE 1=1";

                var parameters = new DynamicParameters();

                // Apply filters
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            string filterValue = $"%{filter.Value.value}%";
                            baseQuery += $" AND {filter.Key} LIKE @{filter.Key}";
                            parameters.Add(filter.Key, filterValue);
                        }
                    }
                }

                // Count query (wrap base query)
                var countQuery = $"SELECT COUNT(1) FROM ({baseQuery}) AS subQuery";

                // Sorting
                string finalQuery = baseQuery;
                if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    finalQuery += $" ORDER BY {request.sortField} {sortOrder}";
                }
                else
                {
                    finalQuery += " ORDER BY u.usr_ID DESC";
                }

                // Pagination
                finalQuery += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<UserData, dynamic>(finalQuery, parameters);

                // Fetch Total Count (filters already applied in baseQuery)
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new MantisUsersResponse
                {
                    Data = result,
                    TotalRecords = totalCount.FirstOrDefault(),
                    Message = "Successfull"
                };
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching paginated mantis users", ex);
            }
        }

        public async Task<GetUserTypesResponse> GetUserTypesDropDown()
        {
            var sql = "Select * from UserTypes";
            var result = await _dataAccess.GetDataInline<GetUserTypes, dynamic>(sql, new { });
            return new GetUserTypesResponse
            {
                Data = result,
                Message = "Successfull"
            };

        }

        public async Task<LVUserResponse> GetMantisUserById(int id)
        {
            var sql = "SELECT usr_ID,Usr_Login, Usr_RFFolder FROM LV_Users WHERE usr_ID = @Id";
            var result = (await _dataAccess.GetDataInline<LVUserResponse, dynamic>(sql, new { Id = id })).FirstOrDefault();
            return result;
        }

        public async Task<int> UpdateUserFolder(int id, string usrFolder)
        {
            var sql = "UPDATE LV_Users SET Usr_RFFolder = @UsrFolder WHERE usr_ID = @Id";
            return await _dataAccess.SaveDataInline(sql, new { Id = id, UsrFolder = usrFolder });
        }

        public async Task<int> LogActivity(ActivityLog log)
        {
            var sql = @"
            INSERT INTO Cus_ActivityLog 
                (log_name, subject_ref, event, module_id, sub_module_id, properties, description, created_at)
            VALUES
                (@LogName, @SubjectRef, @Event, @ModuleId, @SubModuleId, @Properties, @Description, @CreatedAt)";

            var parameters = new
            {
                LogName = log.log_name,
                SubjectRef = log.subject_ref,
                Event = log.@event,
                ModuleId = log.module_id,
                SubModuleId = log.sub_module_id,
                Properties = log.properties,
                Description = log.description,
                CreatedAt = DateTime.UtcNow

            };

            return await _dataAccess.SaveDataInline(sql, parameters);
        }

        public async Task<int> DeactivateUser(int id, string Deactivate_reason)
        {
            try
            {
                var is_active = 0;
                if (Deactivate_reason == "Activate User -- No reason needed")
                {
                    is_active = 1;
                }
                var query = "UPDATE Cus_Users SET is_active = @is_active, Deactivate_reason = @Deactivate_reason, updated_at = GETDATE() WHERE id = @id";

                var dynamicParams = new DynamicParameters();
                dynamicParams.Add("@id", id);
                dynamicParams.Add("@Deactivate_reason", Deactivate_reason);
                dynamicParams.Add("@is_active", is_active);

                return await _dataAccess.SaveDataInline(query, dynamicParams);
            }
            catch (Exception ex)
            {
                return 0;
            }
        }
        public async Task<int> Deleteuser(int id)
        {
            try
            {
                var query = "UPDATE Cus_Users SET is_deleted = 1, updated_at = GETDATE() WHERE id = @id";
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
