import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ReceiptsService = {
    getReceiptsGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipts`, data ).then((data));
    },

    getReceiptDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipts/`+id ).then((data));  
    },

    getReceiptLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-lines/`+id, data ).then((data));  
    },

    syncData(data=[]) {
        return fetchWrapper.post(`${baseUrl}sync-receipts`).then((data));  
    },
    getReceiptReportGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}receipts`,data).then((data));  
    },
    getReceiptDetailGrid(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}receipt-detail/`+id, data ).then((data));  
    },
};
