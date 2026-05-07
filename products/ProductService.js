import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}products/`;
const baseUrls = `${import.meta.env.VITE_API_URL}ItemLotExpiry/`;


export const ProductService = {
    addProduct(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-product`, data ).then((data));
    },
    updateMantisProduct(data=[]) {
        return fetchWrapper.post(`${baseUrl}update-mantis-product`, data ).then((data));
    },
    updateProduct(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-product/${id}`, data ).then((data));
    },
    getProductsGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-products`, data ).then((data));
    },
    getMantisProductsGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-mantis-products`, data ).then((data));
    },
    getProductDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-products/`+id ).then((data));  
    },
    uploadProducts(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-products`, data ).then((data));  
    },
    getProductDesc(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-product-desc`, data ).then((data));  
    },
    getAllProductsReport(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-all-products-report`, data ).then((data));  
    },
    searchMantisProduct(data=[]) {
        return fetchWrapper.post(`${baseUrl}mantis-product/search`, data ).then((data));
    },
    deleteProduct(data=[]) {
        return fetchWrapper.post(`${baseUrl}delete-product`, data ).then((data));
    },
    getAllItems(data=[]) {
        return fetchWrapper.get(`${baseUrls}get-lv-products`).then((data));
    },

};
