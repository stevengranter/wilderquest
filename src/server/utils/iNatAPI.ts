import axios from 'axios'

export const BATCH_SIZE = 30

export const iNatAPI = axios.create({
    baseURL: 'https://api.inaturalist.org/v1',
    headers: {
        'Content-Type': 'application/json',
    },
})
