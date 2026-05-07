using System;
using System.Collections.Generic;
using System.Data;
using System.Formats.Asn1;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Resources;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web.Mvc.Html;
using CsvHelper;
using CsvHelper.Configuration;
using ExcelDataReader;
using Hangfire;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualBasic;
using Middleware.Data.Repository;
using MiddlewareWebAPI.Common.Enum;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Data.Repository;
using MiddlewareWebAPI.Services.IServices;
using Newtonsoft.Json;
using OfficeOpenXml;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Bcpg;
using static MiddlewareWebAPI.Common.Enum.EnumData;
using System.Linq;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.IO.Image;
using iText.Layout.Properties;
using iText.Kernel.Geom;
using iText.Kernel.Font;
using Dapper;
using SendGrid.Helpers.Mail;
using SendGrid;
using System.Net.Mail;

namespace MiddlewareWebAPI.Services.Services
{
    public class ReceiptDashboardService:IReceiptDashboardService
    {
        private readonly IReceiptDashboardRepository _receiptdashboardrepository;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly INotificationLogsService _notificationLogsService;
        private readonly IImportedOrdersRepository _importedOrdersRepository;
        private readonly INotificationLogsRepository _notificationLogsRepository;
        private readonly IActivityLogRepository _IActivityLogRepository;

        public ReceiptDashboardService(IReceiptDashboardRepository receiptdashboardrepository, HttpClient httpClient, IConfiguration configuration, INotificationLogsService notificationLogsService, IImportedOrdersRepository importedOrdersRepository, INotificationLogsRepository notificationLogsRepository, IActivityLogRepository iActivityLogRepository)
        {
            _receiptdashboardrepository = receiptdashboardrepository;
            _httpClient = httpClient;
            _configuration = configuration;
            _notificationLogsService = notificationLogsService;
            _importedOrdersRepository = importedOrdersRepository;
            _notificationLogsRepository = notificationLogsRepository;
            _IActivityLogRepository = iActivityLogRepository;
        }
        public async Task<List<Receiptdashboardddl>> getReceiptDropdown()
        {
            return await _receiptdashboardrepository.getReceiptDropdown();
        }
        public async Task<ReceiptDashboardResponse> getReceiptDetailsLOT(ReceiptDashboardRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.getReceiptDetailsLOT(request, receiptCode);
        }
        public async Task<ReceiptDashboardResponse> getReceiptDetailsLOTC(ReceiptDashboardRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.getReceiptDetailsLOTC(request, receiptCode);
        }
        public async Task<ReceiptDashboardDetailsResponse> GetReceiptDetails(ReceiptDashboardRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.GetReceiptDetails(request, receiptCode);
        }
        public async Task<ReceiptDashboardResponse> getReceiptDetailsLOT( string receiptCode)
        {
            return await _receiptdashboardrepository.getReceiptDetailsLOT( receiptCode);
        }
        public async Task<PdfDownloadResponse> getReceiptDetails(string receiptCode)
        {
            return await _receiptdashboardrepository.getReceiptDetails(receiptCode);
        }
        public async Task<TransferReceiptPdfDownload> getInboundTransferReceipt(string receiptCode)
        {
            return await _receiptdashboardrepository.getInboundTransferReceipt(receiptCode);
        }
        public async Task<DiscrepancyBreakdownPdfDownload> GetDiscrepancyData(string receiptCode)
        {
            return await _receiptdashboardrepository.GetDiscrepancyData(receiptCode);
        }
        public async Task<DateTime?> GetReceiptactualdate(string receiptCode)
        {
            return await _receiptdashboardrepository.GetReceiptactualdate(receiptCode);
        }

        //Old Work
        public async Task<ReceiptDashboardDetailsResponse> getReceiptDetails(ReceiptDashboardRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.getReceiptDetails(request, receiptCode);
        }
        public async Task<ReceiptDashboardDetailsResponse> getReceiptDetailsOld(string receiptCode)
        {
            return await _receiptdashboardrepository.getReceiptDetailsOld(receiptCode);
        }
        //New
        public async Task<ReceiptDashboardLotDetailsResponse> GetReceiptDetailsLot(ReceiptDashboardRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.GetReceiptDetailsLot(request,receiptCode);

        }

        public async Task<ReceiptDownloadPdfResponse> GetReceiptDetailsLot(string receiptCode)
        {
            return await _receiptdashboardrepository.GetReceiptDetailsLot(receiptCode);
        }

        public async Task<ReceiptSelectionResponse>GetReceiptsInExecution(ReceiptSelectionRequest request)
        {
            return await _receiptdashboardrepository.GetReceiptsInExecution(request);

        }

        public async Task<ReceiptSelectionResponse> GetAllReceipt(ReceiptSelectionRequest request)
        {
            return await _receiptdashboardrepository.GetAllReceipt(request);

        }

        public async Task<ReceiptDetailsResponse> GetReceiptDetails(ReceiptDetailsRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.GetReceiptDetails(request, receiptCode);

        }

        public async Task<ReceiptLotDetailsResponse> GetReceiptDetailsLots(ReceiptLotDetailsRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.GetReceiptDetailsLot(request, receiptCode);

        }

        public async Task<ReceiptDetailsResponse> GetDiscrepancyItemsOnly(string receiptCode)
        {
            return await _receiptdashboardrepository.GetDiscrepancyItemsOnly(receiptCode);

        }
        //public async Task<ReceiptStatusResponse> UpdateReceiptStatus(int receiptId, UpdateReceiptRequest request)
        //{
        //    try
        //    {
        //        // 1. GET RECEIPT CODE
        //        string receiptCode = request?.receiptCode?.Trim() ?? string.Empty;

        //        if (string.IsNullOrWhiteSpace(receiptCode))
        //        {
        //            receiptCode = await _receiptdashboardrepository.GetReceiptCodeById(receiptId);
        //        }

        //        if (string.IsNullOrWhiteSpace(receiptCode))
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "Receipt code not found."
        //            };
        //        }

        //        // 2. DISCREPANCY
        //        var discrepancyItems = await _receiptdashboardrepository.GetDiscrepancyItems(receiptCode);
        //        bool hasDiscrepancy = discrepancyItems.Any();

