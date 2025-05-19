import { createContext } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'

type GeoLocation = {
    latitude: number
    longitude: number,
    city: string,
    country: string,
}

const GeoLocationContext = createContext<GeoLocation | undefined>(undefined)

export default function GeoLocationProvider() {
    const [geoLocation, setGeoLocation] = useLocalStorage<GeoLocation | undefined>('geoLocation', undefined)
    return (
        <GeoLocationContext.Provider value={geoLocation}></GeoLocationContext.Provider>
    )
}
