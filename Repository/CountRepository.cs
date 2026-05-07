using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;

namespace Middleware.Data.Repository
{
    public class CountRepository : ICountRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public CountRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }

        public async Task<IEnumerable<GetUser>> GetUsers()
        {
            var query = @"SELECT usr_ID, name
    FROM V_Person p
    JOIN LV_Users u ON u.usr_PersonID = p.per_ID";

            var users = await _dataAccess.GetDataInline<GetUser, dynamic>(query, new { });
            return users;

        }
        public async Task<IEnumerable<Count>> GetCounts()
        {
            var query = @"
    SELECT count_name, count_Id
    FROM Cus_T_CountHeaders c
    WHERE c.close_count IS NULL
    AND (
        (c.Parent_CountId IS NULL AND NOT EXISTS (
            SELECT 1
            FROM Cus_T_CountHeaders sub
            WHERE sub.Parent_CountId = c.count_Id
        ))
        OR c.Parent_CountId IS NOT NULL
    )
    ORDER BY count_name";

            var counts = await _dataAccess.GetDataInline<Count, dynamic>(query, new { });
            return counts;
        }
        public async Task<int> GetAisleCount(string aisle)
        {
            string query = "sp_GetAisleCount";
            var result = await _dataAccess.GetData<int, dynamic>(query, new { Aisle = $"{aisle}%" });
            return result.FirstOrDefault();
        }

        public async Task<bool> IsCountNameExists(string countName, int? countId)
        {
            string query = "SELECT COUNT(1) FROM Cus_T_CountHeaders WHERE count_name = @CountName AND (count_id != @CountId OR @CountId IS NULL)";
            var result = await _dataAccess.GetData<int, dynamic>(query, new { CountName = countName, CountId = countId });
            return result.FirstOrDefault() > 0;
        }

        public async Task<bool> InsertCount(CreateCountRequest request)
        {
            string insertCountQuery = @"
                INSERT INTO Cus_T_CountHeaders (Aisle, Level, UPC, Exp, assign_to, created_by, quantity, close_count, count_name)
                VALUES (@Aisle, @Level, @UPC, @Exp, @AssignTo, @CreatedBy, @Quantity, @CloseCount, @CountName);
                SELECT SCOPE_IDENTITY();";

            var countIdTask = _dataAccess.GetData<int, dynamic>(insertCountQuery, new
            {
                Aisle = request.Aisle,
                Level = request.Level,
                UPC = request.SelectedCategories.Any(c => c.Key == "Upc") ? "Y" : "N",
                Exp = request.SelectedCategories.Any(c => c.Key == "Expiry") ? "Y" : "N",
                AssignTo = request.User,
                CreatedBy = request.UserId,
                Quantity = request.SelectedCategories.Any(c => c.Key == "Quantity") ? "Y" : "N",
                CloseCount = request.CloseCount,
                CountName = request.DefaultCountName
            });

            // Wait for countId to be retrieved
            var countId = (await countIdTask).FirstOrDefault();

            if (countId <= 0) return false;

            // Insert into Cus_T_CountDetails
            string detailsQuery = @"
                INSERT INTO Cus_T_CountDetails (count_headerId, location_Code, Time, Upc_Code, Item_Code, Item_Lot, Sys_Init_Qty, Unit_Id)
                SELECT @CountId, loc_Code, CURRENT_TIMESTAMP, pbc_String, prd_PrimaryCode, sav_Value, spt_Quantity, unt_ID
                FROM LV_Location
                LEFT JOIN LV_Stock AS stk ON stk.stk_LocationID = LV_Location.loc_ID
                LEFT JOIN LV_StockPackType AS spt ON spt.spt_StockID = stk.stk_ID AND spt.spt_ParentID IS NULL
                LEFT JOIN LV_Product AS prd ON stk.stk_ProductID = prd.prd_ID
                LEFT JOIN LV_ItemUnit AS itu ON itu.itu_ProductID = prd.prd_ID AND spt.spt_ItemUnitID = itu.itu_ID
                LEFT JOIN LV_Unit AS unt ON itu.itu_UnitID = unt.unt_ID
                LEFT JOIN LV_ProductBarcode AS pbc ON prd.prd_ID = pbc.pbc_ProductID AND spt.spt_ItemUnitID = pbc.pbc_ItemUnitID
                LEFT JOIN LV_StockAttributesValues AS sav ON sav.sav_stockID = stk.stk_ID
                WHERE LV_Location.loc_SectorCode LIKE @Aisle AND LV_Location.loc_Level = @Level";

            var countDetailsResult = await _dataAccess.GetData<int, dynamic>(detailsQuery, new { CountId = countId, Aisle = request.Aisle, Level = request.Level });

            // Check if rows were affected and return the result
            var rowsAffected = countDetailsResult.Count();

            return rowsAffected > 0;
        }

        public async Task<int> GetCountCondition(int countId)
        {
            var query = "sp_GetCountCondition";
            var result = await _dataAccess.GetData<int, dynamic>(query, new { CountId = countId });
            return result.FirstOrDefault();
        }


        public async Task<CountConditionResponse> CreateSecondCount(string secondUser, string secondCountName, SelectedUser selectedUser)
        {
            var query = "sp_CreateSecondCount";
            var result = await _dataAccess.GetData<int, dynamic>(query, new { secondUser, secondCountName, selectedUser.count_Id });

            // Use FirstOrDefault to get a single result, or 0 if no result
            if (result.FirstOrDefault() > 0)
            {
                return new CountConditionResponse
                {
                    Error = false,
                    Message = "Second count created successfully."
                };
            }

            return new CountConditionResponse
            {
                Error = true,
                Message = "Failed to create second count."
            };

        }

        //public async Task<IEnumerable<User>> GetSecondUser(int discCountId)
        //{
        //    string query = @"
        //    SELECT u.usr_ID, vp.name
        //    FROM V_Person AS vp
        //    JOIN LV_Users AS u ON u.usr_PersonID = vp.per_ID
        //    WHERE u.usr_ID NOT IN (
        //        SELECT assign_to
        //        FROM Cus_T_CountHeaders
        //        WHERE count_Id = @DiscCountId
        //    )
        //    AND u.usr_ID NOT IN (
        //        SELECT assign_to
        //        FROM Cus_T_CountHeaders
        //        WHERE count_Id IN (
        //            SELECT Parent_CountId
        //            FROM Cus_T_CountHeaders
        //            WHERE count_Id = @DiscCountId
        //        )
        //    )
        //    AND u.usr_ID NOT IN (
        //        SELECT assign_to
        //        FROM Cus_T_CountHeaders
        //        WHERE close_count IS NOT NULL
        //        AND count_Id = @DiscCountId
        //    )
        //    AND vp.name NOT IN (
        //        SELECT DISTINCT username
        //        FROM Cus_T_CountDetails
        //        WHERE count_headerId = @DiscCountId
        //        AND username IS NOT NULL
        //    )";

        //    var parameters = new DynamicParameters();
        //    parameters.Add("DiscCountId", discCountId);

        //    var data = await _dataAccess.GetData<dynamic, DynamicParameters>(query, parameters);

        //    var userList = data.Select(x => new User
        //    {
        //        UserId = x.userId,
        //        Name = x.name
        //    }).ToList();

        //    return userList;
        //}

        public async Task<IEnumerable<UpdateAssignRequest>> UpdateAssignTo(int countId, int assignedUser)
        {
            DynamicParameters _params = new DynamicParameters();
            _params.Add("@countId", countId);
            _params.Add("@assignedUser", assignedUser);
            var data = await _dataAccess.GetData<UpdateAssignRequest, DynamicParameters>("sp_UpdateAssignTo", _params);
            return data;

        }
    }
}
