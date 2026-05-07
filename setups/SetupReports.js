import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}Setup/`;

export const SetupReportsService = {
    getReportsGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-dynamic-reports`, data ).then((data));
    },
    addReport(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-dynamic-report`, data ).then((data));
    },
    getReportDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-dynamic-report/${id}`, data ).then((data));
    },
    updateReport(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-dynamic-report/${id}`, data ).then((data));
    },

};
