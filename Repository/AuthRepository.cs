using System.ComponentModel;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Web.Helpers;
using System.Xml.Linq;
using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Middleware.Data.Repository
{
    public class AuthRepository : IAuthRepository
    {
        private readonly IConfiguration _configuration;
        private readonly ISqlDataAccess _sqlDataAccess;

        public AuthRepository(IConfiguration configuration, ISqlDataAccess sqlDataAccess)
        {
            _configuration = configuration;
            _sqlDataAccess = sqlDataAccess;
        }
        public async Task<User> AddUserAsync(User user)
        {
            var query = "INSERT INTO Cus_Users (Name, Email, Password) VALUES (@Name, @Email, @Password); SELECT CAST(SCOPE_IDENTITY() as int);";
            var id = await _sqlDataAccess.GetDataInline<int, dynamic>(query, new { user.Name, user.Email, user.Password });
            user.Id = id.FirstOrDefault();
            return user;
        }
        public async Task<User> GetUserByEmailAsync(string email)
        {
            var query = "SELECT Id, Name, Email, Password FROM Cus_Users WHERE Email = @Email";
            var users = await _sqlDataAccess.GetDataInline<User, dynamic>(query, new { Email = email });
            return users.FirstOrDefault();
        }

        //public async Task<AuthReponse?> GetUserLogin(string Email, string password)
        //{
        //    AuthReponse authReponse = new AuthReponse();
        //    try
        //    {
        //        // Retrieve the user from the database by email
        //        var result = await _sqlDataAccess.GetData<UserModel, dynamic>("[dbo].[Cus_Sp_GetUserByEmailId_v2]",
        //            new { Email = Email, password = password } // Only pass the email for retrieval
        //        );
        //        if (result == null || !result.Any())
        //            return null;

        //        var user = result.FirstOrDefault();

        //        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.password);
        //        if (!isPasswordValid)
        //            return null; // Incorrect password

        //        if (user == null)
        //        {
        //            return null; // Null user
        //        }

        //        var result1 = await _sqlDataAccess.GetData<Userss, dynamic>("[dbo].[Cus_Sp_GetUserByEmailId_v2]",
        //            new { Email = Email, password = password } // Only pass the email for retrieval
        //        );
        //        foreach (var userS in result1)
        //        {
        //            if (!string.IsNullOrEmpty(userS.user_permissionsraw))
        //            {
        //                try
        //                {
        //                    userS.user_permissions = JsonConvert.DeserializeObject<UserPermission>(userS.user_permissionsraw);
        //                }
        //                catch { userS.user_permissions = null; }
        //            }
        //            userS.user_permissionsraw = null;
        //            if (userS.is_active != "1" && userS.is_active != "0" && userS.is_active != null)
        //            {
        //                userS.is_active = userS.is_active.ToLower() == "true" ? "1" : "0";
        //            }
        //        }

        //        // If the password is valid, generate the token
        //        string token = GenerateToken(user.id, user.name, user.email);
        //        var Data = result1.FirstOrDefault();
        //        authReponse.user = user;
        //        authReponse.access_token = token;
        //        authReponse.token_type = "bearer";
        //        authReponse.user.user_role = Data; // Assign single object instead of list
        //        authReponse.expires_in = 18000;

        //        return authReponse;
        //    }
        //    catch (Exception ex)
        //    {
        //        // Log the exception or rethrow it to handle it elsewhere
        //        throw new InvalidOperationException("An error occurred while getting user login details.", ex);
        //    }
        //}
        public async Task<AuthReponse?> GetUserLogin(string Email, string password)
        {
            try
            {
                var result = await _sqlDataAccess.GetData<UserModel, dynamic>(
                    "[dbo].[Cus_Sp_GetUserByEmailId_v3]",
                    new { Email = Email, Password = password }
                );

                if (result == null || !result.Any())
                    return null;

                var user = result.FirstOrDefault();
                if (user == null)
                    return null;

                //  1. CHECK DELETED USER
                if (user.is_deleted)
                {
                    throw new Exception("USER_DELETED");
                }

                //  2. CHECK ACTIVE USER
                if (!user.user_is_active)
                {
                    throw new Exception("USER_INACTIVE");
                }

                //  3. PASSWORD VALIDATION
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.password);
                if (!isPasswordValid)
                    return null;

                //  4. PERMISSIONS
                if (!string.IsNullOrEmpty(user.actionbasepermission))
                {
                    try
                    {
                        user.actionPermissions = JsonConvert.DeserializeObject<List<ActionPermission>>(
                            user.actionbasepermission
                        );
                    }
                    catch
                    {
                        user.actionPermissions = new List<ActionPermission>();
                    }
                }
                else
                {
                    user.actionPermissions = new List<ActionPermission>();
                }

                //  5. TOKEN
                string token = GenerateToken(user.id, user.name, user.email);

                return new AuthReponse
                {
                    user = user,
                    access_token = token,
                    token_type = "bearer",
                    expires_in = 18000
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public string GenerateToken(int userId, string userCode, string Email)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, userCode),
                new Claim(ClaimTypes.Email, Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"])); // Secret key for signing the JWT
            double accessTokenExpirationMinutes = Convert.ToDouble(jwtSettings["AccessTokenExpirationMinutes"]); // AccessTokenExpirationMinutes for signing the JWT
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(accessTokenExpirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        //private string GenerateRefreshToken() {
        //    var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        //    return refreshToken;
        //}

        public async Task<string> RefreshToken()
        {
            var query = "SELECT isnull(remember_token,'') as remember_token FROM Cus_Users";
            var token = await _sqlDataAccess.GetDataInline<string, dynamic>(query, new { });
            return token.FirstOrDefault();
        }
        public async Task<User> GetUserByIdAsync(int userId)
        {
            var query = "SELECT * FROM Cus_Users WHERE Id = @UserId";
            var user = await _sqlDataAccess.GetDataInline<User, dynamic>(query, new { UserId = userId });
            return user.FirstOrDefault(); 
        }

    }
}
