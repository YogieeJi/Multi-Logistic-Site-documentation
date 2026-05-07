import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}employeeToColor/`;

export const EmployeeColorService = {
    add(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-employee-color`, data ).then((data));
    },
    getGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-employee-color`, data ).then((data));
    },
    getDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-employee-color/${id}`, data ).then((data));
    },
    update(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-employee-color/${id}`, data ).then((data));
    },
    mantisEmployeesLookup(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}mantis-employees-lookup/${id}`, data ).then((data));
    },
    mantisAllEmployeesLookup(data=[]) {
        return fetchWrapper.get(`${baseUrl}mantis-all-employees-lookup`).then((data));
    },
};
