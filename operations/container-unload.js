import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ContainerUnloadService = {
    getReceiptCodes(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-receipt-codes`, data ).then((data));
    },

  

};