        //        string moduleName = "Receipt Export Notifications";
        //        var data = await _receiptdashboardrepository.GetNotificationSettings(moduleName);

        //        // 3. EVENT CODE
        //        string eventCode = hasDiscrepancy
        //            ? "RECEIPT_EXPORT_DISCREPANCY"
        //            : "RECEIPT_EXPORT";

        //        // 4. TRIGGER
        //        var triggerInfo = await _receiptdashboardrepository.GetTriggerInfo(eventCode);

        //        if (triggerInfo == null)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = $"Notification trigger configuration not found for event {eventCode}."
        //            };
        //        }

        //        int triggerId = Convert.ToInt32(triggerInfo.ntg_ID);
        //        int triggerEnabled = Convert.ToInt32(triggerInfo.ntg_IsEnabled);

        //        string primaryEmails = triggerInfo.nst_Primary_Emails?.ToString() ?? "";
        //        string secondaryEmails = triggerInfo.nst_Secondary_Emails?.ToString() ?? "";

        //        if (string.IsNullOrWhiteSpace(primaryEmails) ||
        //            primaryEmails.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase))
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "Primary mail is not present."
        //            };
        //        }

        //        var allEmails = (primaryEmails + "," + secondaryEmails)
        //            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //            .Select(x => x.Trim())
        //            .Where(x => !string.IsNullOrWhiteSpace(x))
        //            .Distinct(StringComparer.OrdinalIgnoreCase)
        //            .ToList();

        //        if (!allEmails.Any())
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "No recipient emails found."
        //            };
        //        }

        //        // 5. UPDATE
        //        var rowsAffected = await _receiptdashboardrepository.UpdateReceiptStatusCompleted(receiptId);

        //        if (rowsAffected <= 0)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = "No Receipt updated"
        //            };
        //        }

        //        if (triggerEnabled == 0)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = true,
        //                Error = 0,
        //                Message = "Receipt updated successfully. Email trigger is disabled."
        //            };
        //        }

        //        // 6. TEMPLATE
        //        var template = await _receiptdashboardrepository.GetTemplateByTriggerId(triggerId);

        //        if (template == null)
        //        {
        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Error = 1,
        //                Message = $"Notification template not found for event {eventCode}."
        //            };
        //        }

        //        string subjectTemplate = template.Subject?.ToString() ?? "";
        //        string bodyTemplate = template.Body?.ToString() ?? "";

        //        var estTime = TimeZoneInfo.ConvertTimeFromUtc(
        //            DateTime.UtcNow,
        //            TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time")
        //        );

        //        string readyDate = estTime.ToString("dd/MM/yyyy hh:mm tt");
        //        string receivedBy = request?.UserName ?? "";
        //        string poNumber = discrepancyItems.FirstOrDefault()?.PO ?? "";

        //        string discrepancyText = string.Empty;

        //        if (discrepancyItems.Any())
        //        {
        //            var parts = discrepancyItems.Select(x =>
        //            {
        //                decimal diff = Convert.ToDecimal(x.ActualQty) - Convert.ToDecimal(x.ExpectedQty);
        //                string diffText = diff > 0 ? $"+{diff:0.##}" : $"{diff:0.##}";
        //                return $"Item {x.ItemCode} ({diffText})";
        //            });

        //            discrepancyText = string.Join(" . ", parts);
        //        }

        //        string finalSubject = subjectTemplate;
        //        string finalBody = bodyTemplate;

        //        if (eventCode == "RECEIPT_EXPORT_DISCREPANCY")
        //        {
        //            finalSubject = finalSubject.Replace("{ReceiptID}", receiptCode);

        //            finalBody = finalBody
        //                .Replace("\n", "<br>")
        //                .Replace("{ReceiptID}", receiptCode)
        //                .Replace("{PO}", poNumber)
        //                .Replace("{Discrepancies}", discrepancyText);
        //        }
        //        else
        //        {
        //            finalSubject = finalSubject.Replace("{ReceiptID}", receiptCode);

        //            finalBody = finalBody
        //                .Replace("\n", "<br>")
        //                .Replace("{ReceiptID}", receiptCode)
        //                .Replace("{ReadyDate}", readyDate)
        //                .Replace("{ReceivedBy}", receivedBy);
        //        }

        //        var apiKey = _configuration["SendGrid:ApiKey"];
        //        var client = new SendGridClient(apiKey);

        //        var msg = new SendGridMessage();
        //        msg.SetFrom(new EmailAddress("mw-no-reply@dynarex.com", "Mantis System"));
        //        msg.SetSubject(finalSubject);

        //        foreach (var email in primaryEmails.Split(',', ';'))
        //        {
        //            if (!string.IsNullOrWhiteSpace(email))
        //                msg.AddTo(new EmailAddress(email.Trim()));
        //        }

        //        foreach (var email in secondaryEmails.Split(',', ';'))
        //        {
        //            if (!string.IsNullOrWhiteSpace(email))
        //                msg.AddCc(new EmailAddress(email.Trim()));
        //        }

        //        msg.AddContent(MimeType.Text, finalBody);
        //        msg.AddContent(MimeType.Html, finalBody.Replace(Environment.NewLine, "<br/>"));

        //        var response = await client.SendEmailAsync(msg);

        //        int statusCode = response != null ? (int)response.StatusCode : 0;
        //        bool isSuccess = statusCode >= 200 && statusCode < 300;

        //        if (!isSuccess)
        //        {
        //            await _notificationLogsRepository.CreateNotificationLogs(new CreateNotificationLogRequest
        //            {
        //                NotificationSettingID = data[0].nst_ID,
        //                TriggerID = triggerId,
        //                UserID = request.UserId,
        //                NotificationType = data[0].nst_ModuleName,
        //                OpertionType = eventCode,
        //                Status = "ERROR",
        //                CreatedBy = request.UserEmail,
        //                Subject = finalSubject,
        //                Body = finalBody,
        //                PrimaryEmail = primaryEmails,
        //                SecondaryEmail = secondaryEmails
        //            });

        //            return new ReceiptStatusResponse
        //            {
        //                Success = false,
        //                Message = $"SendGrid email failed. Status: {statusCode} Response: {finalBody}"
        //            };

        //        }

