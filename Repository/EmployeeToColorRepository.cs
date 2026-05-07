using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using Org.BouncyCastle.Asn1.Ocsp;
using static iText.IO.Image.Jpeg2000ImageData;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;

namespace MiddlewareWebAPI.Data.Repository
{
    public class EmployeeToColorRepository : IEmployeeToColorRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public EmployeeToColorRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<EmployeeToColorResponse> Index(GridRequest request)
        {
            try
            {
                var query = @" SELECT 
                             Cus_Conv_EmployeeToColor.id,
                            Cus_Conv_EmployeeToColor.color,
                            Cus_Conv_EmployeeToColor.mantis_id,
                            LV_Users.usr_Login
                        FROM Cus_Conv_EmployeeToColor
                        LEFT JOIN LV_Users ON Cus_Conv_EmployeeToColor.mantis_id = LV_Users.usr_ID where 1=1";

                var countQuery = $"SELECT COUNT( subQuery.id) FROM ({query}) As subQuery";

                var parameters = new DynamicParameters();

                // Handle Filters
                if (request.filters != null && request.filters.Count > 0)
                {
                    foreach (var filter in request.filters)
                    {
                        if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                        {
                            string filterValue = $"%{filter.Value?.value}%";
                            string condition = $" AND {filter.Key} LIKE @{filter.Key}";

                            query += condition;
                            countQuery += condition; // Apply filter to count query as well

                            parameters.Add(filter.Key, filterValue);
                        }
                    }
                }

                // Handle sorting based on sortOrder and sortField
                if (!string.IsNullOrEmpty(request.sortField) && request.sortOrder != null)
                {
                    string sortOrder = request.sortOrder == "1" ? "ASC" : "DESC";
                    query += $" ORDER BY {request.sortField} {sortOrder}";
                }
                else
                {
                    query += " ORDER BY id DESC";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<EmployeeToColor, dynamic>(query, parameters);

                // Fetch Total Count with Filters Applied
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);

                return new EmployeeToColorResponse
                {
                    Data = result,
                    TotalRecords = totalCount.FirstOrDefault()

                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<MantisAllEmployeesLookupResponse> MantisAllEmployeesLookup()
        {
            try
            {
                var sql = @"SELECT usr_ID, usr_Login
                             FROM LV_Users
                             WHERE usr_ID NOT IN (
                            SELECT mantis_id FROM Cus_Conv_EmployeeToColor WHERE mantis_id IS NOT NULL)";
                var result = await _dataAccess.GetDataInline<MantisAllEmployeesLookup, dynamic>(sql, new { });
                if (result != null)
                {
                    return new MantisAllEmployeesLookupResponse
                    {
                        Error = 0,
                        Data = result,

                    };
                }
                else
                {
                    return new MantisAllEmployeesLookupResponse
                    {
                        Error = 1,
                        Data = result,

                    };

                }

            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ApisResponse> Store(AddEmployeeColorRequest request)
        {
            try
            {
                var sql = "SELECT * FROM Cus_Conv_EmployeeToColor WHERE mantis_id = @mantis_id";
                var existing = await _dataAccess.GetDataInline<EmployeeToColor, dynamic>(sql, new { request.mantis_id });

                int affectedRows;
                if (existing.Count() > 0)
                {
                    // Update
                    var updateQuery = @"
                UPDATE Cus_Conv_EmployeeToColor 
                SET color = @color 
                WHERE mantis_id = @mantis_id";

                    affectedRows = await _dataAccess.SaveDataInline(updateQuery, request);
                }
                else
                {
                    // Insert
                    var insertQuery = @"
                INSERT INTO Cus_Conv_EmployeeToColor (mantis_id, color) 
                VALUES (@mantis_id, @color)";

                    affectedRows = await _dataAccess.SaveDataInline(insertQuery, request);
                }
                if (affectedRows > 0)
                {
                    {
                        return new ApisResponse()
                        {
                            Error = 0,
                            Message = "Employee to Color Added Successfully"
                        };
                    }
                }
                else
                {
                    return new ApisResponse
                    {
                        Error = 1,
                        Message = "No changes were made to the EmployeeToColor data."
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = $"An error occurred while adding/updating Employee to Color: {ex.Message}"
                };
            }
        }

        public async Task<EmployeeToColorDetailResponse> Show(int id)
        {
            var sql = @"SELECT 
                      Cus_Conv_EmployeeToColor.id,
                      Cus_Conv_EmployeeToColor.color,
                      Cus_Conv_EmployeeToColor.mantis_id,
                       LV_Users.usr_Login
                        FROM 
                      Cus_Conv_EmployeeToColor
                      LEFT JOIN 
                     LV_Users ON Cus_Conv_EmployeeToColor.mantis_id = LV_Users.usr_ID
                     WHERE 
                    Cus_Conv_EmployeeToColor.id = @Id";
            var result = (await _dataAccess.GetDataInline<EmployeeToColorDetail, dynamic>(sql, new { Id = id })).FirstOrDefault();
            if (result != null)
            {
                return new EmployeeToColorDetailResponse()
                {
                    Data = result

                };
            }
            else
            {
                return new EmployeeToColorDetailResponse
                {
                    Data = null
                };

            }
        }

        public async Task<ApisResponse> Update(UpdateEmployeeToColorRequest request, int id)
        {
            try
            {
                var query = @"
                            UPDATE Cus_Conv_EmployeeToColor 
                            SET color = @Color, mantis_id = @MantisId
                            WHERE id = @Id"
                ;

                var rowsAffected = await _dataAccess.SaveDataInline(query, new { Color = request.color, MantisId = request.mantis_id, Id = id });
                if (rowsAffected > 0)
                {
                    return new ApisResponse
                    {
                        Error = 0,
                        Message = "Employee to Color updated Successfully"
                    };
                }
                else
                {
                    return new ApisResponse()
                    {
                        Error = 1,
                        Message = "Not able to update Employee to Color"

                    };
                }
            }
            catch (Exception ex)
            {
                throw;
            }

        }
       
    }

}


