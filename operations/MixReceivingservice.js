import { fetchWrapper } from "../../helpers";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const MixReceiving = {
    getSuggestedLocations(data=[]) {
        return fetchWrapper.post(`${baseUrl}suggested-locations`, data ).then((data));
    },
    CreatePutaway(data=[]) {
        return fetchWrapper.post(`${baseUrl}create-putaway`, data ).then((data));
    },
    
   
};
