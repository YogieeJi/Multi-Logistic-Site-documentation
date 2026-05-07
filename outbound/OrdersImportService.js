import { fetchWrapper } from "../../helpers";
import { HttpService } from "../HttpService";

const baseUrl = `${import.meta.env.VITE_API_URL}importedOrders/`;
const deliveryBaseUrl = `${import.meta.env.VITE_API_URL}delivery/`;
const baseUrlOrder = `${import.meta.env.VITE_API_URL}order/`;

export const OrdersImportService = {
    getOrdersGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-imported-orders`, data ).then((data));
    },

    getOrdersDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-imported-orders/`+id ).then((data));  
    },

    getOrderLines(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-imported-orders-lines/`+id, data ).then((data));  
    },

    uploadData(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-imported-orders`,data).then((data));  
    },
     loadOrderUploadData(data=[]) {
        return fetchWrapper.post(`${baseUrl}bulk-load-orders`,data).then((data));  
    }, 
    getDeliveryOrderLines(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-delivery-orders-lines`, data ).then((data));  
    },
    exportDeliveryOrderLines(data=[]) {
        return fetchWrapper.post(`${baseUrl}export-delivery-orders-lines`, data ).then((data));  
    },

    orderExecution(data=[]){
        return fetchWrapper.post(`${baseUrl}execute-imported-orders`, data ).then((data));
    },
    deliveryCreation(data=[]){
        return fetchWrapper.post(`${deliveryBaseUrl}create-delivery-imported-orders`, data ).then((data));
    },
       deliveryCreationNew(data=[]){
        return fetchWrapper.post(`${baseUrl}create-delivery-imported-orders-new`, data ).then((data));
    },
    deliveryCreationNewChanges(data=[]){
        return fetchWrapper.post(`${baseUrl}create-delivery-imported-orders-new-Changes`, data ).then((data));
    },
    getPickListDetail(data=[]){
        return fetchWrapper.post(`${baseUrl}get-pick-list-details`, data ).then((data));
    },
    getOrderExport(data=[]){
        return fetchWrapper.post(`${baseUrl}get-order-export`, data ).then((data));
    }, 
     getPickListIds(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-picklist-ids`).then((data));
    },
    getOrderShortDataExport(data=[]){
        return fetchWrapper.post(`${baseUrl}get-order-short-data-export`, data).then((data));
    },
    getOrderTaskDetails(data=[]){
        return fetchWrapper.post(`${baseUrl}get-order-export-detail`, data).then((data));
    },
    getOrderPalletsCount(data=[]){
        return fetchWrapper.post(`${baseUrl}get-order-pallets-count`, data ).then((data));
    },
    getAllOrderPalletsCount(data=[]){
        return fetchWrapper.post(`${baseUrl}get-all-order-pallets-count`, data ).then((data));
    },
    getOrderItem(data=[]){
        return fetchWrapper.post(`${baseUrl}get-order-item`,data).then((data));
    },
    assignUser(data=[]){
        return fetchWrapper.post(`${baseUrl}assign-imported-orders`, data ).then((data));
    },
    assignUserLoc(data=[]){
        return fetchWrapper.post(`${baseUrl}assign-imported-orders-to-user-loc`, data ).then((data));
    },

    assignUserToOrdersLinesLoc(data=[]){
        return fetchWrapper.post(`${baseUrl}assign-imported-order-lines-to-user-loc`, data ).then((data));
    },
    assignLocations(data=[]){
        return fetchWrapper.post(`${baseUrl}assign-shipping-locations-to-imported-orders`, data ).then((data));
    },
    assignLanes(data=[]){
        return fetchWrapper.post(`${baseUrl}assign-lanes-to-imported-orders`, data ).then((data));
    },
    orderLoad(data=[]){
        return fetchWrapper.post(`${baseUrl}load-imported-orders`, data ).then((data));
    },
    manualDetailsSync(data=[]){
        return fetchWrapper.post(`${baseUrl}manual-sync-picklist-details`, data ).then((data));
    },
    manualOrderComplete(data=[]){
        return fetchWrapper.post(`${baseUrl}manual-order-complete`, data ).then((data));
    },
    orderStatusComplete(data=[]){
        return fetchWrapper.post(`${baseUrl}manual-order-status-complete`, data ).then((data));
    },

    reValidateItems(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}revalidate-order-items/`+id ).then((data));  
    },
    releaseLoction(data=[]){
        return fetchWrapper.post(`${baseUrl}order-shipment-locaiton-release`, data ).then((data));
    },
    assignOrderType(data=[]) {
        return fetchWrapper.post(`${baseUrl}assign-order-type`, data ).then((data));
    },
    getOrderTypes(data=[]) {
        return fetchWrapper.get(`${baseUrl}order-types`).then((data));
    },
    reexecuteOrder(data=[]){
        return fetchWrapper.post(`${baseUrl}re-execute-order`, data ).then((data));
    },
    markNotReRun(data=[]){
        return fetchWrapper.post(`${baseUrl}not-re-execute-order`, data ).then((data));
    },
    appendOrders(data=[]){
        return fetchWrapper.post(`${baseUrl}append-orders`, data ).then((data));
    },
    appendReExecuteOrder(data=[]){
        return fetchWrapper.post(`${baseUrl}append-and-reexecute-order`, data ).then((data));
    },
    archiveCompeletedOrder(data=[]){
        return fetchWrapper.get(`${baseUrl}archive-compeleted-order`).then((data));
    }, 
    deleteOrder(data=[]){
        return fetchWrapper.post(`${baseUrl}delete-order`,data).then((data));
    },   
    
    getOrdersTask(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-order-tasks`,data ).then((data));  
    },
    
    getOrdersList(data=[]){
        return fetchWrapper.get(`${baseUrl}get-orders-list`).then((data));
    },

    cancelItem(data=[]){
        return fetchWrapper.post(`${baseUrl}cancel-item`,data).then((data));
    },
    
    getSectorCode(id,data=[]){
        return fetchWrapper.post(`${baseUrl}sector-codes/`+id,data).then((data));
    },
    updateTask(data=[]){
        return fetchWrapper.post(`${baseUrl}update-task`,data).then((data));
    },
    cancelOrders(data=[]){
        return fetchWrapper.post(`${baseUrl}cancel-orders`,data).then((data));
    },
    getOrderDetail(data=[]) {
       return fetchWrapper.post(`${baseUrlOrder}getOrderDetail`,data).then((data));
    },
    gettaskwiseMantisUsers(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-task-wise-mantis-users`, data ).then((data));
    },
};
