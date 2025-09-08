// --- LocationIQ API Types ---

export interface LocationIQPlace {
    place_id: string
    licence: string
    osm_type: string
    osm_id: string
    boundingbox: [string, string, string, string]
    lat: string
    lon: string
    display_name: string
    class: string
    type: string
    importance: number
    icon?: string
    address: {
        city?: string
        state?: string
        country?: string
        country_code?: string
        county?: string
        postcode?: string
        road?: string
        house_number?: string
        suburb?: string
        town?: string
        village?: string
        municipality?: string
        region?: string
        state_district?: string
        neighbourhood?: string
    }
}

export type LocationIQResults = LocationIQPlace[]

export interface LocationIQSearchParams {
    q?: string
    format?: 'json' | 'xml' | 'jsonv2' | 'geojson' | 'geocodejson'
    normalizecity?: number
    addressdetails?: number
    limit?: number
    countrycodes?: string
    viewbox?: string
    bounded?: number
    exclude_place_ids?: string
    dedupe?: number
    route?: string
    statecode?: string
    matchquality?: number
    postaladdress?: number
}

export interface LocationIQReverseParams {
    lat: number
    lon: number
    format?: 'json' | 'xml' | 'jsonv2' | 'geojson' | 'geocodejson'
    normalizecity?: number
    addressdetails?: number
    zoom?: number
    namedetails?: number
    extratags?: number
    statecode?: number
    showdistance?: number
    postaladdress?: number
}
