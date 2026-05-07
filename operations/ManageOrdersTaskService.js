import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ManageOrdersTaskService = {
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}orders`, data ).then((data));
    },
    deleteTask(data=[]) {
        return fetchWrapper.post(`${baseUrl}order/delete`, data ).then((data));
    }
};
