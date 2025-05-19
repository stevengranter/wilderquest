import { useGeoLocation } from '@/contexts/GeoLocationProvider'

export default function LocationIndicator() {
    const { geoLocation } = useGeoLocation()
    return (
        <>
            {geoLocation && <>{geoLocation.city}, {geoLocation.state}, {geoLocation.country}</>}


        </>
    )
}
