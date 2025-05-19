import { createContext, useState } from 'react'

type GeoLocation = {
    latitude: number
    longitude: number,
    city: string,
    country: string,
}

const GeoLocationContext = createContext<GeoLocation | undefined>(undefined)

export default function GeoLocationProvider() {
    const [geoLocation, setGeoLocation] = useState<GeoLocation | undefined>(undefined)
    return (
        <GeoLocationContext.Provider value={geoLocation}></GeoLocationContext.Provider>
    )
}