        //        await _notificationLogsRepository.CreateNotificationLogs(new CreateNotificationLogRequest
        //        {
        //            NotificationSettingID = data[0].nst_ID,
        //            TriggerID = triggerId,
        //            UserID = request.UserId,
        //            NotificationType = data[0].nst_ModuleName,
        //            OpertionType = eventCode,
        //            Status = "SENT",
        //            CreatedBy = request.UserEmail,
        //            Subject = finalSubject,
        //            Body = finalBody,
        //            PrimaryEmail = primaryEmails,
        //            SecondaryEmail = secondaryEmails
        //        });

        //        return new ReceiptStatusResponse
        //        {
        //            Success = true,
        //            Error = 0,
        //            Message = "Receipt Status Updated Successfully and email sent successfully."
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ReceiptStatusResponse
        //        {
        //            Success = false,
        //            Error = 1,
        //            Message = "Error while updating receipt status | " + ex.Message
        //        };
        //    }
        //}

        public async Task<ReceiptStatusResponse> UpdateReceiptStatus(int receiptId, UpdateReceiptRequest request)
        {
            try
            {
                // 1. GET RECEIPT CODE
                string receiptCode = request?.receiptCode?.Trim() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(receiptCode))
                {
                    receiptCode = await _receiptdashboardrepository.GetReceiptCodeById(receiptId);
                }

                if (string.IsNullOrWhiteSpace(receiptCode))
                {
                    return new ReceiptStatusResponse
                    {
                        Success = false,
                        Error = 1,
                        Message = "Receipt code not found."
                    };
                }

                // 2. DISCREPANCY
                var discrepancyItems = await _receiptdashboardrepository.GetDiscrepancyItems(receiptCode);
                bool hasDiscrepancy = discrepancyItems.Any();

                // 3. EVENT CODE
                string eventCode = hasDiscrepancy
                    ? "RECEIPT_EXPORT_DISCREPANCY"
                    : "RECEIPT_EXPORT";

                var rowsAffected = await _receiptdashboardrepository.UpdateReceiptStatusCompleted(receiptId, receiptCode);

                if (rowsAffected <= 0)
                {
                    return new ReceiptStatusResponse
                    {
                        Success = false,
                        Error = 1,
                        Message = "No Receipt updated"
                    };
                }

                // 5. PREPARE TEMPLATE DATA
                var estTime = TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time")
                );

                string readyDate = estTime.ToString("dd/MM/yyyy hh:mm tt");
                string receivedBy = request?.UserName ?? "";
                string poNumber = discrepancyItems.FirstOrDefault()?.PO ?? "";

                string discrepancyText = "";

                if (discrepancyItems.Any())
                {
                    discrepancyText = string.Join(" . ", discrepancyItems.Select(x =>
                    {
                        decimal diff = Convert.ToDecimal(x.ActualQty) - Convert.ToDecimal(x.ExpectedQty);
                        string diffText = diff > 0 ? $"+{diff:0.##}" : $"{diff:0.##}";
                        return $"Item {x.ItemCode} ({diffText})";
                    }));
                }

                // 6. CALL COMMON NOTIFICATION METHOD
                await SendNotificationAsync(
                    entityId: receiptCode,
                    moduleName: "Receipt Export Notifications",
                    eventName: eventCode,
                    actionDescription: "Receipt Status Update",
                    templateData: new
                    {
                        ReceiptID = receiptCode,
                        PO = poNumber,
                        ReadyDate = readyDate,
                        ReceivedBy = receivedBy,
                        Discrepancies = discrepancyText
                    },
                    creatorEmail: null,
                    userEmail: request.UserEmail,
                    userId: request.UserId
                );

