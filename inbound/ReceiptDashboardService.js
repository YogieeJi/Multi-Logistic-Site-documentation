import { fetchWrapper } from "../../helpers";


const baseUrl = `${import.meta.env.VITE_API_URL}ReceiptDashboard/`;

export const ReceiptsDashboardService = {
    getReceiptDropdown(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-receipt-dropdown` ).then((data));
    },

    getReceiptDetails(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-detail/`+id, data ).then((data));  
    },
    getReceiptDetailsLot(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-detail-lot/`+id, data ).then((data));  
    },
    getPDF(id) {
        return fetchWrapper.getPDF(`${baseUrl}generate-PDF/`+id );  
    },
     getTransferPDF(id) {
        return fetchWrapper.getPDF(`${baseUrl}generate-transfer-PDF/`+id );  
    },
    //Old Api Calls
    getReceiptDetailsOld(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-detail-old/`+id, data ).then((data));  
    },
    getReceiptDetailsLotOld(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-detail-lot-old/`+id, data ).then((data));  
    },
    getPDFOld(id) {
        return fetchWrapper.getPDF(`${baseUrl}generate-PDF-old/`+id );  
    },
    getInExecutionReceipts(data) {
        return fetchWrapper.post(`${baseUrl}get-receipt-inexecution`, data);
    },
    getAllReceipts(data) {
        return fetchWrapper.post(`${baseUrl}get-all-receipt`, data);
    },
    getReceiptDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-details/`+id, data ).then((data));
    },
    getReceiptById(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-code/`+id ).then((data));
    },
    getReceiptDetailsLots(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-details-lot/`+id, data ).then((data));  
    },
    getDiscrepancyItemsOnly(id) {
    return fetchWrapper.post(`${baseUrl}get-discrepancy-items-only/` + id);
    },
    updateReceiptStatus(id,data=[]){
    return fetchWrapper.post(`${baseUrl}update-receipt-status/`+id,data); 
    },
    getReadyToProcessReceipts(data=[]){
    return fetchWrapper.post(`${baseUrl}get-ready-to-process-receipts`,data).then((data)); 
    },
    getAllAccountingReceipts(data=[]){
    return fetchWrapper.post(`${baseUrl}get-all-receipts`,data).then((data)); 
    },
    getDiscrepancyItemsWithPo(id,data=[]){
    return fetchWrapper.post(`${baseUrl}get-discrepancy-items-by-po/`+id,data).then((data)); 
    },
    getDiscrepancyItemsWithLot(id,data=[]){
    return fetchWrapper.post(`${baseUrl}get-discrepancy-items-by-lot/`+id,data).then((data)); 
    },
    rejectReceipt(id, data = {}) {
    return fetchWrapper.post(`${baseUrl}update-receipt-status-executing/${id}`, data).then((data) => data)
    },
    exportReceiptToX3(data = {}) {
    return fetchWrapper.post(`${baseUrl}create-po-receipt-lots-x3`, data).then((data) => data)
    },
};
