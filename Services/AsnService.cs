
using System;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Formats.Asn1;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Resources;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web.Helpers;
using System.Web.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MiddlewareWebAPI.Common.Enum;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Asn1.Cms;
using Org.BouncyCastle.Asn1.Ocsp;
using Swashbuckle.Swagger;

namespace MiddlewareWebAPI.Services.Services
{
    public class AsnService : IAsnService
    {
        private readonly IAsnRepository _asnRepository;
        private readonly IApiClient _apiClient;
        private readonly HttpClient _httpClient;
        private readonly IValidateItemHelper _validateItemHelper;
        private readonly ILogger<AsnService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IActivityLogRepository _IActivityLogRepository;

        public AsnService(IAsnRepository asnRepository, IApiClient apiClient, HttpClient httpClient,
            ILogger<AsnService> logger, IConfiguration configuration, IValidateItemHelper validateItemHelper, IActivityLogRepository iActivityLogRepository)
        {
            _asnRepository = asnRepository;
            _apiClient = apiClient;
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
            _validateItemHelper = validateItemHelper;
            _IActivityLogRepository = iActivityLogRepository;
        }

        public async Task<ShipmentGridResponse> GetShipmentsGrid(ShipmentsRequest request)
        {
            return await _asnRepository.GetShipmentsGrid(request);
        }

        public async Task<IEnumerable<Shipments>> GetShipmentDetail(int id)
        {
            return await _asnRepository.GetShipmentDetail(id);
        }

        public async Task<ShipmentLineResponse> GetShipmentLines(ShipmentLinesRequest request, int id)
        {
            return await _asnRepository.GetShipmentLines(request, id);
        }

        public async Task<bool> UpdateImportReady(UpdateShipmentRequest request)
        {
            return await _asnRepository.UpdateImportReady(request);
        }

        //public async Task<ResponseResult> GetAsns()
        //{
        //    try
        //    {
        //        //return new ResponseResult { Error = 0, Message = "Data synced successfully." };
        //        // 1. Get latest ASN create time from DB
        //        var lastAsns = await _asnRepository.GetLatestAsn();
        //        var lastAsn = lastAsns.FirstOrDefault();

        //        DateTime? createdAt = lastAsn?.create_dat_tim;

        //        string datetime;

        //        if (createdAt != null)
        //        {
        //            datetime = createdAt.Value
        //                                .Date                
        //                                .ToUniversalTime()    
        //                                .ToString("yyyy-MM-dd'T'00:00:00'Z'");
        //        }
        //        else
        //        {
        //            datetime = DateTime.UtcNow
        //                                .AddDays(-2)
        //                                .Date              
        //                                .ToString("yyyy-MM-dd'T'00:00:00'Z'");
        //        }


        //        _logger.LogInformation("Calling external API with timestamp: {DateTime}", datetime);

        //        // 2. Build the HTTP client and request
        //        var baseUrl = _configuration["ExternalApi:Endpoint"];
        //        var username = _configuration["ExternalApi:Username"];
        //        var password = _configuration["ExternalApi:Password"];

        //        //SSL Error Fixed this code
        //        var handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        //        };

        //        using var client = new HttpClient(handler);
        //        client.BaseAddress = new Uri(baseUrl);
        //        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        //        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        //        var request = $"SHIPMENT?representation=YSHIPMENT.$query&where=CREDATTIM gt @{datetime}@&count=70&orderby=CREDATTIM";
        //        var fullUrl = new Uri(client.BaseAddress, request);
        //        var responseUrl = await client.GetAsync(fullUrl);
        //        responseUrl.EnsureSuccessStatusCode();
        //        var response = await responseUrl.Content.ReadAsStringAsync();
        //        var result1 = JsonConvert.DeserializeObject<ShipmentResponseS>(response);


        //            var result = JsonConvert.DeserializeObject<dynamic>(response);
        //        DataSet ds = await FetchJsonAsDataSetAsync(response);

        //        _logger.LogInformation("Call ended. Raw response received.");

        //        // activity logs
        //        //await LogShipmentSchedulerActivity(request, response);
        //        var properties = new { request, response };
        //        var errorActivity = new ActivityLog
        //        {
        //            log_name = "inbound",
        //            module_id = (int)EnumData.Module.inbound,
        //            sub_module_id = (int)EnumData.SubModule.asn,
        //            @event = "sync",
        //            properties = JsonConvert.SerializeObject(properties),
        //            description = "Shipment Scheduler",
        //            //subject_id = 209,
        //            causer_type = null,
        //            created_at = DateTime.UtcNow
        //        };
        //        await _asnRepository.LogActivity(errorActivity);


        //        // Main table
        //        DataTable mainResources = ds.Tables["Resources"];


        //        // 3. Parse and process response
        //        //var result = JsonConvert.DeserializeObject<dynamic>(response);
        //        var asnsData = result?["$resources"];
        //        if (asnsData != null && asnsData?.Count > 0)
        //        {
        //            //foreach (var asn in asnsData)
        //            foreach (DataRow mainRow in mainResources.Rows)
        //            {
        //                string shipUidStr = mainRow["SHIPUID"].ToString(); //Convert.ToString(asn.SHIPUID);

        //                if (!string.IsNullOrEmpty(shipUidStr) && shipUidStr.Length == 11)
        //                {
        //                    var existingContainer = await _asnRepository.GetShipmentContainerAsync(shipUidStr);
        //                    string shipuid = shipUidStr;
        //                    string ShipUid = mainRow["SHIPUID"].ToString();

        //                    if (existingContainer != null)
        //                    {
        //                        var lvReceiptContainer = existingContainer.count != 0 ? $"{shipuid}_{existingContainer.count}" : shipuid;
        //                        bool isLvContainerFound = await _asnRepository.IsLvReceiptExistAsync(lvReceiptContainer);

        //                        if (isLvContainerFound)
        //                        {
        //                            int newCount = existingContainer.count + 1;
        //                            shipuid = $"{shipUidStr}_{newCount}";
        //                            await _asnRepository.UpdateContainerCountAsync(shipUidStr, newCount);
        //                        }
        //                        else
        //                        {
        //                            shipuid = existingContainer.count != 0 ? $"{ShipUid}_{existingContainer.count}" : shipuid;
        //                        }
        //                    }

        //                    await _asnRepository.UpsertShipmentContainerAsync(shipuid);
        //                    //var create_dat_timv = "";
        //                    //var ship_dat = "";
        //                    //var fcy = "";
        //                    //var bpsnum = "";
        //                    //var tctrnum = "";
        //                    //var dspweu = "";
        //                    //var dspvou = "";
        //                    //var is_transfer = false;
        //                    //var Status = "";
        //                    var asnHeader = new OrderDataSync
        //                    {
        //                        ship_uid = shipuid,
        //                        shipNum = mainRow["SHIPNUM"].ToString(),
        //                        ship_dat = mainRow.Table.Columns.Contains("SHIPDAT") && mainRow["SHIPDAT"] != DBNull.Value ? Convert.ToDateTime(mainRow["SHIPDAT"]) : (DateTime?)null,              //(asn)["SHIPDAT"].ToString(), 
        //                        create_dat_tim = mainRow.Table.Columns.Contains("CREDATTIM") && mainRow["CREDATTIM"] != DBNull.Value ? Convert.ToDateTime(mainRow["CREDATTIM"]) : (DateTime?)null,    //asn.CreateDateTime,
        //                        fcy = mainRow.Table.Columns.Contains("FCY") && mainRow["FCY"] != DBNull.Value ? mainRow["FCY"].ToString() : null,
        //                        bpsnum = mainRow.Table.Columns.Contains("BPSNUM") && mainRow["BPSNUM"] != DBNull.Value ? mainRow["BPSNUM"].ToString() : null,                       //(asn)["BPSNUM"].ToString(),
        //                        tctrnum = mainRow.Table.Columns.Contains("TCTRNUM") && mainRow["TCTRNUM"] != DBNull.Value ? mainRow["TCTRNUM"].ToString() : null,                   //(asn)["TCTRNUM"].ToString(),   
        //                        dspweu = mainRow.Table.Columns.Contains("DSPWEU") && mainRow["DSPWEU"] != DBNull.Value ? mainRow["DSPWEU"].ToString() : null,                       //(asn)["DSPWEU"].ToString(),
        //                        dspvou = mainRow.Table.Columns.Contains("DSPVOU") && mainRow["DSPVOU"] != DBNull.Value ? mainRow["DSPVOU"].ToString() : null,
        //                        is_transfer = false,
        //                        Status = EnumData.AsnStatuses.Unsyned.ToString(),
        //                        import_ready = false,
        //                        mantis_imported_h = false,
        //                        is_sync = false,
        //                        InvalidItems = false,
        //                        IsConveyable = false
        //                    };


