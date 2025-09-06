// --- API Validation Schemas ---

import { z } from 'zod'

// iNaturalist API validation schemas
export const INatTaxonSchema = z.object({
    id: z.number(),
    rank: z.enum([
        'species',
        'genus',
        'family',
        'order',
        'class',
        'phylum',
        'kingdom',
    ]),
    rank_level: z.number(),
    iconic_taxon_id: z.number(),
    ancestor_ids: z.array(z.number()),
    is_active: z.boolean(),
    name: z.string(),
    parent_id: z.number(),
    ancestry: z.string(),
    extinct: z.boolean(),
    default_photo: z
        .object({
            id: z.number(),
            license_code: z.string().nullable(),
            attribution: z.string(),
            url: z.string(),
            original_dimensions: z.object({
                height: z.number(),
                width: z.number(),
            }),
            flags: z.array(z.unknown()),
            attribution_name: z.string().nullable(),
            square_url: z.string(),
            medium_url: z.string(),
        })
        .optional(),
    taxon_changes_count: z.number(),
    taxon_schemes_count: z.number(),
    observations_count: z.number(),
    flag_counts: z.object({
        resolved: z.number(),
        unresolved: z.number(),
    }),
    current_synonymous_taxon_ids: z.number().nullable(),
    atlas_id: z.number(),
    complete_species_count: z.number().nullable(),
    wikipedia_url: z.string(),
    matched_term: z.string(),
    iconic_taxon_name: z.string(),
    preferred_common_name: z.string(),
})

export const INatUserSchema = z.object({
    id: z.number(),
    login: z.string(),
    name: z.string().optional(),
    user_icon_url: z.string().optional(),
    observations_count: z.number().optional(),
    identifications_count: z.number().optional(),
})

export const INatPhotoSchema = z.object({
    id: z.number(),
    license_code: z.string().nullable(),
    attribution: z.string(),
    url: z.string(),
    original_dimensions: z.object({
        width: z.number(),
        height: z.number(),
    }),
    flags: z.array(z.unknown()),
    attribution_name: z.string().nullable(),
    square_url: z.string().optional(),
    small_url: z.string().optional(),
    medium_url: z.string().optional(),
    large_url: z.string().optional(),
})

export const INatAnnotationSchema = z.object({
    controlled_attribute_id: z.number(),
    controlled_value_id: z.number(),
    concatenated_attr_val: z.string(),
    controlled_attribute: z.object({
        id: z.number(),
        label: z.string(),
        multivalued: z.boolean(),
    }),
    controlled_value: z.object({
        id: z.number(),
        label: z.string(),
    }),
    user_id: z.number(),
    vote_score: z.number(),
    votes: z.array(
        z.object({
            vote_flag: z.boolean(),
            user_id: z.number(),
        })
    ),
})

export const INatObservationSchema = z.object({
    geojson: z
        .object({
            type: z.string(),
            coordinates: z.array(z.number()),
        })
        .optional(),
    id: z.number(),
    uuid: z.string(),
    species_guess: z.string().optional(),
    taxon: INatTaxonSchema.optional(),
    user: INatUserSchema,
    observed_on: z.string().optional(),
    time_observed_at: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    description: z.string().optional(),
    place_guess: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    location: z.string(),
    positional_accuracy: z.number().optional(),
    public_positional_accuracy: z.number().optional(),
    geoprivacy: z.string().nullable(),
    taxon_geoprivacy: z.string().nullable(),
    quality_grade: z.enum(['casual', 'needs_id', 'research']),
    annotations: z.array(INatAnnotationSchema),
    identifications_most_agree: z.boolean(),
    identifications_most_disagree: z.boolean(),
    comments_count: z.number(),
    photos: z.array(INatPhotoSchema),
    identifications_count: z.number().optional(),
    faves_count: z.number().optional(),
    cached_votes_total: z.number().optional(),
    sounds: z
        .array(
            z.object({
                id: z.number(),
                license_code: z.string().nullable(),
                attribution: z.string(),
                file_url: z.string(),
            })
        )
        .optional(),
})

