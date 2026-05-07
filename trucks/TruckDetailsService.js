import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}truck/`;

export const TruckDetailsService = {
    getTruckList(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-truck-list`, data ).then((data));
    },
    getTruckDetail(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-truck-detail`, data ).then((data));
    },
    getAllTrucksDetails(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-all-trucks-details`, data ).then((data));
    },
};