import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const UnexpectedItemService = {
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-unexpected-item`, data ).then((data));
    },
    getDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-unexpected-item/`+id ).then((data));  
    },
};
