import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const ActivityLog = {
    getConveyorLogs(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-Conveyor-logs`, data ).then((data));
    },
   
};
