import { createContext, useContext, ReactNode } from 'react'
import { useSimpleLocalStorage } from '../hooks/useSimpleLocalStorage'

// Extracted interface with required fields
export interface GeoLocationData {
    state: string
    latitude: string
    longitude: string
    city: string
    country: string
}

// Extracted default values
const DEFAULT_GEO_LOCATION: GeoLocationData = {
    latitude: '',
    longitude: '',
    city: '',
    country: '',
    state: '',
}

// Improved context type definition
type GeoLocationContextType = {
    geoLocation: GeoLocationData
    setGeoLocation: (geoLocation: GeoLocationData) => void
}

// Extracted initial context
const GeoLocationContext = createContext<GeoLocationContextType>({
    geoLocation: DEFAULT_GEO_LOCATION,
    setGeoLocation: () => {
        // Default empty implementation - actual implementation provided by provider
    },
})

// Added proper props interface
interface GeoLocationProviderProps {
    children?: ReactNode
}

export default function GeoLocationProvider({
    children,
}: GeoLocationProviderProps) {
    const [geoLocation, setGeoLocation] =
        useSimpleLocalStorage<GeoLocationData>(
            'geoLocation',
            DEFAULT_GEO_LOCATION
        )

    return (
        <GeoLocationContext.Provider value={{ geoLocation, setGeoLocation }}>
            {children}
        </GeoLocationContext.Provider>
    )
}

export function useGeoLocation(): GeoLocationContextType {
    const context = useContext(GeoLocationContext)

    if (context === undefined) {
        throw new Error(
            'useGeoLocation must be used within a GeoLocationProvider'
        )
    }

    return context
}
