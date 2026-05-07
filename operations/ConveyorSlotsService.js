import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}Conveyor/`;

export const ConveyorSlotsService = {
    
    addSlot(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-conveyor-slots`, data ).then((data));
    },
    getSlotGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-conveyor-slots`, data ).then((data));
    },
    getSlotDetail(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}get-conveyor-slots/${id}`, data ).then((data));
    },
    updateSlot(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-conveyor-slots/${id}`, data ).then((data));
    },
    getFormObj(id, data=[]) {
        return fetchWrapper.get(`${baseUrl}location-form-obj`).then((data));
    },
};