                return new ReceiptStatusResponse
                {
                    Success = true,
                    Error = 0,
                    Message = "Receipt Status Updated Successfully and notification triggered."
                };
            }
            catch (Exception ex)
            {
                return new ReceiptStatusResponse
                {
                    Success = false,
                    Error = 1,
                    Message = "Error while updating receipt status | " + ex.Message
                };
            }
        }

        public async Task<ReceiptSelectionResponse> GetReadyToProcessReceipts(ReceiptSelectionRequest request)
        {
            return await _receiptdashboardrepository.GetReadyToProcessReceipts(request);
        }

        public async Task<ReceiptSelectionResponse> GetAllAccountingReceipts(ReceiptSelectionRequest request)
        {
            return await _receiptdashboardrepository.GetAllAccountingReceipts(request);

        }

        public async Task<RceiptDiscrepancyWithPoResponse>GetDicrepancyItems(ReceiptDiscrepancyItemsRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.GetDicrepancyItems(request, receiptCode);

        }

        public async Task<ReceiptDiscrepancyByLotResponse> GetDicrepancyItemsByLot(ReceiptDiscrepancyItemsRequest request, string receiptCode)
        {
            return await _receiptdashboardrepository.GetDicrepancyItemsByLot(request, receiptCode);

        }

        //public async Task<ResponseResult> CreatePoReceiptLotsInSagex3(CreatePoReceiptLotRequest request)
        //{
        //    try
        //    {
        //        var receiptDetails = await _receiptdashboardrepository.GetReceiptExportDetailsLot(request.ReceiptCode);

        //        if (receiptDetails == null || !receiptDetails.Any())
        //        {
        //            await _receiptdashboardrepository.ActivityLog(new ActivityLog
        //            {
        //                log_name = "inbound",
        //                module_id = (int)EnumData.Module.inbound,
        //                sub_module_id = (int)EnumData.SubModule.receipt,
        //                @event = "error",
        //                user_name = request.UserName,
        //                subject_id = request.ReceiptId,
        //                subject_ref = request.ReceiptCode,
        //                api_action_type = "PO Receipt Export",
        //                description = "No receipt details found for export",
        //                properties = JsonConvert.SerializeObject(new
        //                {
        //                    data = new { receiptCode = request.ReceiptCode }
        //                })
        //            });

        //            return new ResponseResult
        //            {
        //                Error = 1,
        //                Message = "No receipt details found"
        //            };
        //        }
        //        var data = await _importedOrdersRepository.GetManualEmail("Receipt Export Notifications");

        //        // SEND "RECEIPT_EXPORTED" MAIL
        //        var triggerInfo = await _receiptdashboardrepository
        //            .GetNotificationTriggerInfoByEventCode("RECEIPT_EXPORTED", "RECEIPT_EXPORT");

        //        if (triggerInfo == null)
        //        {
        //            return new ResponseResult
        //            {
        //                Error = 1,
        //                Message = "Notification trigger configuration not found for event RECEIPT_EXPORTED."
        //            };
        //        }

        //        //if (triggerInfo.IsEnabled == 0)
        //        //{
        //        //    return new ResponseResult
        //        //    {
        //        //        Error = 1,
        //        //        Message = "Notification toggle is off for event RECEIPT_EXPORTED."
        //        //    };
        //        //}

        //        string primaryEmails = triggerInfo.PrimaryEmails?.Trim() ?? "";
        //        string secondaryEmails = triggerInfo.SecondaryEmails?.Trim() ?? "";

        //        if (string.IsNullOrWhiteSpace(primaryEmails) || primaryEmails.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase))
        //        {
        //            return new ResponseResult
        //            {
        //                Error = 1,
        //                Message = "Primary mail is not present."
        //            };
        //        }

        //        bool IsValidEmail(string email)
        //        {
        //            try
        //            {
        //                var addr = new System.Net.Mail.MailAddress(email);
        //                return addr.Address == email;
        //            }
        //            catch
        //            {
        //                return false;
        //            }
        //        }

        //        var allEmails = (primaryEmails + "," + secondaryEmails)
        //            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //            .Select(x => x.Trim())
        //            .Where(x => !string.IsNullOrWhiteSpace(x) && IsValidEmail(x))
        //            .Distinct(StringComparer.OrdinalIgnoreCase)
        //            .ToList();

        //        if (!allEmails.Any())
        //        {
        //            return new ResponseResult
        //            {
        //                Error = 1,
        //                Message = "No valid recipient emails found."
        //            };
        //        }

        //        var baseUrl = _configuration["ExternalApi:Endpoint"];
        //        var username = _configuration["ExternalApi:Username"];
        //        var password = _configuration["ExternalApi:Password"];
        //        var poolAlias = _configuration["SageX3Config:SAGE_X3_API_POOLALIAS"];

        //        var handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        //        };

        //        using var client = new HttpClient(handler)
        //        {
        //            BaseAddress = new Uri(baseUrl)
        //        };

        //        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        //        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        //        var tabLines = new StringBuilder();
        //        int lineNo = 1;

        //        foreach (var row in receiptDetails)
        //        {
        //            string lots = "";
        //            string? date = row.ActualDate?.ToString("yyyyMMdd");

        //            if (!string.IsNullOrWhiteSpace(row.LotsJson) && row.LotsJson != "{}")
        //            {
        //                using var doc = JsonDocument.Parse(row.LotsJson);
        //                if (doc.RootElement.TryGetProperty("LOTSJson", out var element))
        //                {
        //                    lots = element.GetString() ?? "";
        //                    lots = lots.Replace("\\n", "\n");
        //                }
        //            }

        //            tabLines.AppendLine($@"
        //                <LIN NUM=""{lineNo}"">
        //                    <FLD NAME=""PONUM"" TYPE=""Char"">{row.POREF}</FLD>
        //                    <FLD NAME=""POLINS"" TYPE=""Integer"">{row.POLINE}</FLD>
        //                    <FLD NAME=""ITMREFS"" TYPE=""Char"">{row.X3_SKU}</FLD>
        //                    <FLD NAME=""QTYS"" TYPE=""Decimal"">{row.X3_Qty}</FLD>
        //                    <FLD NAME=""MFDATS"" TYPE=""Date"">{date}</FLD>
        //                    <FLD NAME=""LOTS"">{lots}</FLD>
        //                </LIN>");
        //            lineNo++;
        //        }

        //        string body = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
        //             xmlns:xsd=""http://www.w3.org/2001/XMLSchema""
        //             xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/""
        //             xmlns:wss=""http://www.adonix.com/WSS"">
        //            <soapenv:Header/>
        //            <soapenv:Body>
        //            <wss:run soapenv:encodingStyle=""http://schemas.xmlsoap.org/soap/encoding/"">
        //            <callContext xsi:type=""wss:CAdxCallContext"">
        //            <codeLang xsi:type=""xsd:string"">ENG</codeLang>
        //            <poolAlias xsi:type=""xsd:string"">{poolAlias}</poolAlias>
        //            <poolId xsi:type=""xsd:string""></poolId>
        //            <requestConfig xsi:type=""xsd:string""><![CDATA[adxwss.trace.on=on]]></requestConfig>
        //            </callContext>
        //            <publicName xsi:type=""xsd:string"">YCREPTHEXT</publicName>
        //            <inputXml xsi:type=""xsd:string""><![CDATA[<PARAM>
        //            <TAB DIM=""30"" ID=""GRP1"" SIZE=""{lineNo - 1}"">
        //            {tabLines.ToString().Trim()}
        //            </TAB>
        //            </PARAM>]]></inputXml>
        //            </wss:run>
        //            </soapenv:Body>
        //            </soapenv:Envelope>
        //        ";

        //        var soapRequest = new HttpRequestMessage(HttpMethod.Post, "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
        //        {
        //            Content = new StringContent(body, Encoding.UTF8, "text/xml")
        //        };

        //        soapRequest.Headers.Add("SOAPAction", "run");

        //        var response = await client.SendAsync(soapRequest);
        //        response.EnsureSuccessStatusCode();

        //        var responseXml = await response.Content.ReadAsStringAsync();
        //        var properties = new
        //        {
        //            request = System.Net.WebUtility.HtmlEncode(body),
        //            response = responseXml
        //        };

        //        await _receiptdashboardrepository.ActivityLog(new ActivityLog
        //        {
        //            log_name = "inbound",
        //            module_id = (int)EnumData.Module.inbound,
        //            sub_module_id = (int)EnumData.SubModule.receipt,
        //            @event = "sync",
        //            user_name = request.UserName,
        //            subject_ref = request.ReceiptCode,
        //            subject_id = request.ReceiptId,
        //            api_action_type = "PO Receipt Export",
        //            description = "PO Receipt Export Process – Sage X3 API",
        //            properties = JsonConvert.SerializeObject(properties)
        //        });

        //        if (response.IsSuccessStatusCode)
        //        {
        //            var exportRequest = new MarkAsExportedRequest
        //            {
        //                UserId = request.UserId,
        //                ReceiptCode = request.ReceiptCode
        //            };

        //            await _receiptdashboardrepository.MarkAsManualExportReceipt(exportRequest);

        //            await _receiptdashboardrepository.ActivityLog(new ActivityLog
        //            {
        //                log_name = "inbound",
        //                module_id = (int)EnumData.Module.inbound,
        //                sub_module_id = (int)EnumData.SubModule.receipt,
        //                @event = "created",
        //                user_name = request.UserName,
        //                subject_ref = request.ReceiptCode,
        //                subject_id = request.ReceiptId,
        //                api_action_type = "PO Receipt Export",
        //                description = "PO Receipt Export",
        //                properties = JsonConvert.SerializeObject(new
        //                {
        //                    data = new
        //                    {
        //                        receiptCode = request.ReceiptCode
        //                    }
        //                })
        //            });

        //            if (triggerInfo.IsEnabled == 0)
        //            {
        //                return new ResponseResult
        //                {
        //                    Error = 0,
        //                    Message = "PO Receipt exported successfully to Sage X3. Email trigger is disabled."
        //                };
        //            }


        //            var templateInfo = await _receiptdashboardrepository
        //                .GetDefaultNotificationTemplateByTriggerId(triggerInfo.TriggerId);

        //            if (templateInfo == null)
        //            {
        //                return new ResponseResult
        //                {
        //                    Error = 1,
        //                    Message = "Notification template not found for event RECEIPT_EXPORTED."
        //                };
        //            }

        //            string subjectTemplate = templateInfo.Subject ?? "";
        //            string bodyTemplateMail = templateInfo.Body ?? "";

        //            string finalSubject = subjectTemplate.Replace("{ReceiptID}", request.ReceiptCode ?? "");
        //            string finalBody = bodyTemplateMail.Replace("{ReceiptID}", request.ReceiptCode ?? "");

        //            var ApiKey = _configuration["SendGrid:ApiKey"];
        //            var sendGridClient = new SendGridClient(ApiKey);

        //            var from = new EmailAddress("mw-no-reply@dynarex.com", "Mantis System");

        //            var adminMsg = new SendGridMessage();
        //            adminMsg.SetFrom(from);
        //            adminMsg.SetSubject(finalSubject);

        //            foreach (var email in primaryEmails
        //                    .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //                    .Select(e => e.Trim())
        //                    .Where(e => !string.IsNullOrWhiteSpace(e)))
        //            {
        //                adminMsg.AddTo(new EmailAddress(email));
        //            }

        //            // SECONDARY → CC
        //            if (!string.IsNullOrWhiteSpace(secondaryEmails))
        //            {
        //                foreach (var email in secondaryEmails
        //                             .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //                             .Select(e => e.Trim())
        //                             .Where(e => !string.IsNullOrWhiteSpace(e)))
        //                {
        //                    adminMsg.AddCc(new EmailAddress(email));
        //                }
        //            }

        //            adminMsg.AddContent(MimeType.Text, finalBody);
        //            adminMsg.AddContent(MimeType.Html, finalBody.Replace(Environment.NewLine, "<br/>"));

        //            var mailResponse = await sendGridClient.SendEmailAsync(adminMsg);
        //            var mailResponseBody = await mailResponse.Body.ReadAsStringAsync();

        //            int statusCode = response != null ? (int)response.StatusCode : 0;
        //            bool isSuccess = statusCode >= 200 && statusCode < 300;

        //            if (!isSuccess)
        //            {
        //                // ERROR LOG
        //                await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
        //                {
        //                    NotificationSettingID = data[0].nst_ID,
        //                    TriggerID = triggerInfo.TriggerId,
        //                    UserID = request.UserId,
        //                    NotificationType = data[0].nst_ModuleName,
        //                    OpertionType = "RECEIPT_EXPORTED",
        //                    Status = "ERROR",
        //                    CreatedBy = request.UserEmail,
        //                    Subject = finalSubject,
        //                    Body = mailResponseBody,
        //                    PrimaryEmail = primaryEmails,
        //                    SecondaryEmail = secondaryEmails
        //                });

        //                return new ResponseResult
        //                {
        //                    Error = 1,
        //                    Message = $"PO Receipt exported to Sage X3, but email failed. Status: {(int)mailResponse.StatusCode}, Response: {mailResponseBody}"
        //                };
        //            }
        //            else
        //            {
        //                // SUCCESS LOG
        //                await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
        //                {
        //                    NotificationSettingID = data[0].nst_ID,
        //                    TriggerID = triggerInfo.TriggerId,
        //                    UserID = request.UserId,
        //                    NotificationType = data[0].nst_ModuleName,
        //                    OpertionType = "RECEIPT_EXPORTED",
        //                    Status = "SENT",
        //                    CreatedBy = request.UserEmail,
        //                    Subject = finalSubject,
        //                    Body = finalBody,
        //                    PrimaryEmail = primaryEmails,
        //                    SecondaryEmail = secondaryEmails
        //                });

        //                return new ResponseResult
        //                {
        //                    Error = 0,
        //                    Message = "PO Receipt exported successfully to Sage X3 and email sent successfully."
        //                };
        //            }
        //        }
        //        else
        //        {
        //            await _receiptdashboardrepository.ActivityLog(new ActivityLog
        //            {
        //                log_name = "inbound",
        //                module_id = (int)EnumData.Module.inbound,
        //                sub_module_id = (int)EnumData.SubModule.receipt,
        //                @event = "error",
        //                user_name = request.UserName,
        //                subject_ref = request.ReceiptCode,
        //                subject_id = request.ReceiptId,
        //                api_action_type = "PO Receipt Export",
        //                description = "PO Receipt Export",
        //                properties = JsonConvert.SerializeObject(new
        //                {
        //                    data = new
        //                    {
        //                        receiptCode = request.ReceiptCode
        //                    }
        //                })
        //            });

        //            return new ResponseResult
        //            {
        //                Error = 1,
        //                Message = "Sage X3 rejected PO Receipt export"
        //            };
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        await _receiptdashboardrepository.ActivityLog(new ActivityLog
        //        {
        //            log_name = "inbound",
        //            module_id = (int)EnumData.Module.inbound,
        //            sub_module_id = (int)EnumData.SubModule.receipt,
        //            @event = "error",
        //            user_name = request.UserName,
        //            subject_ref = request.ReceiptCode,
        //            subject_id = request.ReceiptId,
        //            api_action_type = "PO Receipt Export",
        //            description = "Exception occurred during PO Receipt export",
        //            properties = JsonConvert.SerializeObject(new
        //            {
        //                error = ex.Message,
        //                stackTrace = ex.StackTrace
        //            })
        //        });

        //        return new ResponseResult
        //        {
        //            Error = 1,
        //            Message = ex.Message
        //        };
        //    }
        //}

        public async Task<ResponseResult> CreatePoReceiptLotsInSagex3(CreatePoReceiptLotRequest request)
        {
            try
            {
                var receiptDetails = await _receiptdashboardrepository.GetReceiptExportDetailsLot(request.ReceiptCode);

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
                        description = "No receipt details found for export"
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
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Basic", credentials);

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
                            lots = lots.Replace("\\n", "\n");
                        }
                    }

                    tabLines.AppendLine($@"
                        <LIN NUM=""{lineNo}"">
                            <FLD NAME=""PONUM"">{row.POREF}</FLD>
                            <FLD NAME=""POLINS"">{row.POLINE}</FLD>
                            <FLD NAME=""ITMREFS"">{row.X3_SKU}</FLD>
                            <FLD NAME=""QTYS"">{row.X3_Qty}</FLD>
                            <FLD NAME=""MFDATS"">{date}</FLD>
                            <FLD NAME=""LOTS"">{lots}</FLD>
                        </LIN>");
                    lineNo++;
                }

                string body = $@"<soapenv:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
                    xmlns:xsd=""http://www.w3.org/2001/XMLSchema""
                    xmlns:soapenv=""http://schemas.xmlsoap.org/soap/envelope/""
                    xmlns:wss=""http://www.adonix.com/WSS"">
                    <soapenv:Body>
                    <wss:run>
                    <callContext>
                    <codeLang>ENG</codeLang>
                    <poolAlias>{poolAlias}</poolAlias>
                    </callContext>
                    <publicName>YCREPTHEXT</publicName>
                    <inputXml><![CDATA[
                    <PARAM>
                    <TAB ID=""GRP1"" SIZE=""{lineNo - 1}"">
                    {tabLines.ToString()}
                    </TAB>
                    </PARAM>
                    ]]></inputXml>
                    </wss:run>
                    </soapenv:Body>
                    </soapenv:Envelope>
                ";

                var soapRequest = new HttpRequestMessage(HttpMethod.Post,
                    "/soap-generic/syracuse/collaboration/syracuse/CAdxWebServiceXmlCC")
                {
                    Content = new StringContent(body, Encoding.UTF8, "text/xml")
                };

                soapRequest.Headers.Add("SOAPAction", "run");

                var response = await client.SendAsync(soapRequest);
                var responseXml = await response.Content.ReadAsStringAsync();

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
                    description = "PO Receipt Export API Call",
                    properties = JsonConvert.SerializeObject(new
                    {
                        request = body,
                        response = responseXml
                    })
                });

                // MARK AS EXPORTED
                await _receiptdashboardrepository.MarkAsManualExportReceipt(new MarkAsExportedRequest
                {
                    UserId = request.UserId,
                    ReceiptCode = request.ReceiptCode
                });

                // SUCCESS LOG
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
                    description = "PO Receipt Export Successful"
                });

                // CALL COMMON NOTIFICATION METHOD
                await SendNotificationAsync(
                    entityId: request.ReceiptCode,
                    moduleName: "Receipt Export Notifications",
                    eventName: "RECEIPT_EXPORTED",
                    actionDescription: "PO Receipt Export",
                    templateData: new
                    {
                        ReceiptID = request.ReceiptCode
                    },
                    creatorEmail: null,
                    userEmail: request.UserEmail,
                    userId: request.UserId
                );

                return new ResponseResult
                {
                    Error = 0,
                    Message = "PO Receipt exported successfully to Sage X3 and notification triggered."
                };
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
                    description = ex.Message,
                    //description = "Exception occurred during PO Receipt export",
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

        //public async Task<ReceiptActionResult> UpdateReceiptStatusExecuting(int receiptId, RejectReceiptRequest request)
        //{
        //    try
        //    {
        //        if (request == null)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Reject request is required."
        //            };
        //        }

        //        string receiptCode = request.receiptCode?.ToString() ?? "";

        //        string moduleName = "Receipt Export Notifications";

        //        //  FROM REPO
        //        var data = await _receiptdashboardrepository.GetNotificationSettings(moduleName);

        //        // 1. GET TRIGGER
        //        var triggerInfo = await _receiptdashboardrepository.GetRejectTriggerInfo();

        //        if (triggerInfo == null)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Reject notification trigger configuration not found."
        //            };
        //        }

        //        int triggerId = Convert.ToInt32(triggerInfo.ntg_ID);
        //        int isEnabled = Convert.ToInt32(triggerInfo.ntg_IsEnabled);

        //        string primaryEmails = triggerInfo.nst_Primary_Emails?.ToString() ?? "";
        //        string secondaryEmails = triggerInfo.nst_Secondary_Emails?.ToString() ?? "";

        //        //  PRIMARY EMAIL CHECK
        //        if (string.IsNullOrWhiteSpace(primaryEmails) ||
        //            primaryEmails.Trim().Equals("{creator email}", StringComparison.OrdinalIgnoreCase))
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Primary mail is not present."
        //            };
        //        }

        //        //  EMAIL LIST
        //        var emailList = (primaryEmails + "," + secondaryEmails)
        //            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
        //            .Select(x => x.Trim())
        //            .Where(x => !string.IsNullOrWhiteSpace(x))
        //            .Distinct(StringComparer.OrdinalIgnoreCase)
        //            .ToList();

        //        if (!emailList.Any())
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "No recipient emails found."
        //            };
        //        }

        //        // TEMPLATE FROM REPO
        //        var template = await _receiptdashboardrepository.GetRejectTemplateByTriggerId(triggerId);

        //        if (template == null)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "Reject notification template not found."
        //            };
        //        }

        //        // UPDATE STATUS (AFTER VALIDATION)
        //        var rowsAffected = await _receiptdashboardrepository.UpdateReceiptToExecuting(receiptId);

        //        if (rowsAffected <= 0)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = "No Receipt updated."
        //            };
        //        }

        //        if (isEnabled == 0)
        //        {
        //            return new ReceiptActionResult
        //            {
        //                Success = true,
        //                Message = "Receipt updated successfully. Email trigger is disabled."
        //            };
        //        }

        //        // EMAIL PREPARATION
        //        string subjectTemplate = template.Subject?.ToString() ?? "";
        //        string bodyTemplate = template.Body?.ToString() ?? "";

        //        string rejectReason = request.Reason?.Trim() ?? "";

        //        string finalSubject = subjectTemplate
        //            .Replace("{ReceiptID}", receiptCode);

        //        string finalBody = bodyTemplate
        //            .Replace("\n", "<br>")
        //            .Replace("{ReceiptID}", receiptCode)
        //            .Replace("{Reason}", rejectReason);

        //        var apiKey = _configuration["SendGrid:ApiKey"];
        //        var client = new SendGridClient(apiKey);

        //        var msg = new SendGridMessage();
        //        msg.SetFrom(new EmailAddress("mw-no-reply@dynarex.com", "Mantis System"));
        //        msg.SetSubject(finalSubject);

        //        foreach (var email in primaryEmails.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries))
        //        {
        //            msg.AddTo(new EmailAddress(email.Trim()));
        //        }

        //        foreach (var email in secondaryEmails.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries))
        //        {
        //            msg.AddCc(new EmailAddress(email.Trim()));
        //        }

        //        msg.AddContent(MimeType.Text, finalBody);
        //        msg.AddContent(MimeType.Html, finalBody.Replace(Environment.NewLine, "<br/>"));

        //        var response = await client.SendEmailAsync(msg);
        //        var responseBody = await response.Body.ReadAsStringAsync();

        //        int statusCode = response != null ? (int)response.StatusCode : 0;
        //        bool isSuccess = statusCode >= 200 && statusCode < 300;

        //        if (!isSuccess)
        //        {
        //            await _notificationLogsRepository.CreateNotificationLogs(new CreateNotificationLogRequest
        //            {
        //                NotificationSettingID = data[0].nst_ID,
        //                TriggerID = triggerId,
        //                UserID = request.UserId,
        //                NotificationType = data[0].nst_ModuleName,
        //                OpertionType = "RECEIPT_EXPORT_REJECT",
        //                Status = "ERROR",
        //                CreatedBy = request.UserEmail,
        //                Subject = finalSubject,
        //                Body = responseBody,
        //                PrimaryEmail = primaryEmails,
        //                SecondaryEmail = secondaryEmails
        //            });

        //            return new ReceiptActionResult
        //            {
        //                Success = false,
        //                Message = $"SendGrid email failed. Status: {statusCode}, Response: {responseBody}"
        //            };
        //        }

        //        await _notificationLogsRepository.CreateNotificationLogs(new CreateNotificationLogRequest
        //        {
        //            NotificationSettingID = data[0].nst_ID,
        //            TriggerID = triggerId,
        //            UserID = request.UserId,
        //            NotificationType = data[0].nst_ModuleName,
        //            OpertionType = "RECEIPT_EXPORT_REJECT",
        //            Status = "SENT",
        //            CreatedBy = request.UserEmail,
        //            Subject = finalSubject,
        //            Body = finalBody,
        //            PrimaryEmail = primaryEmails,
        //            SecondaryEmail = secondaryEmails
        //        });

        //        return new ReceiptActionResult
        //        {
        //            Success = true,
        //            Message = "Receipt Status Updated Successfully and reject email sent successfully."
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new ReceiptActionResult
        //        {
        //            Success = false,
        //            Message = "Error while updating receipt status executing | " + ex.Message
        //        };
        //    }
        //}

        public async Task<ReceiptActionResult> UpdateReceiptStatusExecuting(int receiptId, RejectReceiptRequest request)
        {
            try
            {
                if (request == null)
                {
                    return new ReceiptActionResult
                    {
                        Success = false,
                        Message = "Reject request is required."
                    };
                }

                string receiptCode = request.receiptCode?.Trim() ?? "";
                string moduleName = "Receipt Export Notifications";

                // Update status first
                var rowsAffected = await _receiptdashboardrepository.UpdateReceiptToExecuting(receiptId, request);
                if (rowsAffected <= 0)
                {
                    return new ReceiptActionResult
                    {
                        Success = false,
                        Message = "No Receipt updated."
                    };
                }

                // Prepare template data for placeholders
                var templateData = new
                {
                    ReceiptID = receiptCode,
                    Reason = request.Reason?.Trim() ?? "",
                    Date = DateTime.Now.ToString("dd/MM/yyyy hh:mm tt")
                };

                // Call your reusable notification method
                await SendNotificationAsync(
                    entityId: receiptCode,
                    moduleName: moduleName,
                    eventName: "RECEIPT_EXPORT_REJECT",
                    actionDescription: "Receipt rejected",
                    templateData: templateData,
                    creatorEmail: null,                
                    userEmail: request.UserEmail,      
                    userId: request.UserId             
                );

                return new ReceiptActionResult
                {
                    Success = true,
                    Message = "Receipt Status Updated Successfully and reject email sent successfully."
                };
            }
            catch (Exception ex)
            {
                return new ReceiptActionResult
                {
                    Success = false,
                    Message = "Error while updating receipt status executing | " + ex.Message
                };
            }
        }

        private async Task SendNotificationAsync(string entityId,string moduleName,string eventName,string actionDescription,object templateData,string? creatorEmail = null,string? userEmail = null,int userId = 0)
        {
            try
            {
                // Allowed domains
                var allowedDomains = _configuration
                    .GetSection("EmailSettings:AllowedDomains")
                    .Get<List<string>>()?
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim().ToLower())
                    .Distinct()
                    .ToHashSet() ?? new HashSet<string>();

                var senderEmail = _configuration["EmailSettings:SenderEmail"];

                if (!IsValidEmail(senderEmail) || !IsAllowedDomain(senderEmail, allowedDomains))
                {
                    throw new Exception("Sender email is invalid or domain is not allowed.");
                }

                // Get config
                var manualEmail = await _importedOrdersRepository.GetManualEmail(moduleName);
                var emailConfig = manualEmail?.FirstOrDefault();

                // Template
                var template = await _importedOrdersRepository
                    .GetDefaultTemplateByEvent(eventName.ToUpper());

                if (template == null || template.IsEnabled == false)
                    return;

                // Build content
                string finalSubject = BuildEmailBody(template.Subject, templateData);
                string finalBody = BuildEmailBody(template.Body, templateData);

                // Raw emails
                var primaryEmailRaw = string.IsNullOrWhiteSpace(creatorEmail)
                    ? emailConfig?.nst_Primary_Emails
                    : creatorEmail;

                var secondaryEmailRaw = emailConfig?.nst_Secondary_Emails;

                // Parse
                var primaryEmails = ParseEmails(primaryEmailRaw);
                var secondaryEmails = ParseEmails(secondaryEmailRaw);

                // Validate
                var validPrimaryEmails = primaryEmails
                    .Where(e => IsValidEmail(e) && IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var invalidPrimaryEmails = primaryEmails
                    .Where(e => !IsValidEmail(e) || !IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var validSecondaryEmails = secondaryEmails
                    .Where(e => IsValidEmail(e) && IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Where(e => !validPrimaryEmails.Contains(e, StringComparer.OrdinalIgnoreCase))
                    .ToList();

                var invalidSecondaryEmails = secondaryEmails
                    .Where(e => !IsValidEmail(e) || !IsAllowedDomain(e, allowedDomains))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var allValidRecipients = validPrimaryEmails
                    .Concat(validSecondaryEmails)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var allInvalidRecipients = invalidPrimaryEmails
                    .Concat(invalidSecondaryEmails)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                // No valid emails
                if (!allValidRecipients.Any())
                {
                    await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                    {
                        NotificationSettingID = emailConfig?.nst_ID ?? 0,
                        TriggerID = template.TriggerID,
                        UserID = userId,
                        NotificationType = emailConfig?.nst_ModuleName,
                        OpertionType = eventName.ToUpper(),
                        Status = "ERROR",
                        CreatedBy = userEmail ?? "System",
                        Subject = finalSubject,
                        Body = finalBody,
                        PrimaryEmail = null,
                        SecondaryEmail = null,
                        ErrorMessage = $"No valid recipient email found. Invalid/Skipped: {string.Join(", ", allInvalidRecipients)}"
                    });

                    throw new Exception("No valid recipient email found.");
                }

                // SendGrid
                var sendGrid = new SendGridClient(_configuration["SendGrid:ApiKey"]);

                var msg = new SendGridMessage
                {
                    From = new EmailAddress(senderEmail, moduleName),
                    Subject = finalSubject,
                    HtmlContent = finalBody
                };

                foreach (var email in validPrimaryEmails)
                {
                    msg.AddTo(new EmailAddress(email));
                }

                foreach (var email in validSecondaryEmails)
                {
                    msg.AddCc(new EmailAddress(email));
                }

                // Capture MessageId
                var messageId = Guid.NewGuid().ToString();

                msg.CustomArgs = new Dictionary<string, string>
                {
                    { "MessageId", messageId },
                    { "ProjectName", "MW" }
                };

                var response = await sendGrid.SendEmailAsync(msg);

                var finalStatus = allInvalidRecipients.Any() ? "PARTIAL" : "SENT";
                var skippedMsg = allInvalidRecipients.Any()
                    ? $"Skipped invalid emails: {string.Join(", ", allInvalidRecipients)}"
                    : null;

                // Failure
                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Body.ReadAsStringAsync();

                    await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                    {
                        NotificationSettingID = emailConfig?.nst_ID ?? 0,
                        TriggerID = template.TriggerID,
                        UserID = userId,
                        NotificationType = emailConfig?.nst_ModuleName,
                        OpertionType = eventName.ToUpper(),
                        Status = "ERROR",
                        CreatedBy = userEmail ?? "System",
                        Subject = finalSubject,
                        Body = finalBody,
                        PrimaryEmail = string.Join(", ", validPrimaryEmails),
                        SecondaryEmail = string.Join(", ", validSecondaryEmails),
                        ErrorMessage = string.IsNullOrWhiteSpace(skippedMsg)? error : $"{error} | {skippedMsg}",
                        MessageId = messageId
                    });

                    throw new Exception($"Email sending failed: {error}");
                }

                // Success / Partial log
                await _notificationLogsService.CreateNotificationLogs(new CreateNotificationLogRequest
                {
                    NotificationSettingID = emailConfig?.nst_ID ?? 0,
                    TriggerID = template.TriggerID,
                    UserID = userId,
                    NotificationType = emailConfig?.nst_ModuleName,
                    OpertionType = eventName.ToUpper(),
                    Status = finalStatus,
                    CreatedBy = userEmail ?? "System",
                    Subject = finalSubject,
                    Body = finalBody,
                    PrimaryEmail = string.Join(", ", validPrimaryEmails),
                    SecondaryEmail = string.Join(", ", validSecondaryEmails),
                    ErrorMessage = skippedMsg,
                    MessageId = messageId
                });
            }
            catch
            {
                throw; // preserve stack trace
            }
        }

        private static List<string> ParseEmails(string? emails)
        {
            if (string.IsNullOrWhiteSpace(emails))
                return new List<string>();

            return emails
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();
        }

        private static bool IsAllowedDomain(string? email, HashSet<string> allowedDomains)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var parts = email.Split('@');
            if (parts.Length != 2) return false;

            return allowedDomains.Contains(parts[1].Trim().ToLower());
        }

        private static bool IsValidEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var addr = new MailAddress(email);
                return addr.Address.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private string BuildEmailBody(string templateBody, object data)
        {
            if (string.IsNullOrWhiteSpace(templateBody))
                return string.Empty;

            var properties = data.GetType().GetProperties();

            foreach (var prop in properties)
            {
                var key = prop.Name;
                var value = prop.GetValue(data)?.ToString() ?? "";

                templateBody = templateBody.Replace($"{{{key}}}", value);
            }

            return templateBody.Replace("\n", "<br>");
        }
    }
}
