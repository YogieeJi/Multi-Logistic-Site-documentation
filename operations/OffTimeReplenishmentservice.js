import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const OfftimeReplenishment = {
    GetOffTimeReplenishment(data=[]) {
        return fetchWrapper.post(`${baseUrl}off-time-replenishment`, data ).then((data));
    },

    CreateOffTimeReplenishment(data=[]) {
           return fetchWrapper.post(`${baseUrl}create-off-time-replenishment`,data).then();
    },

    DeleteOffTimeReplenishment(tsk_ID) {
        return fetchWrapper.post(`${baseUrl}delete-off-time-replenishment/${tsk_ID}`);
    },
    MultipleDeleteGetOffTimeReplenishment(data=[]) {
        return fetchWrapper.post(`${baseUrl}multiple-delete-off-time-replenishment`, data ).then((data));
    },
};
