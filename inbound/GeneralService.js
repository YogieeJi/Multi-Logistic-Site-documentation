import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}activityLog/`;

export const GeneralService = {
    getLogs(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-targeted-logs`, data ).then((data));
    },
    getLogsfororders(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-targeted-logs-for-orders`, data ).then((data));
    },
    getInboundLogs(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-inbound-logs`, data ).then((data));
    },
     archiveActivityLogs(data=[]) {
        return fetchWrapper.get(`${baseUrl}archive-activity-logs`).then((data));
    }
};
