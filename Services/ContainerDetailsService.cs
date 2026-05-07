using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CsvHelper.Configuration;
using CsvHelper;
using Microsoft.AspNetCore.Http;
using Middleware.Data.Repository;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using OfficeOpenXml;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Asn1.Crmf;
using ExcelDataReader;
using MiddlewareWebAPI.Data.Repository;
using OfficeOpenXml.Style;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Web.Helpers;
using Swashbuckle.Swagger;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Security.Cryptography.Xml;
using static MiddlewareWebAPI.Data.Model.Zone;
using static MiddlewareWebAPI.Common.Enum.EnumData;
using System.Diagnostics.Eventing.Reader;
using static OfficeOpenXml.ExcelErrorValue;
using iTextSharp.text.log;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using System.Net.Http.Json;
using Org.BouncyCastle.Crypto;
using MiddlewareWebAPI.Common.Enum;
using System.ComponentModel;
using System.Data.SqlClient;
using static Hangfire.Storage.JobStorageFeatures;

namespace MiddlewareWebAPI.Services.Services
{
    public class ContainerDetailsService : IContainerDetailsService
    {
        private readonly IContainerDetailsRepository _containersRepository;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        //  private readonly ILogger _logger;
        private readonly IValidateItemHelper _validateItemHelper;
        private readonly IActivityLogRepository _IActivityLogRepository;

        public ContainerDetailsService(IContainerDetailsRepository containersRepository, IConfiguration configuration, HttpClient httpClient, IValidateItemHelper validateItemHelper, IActivityLogRepository iActivityLogRepository)
        {
            _containersRepository = containersRepository;
            _configuration = configuration;
            _httpClient = httpClient;
            _validateItemHelper = validateItemHelper;
            _IActivityLogRepository = iActivityLogRepository;
            // _logger = logger;
        }

        public async Task<IEnumerable<Containers>> GetManualContainerById(int id)
        {
            return await _containersRepository.GetManualContainerById(id);
        }

        public async Task<ManualContainerDetailResponse> GetManualContainerLines(ManualContainerDetailRequest request, int id)
        {
            return await _containersRepository.GetManualContainerLines(request, id);
        }

        public async Task<ContainerResponse> GetManualContainersGrid(ContainerRequest request)
        {
            return await _containersRepository.GetManualContainersGrid(request);
        }

        public async Task<bool> UpdateImportReady(UpdateManualContainerRequest request)
        {
            return await _containersRepository.UpdateImportReady(request);
        }
        public async Task<ManualContainerDeleteResponse> deleteContainer(ManualContainerDeleteRequest request)
        {
            return await _containersRepository.deleteContainer(request);
        }
        //public async Task<(int StatusCode, object Response)> UploadContainers(UploadContainerRequest request)
        //{

        //    if (request == null || !request.Orders.Any())
        //    {
        //        return (200, new { error = 1, message = "No orders found in uploaded data" });
        //    }

        //    await _containersRepository.UploadContainers(request);

        //    return (201, new { error = 0, message = "Excel file uploaded successfully" });
        //}

        //public async Task<ResponseResult> SyncIntersiteShipment()
        //{
        //    try
        //    {
        //        var lastContainer = await _containersRepository.GetLatestTransfer();
        //        var datetime = DateTime.TryParse(lastContainer?.create_dat_tim, out var parsedDate)
        //            ? parsedDate.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        //            : DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ssZ");

        //        var baseUrl = _configuration["ExternalApi:Endpoint"];
        //        var username = _configuration["ExternalApi:Username"];
        //        var password = _configuration["ExternalApi:Password"];

        //        var handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        //        };

        //        using var client = new HttpClient(handler);
        //        client.BaseAddress = new Uri(baseUrl);
        //        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        //        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        //        var url = $"YSDELIVERY?representation=YSDELIVERY.$query&where=BETFCY eq 2 and BPCORD eq 'NYMT' and CREDATTIM gt @{datetime}@&count=10";
        //        var fullUrl = new Uri(client.BaseAddress, url);
        //        var responseUrl = await client.GetAsync(fullUrl);
        //        responseUrl.EnsureSuccessStatusCode();
        //        var result = await responseUrl.Content.ReadAsStringAsync();
        //        var jsonResult = JsonConvert.DeserializeObject<dynamic>(result);
        //        var jsonData = jsonResult?["$resources"];

        //        var properties = new { request = url, response = jsonResult };

        //        await _containersRepository.LogActivity(new ActivityLog
        //        {
        //            @event = "sync",
        //            log_name = "inbound",
        //            module_id = 1,
        //            sub_module_id = 2,
        //            properties = JsonConvert.SerializeObject(properties),
        //            description = "Intersite Transfer",
        //            created_at = DateTime.Now
        //        });

        //        if (jsonData != null)
        //        {
        //            foreach (var transferToken in jsonData)
        //            {
        //                var container = new SyncManualContainers
        //                {
        //                    shipnum = transferToken.SDHNUM,
        //                    ctrnum = transferToken.SDHNUM,
        //                    create_dat_tim = transferToken["$etag"] != null
        //                        ? Convert.ToDateTime(transferToken["$etag"]).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        //                        : null,
        //                    fcy = transferToken?.SALFCY,
        //                    ship_date = transferToken?.SHIDAT,
        //                    is_transfer = true,
        //                    status = "1-Pending"
        //                };

        //                int ManualContainerId = 0;
        //                string? CtrNum = "";
        //                var existing = await _containersRepository.GetByShipNum(container.shipnum);
        //                if (existing != null)
        //                {
        //                    ManualContainerId = existing.id;
        //                    CtrNum = existing.ctrnum;
        //                    await _containersRepository.Update(container);
        //                }
        //                else
        //                {
        //                    var containerResult = await _containersRepository.Insert(container);
        //                    ManualContainerId = containerResult.Id;
        //                    CtrNum = containerResult.CtrNum;
        //                }

        //                string detailsUrl = $"YSDELIVERY(\"{transferToken?["SDHNUM"]?.ToString()}\")?representation=YSDELIVERY.$details";
        //                var fullUrlD = new Uri(client.BaseAddress, detailsUrl);
        //                var responseUrlDetails = await client.GetAsync(fullUrlD);
        //                responseUrlDetails.EnsureSuccessStatusCode();
        //                string response = await responseUrlDetails.Content.ReadAsStringAsync();

