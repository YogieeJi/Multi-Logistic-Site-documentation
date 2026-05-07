import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}FailedJobs/`;

export const FailJobs = {
    getFailJobs(data=[]) {
        return fetchWrapper.post(`${baseUrl}failed-jobs`, data ).then((data));
    },
    retryFailJobs(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}failed-jobs/retry/${id}`, data ).then((data));
    },
    deleteFailJobs(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}failed-jobs/delete/${id}`, data ).then((data));
    },
   
};
