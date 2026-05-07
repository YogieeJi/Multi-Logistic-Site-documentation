import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const PendingReceiptService = {
    getPendingReceiptList(data=[]) {
        return fetchWrapper.post(`${baseUrl}pending-receipts/get-list`, data ).then((data));
    },
    generatePlan(data=[]) {
        return fetchWrapper.post(`${baseUrl}pending-receipts/generate-plan`, data ).then((data));
    },


};