        //                var jsonResultDetails = JsonConvert.DeserializeObject<dynamic>(response);

        //                var propertiesData = new { request = detailsUrl, response = jsonResultDetails };
        //                await _containersRepository.LogActivity(new ActivityLog
        //                {
        //                    log_name = "inbound",
        //                    @event = "sync",
        //                    module_id = 1,
        //                    sub_module_id = 2,
        //                    properties = JsonConvert.SerializeObject(propertiesData),
        //                    description = "Intersite Transfer",
        //                    created_at = DateTime.Now
        //                });

        //                var containerDetails = new List<SyncManualContainerDetails>();

        //                //Loop directly through SDHSDD items
        //                if (jsonResultDetails != null && jsonResultDetails?["SDHSDD"] != null)
        //                {
        //                    foreach (var value in jsonResultDetails["SDHSDD"])
        //                    {
        //                        var itemRef = value["ITMREF"]?.ToString();
        //                        var qtyValue = value["QTY"]?.ToString();
        //                        var uomValue = value["SAU"]?.ToString();

        //                        var items = await _containersRepository.GetBySkuX3(itemRef);
        //                        string? sku = null;
        //                        string? uom = null;
        //                        bool is_invalid_item = false;
        //                        bool is_conveyable_item = false;
        //                        string? extractedQty = qtyValue;

        //                        if (items != null)
        //                        {
        //                            sku = items.sku_mantis;
        //                            uom = items.uom_mantis;

        //                            var isValidResult = await _validateItemHelper.ValidateItem(itemRef);
        //                            var isConveyableResult = await _validateItemHelper.ValidateConveyableItem(itemRef);

        //                            if (isValidResult?.IsValid == 1)
        //                            {
        //                                int parsedQty;
        //                                int qty = int.TryParse(qtyValue, out parsedQty) ? parsedQty : 0;

        //                                var conversion = await _containersRepository.ValidateItem(sku, uom, "", qty, 2);
        //                                extractedQty = conversion?.qty.ToString() ?? extractedQty;
        //                                uom = conversion?.uom ?? uom;
        //                                is_invalid_item = false;
        //                            }
        //                            else
        //                            {
        //                                is_invalid_item = true;
        //                                await _containersRepository.MarkContainInvalidItems(CtrNum, true);
        //                            }

        //                            if (isConveyableResult.IsValid == 1)
        //                            {
        //                                is_conveyable_item = false;
        //                            }
        //                            else
        //                            {
        //                                is_conveyable_item = true;
        //                                await _containersRepository.UpdateConveyableFlag(CtrNum, 1);
        //                            }
        //                        }
        //                        else
        //                        {
        //                            sku = null;
        //                            uom = null;
        //                            is_invalid_item = true;
        //                            is_conveyable_item = true;
        //                            await _containersRepository.UpdateConveyableAndInvalidItemsFlag(CtrNum, 1, true);
        //                        }
        //                        var rows = value.SDHSDDZSTOJOU;
        //                        var status = ContainerDetailsStatuses.Unprocessed;
        //                        var description = EnumData.GetContainerDescription(status);
        //                        int qtyParsed;
        //                        int inputQty;
        //                        if (rows != null && rows.Any())
        //                        {
        //                            foreach (var row in rows)
        //                            {
        //                                var PT = uom;

        //                                // read STJACTQTY safely
        //                                int lotQty = row.STJACTQTY != null ? Convert.ToInt32(row.STJACTQTY) : 0;

        //                                // Call your ValidateItemHelper service method
        //                                var resultLot = await _validateItemHelper.GetItemConversion(sku, PT, lotQty);

        //                                // Assign Qty, fallback to lotQty if null
        //                                lotQty = resultLot?.Qty != null ? (int)resultLot.Qty : lotQty;

        //                                // Assign UOM, fallback to PT if null
        //                                var lotUom = resultLot?.UOM ?? PT;

        //                                containerDetails.Add(new SyncManualContainerDetails
        //                                {
        //                                    container_id = ManualContainerId,
        //                                    fcy = transferToken?.SALFCY,
        //                                    ctrnum = CtrNum,
        //                                    shipnum = CtrNum,
        //                                    create_dat_tim = transferToken["$etag"],
        //                                    itmref = sku,
        //                                    uom = lotUom,
        //                                    status = description,
        //                                    invalid_item = is_invalid_item,
        //                                    conveyable = is_conveyable_item,
        //                                    qtyuom = lotQty,
        //                                    input_sku = value.ITMREF != null ? value.ITMREF.ToString() : null,
        //                                    input_uom = value.SAU,
        //                                    input_qty = value.QTY,
        //                                    input_lot = row.STJLOT,
        //                                    input_lot_qty = row.STJACTQTY.ToString()
        //                                });
        //                            }
        //                        }
        //                        else
        //                        {

        //                            containerDetails.Add(new SyncManualContainerDetails
        //                            {
        //                                container_id = ManualContainerId,
        //                                fcy = transferToken?.SALFCY,
        //                                ctrnum = CtrNum,
        //                                shipnum = CtrNum,
        //                                create_dat_tim = transferToken["$etag"],
        //                                itmref = sku,
        //                                uom = uom,
        //                                status = description,
        //                                invalid_item = is_invalid_item,
        //                                conveyable = is_conveyable_item,
        //                                qtyuom = int.TryParse(extractedQty, out qtyParsed) ? qtyParsed : 0,
        //                                input_sku = itemRef,
        //                                input_uom = uomValue,
        //                                input_qty = int.TryParse(qtyValue, out inputQty) ? inputQty : 0
        //                            });
        //                        }
        //                    }

        //                        // Insert all details only once per container
        //                        await _containersRepository.UpsertManualContainerDetails(containerDetails);

