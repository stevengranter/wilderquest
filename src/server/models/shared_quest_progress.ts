import { z } from 'zod'

export const SharedQuestProgressSchema = z.object({
    id: z.number().int(),
    quest_share_id: z.number().int(),
    taxon_id: z.number().int(), // refers to quests_to_taxa.id
    observed_at: z.date(),
})

export interface SharedQuestProgress
    extends z.infer<typeof SharedQuestProgressSchema> {}

export type AggregatedProgress = {
    mapping_id: number // p.taxon_id
    count: number // COUNT(*)
    last_observed_at: Date // p_last.observed_at
    last_display_name: string | null // Complex logic: guest_name if set, username for owner's direct share, 'Guest' otherwise
}
export type DetailedProgress = {
    progress_id: number // p.id
    mapping_id: number // p.taxon_id
    observed_at: Date // p.observed_at
    quest_share_id: number // s.id
    display_name: string | null // Complex logic: guest_name if set, username for owner's direct share, 'Guest' otherwise
}
export type LeaderboardEntry = {
    display_name: string | null
    observation_count: number
    has_accessed_page?: boolean
    last_progress_at?: Date | null
    invited_at?: Date
}
