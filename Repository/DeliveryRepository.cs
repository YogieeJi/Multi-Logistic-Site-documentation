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
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MiddlewareWebAPI.Data.Repository
{
    public class DeliveryRepository : IDeliveryRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        public DeliveryRepository(ISqlDataAccess dataAccess)
        {
            _dataAccess = dataAccess;
        }
        public async Task<IEnumerable<ImportedOrderDelivery>> GetImportedOrderByPickListId(string pick_list_id)
        {
            string query = "SELECT id, pick_list_id FROM Cus_T_ImportedOrders WHERE pick_list_id = @PickListId";
            //string query = @"SELECT pick_list_id FROM lv_order
            //             INNER JOIN Cus_T_ImportedOrders ON pick_list_id = ord_code
            //             WHERE ord_statusID = 3 AND fl_picklist_deleted = 0 AND is_delivery_completed = 0
            //             UNION
            //             SELECT nonManaged.pick_list_id
            //             FROM Cus_T_ImportedOrdersDetails AS nonManaged
            //             OUTER APPLY (SELECT TOP 1 pick_list_id FROM Cus_T_ImportedOrdersDetails WHERE pick_list_id = nonManaged.pick_list_id AND stock_manage != 1) AS managedPickList
            //             WHERE stock_manage = 1 AND fl_picklist_deleted = 0
            //             AND nonManaged.pick_list_id != ISNULL(managedPickList.pick_list_id, 0)";
            return await _dataAccess.GetDataInline<ImportedOrderDelivery,dynamic>(query, new { PickListId = pick_list_id });
        }
        public async Task ExecuteDeliveryProcedure(string pick_list_id)
        {
            string sql = "EXEC CUS_SP_ordershipitem_MOI @PickListId";
            await _dataAccess.GetDataInline<string, dynamic>(sql, new { PickListId = pick_list_id });
        }
        //public async Task ActivityLog(ActivityLog log)
        //{
        //    var sql = @"INSERT INTO Cus_ActivityLog 
        //            (log_name, module_id, sub_module_id, event, subject_id, properties,subject_ref, description, causer_type, created_at, user_name, api_action_type)
        //            VALUES 
        //            (@log_name, @module_id, @sub_module_id, @event, @subject_id, @properties, @subject_ref, @description, @causer_type,GETUTCDATE(), @user_name,@api_action_type)";
        //    await _dataAccess.SaveDataInline(sql, log);
        //}
        public async Task<bool> IsPickListAlreadyQueued(string pickListId)
        {
            string query = @"
            SELECT 1 
            FROM cus_jobs 
            WHERE queue = 'orderexport' AND payload LIKE @Payload and attempts = 0";

            var result = await _dataAccess.GetDataInline<int?,dynamic>(
                query,
                new { Payload = $"%{pickListId}%" }
            );

            return result.FirstOrDefault() > 0;
        }
        public async Task InsertLoadOrdersJob(JobModel job)
        {
            var sql = @"
                INSERT INTO Cus_jobs (queue, payload, attempts, reserved_at, available_at, created_at)
                VALUES (@queue, @payload, @attempts, @reserved_at, @available_at, @created_at);
            ";
            await _dataAccess.SaveDataInline(sql, job);
            
        }
        public async Task updatejobs(string pick_list_id)
        {
            var sqlupdate = @"
                UPDATE Cus_jobs 
                SET attempts = 1 
                WHERE payload Like @PickListId;";

            await _dataAccess.SaveDataInline(sqlupdate, new { PickListId = $"%{pick_list_id}%" });
        }
        public async Task<exportorderdetails?> GetOrderIdByPickListId(string pickListId)
        {
            var sql = @"SELECT *
                    FROM Cus_T_ImportedOrdersDetails 
                    WHERE pick_list_id = @PickListId";
            var result = await _dataAccess.GetDataInline<OrderLinesDto, dynamic>(sql, new { PickListId = pickListId });
            //return result.ToList();
            return new exportorderdetails
            {
                Data = result.ToList()
            };
        }
        public async Task<exportedorderdetails?> GetByLineIdAsync(int line_id)
        {
            var sql = @"SELECT *
                    FROM Cus_T_ImportedOrdersDetails 
                    WHERE id = @id";
            var result = await _dataAccess.GetDataInline<OrderLinesdata, dynamic>(sql, new { id = line_id });
            //return result.ToList();
            return new exportedorderdetails
            {
                Data = result.FirstOrDefault()
            };
        }
        public async Task UpdateExportStatus(int id)
        {
            //string query = "UPDATE Cus_T_ImportedOrders SET is_exported = COALESCE(@IsExported, is_exported) WHERE id = @Id";
            string query = "UPDATE Cus_T_ImportedOrdersDetails SET is_exported = 3 WHERE id = @Id";

            var param = new DynamicParameters();
            param.Add("@Id", id);

            int rowsAffected = await _dataAccess.SaveDataInline(query, param);
            //return rowsAffected > 0;
        }
        public async Task UpdateExportStatus(int id, int STATUS)
        {
            //string query = "UPDATE Cus_T_ImportedOrders SET is_exported = COALESCE(@IsExported, is_exported) WHERE id = @Id";
            string query = "UPDATE Cus_T_ImportedOrdersDetails SET is_exported = @status WHERE id = @Id";

            var param = new DynamicParameters();
            param.Add("@Id", id);
            param.Add("@status", STATUS);
            int rowsAffected = await _dataAccess.SaveDataInline(query, param);
            //return rowsAffected > 0;
        }
        public async Task<bool> ExistsForItemReferenceAsync(string itemReference)
        {
            var query = @"
            SELECT COUNT(1)
            FROM Cus_Serial_Manage_Items
            WHERE ITMREF = @ItemReference AND SERMGTCOD IN (2,3,4)";

            var result = await _dataAccess.GetDataInline<int?, dynamic>(
                query,
                new
                {
                    ItemReference = itemReference
                }
            );

            return result.FirstOrDefault() > 0;

        }

        public async Task<UserDetailsResponse> GetUserDetails(string user)
        {
            var query = $"Select * from Cus_Users WHERE name = @userName";
            var data = await _dataAccess.GetDataInline<UserDetailsResponse, dynamic>(query, new { userName = user });
            return data.FirstOrDefault();
        }
    }
}