        //                    var shipNum = mainRow["SHIPNUM"].ToString();   //(asn)["SHIPNUM"].ToString();
        //                    var createdAsn = await _asnRepository.CreateOrGetAsnAsync(shipNum, asnHeader);
        //                    //var propertiesDetails = new { request = url, response = results };
        //                    var jsonResultDetails = JsonConvert.DeserializeObject<dynamic>(response);

        //                    var propertiesData = new
        //                    {
        //                        //request = request,
        //                        //response = jsonResultDetails
        //                        data = asnHeader
        //                    };
        //                    // Log creation

        //                    var newcreated = await _asnRepository.getsubjectidshipment(mainRow["SHIPNUM"].ToString());

        //                        var createLogActivity = new ActivityLog
        //                        {
        //                            log_name = "inbound",
        //                            module_id = (int)EnumData.Module.inbound,
        //                            sub_module_id = (int)EnumData.SubModule.asn,
        //                            properties = JsonConvert.SerializeObject(propertiesData),
        //                            @event = "created",
        //                            description = "Shipment Created | " + mainRow["SHIPNUM"].ToString(),
        //                            subject_id = newcreated,
        //                            created_at = DateTime.UtcNow
        //                        };
        //                        await _asnRepository.LogActivity(createLogActivity);

        //                    var expected_at = "";



        //                    var url = $"SHIPMENT(\"{mainRow["SHIPNUM"].ToString()}\")?representation=YSHIPMENT.$details";
        //                    var fullUrlD = new Uri(client.BaseAddress, url);
        //                    var responseUrlD = await client.GetAsync(fullUrlD);
        //                    responseUrlD.EnsureSuccessStatusCode();
        //                    var responseD = await responseUrlD.Content.ReadAsStringAsync();
        //                    var results = JsonConvert.DeserializeObject<dynamic>(responseD);
        //                    DataSet dsDetail = ParseJsonToDataSet(responseD);

        //                    DataTable mainDetailsResources = dsDetail.Tables["SHHSHD"];

        //                    var asnsDetailsData = result?["$resources"];

        //                    var propertiesDetails = new { request = url, response = results };
        //                    var ActivityDetails = new ActivityLog
        //                    {
        //                        log_name = "inbound",
        //                        module_id = (int)EnumData.Module.inbound,
        //                        sub_module_id = (int)EnumData.SubModule.asn,
        //                        @event = "sync",
        //                        properties = JsonConvert.SerializeObject(propertiesDetails),
        //                        description = "Shipment Detail",
        //                        causer_type = null,
        //                        created_at = DateTime.UtcNow
        //                    };
        //                    await _asnRepository.LogActivity(ActivityDetails);



        //                    if (mainDetailsResources != null)
        //                    {
        //                        var lineItems = new List<AsnLineRequest>();
        //                        string? ctrnum = null;
        //                        string? expectedAt = null;

        //                        foreach (DataRow mainDRow in mainDetailsResources.Rows)

        //                        {
        //                            var items = await _asnRepository.GetItemConversionAsync(mainDRow["ITMREF"].ToString());
        //                            var item = items.FirstOrDefault();
        //                            string? sku = null;
        //                            string? uom = null;
        //                            bool isInvalid = true;
        //                            bool isConveyable = false;
        //                            bool isPresentInMantis = false;
        //                            decimal extractedQty = Convert.ToDecimal(mainDRow["SHIQTY"]); //value.SHIQTY;

        //                            if (item != null)
        //                            {
        //                                sku = item.sku_mantis;
        //                                uom = item.uom_mantis;

        //                                var validate = await _validateItemHelper.ValidateItem(mainDRow["ITMREF"].ToString());
        //                                isInvalid = Convert.ToBoolean(validate.IsValid) ? false : true;

        //                                var conveyable = await _validateItemHelper.ValidateConveyableItem(mainDRow["ITMREF"].ToString());
        //                                isConveyable = Convert.ToBoolean(conveyable.IsValid);

        //                                isPresentInMantis = validate.IsPresent;

        //                                var conv = await _validateItemHelper.GetItemConversion(sku, uom, Convert.ToInt32(mainDRow["SHIQTY"]));
        //                                extractedQty = conv.Qty;
        //                                uom = conv.UOM;
        //                            }

        //                            if (isInvalid == true)
        //                                createdAsn.InvalidItems = true;
        //                            else
        //                                createdAsn.InvalidItems = false;
        //                            if (!isConveyable)
        //                                createdAsn.IsConveyable = false;
        //                            else
        //                                createdAsn.IsConveyable = true;
        //                            ctrnum = mainDRow["CTRLIN"].ToString(); //value.CTRLIN;
        //                            expectedAt = mainDRow["EXTRCPDAT"].ToString();  //value.EXTRCPDAT;

        //                            lineItems.Add(new AsnLineRequest
        //                            {
        //                                //AsnId = createdAsn.Id,
        //                                //ShipUid = shipuid,
        //                                //PohNum = value.POHNUM,
        //                                //ItmRef = sku,
        //                                //Uom = uom,
        //                                //InputQty = value.SHIQTY,
        //                                ////ExtractedQty = extractedQty,
        //                                //InvalidItems = isInvalid,
        //                                //IsConveyable = isConveyable ? true : false,
        //                                //IsPresentInMantis = isPresentInMantis ? true : false,



        //                                AsnId = createdAsn.Id,
        //                                ShipUid = shipuid,
        //                                PohNum = mainDRow["POHNUM"].ToString(), //value.POHNUM,
        //                                PoqSeq = mainDRow["POQSEQ"].ToString(), //value.POQSEQ,
        //                                Ctrnum = mainDRow["CTRNUM"].ToString(),  //value.CTRNUM,
        //                                CtrlLin = mainDRow["CTRLIN"].ToString(),  //value.CTRLIN,
        //                                Shiqty = extractedQty, //Convert.ToDecimal(mainDRow["SHIQTY"]),     //value.SHIQTY,
        //                                ExtrcpDat = Convert.ToDateTime(mainDRow["EXTRCPDAT"]),    //.ToString() //value.EXTRCPDAT,
        //                                QtyWeu = mainRow.Table.Columns.Contains("QTYWEU") && mainRow["QTYWEU"] != DBNull.Value ? Convert.ToDecimal(mainRow["QTYWEU"]) : 0,                                                     //Convert.ToDecimal(mainDRow["QTYWEU"]), //value.QTYWEU,
        //                                QtyVou = mainRow.Table.Columns.Contains("QTYVOU") && mainRow["QTYVOU"] != DBNull.Value ? Convert.ToDecimal(mainRow["QTYVOU"]) : 0,                                                             //Convert.ToDecimal(mainDRow["QTYVOU"]), //value.QTYVOU,
        //                                PopLin = mainDRow["POPLIN"].ToString(), //value.POPLIN,
        //                                ShipLin = mainDRow["SHIPLIN"].ToString(), //value.SHIPLIN,
        //                                Pohfcy = mainDRow["POHFCY"].ToString(),   //value.POHFCY,
        //                                Itmref = sku,
        //                                Uom = uom,
        //                                InputItmref = mainDRow["ITMREF"].ToString(),   //value.ITMREF,
        //                                InputUom = mainDRow["UOM"].ToString(),        //value.UOM,
        //                                InvalidItems = isInvalid,
        //                                IsConveyable = isConveyable,
        //                                InputQty = Convert.ToDecimal(mainDRow["SHIQTY"]),
        //                                IsPresentInMantis = false,
        //                                Mantis_Imported = false,

