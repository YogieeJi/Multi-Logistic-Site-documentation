using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class FailedJobsRepository : IFailedJobsRepository
    {
        public ISqlDataAccess _dataAccess { get; }

        public FailedJobsRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<FailedJobsResponse> GetFailedJobs(GridRequest request)
        {
            var sql = new StringBuilder("SELECT * FROM Cus_failed_jobs WHERE 1=1 ");
            var countSql = new StringBuilder("SELECT COUNT(id) FROM Cus_failed_jobs WHERE 1=1 ");
            var parameters = new DynamicParameters();

            // Filtering
            if (request.filters != null && request.filters.Any())
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Value.value))
                    {
                        if (filter.Key == "failed_at")
                        {
                            if (DateTime.TryParse(filter.Value.value, out DateTime filterDate))
                            {
                                sql.Append($" AND CAST({filter.Key} AS DATE) = @FailedAtDate");
                                countSql.Append($" AND CAST({filter.Key} AS DATE) = @FailedAtDate");
                                parameters.Add("FailedAtDate", filterDate.Date);
                            }
                        }
                        else
                        {
                            sql.Append($" AND {filter.Key} LIKE @{filter.Key}");
                            countSql.Append($" AND {filter.Key} LIKE @{filter.Key}");
                            parameters.Add(filter.Key, $"%{filter.Value.value}%");
                        }
                    }
                }
            }

            // Sorting
            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                sql.Append($" ORDER BY {request.sortField} {sortOrder}");
            }
            else
            {
                sql.Append(" ORDER BY failed_at DESC");
            }

            // Pagination
            sql.Append(" OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY");
            parameters.Add("Skip", request.first);
            parameters.Add("Take", request.rows);

            var totalCount = await _dataAccess.SaveDataReturnInline<int>(countSql.ToString(), parameters);
            var data = await _dataAccess.GetDataInline<FailedJobs,dynamic>(sql.ToString(), parameters);

            return new FailedJobsResponse
            {
                Data = data,
                TotalRecords = totalCount
            };
        }

        public async Task<bool> Delete(long id)
        {
            string query = "DELETE FROM Cus_failed_jobs WHERE id = @Id";
            int rowsAffected = await _dataAccess.SaveDataInline(query, new { Id = id });
            return rowsAffected > 0;
        }

        public async Task<FailedJobs> GetById(long id)
        {
            string query = "SELECT * FROM Cus_failed_jobs WHERE id = @Id";
            var result = await _dataAccess.GetFirstDataInline<FailedJobs, dynamic>(query, new { Id = id });
            return result.FirstOrDefault();
        }

        public async Task<int> UpdateJob(string? Uuid)
        {
            string query = "UPDATE Cus_Jobs SET [attempts] = 0, payload = JSON_MODIFY(payload, '$.failJobs', 0) WHERE [id] = @Id;";
            return await _dataAccess.SaveDataReturnInline<int>(query, new { Id = Uuid });
        }
    }
}
