import axios from 'axios'

export const HttpService = {
    async getService(url='', data=[], header=[]) {
        return await axios.get(process.env.API_URL+url)
        .then(res => res.data.data);
    },  

    async postService(url='', data=[]) {
        return await axios.post(import.meta.env.VITE_API_URL+url,data)
        .then(res => res.data);
    },
}
