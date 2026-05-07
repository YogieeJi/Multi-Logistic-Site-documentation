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
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            
            _dashboardService = dashboardService;
        }

        #region ORDER DASHBOARD
        [HttpPost("get-order-short-data")]
        public async Task<IActionResult> GetOrderShortData([FromBody] OrderShortDataRequest request)
        {
            try
            {
                var result = await _dashboardService.GetOrderShortData(request);
                if (result.Error == 1)
                    return Ok(new { error = 1, result });

                return Ok(new
                {
                    data = new
                    {
                        grid_data = result.Data?.Grid_Data
                    },
                    error = 0,
                    message = "Successful"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }

        }

        [HttpPost("get-task-management")]
        public async Task<IActionResult> GetTaskManagement()
        {
            try
            {
                var result = await _dashboardService.GetTaskManagement();
                if (result.Error == 1)
                    return Ok(new { error = 1, message = result.Message });

                return Ok(new { data = result.Tasks, error = 0,  message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        [HttpPost("updateTaskStatus")]
        public async Task<IActionResult> UpdateTaskStatus([FromBody] TaskModelRequest request)
        {
            try
            {
                var result = await _dashboardService.UpdateTaskStatus(request);

                if (result.IsSuccess)
                    return Ok(new { error = 0, message = result.Message });
                else
                    return Ok(new { error = 1, message = result.Message });
            }
            catch(Exception ex)
            {
                return StatusCode(500, new { error = 1, message = ex.Message });
            }
        }

        #endregion


        #region TRUCK DASHBOARD
        [HttpPost("get-truck-data")]
        public async Task<IActionResult> GetAllOrderTruck([FromBody] GridRequest request)
        {
            try
            {
                var result = await _dashboardService.GetAllOrderTruck(request);
                if (result.Error == 1)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new { data = result.Data, error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Error while syncing data | " + ex.Message });
            }
        }

        [HttpPost("get-truck-order-detail/{id}")]
        public async Task<IActionResult> GetTruckOrderDetail(int id)
        {
            try
            {
                var result = await _dashboardService.GetTruckOrderDetail(id);
                if (result.Error == 1)
                {
                    return Ok(new { error = result.Error, message = result.Message });
                }
                else
                {
                    return Ok(new { data = result.Data, error = result.Error, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion

        #region SHIPPING DASHBOARD
        [HttpPost("get-shipping")]
        public async Task<IActionResult> GetShippingConveyor([FromBody] GridRequest request)
        {
            try
            {
                var result = await _dashboardService.GetShippingConveyor(request);
                if (result.Error == 1) 
                {
                    return Ok(new { error = 1, totalRecords = result.TotalCount, message = result.Message });
                }
                return Ok(new { error = 0, data = result.Data, totalRecords = result.TotalCount, message = "Successful" });
            }
            catch (Exception ex)
            {
                return Ok(new { error = 1, message = "Error while syncing data | " + ex.Message });
            }
        }
        #endregion


        #region TASK DASHBOARD

        [HttpPost("get-task-dashboard")]
        public async Task<IActionResult> GetTaskDashboard([FromBody] TaskDashboardRequest request)
        {
            try
            {
                var data = await _dashboardService.GetTaskDashboardAsync(request);
                var totalRecords = data.data.data.Count();

                return Ok(new { data.data, totalRecords = totalRecords, message = "Success" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = 1, message = "Error while fetching data: " + ex.Message });
            }
        }
        #endregion

        #region CONVEYOR DASHBOARD

        [HttpPost("getPalletInfo")]
        public async Task<IActionResult> GetPalletInfo([FromBody] PalletInfoRequest request)
        {
            var result = await _dashboardService.GetPalletInfo(request);
            if(result.Error == 0)
            {
                return Ok(new
                {
                    error = result.Error,
                    message = result.Message,
                    data = result.Data != null ? new { grid_data = result.Data } : null
                });
            }
            else
            {
                return Ok(new
                {
                    error = result.Error,
                    message = result.Message
                });
            }
        }

        #endregion
    }
}
