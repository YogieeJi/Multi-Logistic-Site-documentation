using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/Auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _IAuthService;
        private readonly IAuthRepository _authRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AuthController(IAuthService iAuthService, IAuthRepository authRepository, IHttpContextAccessor httpContextAccessor)
        {
            _IAuthService = iAuthService;
            _authRepository = authRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new { error = "All fields are required" });
                }

                var result = await _IAuthService.RegisterAsync(request);

                if (result.IsSuccess)
                {
                    return Ok(new { message = "User created successfully", data = result.Data });
                }

                return BadRequest(new { error = result.ErrorMessage });
            }
            catch (Exception ex)
            {
                // Log the error (you can use a logger in production)
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login(UserRequest userRequest)
        {
            string msg = string.Empty;
            try
            {
                if (string.IsNullOrEmpty(userRequest.email) || string.IsNullOrEmpty(userRequest.password))
                {
                    return BadRequest(new { msg = "Invalid input parameters" });
                }

                var result = await _IAuthService.GetUserLogin(userRequest.email, userRequest.password);

                if (result != null)
                {
                    return Ok(result);
                }
                else
                {
                    msg = "Invalid user credentials";
                    return Unauthorized(new { msg });
                }
            }
            catch (Exception ex)
            {
                if (ex.Message == "USER_DELETED")
                {
                    return Unauthorized(new { msg = "Invalid user Credentials" });
                }

                if (ex.Message == "USER_INACTIVE")
                {
                    return Unauthorized(new { msg = "Your account is inactive at the moment. Please contact Administrator !" });
                }

                if (ex.Message == "INVALID_CREDENTIALS")
                {
                    return Unauthorized(new { msg = "Invalid user credentials" });
                }

                return StatusCode(500, new { msg = "Something went wrong" });
            }
        }
        

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                HttpContext.Session.Clear();
                await HttpContext.SignOutAsync();
                return Unauthorized(new { message = "Successfully logged out" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred during logout: {ex.Message}" });
            }
        }

        [HttpPost("authenticate")]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var token = await _IAuthService.RefreshToken();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new { message = "Unable to refresh token" });
            }

            return Ok(_IAuthService.RespondWithToken(token));
        }

        [HttpGet("me")]
        public IActionResult Me()
        {
            var user = _IAuthService.GetCurrentUser(User); // Get the current authenticated user from the claims
            if (user == null)
            {
                return Unauthorized(); // If no user is found, return unauthorized
            }

            return Ok(user); // Return the user data as JSON
        }

        [HttpPost("unauthorized")]
        public IActionResult Unauthorize()
        {
            return Unauthorized(new { message = "Unauthorized" });
        }

    }
}