        //                    // Log activity once per container
        //                    var activity = new ActivityLog
        //                    {
        //                        log_name = "inbound",
        //                        subject_ref = $"{CtrNum}",
        //                        module_id = 1,
        //                        sub_module_id = 2,
        //                        @event = "created",
        //                        properties = JsonConvert.SerializeObject(new { data = container }),
        //                        description = $"Intersite Transfer | {CtrNum}",
        //                        created_at = DateTime.Now
        //                    };
        //                    await _containersRepository.LogActivity(activity);
        //                }
        //            }

        //            return new ResponseResult { Error = 0, Message = "Data Synced Successfully" };
        //        }

        //        return new ResponseResult { Error = 1, Message = "No data found to sync" };
        //    }
        //    catch (Exception ex)
        //    {
        //        await _containersRepository.LogActivity(new ActivityLog
        //        {
        //            @event = "error",
        //            log_name = "inbound",
        //            module_id = 1,
        //            sub_module_id = 2,
        //            properties = JsonConvert.SerializeObject(new { errorMessage = ex.Message }),
        //            description = "Error syncing intersite shipment"
        //        });

        //        return new ResponseResult { Error = 1, Message = $"Error: {ex.Message}" };
        //    }
        //}
        //public async Task<DataTable> FetchAndPrintJsonAsTableAsync(string jsonString)
        //{
        //    using JsonDocument doc = JsonDocument.Parse(jsonString);
        //    var root = doc.RootElement;

        //    // Create a DataTable for the response
        //    var table = new DataTable("SDH Response");
        //    var columnNames = new HashSet<string>();

        //    // Add root-level columns you're going to include in each row
        //    string[] rootFields = { "BPAADD", "BPCORD", "SALFCY", "SDHNUM", "SDHTYP", "STOFCY" };
        //    foreach (var field in rootFields)
        //    {
        //        if (root.TryGetProperty(field, out _))
        //        {
        //            if (columnNames.Add(field))
        //                table.Columns.Add(field);
        //        }
        //    }

        //    // Add nested fields under SDHSDD (array)
        //    if (root.TryGetProperty("SDHSDD", out JsonElement sdhddArray) && sdhddArray.ValueKind == JsonValueKind.Array)
        //    {
        //        var firstItem = sdhddArray[0];
        //        foreach (var prop in firstItem.EnumerateObject())
        //        {
        //            if (prop.Value.ValueKind == JsonValueKind.Object)
        //            {
        //                foreach (var nested in prop.Value.EnumerateObject())
        //                {
        //                    string colName = $"SDHSDD_{prop.Name}_{nested.Name}";
        //                    if (columnNames.Add(colName))
        //                        table.Columns.Add(colName);
        //                }
        //            }
        //            else
        //            {
        //                if (columnNames.Add($"SDHSDD_{prop.Name}"))
        //                    table.Columns.Add($"SDHSDD_{prop.Name}");
        //            }
        //        }
        //    }

        //    // Add rows
        //    var row = table.NewRow();

        //    // Add root-level fields to the row
        //    foreach (var field in rootFields)
        //    {
        //        if (root.TryGetProperty(field, out JsonElement value))
        //        {
        //            row[field] = value.ToString();
        //        }
        //    }

        //    // Add SDHSDD-specific fields to the row
        //    if (root.TryGetProperty("SDHSDD", out JsonElement SdhddArray) && sdhddArray.ValueKind == JsonValueKind.Array)
        //    {
        //        foreach (var item in sdhddArray.EnumerateArray())
        //        {
        //            foreach (var prop in item.EnumerateObject())
        //            {
        //                if (prop.Value.ValueKind == JsonValueKind.Object)
        //                {
        //                    foreach (var nested in prop.Value.EnumerateObject())
        //                    {
        //                        string colName = $"SDHSDD_{prop.Name}_{nested.Name}";
        //                        if (table.Columns.Contains(colName))
        //                            row[colName] = nested.Value.ToString();
        //                    }
        //                }
        //                else
        //                {
        //                    string colName = $"SDHSDD_{prop.Name}";
        //                    if (table.Columns.Contains(colName))
        //                        row[colName] = prop.Value.ToString();
        //                }
        //            }
        //        }
        //    }

        //    // Add the row to the table
        //    table.Rows.Add(row);

        //    return table;
        //}
        public async Task<ResponseResult> SyncIntersiteShipment()
        {
            try
            {
                var lastContainer = await _containersRepository.GetLatestTransfer();
                var datetime = DateTime.TryParse(lastContainer?.create_dat_tim, out var parsedDate)
                    ? parsedDate.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                    : DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ssZ");

                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];
                var handler = new HttpClientHandler

                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler);
                client.BaseAddress = new Uri(baseUrl);
                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                // query
                var url = $"YSDELIVERY?representation=YSDELIVERY.$query&where=BETFCY eq 2 and BPCORD eq 'NYMT' and CREDATTIM gt @{datetime}@&count=10";
                var fullUrl = new Uri(client.BaseAddress, url);
                var responseUrl = await client.GetAsync(fullUrl);
                responseUrl.EnsureSuccessStatusCode();
                var result = await responseUrl.Content.ReadAsStringAsync();
                var jsonResult = JsonConvert.DeserializeObject<JObject>(result);
                var jsonData = jsonResult?["$resources"];

