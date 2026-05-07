import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}Lanes/`;

export const LanesSetupService = {
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-lanes`, data ).then((data));
    },
    add(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-lane`, data ).then((data));
    },
    getDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-lane/${id}`, data ).then((data));
    },
    update(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-lane/${id}`, data ).then((data));
    },
    addUserToLane(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-user-lane`, data ).then((data));
    },
    getUserToLane(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-user-lane`, data ).then((data));
    },
    removeUserToLane(data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-user-lane`, data ).then((data));
    },
    
};
