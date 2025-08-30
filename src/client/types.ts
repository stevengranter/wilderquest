// --- Types ---
type iNatTaxaResult = {
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

interface _INatTaxaResponse {
    results: iNatTaxaResult[]
    per_page: number
    page: number
    total_results: number
}

interface _SuggestionItem {
    value: string
    name: string
    common_name: string
    photo_url: string | undefined
    observations_count: number
}
