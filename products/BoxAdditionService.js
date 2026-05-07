import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const BoxAdditionService = {
    addBoxAddition(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-box-addition`, data ).then((data));
    },
    updateBoxAddition(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-box-addition/${id}`, data ).then((data));
    },
    getBoxAdditionGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-box-addition`, data ).then((data));
    },
    getBoxAdditionDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-box-addition/`+id ).then((data));  
    },
    uploadBoxAdditions(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-box-additions`, data ).then((data));  
    },
};