                // log initial sync
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    @event = "sync",
                    log_name = "inbound",
                    module_id = 1,
                    sub_module_id = 2,
                    properties = JsonConvert.SerializeObject(new { request = url, response = jsonResult }),
                    description = "Intersite Transfer",
                    created_at = DateTime.UtcNow    
                });

                if (jsonData == null || !jsonData.Any())
                    return new ResponseResult { Error = 1, Message = "No data found to sync" };

                foreach (var transferToken in jsonData)
                {
                    var container = new SyncManualContainers
                    {
                        shipnum = transferToken["SDHNUM"]?.ToString(),
                        ctrnum = transferToken["SDHNUM"]?.ToString(),
                        fcy = transferToken["SALFCY"]?.ToString(),
                        create_dat_tim = transferToken["$etag"] != null ? Convert.ToDateTime(transferToken["$etag"]).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") : null,
                        //ship_date = DateTime.TryParse(transferToken["SHIDAT"]?.ToString(), out  parsedDate) 
                        //? parsedDate.Date : (DateTime?)null,
                        ship_date = DateTime.TryParse(transferToken["SHIDAT"]?.ToString(), out parsedDate) ? parsedDate.ToString("yyyy-MM-dd"): null,
                        is_transfer = true,
                        status = "1-Pending",
                        created_at = DateTime.UtcNow,
                        updated_at = DateTime.UtcNow
                    };

                    int manualContainerId;
                    string ctrNum;
                    var existing = await _containersRepository.GetByShipNum(container.shipnum);
                    if (existing != null)
                    {
                        manualContainerId = existing.id;
                        ctrNum = existing.ctrnum;
                        await _containersRepository.Update(container);
                    }
                    else
                    {
                        var containerResult = await _containersRepository.Insert(container);
                        manualContainerId = containerResult.Id;
                        ctrNum = containerResult.CtrNum;
                    }

                    // fetch details
                    string detailsUrl = $"YSDELIVERY(\"{transferToken["SDHNUM"]?.ToString()}\")?representation=YSDELIVERY.$details";
                    var fullUrlD = new Uri(client.BaseAddress, detailsUrl);
                    var responseUrlDetails = await client.GetAsync(fullUrlD);
                    responseUrlDetails.EnsureSuccessStatusCode();
                    string response = await responseUrlDetails.Content.ReadAsStringAsync();
                    var jsonResultDetails = JsonConvert.DeserializeObject<JObject>(response);

                    // log details response
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        @event = "sync",
                        module_id = 1,
                        sub_module_id = 2,
                        properties = JsonConvert.SerializeObject(new { request = detailsUrl, response = jsonResultDetails }),
                        description = "Intersite Transfer",
                        created_at = DateTime.UtcNow
                    });

                    var containerDetails = new List<SyncManualContainerDetails>();

                    if (jsonResultDetails?["SDHSDD"] is JArray sdhddArray)
                    {
                        string? sku =null;
                        string? uom =null;
                        foreach (var value in sdhddArray)
                        {
                            var itemRef = value["ITMREF"]?.ToString();
                            var qtyValue = value["QTY"]?.ToString();
                            var uomValue = value["SAU"]?.ToString();

                            var items = await _containersRepository.GetBySkuX3(itemRef);
                             sku = items?.sku_mantis;
                             uom = items?.uom_mantis;
                            bool is_invalid_item = false;
                            bool is_conveyable_item = false; 

                            string extractedQty = qtyValue ?? "0";

                            if (items != null)
                            {
                                var isValidResult = await _validateItemHelper.ValidateItem(itemRef);
                                var isConveyableResult = await _validateItemHelper.ValidateConveyableItem(itemRef);

                                if (isValidResult?.IsValid == 1)
                                {
                                    var qtyDecimal = decimal.TryParse(qtyValue, out var parsedQty) ? parsedQty : 0;

                                    var conversion = await _validateItemHelper.GetItemConversion(sku, uom, qtyDecimal);
                                        extractedQty = conversion?.Qty.ToString() ?? extractedQty;
                                        uom = conversion?.UOM ?? uom;
                                       is_invalid_item = false;

                                    
                                }
                                else
                                {
                                    is_invalid_item = true;
                                    //existing.contain_invalid_items = true;
                                    await _containersRepository.MarkContainInvalidItems(ctrNum,true);

                                }
                                if (isConveyableResult.IsValid == 1)
                                {
                                    is_conveyable_item = false;
                                }
                                else
                                {
                                    is_conveyable_item = true;
                                    //existing.conveyable = 1;
                                    await _containersRepository.UpdateConveyableFlag(ctrNum, 1);
                                }
                            }
                            else
                            {
                                sku = null;
                                uom = null;
                                is_invalid_item = true;
                                is_conveyable_item = true;
                                //existing.conveyable = 1;
                                //existing.contain_invalid_items = true;
                                await _containersRepository.UpdateConveyableAndInvalidItemsFlag(ctrNum,1,true);
                            }


                            var status = ContainerDetailsStatuses.Unprocessed;
                            var description = EnumData.GetContainerDescription(status);

                            if (value["SDHSDDZSTOJOU"] is JArray rows && rows.Any())
                            {
                                foreach (var row in rows)
                                {
                                    int lotQty = row["STJACTQTY"] != null ? Convert.ToInt32(row["STJACTQTY"]) : 0;
                                    var resultLot = await _validateItemHelper.GetItemConversion(sku, uom, lotQty);
                                    lotQty = resultLot?.Qty != null ? Convert.ToInt32(resultLot.Qty) : lotQty;
                                    var lotUom = resultLot?.UOM ?? uom;

                                    containerDetails.Add(new SyncManualContainerDetails
                                    {
                                        container_id = manualContainerId,
                                        fcy = transferToken["SALFCY"]?.ToString(),
                                        ctrnum = ctrNum,
                                        shipnum = ctrNum,
                                        create_dat_tim = transferToken["$etag"]?.ToString(),
                                        itmref = sku,
                                        uom = lotUom,
                                        status = description,
                                        invalid_item = is_invalid_item,
                                        conveyable = is_conveyable_item,
                                        //qtyuom = lotQty,
                                        qtyuom = Math.Abs(lotQty),
                                       //qtyuom = int.TryParse(qtyValue, out var qtyParsed) ? qtyParsed : 0,
                                        input_sku = itemRef,
                                        input_uom = uomValue,
                                        input_qty = int.TryParse(qtyValue, out var inputQty) ? inputQty : 0,
                                        input_lot = row["STJLOT"]?.ToString(),
                                        //input_lot_qty = row["STJACTQTY"]?.ToString()
                                        input_lot_qty = Math.Abs(Convert.ToDecimal(row["STJACTQTY"])).ToString()

                                    });
                                }
                            }
                            else
                            {
                                containerDetails.Add(new SyncManualContainerDetails
                                {
                                    container_id = manualContainerId,
                                    fcy = transferToken["SALFCY"]?.ToString(),
                                    ctrnum = ctrNum,
                                    shipnum = ctrNum,
                                    create_dat_tim = transferToken["$etag"]?.ToString(),
                                    itmref = sku,
                                    uom = uom,
                                    status = description,
                                    invalid_item = is_invalid_item,
                                    conveyable = is_conveyable_item,
                                    qtyuom = int.TryParse(extractedQty, out var qtyParsed) ? qtyParsed : 0,
                                    input_sku = itemRef,
                                    input_uom = uomValue,
                                    input_qty = int.TryParse(qtyValue, out var inputQty) ? inputQty : 0,
                                    input_lot = null,
                                    input_lot_qty = null
                                });
                            }
                        }

                        // Split into chunks of 50
                        var chunks = containerDetails.Chunk(50);

                        foreach (var chunk in chunks)
                        {
                            // Remove duplicates based on ContainerId + Itmref + Uom
                            var uniqueChunk = chunk
                                .GroupBy(x => new { x.container_id, x.itmref, x.uom })
                                .Select(g => g.First())
                                .ToList();

                            // Call repo for upsert
                            await _containersRepository.UpsertManualContainerDetails(containerDetails);
                        }
                        await _IActivityLogRepository.ActivityLog(new ActivityLog
                        {
                            log_name = "inbound",
                            subject_ref = ctrNum,
                            module_id = 1,
                            sub_module_id = 2,
                            @event = "created",
                            properties = JsonConvert.SerializeObject(new { data = container }),
                            description = $"Intersite Transfer | {ctrNum}",
                            created_at = DateTime.UtcNow
                        });
                    }
                }

                return new ResponseResult { Error = 0, Message = "Data Synced Successfully" };
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    @event = "error",
                    log_name = "inbound",
                    module_id = 1,  
                    sub_module_id = 2,
                    properties = JsonConvert.SerializeObject(new { errorMessage = ex.Message }),
                    description = "Error syncing intersite shipment",
                    created_at = DateTime.UtcNow
                });

                return new ResponseResult { Error = 1, Message = $"Error: {ex.Message}" };
            }
        }

        public DataTable FetchAndPrintJsonAsTable(string jsonString)
        {
            using JsonDocument doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            var table = new DataTable("SDH Response");
            var columnNames = new HashSet<string>();

            // Root-level fields
            string[] rootFields = { "BPAADD", "BPCORD", "SALFCY", "SDHNUM", "SDHTYP", "STOFCY" };
            foreach (var field in rootFields)
            {
                if (columnNames.Add(field))
                    table.Columns.Add(field);
            }

            // Collect schema from SDHSDD (once only)
            if (root.TryGetProperty("SDHSDD", out JsonElement sdhddArray) && sdhddArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var sdhdd in sdhddArray.EnumerateArray())
                {
                    foreach (var prop in sdhdd.EnumerateObject())
                    {
                        if (prop.Value.ValueKind == JsonValueKind.Object)
                        {
                            foreach (var nested in prop.Value.EnumerateObject())
                            {
                                string colName = $"SDHSDD_{prop.Name}_{nested.Name}";
                                if (columnNames.Add(colName))
                                    table.Columns.Add(colName);
                            }
                        }
                        else if (prop.Value.ValueKind != JsonValueKind.Array)
                        {
                            string colName = $"SDHSDD_{prop.Name}";
                            if (columnNames.Add(colName))
                                table.Columns.Add(colName);
                        }

                        // Handle nested JOU array
                        if (prop.Name == "SDHSDDZSTOJOU" && prop.Value.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var jou in prop.Value.EnumerateArray())
                            {
                                foreach (var jouProp in jou.EnumerateObject())
                                {
                                    string colName = $"SDHSDDZSTOJOU_{jouProp.Name}";
                                    if (columnNames.Add(colName))
                                        table.Columns.Add(colName);
                                }
                            }
                        }
                    }
                }
            }

            // Populate rows
            if (root.TryGetProperty("SDHSDD", out JsonElement sdhddArr) && sdhddArr.ValueKind == JsonValueKind.Array)
            {
                foreach (var sdhdd in sdhddArr.EnumerateArray())
                {
                    if (sdhdd.TryGetProperty("SDHSDDZSTOJOU", out JsonElement jouArray) && jouArray.ValueKind == JsonValueKind.Array)
                    {
                        // One row per JOU
                        foreach (var jou in jouArray.EnumerateArray())
                        {
                            var row = table.NewRow();

                            // Root fields
                            foreach (var field in rootFields)
                                row[field] = root.TryGetProperty(field, out var rootVal) ? rootVal.ToString() : "";

                            // SDHSDD fields
                            foreach (var prop in sdhdd.EnumerateObject())
                            {
                                if (prop.Value.ValueKind == JsonValueKind.Object)
                                {
                                    foreach (var nested in prop.Value.EnumerateObject())
                                    {
                                        string colName = $"SDHSDD_{prop.Name}_{nested.Name}";
                                        if (table.Columns.Contains(colName))
                                            row[colName] = nested.Value.ToString();
                                    }
                                }
                                else if (prop.Value.ValueKind != JsonValueKind.Array)
                                {
                                    string colName = $"SDHSDD_{prop.Name}";
                                    if (table.Columns.Contains(colName))
                                        row[colName] = prop.Value.ToString();
                                }
                            }

                            // JOU fields
                            foreach (var jouProp in jou.EnumerateObject())
                            {
                                string colName = $"SDHSDDZSTOJOU_{jouProp.Name}";
                                if (table.Columns.Contains(colName))
                                    row[colName] = jouProp.Value.ToString();
                            }

                            table.Rows.Add(row);
                        }
                    }
                    else
                    {
                        // No JOU array → one row per SDHSDD
                        var row = table.NewRow();

                        foreach (var field in rootFields)
                            row[field] = root.TryGetProperty(field, out var rootVal) ? rootVal.ToString() : "";

                        foreach (var prop in sdhdd.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == JsonValueKind.Object)
                            {
                                foreach (var nested in prop.Value.EnumerateObject())
                                {
                                    string colName = $"SDHSDD_{prop.Name}_{nested.Name}";
                                    if (table.Columns.Contains(colName))
                                        row[colName] = nested.Value.ToString();
                                }
                            }
                            else if (prop.Value.ValueKind != JsonValueKind.Array)
                            {
                                string colName = $"SDHSDD_{prop.Name}";
                                if (table.Columns.Contains(colName))
                                    row[colName] = prop.Value.ToString();
                            }
                        }

                        table.Rows.Add(row);
                    }
                }
            }

            return table;
        }

        public async Task<ResponseResult> RevalidateConveyAbleItems(int containerId)
        {
            try
            {
                var containerDetails = await _containersRepository.GetDetailsByContainerId(containerId);
                int invalidCount = containerDetails.Count();
                int invalidDetailsCount = 0;

                foreach (var detail in containerDetails)
                {
                    var validationResult = await _validateItemHelper.ValidateConveyableItem(detail.input_sku);
                    if (validationResult.Error == 0 && validationResult.IsValid == 1)
                    {
                        await _containersRepository.UpdateDetailConveyable(detail.id, 0);
                        invalidDetailsCount++;
                    }
                }

                if (invalidCount == invalidDetailsCount)
                {
                    await _containersRepository.UpdateContainerConveyable(containerId, 0);
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Operation successful"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Could not perform operation | " + ex.Message
                };
            }
        }

        public async Task<ResponseResult> RevalidateItems(int containerId)
        {
            try
            {
                var container = await _containersRepository.GetContainerById(containerId);
                var details = await _containersRepository.GetContainerDetailsByContainerId(containerId);

                int invalidCount = details.Count;
                int invalidDetailsCount = 0;

                foreach (var value in details)
                {
                    var isValid = await _validateItemHelper.ValidateItem(value.input_sku);

                    if (isValid.Error == 0 && isValid.IsValid == 1)
                    {
                        //_logger.LogInformation("Item validation log: SKU={Sku}, UOM={Uom}, InputQty={Qty}, ConversionType=4",
                        //    isValid.Sku, isValid.Uom, value.InputQty);
                        //int.TryParse(value.input_qty, out var skuAsDecimal);

                        var conversion = await _validateItemHelper.GetItemConversion(isValid.Sku, isValid.Uom, value.input_qty.HasValue ? value.input_qty.Value : 0);

                        var detail = (await _containersRepository.GetById(value.id));
                        var detailList = detail;
                        detailList.itmref = isValid.Sku;
                        detailList.uom = conversion?.UOM ?? isValid.Uom;
                        detailList.qtyuom = (int?)(conversion?.Qty) ??value.input_qty ?? 0;
                        detailList.invalid_item = false;
                        if (value.mantis_imported && value.invalid_item)
                        {
                            detailList.mantis_imported = false;
                            container.mantis_imported_H = false;
                            await _containersRepository.UpdateContainerDetail(detailList);
                            await _containersRepository.UpdateContainer(container);
                            invalidDetailsCount++;
                        }
                        else if (value.mantis_imported == false)
                        {
                            await _containersRepository.UpdateContainerDetail(detailList);
                            invalidDetailsCount++;
                        }
                    }
                }

                if (invalidCount == invalidDetailsCount)
                {
                    await _containersRepository.UpdateContainerInvalidStatus(containerId);
                }

                return new ResponseResult
                {
                    Error = 0,
                    Message = "Items Revalidated"
                };
            }
            catch (Exception ex)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "Could not revalidate the item"
                };
            }
        }
        public async Task<ContainerLineResponse> GetContainerLinesByAsnId(int asnId)
        {
            return await _containersRepository.GetContainerLinesByAsnId(asnId);

        }

        public async Task<ApisResponse> UploadContainers(UploadContainerRequest request)
        {
            try
            {
                // Handle Bulk Load
                if (request.BulkLoad)
                {
                    try
                    {
                        var ctrnums = request.ctrnums;


                        if (ctrnums == null || !ctrnums.Any())
                        {
                            return new ApisResponse { Error = 1, Message = "No valid container numbers found in the file." };
                        }

                        var result = await _containersRepository.BulkMarkReceiptComplete(ctrnums);
                        return new ApisResponse
                        {
                            Error = result.Error,
                            Message = result.Message
                        };

                    }
                    catch (Exception ex)
                    {
                        return new ApisResponse { Error = 1, Message = "Error processing file: " + ex.Message };
                    }
                }

                //Handle Non-Bulk Upload
                if (!request.BulkLoad)
                {
                    // Assuming request contains rows parsed already from frontend
                    if (request.Orders == null || !request.Orders.Any())
                    {
                        return new ApisResponse { Error = 1, Message = "No orders found in uploaded data." };
                    }

                    await _containersRepository.UploadContainers(request);

                    return new ApisResponse { Error = 0, Message = "Excel file uploaded successfully." };
                }

                return new ApisResponse { Error = 1, Message = "Invalid request state." };
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = "Could not upload file | " + ex.Message
                };
            }
        }

        //public async Task<ApisResponse> MarkReceiptComplete(MarkReceiptCompleteRequest request)
        //{
        //    try
        //    {
        //        var containers = request.Containers.ToList();

        //        if (containers == null || !containers.Any())
        //            return new ApisResponse { Error = 1, Message = "No containers provided." };

        //        List<string> ids;

        //        if (!string.IsNullOrEmpty(containers[0].ship_uid))
        //        {
        //            ids = containers.Select(c => c.ship_uid).ToList();
        //        }
        //        else 
        //        if (!string.IsNullOrEmpty(containers[0].ctrnum))
        //            ids = containers.Select(c => c.ctrnum).ToList();
        //        else
        //            return new ApisResponse { Error = 1, Message = "Invalid container data." };

        //        var receiptIds = await _containersRepository.GetReceiptIdsByCodes(ids);
        //        if (receiptIds == null || !receiptIds.Any())
        //            return new ApisResponse { Error = 1, Message = "Receipt not found." };
        //        // Step 2: Prepare API client
        //        var baseUrl = _configuration["MantisApi:Endpoint"];
        //        var apiKey = _configuration["MantisApi:ApiKey"];

        //        var handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        //        };

        //        using var client = new HttpClient(handler)
        //        {
        //            BaseAddress = new Uri(baseUrl)
        //        };

        //        client.DefaultRequestHeaders.Add("ApiKey", apiKey);
        //        client.DefaultRequestHeaders.Accept.Clear();
        //        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        //        bool anySuccess = false;
        //        string lastSuccessMessage = "";
        //        string lastErrorMessage = "";

        //        // Step 3: Loop over each receipt and update status
        //        foreach (var receiptId in receiptIds)
        //        {
        //            string requestUrl = $"api/Receipts/UpdateReceiptStatus?receiptID={receiptId}&progressID=3";
        //            var response = await client.PutAsync(requestUrl, new StringContent(""));

        //            if (response.IsSuccessStatusCode)
        //            {
        //                var responseBody = await response.Content.ReadAsStringAsync();
        //                var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

        //                if (result?.IsSuccess == true)
        //                {
        //                    anySuccess = true;
        //                    lastSuccessMessage = result.Message;
        //                }
        //                else
        //                {
        //                    lastErrorMessage = result?.Message ?? "Unknown error during API call.";
        //                }
        //            }
        //            else
        //            {
        //                lastErrorMessage = $"API call failed for receiptID {receiptId}.";
        //            }
        //        }

        //        if (result.IsSuccess)
        //        {
        //            await _containersRepository.UpdateManualContainerStatus(ids, "3-completed");
        //            return new ApisResponse { Error = 0, Message = result.Message };
        //        }
        //        else
        //        {
        //            return new ApisResponse { Error = 1, Message = result.Message };
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ApisResponse { Error = 1, Message = ex.Message };
        //    }
        //}

        public async Task<ApisResponse> MarkReceiptComplete(MarkReceiptCompleteRequest request)
        {
            try
            {
                var containers = request.Containers?.ToList();

                if (containers == null || !containers.Any())
                    return new ApisResponse { Error = 1, Message = "No containers provided." };

                List<string> ids;

                if (!string.IsNullOrEmpty(containers[0].ship_uid))
                {
                    ids = containers.Select(c => c.ship_uid).ToList();
                }
                else if (!string.IsNullOrEmpty(containers[0].ctrnum))
                {
                    ids = containers.Select(c => c.ctrnum).ToList();
                }
                else
                {
                    return new ApisResponse { Error = 1, Message = "Invalid container data." };
                }

                var receiptIds = await _containersRepository.GetReceiptIdsByCodes(ids);
                if (receiptIds == null || !receiptIds.Any())
                {
                    return new ApisResponse { Error = 1, Message = "Receipt not found." };
                }

                // Prepare Mantis API details
                var baseUrl = _configuration["MantisApi:Endpoint"];
                var apiKey = _configuration["MantisApi:ApiKey"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                client.DefaultRequestHeaders.Add("ApiKey", apiKey);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                // Prepare an payload: ReceiptIDs should be a list
                var payload = new UpdateReceiptStatusBulkRequest
                {
                    ReceiptIDs = receiptIds,
                    ProgressID = 3
                };

                string jsonPayload = JsonConvert.SerializeObject(payload);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                string requestUrl = "api/Receipts/UpdateReceiptStatusBulk";
                var response = await client.PutAsync(requestUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<dynamic>(responseBody);

                    if (result?.IsSuccess == true)
                    {
                        await _containersRepository.UpdateManualContainerStatus(ids, "3-completed");
                        return new ApisResponse { Error = 0, Message = result.Message };
                    }
                    else
                    {
                        return new ApisResponse { Error = 1, Message = result?.Message ?? "API call failed." };
                    }
                }
                else
                {
                    return new ApisResponse { Error = 1, Message = $"API call failed with status {response.StatusCode}." };
                }
            }
            catch (Exception ex)
            {
                return new ApisResponse { Error = 1, Message = ex.Message };
            }
        }
        public async Task<ApisResponse> RemoveReservation(RemoveReservationRequest request)
        {
            if (request?.containers == null || request.containers.Count == 0)
            {
                return new ApisResponse { Error = 1, Message = "No container data provided." };
            }

            var ids = new List<string>();

            // Collect all valid IDs from containers
            foreach (var container in request.containers)
            {
                string id = container.ship_uid ?? container.ship_num ?? container.ctrnum;
                if (!string.IsNullOrEmpty(id))
                {
                    ids.Add(id);
                }
            }

            if (!ids.Any())
            {
                return new ApisResponse { Error = 1, Message = "No valid IDs found in containers." };
            }

            return await _containersRepository.RemoveReservation(ids);
        }

        public async Task<ApisResponse> CreateContainerDetail(CreateContainerDetailRequest request)
        {
            try
            {
                if (request.containers == null || !request.containers.Any())
                {
                    return new ApisResponse { Error = 1, Message = "Invalid shipments data" };
                }


                foreach (var shipment in request.containers)
                {
                    var ctrnum = shipment.ctrnum;

                    await _containersRepository.DeleteContainerDetails(ctrnum);

                    var baseUrl = _configuration["ExternalApi:Endpoint"];
                    var username = _configuration["ExternalApi:Username"];
                    var password = _configuration["ExternalApi:Password"];

                    var handler = new HttpClientHandler
                    {
                        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                    };

                    using var client = new HttpClient(handler);
                    client.BaseAddress = new Uri(baseUrl);
                    var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                    var requestUrl = $"YSDELIVERY(\"{Uri.EscapeDataString(ctrnum)}\")?representation=YSDELIVERY.$details";

                    var fullUrl = new Uri(client.BaseAddress, requestUrl);
                    var responseUrl = await client.GetAsync(fullUrl);
                    responseUrl.EnsureSuccessStatusCode();
                    var response = await responseUrl.Content.ReadAsStringAsync();
                    var jsonResultDetails = JsonConvert.DeserializeObject<JObject>(response);
                        
                    var result = JsonConvert.DeserializeObject<RootModel>(response);


                    // Always log sync
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        @event = "sync",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.transfer,
                        properties = JsonConvert.SerializeObject(new { request = requestUrl, response = jsonResultDetails }),
                        description = "Intersite Transfer",
                        created_at = DateTime.UtcNow
                    });



                    var sdhSddArray = result.SDHSDD;

                    if (sdhSddArray != null && sdhSddArray.Any())
                    {
                        var transferObj = await _containersRepository.GetManualContainerByShipnum(ctrnum);
                        var data = new List<ContainerDetailDto>();
                        var extractedQty = 0;
                        string? sku =null;
                        string? uom = null;

                        foreach (var value in sdhSddArray)
                        {
                            var itmref = value.ITMREF;
                            var item = await _containersRepository.GetBySkuX3(itmref);
                            sku = item?.sku_mantis;
                            uom = item?.uom_mantis;

                            extractedQty = value.QTY ?? 0; 
                            bool isInvalidItem = false;
                            int isConveyableItem = 0;

                            if (item != null)
                            {
                                var isValid = await _validateItemHelper.ValidateItem(itmref);
                                var isConveyable = await _validateItemHelper.ValidateConveyableItem(itmref);

                                if (isValid.IsValid == 1)
                                {
                                    var conversionResult = await _validateItemHelper.GetItemConversion(sku, uom, value.QTY ?? 0);
                                    int qty;
                                    extractedQty = int.TryParse(value.QTY.ToString(), out qty) ? qty : 0;
                                    uom = conversionResult.UOM ?? uom;
                                }
                                else
                                {
                                    isInvalidItem = true;
                                    transferObj.contain_invalid_items = true;
                                    await _containersRepository.UpdateTransfer(transferObj.id, transferObj.contain_invalid_items);
                                }

                                if (isConveyable.IsValid != 1)
                                {
                                    isConveyableItem = 1;
                                    transferObj.conveyable = 1;
                                    await _containersRepository.UpdateConveyableTransfer(transferObj.id, transferObj.conveyable);
                                }
                            }
                            else
                            {
                                isInvalidItem = true;
                                isConveyableItem = 1;
                                transferObj.conveyable =1;
                                transferObj.contain_invalid_items = true;
                                await _containersRepository.UpdateContainerFlags(transferObj.id, transferObj.conveyable, transferObj.contain_invalid_items);
                            }

                            var rows = value.SDHSDDZSTOJOU;
                            var status = ContainerDetailsStatuses.Unprocessed;
                            var description = EnumData.GetContainerDescription(status);
                           

                            if (rows != null && rows.Any())
                            {
                                foreach (var row in rows)
                                {
                                    var PT = uom;

                                    // read STJACTQTY safely
                                    int lotQty = row.STJACTQTY != null ? Convert.ToInt32(row.STJACTQTY) : 0;

                                    // Call your ValidateItemHelper service method
                                    var resultLot = await _validateItemHelper.GetItemConversion(sku, PT, lotQty);

                                    // Assign Qty, fallback to lotQty if null
                                    lotQty = resultLot?.Qty != null ? (int)resultLot.Qty : lotQty;

                                    // Assign UOM, fallback to PT if null
                                    var lotUom = resultLot?.UOM ?? PT;

                                    data.Add(new ContainerDetailDto
                                    {
                                        container_id = transferObj.id,
                                        fcy = result.SALFCY,
                                        ctrnum = ctrnum,
                                        shipnum = transferObj.shipnum?.ToString(),
                                        itmref = sku,
                                        uom = lotUom,
                                        status = description,
                                        invalid_item = isInvalidItem,
                                        conveyable = isConveyableItem,
                                        //qtyuom = lotQty,
                                        qtyuom = Math.Abs(lotQty),
                                        //qtyuom= value.QTY,
                                        input_sku = value.ITMREF != null ? value.ITMREF.ToString() : null,
                                        input_uom = value.SAU,
                                        input_qty = value.QTY,
                                        input_lot = row.STJLOT!=null? row.STJLOT.ToString(): null,
                                        //input_lot_qty = row.STJACTQTY != null ? row.STJACTQTY.ToString() : null
                                        input_lot_qty = row.STJACTQTY != null ? Math.Abs(Convert.ToInt32(row.STJACTQTY)).ToString(): null,

                                    });
                                }
                            }
                            else
                            {
                                data.Add(new ContainerDetailDto
                                {
                                    container_id = transferObj.id,
                                    fcy = result.SALFCY,
                                    ctrnum = ctrnum,
                                    shipnum = transferObj?.shipnum?.ToString(),
                                    itmref = sku,
                                    uom = uom,
                                    status = description,
                                    invalid_item = isInvalidItem,
                                    conveyable = isConveyableItem,
                                    qtyuom = extractedQty,
                                    input_sku = value.ITMREF != null ? value.ITMREF.ToString() : null,
                                    input_uom = value.SAU != null ? value.SAU.ToString() : null,
                                    input_qty = value.QTY,
                                });
                            }
                        }

                        //  Only proceed if data exists
                        if (data.Any())
                        {
                            var chunks = data.Chunk(50);
                            foreach (var dataChunk in chunks)
                            {
                                // Remove duplicates based on all fields
                                var uniqueDataChunk = dataChunk
                                    .GroupBy(x => new { x.container_id, x.itmref, x.uom, x.input_lot, x.input_lot_qty })
                                    .Select(g => g.First())
                                    .ToList();

                                // Determine upsert keys
                                var upsertKeys = new List<string> { "container_id", "itmref", "uom" };
                                if (uniqueDataChunk.FirstOrDefault()?.input_lot != null)
                                    upsertKeys.Add("input_lot");
                                if (uniqueDataChunk.FirstOrDefault()?.input_lot_qty != null)
                                    upsertKeys.Add("input_lot_qty");

                                await _containersRepository.UpsertContainerDetails(uniqueDataChunk, upsertKeys);
                            }

                            //  Log created only after actual data is upserted
                            await _IActivityLogRepository.ActivityLog(new ActivityLog
                            {
                                log_name = "inbound",
                                @event = "created",
                                module_id = (int)EnumData.Module.inbound,
                                sub_module_id = (int)EnumData.SubModule.transfer,
                                properties = JsonConvert.SerializeObject(new { data = transferObj }),
                                description = $"Intersite Transfer for ctrnum: {ctrnum}",
                                subject_ref = ctrnum,
                                created_at = DateTime.UtcNow
                            });
                        }
                    }
                }

                return new ApisResponse
                {
                    Error = 0,
                    Message = "Data Synced Successfully"
                };
            }
            catch (Exception ex)
            {
                return new ApisResponse
                {
                    Error = 1,
                    Message = "An error occurred while processing the request: " + ex.Message
                };
            }
        }
    }
}
















