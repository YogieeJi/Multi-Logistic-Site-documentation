import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const PTLControllerService = {
    add(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-ptl-controller`, data ).then((data));
    },
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-ptl-controller`, data ).then((data));
    },
    getDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-ptl-controller/${id}`, data ).then((data));
    },
    remove(data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-ptl-controller`, data ).then((data));
    },
    update(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-ptl-controller/${id}`, data ).then((data));
    },
};
