using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IItemConversionService _service;

        public UserController(IUserService userService, IItemConversionService itemConversionService)
        {
            _userService = userService;
            _service = itemConversionService;
        }

        [HttpPost("get-mantis-users")]
        public async Task<IActionResult> GetMantisUsers()
        {
            var users = await _userService.GetMantisUsers();
            return Ok(new { data = users, error = 0 });
        }

        //[HttpPost("get-users")]
        //public async Task<IActionResult> GetUsers(UsersRequest request)
        //{
        //    var users = await _userService.GetUsers(request);
        //    var modifiedData = users.data.Select(user => new
        //    {
        //        user.id,
        //        user.name,
        //        user.email,
        //        user.created_at,
        //        user.updated_at,
        //        user.email_verified_at,
        //        user.token,
        //        user.user_role_id,
        //        user.user_role

        //    }).ToList();
        //    return Ok(new { data = modifiedData, totalRecords = users.totalRecords, message = users });
        //}
        [HttpPost("get-users")]
        public async Task<IActionResult> GetUsers(UsersRequest request)
        {
            var users = await _userService.GetUsers(request);
            var first = users.data.FirstOrDefault();
            return Ok(new
            {
                data = users.data,   // ✅ RETURN DIRECT
                totalRecords = users.totalRecords,
                activeusersCount = first?.activeusersCount ?? 0,
                inactiveusersCount = first?.inactiveusersCount ?? 0,
                totalusersCount = first?.totalusersCount ?? 0,
                message = users.message
            });
        }

        [HttpPost("get-user/{id}")]
        public async Task<IActionResult> GetUsers(int id)
        {
            var users = await _userService.GetUsersById(id);

            return Ok(new
            {
                data = users.data
            });
        }

        [HttpGet("get-all-users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsers();
                return Ok(new { data = users, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }

        }

        [HttpPost("get-mapped-users")]
        public async Task<IActionResult> GetMappedUsers([FromBody] GridRequest request)
        {
            try
            {
                var (data, total) = await _userService.GetMappedUsers(request);
                return Ok(new { data, totalRecords = total, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("add-color-user")]
        public async Task<IActionResult> AddColorToUser([FromBody] UserColorRequest request)
        {
            var (success, message) = await _userService.AddOrUpdateUserColor(request);
            if (success)
                return Ok(new { error = 0, message });
            else
                return StatusCode(500, new { error = 1, message });
        }

        [HttpPost("update-color-user")]
        public async Task<IActionResult> UpdateColorToUser([FromBody] UpdateColorRequest request)
        {
            var result = await _userService.UpdateColorToUser(request.id, request.color_name);
            if (result.IsSuccess)
                return Ok(new { error = 0, message = result.Message });

            return BadRequest(new { error = 1, message = result.Message });
        }

        [HttpPost("remove-color-user")]
        public async Task<IActionResult> RemoveColorFromUser([FromBody] RemoveColorRequest request)
        {
            var result = await _userService.RemoveColorFromUser(request.id);

            if (result.IsSuccess)
                return Ok(new { error = 0, message = result.message });

            return BadRequest(new { error = 1, message = result.message });
        }

        [HttpPost("get-user-types")]
        public async Task<IActionResult> GetUserTypes([FromBody] GridRequest request)
        {
            try
            {
                var result = await _userService.GetUserTypes(request);
                return Ok(new { data = result.Data, totalRecords = result.TotalRecords, message = "Successful" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("create-user-types")]
        public async Task<IActionResult> CreateUserType([FromBody] UserTypeRequest userType)
        {
            if (string.IsNullOrWhiteSpace(userType.path) || string.IsNullOrWhiteSpace(userType.type))
            {
                return Ok(new { error = 1, message = "Please Fill Required Feilds." });
            }

            var result = await _userService.CreateUserType(userType);

            if (result.IsSuccess)
                return Ok(new { error = 0, message = result.Message });

            return BadRequest(new { error = 1, message = result.Message });
        }

        [HttpPost("delete-user-types/{id}")]
        public async Task<IActionResult> DeleteUserType(int id)
        {
            try
            {
                var (isSuccess, message) = await _userService.DeleteUserType(id);

                if (isSuccess)
                {
                    return Ok(new { error = 0, message });
                }
                else
                {
                    return NotFound(new { error = 1, message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = $"Error while deleting User Type | {ex.Message}" });
            }
        }

        [HttpPost("edit-user-types/{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var Data = await _userService.GetUserById(id);

                if (Data == null)
                {
                    return NotFound(new
                    {
                        error = 1,
                        message = "User Type not found"
                    });
                }

                return Ok(new
                {
                    error = 0,
                    data = Data,
                    message = "Successfully retrieved User Type data"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Internal Server Error | " + ex.Message
                });
            }
        }

        [HttpPost("update-user-types/{id}")]
        public async Task<IActionResult> UpdateUserType(int id, [FromBody] UpdateUserTypeRequest request)
        {
            try
            {

                var updated = await _userService.UpdateUserType(id, request);

                if (!updated)
                {
                    return NotFound(new { error = 1, message = "User Type not found" });
                }

                return Ok(new { error = 0, message = "User Type updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Error while updating User Type | " + ex.Message });
            }
        }
        [HttpPost("update-user/{id}")]
        public async Task<IActionResult> update(int id, [FromBody] UpdateUsers request)
        {
            try
            {

                var updated = await _userService.UpdateUser(id, request);

                if (!updated)
                {
                    return NotFound(new { error = 1, message = "User not found" });
                }

                return Ok(new { error = 0, message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Error while updating User | " + ex.Message });
            }
        }
        [HttpPost("add-user")]
        public async Task<IActionResult> store([FromBody] Adduserrequest request)
        {
            try
            {
                var result = await _userService.CreateUser(request);

                if (!result)
                {
                    return Ok(new { error = 1, message = "Email already exists." });
                }

                return Ok(new { error = 0, message = "User created successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = 1,
                    message = "Error while creating user | " + ex.Message
                });
            }
        }

        [HttpPost("get-all-users")]
        public async Task<IActionResult> getallusers()
        {
            try
            {
                var result = await _service.GetAllUsers();
                return Ok(new
                {
                    data = result.data,
                    message = "Successful",
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }

        [HttpPost("get-mantis-all-users")]
        public async Task<IActionResult> GetMantisAllUsers([FromBody] GridRequest request)
        {
            try
            {

                var result = await _userService.GetMantisAllUsers(request);
                return Ok(result);

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Error while updating User | " + ex.Message });
            }
        }

        [HttpPost("employee-groups")]
        public async Task<IActionResult> GetEmployeeGroups()
        {
            try
            {
                var data = await _userService.GetEmployeeGroups();
                return Ok(new
                {
                    data = data.Data,
                    message = "Employee groups fetched successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal Server Error | " + ex.Message
                });
            }

        }

        [HttpPost("user-categories")]
        public async Task<IActionResult> GetUserCategories()
        {
            try
            {
                var data = await _userService.GetUserCategories();
                return Ok(new
                {
                    data = data.Data,
                    message = "User categories fetched successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal Server Error | " + ex.Message
                });
            }

        }

        [HttpPost("logistic-sites")]
        public async Task<IActionResult> GetLogisticSites()
        {
            try
            {
                var reesult = await _userService.GetLogisticSites();
                return Ok(new
                {
                    data = reesult.Data,
                    message = "Logistic Sites fetched successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal Server Error | " + ex.Message
                });
            }

        }

        [HttpPost("create-mantis-users")]
        public async Task<IActionResult> CreateMantisUsers(CreateMantisUsersRequest request)
        {
            try
            {
                var data = await _userService.CreateMantisUsers(request);
                return Ok(new
                {
                    error = data.Error,
                    message = data.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal Server Error | " + ex.Message
                });
            }

        }
        [HttpPost("mantis-users")]
        public async Task<IActionResult> GetPaginatedMantisUsers(GridRequest request)
        {
            try
            {
                var users = await _userService.GetPaginatedMantisUsers(request);
                return Ok(new { data = users.Data, totalRecords = users.TotalRecords, message = users.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }

        }
        [HttpGet("get-user-types-lookups")]
        public async Task<IActionResult> GetUserTypesDropDown()
        {
            try
            {
                var result = await _userService.GetUserTypesDropDown();

                return Ok(new { data = result.Data, message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("update-mantis-user-path")]
        public async Task<IActionResult> UpdateMantisUserPath([FromBody] UpdateMantisUserPathRequest request)
        {
            try
            {
                var result = await _userService.UpdateMantisUserPath(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error | " + ex.Message });
            }
        }
        [HttpPost("deactivate-user")]
        public async Task<IActionResult> Deactivateuser(int id, string Deactivate_reason)
        {
            try
            {
                var response = await _userService.DeactivateUser(id, Deactivate_reason);

                if (response > 0)
                {
                    if (Deactivate_reason == "Activate User -- No reason needed")
                    {
                        return Ok(new
                        {
                            error = 0,
                            message = "User Activated Successfully"
                        });
                    }
                    else
                    {
                        return Ok(new
                        {
                            error = 0,
                            message = "User Deactivated Successfully"
                        });
                    }

                }
                else
                {
                    return BadRequest(new
                    {
                        error = 1,
                        message = "Failed to deactivate user"
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while Deactivating User | " + ex.Message
                });
            }
        }
        [HttpPost("delete-user")]
        public async Task<IActionResult> Deleteuser([FromBody] int id)
        {
            try
            {
                var response = await _userService.Deleteuser(id);

                if (response > 0)
                {
                    return Ok(new
                    {
                        error = 0,
                        message = "User Deleted Successfully"
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        error = 1,
                        message = "Failed to Delete user"
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while Deleting User | " + ex.Message
                });
            }
        }
    }
}
