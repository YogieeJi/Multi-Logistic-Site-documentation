using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(IAuthRepository authRepository, IHttpContextAccessor HttpContextAccessor)
        {
            _authRepository = authRepository;
            _httpContextAccessor = HttpContextAccessor;
        }
        public async Task<ServiceResult<User>> RegisterAsync(RegisterRequest request)
        {
            if (request.Password.Length < 6)
            {
                return new ServiceResult<User> { IsSuccess = false, ErrorMessage = "Password must be at least 6 characters long" };
            }
            // Check if email already exists
            var existingUser = await _authRepository.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return new ServiceResult<User> { IsSuccess = false, ErrorMessage = "Email is already taken" };
            }
            // Create the user
            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                Password = request.Password// Hash password securely
            };

            var createdUser = await _authRepository.AddUserAsync(user);

            return new ServiceResult<User> { IsSuccess = true, Data = createdUser };
        }
        public async Task<AuthReponse> GetUserLogin(string email, string password)
        {
            var authReponse = await _authRepository.GetUserLogin(email, password);

            if (authReponse == null)
            {
                throw new Exception("INVALID_CREDENTIALS");
            }

            return authReponse;
        }

        //public async Task<AuthReponse> GetUserLogin(string email, string password)
        //{
        //    try
        //    {
        //        var authReponse = await _authRepository.GetUserLogin(email, password);

        //        if (authReponse == null)
        //        {
        //            throw new InvalidOperationException("Invalid credentials or user not found.");
        //        }

        //        return authReponse;
        //    }
        //    catch (Exception ex)
        //    {
        //        // You could log the exception here if needed
        //        throw new InvalidOperationException("Error occurred while getting user login details.", ex);
        //    }
        //}

        public string GenerateToken(int userId, string username, string role)
        {
            try
            {
                return _authRepository.GenerateToken(userId, username, role);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Error occurred while generating the token.", ex);
            }
        }

        public async Task<string> RefreshToken()
        {
            return await _authRepository.RefreshToken();
        }
        public object RespondWithToken(string token)
        {
            // Check if _httpContextAccessor is null
            if (_httpContextAccessor == null)
            {
                return new { error = "HttpContextAccessor is not available" };
            }
            // Check if HttpContext is null
            if (_httpContextAccessor.HttpContext == null)
            {
                return new { error = "HttpContext is not available" };
            }

            // Get the user from HttpContext
            var user = _httpContextAccessor.HttpContext.User;

            // Check if user is null (this might happen if the user is not authenticated)
            if (user == null)
            {
                return new { error = "User is not authenticated" };
            }

            // Ensure user.Claims is not null before accessing it
            var claims = user.Claims;
            if (claims == null)
            {
                return new { error = "User claims are not available" };
            }

            // Retrieve user claims (e.g., id and email)
            var userId = claims.FirstOrDefault(c => c.Type == "Id")?.Value;
            var username = claims.FirstOrDefault(c => c.Type == "Email")?.Value;

            // Check if the claims are null or empty
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(username))
            {
                return new { error = "User claims are not available" };
            }

            // Return the response with dynamic user data
            return new
            {
                access_token = token,
                token_type = "bearer",
                expires_in = 3600, // Example: set to 1 hour or use a dynamic value
                user = new
                {
                    id = userId,
                    username = username
                }
            };
        }
        public UserModel GetCurrentUser(ClaimsPrincipal user)
        {
            if (user == null || !user.Identity.IsAuthenticated)
            {
                return null;
            }
            // Log or inspect the claims to see if they are available
            foreach (var claim in user.Claims)
            {
                Console.WriteLine($"Claim Type: {claim.Type}, Value: {claim.Value}");
            }

            var userId = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var email = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var fullName = user.Claims.FirstOrDefault(c => c.Type == "FullName")?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(fullName))
            {
                return null;
            }
            return new UserModel
            {
                id = int.Parse(userId),
                email = email,
                name = fullName
            };
        }


    }
}
