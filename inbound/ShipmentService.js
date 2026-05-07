import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}asn/`;
const baseUrl1 = `${import.meta.env.VITE_API_URL}containerDetail/`;

export const ShipmentsService = {
    
    getShipmentsGrid(data=[]) { 
        return fetchWrapper.post(`${baseUrl}get-shipments`, data ).then((data));
    },

    getShipmentDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-shipments/`+id ).then((data));  
    },

    getShipmentLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-shipment-lines/`+id, data ).then((data));  
    },

    syncData(data=[]) {
        return fetchWrapper.post(`${baseUrl}sync-shipments`).then((data));  
    },

    reValidateItems(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}revalidate-shipment-items/`+id ).then((data));  
    },
    reValidateConveyAbleItems(id,data=[]) {
        return fetchWrapper.get(`${baseUrl}revalidate-conveyable-items/`+id ).then((data));  
    },
    updateImportReadyItems(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-shipments-import-ready`, data ).then((data));  
    },
     getItemAttributes(code,data=[]) {
        return fetchWrapper.get(`${baseUrl}get-item-attributes/`+code ).then((data));  
    },
     updateItemAttributes(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-item-attributes`, data ).then((data));  
    },
     getshipmentlinesPDF(id) {
        return fetchWrapper.getPDF(`${baseUrl}shipment-lines/`+id );  
    },
     getcontainerlinesPDF(id) {
        return fetchWrapper.getPDF(`${baseUrl1}container-lines/`+id );  
    },
};
