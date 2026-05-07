import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}user/`;

export const UserSettingService = {
    getUsersGrid(data = []) {
        return fetchWrapper.post(`${baseUrl}get-users`, data).then((data));
    },
    getUserDetail(id, data = []) {
        return fetchWrapper.post(`${baseUrl}get-user/${id}`, data).then((data));
    },
    addUser(data = []) {
        return fetchWrapper.post(`${baseUrl}add-user`, data).then((data));
    },
    updateUser(id, data = []) {
        return fetchWrapper.post(`${baseUrl}update-user/${id}`, data).then((data));
    },

    getMantisUsers(data = []) {
        return fetchWrapper.post(`${baseUrl}get-mantis-users`, data).then((data));
    },
    getAllUsers(data = []) {
        return fetchWrapper.get(`${baseUrl}get-all-users`).then((data));
    },
    deactivateUser(id, reason) {
        return fetchWrapper.post(
            `${baseUrl}deactivate-user?id=${id}&Deactivate_reason=${encodeURIComponent(reason)}`
        );
    },
    deleteUser(id) {
        return fetchWrapper.post(`${baseUrl}delete-user`, id);
    }
};
