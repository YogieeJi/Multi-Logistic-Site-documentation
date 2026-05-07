import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}itemConversion/`;

export const ItemConversionService = {
    getItemsGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-item-conversions`, data ).then((data));
    },
    addItem(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-item-conversion`, data ).then((data));
    },
    getItemDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-item-conversion/${id}`, data ).then((data));
    },
    updateItem(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-item-conversion/${id}`, data ).then((data));
    },
    uploadItems(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-item-conversion`, data ).then((data));  
    },

    deleteItem(data=[]) {
        return fetchWrapper.post(`${baseUrl}delete-item-conversion`, data ).then((data));
    },
    getUOMList(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-uoms`, data).then((data));
    },


};
