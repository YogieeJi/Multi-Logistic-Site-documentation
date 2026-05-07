import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}notificationLogs/`;

export const NotificationService = {
    getNotificationLogs(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-notification-logs`, data).then((data));
    },

    createNotificationSettings(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-notification-logs`, data ).then((data));
    },
};