        //                            });
        //                        }

        //                        await _asnRepository.UpsertAsnLinesAsync(lineItems);
        //                        createdAsn.ExpectedAt = expectedAt;
        //                        createdAsn.Ctrnum = ctrnum;
        //                        //createdAsn.InvalidItems = isInvalid;
        //                        //createdAsn.IsConveyable = isConveyable;
        //                        await _asnRepository.UpdateAsnAsync(createdAsn);
        //                    }

        //                }
        //            }
        //            return new ResponseResult { Error = 0, Message = "Data synced successfully." };
        //        }
        //        return new ResponseResult { Error = 0, Message = "Data synced successfully." };
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error syncing ASN data.");
        //        //var properties = new { request, response };
        //        var errorActivity = new ActivityLog
        //        {
        //            log_name = "inbound",
        //            module_id = (int)EnumData.Module.inbound,
        //            sub_module_id = (int)EnumData.SubModule.asn,
        //            properties = JsonConvert.SerializeObject(ex),
        //            @event = "error",
        //            description = "Shipment Scheduler - Error",
        //            created_at = DateTime.UtcNow
        //        };

        //        await _asnRepository.LogActivity(errorActivity);

        //        return new ResponseResult { Error = 1, Message = "Error while syncing data | " + ex.Message };
        //    }
        //}

        //public async Task<ResponseResult> GetAsns()
        //{
        //    try
        //    {
        //        // 1. Get latest ASN create time from DB
        //        var lastAsns = await _asnRepository.GetLatestAsn();
        //        var lastAsn = lastAsns.FirstOrDefault();
        //        DateTime? createdAt = lastAsn?.create_dat_tim;

        //        string datetime;
        //        if (createdAt != null)
        //        {
        //            datetime = createdAt.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");

        //        }
        //        else
        //        {
        //            datetime = DateTime.UtcNow
        //                .AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ssZ");
        //        }

        //        _logger.LogInformation("Calling external API with timestamp: {DateTime}", datetime);

        //        // 2. Build the HTTP client and request
        //        var baseUrl = _configuration["ExternalApi:Endpoint"];
        //        var username = _configuration["ExternalApi:Username"];
        //        var password = _configuration["ExternalApi:Password"];

        //        // SSL Error Fix
        //        var handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        //        };

        //        using var client = new HttpClient(handler);
        //        client.BaseAddress = new Uri(baseUrl);
        //        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        //        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        //        var request = $"SHIPMENT?representation=YSHIPMENT.$query&where=CREDATTIM gt @{datetime}@&count=70&orderby=CREDATTIM";

        //        string nextUrl = new Uri(client.BaseAddress, request).ToString();

        //        int safetyCounter = 0;
        //        int pageCount = 0;
               

        //        // 🔁 START PAGINATION LOOP
        //        while (!string.IsNullOrEmpty(nextUrl) && safetyCounter < 200)
        //        {
        //            safetyCounter++;
        //            pageCount++;

        //            _logger.LogInformation("Fetching Page {Page} | URL: {Url}", pageCount, nextUrl);

        //            var responseUrl = await client.GetAsync(nextUrl);
        //            responseUrl.EnsureSuccessStatusCode();
        //            var response1 = await responseUrl.Content.ReadAsStringAsync();
        //            var result1 = JsonConvert.DeserializeObject<ShipmentResponseS>(response1);

        //            // Same as before
        //            var result = JsonConvert.DeserializeObject<dynamic>(response1);
        //            DataSet ds = await FetchJsonAsDataSetAsync(response1);

        //            _logger.LogInformation("Page {Page} received successfully.", pageCount);

        //            var properties = new { request = request, response = result };
        //            var errorActivity = new ActivityLog
        //            {
        //                log_name = "inbound",
        //                module_id = (int)EnumData.Module.inbound,
        //                sub_module_id = (int)EnumData.SubModule.asn,
        //                @event = "sync",
        //                properties = JsonConvert.SerializeObject(properties),
        //                description = "Shipment Scheduler",
        //                created_at = DateTime.UtcNow
        //            };
        //            await _asnRepository.LogActivity(errorActivity);

        //            // Main table
        //            DataTable mainResources = ds.Tables["Resources"];
        //            var asnsData = result?["$resources"];

        //            if (asnsData != null && asnsData?.Count > 0)
        //            {
        //                foreach (DataRow mainRow in mainResources.Rows)
        //                {
        //                    string shipUidStr = mainRow["SHIPUID"].ToString();

        //                    if (!string.IsNullOrEmpty(shipUidStr) && shipUidStr.Length == 11)
        //                    {
        //                        var existingContainer = await _asnRepository.GetShipmentContainerAsync(shipUidStr);
        //                        string shipuid = shipUidStr;
        //                        string ShipUid = mainRow["SHIPUID"].ToString();

        //                        if (existingContainer != null)
        //                        {
        //                            var lvReceiptContainer = existingContainer.count != 0 ? $"{shipuid}_{existingContainer.count}" : shipuid;
        //                            bool isLvContainerFound = await _asnRepository.IsLvReceiptExistAsync(lvReceiptContainer);

        //                            if (isLvContainerFound)
        //                            {
        //                                int newCount = existingContainer.count + 1;
        //                                shipuid = $"{shipUidStr}_{newCount}";
        //                                await _asnRepository.UpdateContainerCountAsync(shipUidStr, newCount);
        //                            }
        //                            else
        //                            {
        //                                shipuid = existingContainer.count != 0 ? $"{ShipUid}_{existingContainer.count}" : shipuid;
        //                            }
        //                        }

        //                        await _asnRepository.UpsertShipmentContainerAsync(shipuid);

        //                        var asnHeader = new OrderDataSync
        //                        {
        //                            ship_uid = shipuid,
        //                            shipNum = mainRow["SHIPNUM"].ToString(),
        //                            ship_dat = mainRow.Table.Columns.Contains("SHIPDAT") && mainRow["SHIPDAT"] != DBNull.Value ? Convert.ToDateTime(mainRow["SHIPDAT"]) : (DateTime?)null,
        //                            create_dat_tim = mainRow.Table.Columns.Contains("CREDATTIM") && mainRow["CREDATTIM"] != DBNull.Value ? Convert.ToDateTime(mainRow["CREDATTIM"]) : (DateTime?)null,
        //                            fcy = mainRow.Table.Columns.Contains("FCY") && mainRow["FCY"] != DBNull.Value ? mainRow["FCY"].ToString() : null,
        //                            bpsnum = mainRow.Table.Columns.Contains("BPSNUM") && mainRow["BPSNUM"] != DBNull.Value ? mainRow["BPSNUM"].ToString() : null,
        //                            tctrnum = mainRow.Table.Columns.Contains("TCTRNUM") && mainRow["TCTRNUM"] != DBNull.Value ? mainRow["TCTRNUM"].ToString() : null,
        //                            dspweu = mainRow.Table.Columns.Contains("DSPWEU") && mainRow["DSPWEU"] != DBNull.Value ? mainRow["DSPWEU"].ToString() : null,
        //                            dspvou = mainRow.Table.Columns.Contains("DSPVOU") && mainRow["DSPVOU"] != DBNull.Value ? mainRow["DSPVOU"].ToString() : null,
        //                            is_transfer = false,
        //                            Status = EnumData.AsnStatuses.Unsyned.ToString(),
        //                            import_ready = false,
        //                            mantis_imported_h = false,
        //                            is_sync = false,
        //                            InvalidItems = false,
        //                            IsConveyable = false
        //                        };

