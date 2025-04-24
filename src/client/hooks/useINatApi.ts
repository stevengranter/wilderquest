import {useEffect} from 'react'
import axios, {AxiosResponse} from 'axios'

type iNatQueryType = ['taxa', 'places', 'photos', 'observations']

export default function useINatApi() {
    async function fetchData(query: iNatQueryType, params: any) {
        const response = await axios.get(
            `https://api.inaturalist.org/v1/${query.join('/')}`,
            {params}
        )
        if (response.status === 200) {
            return response.data
        }
    }

    // async function fetchTaxaByIds(ids: string[]|number[]) {
    //     const idStr = ids.toString()
    //     const uriStr = encodeURIComponent(idStr)
    //     const response = await axios.get(`https://api.inaturalist.org/v1/taxa/${uriStr}`)
    //     if (response.status === 200) {
    //         return response.data;
    //     }
    // }

    return {fetchINatData: fetchData}
    // return {fetchTaxaByIds}
}
