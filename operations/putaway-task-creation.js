import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const PutawayTaskCreationService = {
    getLotDetails(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-putaway-lot-details`, data ).then((data));
    },
    createTask(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-putaway-task`, data ).then((data));
    },
};
