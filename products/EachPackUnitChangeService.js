import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const EachPackUnitChangeService = {
    addEachPackUnitChange(data=[]) {
        return fetchWrapper.post(`${baseUrl}add-each-pack-unit-change`, data ).then((data));
    },
    updateEachPackUnitChange(id, data=[]) {
        return fetchWrapper.post(`${baseUrl}update-each-pack-unit-change/${id}`, data ).then((data));
    },
    getEachPackUnitChangeGrid(data=[]) {
        return fetchWrapper.post(`${baseUrl}get-each-pack-unit-change`, data ).then((data));
    },
    getEachPackUnitChangeDetail(id,data=[]) {
        return fetchWrapper.post(`${baseUrl}get-each-pack-unit-change/`+id ).then((data));  
    },
    uploadEachPackUnitChanges(data=[]) {
        return fetchWrapper.post(`${baseUrl}upload-each-pack-unit-change`, data ).then((data));  
    },
};
