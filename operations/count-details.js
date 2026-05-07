import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const CountDetails = {
    getCount(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-count`, data ).then((data));
    },
    markSystemAdjustment(data=[]) {
        return fetchWrapper.post(`${baseUrl}mark-count-system-adjustment`, data ).then((data));
    },
    markManualAdjustment(data=[]) {
        return fetchWrapper.post(`${baseUrl}mark-count-manual-adjustment`, data ).then((data));
    },


};
