import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}notificationSettings/`;

export const NotificationService = {
    getNotificationSettings(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-notification-settings`, data).then((data));
    },

    updateNotificationSettings(data=[]) {
        return fetchWrapper.post(`${baseUrl}updated-notification`, data ).then((data));
    },
};