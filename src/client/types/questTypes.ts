import { z } from 'zod'
import { INatTaxon } from '@shared/types/iNaturalist'

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

export type QuestStatus = 'pending' | 'active' | 'paused' | 'ended'
export type QuestMode = 'competitive' | 'cooperative'
export type ClientQuest = Quest & {
    username: string
}
export type QuestMapping = {
    id: number
    quest_id: number
    taxon_id: number
    created_at: string
}
export interface AggregatedProgress {
    mapping_id: number
    count: number
    last_observed_at: string
    last_display_name: string | 'Guest'
}
export type DetailedProgress = {
    progress_id: number
    mapping_id: number
    observed_at: string
    display_name: string | 'Guest'
    is_registered_user?: boolean
}
export type Share = {
    guest_name: string
}
export type LeaderboardEntry = {
    display_name: string | 'Guest'
    observation_count: number
    has_accessed_page?: boolean
    last_progress_at?: Date | null
    invited_at?: Date
    is_primary?: boolean
    is_registered_user?: boolean
}
export interface SpeciesCardWithObservationsProps {
    species: INatTaxon & {
        mapping?: QuestMapping
        progressCount: number
        recentEntries: DetailedProgress[]
    }
    questData: ClientQuest
    found: boolean
}

// Common interface for quest data
export interface QuestDataResult {
    questData: Quest | null | undefined
    taxa: INatTaxon[]
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    detailedProgress?: DetailedProgress[]
    leaderboard?: LeaderboardEntry[]
    share?: Share
    isLoading: boolean
    isTaxaLoading: boolean
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    isError: boolean
    isProgressError?: boolean
    isLeaderboardError?: boolean
    isTaxaError?: boolean
    updateStatus?: (status: 'pending' | 'active' | 'paused' | 'ended') => void
    fetchNextTaxaPage: () => void
}

export type ProgressData = {
    mappings: QuestMapping[]
    aggregatedProgress: AggregatedProgress[]
    detailedProgress: DetailedProgress[]
}
export type GuestProgressData = {
    aggregatedProgress: AggregatedProgress[]
    detailedProgress: DetailedProgress[]
}
