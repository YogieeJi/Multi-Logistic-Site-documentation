import { fetchWrapper } from "../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}user/`;

export const ColorMappingService = {
    
    getMappedUSers(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-mapped-users`, data ).then((data));
    },
    addColorUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-color-user`, data ).then((data));
    },
    updateColorUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-color-user`, data ).then((data));
    },
    removeColorUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-color-user`, data ).then((data));
    }, 
};
