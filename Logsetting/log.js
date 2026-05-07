import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const Log = {
    getAllLogSettings(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-log-setting`).then((data));
    },
   
    updateLogStatus(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-log-status`, data ).then((data));
    },
};
