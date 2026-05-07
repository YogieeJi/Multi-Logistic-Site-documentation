using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ItemRepository : IItemRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public ItemRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }
        public async Task<IEnumerable<Mantis>> GetAllVData(Mantis mentis)
        {
            string query = "Get_All_Vendors";
            return await _dataAccess.GetData<Mantis, dynamic>(query, new { });
        }
        public async Task<IEnumerable<Mantis>> GetVendorDataById(int VId)
        {
            DynamicParameters _params = new DynamicParameters();
            _params.Add("@VId", VId);
            var data = await _dataAccess.GetData<Mantis, DynamicParameters>("[dbo].[Get_All_VendorsById]", _params);
            return data;
        }
        public async Task<bool> SaveData(Mantis mentis)
        {
            try
            {
                await _dataAccess.SaveData("dbo.Insert_Vendor", new
                {
                    mentis.name,
                    mentis.Description
                });
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<OrderTasksResponse> Getordertasks(GridRequest request)
        {
            try
            {

                var query = $@"Select ORDA.ord_id, ORDA.ord_code, count(tsk.tsk_ID) as task_count from LV_OrderShipItemStock with (nolock)
                     left join LV_OrderShipItem with (nolock) on oss_OrderShipItemID=osi_id
                     left join LV_OrderShipGroupItem with (nolock) on oss_GroupItemID=ogi_id
                     left join LV_OrderShipment OSA  with (nolock) on ogi_GroupID=OSA.ost_GroupID
                     left join LV_OrderShipment OSB  with (nolock) on osi_OrderShipmentID=OSB.ost_id
                     left join LV_TaskDependency td on td.tkd_TaskID = oss_TaskID
                     inner join LV_Task tsk ON tsk.tsk_ID = oss_TaskID OR tsk.tsk_ID = td.tkd_PrereqTaskID
                     inner join LV_Order ORDA  with (nolock) on OSA.ost_OrderID=ORDA.ord_id or OSB.ost_OrderID=ORDA.ord_id"
                     ;

                var countQuery = $"SELECT COUNT(*) FROM ({query}) As  countQuery";

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
                    query += $"  Group BY ORDA.ord_id,ORDA.ord_code ORDER BY {request.sortField} {sortOrder}";
                    countQuery += $"  Group BY ORDA.ord_id,ORDA.ord_code";
                }
                else
                {
                    query += " Group BY ORDA.ord_id,ORDA.ord_code ORDER BY Sku DESC";
                    countQuery += $"  Group BY ORDA.ord_id,ORDA.ord_code";
                }

                // Pagination
                query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
                parameters.Add("@Skip", request.first);
                parameters.Add("@Rows", request.rows);

                // Fetch Data
                var result = await _dataAccess.GetDataInline<ordertasks, dynamic>(query, parameters);

                // Fetch Total Count with Filters Applied
                var totalCount = await _dataAccess.GetDataInline<int, dynamic>(countQuery, parameters);


                return new OrderTasksResponse
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

    }
}

