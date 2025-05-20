import { useGeoLocation } from '@/contexts/GeoLocationProvider'

export default function LocationIndicator({ className }: { className?: string }) {
    const { geoLocation } = useGeoLocation()
    return (
        <div className={className}>
            Current location: {' '}
            {geoLocation && <>{geoLocation.city && `{geoLocation.city},`} {geoLocation.state}, {geoLocation.country}</>}
        </div>
    )
}
