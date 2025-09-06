import {
    INatTaxon,
    INatObservationsResponse,
    INatTaxaResponse,
} from '../../shared/types/iNatTypes.js'

// Mock data for development - expanded with diverse taxa
const mockTaxa: INatTaxon[] = [
    // Birds
    {
        id: 1,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 3,
        ancestor_ids: [1, 2, 3],
        is_active: true,
        name: 'Corvus corax',
        parent_id: 3,
        ancestry: '1/2/3',
        extinct: false,
        default_photo: {
            id: 1,
            license_code: 'CC-BY',
            attribution: 'Mock Raven Photo',
            url: 'https://via.placeholder.com/500x500?text=Raven',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url: 'https://via.placeholder.com/100x100?text=Raven',
            medium_url: 'https://via.placeholder.com/300x300?text=Raven',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 1250,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 1,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Common_raven',
        matched_term: 'Corvus corax',
        iconic_taxon_name: 'Aves',
        preferred_common_name: 'Common Raven',
    },
    {
        id: 2,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 3,
        ancestor_ids: [1, 2, 4],
        is_active: true,
        name: 'Cyanocitta cristata',
        parent_id: 4,
        ancestry: '1/2/4',
        extinct: false,
        default_photo: {
            id: 2,
            license_code: 'CC-BY',
            attribution: 'Mock Blue Jay Photo',
            url: 'https://via.placeholder.com/500x500?text=Blue+Jay',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url: 'https://via.placeholder.com/100x100?text=Blue+Jay',
            medium_url: 'https://via.placeholder.com/300x300?text=Blue+Jay',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 890,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 2,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Blue_jay',
        matched_term: 'Cyanocitta cristata',
        iconic_taxon_name: 'Aves',
        preferred_common_name: 'Blue Jay',
    },
    // Mammals
    {
        id: 3,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 1,
        ancestor_ids: [5, 6, 7],
        is_active: true,
        name: 'Ursus americanus',
        parent_id: 7,
        ancestry: '5/6/7',
        extinct: false,
        default_photo: {
            id: 3,
            license_code: 'CC-BY',
            attribution: 'Mock Black Bear Photo',
            url: 'https://via.placeholder.com/500x500?text=Black+Bear',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url: 'https://via.placeholder.com/100x100?text=Black+Bear',
            medium_url: 'https://via.placeholder.com/300x300?text=Black+Bear',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 450,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 3,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/American_black_bear',
        matched_term: 'Ursus americanus',
        iconic_taxon_name: 'Mammalia',
        preferred_common_name: 'American Black Bear',
    },
    {
        id: 4,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 1,
        ancestor_ids: [5, 6, 8],
        is_active: true,
        name: 'Sciurus carolinensis',
        parent_id: 8,
        ancestry: '5/6/8',
        extinct: false,
        default_photo: {
            id: 4,
            license_code: 'CC-BY',
            attribution: 'Mock Gray Squirrel Photo',
            url: 'https://via.placeholder.com/500x500?text=Gray+Squirrel',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url:
                'https://via.placeholder.com/100x100?text=Gray+Squirrel',
            medium_url:
                'https://via.placeholder.com/300x300?text=Gray+Squirrel',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 1200,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 4,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Eastern_gray_squirrel',
        matched_term: 'Sciurus carolinensis',
        iconic_taxon_name: 'Mammalia',
        preferred_common_name: 'Eastern Gray Squirrel',
    },
    // Insects
    {
        id: 5,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 2,
        ancestor_ids: [9, 10, 11],
        is_active: true,
        name: 'Danaus plexippus',
        parent_id: 11,
        ancestry: '9/10/11',
        extinct: false,
        default_photo: {
            id: 5,
            license_code: 'CC-BY',
            attribution: 'Mock Monarch Butterfly Photo',
            url: 'https://via.placeholder.com/500x500?text=Monarch+Butterfly',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url:
                'https://via.placeholder.com/100x100?text=Monarch+Butterfly',
            medium_url:
                'https://via.placeholder.com/300x300?text=Monarch+Butterfly',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 2100,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 5,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Monarch_butterfly',
        matched_term: 'Danaus plexippus',
        iconic_taxon_name: 'Insecta',
        preferred_common_name: 'Monarch Butterfly',
    },
    // Plants
    {
        id: 6,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 4,
        ancestor_ids: [12, 13, 14],
        is_active: true,
        name: 'Quercus rubra',
        parent_id: 14,
        ancestry: '12/13/14',
        extinct: false,
        default_photo: {
            id: 6,
            license_code: 'CC-BY',
            attribution: 'Mock Northern Red Oak Photo',
            url: 'https://via.placeholder.com/500x500?text=Northern+Red+Oak',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url:
                'https://via.placeholder.com/100x100?text=Northern+Red+Oak',
            medium_url:
                'https://via.placeholder.com/300x300?text=Northern+Red+Oak',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 780,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 6,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Northern_red_oak',
        matched_term: 'Quercus rubra',
        iconic_taxon_name: 'Plantae',
        preferred_common_name: 'Northern Red Oak',
    },
    // Amphibians
    {
        id: 7,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 5,
        ancestor_ids: [15, 16, 17],
        is_active: true,
        name: 'Anaxyrus americanus',
        parent_id: 17,
        ancestry: '15/16/17',
        extinct: false,
        default_photo: {
            id: 7,
            license_code: 'CC-BY',
            attribution: 'Mock American Toad Photo',
            url: 'https://via.placeholder.com/500x500?text=American+Toad',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url:
                'https://via.placeholder.com/100x100?text=American+Toad',
            medium_url:
                'https://via.placeholder.com/300x300?text=American+Toad',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 320,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 7,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/American_toad',
        matched_term: 'Anaxyrus americanus',
        iconic_taxon_name: 'Amphibia',
        preferred_common_name: 'American Toad',
    },
    // Fungi
    {
        id: 8,
        rank: 'species',
        rank_level: 10,
        iconic_taxon_id: 6,
        ancestor_ids: [18, 19, 20],
        is_active: true,
        name: 'Amanita muscaria',
        parent_id: 20,
        ancestry: '18/19/20',
        extinct: false,
        default_photo: {
            id: 8,
            license_code: 'CC-BY',
            attribution: 'Mock Fly Agaric Photo',
            url: 'https://via.placeholder.com/500x500?text=Fly+Agaric',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url: 'https://via.placeholder.com/100x100?text=Fly+Agaric',
            medium_url: 'https://via.placeholder.com/300x300?text=Fly+Agaric',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 180,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 8,
        complete_species_count: null,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Amanita_muscaria',
        matched_term: 'Amanita muscaria',
        iconic_taxon_name: 'Fungi',
        preferred_common_name: 'Fly Agaric',
    },
    // Higher taxonomic ranks
    {
        id: 9,
        rank: 'genus',
        rank_level: 20,
        iconic_taxon_id: 3,
        ancestor_ids: [1, 2],
        is_active: true,
        name: 'Corvus',
        parent_id: 2,
        ancestry: '1/2',
        extinct: false,
        default_photo: {
            id: 9,
            license_code: 'CC-BY',
            attribution: 'Mock Crow Genus Photo',
            url: 'https://via.placeholder.com/500x500?text=Crow+Genus',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url: 'https://via.placeholder.com/100x100?text=Crow+Genus',
            medium_url: 'https://via.placeholder.com/300x300?text=Crow+Genus',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 5000,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 9,
        complete_species_count: 45,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Corvus_(genus)',
        matched_term: 'Corvus',
        iconic_taxon_name: 'Aves',
        preferred_common_name: 'Crows and Ravens',
    },
    {
        id: 10,
        rank: 'family',
        rank_level: 30,
        iconic_taxon_id: 3,
        ancestor_ids: [1],
        is_active: true,
        name: 'Corvidae',
        parent_id: 1,
        ancestry: '1',
        extinct: false,
        default_photo: {
            id: 10,
            license_code: 'CC-BY',
            attribution: 'Mock Corvidae Family Photo',
            url: 'https://via.placeholder.com/500x500?text=Corvidae+Family',
            original_dimensions: { height: 500, width: 500 },
            flags: [],
            attribution_name: null,
            square_url:
                'https://via.placeholder.com/100x100?text=Corvidae+Family',
            medium_url:
                'https://via.placeholder.com/300x300?text=Corvidae+Family',
        },
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        observations_count: 15000,
        flag_counts: { resolved: 0, unresolved: 0 },
        current_synonymous_taxon_ids: null,
        atlas_id: 10,
        complete_species_count: 133,
        wikipedia_url: 'https://en.wikipedia.org/wiki/Corvidae',
        matched_term: 'Corvidae',
        iconic_taxon_name: 'Aves',
        preferred_common_name: 'Crows, Jays, and Magpies',
    },
]

const mockObservationsResponse: INatObservationsResponse = {
    total_results: 6,
    page: 1,
    per_page: 20,
    results: [
        {
            id: 1,
            uuid: 'mock-uuid-1',
            species_guess: 'Mock Species 1',
            taxon: mockTaxa[0], // Common Raven
            observed_on: '2024-01-01',
            time_observed_at: '2024-01-01T12:00:00Z',
            created_at: '2024-01-01T12:00:00Z',
            updated_at: '2024-01-01T12:00:00Z',
            place_guess: 'Mock Location',
            latitude: 40.7128,
            longitude: -74.006,
            location: '40.7128,-74.0060',
            positional_accuracy: 10,
            public_positional_accuracy: 10,
            geoprivacy: null,
            taxon_geoprivacy: null,
            quality_grade: 'research',
            annotations: [],
            identifications_most_agree: true,
            identifications_most_disagree: false,
            comments_count: 0,
            photos: [
                {
                    id: 1,
                    license_code: 'CC-BY',
                    attribution: 'Mock Photo',
                    url: 'https://via.placeholder.com/500x500?text=Mock+Observation',
                    original_dimensions: { height: 500, width: 500 },
                },
            ],
        },
        {
            id: 2,
            uuid: 'mock-uuid-2',
            species_guess: 'Mock Species 2',
            taxon: mockTaxa[1], // Blue Jay
            observed_on: '2024-01-02',
            time_observed_at: '2024-01-02T12:00:00Z',
            created_at: '2024-01-02T12:00:00Z',
            updated_at: '2024-01-02T12:00:00Z',
            place_guess: 'Mock Location 2',
            latitude: 40.7589,
            longitude: -73.9851,
            location: '40.7589,-73.9851',
            positional_accuracy: 10,
            public_positional_accuracy: 10,
            geoprivacy: null,
            taxon_geoprivacy: null,
            quality_grade: 'research',
            annotations: [],
            identifications_most_agree: true,
            identifications_most_disagree: false,
            comments_count: 0,
            photos: [
                {
                    id: 2,
                    license_code: 'CC-BY',
                    attribution: 'Mock Photo 2',
                    url: 'https://via.placeholder.com/500x500?text=Mock+Observation+2',
                    original_dimensions: { height: 500, width: 500 },
                },
            ],
        },
        {
            id: 3,
            uuid: 'mock-uuid-3',
            species_guess: 'Mock Species 3',
            taxon: mockTaxa[2], // Black Bear
            observed_on: '2024-01-03',
            time_observed_at: '2024-01-03T12:00:00Z',
            created_at: '2024-01-03T12:00:00Z',
            updated_at: '2024-01-03T12:00:00Z',
            place_guess: 'Mock Location 3',
            latitude: 40.7505,
            longitude: -73.9934,
            location: '40.7505,-73.9934',
            positional_accuracy: 10,
            public_positional_accuracy: 10,
            geoprivacy: null,
            taxon_geoprivacy: null,
            quality_grade: 'research',
            annotations: [],
            identifications_most_agree: true,
            identifications_most_disagree: false,
            comments_count: 0,
            photos: [
                {
                    id: 3,
                    license_code: 'CC-BY',
                    attribution: 'Mock Photo 3',
                    url: 'https://via.placeholder.com/500x500?text=Mock+Observation+3',
                    original_dimensions: { height: 500, width: 500 },
                },
            ],
        },
    ],
}

export class MockINatService {
    static getTaxa(ids: string[]): INatTaxaResponse {
        const taxa = mockTaxa.filter((taxon) =>
            ids.includes(taxon.id.toString())
        )
        return {
            results: taxa,
            per_page: 30,
            page: 1,
            total_results: taxa.length,
        }
    }

    static getObservations(
        params?: Record<string, unknown>
    ): INatObservationsResponse {
        let results = [...mockObservationsResponse.results]

        // Filter by taxon_id if provided
        if (params?.taxon_id) {
            const taxonId = params.taxon_id as string | number
            results = results.filter(
                (obs) => obs.taxon?.id.toString() === taxonId.toString()
            )
        }

        // Apply per_page limit if provided
        if (params?.per_page) {
            const perPage = parseInt(params.per_page as string) || 20
            results = results.slice(0, perPage)
        }

        // Sort by observed_on if requested
        if (params?.order_by === 'observed_on') {
            results.sort((a, b) => {
                const dateA = a.observed_on
                    ? new Date(a.observed_on).getTime()
                    : 0
                const dateB = b.observed_on
                    ? new Date(b.observed_on).getTime()
                    : 0
                return dateB - dateA
            })
        }

        return {
            ...mockObservationsResponse,
            results,
            total_results: results.length,
            per_page:
                (params?.per_page as number) ||
                mockObservationsResponse.per_page,
        }
    }

    static searchTaxa(
        query: string,
        params: Record<string, unknown> = {}
    ): INatTaxaResponse {
        console.log(
            'DEBUG: searchTaxa called with query:',
            query,
            'mockTaxa length:',
            mockTaxa.length
        )

        // Handle empty or short queries
        if (!query || query.length < 2) {
            return {
                results: [],
                per_page: (params.per_page as number) || 30,
                page: (params.page as number) || 1,
                total_results: 0,
            }
        }

        let filteredTaxa = mockTaxa.filter(
            (taxon) =>
                taxon.name.toLowerCase().includes(query.toLowerCase()) ||
                taxon.preferred_common_name
                    .toLowerCase()
                    .includes(query.toLowerCase())
        )

        console.log('DEBUG: filteredTaxa length:', filteredTaxa.length)

        // Apply additional filters if provided
        if (params.rank) {
            filteredTaxa = filteredTaxa.filter(
                (taxon) => taxon.rank === params.rank
            )
        }

        if (params.iconic_taxon_name) {
            filteredTaxa = filteredTaxa.filter(
                (taxon) =>
                    taxon.iconic_taxon_name.toLowerCase() ===
                    (params.iconic_taxon_name as string).toLowerCase()
            )
        }

        // Sort by relevance (exact matches first, then common name matches)
        filteredTaxa.sort((a, b) => {
            const queryLower = query.toLowerCase()
            const aExact = a.name.toLowerCase() === queryLower ? 1 : 0
            const bExact = b.name.toLowerCase() === queryLower ? 1 : 0
            if (aExact !== bExact) return bExact - aExact

            const aCommonExact =
                a.preferred_common_name.toLowerCase() === queryLower ? 1 : 0
            const bCommonExact =
                b.preferred_common_name.toLowerCase() === queryLower ? 1 : 0
            return bCommonExact - aCommonExact
        })

        // Pagination
        const perPage = Math.min((params.per_page as number) || 30, 200) // Cap at 200
        const page = Math.max((params.page as number) || 1, 1)
        const startIndex = (page - 1) * perPage
        const paginatedResults = filteredTaxa.slice(
            startIndex,
            startIndex + perPage
        )

        return {
            results: paginatedResults,
            per_page: perPage,
            page: page,
            total_results: filteredTaxa.length,
        }
    }

    static getPlaces(): {
        results: Array<{ id: number; name: string; display_name: string }>
    } {
        return {
            results: [
                {
                    id: 1,
                    name: 'Mock Place',
                    display_name: 'Mock Place, Mock State, USA',
                },
            ],
        }
    }

    static getSpeciesCounts(params: Record<string, unknown>): {
        total_results: number
        page: number
        per_page: number
        results: Array<{
            count: number
            taxon: {
                id: number
                name: string
                preferred_common_name: string
                iconic_taxon_name: string
                rank: string
                rank_level: number
            }
        }>
    } {
        // Mock species counts response for observations/species_counts endpoint
        const mockCounts = mockTaxa.map((taxon) => ({
            count: Math.floor(Math.random() * 100) + 1,
            taxon: {
                id: taxon.id,
                name: taxon.name,
                preferred_common_name: taxon.preferred_common_name,
                iconic_taxon_name: taxon.iconic_taxon_name,
                rank: taxon.rank,
                rank_level: taxon.rank_level,
            },
        }))

        return {
            total_results: mockCounts.length,
            page: (params.page as number) || 1,
            per_page: (params.per_page as number) || 20,
            results: mockCounts,
        }
    }

    static getTaxaByIds(ids: string[]): INatTaxaResponse {
        // Support for /taxa?id=1,2,3 format used by AI tools
        const taxa = mockTaxa.filter((taxon) =>
            ids.includes(taxon.id.toString())
        )
        return {
            results: taxa,
            per_page: 30,
            page: 1,
            total_results: taxa.length,
        }
    }
}
