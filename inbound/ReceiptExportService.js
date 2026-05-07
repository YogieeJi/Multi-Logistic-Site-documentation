import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}receiptExport/`;

export const ReceiptExportService = {
    getReceiptExportGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-export`, data ).then((data));  
    },
    getReceiptExportById(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-export/`+id ).then((data));
    },

    getReceiptExportDetails(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-export-detail/`+id, data ).then((data));  
    },
    getReceiptExportDetailsLot(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-export-detail-lot/`+id, data ).then((data));  
    },
    createPOReceiptLots(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-po-receipt-lots`,data).then((data));
    },
    markAsManualExportReceipt(data=[]) {
        return fetchWrapper.post(`${baseUrl}mark-as-manual-export-receipt`,data).then((data));
    },
};
