import axios from 'axios'

type iNatQueryType = ['taxa', 'places', 'photos', 'observations']

export default function useINatApi() {
    async function fetchData(
        query: iNatQueryType,
        params: Record<string, unknown>
    ) {
        const response = await axios.get(`/api/iNatAPI/${query.join('/')}`, {
            params,
        })
        if (response.status === 200) {
            return response.data
        }
    }

    // async function fetchTaxaByIds(ids: string[]|number[]) {
    //     const idStr = ids.toString()
    //     const uriStr = encodeURIComponent(idStr)
    //     const response = await axios.get(`/api/iNatAPI/taxa/${uriStr}`)
    //     if (response.status === 200) {
    //         return response.data;
    //     }
    // }

    return { fetchINatData: fetchData }
    // return {fetchTaxaByIds}
}
