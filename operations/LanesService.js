import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}LANES/`;

export const LanesService = {
    freeLanes(data=[]) {
        return fetchWrapper.post(`${baseUrl}free-occupied-zones`, data ).then((data));
    },
    getOccupiedLanesGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-occupied-zones`, data ).then((data));
    },
};
