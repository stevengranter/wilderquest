import {useEffect} from "react";
import axios, {AxiosResponse} from "axios";

type InatEndpoint = ["taxa","places","photos"]

export default function useINat() {


    async function fetchTaxaByIds(ids: string[]|number[]) {
        const idStr = ids.toString()
        const uriStr = encodeURIComponent(idStr)
        const response = await axios.get(`https://api.inaturalist.org/v1/taxa/${uriStr}`)
        if (response.status === 200) {
            return response.data;
        }
    }

    return {fetchTaxaByIds}
}
