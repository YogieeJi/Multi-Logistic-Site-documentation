using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MiddlewareWebAPI.Common.Enum;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;

namespace MiddlewareWebAPI.Services.Services
{
    public class ReceiptExportService: IReceiptExportService
    {
        private readonly IReceiptExportRepository _receiptExportRepository;
        private readonly IActivityLogRepository _IActivityLogRepository;

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ReceiptExportService(IReceiptExportRepository receiptExportRepository, HttpClient httpClient, IConfiguration configuration, IActivityLogRepository iActivityLogRepository)
        {
            _receiptExportRepository = receiptExportRepository;
            _httpClient = httpClient;
            _configuration = configuration;
            _IActivityLogRepository = iActivityLogRepository;
        }

        public async Task<ReceiptExportResponse> GetReceiptExportGrid(GridRequest request)
        {
            return await _receiptExportRepository.GetReceiptExportGrid(request);
        }

        public async Task<List<ReceiptExport>> GetReceiptExportById(int id)
        {
            return await _receiptExportRepository.GetReceiptExportById(id);
        }

        public async Task<ReceiptExportDetailsResponse> GetReceiptExportDetails(GridRequest request, string receiptCode)
        {
            return await _receiptExportRepository.GetReceiptExportDetails(request, receiptCode);
        }

        public async Task<ReceiptExportDetailsLotResponse> GetReceiptExportDetailLOT(GridRequest request, string receiptCode)
        {
            return await _receiptExportRepository.GetReceiptExportDetailLOT(request, receiptCode);
        }

