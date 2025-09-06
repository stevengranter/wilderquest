// --- iNaturalist API Types ---

// Base types
export type INatQualityGrade = 'casual' | 'needs_id' | 'research'

export interface INatUser {
    id: number
    login: string
    name?: string
    user_icon_url?: string
    observations_count?: number
    identifications_count?: number
}

export interface INatPhoto {
    id: number
    license_code: string | null
    attribution: string
    url: string // URL for the original size photo. Can be very large.
    original_dimensions: {
        width: number
        height: number
    }
    flags: unknown[]
    attribution_name?: string | null
    square_url?: string
    small_url?: string
    medium_url?: string
    large_url?: string
}

export interface INatAnnotation {
    controlled_attribute_id: number
    controlled_value_id: number
    concatenated_attr_val: string
    controlled_attribute: {
        id: number
        label: string
        multivalued: boolean
    }
    controlled_value: {
        id: number
        label: string
    }
    user_id: number
    vote_score: number
    votes: Array<{
        vote_flag: boolean
        user_id: number
    }>
}

// Taxon types
export interface INatTaxon {
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
    default_photo?: INatPhoto
    taxon_changes_count: number
    taxon_schemes_count: number
    observations_count: number
    flag_counts: { resolved: number; unresolved: number }
    current_synonymous_taxon_ids: number | null
    atlas_id: number
    complete_species_count: number | null
    wikipedia_url: string
    matched_term: string
    iconic_taxon_name: string
    preferred_common_name: string
    preferred_establishment_means?: string
}

// Observation types
export interface INatObservation {
    geojson?: { type: string; coordinates: number[] }
    id: number
    uuid: string
    species_guess?: string
    taxon?: INatTaxon
    user: INatUser
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
    quality_grade: INatQualityGrade
    annotations: INatAnnotation[]
    identifications_most_agree: boolean
    identifications_most_disagree: boolean
    comments_count: number
    photos: INatPhoto[]
    identifications_count?: number
    faves_count?: number
    cached_votes_total?: number
    sounds?: Array<{
        id: number
        license_code: string | null
        attribution: string
        file_url: string
    }>
}

// Place types
export interface INatPlace {
    id: number
    name: string
    display_name: string
    place_type: number
    admin_level: number | null
    bbox_area: number
    geometry_geojson: {
        type: string
        coordinates: number[][][]
    }
    bounding_box_geojson: {
        type: string
        coordinates: number[][]
    }
    location: string
    latitude?: number
    longitude?: number
    place_type_name: string
    ancestry: string
}

// Species count types
export interface INatSpeciesCount {
    taxon_id: number
    count: number
    taxon: INatTaxon
}

// Response types
export interface INatPaginatedResponse<T> {
    total_results: number
    page: number
    per_page: number
    results: T[]
}

export type INatTaxaResponse = INatPaginatedResponse<INatTaxon>
export type INatObservationsResponse = INatPaginatedResponse<INatObservation>
export type INatPlacesResponse = INatPaginatedResponse<INatPlace>
export type INatPhotosResponse = INatPaginatedResponse<INatPhoto>
export type INatSpeciesCountsResponse = INatPaginatedResponse<INatSpeciesCount>

// Autocomplete types
export interface INatAutocompleteResult {
    id: number
    name: string
    rank: string
    matched_term: string
    preferred_common_name?: string
    default_photo?: INatPhoto
    observations_count: number
    is_active: boolean
}

export type INatAutocompleteResponse =
    INatPaginatedResponse<INatAutocompleteResult>

// Places autocomplete types
export interface INatPlaceAutocompleteResult {
    id: number
    name: string
    display_name: string
    type: string
    place_type: number
    bbox_area?: number
}

export type INatPlacesAutocompleteResponse =
    INatPaginatedResponse<INatPlaceAutocompleteResult>

// Error types
export interface INatError {
    error: string
    status?: number
}

// Request parameter types
export interface INatTaxaSearchParams {
    q?: string
    taxon_id?: number
    rank?: string
    is_active?: boolean
    per_page?: number
    page?: number
}

export interface INatObservationsSearchParams {
    q?: string
    taxon_id?: number
    user_id?: number
    place_id?: number
    project_id?: number
    quality_grade?: INatQualityGrade
    identified?: boolean
    captive?: boolean
    endemic?: boolean
    native?: boolean
    threatened?: boolean
    introduced?: boolean
    photos?: boolean
    sounds?: boolean
    geo?: boolean
    id_please?: boolean
    identifications?: string
    out_of_range?: boolean
    mappable?: boolean
    license?: string
    photo_license?: string
    sound_license?: string
    ofv_datatype?: string
    acc?: boolean
    geoprivacy?: string
    taxon_geoprivacy?: string
    created_on?: string
    observed_on?: string
    d1?: string
    d2?: string
    day?: number
    month?: number
    year?: number
    hour?: number
    m?: number
    date?: string
    created_d1?: string
    created_d2?: string
    applied_d1?: string
    applied_d2?: string
    created_month?: number
    created_year?: number
    observed_month?: number
    observed_year?: number
    site_id?: number
    id?: number[]
    not_id?: number[]
    list_id?: number
    not_in_project?: number
    collection_id?: number
    not_in_collection?: number
    per_page?: number
    page?: number
    order?: string
    order_by?: string
}

export interface INatPlacesSearchParams {
    q?: string
    latitude?: number
    longitude?: number
    swlat?: number
    swlng?: number
    nelat?: number
    nelng?: number
    per_page?: number
    page?: number
}
