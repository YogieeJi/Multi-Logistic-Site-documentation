using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using System.Data.Common;
using Microsoft.Extensions.Options;
using System.IO;
using Newtonsoft.Json.Linq;
using System.Collections;
using Swashbuckle.Swagger;
using Microsoft.AspNetCore.Http.Extensions;
using static Dapper.SqlMapper;
using System.Data;
using System.Collections.Generic;
using static OfficeOpenXml.ExcelErrorValue;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Data.Repository
{
    public class ProductsRepository : IProductsRepository
    {
        public ISqlDataAccess _dataAccess { get; }
        private UrlConstants _urlConstants { get; set; }

        public ProductsRepository(ISqlDataAccess dataAccess, UrlConstants urlConstants)
        {
            _dataAccess = dataAccess;
            _urlConstants = urlConstants;
        }

        public async Task<ProductGridResponse> GetProductsGrid(ProductGridRequest1 request)
        {
            try { 
            var response = new OrderTaskResponse();

            var query = @"
                SELECT 
                 *,
                 CASE 
                     WHEN prd_id IS NULL THEN 1 
                     ELSE 2
                 END AS mantis_deleted
             FROM Cus_Items 
             LEFT JOIN lv_product ON lv_product.prd_PrimaryCode = Cus_Items.sku
             WHERE 1 = 1
             ";

            // Prepare the parameters
            var parameters = new DynamicParameters();

            string totalCountQuery = @"
                SELECT  COUNT(*) 
                 FROM Cus_Items 
                 WHERE 1=1";


            // Handle filters
            if (request.Filters != null && request.Filters?.Count > 0)
            {
                foreach (var filter in request.Filters)
                {
                    if (!string.IsNullOrEmpty(filter.Key) && !string.IsNullOrEmpty(filter.Value?.value))
                    {
                        string columnName;
                        string paramName = $"@{filter.Key}";
                        string filterValue = "%" + filter.Value?.value + "%";

                        columnName = filter.Key;

                        // Add the filter condition to the query
                        query += $"AND  {columnName} LIKE {paramName}";
                        totalCountQuery += $"AND {columnName} LIKE {paramName}";

                        // Add the parameter to the parameter collection
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
                query += " ORDER BY id DESC";  // Default sorting by task ID
            }

            // Apply pagination to query
            query += " OFFSET @Skip ROWS FETCH NEXT @Rows ROWS ONLY";
            parameters.Add("@Skip", request.first);
            parameters.Add("@Rows", request.Rows);

            // Execute the main query to get task data
            var tasksQuery = await _dataAccess.GetDataInline<Productsitem, dynamic>(query, parameters);

            // Fetch the total count
            var totalCount = (await _dataAccess.GetDataInline<int, dynamic>(totalCountQuery, parameters)).FirstOrDefault();
            string? templateUrl = _urlConstants.AddTemplateUrl;

            return new ProductGridResponse
            {
                Data = tasksQuery.ToList(),
                TotalRecords = totalCount,
                Message = "Successfully fetched data",
                TemplateUrl = templateUrl,
            };
        }
            catch (Exception ex)
            {
                // Log the exception (optional)
                return new ProductGridResponse
                {
                    Message = ex.Message
                };
            }
        }
        public async Task<ProductDetailsResponse> GetProductsDetails( int id)
        {
            var response = new OrderTaskResponse();

            var query = @"
                SELECT *
                FROM Cus_Items where id = @id
               ";

            // Prepare the parameters

            var parameters = new DynamicParameters();

            string totalCountQuery = @"
                SELECT  COUNT(*) 
                 FROM Cus_Items  where id = @id
                ";

            var tasksQuery =  await _dataAccess.GetDataInline<ProductsDetails, dynamic>(query, new { id = id });
           
            return new ProductDetailsResponse
            {
                Data = tasksQuery.FirstOrDefault(),
            };
        }
        public async Task<DProductDetailsResponse> DGetProductsDetails(int id)
        {
            var response = new OrderTaskResponse();

            var query = @"
                SELECT *
                FROM Cus_Items where id = @id
               ";
            var parameters = new DynamicParameters();
            var tasksQuery = await _dataAccess.GetDataInline<ProductsDetails, dynamic>(query, new { id = id });
            var ID = tasksQuery.FirstOrDefault().sku;
            var LVquery = @"
                SELECT prd_primarycode
                FROM LV_Product where prd_primarycode = @id
               ";
            var lvtasksQuery = await _dataAccess.GetDataInline<DProductsDetails, dynamic>(LVquery, new { id = ID });

            return new DProductDetailsResponse
            {
                Data = lvtasksQuery.FirstOrDefault(),
            };
        }
        public async Task<Product> GetProductByIdAsync(int id)
        {
            var query = "SELECT * FROM Cus_Items WHERE Id = @Id";

            // Use QueryFirstOrDefaultAsync with the query and the parameter
            var product = await _dataAccess.GetDataInline<Product, dynamic>(query, new { id });

            return product.FirstOrDefault(); // Return the first Product or null if not found
        }
        private object NormalizeString(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
        public async Task<int> UpdateProductAsync(UpdateProductRequest request)
        {
            try
            {

                //if (request.uom != "EA")
                //{
                //    request.uom_2 = "EA";
                //}
                if (request.upc_2 == null || request.upc_2 == "" && request.uom != "EA")
                {
                    //request.uom_2 = "EA";
                    request.upc_2 = request.Sku;
                }
                if (request.uom_3 == null || request.uom_3 == "" && request.uom != "EA" && request.uom_2 != "EA")
                {
                    //request.uom_2 = "EA";
                    request.uom_3 = "EA";
                }
                if (request.upc_3 == null || request.upc_3 == "" && request.uom != "EA" && request.uom_2 != "EA")
                {
                    //request.uom_2 = "EA";
                    request.upc_3 = request.Sku;
                }
                if (request.sku_3 == null || request.sku_3 == "" && request.uom != "EA" && request.uom_2 != "EA")
                {
                    //request.uom_2 = "EA";
                    request.sku_3 = "EA";
                }
                if (request.inner_pack_units == null || request.inner_pack_units == "" && request.uom != "EA")
                {
                    //request.uom_2 = "EA";
                    request.inner_pack_units = "1";
                }
                if (request.inner_pack_units_2 == null || request.inner_pack_units_2 == "" && request.uom != "EA" && request.uom_2 != "EA")
                {
                    //request.uom_2 = "EA";
                    request.inner_pack_units_2 = "1";
                }

                var query =
                         @"
                        INSERT INTO Cus_Items (
                    source,
                    item_sku,
                    upc,
                    upc_2,
                    upc_3,
                    plt_rows,
                    plt_qty_row,
                    [desc],
                    inner_pack_upc_ref,
                    inner_pack_sku_ref,
                    inner_pack_units,
                    inner_pack_units_2,
                    is_repack,
                    height,
                    height_2,
                    height_3,
                    width,
                    width_2,
                    width_3,
                    depth,
                    depth_2,
                    depth_3,
                    weight,
                    weight_2,
                    weight_3,
                    measure_date,
                    msr_module,
                    uom,
                    uom_2,
                    uom_3,
                    valid_item,
                    mantis_imported,
                    sku,
                    sku_2,
                    sku_3,
                    is_verified,
                    sku_x3,
                    sku_x3_2,
                    sku_x3_3,
                    zone,
                    is_serialized,
                    is_expired,
                    x3_uom,
                    updated_at
                )
                VALUES (
                    @source,
                    @item_sku,
                    @upc,
                    @upc_2,
                    @upc_3,
                    @plt_rows,
                    @plt_qty_row,
                    @desc,
                    @inner_pack_upc_ref,
                    @inner_pack_sku_ref,
                    @inner_pack_units,
                    @inner_pack_units_2,
                    @is_repack,
                    @height,
                    @height_2,
                    @height_3,
                    @width,
                    @width_2,
                    @width_3,
                    @depth,
                    @depth_2,
                    @depth_3,
                    @weight,
                    @weight_2,
                    @weight_3,
                    @measure_date,
                    @msr_module,
                    @uom,
                    @uom_2,
                    @uom_3,
                    @valid_item,
                    @mantis_imported,
                    @sku,
                    @sku_2,
                    @sku_3,
                    @is_verified,
                    @sku_x3,
                    @sku_x3_2,
                    @sku_x3_3,
                    @zone,
                    @is_serialized,
                    @is_expired,
                    @x3_uom,
                    @updated_at
                );
                ";
                var parameters = new
                {
                    request.id,
                    source = NormalizeString(request.source),
                    item_sku = NormalizeString(request.item_sku),
                    upc = NormalizeString(request.upc),
                    upc_2 = NormalizeString(request.upc_2),
                    upc_3 = NormalizeString(request.upc_3),
                    plt_rows = NormalizeString(request.plt_rows),
                    plt_qty_row = NormalizeString(request.plt_qty_row),
                    desc = NormalizeString(request.desc),
                    inner_pack_upc_ref = NormalizeString(request.inner_pack_upc_ref),
                    inner_pack_sku_ref = NormalizeString(request.inner_pack_sku_ref),
                    inner_pack_units = NormalizeString(request.inner_pack_units),
                    inner_pack_units_2 = NormalizeString(request.inner_pack_units_2),
                    is_repack = NormalizeString(request.is_repack),
                    height = NormalizeString(request.height),
                    height_2 = NormalizeString(request.height_2),
                    height_3 = NormalizeString(request.height_3),
                    width = NormalizeString(request.width),
                    width_2 = NormalizeString(request.width_2),
                    width_3 = NormalizeString(request.width_3),
                    depth = NormalizeString(request.depth),
                    depth_2 = NormalizeString(request.depth_2),
                    depth_3 = NormalizeString(request.depth_3),
                    weight = NormalizeString(request.weight),
                    weight_2 = NormalizeString(request.weight_2),
                    weight_3 = NormalizeString(request.weight_3),
                    measure_date = NormalizeString(request.measure_date),
                    msr_module = NormalizeString(request.msr_module),
                    uom = NormalizeString(request.uom),
                    uom_2 = NormalizeString(request.uom_2),
                    uom_3 = NormalizeString(request.uom_3),
                    valid_item = NormalizeString(request.valid_item),

                    request.mantis_imported,
                    request.created_at,
                    request.updated_at,
                    Sku = NormalizeString(request.Sku),
                    sku_2 = NormalizeString(request.sku_2),
                    sku_3 = NormalizeString(request.sku_3),
                    request.is_verified,
                    sku_x3 = NormalizeString(request.sku_x3),
                    sku_x3_2 = NormalizeString(request.sku_x3_2),
                    sku_x3_3 = NormalizeString(request.sku_x3_3),
                    zone = NormalizeString(request.zone),
                    request.is_serialized,
                    request.is_expired,
                    x3_uom = NormalizeString(request.x3_uom)
                };

                return await _dataAccess.SaveDataInline(query, parameters);
            }
            catch (Exception ex)
            {
                // Log the exception (optional)
                return 0;
            }
        }
        public async Task<int> UpdateProductAsync(UpdateProductRequest request, int id)
        {
            try
            {

                var query = @"
    UPDATE Cus_Items
    SET
        source = @source,
        item_sku = @item_sku,
        upc = @upc,
        upc_2 = @upc_2,
        upc_3 = @upc_3,
        plt_rows = @plt_rows,
        plt_qty_row = @plt_qty_row,
        [desc] = @desc,
        inner_pack_upc_ref = @inner_pack_upc_ref,
        inner_pack_sku_ref = @inner_pack_sku_ref,
        inner_pack_units = @inner_pack_units,
        inner_pack_units_2 = @inner_pack_units_2,
        is_repack = @is_repack,
        height = @height,
        height_2 = @height_2,
        height_3 = @height_3,
        width = @width,
        width_2 = @width_2,
        width_3 = @width_3,
        depth = @depth,
        depth_2 = @depth_2,
        depth_3 = @depth_3,
        weight = @weight,
        weight_2 = @weight_2,
        weight_3 = @weight_3,
        measure_date = @measure_date,
        msr_module = @msr_module,
        uom = @uom,
        uom_2 = @uom_2,
        uom_3 = @uom_3,
        valid_item = @valid_item,
        mantis_imported = @mantis_imported,
        sku = @sku,
        sku_2 = @sku_2,
        sku_3 = @sku_3,
        is_verified = @is_verified,
        sku_x3 = @sku_x3,
        sku_x3_2 = @sku_x3_2,
        sku_x3_3 = @sku_x3_3,
        zone = @zone,
        is_serialized = @is_serialized,
        is_expired = @is_expired,
        x3_uom = @x3_uom,
        updated_at = @updated_at
    WHERE Id = @id";
                var parameters = new
                {
                    source = NormalizeString(request.source),
                    item_sku = NormalizeString(request.item_sku),
                    upc = NormalizeString(request.upc),
                    upc_2 = NormalizeString(request.upc_2),
                    upc_3 = NormalizeString(request.upc_3),
                    plt_rows = NormalizeString(request.plt_rows),
                    plt_qty_row = NormalizeString(request.plt_qty_row),
                    desc = NormalizeString(request.desc),
                    inner_pack_upc_ref = NormalizeString(request.inner_pack_upc_ref),
                    inner_pack_sku_ref = NormalizeString(request.inner_pack_sku_ref),
                    inner_pack_units = NormalizeString(request.inner_pack_units),
                    inner_pack_units_2 = NormalizeString(request.inner_pack_units_2),
                    is_repack = NormalizeString(request.is_repack),
                    height = NormalizeString(request.height),
                    height_2 = NormalizeString(request.height_2),
                    height_3 = NormalizeString(request.height_3),
                    width = NormalizeString(request.width),
                    width_2 = NormalizeString(request.width_2),
                    width_3 = NormalizeString(request.width_3),
                    depth = NormalizeString(request.depth),
                    depth_2 = NormalizeString(request.depth_2),
                    depth_3 = NormalizeString(request.depth_3),
                    weight = NormalizeString(request.weight),
                    weight_2 = NormalizeString(request.weight_2),
                    weight_3 = NormalizeString(request.weight_3),
                    measure_date = NormalizeString(request.measure_date),
                    msr_module = NormalizeString(request.msr_module),
                    uom = NormalizeString(request.uom),
                    uom_2 = NormalizeString(request.uom_2),
                    uom_3 = NormalizeString(request.uom_3),
                    valid_item = NormalizeString(request.valid_item),
                    mantis_imported = request.mantis_imported,  // nullable int stays same
                    Sku = NormalizeString(request.Sku),
                    sku_2 = NormalizeString(request.sku_2),
                    sku_3 = NormalizeString(request.sku_3),
                    is_verified = request.is_verified,          // nullable int stays same
                    sku_x3 = NormalizeString(request.sku_x3),
                    sku_x3_2 = NormalizeString(request.sku_x3_2),
                    sku_x3_3 = NormalizeString(request.sku_x3_3),
                    zone = NormalizeString(request.zone),
                    is_serialized = request.is_serialized,      // nullable bool stays same
                    is_expired = request.is_expired,            // nullable bool stays same
                    x3_uom = NormalizeString(request.x3_uom),
                    updated_at = request.updated_at ?? DateTime.Now,
                    id
                };

                return await _dataAccess.SaveDataInline(query, parameters);
            }
            catch (Exception ex)
            {
                
                return 0;
            }
        }
        public async Task<int> UpdateProductAsync(int id)
        {
            try
            {
                var query = @" DELETE FROM Cus_Items WHERE Id = @id";
                var parameters = new
                {
                    id  
                };
                return await _dataAccess.SaveDataInline(query, parameters);
            }
            catch (Exception ex)
            {
                
                return 0;
            }
        }
        public async Task<int> UpdateMantisProductAsync(MantisProductupdateRequest request)
        {
            try
            {

                var query = @"
                    UPDATE Cus_T_MantisItemUpdates
                    SET
                    outer_upc = @outer_upc,
                    inner_sku = @inner_sku,
                    inner_upc = @inner_upc,
                    inner_units = @inner_units,
                    inner_uom = @inner_uom,
                    i_inner_sku = @i_inner_sku,
                    i_inner_upc = @i_inner_upc,
                    i_inner_units = @i_inner_units,
                    i_inner_uom = @i_inner_uom,
                    height = @height,
                    height_1 = @height_1,
                    height_2 = @height_2,
                    width = @width,
                    width_1 = @width_1,
                    width_2 = @width_2,
                    length = @length,
                    length_1 = @length_1,
                    length_2 = @length_2,
                    weight = @weight,
                    weight_1 = @weight_1,
                    weight_2 = @weight_2,
                    updated_at = GETDATE(),
                    outer_itf = @outer_itf,
                    inner_itf = @inner_itf,
                    i_inner_itf = @i_inner_itf,
                    [desc] = @desc

                    WHERE outer_sku = @outer_sku";
                var parameters = new
                {
                    request.outer_sku,
                    request.outer_upc,
                    request.inner_sku,
                    request.inner_upc,
                    request.inner_units,
                    request.inner_uom,
                    request.i_inner_sku,
                    request.i_inner_upc,
                    request.i_inner_units,
                    request.i_inner_uom,
                    request.height,
                    request.height_1,
                    request.height_2,
                    request.width,
                    request.width_1,
                    request.width_2,
                    request.length,
                    request.length_1,
                    request.length_2,
                    request.weight,
                    request.weight_1,
                    request.weight_2,
                    request.outer_itf,
                    request.inner_itf,
                    request.i_inner_itf,
                    request.desc
                };
                return await _dataAccess.SaveDataInline(query, parameters);
            }
            catch (Exception ex)
            {

                return 0;
            }
        }

        public async Task UpdateItemConversionAsync(string sku, string x3Uom)
        {
            try
            {
                var query = "UPDATE Cus_SageX3ToMantisConverion SET uom_x3 = @X3Uom WHERE sku_mantis = @Sku";
                await _dataAccess.SaveDataInline(query, new { Sku = sku, X3Uom = x3Uom });
            }
            catch (Exception ex)
            {
                return;
            }
        }
            public async Task ADDItemConversionAsync(string sku_x3, string Sku, string uom)
        {
            try
            {
                var query = "INSERT INTO Cus_SageX3ToMantisConverion (sku_x3, uom_mantis, sku_mantis)VALUES (@sku_x3, @uom, @Sku);";
                await _dataAccess.SaveDataInline(query, new { sku_x3 = sku_x3, uom = uom, Sku= Sku });
            }
            catch (Exception ex)
            {
                return;
            }

        }
        public async Task Addzone(string Sku, string zone)
        {
            try
            {
                var query = "INSERT INTO Cus_T_ItemsZones (Sku, Zones)VALUES (@sku, @Zones);";
                await _dataAccess.SaveDataInline(query, new { sku = Sku, Zones = zone });
            }
            catch (Exception ex)
            {
                return;
            }

        }
        public async Task<ItemDescDto?> GetItemDescAsync(Requestdesc request)
        {
            var query = "SELECT [Product_Name] FROM [Cus_Item_desc_Ab] WHERE [SKU] = @SKU";
            return (await _dataAccess.GetDataInline<ItemDescDto, dynamic>(query, new { SKU = request.sku })).FirstOrDefault();

        }
        public async Task<ResponseResult> UpdateItems(List<ProductUploadPayload> items)
        {
            var excelJson = JsonConvert.SerializeObject(items);

            var parameters = new DynamicParameters();
            parameters.Add("@ExcelJson", excelJson);
            parameters.Add("@RetResult", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);
            parameters.Add("@RetError", dbType: DbType.String, direction: ParameterDirection.Output, size: 4000);

            try
            {
                await _dataAccess.SaveData("[dbo].[Cus_Sp_UploadProductsFromExcelJson_v1]", parameters);

                string result = parameters.Get<string>("@RetResult");
                string error = parameters.Get<string>("@RetError");

                if (!string.IsNullOrWhiteSpace(error))
                {
                    return new ResponseResult
                    {
                        Error = 1,
                        Message = error
                    };
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = result
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Internal error while uploading: " + ex.Message
                };
            }
        }

        public async Task<MantisProductResponse> GetMantisProduct(string item_sku)
        {
            var response = new OrderTaskResponse();

            var query = @" SET NOCOUNT ON; exec Cus_mantis_items_with_dimensions_sp @code = @itemSku";

            // Prepare the parameters
            var parameters = new DynamicParameters();
            // Execute the main query to get task data
            parameters.Add("@itemSku", item_sku);
            var tasksQuery = await _dataAccess.GetDataInline<mantisproduct, dynamic>(query, parameters);


            return new MantisProductResponse
            {
                Data = tasksQuery.FirstOrDefault(),
            };
        }

    }
}
    