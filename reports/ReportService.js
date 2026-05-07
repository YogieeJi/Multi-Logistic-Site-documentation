import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}Reports/`;

export const ReportService = {
    getReports(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-reports`, data ).then((data));
    },
    exportReport(id, data={}) {
        return fetchWrapper.post(`${baseUrl}export-report/${id}`, data ).then((data));
    },
    viewReport(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}view-report/${id}`, data ).then((data));
    },

    getReportFilter(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-report-filter/${id}`, data ).then((data));
    },

};