        //                        var shipNum = mainRow["SHIPNUM"].ToString();
        //                        var createdAsn = await _asnRepository.CreateOrGetAsnAsync(shipNum, asnHeader);

        //                        var jsonResultDetails = JsonConvert.DeserializeObject<dynamic>(response1);
        //                        var propertiesData = new { data = asnHeader };

        //                        var newcreated = await _asnRepository.getsubjectidshipment(shipNum);
        //                        var createLogActivity = new ActivityLog
        //                        {
        //                            log_name = "inbound",
        //                            module_id = (int)EnumData.Module.inbound,
        //                            sub_module_id = (int)EnumData.SubModule.asn,
        //                            @event = "created",
        //                            description = "Shipment Created | " + shipNum,
        //                            subject_id = newcreated,
        //                            properties = JsonConvert.SerializeObject(propertiesData),
        //                            created_at = DateTime.UtcNow
        //                        };
        //                        await _asnRepository.LogActivity(createLogActivity);

        //                        var url = $"SHIPMENT(\"{shipNum}\")?representation=YSHIPMENT.$details";
        //                        var fullUrlD = new Uri(client.BaseAddress, url);
        //                        var responseUrlD = await client.GetAsync(fullUrlD);
        //                        responseUrlD.EnsureSuccessStatusCode();
        //                        var responseD = await responseUrlD.Content.ReadAsStringAsync();
        //                        var results = JsonConvert.DeserializeObject<dynamic>(responseD);
        //                        DataSet dsDetail = ParseJsonToDataSet(responseD);
        //                        DataTable mainDetailsResources = dsDetail.Tables["SHHSHD"];

        //                        var propertiesDetails = new { request = url, response = results };
        //                        var ActivityDetails = new ActivityLog
        //                        {
        //                            log_name = "inbound",
        //                            module_id = (int)EnumData.Module.inbound,
        //                            sub_module_id = (int)EnumData.SubModule.asn,
        //                            @event = "sync",
        //                            subject_id = newcreated,
        //                            description = "Shipment Detail",
        //                            properties = JsonConvert.SerializeObject(propertiesDetails),
        //                            created_at = DateTime.UtcNow
        //                        };
        //                        await _asnRepository.LogActivity(ActivityDetails);

        //                        if (mainDetailsResources != null)
        //                        {
        //                            var lineItems = new List<AsnLineRequest>();
        //                            string? ctrnum = null;
        //                            string? expectedAt = null;

        //                            foreach (DataRow mainDRow in mainDetailsResources.Rows)
        //                            {
        //                                var items = await _asnRepository.GetItemConversionAsync(mainDRow["ITMREF"].ToString());
        //                                var item = items.FirstOrDefault();
        //                                string? sku = null;
        //                                string? uom = null;
        //                                bool isInvalid = true;
        //                                bool isConveyable = false;
        //                                bool isPresentInMantis = false;
        //                                decimal extractedQty = Convert.ToDecimal(mainDRow["SHIQTY"]);

        //                                if (item != null)
        //                                {
        //                                    sku = item.sku_mantis;
        //                                    uom = item.uom_mantis;

        //                                    var validate = await _validateItemHelper.ValidateItem(mainDRow["ITMREF"].ToString());
        //                                    isInvalid = Convert.ToBoolean(validate.IsValid) ? false : true;

        //                                    var conveyable = await _validateItemHelper.ValidateConveyableItem(mainDRow["ITMREF"].ToString());
        //                                    isConveyable = Convert.ToBoolean(conveyable.IsValid);

        //                                    isPresentInMantis = validate.IsPresent;

        //                                    var conv = await _validateItemHelper.GetItemConversion(sku, uom, Convert.ToInt32(mainDRow["SHIQTY"]));
        //                                    extractedQty = conv.Qty;
        //                                    uom = conv.UOM;
        //                                }

        //                                if (isInvalid) createdAsn.InvalidItems = true;
        //                                else createdAsn.InvalidItems = false;

        //                                if (!isConveyable) createdAsn.IsConveyable = false;
        //                                else createdAsn.IsConveyable = true;

        //                                ctrnum = mainDRow["CTRLIN"].ToString();
        //                                expectedAt = mainDRow["EXTRCPDAT"].ToString();

        //                                lineItems.Add(new AsnLineRequest
        //                                {
        //                                    AsnId = createdAsn.Id,
        //                                    ShipUid = shipuid,
        //                                    PohNum = mainDRow["POHNUM"].ToString(),
        //                                    PoqSeq = mainDRow["POQSEQ"].ToString(),
        //                                    Ctrnum = mainDRow["CTRNUM"].ToString(),
        //                                    CtrlLin = mainDRow["CTRLIN"].ToString(),
        //                                    Shiqty = extractedQty,
        //                                    ExtrcpDat = Convert.ToDateTime(mainDRow["EXTRCPDAT"]),
        //                                    QtyWeu = mainRow.Table.Columns.Contains("QTYWEU") && mainRow["QTYWEU"] != DBNull.Value ? Convert.ToDecimal(mainRow["QTYWEU"]) : 0,
        //                                    QtyVou = mainRow.Table.Columns.Contains("QTYVOU") && mainRow["QTYVOU"] != DBNull.Value ? Convert.ToDecimal(mainRow["QTYVOU"]) : 0,
        //                                    PopLin = mainDRow["POPLIN"].ToString(),
        //                                    ShipLin = mainDRow["SHIPLIN"].ToString(),
        //                                    Pohfcy = mainDRow["POHFCY"].ToString(),
        //                                    Itmref = sku,
        //                                    Uom = uom,
        //                                    InputItmref = mainDRow["ITMREF"].ToString(),
        //                                    InputUom = mainDRow["UOM"].ToString(),
        //                                    InvalidItems = isInvalid,
        //                                    IsConveyable = isConveyable,
        //                                    InputQty = Convert.ToDecimal(mainDRow["SHIQTY"]),
        //                                    IsPresentInMantis = false,
        //                                    Mantis_Imported = false,
        //                                });
        //                            }

        //                            await _asnRepository.UpsertAsnLinesAsync(lineItems);
        //                            createdAsn.ExpectedAt = expectedAt;
        //                            createdAsn.Ctrnum = ctrnum;
        //                            await _asnRepository.UpdateAsnAsync(createdAsn);
        //                        }
        //                    }
        //                }
        //            }

        //            //  Update pagination URL
        //            nextUrl = result1?.Links?.next?.Url;

        //            // Optional fallback to last if next not found
        //            if (string.IsNullOrEmpty(nextUrl) && result1?.Links?.Last?.Url != null)
        //            {
        //                _logger.LogInformation("No next page found. Using last page...");
        //                nextUrl = result1.Links.Last.Url;
        //                result1.Links.Last.Url = null; // so it is not used again
        //            }

        //            // Delay to avoid API rate limit
        //            await Task.Delay(1000);
        //        }

        //        if (safetyCounter >= 200)
        //            _logger.LogWarning("Pagination terminated due to safety limit.");

        //        return new ResponseResult { Error = 0, Message = $"Data synced successfully across {pageCount} page(s)." };
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error syncing ASN data.");

