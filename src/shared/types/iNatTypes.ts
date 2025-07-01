// --- Types ---
export type INatTaxon = {
    id: number
    rank:
        | 'species'
        | 'genus'
        | 'family'
        | 'order'
        | 'class'
        | 'phylum'
        | 'kingdom'
    rank_level: number
    iconic_taxon_id: number
    ancestor_ids: number[]
    is_active: boolean
    name: string
    parent_id: number
    ancestry: string
    extinct: boolean
    default_photo?: {
        id: number
        license_code: string | null
        attribution: string
        url: string
        original_dimensions: { height: number; width: number }
        flags: []
        square_url: string
        medium_url: string
    }
    taxon_changes_count: number
    taxon_schemes_count: number
    observations_count: number
    flag_counts: { resolved: number; unresolved: number }
    current_synonymous_taxon_ids: number | null
    atlas_id: number
    complete_species_count: null
    wikipedia_url: string
    matched_term: string
    iconic_taxon_name: string
    preferred_common_name: string
}

export interface INatTaxaResponse {
    results: INatTaxon[]
    per_page: number
    page: number
    total_results: number
}

// Interface representing the user information
interface INatUser {
    id: number
    login: string
    name?: string
    user_icon_url?: string
    // Add other relevant fields as needed
}

// Interface representing a single observation
export interface INatObservation {
    geojson?: { type: string; coordinates: number[] }
    id: number
    uuid: string
    species_guess?: string
    taxon?: INatTaxon
    user?: INatUser
    observed_on?: string
    time_observed_at?: string
    created_at: string
    updated_at: string
    description?: string
    place_guess?: string
    latitude?: number
    longitude?: number
    location: string
    positional_accuracy?: number
    public_positional_accuracy?: number
    geoprivacy?: string | null
    taxon_geoprivacy?: string | null
    quality_grade: string
    annotations: unknown[] // Define a more specific type if available
    identifications_most_agree: boolean
    identifications_most_disagree: boolean
    comments_count: number
    photos: Photo[]
    // Add other relevant fields as needed
}

export interface Photo {
    id: number
    license_code: string | null
    attribution: string
    url: string // URL for the original size photo. Can be very large.

    // For practical use, the API provides several pre-sized image URLs.
    original_dimensions: {
        width: number
        height: number
    }
}

// Interface representing the API response
export interface INatObservationsResponse {
    total_results: number
    page: number
    per_page: number
    results: INatObservation[]
}
