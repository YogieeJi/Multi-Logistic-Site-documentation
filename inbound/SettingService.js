import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}setting/`;

export const SettingService = {
    getSchedulers(data=[]) {
        return fetchWrapper.post(`${baseUrl}settings/schedulers/get`, data ).then((data));
    },

    setSchedulers(data=[]) {
        return fetchWrapper.post(`${baseUrl}settings/schedulers/set`, data ).then((data));
    },
};
