import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}orderReallocation/`;

export const OrdersReAllocateService = {
    getOrdersGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-Orders`, data ).then((data));
    },
    getOrderShipItems(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-Order-Ship-Items`, data ).then((data));
    },
    orderReallocation(data=[]) {
        return fetchWrapper.post(`${baseUrl}order-Reallocation`, data ).then((data));
    },

    getStockDetails(id,data=[]) {
        return fetchWrapper.get(`${baseUrl}get-Order-Ship-Items/`+id ).then((data));  
    },

    
    getOrdersList(data=[]){
        return fetchWrapper.get(`${baseUrl}get-orders-list`).then((data));
    },

};
