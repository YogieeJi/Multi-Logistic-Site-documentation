import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}role/`;

export const RoleSettingService = {
    getRolesGrid(data = []) {
        return fetchWrapper.post(`${baseUrl}get-roles`, data).then((data));
    },
    getRoleDetail(id, data = []) {
        return fetchWrapper.post(`${baseUrl}get-role/${id}`, data).then((data));
    },
    addRole(data = []) {
        return fetchWrapper.post(`${baseUrl}add-role`, data).then((data));
    },
    updateRole(id, data = []) {
        return fetchWrapper.post(`${baseUrl}update-role/${id}`, data).then((data));
    },
    roleLookup(id, data = []) {
        return fetchWrapper.post(`${baseUrl}role-lookup`, data).then((data));
    },
    operationdomainLookup(id, data = []) {
        return fetchWrapper.post(`${baseUrl}operationdomain-lookup`, data).then((data));
    },
    mantisuserlookup(id, data = []) {
        return fetchWrapper.post(`${baseUrl}mantisuser-lookup`, data).then((data));
    },
    logisticSitelookup(id, data = []) {
        return fetchWrapper.post(`${baseUrl}logisticsite-lookup`, data).then((data));
    },
    getModuleHierarchy(data = []) {
        return fetchWrapper.post(`${baseUrl}master-data`).then((data));
    },
    getUserLogisticSites(userId, data = []) {
        return fetchWrapper.post(`${baseUrl}get-mantisuser-site/${userId}`).then((data));
    },
    getUsersByRole(userId, data = []) {
        return fetchWrapper.post(`${baseUrl}get-roleassigned-users/${userId}`).then((data));
    },
    roleLookupwi(userId, data = []) {
        return fetchWrapper.post(`${baseUrl}role-lookupwi/${userId}`, data).then((data));
    },
    reassignUsers(data) {
        return fetchWrapper.post(`${baseUrl}reassign-users`, data).then((data));
    },

    // ✅ NEW: Deactivate Role API
    deactivateRole(roleId) {
        return fetchWrapper.post(`${baseUrl}deactivate-role/${roleId}`);
    },

    activateRole(roleId) {
        return fetchWrapper.post(`${baseUrl}activate-role/${roleId}`);
    },
    deleteRole(roleId) {
        return fetchWrapper.post(`${baseUrl}delete-role/${roleId}`);
    }
};
