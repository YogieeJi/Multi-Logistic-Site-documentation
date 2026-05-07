import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}itemStock/`;

export const ItemsStockService = {
    ItemStock(data=[]) {
        return fetchWrapper.post(`${baseUrl}item-stock`, data ).then((data));
    },
     getStockReserveReasons(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-stock-reservereasons`).then((data));
    },
    addReservationReason(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-reservation-reason`, data ).then((data));
    },
    removeReservationReason(data=[]) {
        return fetchWrapper.post(`${baseUrl}remove-reservation-reason`, data ).then((data));
    },
};
