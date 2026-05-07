import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}zones/`;

export const ZoneService = {
    addZone(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-zone`, data ).then((data));
    },
    lookup(data=[]) {
        return fetchWrapper.post(`${baseUrl}zones/lookup`, data ).then((data));
    },
    getZoneGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zones`, data ).then((data));
    },
    getZoneDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zone/${id}`, data ).then((data));
    },
    updateZone(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-zone/${id}`, data ).then((data));
    },

    getItemGrid(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zone-items/${id}`, data ).then((data));
    },
    addItem(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}add-zone-items/${id}`, data ).then((data));
    },
    removeItem(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-zone-items/${id}`, data ).then((data));
    },

    getLocationGrid(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zone-locations/${id}`, data ).then((data));
    },

    getUniversalZoneItemGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zone-universal-items/grid`, data ).then((data));
    },
    getStockZoneItemGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zone-stock-items/grid`, data ).then((data));
    },

    getStorageMappingGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zones-storage-mapping/grid`, data ).then((data));
    },
    storageMappinglookup(data=[]) {
        return fetchWrapper.post(`${baseUrl}zones-storage-mapping/lookup`, data ).then((data));
    },
    addStorageMapping(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-zones-storage-mapping`, data ).then((data));
    },
    updateStorageMapping(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-zones-storage-mapping/${id}`, data ).then((data));
    },
    getStorageMappingDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-zones-storage-mapping/${id}`, data ).then((data));
    },
    removeStorageMapping(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-zones-storage-mapping/${id}`, data ).then((data));
    },
};
