// import { fetchWrapper } from "../helpers";

// const baseUrl = `${import.meta.env.VITE_API_URL}`;

// export const DashboardService = {
    
//     getPendingReceipt(data=[]) {
//         return fetchWrapper.post(`${baseUrl}pending-receipts/get-list`, data ).then((data));
//     },
//     getUserLane(data=[]) {
//         return fetchWrapper.get(`${baseUrl}laneusers`).then((data));
//     },
//     getReceivingPlan(id,data=[]) {
//         return fetchWrapper.get(`${baseUrl}get-receiving-plan/${id}`).then((data));
//     },
//     updateReceivingPlan(id,data=[]) {
//         return fetchWrapper.post(`${baseUrl}update-receiving-plan/${id}`, data).then((data));
//     },
//     getAllSlots(data=[]) {
//         return fetchWrapper.get(`${baseUrl}get-all-slots`).then((data));
//     },
//     getAllItems(id,data=[]) {
//         return fetchWrapper.get(`${baseUrl}get-all-products/${id}`).then((data));
//     },
//     generateReceivingPlan(id,data=[]) {
//         return fetchWrapper.post(`${baseUrl}generate-receiving-plan/${id}`, data).then((data));
//     },
//     deleteReceivingPlan(id,data=[]) {
//         return fetchWrapper.get(`${baseUrl}delete-receiving-plan/${id}`).then((data));
//     },
//     createReceivingItem(data=[]) {
//         return fetchWrapper.post(`${baseUrl}create-receiving-item`, data ).then((data));
//     },
//     getLaneStatus(data=[]) {
//         return fetchWrapper.get(`${baseUrl}get-lane-status`).then((data));
//     },
//     markContainer(data=[]) {
//         return fetchWrapper.post(`${baseUrl}mark-container-status`, data).then((data));
//     },
//     reValidateItem(data=[]) {
//         return fetchWrapper.post(`${baseUrl}revalidate-item`, data).then((data));
//     },
    
    
//     getOrderShortData(data=[]) {
//         return fetchWrapper.post(`${baseUrl}get-order-short-data`,data).then((data));
//     },

//     deleteReceipt(id,data=[]) {
//         return fetchWrapper.post(`${baseUrl}receipt/delete/${id}`, data).then((data));
//     },


// };
import { fetchWrapper } from "../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}PendingReceipt/`;
const baseUrlDashbord = `${import.meta.env.VITE_API_URL}dashboard/`;
const baseUrlOrder = `${import.meta.env.VITE_API_URL}order/`;
const baseUrlUserTaskDashboard = `${import.meta.env.VITE_API_URL}userTaskDashboard/`;

export const DashboardService = {
    
    getPendingReceipt(data=[]) {
        return fetchWrapper.post(`${baseUrl}pending-receipts/get-list`, data ).then((data));
    },
    getUserLane(data=[]) {
        return fetchWrapper.get(`${baseUrl}laneusers`).then((data));
    },
    getReceivingPlan(id,data=[]) {
        return fetchWrapper.get(`${baseUrl}get-receiving-plan/${id}`).then((data));
    },
    updateReceivingPlan(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}update-receiving-plan/${id}`, data).then((data));
    },
    getAllSlots(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-all-slots`).then((data));
    },
    getAllItems(id,data=[]) {
        return fetchWrapper.get(`${baseUrl}get-all-products/${id}`).then((data));
    },
    generateReceivingPlan(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}generate-receiving-plan/${id}`, data).then((data));
    },
    deleteReceivingPlan(id,data=[]) {
        return fetchWrapper.get(`${baseUrl}delete-receiving-plan/${id}`).then((data));
    },
    createReceivingItem(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-receiving-item`, data ).then((data));
    },
    getLaneStatus(data=[]) {
        return fetchWrapper.get(`${baseUrl}get-lane-status`).then((data));
    },
    markContainer(data=[]) {
        return fetchWrapper.post(`${baseUrl}mark-container-status`, data).then((data));
    },
    reValidateItem(data=[]) {
        return fetchWrapper.post(`${baseUrl}revalidate-item`, data).then((data));
    },
    ResetReceipt(data=[]) {
        return fetchWrapper.post(`${baseUrl}reset-receipt`, data).then((data));
    },
    
    // order dashboard service
    getOrderShortData(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}get-order-short-data`,data).then((data));
    },

    deleteReceipt(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}receipt/delete/${id}`, data).then((data));
    },

     // truck dashboard service
     getAllOrderTruck(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}get-truck-data`,data).then((data));
    },

    getTruckOrderDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}get-truck-order-detail/${id}`, data).then((data));
    },
    getUserOrderDetail(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-user-order-detail`, data).then((data));
    },
    getReceiptSlots(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-cus-slots`,data).then((data));
    },
    createBulkReceipt(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-bulk-receipt`,data).then((data));
    },
    getUnallocatedQty(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-unallocated-qty`,data).then((data));
    },
    MarkReceiptBulk(data=[]) {
        return fetchWrapper.post(`${baseUrl}MarkReceiptBulk`,data).then((data));
    },
    getSlotsIteration(upc,data=[]) {
        return fetchWrapper.get(`${baseUrl}get-slots-ietrations/${upc}`).then((data));
    },
    getSlotsReceipt(upc,data=[]) {
        return fetchWrapper.get(`${baseUrl}get-slots-Receipt/${upc}`).then((data));
    },

    //////////////////////// User Task Dashboard ////////////////////////

    getUserTaskData(data=[]) {
        return fetchWrapper.post(`${baseUrlUserTaskDashboard}getUserTaskGrid`,data).then((data));
    },
    getUserTaskDetail(data=[]) {
        return fetchWrapper.post(`${baseUrlUserTaskDashboard}getUserTaskDetail`,data).then((data));
    },
    getUserTaskLogDetail(data=[]) {
        return fetchWrapper.post(`${baseUrlUserTaskDashboard}getUserTaskLogDetail`,data).then((data));
    },
    
    
    //////////////////////// Shipping Dashboard ////////////////////////
    
    getShippingConveyor(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}get-shipping`,data).then((data));
    },

    // task dashboard

    getTaskDashboard(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}get-task-dashboard`,data).then((data));
    },

    // get task report 
    getTaskReport(data=[]) {
        return fetchWrapper.post(`${baseUrlUserTaskDashboard}get-task-report`,data).then((data));
    },
    getTaskPDFReport(data=[]) { 
        return fetchWrapper.requestPDFFilter(`${baseUrlUserTaskDashboard}get-task-pdf-report`,data).then((data));
    },
    getTaskManagment(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}get-task-management`,data).then((data));
    },

    updateTaskStatus(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}updateTaskStatus`,data).then((data));
    },
    // get order detail 
    getOrderDetail(data=[]) {
        return fetchWrapper.post(`${baseUrlOrder}getOrderDetail`,data).then((data));
    },

    //get Pallet Info
    getPalletInfo(data=[]) {
        return fetchWrapper.post(`${baseUrlDashbord}getPalletInfo`,data).then((data));
    },
};

