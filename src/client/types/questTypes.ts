import { z } from 'zod'
import type { INatTaxon } from '@shared/types/iNaturalist'

export const QuestSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    created_at: z.date(),
    updated_at: z.date(),
    starts_at: z.date().nullable(), // Date | null
    ends_at: z.date().nullable(),
    description: z.string().optional(),
    is_private: z.boolean(),
    user_id: z.number().int(),
    username: z.string().optional(),
    status: z.enum(['pending', 'active', 'paused', 'ended']),
    location_name: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    mode: z.enum(['competitive', 'cooperative']),
})

export interface Quest extends z.infer<typeof QuestSchema> {}

export interface QuestWithTaxa extends Quest {
    taxon_ids: number[]
    photoUrl?: string | null
    username?: string
}

export interface TaxonData {
    id: number
    name: string
    preferred_common_name: string
    rank?: INatTaxon['rank']
    default_photo?: INatTaxon['default_photo']
    iconic_taxon_name?: string
    observations_count?: number
    wikipedia_url?: string
}
