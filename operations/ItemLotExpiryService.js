import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}itemLotExpiry/`;

export const ItemLotExpiryService = {
    add(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-item-lot-exp`, data ).then((data));
    },
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-item-lot-exp`, data ).then((data));
    },
    getDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-item-lot-exp/${id}`, data ).then((data));
    },
    update(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-item-lot-exp/${id}`, data ).then((data));
    },

};
