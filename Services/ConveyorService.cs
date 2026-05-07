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

namespace MiddlewareWebAPI.Services.Services
{
    public class ConveyorService : IConveyorService
    {
        private readonly IConveyorRepository _conveyorRepository;
        public ConveyorService(IConveyorRepository conveyorRepository)
        {
            _conveyorRepository = conveyorRepository;
        }

        public async Task<LaneResponse> GetLanes(LaneRequest request)
        {
            //var pageNumber = request.page + 1;
            //var pageSize = request.rows;
            //var sortBy = string.IsNullOrWhiteSpace(request.sortField) ? "stn_Name" : request.sortField;

            //var sortOrder = request.sortOrder == "1"? "asc" : request.sortOrder == "-1" ? "desc" : "asc";

            //return await _conveyorRepository.GetLane(pageNumber, pageSize, sortBy, sortOrder);
            return await _conveyorRepository.GetLanes(request);

        }
        public async Task<laneDetails> getLaneDetail(int? id)
        {
            return await _conveyorRepository.getLaneDetail(id);
        }

        public async Task<OccupiedLanesResponse> occupiedLanesGrid(GridRequest request)
        {
            return await _conveyorRepository.occupiedLanesGrid(request);
        }

        public async Task<SlotGridResponse> GetSlotsGrid(GridRequest request)
        {
            return await _conveyorRepository.GetSlotsGrid(request);

        }

        public async Task<SlotGridDetailResponse> GetSlotsDetail(int id)
        {
            return await _conveyorRepository.GetSlotsDetail(id);

        }
        public async Task<FormObjResponse> GetFormObj()
        {
            try
            {
                var ips = await _conveyorRepository.GetPTLController();
                var locations = await _conveyorRepository.GetLVLocations();
                var lanes = await _conveyorRepository.GetConveyorLanes();

                return new FormObjResponse
                {
                    error = 0,
                    message = "Data fetched",
                    data = new FormObjData
                    {
                        ips = ips,
                        locations = locations,
                        lanes = lanes
                    }
                };
            }
            catch (Exception ex)
            {
                return new FormObjResponse
                {
                    error = 1,
                    message = "Error while creating Slot | " + ex.Message,
                    data = null
                };
            }
        }

        public async Task<ResponseResult> AddSlot(ConveyorSlotRequest slot)
        {
            try
            {
                var success = await _conveyorRepository.AddSlot(slot);

                return new ResponseResult
                {
                    Error = 0,
                    Message = success ? "Slot created Successfully" : "Failed to create Slot"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Error while creating Slot | " + ex.Message
                };
            }
        }
        public async Task<(bool isSuccess, string message)> UpdateSlot(SlotInputModel model,int id)
        {
            try
            {
                //var slot = new conveyorslotmodel
                //{
                //    id= id,
                //     title = model.title,
                //    lane_id = model.lane_id,
                //    lane = model.lane,
                //    mantis_location_id = model.mantis_location_id,
                //    ptl_ip_id = model.ip,
                //    ptl_address = model.tag
                //};

                var updated = await _conveyorRepository.UpdateSlot(model, id);

                if (updated)
                    return (true, "Slot updated successfully");
                else
                    return (false, "No record updated");
            }
            catch (Exception ex)
            {
                return (false, "Error while updating slot | " + ex.Message);
            }
        }

        public async Task<IEnumerable<OrderStatusResponse>> GetOrdersByStatus()
        {
            return await _conveyorRepository.GetOrdersByStatus();
        }

        public async Task<OrderSlotResponse> GetOrderSlot(GridRequest request)
        {
            var result = await _conveyorRepository.GetOrderSlot(request);

            return new OrderSlotResponse
            {
                Data = result.Data,
                TotalRecords = result.TotalRecords,
                Message = "Successfull"
            };
        }

        public async Task<ResponseResult> UpdateOrderSlot(UpdateOrderSlotRequest request)
        {
            return await _conveyorRepository.UpdateOrderSlot(request);
        }

        public async Task<ConveryorLanesResponse> GetConveyorLanesGrid(GridRequest request)
        {
            return await _conveyorRepository.GetConveyorLanesGrid(request);
        }

        public async Task<ResponseResult> AddLane(CreateLaneRequest request)
        {
            try
            {
                var id = await _conveyorRepository.AddLane(request);

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Lane created successfully" 
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Error while creating Lane | " + ex.Message
                };
            }
        }

        public async Task<ResponseResult> UpdateLanes(UpdateLanesRequest request, int id)
        {
            try
            {
                var rowsAffected = await _conveyorRepository.UpdateLanes(request, id);

                if (rowsAffected > 0)
                {
                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "Lane updated successfully"
                    };
                }
                else
                {
                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "No lane found with the specified ID"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = $"Error while updating lane | {ex.Message}"
                };
            }
        }
    }
}


