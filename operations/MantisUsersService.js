import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}user/`;

export const MantisUsersService = {
    getUserTypesLookup(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-user-types-lookups`).then((data));
    },
    getMantisUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl}mantis-users`, data ).then((data));
    },
    updateMantisUsersPath(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-mantis-user-path`, data ).then((data));
    },
   
    getUserTypes(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-user-types`, data ).then((data));
    },
    createUserTypes(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-user-types`, data ).then((data));
    },
    editUserTypes(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}edit-user-types/`+id, data ).then((data));
    },
    updateUserTypes(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}update-user-types/`+id, data ).then((data));
    },
    deleteUserTypes(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}delete-user-types/`+id, data ).then((data));
    },


};
