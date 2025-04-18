import useINat from "@/hooks/useINatApi";
import {useEffect, useState} from "react";


export default function RecentFinds() {

    const {fetchINatData} = useINat()
    const [iNatData, setINatData] = useState<any[]>([])

    useEffect(() => {
    })

    return (
        <div>
            Recent Finds
        </div>
    )

}
