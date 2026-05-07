using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MiddlewareWebAPI.Services.Services
{
    public class FailedJobsService : IFailedJobsService
    {
        private readonly IFailedJobsRepository _repository;

        public FailedJobsService(IFailedJobsRepository repository)
        {
            _repository = repository;
        }


        public async Task<FailedJobsResponse> GetFailedJobs(GridRequest request)
        {
            return await _repository.GetFailedJobs(request);
        }
        public async Task<ResponseResult> Delete(long id)
        {
            var isDeleted = await _repository.Delete(id);
            if (isDeleted)
            {
                return new ResponseResult { Error = 0, Message = "Job deleted successfully!" };
            }
            else
            {
                return new ResponseResult  { Error = 1, Message = "Job not found or could not be deleted!" };
            }
        }

        public async Task<ResponseResult> Retry(long id)
        {
            var failedJob = await _repository.GetById(id);
            if (failedJob == null)
            {
                return new ResponseResult { Error = 1, Message = "Job not found." };
            }

            // Update job Attempts
            await _repository.UpdateJob(failedJob.Uuid);

            // Delete from failed jobs
            //await _repository.Delete(id);

            return new ResponseResult { Error = 0, Message = "Job retried successfully!" };
        }
    }
}
