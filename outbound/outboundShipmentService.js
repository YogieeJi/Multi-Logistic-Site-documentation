import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}outboundShipment/`;

export const outboundShipmentService = {
    getTrucksGrid(data=[]) {
        return fetchWrapper.get(`${baseUrl}trucks`).then((data));
    },
    getTrucksById(id,data=[]) {
        return fetchWrapper.get(`${baseUrl}truck-id/`+id ).then((data));
    },
    addShipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-shipment`, data ).then((data));
    },
    updateShipment(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}update-shipment/`+id, data ).then((data));
    },

    getOrdersGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}order-shipments`, data ).then((data));
    },

    getTruckslocation(data=[]) {
        return fetchWrapper.get(`${baseUrl}trucks-location`).then((data));
    },

    getshipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipments`, data ).then((data));
    },
    deleteShipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipments/delete`, data ).then((data));
    },
    deleteOrderShipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipments-order/delete`, data ).then((data));
    },
    releaseLocation(data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipments-order/release-locations`, data ).then((data));
    },
    
    getShipmentDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipment-detail/`+id, data ).then((data));
    },
    getShipmentDetailTruck(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipment-detailTruck/`+id, data ).then((data));
    },
    getShipmentEdit(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipments/edit/`+id, data ).then((data));
    },
    getShipmentEditTruck(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-shipmentsTruck/edit/`+id, data ).then((data));
    },
    assignShipmentOrder(data=[]) {
        return fetchWrapper.post(`${baseUrl}assign-lanes-to-outbound-shipment-orders`, data ).then((data));
    },
    getShipmentHeader(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}outbound-getshipmentHeader/`+id ).then((data));
    },
    markShipmentComplete(data=[]) {
        return fetchWrapper.post(`${baseUrl}mark-shipment-complete`, data ).then((data));
    },
    addTruckAndDock(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-Truck-Dock`, data ).then((data));
    },
    multipleShipment(data=[]) {
        return fetchWrapper.post(`${baseUrl}multiple-shipment`, data ).then((data));
    },
    multipleUpdateShipment(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}multiple-update-shipment/`+id, data ).then((data));
    },
};
