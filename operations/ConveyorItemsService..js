import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ConveyorItemsService = {
    loadItems(data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-items/load-items`, data ).then((data));
    },
    assignItem(data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-items/assign-items`, data ).then((data));
    },
    
};
