using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Org.BouncyCastle.Asn1.Ocsp;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MiddlewareWebAPI.Services.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _dashboardRepository;

        public DashboardService(IDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<ApiResult<OrderShortDataRowResponse>> GetOrderShortData(OrderShortDataRequest request)
        {
            try
            {
                var rows = (await _dashboardRepository.GetOrderShortData(request)).ToList();

                if (!rows.Any())
                    return new ApiResult<OrderShortDataRowResponse> { Error = 0, Message = "No record found" };

                var orderStatusData = rows
                    .Where(r => !string.IsNullOrEmpty(r.pst_MessageCode))
                    .GroupBy(r => r.pst_MessageCode)
                    .Select(g => new ChartDataPoint { Label = g.Key, Y = g.Count() })
                    .ToList();

                var itemInformation = new List<ChartDataPoint>
                {
                    new ChartDataPoint { Label = "Missing Info", Y = rows.Count(r => r.ItemIssues == "Missing_Info") },
                    new ChartDataPoint { Label = "No Stock", Y = rows.Count(r => r.Qty_Free == "no Stock") }
                };

                var actualQty = rows
                    .GroupBy(r => r.Prd_PrimaryCode)
                    .Select(g => new ChartDataPoint { Label = g.Key, Y = g.Sum(x => x.Qty) })
                    .ToList();

                var innerQty = rows
                    .GroupBy(r => r.Prd_PrimaryCode)
                    .Select(g => new ChartDataPoint { Label = g.Key, Y = g.Sum(x => x.Inner_Qty) })
                    .ToList();

                return new ApiResult<OrderShortDataRowResponse>
                {
                    Error = 0,
                    Message = "Successful",
                    Data = new OrderShortDataRowResponse
                    {
                        Grid_Data = rows,
                        OrderStatusData = orderStatusData,
                        ItemInformation = itemInformation,
                        ItemActualQtyCount = actualQty,
                        ItemInnerQtyCount = innerQty
                    }
                };
            }
            catch (Exception ex)
            {
                return new ApiResult<OrderShortDataRowResponse> { Error = 1, Message = $"Internal Server Error | {ex.Message}" };
            }
        }

        public async Task<TaskManagementResponse> GetTaskManagement()
        {
            return await _dashboardRepository.GetTaskManagement();
        }

        public async Task<CommonResponseModel> UpdateTaskStatus(TaskModelRequest request)
        {
            try
            {
                bool updated = await _dashboardRepository.UpdateTaskStatus(request?.Task?.Tsk_ID, 1);
                return new CommonResponseModel
                {
                    IsSuccess = updated,
                    Message = updated ? "Task status updated successfully." : "No matching task found or already updated."
                };
            }
            catch (Exception ex)
            {
                return new CommonResponseModel
                {
                    IsSuccess = false,
                    Message = ex.Message
                };
            }
        }


        public async Task<TruckGridResponse> GetAllOrderTruck(GridRequest request)
        {
            var data = await _dashboardRepository.GetTruckQuery(request);

            // Apply filters
            if (request.filters != null && request.filters.Any())
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrWhiteSpace(filter.Value.value))
                    {
                        data = data.Where(t =>
                            (t.GetType().GetProperty(filter.Value.value)?.GetValue(t)?.ToString() ?? "")
                            .Contains(filter.Value.value, StringComparison.OrdinalIgnoreCase)
                        ).ToList();
                    }
                }
            }

            // Sort
            if (!string.IsNullOrWhiteSpace(request.sortField))
            {
                bool ascending = request.sortOrder == "1";
                data = ascending
                    ? data.OrderBy(d => d.GetType().GetProperty(request.sortField)?.GetValue(d)).ToList()
                    : data.OrderByDescending(d => d.GetType().GetProperty(request.sortField)?.GetValue(d)).ToList();
            }

            var totalCount = data.Count;
            var responseData = data.Skip(request.first).Take(request.rows).ToList();

            return new TruckGridResponse
            {
                Data = responseData,
                TotalRecords = totalCount,
                Message = "Successful"
            };
        }

        public async Task<TruckOrderDetailResponse> GetTruckOrderDetail(int id)
        {
            var result = await _dashboardRepository.GetTruckOrderDetail(id);

            return new TruckOrderDetailResponse
            {
                Data = result.Data,
                Error = result.Error,
                Message = result.Message,
            };
        }

        public async Task<ShippingConveyorResponse> GetShippingConveyor(GridRequest request)
        {
            var resutl = await _dashboardRepository.GetShippingConveyor(request);
            return new ShippingConveyorResponse 
            {
                Data = resutl.Data,
                Error = resutl.Error,
                Message = resutl.Message,
                TotalCount = resutl.TotalCount
            };
        }
       public async Task<TaskDashboardResponse> GetTaskDashboardAsync(TaskDashboardRequest request)
       {
          return await _dashboardRepository.GetTaskDashboardAsync(request);
       }

        public async Task<PalletInfoResponse> GetPalletInfo(PalletInfoRequest request)
        {
            if (string.IsNullOrEmpty(request.Order_Code))
                return new PalletInfoResponse { Error = 1, Message =  "order_code is required", Data = null };

            var result = await _dashboardRepository.GetPalletInfo(request);

            if (result != null && result.Any())
            {
                return new PalletInfoResponse { Error = 0, Message = "Successful", Data =  result };
            }

            return new PalletInfoResponse { Error = 0, Message = "No record found", Data = null };
        }


        //public async Task<taskdashboardResponse> getTaskDashboard(taskdashboardrequest request)
        //{
        //    try
        //    {

        //        var lazyState = request.lazyState ?? new LazyStates();
        //        var cursor = lazyState.cursor;

        //        var dateFrom = request.dateFrom;
        //        var dateTo = request.dateTo;

        //        var sortField = string.IsNullOrEmpty(lazyState.sortField) ? "tsk_ID" : lazyState.sortField;
        //        var sortOrder = lazyState.sortOrder == "-1" ? "desc" : "asc";
        //        var rows = lazyState.rows as int? ?? 10;
        //        var skip = lazyState.first as int? ?? 0;



        //        bool updated = await _dashboardRepository.UpdateTaskStatus(23, 1);

        //        return new taskdashboardResponse
        //        {

        //            message = "ex.Message"
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new taskdashboardResponse
        //        {

        //            message = ex.Message
        //        };
        //    }
        //}

    }
}




