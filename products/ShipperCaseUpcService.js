import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ShipperCaseUpcService = {
    searchUpc(data=[]) {
        return fetchWrapper.post(`${baseUrl}shipper-case-upc/search`, data ).then((data));
    },
};
