import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}Stock/`;

export const Customer = {
    getCustomerAttributes(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-customer-attributes`, data ).then((data));
    },
    getOrderTypes(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-Order-Type`).then((data));
    },
    insertCustomerAttribute(data=[]) {
        return fetchWrapper.post(`${baseUrl}insert-customer-attribute`, data ).then((data));
    },
};