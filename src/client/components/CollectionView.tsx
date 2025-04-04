import {Collection} from "../../types/types.js";
import {useEffect, useState} from "react";
import axios from "axios";
import useInat from "@/hooks/useInat.js";

export default function CollectionView({collectionId}:{collectionId:string | number}) {
    const [collection, setCollection] = useState<Collection | null>(null)
    const [taxaArray, setTaxaArray] = useState<[] | null>(null)
    const [taxaData, setTaxaData] = useState<[] | null>(null)


    useEffect(() => {
        if (!collectionId) {
            return
        }
        axios.get(`/api/collections/${collectionId}`).then(res => {
            setCollection(res.data)
            console.log(res.data)
            if (res.data.taxon_ids?.length > 0) {
                setTaxaArray(res.data.taxon_ids)
            }
        })

    },[collectionId])

    useEffect(() => {
        if (!taxaArray) {
            return
        }




        // axios.get(`https://api.inaturalist.org/v1/taxa/${taxonIds}`)
        //      .then(res => {
        //              console.log(res);
        //
        //              if (res.status === 200) {
        //                  setTaxaData(res.data.results)
        //              }
        //          }
        //      )
        },[taxaArray])

    return collection && (
        <>
        <h2>{collection.name}</h2>
        <div>{collection.emoji}</div>
            {taxaData && taxaData.length > 0 && taxaData.map((elem, index) => (<li key={index}>{elem.name}</li>))}
        </>
    )

}

