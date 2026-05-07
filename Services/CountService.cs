using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;

namespace MiddlewareWebAPI.Services.Services
{
    public class CountService : ICountService
    {
        private readonly ICountRepository _countRepository;

        public CountService(ICountRepository countRepository)
        {
            _countRepository = countRepository;
        }

        public async Task<ResponseModel> GetUsers()
        {
            try
            {
                var users = await _countRepository.GetUsers();
                var counts = await _countRepository.GetCounts();

                if (users != null && users.Any())
                {
                    return new ResponseModel
                    {
                        Success = true,
                        Data =users,
                        Count = counts
                    };
                }
                else
                {
                    return new ResponseModel
                    {
                        Success = false,
                        Message = "No users found"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ResponseModel
                {
                    Success = false,
                    Message = "An error occurred while fetching users",
                    Error = ex.Message
                };
            }
        }


        public async Task<CountApiResponse> CreateCount(CreateCountRequest request)
        {
            // Check aisle count and other validations
            var aisleCount = await _countRepository.GetAisleCount(request.Aisle);
            if (aisleCount < 1)
            {
                return new CountApiResponse
                {
                    Error = 1,
                    Message = "Invalid aisle."
                };
            }

            // Further validation
            if (await _countRepository.IsCountNameExists(request.CountName, request.Id))
            {
                return new CountApiResponse
                {
                    Error = 1,
                    Message = "Count name already exists."
                };
            }

            // Prepare data and insert into database
            var result = await _countRepository.InsertCount(request);
            if (!result)
            {
                return new CountApiResponse
                {
                    Error = 1,
                    Message = "An error occurred while creating the count."
                };
            }

            return new CountApiResponse
            {
                Error = 0,
                Message = "Count created successfully."
            };
        }


        public async Task<CountConditionResponse> GetCountCondition(CountRequest request)
        {
            var condition = await _countRepository.GetCountCondition(request.selectedUsers.count_Id);

            if (condition == 1)
            {
                var result = await _countRepository.CreateSecondCount(request.SecondUser, request.SecondCountName, request.selectedUsers);
                return result;
            }
            else if (condition == 2)
            {
                return new CountConditionResponse
                {
                    Data = condition,
                    Message = "Cannot create Second Count as it is already present."
                };
            }
            else if (condition == 3)
            {
                return new CountConditionResponse
                {
                    Data = condition,
                    Message = "Cannot create third Count as it is already present."
                };
            }

            return new CountConditionResponse
            {
                Error = true,
                Message = "Unknown condition."
            };
        }
        //public async Task<IEnumerable<User>> GetSecondUser(int discCountId)
        //{
        //    return await _countRepository.GetSecondUser(discCountId);
        //}

        public async Task<IEnumerable<UpdateAssignRequest>> UpdateAssignTo(int countId, int assignedUser)
        {
            return await _countRepository.UpdateAssignTo(countId, assignedUser);
        }
    }
}