        public async Task<ResponseResult> CreatePoReceiptLotsSagex3(CreatePoReceiptLotRequest request)
        {
            try
            {
                var receiptDetails = await _receiptExportRepository.GetReceiptExportDetailsLot(request.ReceiptCode);

                if (receiptDetails == null || !receiptDetails.Any())
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.receipt,
                        @event = "error",
                        user_name = request.UserName,
                        subject_id = request.ReceiptId,
                        subject_ref = request.ReceiptCode,
                        api_action_type = "PO Receipt Export",
                        description = "No receipt details found for export",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new { receiptCode = request.ReceiptCode }
                        })
                    });

                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "No receipt details found"
                    };
                }

                var baseUrl = _configuration["ExternalApi:Endpoint"];
                var username = _configuration["ExternalApi:Username"];
                var password = _configuration["ExternalApi:Password"];
                var poolAlias = _configuration["SageX3Config:SAGE_X3_API_POOLALIAS"];

                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback =
                        HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                using var client = new HttpClient(handler)
                {
                    BaseAddress = new Uri(baseUrl)
                };

                var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

                //var matchedRows = receiptDetails.Where(db => request.ReceiptData.Any(r => r.TotalReceived == db.X3_Qty)).ToList();

                if (!receiptDetails.Any())
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.receipt,
                        @event = "error",
                        user_name = request.UserName,
                        subject_id = request.ReceiptId,
                        subject_ref = request.ReceiptCode,
                        api_action_type = "PO Receipt Export",
                        description = "No matching rows between request and DB data",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new
                            {
                                receiptCode = request.ReceiptCode,
                                requestData = request.ReceiptData
                            }
                        })
                    });

                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "No matching rows between request and DB data"
                    };
                }

                // this is Latest code
                var tabLines = new StringBuilder();
                int lineNo = 1;
                foreach (var row in receiptDetails)
                {
                    string lots = "";
                    string? date = row.ActualDate?.ToString("yyyyMMdd");

                    if (!string.IsNullOrWhiteSpace(row.LotsJson) && row.LotsJson != "{}")
                    {
                        using var doc = JsonDocument.Parse(row.LotsJson);
                        if (doc.RootElement.TryGetProperty("LOTSJson", out var element))
                        {
                            lots = element.GetString() ?? "";

                            // Fix newline
                            lots = lots.Replace("\\n", "\n");
                        }
                    }

                    tabLines.AppendLine($@"
                        <LIN NUM=""{lineNo}"">
                            <FLD NAME=""PONUM"" TYPE=""Char"">{row.POREF}</FLD>
                            <FLD NAME=""POLINS"" TYPE=""Integer"">{row.POLINE}</FLD>
                            <FLD NAME=""ITMREFS"" TYPE=""Char"">{row.X3_SKU}</FLD>
                            <FLD NAME=""QTYS"" TYPE=""Decimal"">{row.X3_Qty}</FLD>
                            <FLD NAME=""MFDATS"" TYPE=""Date"">{date}</FLD>
                            <FLD NAME=""LOTS"">{lots}</FLD>
                        </LIN>");
                    lineNo++;
                }

                string body = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
                     xmlns:xsd=""http://www.w3.org/2001/XMLSchema""
                     xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/""
                     xmlns:wss=""http://www.adonix.com/WSS"">
                    <soapenv:Header/>
                    <soapenv:Body>
                    <wss:run soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
                    <callContext xsi:type=""wss:CAdxCallContext"">
                    <codeLang xsi:type=""xsd:string"">ENG</codeLang>
                    <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
                    <poolId xsi:type=""xsd:string""></poolId>
                    <requestConfig xsi:type=""xsd:string""><![CDATA[adxwss.trace.on=on]]></requestConfig>
                    </callContext>
                    <publicName xsi:type=""xsd:string"">YCREPTHEXT</publicName>
                    <inputXml xsi:type=""xsd:string""><![CDATA[<PARAM>
                    <TAB DIM=""30"" ID=""GRP1"" SIZE=""{lineNo - 1}"">
                    {tabLines.ToString().Trim()}
                    </TAB>
                    </PARAM>]]></inputXml>
                    </wss:run>
                    </soapenv:Body>
                    </soapenv:Envelope>
                ";

                // this is old code 
                //var tabLines = new StringBuilder();
                //int lineNo = 1;
                //foreach (var row in receiptDetails)
                //{
                //    string? lots = ""; //A;CS;9;H15B;31440007;

                //    if (!string.IsNullOrWhiteSpace(row.LotsJson) && row.LotsJson != "{}")
                //    {
                //        using var doc = JsonDocument.Parse(row.LotsJson);
                //        if (doc.RootElement.TryGetProperty("LOTSJson", out var element))
                //        {
                //            lots = element.GetString();
                //        }
                //    }

                //    tabLines.AppendLine($@"
                //        <LIN NUM=""{lineNo}"">
                //            <FLD NAME=""PONUM"" TYPE=""Char"">{row.POREF}</FLD>
                //            <FLD NAME=""POLINS"" TYPE=""Integer"">{row.POLINE}</FLD>
                //            <FLD NAME=""ITMREFS"" TYPE=""Char""></FLD>
                //            <FLD NAME=""QTYS"" TYPE=""Decimal"">{row.X3_Qty}</FLD>
                //            <FLD NAME=""LOTS"" TYPE=""Char"">{lots}</FLD>
                //        </LIN>");
                //    lineNo++;
                //}

                //string body = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
                //     xmlns:xsd=""http://www.w3.org/2001/XMLSchema""
                //     xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/""
                //     xmlns:wss=""http://www.adonix.com/WSS"">
                //    <soapenv:Header/>
                //    <soapenv:Body>
                //    <wss:run soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
                //    <callContext xsi:type=""wss:CAdxCallContext"">
                //    <codeLang xsi:type=""xsd:string"">ENG</codeLang>
                //    <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
                //    <poolId xsi:type=""xsd:string""></poolId>
                //    <requestConfig xsi:type=""xsd:string""><![CDATA[adxwss.trace.on=on]]></requestConfig>
                //    </callContext>
                //    <publicName xsi:type=""xsd:string"">YPTHCREPOL</publicName>
                //    <inputXml xsi:type=""xsd:string""><![CDATA[<PARAM>
                //    <TAB DIM=""30"" ID=""GRP1"" SIZE=""{lineNo - 1}"">
                //    {tabLines.ToString().Trim()}
                //    </TAB>
                //    </PARAM>]]></inputXml>
                //    </wss:run>
                //    </soapenv:Body>
                //    </soapenv:Envelope>
                //";

                var soapRequest = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                {
                    Content = new StringContent(body, Encoding.UTF8, "text/xml")
                };

                soapRequest.Headers.Add("SOAPAction", "run");

                var response = await client.SendAsync(soapRequest);
                response.EnsureSuccessStatusCode();
                var responseXml = await response.Content.ReadAsStringAsync();
                var properties = new { request = System.Net.WebUtility.HtmlEncode(body), response = responseXml };
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "inbound",
                    module_id = (int)EnumData.Module.inbound,
                    sub_module_id = (int)EnumData.SubModule.receipt,
                    @event = "sync",
                    user_name = request.UserName,
                    subject_ref = request.ReceiptCode,
                    subject_id = request.ReceiptId,
                    api_action_type = "PO Receipt Export",
                    description = "PO Receipt Export Process – Sage X3 API",
                    properties = JsonConvert.SerializeObject(properties)
                });


                if (response.IsSuccessStatusCode)
                {
                    // Update DB
                    var exportRequest = new MarkAsExportedRequest
                    {
                        UserId = request.UserId,
                        ReceiptCode = request.ReceiptCode
                    };

                    await _receiptExportRepository.MarkAsManualExportReceipt(exportRequest);

                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.receipt,
                        @event = "created",
                        user_name = request.UserName,
                        subject_ref = request.ReceiptCode,
                        subject_id = request.ReceiptId,
                        api_action_type = "PO Receipt Export",
                        description = "PO Receipt Export",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new
                            {
                                receiptCode = request.ReceiptCode
                                //userName = request.UserName
                            }
                        })
                    });

                    return new ResponseResult
                    {
                        Error = 0,
                        Message = "PO Receipt exported successfully to Sage X3"
                    };
                }
                else
                {
                    await _IActivityLogRepository.ActivityLog(new ActivityLog
                    {
                        log_name = "inbound",
                        module_id = (int)EnumData.Module.inbound,
                        sub_module_id = (int)EnumData.SubModule.receipt,
                        @event = "error",
                        user_name = request.UserName,
                        subject_ref = request.ReceiptCode,
                        subject_id = request.ReceiptId,
                        api_action_type = "PO Receipt Export",
                        description = "PO Receipt Export",
                        properties = JsonConvert.SerializeObject(new
                        {
                            data = new
                            {
                                receiptCode = request.ReceiptCode
                            }
                        })
                    });

                    return new ResponseResult
                    {
                        Error = 1,
                        Message = "Sage X3 rejected PO Receipt export"
                    };
                }
            }
            catch (Exception ex)
            {
                await _IActivityLogRepository.ActivityLog(new ActivityLog
                {
                    log_name = "inbound",
                    module_id = (int)EnumData.Module.inbound,   
                    sub_module_id = (int)EnumData.SubModule.receipt,
                    @event = "error",
                    user_name = request.UserName,
                    subject_ref = request.ReceiptCode,
                    subject_id = request.ReceiptId,
                    api_action_type = "PO Receipt Export",
                    description = "Exception occurred during PO Receipt export",
                    properties = JsonConvert.SerializeObject(new
                    {
                        error = ex.Message,
                        stackTrace = ex.StackTrace
                    })
                });

                return new ResponseResult
                {
                    Error = 1,
                    Message = ex.Message
                };
            }

        }

        public async Task<ResponseResult> MarkAsManualExportReceipt(MarkAsExportedRequest request)
        {
            return await _receiptExportRepository.MarkAsManualExportReceipt(request);
        }
    }
}