        //        var errorActivity = new ActivityLog
        //        {
        //            log_name = "inbound",
        //            module_id = (int)EnumData.Module.inbound,
        //            sub_module_id = (int)EnumData.SubModule.asn,
        //            properties = JsonConvert.SerializeObject(ex),
        //            @event = "error",
        //            description = "Shipment Scheduler - Error",
        //            created_at = DateTime.UtcNow
        //        };

        //        await _asnRepository.LogActivity(errorActivity);

        //        return new ResponseResult { Error = 1, Message = "Error while syncing data | " + ex.Message };
        //    }
        //}
        public async Task<ResponseResult> GetAsns()
        {
            try
            {
                // 1. Get latest ASN create time from DB
                var lastAsns = await _asnRepository.GetLatestAsn();
                var lastAsn = lastAsns.FirstOrDefault();
                DateTime? createdAt = lastAsn?.create_dat_tim;

                string datetime;
                if (createdAt != null)
                {
                   datetime = createdAt.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");

                }
                else
                {
                    datetime = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ssZ");
                }

                _logger.LogInformation("Calling external API with timestamp: {DateTime}", datetime);

                // 2. Build the HTTP client and request
                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];

                // SSL Error Fix
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler);
                client.BaseAddress = new Uri(baseUrl);
                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                var request = $"SHIPMENT?representation=YSHIPMENT.$query&where=CREDATTIM gt @{datetime}@&count=70&orderby=CREDATTIM";
                string nextUrl = new Uri(client.BaseAddress, request).ToString();

                int safetyCounter = 0;
                int pageCount = 0;

                // 🔁 START PAGINATION LOOP
                while (!string.IsNullOrEmpty(nextUrl) && safetyCounter < 200)
                {
                    safetyCounter++;
                    pageCount++;

                    _logger.LogInformation("Fetching Page {Page} | URL: {Url}", pageCount, nextUrl);

                    var responseUrl = await client.GetAsync(nextUrl);
                    responseUrl.EnsureSuccessStatusCode();
                    var response = await responseUrl.Content.ReadAsStringAsync();
                    var result1 = JsonConvert.DeserializeObject<ShipmentResponseS>(response);

                    // Same as before
                    var result = JsonConvert.DeserializeObject<dynamic>(response);
                    DataSet ds = await FetchJsonAsDataSetAsync(response);

                    _logger.LogInformation("Page {Page} received successfully.", pageCount);

                    var properties = new { request = request, response = result };
                    var errorActivity = new ActivityLog
                    {
                        log_name = "inbound",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.asn,
                        @event = "sync",
                        properties = JsonConvert.SerializeObject(properties),
                        description = "Shipment Scheduler",
                        created_at = DateTime.UtcNow
                    };
                    await _IActivityLogRepository.ActivityLog(errorActivity);

                    // Main table
                    DataTable mainResources = ds.Tables["Resources"];
                    var asnsData = result?["$resources"];

                    if (asnsData != null && asnsData?.Count > 0)
                    {
                        foreach (DataRow mainRow in mainResources.Rows)
                        {
                            string shipUidStr = mainRow["SHIPUID"].ToString();

                            if (!string.IsNullOrEmpty(shipUidStr) && shipUidStr.Length == 11)
                            {
                                var existingContainer = await _asnRepository.GetShipmentContainerAsync(shipUidStr);
                                string shipuid = shipUidStr;
                                string ShipUid = mainRow["SHIPUID"].ToString();

                                if (existingContainer != null)
                                {
                                    var lvReceiptContainer = existingContainer.count != 0 ? $"{shipuid}_{existingContainer.count}" : shipuid;
                                    bool isLvContainerFound = await _asnRepository.IsLvReceiptExistAsync(lvReceiptContainer);

                                    if (isLvContainerFound)
                                    {
                                        int newCount = existingContainer.count + 1;
                                        shipuid = $"{shipUidStr}_{newCount}";
                                        await _asnRepository.UpdateContainerCountAsync(shipUidStr, newCount);
                                    }
                                    else
                                    {
                                        shipuid = existingContainer.count != 0 ? $"{ShipUid}_{existingContainer.count}" : shipuid;
                                    }
                                }

                                await _asnRepository.UpsertShipmentContainerAsync(shipuid);

                                var asnHeader = new OrderDataSync
                                {
                                    ship_uid = shipuid,
                                    shipNum = mainRow["SHIPNUM"].ToString(),
                                    ship_dat = mainRow.Table.Columns.Contains("SHIPDAT") && mainRow["SHIPDAT"] != DBNull.Value ? Convert.ToDateTime(mainRow["SHIPDAT"]) : (DateTime?)null,
                                    create_dat_tim = mainRow.Table.Columns.Contains("CREDATTIM") && mainRow["CREDATTIM"] != DBNull.Value ? Convert.ToDateTime(mainRow["CREDATTIM"]) : (DateTime?)null,
                                    fcy = mainRow.Table.Columns.Contains("FCY") && mainRow["FCY"] != DBNull.Value ? mainRow["FCY"].ToString() : null,
                                    bpsnum = mainRow.Table.Columns.Contains("BPSNUM") && mainRow["BPSNUM"] != DBNull.Value ? mainRow["BPSNUM"].ToString() : null,
                                    tctrnum = mainRow.Table.Columns.Contains("TCTRNUM") && mainRow["TCTRNUM"] != DBNull.Value ? mainRow["TCTRNUM"].ToString() : null,
                                    dspweu = mainRow.Table.Columns.Contains("DSPWEU") && mainRow["DSPWEU"] != DBNull.Value ? mainRow["DSPWEU"].ToString() : null,
                                    dspvou = mainRow.Table.Columns.Contains("DSPVOU") && mainRow["DSPVOU"] != DBNull.Value ? mainRow["DSPVOU"].ToString() : null,
                                    is_transfer = false,
                                    Status = EnumData.AsnStatuses.Unsyned.ToString(),
                                    import_ready = false,
                                    mantis_imported_h = false,
                                    is_sync = false,
                                    InvalidItems = false,
                                    IsConveyable = false
                                };

                                var shipNum = mainRow["SHIPNUM"].ToString();
                                var createdAsn = await _asnRepository.CreateOrGetAsnAsync(shipNum, asnHeader);

                                var jsonResultDetails = JsonConvert.DeserializeObject<dynamic>(response);
                                var propertiesData = new { data = asnHeader };

                                var newcreated = await _asnRepository.getsubjectidshipment(shipNum);
                                var createLogActivity = new ActivityLog
                                {
                                    log_name = "inbound",
                                    module_id = (int)EnumData.Module.inbound,
                                    sub_module_id = (int)EnumData.SubModule.asn,
                                    @event = "created",
                                    description = "Shipment Created | " + shipNum,
                                    subject_id = newcreated,
                                    properties = JsonConvert.SerializeObject(propertiesData),
                                    created_at = DateTime.UtcNow
                                };
                                await _IActivityLogRepository.ActivityLog(createLogActivity);

                                var url = $"SHIPMENT(\"{shipNum}\")?representation=YSHIPMENT.$details";
                                var fullUrlD = new Uri(client.BaseAddress, url);
                                var responseUrlD = await client.GetAsync(fullUrlD);
                                responseUrlD.EnsureSuccessStatusCode();
                                var responseD = await responseUrlD.Content.ReadAsStringAsync();
                                var results = JsonConvert.DeserializeObject<dynamic>(responseD);
                                DataSet dsDetail = ParseJsonToDataSet(responseD);
                                DataTable mainDetailsResources = dsDetail.Tables["SHHSHD"];

                                var propertiesDetails = new { request = url, response = results };
                                var ActivityDetails = new ActivityLog
                                {
                                    log_name = "inbound",
                                    module_id = (int)EnumData.Module.inbound,
                                    sub_module_id = (int)EnumData.SubModule.asn,
                                    @event = "sync",
                                    subject_id = newcreated,
                                    description = "Shipment Detail",
                                    properties = JsonConvert.SerializeObject(propertiesDetails),
                                    created_at = DateTime.UtcNow
                                };
                                await _IActivityLogRepository.ActivityLog(ActivityDetails);

                                if (mainDetailsResources != null)   
                                {
                                    var lineItems = new List<AsnLineRequest>();
                                    string? ctrnum = null;
                                    string? expectedAt = null;

                                    foreach (DataRow mainDRow in mainDetailsResources.Rows)
                                    {
                                        var items = await _asnRepository.GetItemConversionAsync(mainDRow["ITMREF"].ToString());
                                        var item = items.FirstOrDefault();
                                        string? sku = null;
                                        string? uom = null;
                                        bool isInvalid = true;
                                        bool isConveyable = false;
                                        bool isPresentInMantis = false;
                                        decimal extractedQty = Convert.ToDecimal(mainDRow["SHIQTY"]);

                                        if (item != null)
                                        {
                                            sku = item.sku_mantis;
                                            uom = item.uom_mantis;

                                            var validate = await _validateItemHelper.ValidateItem(mainDRow["ITMREF"].ToString());
                                            isInvalid = Convert.ToBoolean(validate.IsValid) ? false : true;

                                            var conveyable = await _validateItemHelper.ValidateConveyableItem(mainDRow["ITMREF"].ToString());
                                            isConveyable = Convert.ToBoolean(conveyable.IsValid);

                                            isPresentInMantis = validate.IsPresent;

                                            var conv = await _validateItemHelper.GetItemConversion(sku, uom, Convert.ToInt32(mainDRow["SHIQTY"]));
                                            extractedQty = conv.Qty;
                                            uom = conv.UOM;
                                        }

                                        if (isInvalid) createdAsn.InvalidItems = true;
                                        else createdAsn.InvalidItems = false;

                                        if (!isConveyable) createdAsn.IsConveyable = false;
                                        else createdAsn.IsConveyable = true;

                                        ctrnum = mainDRow["CTRLIN"].ToString();
                                        expectedAt = mainDRow["EXTRCPDAT"].ToString();

                                        lineItems.Add(new AsnLineRequest
                                        {
                                            AsnId = createdAsn.Id,
                                            ShipUid = shipuid,
                                            PohNum = mainDRow["POHNUM"].ToString(),
                                            PoqSeq = mainDRow["POQSEQ"].ToString(),
                                            Ctrnum = mainDRow["CTRNUM"].ToString(),
                                            CtrlLin = mainDRow["CTRLIN"].ToString(),
                                            Shiqty = extractedQty,
                                            ExtrcpDat = Convert.ToDateTime(mainDRow["EXTRCPDAT"]),
                                            QtyWeu = mainRow.Table.Columns.Contains("QTYWEU") && mainRow["QTYWEU"] != DBNull.Value ? Convert.ToDecimal(mainRow["QTYWEU"]) : 0,
                                            QtyVou = mainRow.Table.Columns.Contains("QTYVOU") && mainRow["QTYVOU"] != DBNull.Value ? Convert.ToDecimal(mainRow["QTYVOU"]) : 0,
                                            PopLin = mainDRow["POPLIN"].ToString(),
                                            ShipLin = mainDRow["SHIPLIN"].ToString(),
                                            Pohfcy = mainDRow["POHFCY"].ToString(),
                                            Itmref = sku,
                                            Uom = uom,
                                            InputItmref = mainDRow["ITMREF"].ToString(),
                                            InputUom = mainDRow["UOM"].ToString(),
                                            InvalidItems = isInvalid,
                                            IsConveyable = isConveyable,
                                            InputQty = Convert.ToDecimal(mainDRow["SHIQTY"]),
                                            IsPresentInMantis = false,
                                            Mantis_Imported = false,
                                        });
                                    }

                                    await _asnRepository.UpsertAsnLinesAsync(lineItems);
                                    createdAsn.ExpectedAt = expectedAt;
                                    createdAsn.Ctrnum = ctrnum;
                                    await _asnRepository.UpdateAsnAsync(createdAsn);
                                }
                            }
                        }
                    }

                    // 🔁 Update pagination URL
                    nextUrl = result1?.Links?.next?.Url;

                    // Optional fallback to last if next not found
                    if (string.IsNullOrEmpty(nextUrl) && result1?.Links?.Last?.Url != null)
                    {
                        _logger.LogInformation("No next page found. Using last page...");
                        nextUrl = result1.Links.Last.Url;
                        result1.Links.Last.Url = null; // so it is not used again
                    }

                    // 🚦Delay to avoid API rate limit
                    await Task.Delay(1000);
                }

