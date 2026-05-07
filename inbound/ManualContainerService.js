import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}containerDetail/`;
const baseUrl1 = `${import.meta.env.VITE_API_URL}asn/`;

export const ManualContainersService = {
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-manual-containers`, data ).then((data));
    },

    getDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-manual-containers/`+id ).then((data));  
    },

    getLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-manual-container-lines/`+id, data ).then((data));  
    },
     uploadData(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-manual-containers`,data).then((data));  
    },  
    reValidateItems(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}revalidate-container-items/`+id ).then((data));  
    },
    reValidateConveyAbleItems(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}revalidate-container-conveyable-items/`+id ).then((data));  
    },
    updateImportReadyItems(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-container-import-ready`, data ).then((data));  
    },
    syncData(data=[]) {
        return fetchWrapper.get(`${baseUrl}sync-intersite-transfer`).then((data));  
    },
     deleteContainers(data=[]) {
        return fetchWrapper.post(`${baseUrl}delete-containers`, data).then((data));  

    },
    MarkReceiptComplete(data=[]) {
        return fetchWrapper.post(`${baseUrl}Mark-Receipt-Complete`,data ).then((data));  
    },
     removeReservation(data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-reservation`, data ).then((data));  
    },
     createShipmentDetail(data=[]) {
        return fetchWrapper.post(`${baseUrl1}create-shipment-detail`,data ).then((data));  
    },
    createContainerDetail(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-container-detail`,data ).then((data));  
    }
};
