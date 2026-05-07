import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const TransfersService = {
    getTransfersGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-transfers`, data ).then((data));
    },

    getTransferDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-transfers/`+id ).then((data));   
    },

    getTransferLines(id,data=[]) {
        
        return fetchWrapper.post(`${baseUrl}get-transfer-lines/`+id, data).then((data));  
    },

    syncData(data=[]) {
        return fetchWrapper.post(`${baseUrl}sync-transfersList`).then((data));  
    },
    updateImportReadyItems(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-transfer-import-ready`).then((data));  
    },
};
