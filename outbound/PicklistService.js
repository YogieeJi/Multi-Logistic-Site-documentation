import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const PicklistService = {
    getPicklistGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-picklist`, data ).then((data));
    },

    getPicklistDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-picklist/`+id ).then((data));  
    },

    getPicklistLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-picklist-lines/`+id, data ).then((data));  
    },

    syncData(data=[]) {
        return fetchWrapper.post(`${baseUrl}sync-picklist`).then((data));  
    },

    uploadData(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-picklist`,data).then((data));  
    },  

};