                if (safetyCounter >= 200)
                    _logger.LogWarning("Pagination terminated due to safety limit.");

                return new ResponseResult { Error = 0, Message = $"Data synced successfully across {pageCount} page(s)." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing ASN data.");

                var errorActivity = new ActivityLog
                {
                    log_name = "inbound",
                    module_id = (int)EnumData.Module.inbound,
                    sub_module_id = (int)EnumData.SubModule.asn,
                    properties = JsonConvert.SerializeObject(ex),
                    @event = "error",
                    description = "Shipment Scheduler - Error",
                    created_at = DateTime.UtcNow
                };

                await _IActivityLogRepository.ActivityLog(errorActivity);

                return new ResponseResult { Error = 1, Message = "Error while syncing data | " + ex.Message };
            }
        }


        public async Task<DataSet> FetchJsonAsDataSetAsync(string jsonString)
        {
            using JsonDocument doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            if (!root.TryGetProperty("$resources", out JsonElement resources) || resources.ValueKind != JsonValueKind.Array)
                throw new Exception("Invalid JSON format: $resources not found or not array");

            var ds = new DataSet();

            // Main table for scalars
            var mainTable = new DataTable("Resources");
            mainTable.Columns.Add("$uuid", typeof(string));  // Always present

            // We'll dynamically add columns as we find scalar props (skip *_REF)
            var refPropertyNames = new HashSet<string>();

            // First pass: determine scalar columns and _REF property names from first element
            var first = resources.EnumerateArray().FirstOrDefault();
            if (first.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in first.EnumerateObject())
                {
                    if (prop.Name.EndsWith("_REF"))
                        refPropertyNames.Add(prop.Name);
                    else if (!mainTable.Columns.Contains(prop.Name))  // <-- Check before adding column
                        mainTable.Columns.Add(prop.Name, typeof(string));
                }
            }
            ds.Tables.Add(mainTable);

            // Create tables for all *_REF nested objects
            var refTables = new Dictionary<string, DataTable>();
            foreach (var refProp in refPropertyNames)
            {
                var refTable = new DataTable(refProp);
                refTable.Columns.Add("ParentUUID", typeof(string));
                refTable.Columns.Add("Key", typeof(string));
                refTable.Columns.Add("Value", typeof(string));
                ds.Tables.Add(refTable);
                refTables[refProp] = refTable;
            }

