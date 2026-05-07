import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const FileUploadCall = {
    uploadFile(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-files`, data ).then((data));
    },

    getFileUploadGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-files`, data ).then((data));
    },
};
