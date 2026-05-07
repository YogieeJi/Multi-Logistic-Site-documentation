using System.Diagnostics.Contracts;
using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using MiddlewareWebAPI.Services.Services;

namespace MiddlewareWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;
        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpPost("get-roles")]
        public async Task<IActionResult> Index([FromBody] RolesRequest request)
        {
            try
            {
                var result = await _roleService.GetRolesGrid(request);
                var modifiedData = result?.data?.Select(user => new
                {
                    user.RoleId,
                    user.RoleName,
                    user.is_active,
                    user.created_at,
                    user.updated_at,
                    user.user_permissions, // Assuming you still want to keep this field // Add other fields you want to retain, but omit `user_permissionsraw`
                    user.status,
                    user.domains,
                    user.moduleCount,
                    user.modules,
                    user.usersCount
                }).ToList();
                return Ok(new { data = modifiedData, totalRecords = result?.totalRecords, activerolesCount = result.data.FirstOrDefault().activerolesCount, inactiverolesCount = result.data.FirstOrDefault().inactiverolesCount, totalrolesCount = result.data.FirstOrDefault().totalrolesCount, totalUsersAssigned = result.data.FirstOrDefault().totalUsersAssigned ,message = "Successfull" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = 1, message = $"Error while getting Roles: {ex.Message}" });
            }

        }
        [HttpPost("master-data")]
        public async Task<IActionResult> GetRoleMasterData()
        {
            var result = await _roleService.GetRoleMasterData();

            return Ok(new
            {
                success = true,
                data = result
            });
        }

        [HttpPost("get-role/{id}")]
        public async Task<IActionResult> Show(int id)

        {
            try
            {
                var result = await _roleService.GetRolesGridById(id);

                if (result == null)
                {
                    return NotFound(new { error = 1, message = "Role not found" });
                }

                return Ok(new
                {
                    error = 0,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = $"Error while getting role details: {ex.Message}"
                });
            }
        }
        [HttpPost("update-role/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AdRoleRequest request)
        {
            try
            {
                var response = await _roleService.UpdateRoleAsync(request, id);
                if (response == 0)
                {
                     return Ok(new
                    {
                        error = 1,
                        message = "Role Name Already Exist"
                    });
                }
                return Ok(new
                {
                    error = 0,
                    message = "User Role Updated Successfully"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while adding User Role | " + ex.Message
                });
            }
        }

        [HttpPost("add-role")]
        public async Task<IActionResult> Store([FromBody] AdRoleRequest request)
        {
            try
            {
                var response = await _roleService.AddRoleAsync(request);

                if (response.Error == 1 && response.Message == "Duplicate Roles are not allowed")
                {
                    return Ok(new
                    {
                        error = 1,
                        message = "Role Name Already Exist"
                    });
                }
                return Ok(new
                {
                    error = 0,
                    message = "User Role Added Successfully"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while adding User Role | " + ex.Message
                });
            }
        }

        [HttpPost("role-lookup")]
        public async Task<IActionResult> RoleLookup()
        {
            var result = await _roleService.RoleLookup();

            return Ok(new { data = result, error = 0 });

        }
        [HttpPost("role-lookupwi/{id}")]
        public async Task<IActionResult> RoleLookupwi(int id)
        {
            var result = await _roleService.RoleLookupwi(id);

            return Ok(new { data = result, error = 0 });

        }
        [HttpPost("get-roleassigned-users/{id}")]
        public async Task<IActionResult> roleassignedusers(int id)
        {
            var result = await _roleService.RoleLookup(id);

            return Ok(new { data = result, error = 0 });

        }
        [HttpPost("operationdomain-lookup")]
        public async Task<IActionResult> operationdomainLookup()
        {
            var result = await _roleService.operationdomainLookup();

            return Ok(new { data = result, error = 0 });

        }
        [HttpPost("mantisuser-lookup")]
        public async Task<IActionResult> mantisuserlookup()
        {
            var result = await _roleService.mantisuserlookup();

            return Ok(new { data = result, error = 0 });

        }
        [HttpPost("logisticsite-lookup")]
        public async Task<IActionResult> logisticSitelookup()
        {
            var result = await _roleService.logisticSitelookup();
            return Ok(new { data = result, error = 0 });
        }
        [HttpPost("get-mantisuser-site/{id}")]
        public async Task<IActionResult> mantisusersite(int id)
        {
            try
            {
                var result = await _roleService.logisticSitelookup(id);

                return Ok(new { data = result, error = 0 });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = $"Error while getting role details: {ex.Message}"
                });
            }
        }
        [HttpPost("deactivate-role/{id}")]
        public async Task<IActionResult> DeactivateRole(int id)
        {
            try
            {
                var response = await _roleService.DeactivateRole(id);

                if (response > 0)
                {
                    return Ok(new
                    {
                        error = 0,
                        message = "User Role Deactivated Successfully"
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        error = 1,
                        message = "Failed to deactivate user role "
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while Deactivating User Role | " + ex.Message
                });
            }
        }
        [HttpPost("activate-role/{id}")]
        public async Task<IActionResult> activateRole(int id)
        {
            try
            {
                var response = await _roleService.activateRole(id);

                if (response > 0)
                {
                    return Ok(new
                    {
                        error = 0,
                        message = "User Role activated Successfully"
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        error = 1,
                        message = "Failed to activate user role "
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while activating User Role | " + ex.Message
                });
            }
        }

        [HttpPost("delete-role/{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            try
            {
                var response = await _roleService.DeleteRole(id);

                if (response > 0)
                {
                    return Ok(new
                    {
                        error = 0,
                        message = "User Role Deleted Successfully"
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        error = 1,
                        message = "Failed to Delete user role"
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while Deleting User Role | " + ex.Message
                });
            }
        }

        [HttpPost("reassign-users")]
        public async Task<IActionResult> Reassignroles([FromBody] ReassignUsersRequest request)
        {
            try
            {
                var response = await _roleService.Reassignroles(request);

                return Ok(new
                {
                    error = response.Error,
                    message = response.Message,
                    data = response.Data
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = 1,
                    message = "Error while reassigning users | " + ex.Message
                });
            }
        }

    }
}
