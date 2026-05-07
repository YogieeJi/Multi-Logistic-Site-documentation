// import { fetchWrapper } from "../../helpers";

// const baseUrl = `${import.meta.env.VITE_API_URL}conveyor/`;

// export const ConveyorLanesService = {
//     addLane(data=[]) {
//         return fetchWrapper.post(`${baseUrl}add-conveyor-lanes`, data ).then((data));
//     },
//     getLaneGrid(data=[]) {
//         return fetchWrapper.post(`${baseUrl}get-conveyor-lanes`, data ).then((data));
//     },
//     getLaneDetail(id, data=[]) {
//         return fetchWrapper.post(`${baseUrl}get-conveyor-lanes/${id}`, data ).then((data));
//     },
//     updateLane(id, data=[]) {
//         return fetchWrapper.post(`${baseUrl}update-conveyor-lanes/${id}`, data ).then((data));
//     },
    
//     getSettingLanegrid(data=[]) {
//         return fetchWrapper.post(`${baseUrl}conveyor-setting/getLane`, data ).then((data));
//     },
//     getCreateLane(data=[]) {
//         return fetchWrapper.post(`${baseUrl}conveyor-setting/createLane`, data ).then((data));
//     },
//     deleteLane(id, data=[]) {
//         return fetchWrapper.post(`${baseUrl}conveyor-setting/delete/${id}`, data ).then((data));
//     },
//     EditLane(id, data=[]) {
//         return fetchWrapper.post(`${baseUrl}conveyor-setting/editLane/${id}`, data ).then((data));
//     },
//     getLaneByName(id, data=[]) {
//         return fetchWrapper.post(`${baseUrl}conveyor-setting/getLaneByName/${id}`, data ).then((data));
//     },

// };
import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}conveyor/`;

export const ConveyorLanesService = {
    addLane(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-conveyor-lanes`, data ).then((data));
    },
    getLaneGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-conveyor-lanes`, data ).then((data));
    },
    getLaneDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-conveyor-lanes/${id}`, data ).then((data));
    },
    updateLane(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-conveyor-lanes/${id}`, data ).then((data));
    },
    
    getSettingLanegrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-setting/getLane`, data ).then((data));
    },
    getCreateLane(data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-setting/createLane`, data ).then((data));
    },
    deleteLane(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-setting/delete/${id}`, data ).then((data));
    },
    EditLane(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-setting/editLane/${id}`, data ).then((data));
    },
    getLaneByName(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}conveyor-setting/getLaneByName/${id}`, data ).then((data));
    },
    getSlotByLaneType(data=[]) {
        return fetchWrapper.get(`${baseUrl}order-slot`).then((data));
    },
    getOrders(data=[]) {
        return fetchWrapper.get(`${baseUrl}order-ship`).then((data));
    },
    addOrderSlot(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-order-ship`, data ).then((data));
    },
    getOrderSLot(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-order-slot`, data ).then((data));
    },
    getOrderSlotById(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-order-slot/${id}`, data ).then((data));
    },
    updateOrderSlot( data=[]) {
        return fetchWrapper.post(`${baseUrl}update-order-slot`, data ).then((data));
    },
    deleteOrderSlot(data=[]) {
        return fetchWrapper.post(`${baseUrl}delete-order-slot`, data ).then((data));
    },
};

