import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const DeliveryService = {
    getDeliveryGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-delivery`, data ).then((data));
    },

    getDeliveryDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-delivery/`+id ).then((data));  
    },

    getDeliveryLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-delivery-lines/`+id, data ).then((data));  
    },

    syncData(data=[]) {
        return fetchWrapper.post(`${baseUrl}sync-delivery`).then((data));  
    },

};
