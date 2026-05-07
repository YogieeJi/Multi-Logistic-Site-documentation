using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using iText.Layout.Borders;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class SetupRepository : ISetupRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private readonly string? _connectionString;
        private readonly UrlConstants _urlConstants;
        public SetupRepository(ISqlDataAccess dataAccess, IConfiguration configuration, UrlConstants urlConstants)
        {
            _dataAccess = dataAccess;
            _connectionString = configuration.GetConnectionString("con");
            _urlConstants = urlConstants;
        }
        public async Task<DynamicReportResponse> viewReports(GridRequest request)
        {
            var response = new DynamicReportResponse();

            var query = @"
               SELECT
                id,
                report_name,
                module,
                query,
                query_file_path,
                is_active,
                updated_at,
                add_filter,
                filter_type,
                filter_query,
                dbo.UtcToLocal(created_at) AS created_at
            FROM Cus_DynamicReports
            WHERE 1 = 1

            ";

            var parameters = new DynamicParameters();
            string totalCountQuery = @"
                SELECT  COUNT(*) 
                 FROM Cus_DynamicReports 
                 WHERE 1=1
            ";

            if (request.filters != null && request.filters?.Count > 0)
            {
                foreach (var filter in request.filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        string columnName = filter.Key;
                        string paramName = $"@{filter.Key}";

                        if (columnName.Equals("created_at", StringComparison.OrdinalIgnoreCase))
                        {
                            // 🔹 For datetime, cast and compare exactly
                            query += $" AND CAST({columnName} AS datetime) = {paramName}";
                            totalCountQuery += $" AND CAST({columnName} AS datetime) = {paramName}";

                            if (DateTime.TryParse(filter.Value.value, out var parsedDate))
                            {
                                parameters.Add(paramName, parsedDate);
                            }
                        }
                        else
                        {
                            string filterValue = "%" + filter.Value.value + "%";

                            query += $" AND {columnName} LIKE {paramName}";
                            totalCountQuery += $" AND {columnName} LIKE {paramName}";

                            parameters.Add(paramName, filterValue);
                        }
                    }
                }
            }

            if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
            {
                string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                query += $" ORDER BY {request.sortField} {sortOrder}";
            }
            else
            {
                query += " ORDER BY id DESC";  // Default sorting by task ID
            }

            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.rows);

            var tasksQuery = await _dataAccess.GetDataInline<reportItem, dynamic>(query, parameters);

            var totalCount = (await _dataAccess.GetDataInline<int, dynamic>(totalCountQuery, parameters)).FirstOrDefault();

            return new DynamicReportResponse
            {
                data = tasksQuery.ToList(),
                totalRecords = totalCount,
                message = "Successfully fetched data"
            };
        }
        public async Task<DynamicReportDetailResponse> viewReports(int id)
        {
        

            var query = 
            @"
              SELECT *
              FROM Cus_DynamicReports 
              WHERE id=@id
            ";

        
            var parameters = new DynamicParameters();
            parameters.Add("@id", id);
            
          
            var tasksQuery = await _dataAccess.GetDataInline<reportItem, dynamic>(query, parameters);

            return new DynamicReportDetailResponse
            {
                data = tasksQuery.ToList()
            };
        }
        public async Task updateReport(reportupdateItem request, int id)
        {
            try
            {
                if(id > 0)
                {
                    var query =
                    @"
                      UPDATE Cus_DynamicReports
                      SET 
                      report_name = @report_name,
                      module = @module,
                      query = @query,
                      is_active = @is_active,
                      add_filter = @add_filter,
                      filter_type = @filter_type,
                      filter_query = @filter_query,
                      updated_at = GETUTCDATE()
                      WHERE 
                      id = @id;
                    ";


                    var parameters = new DynamicParameters();
                    parameters.Add("@id", id);
                    parameters.Add("@report_name", request.report_name);
                    parameters.Add("@module", request.module);
                    parameters.Add("@query", request.query);
                    parameters.Add("@is_active", request.is_active);
                    parameters.Add("@add_filter", request.add_filter);
                    parameters.Add("@filter_type", request.filter_type);
                    parameters.Add("@filter_query", request.filter_query);

                    await _dataAccess.SaveDataInline(query, parameters);

                }
                else
                {
                    var query =
                    @"
                      INSERT INTO Cus_DynamicReports (
                      report_name,
                      module,
                      query,
                      is_active,
                      add_filter,
                      filter_type,
                      filter_query,
                      created_at,
                      updated_at
                      )
                      VALUES 
                      (
                      @report_name,
                      @module,
                      @query,
                      @is_active,
                      @add_filter,
                      @filter_type,
                      @filter_query,
                     GETUTCDATE(),
                      NULL
                      ) 
                    ";


                    var parameters = new DynamicParameters();
                    parameters.Add("@report_name", request.report_name);
                    parameters.Add("@module", request.module);
                    parameters.Add("@query", request.query);
                    parameters.Add("@is_active", request.is_active);
                    parameters.Add("@add_filter", request.add_filter);
                    parameters.Add("@filter_type", request.filter_type);
                    parameters.Add("@filter_query", request.filter_query);

                    await _dataAccess.SaveDataInline(query, parameters);
                }
                   
            }
            catch(Exception ex)
            {
               var mess =  ex.Message;
            }
           

        }
    }
}
