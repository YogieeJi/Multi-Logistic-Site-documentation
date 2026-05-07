import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const CountService = {
    getUser() {
        return fetchWrapper.get(`${baseUrl}GetUsers`).then();
    },
    getAllCount(data=[]) {
        return fetchWrapper.post(`${baseUrl}getAllCountHeaders`,data).then();
    },

    CreateCount(data=[]) {
        return fetchWrapper.post(`${baseUrl}createCount`,data).then((data));  
    },
    CreateSecondCount(data=[]) {
        return fetchWrapper.post(`${baseUrl}getCountCondition`,data).then((data));  
    },
    getSecondUser(data=[]) {
        return fetchWrapper.post(`${baseUrl}getSecondUser`,data).then((data));  
    },
    UpdateAssignTo(data=[]) {
        return fetchWrapper.post(`${baseUrl}updateAssignTo`,data).then((data));  
    },


};
