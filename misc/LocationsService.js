import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}location/`;

export const LocationsService = {
    getShippingLocations(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-shipping-locations/lookup`, data ).then((data));
    },
    getLanes(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-lanes/lookup`, data ).then((data));
    },
    getLookups(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-shipment-lcoation-lookups`).then((data));
    },
    getShipmentLocationsGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-shipment-lcoations`, data ).then((data));
    },
    getDetail(code, data=[]) {
        return fetchWrapper.get(`${baseUrl}get-shipment-lcoation-detail/`+code).then((data));
    },
    createUpdateLocation(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-update-shipment-lcoation`,data).then((data));
    },
    getMantisLocations(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-mantis-locations`, data ).then((data));
    },
    deleteShipmentLocation(code, data=[]) {
        return fetchWrapper.post(`${baseUrl}delete-shipment-location/`+code).then((data));
    },
    
};