// Request parameter validation schemas
export const INatTaxaSearchParamsSchema = z.object({
    q: z.string().optional(),
    taxon_id: z.number().optional(),
    rank: z.string().optional(),
    is_active: z.boolean().optional(),
    per_page: z.number().optional(),
    page: z.number().optional(),
})

export const INatObservationsSearchParamsSchema = z.object({
    q: z.string().optional(),
    taxon_id: z.number().optional(),
    user_id: z.number().optional(),
    place_id: z.number().optional(),
    project_id: z.number().optional(),
    quality_grade: z.enum(['casual', 'needs_id', 'research']).optional(),
    identified: z.boolean().optional(),
    captive: z.boolean().optional(),
    endemic: z.boolean().optional(),
    native: z.boolean().optional(),
    threatened: z.boolean().optional(),
    introduced: z.boolean().optional(),
    photos: z.boolean().optional(),
    sounds: z.boolean().optional(),
    geo: z.boolean().optional(),
    id_please: z.boolean().optional(),
    identifications: z.string().optional(),
    out_of_range: z.boolean().optional(),
    mappable: z.boolean().optional(),
    license: z.string().optional(),
    photo_license: z.string().optional(),
    sound_license: z.string().optional(),
    ofv_datatype: z.string().optional(),
    acc: z.boolean().optional(),
    geoprivacy: z.string().optional(),
    taxon_geoprivacy: z.string().optional(),
    created_on: z.string().optional(),
    observed_on: z.string().optional(),
    d1: z.string().optional(),
    d2: z.string().optional(),
    day: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
    hour: z.number().optional(),
    m: z.number().optional(),
    date: z.string().optional(),
    created_d1: z.string().optional(),
    created_d2: z.string().optional(),
    created_month: z.number().optional(),
    created_year: z.number().optional(),
    observed_month: z.number().optional(),
    observed_year: z.number().optional(),
    site_id: z.number().optional(),
    id: z.array(z.number()).optional(),
    not_id: z.array(z.number()).optional(),
    list_id: z.number().optional(),
    not_in_project: z.number().optional(),
    collection_id: z.number().optional(),
    not_in_collection: z.number().optional(),
    per_page: z.number().optional(),
    page: z.number().optional(),
    order: z.string().optional(),
    order_by: z.string().optional(),
})

// LocationIQ validation schemas
export const LocationIQPlaceSchema = z.object({
    place_id: z.string(),
    licence: z.string(),
    osm_type: z.string(),
    osm_id: z.string(),
    boundingbox: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    class: z.string(),
    type: z.string(),
    importance: z.number(),
    icon: z.string().optional(),
    address: z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
        county: z.string().optional(),
        postcode: z.string().optional(),
        road: z.string().optional(),
        house_number: z.string().optional(),
        suburb: z.string().optional(),
        town: z.string().optional(),
        village: z.string().optional(),
        municipality: z.string().optional(),
        region: z.string().optional(),
        state_district: z.string().optional(),
        neighbourhood: z.string().optional(),
    }),
})

// Error response schemas
export const ApiErrorSchema = z.object({
    error: z.string(),
    message: z.string().optional(),
    status: z.number().optional(),
    code: z.string().optional(),
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
    itemSchema: T
) =>
    z.object({
        results: z.array(itemSchema),
        total_results: z.number(),
        page: z.number(),
        per_page: z.number(),
        total_pages: z.number().optional(),
    })

// Type exports
export type INatTaxonInput = z.infer<typeof INatTaxonSchema>
export type INatUserInput = z.infer<typeof INatUserSchema>
export type INatPhotoInput = z.infer<typeof INatPhotoSchema>
export type INatAnnotationInput = z.infer<typeof INatAnnotationSchema>
export type INatObservationInput = z.infer<typeof INatObservationSchema>
export type INatTaxaSearchParamsInput = z.infer<
    typeof INatTaxaSearchParamsSchema
>
export type INatObservationsSearchParamsInput = z.infer<
    typeof INatObservationsSearchParamsSchema
>
export type LocationIQPlaceInput = z.infer<typeof LocationIQPlaceSchema>
export type ApiErrorInput = z.infer<typeof ApiErrorSchema>
