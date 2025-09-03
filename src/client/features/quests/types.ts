import { Quest } from '../../../server/models/quests'
import { INatTaxon } from '@shared/types/iNatTypes'

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

export type AggregatedProgress = {
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
}

export type SpeciesCardWithObservationsProps = {
    species: INatTaxon & {
        mapping?: QuestMapping
        progressCount: number
        recentEntries: DetailedProgress[]
    }
    questData: ClientQuest
    found: boolean
}
