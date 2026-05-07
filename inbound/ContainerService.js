import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ContainersService = {
    getContainersGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-containers`, data ).then((data));
    },

    getContainerDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-containers/`+id ).then((data));  
    },

    getContainerLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-container-lines/`+id, data ).then((data));  
    },

    syncData(data=[]) {
        return fetchWrapper.post(`${baseUrl}sync-containers`).then((data));  
    },

};
