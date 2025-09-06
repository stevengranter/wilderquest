import { LocationToggle } from '@/components/ui/location-toggle'
import { useState } from 'react'

export default function GeoLocationToggle() {
    const [location, setLocation] = useState<{
        mode: 'worldwide' | 'custom'
        customLocation?: string
    }>({
        mode: 'worldwide',
    })

    const handleLocationChange = (
        mode: 'worldwide' | 'custom',
        customLocation?: string
    ) => {
        setLocation({ mode, customLocation })
    }
    return (
        <LocationToggle
            value={location.mode}
            customLocation={location.customLocation}
            onValueChange={handleLocationChange}
            placeholder="e.g., San Francisco, CA"
        />
    )
}
