import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}manageTrucks/`;
const baseUrl1 = `${import.meta.env.VITE_API_URL}user/`;

export const ManageTrucksService = {
    getTrucksGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-trucks`, data).then((data));
    },
    addTruck(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-truck`, data ).then((data));
    },
    updateStatus(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-truck-status`, data).then((data));
    },
    getTruckShipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-truck-shipment`, data).then((data));
    },
    getShipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-shipment-list`, data).then((data));
    },
     getMantisAllUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl1}get-mantis-all-users`, data).then((data));
    },
     getUserCategories(data=[]) {
        return fetchWrapper.post(`${baseUrl1}user-categories`, data).then((data));
    },
      getEmployees(data=[]) {
        return fetchWrapper.post(`${baseUrl1}employee-groups`, data).then((data));
    },
    getLogisticSites(data=[]) {
        return fetchWrapper.post(`${baseUrl1}logistic-sites`, data).then((data));
    },
    CreateMantisUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl1}create-mantis-users`, data).then((data));
    }
};