            // Populate main and ref tables
            foreach (var resource in resources.EnumerateArray())
            {
                var mainRow = mainTable.NewRow();

                foreach (var prop in resource.EnumerateObject())
                {
                    if (prop.Name.EndsWith("_REF"))
                        continue; // skip _REF here

                    mainRow[prop.Name] = prop.Value.ValueKind == JsonValueKind.Null ? DBNull.Value : prop.Value.ToString();
                }
                mainTable.Rows.Add(mainRow);

                // Get parent UUID for linking
                string parentUUID = resource.GetProperty("$uuid").GetString() ?? "";

                // Process each _REF property into corresponding ref table
                foreach (var refProp in refPropertyNames)
                {
                    if (resource.TryGetProperty(refProp, out JsonElement refObj) && refObj.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var refItem in refObj.EnumerateObject())
                        {
                            var refTable = refTables[refProp];
                            var refRow = refTable.NewRow();
                            refRow["ParentUUID"] = parentUUID;
                            refRow["Key"] = refItem.Name;
                            refRow["Value"] = refItem.Value.ValueKind == JsonValueKind.Null ? DBNull.Value : refItem.Value.ToString();
                            refTable.Rows.Add(refRow);
                        }
                    }
                }
            }

            return ds;
        }


        public DataSet ParseJsonToDataSet(string jsonString)
        {
            using JsonDocument doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            var ds = new DataSet();

            // 1. Main table for root scalar properties (and strings)
            var mainTable = new DataTable("Root");
            mainTable.Columns.Add("$uuid", typeof(string));  // Always present
            ds.Tables.Add(mainTable);

            // 2. Reference table for *_REF objects
            var refTable = new DataTable("Refs");
            refTable.Columns.Add("ParentUUID", typeof(string));
            refTable.Columns.Add("RefName", typeof(string));
            refTable.Columns.Add("Key", typeof(string));
            refTable.Columns.Add("Value", typeof(string));
            ds.Tables.Add(refTable);

            // Helper to add columns dynamically
            void EnsureColumn(DataTable table, string colName)
            {
                if (!table.Columns.Contains(colName))
                    table.Columns.Add(colName, typeof(string));
            }

            // Insert main/root row
            var mainRow = mainTable.NewRow();

            foreach (var prop in root.EnumerateObject())
            {
                var propName = prop.Name;
                var propValue = prop.Value;

                if (propName.EndsWith("_REF") && propValue.ValueKind == JsonValueKind.Object)
                {
                    // Parse refs
                    string parentUUID = root.GetProperty("$uuid").GetString();
                    foreach (var refProp in propValue.EnumerateObject())
                    {
                        var refRow = refTable.NewRow();
                        refRow["ParentUUID"] = parentUUID;
                        refRow["RefName"] = propName;
                        refRow["Key"] = refProp.Name;
                        refRow["Value"] = refProp.Value.ValueKind == JsonValueKind.Null ? DBNull.Value : refProp.Value.ToString();
                        refTable.Rows.Add(refRow);
                    }
                }
                else if (propValue.ValueKind == JsonValueKind.Array)
                {
                    // For arrays, create a new DataTable per array prop name if not exists
                    string tableName = propName;
                    if (!ds.Tables.Contains(tableName))
                    {
                        var arrTable = new DataTable(tableName);
                        arrTable.Columns.Add("ParentUUID", typeof(string)); // foreign key to root
                        ds.Tables.Add(arrTable);
                    }
                    var arrTableRef = ds.Tables[tableName];
                    string parentUUID = root.GetProperty("$uuid").GetString();

                    foreach (var item in propValue.EnumerateArray())
                    {
                        var itemRow = arrTableRef.NewRow();
                        itemRow["ParentUUID"] = parentUUID;

                        // Add all properties of item to the table, adding columns dynamically if needed
                        foreach (var itemProp in item.EnumerateObject())
                        {
                            string colName = itemProp.Name;
                            EnsureColumn(arrTableRef, colName);

                            if (itemProp.Value.ValueKind == JsonValueKind.Object)
                            {
                                // For nested objects inside array items (like *_REF inside array elements), you can either flatten or skip or create another table.
                                // Here we flatten by JSON string
                                itemRow[colName] = itemProp.Value.GetRawText();
                            }
                            else if (itemProp.Value.ValueKind == JsonValueKind.Null)
                            {
                                itemRow[colName] = DBNull.Value;
                            }
                            else
                            {
                                itemRow[colName] = itemProp.Value.ToString();
                            }
                        }

                        arrTableRef.Rows.Add(itemRow);
                    }
                }
                else
                {
                    // Scalar or string property: add column and set value
                    EnsureColumn(mainTable, propName);

                    if (propValue.ValueKind == JsonValueKind.Null)
                        mainRow[propName] = DBNull.Value;
                    else
                        mainRow[propName] = propValue.ToString();
                }
            }

            mainTable.Rows.Add(mainRow);

            return ds;
        }
        public async Task<ResponseResult> RevalidateItems(int id)
        {
            try
            {
                var asnid = id;
                var shipmentDetails = await _asnRepository.GetshipmentDetailsByasnId(asnid);

                int invalidCount = shipmentDetails.Count();
                int invalidDetailsCount = 0;

                foreach (var item in shipmentDetails)
                {
                    var validation = await _validateItemHelper.ValidateItem(item.input_itmref); // Called an extra class ValidateItemHelper

                    if (validation.Error == 0 && validation.IsValid == 1)
                    {
                        var convertedObj = await _validateItemHelper.GetItemConversion(item.input_itmref, item.uom, item.shiqty);
                        item.itmref = validation.Sku;
                        item.uom = validation.Uom;
                        item.invalid_items = true;

                        if (item.mantis_imported == 1 && item.invalid_items == false)
                        {
                            item.mantis_imported = 0;
                            item.mantis_imported = 0;

                            await _asnRepository.UpdateOrderDetail(item);
                            invalidCount--;
                        }
                        else if (item.mantis_imported == 0)
                        {
                            await _asnRepository.UpdateOrderDetail(item);
                            invalidCount--;
                        }
                    }
                }

                if (invalidCount == 0)
                {
                    await _asnRepository.UpdateInvalidItemsFlag(id, false);
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
                    Message = $"Could not revalidate items | {ex.Message}"
                };
            }
        }

        public async Task<ResponseItemAttribute> GetItemAttributes(string code)
        {
            var itemId = await _asnRepository.GetItemIdByCode(code);
            if (itemId == null)
                return new ResponseItemAttribute
                {
                    error = 1,
                    message = "prd_PrimaryCode not present"
                };

            var attribute = await _asnRepository.GetItemAttributesById(itemId.Value);
            return new ResponseItemAttribute
            {
                error = 0,
                message = "Success",
                data = attribute
            };
        }
        public async Task<ResponseResult> UpdateItemAttributes(UpdateItemAttributeRequest request)
        {
            var productId = await _asnRepository.GetProductIdByPrimaryCode(request.item_id);
            if (productId == null)
            {
                return new ResponseResult
                {
                    Error = 1,
                    Message = "prd_PrimaryCode is not present"
                };

            }

            int? isConveyable = null;
            if (request.conveyable != 0)
            {
                isConveyable = request.conveyable == 1 ? 0 : 1;
            }

            var attributes = new List<(int attributeId, string? value)>
            {
                (7, request.layers),
                (8, request.eaches),
                (9, isConveyable?.ToString())
            };

            foreach (var attr in attributes)
            {
                if (attr.value != null)
                {
                    var existingPavId = await _asnRepository.GetExistingPavId(productId.Value, attr.attributeId);
                    if (existingPavId != null)
                    {
                        await _asnRepository.UpdateAttribute(existingPavId.Value, attr.value);
                    }
                    else
                    {
                        var newPavId = (await _asnRepository.GetLatestPavId()) + 1;
                        await _asnRepository.InsertAttribute(newPavId, productId.Value, attr.attributeId, attr.value);
                    }
                }
            }

            return new ResponseResult
            {
                Error = 0,
                Message = "Item Attributes Updated Successfully"
            };

        }
        public async Task<ResponseResult> RevalidateConveyAbleItems(int id)
        {
            try
            {
                var shipments = await _asnRepository.GetNonConveyableItems(id);
                int invalidConveyableCount = shipments.Count();
                int invalidConveyableDetailsCount = 0;

                foreach (var item in shipments)
                {
                    var isValid = await _validateItemHelper.ValidateConveyableItem(item.input_itmref);

                    if (isValid.Error == 0 && isValid.IsValid == 1)
                    {
                        await _asnRepository.UpdateAsnLineIsConveyable(item.id);
                        invalidConveyableDetailsCount++;
                    }
                }

                if (invalidConveyableCount == invalidConveyableDetailsCount)
                {
                    await _asnRepository.UpdateAsnIsConveyable(id);
                }

                return new ResponseResult
                {

                    Error = 0,
                    Message = "Operations successful"
                };

            }
            catch (Exception ex)
            {
                return new ResponseResult
                {

                    Error = 1,
                    Message = "Could not perform operation"
                };
            }
        }

        public async Task<IEnumerable<AsnLineV1>> GetShipmentLinesByAsnId(int asnId)
        {
            return await _asnRepository.GetShipmentLinesByAsnId(asnId);
        }

        public async Task<ApisResponse> CreateShipmentDetail(CreateShipmentRequest request)
        {
            try
            {
                if (request.shipments == null || !request.shipments.Any())
                {
                    return new ApisResponse { Error = 1, Message = "Invalid shipments data" };
                }

                foreach (var shipment in request.shipments)
                {
                    var shipNum = shipment.ship_num;
                    var asn = await _asnRepository.CheckAsnExists(shipNum);

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

                    var requestUrl = $"SHIPMENT(\"{shipNum}\")?representation=YSHIPMENT.$details";
                    var fullUrl = new Uri(client.BaseAddress, requestUrl);
                    var responseUrl = await client.GetAsync(fullUrl);
                    responseUrl.EnsureSuccessStatusCode();
                    var response = await responseUrl.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<JObject>(response);

                    //  Sync activity log ONCE per shipment
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        @event = "sync",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.asn,
                        properties = JsonConvert.SerializeObject(new { request = requestUrl, response = result }),
                        subject_id = 209,
                        description = $"Shipment Detail | {shipNum}"
                    });

                    var shhshd = result["SHHSHD"] as JArray;
                    if (shhshd != null && shhshd.Count > 0)
                    {
                        var chunks = shhshd
                            .Select((item, index) => new { item, index })
                            .GroupBy(x => x.index / 30)
                            .Select(g => g.Select(x => x.item).ToList())
                            .ToList();

                        DateTime? expectedAt = null;
                        string ctrnum = null;

                        foreach (var chunk in chunks)
                        {
                            foreach (var value in chunk)
                            {
                                string itmref = value["ITMREF"]?.ToString();
                                bool isInvalidItem = false;
                                bool isConveyableItem = false;
                                decimal extractedQty = 0;
                                string sku = null;
                                string uom = null;
                                bool isPresentInMantis = false;

                                if (!string.IsNullOrEmpty(itmref))
                                {
                                    var item = (await _asnRepository.GetItemConversionAsync(itmref)).FirstOrDefault();
                                    if (item != null)
                                    {
                                        sku = item.sku_mantis;
                                        uom = item.uom_mantis;
                                        extractedQty = value["SHIQTY"] != null ? Convert.ToDecimal(value["SHIQTY"]) : 0;

                                        var isValid = await _validateItemHelper.ValidateItem(itmref);
                                        isInvalidItem = isValid.IsValid != 1;
                                        isPresentInMantis = isValid.IsPresent;

                                        var isConveyable = await _validateItemHelper.ValidateConveyableItem(itmref);
                                        isConveyableItem = (isConveyable?.IsValid ?? 0) == 1;
                                    }
                                }
                                else
                                {
                                    isInvalidItem = true;
                                }

                                if (isInvalidItem)
                                {
                                    asn.invalid_items = true;
                                    await _asnRepository.UpdateInvalidItems(asn.id, asn.invalid_items);
                                }

                                if (!isConveyableItem)
                                {
                                    asn.is_conveyable = false;
                                    await _asnRepository.UpdateAsnConveyable(asn.id, asn.is_conveyable);
                                }

                                ctrnum = value["CTRLIN"]?.ToString();
                                var shipmentDetail = new CreateShipmentDetailResponse
                                {
                                    asn_id = asn.id,
                                    pohnum = value?["POHNUM"]?.ToString(),
                                    poplin = value?["POPLIN"]?.ToObject<int?>(),
                                    poqseq = value?["POQSEQ"]?.ToObject<int?>(),
                                    ctrnum = value?["CTRNUM"]?.ToString(),
                                    ctrlin = value?["CTRLIN"]?.ToObject<int?>(),
                                    shiqty = extractedQty,
                                    extrcpdat = value?["EXTRCPDAT"]?.Value<DateTime?>(),
                                    qtyweu = value?["QTYWEU"]?.ToObject<double?>(),
                                    qtyvou = value?["QTYVOU"]?.ToObject<double?>(),
                                    itmref = sku,
                                    uom = uom,
                                    pohfcy = value?["POHFCY"]?.ToString(),
                                    invalid_items = isInvalidItem,
                                    input_itmref = value?["ITMREF"]?.ToString(),
                                    input_uom = value?["UOM"]?.ToString(),
                                    ship_uid = asn.ship_uid,
                                    shiplin = value?["SHIPLIN"]?.ToObject<int?>(),
                                    is_conveyable = isConveyableItem,
                                    is_present_in_mantis = isPresentInMantis,
                                    input_qty = value?["INPUT_QTY"]?.ToObject<int?>()
                                };

                                expectedAt = value?["EXTRCPDAT"]?.ToObject<DateTime?>();
                                await _asnRepository.UpsertAsn(shipmentDetail);

                                asn.expected_at = expectedAt;
                                asn.ctrnum = ctrnum;
                                await _asnRepository.UpdateAsnHeader(asn.id, expectedAt, ctrnum);
                            }
                                    
                            if (asn.wasRecentlyCreated)
                            {
                                await _IActivityLogRepository.ActivityLog(new ActivityLog
                                {
                                    log_name = "inbound",
                                    @event = "sync",
                                    module_id = (int)EnumData.Module.inbound,
                                    sub_module_id = (int)EnumData.SubModule.asn,
                                    properties = JsonConvert.SerializeObject(new { request = requestUrl, response = result }),
                          
                                    description = $"Shipment Detail | {shipNum}"
                                });

                            }
                        }

                        //  Update ASN header after all chunks
                        asn.expected_at = expectedAt;
                        asn.ctrnum = ctrnum;
                        await _asnRepository.UpdateAsnHeader(asn.id, expectedAt, ctrnum);
                    }

                    //  Always log "created" (no flag check)
                    var asnData = new
                    {
                        ship_num = asn.ship_num,
                        ship_uid = asn.ship_uid,
                        ship_dat = asn.ship_dat,
                        create_dat_tim = asn.create_dat_tim,
                        fcy = asn.fcy,
                        bpsnum = asn.bpsnum,
                        tctrnum = asn.tctrnum,
                        dspweu = asn.dspweu,
                        dspvou = asn.dspvou,
                        is_transfer = asn.is_transfer,
                        status = asn.status,
                        updated_at = DateTime.UtcNow,
                        created_at = asn.created_at,
                        id = asn.id
                    };

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        @event = "created",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.asn,
                        properties = JsonConvert.SerializeObject(new { data = asnData }),
                        description = $"Shipment Created | {asn.ship_num}",
                        subject_ref= asn.ship_num
                    });
                }

                return new ApisResponse { Error = 0, Message = "Shipments processed successfully" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing shipment details");
                return new ApisResponse
                {
                    Error = 1,
                    Message = $"An error occurred while processing the request: {ex.Message}"
                };
            }
        }
    }
}








