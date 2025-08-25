import { z } from 'zod'

export const SharedQuestProgressSchema = z.object({
    id: z.number().int(),
    quest_share_id: z.number().int(),
    taxon_id: z.number().int(),   // refers to quests_to_taxa.id
    observed_at: z.date(),
});

export type SharedQuestProgress = z.infer<typeof SharedQuestProgressSchema>;
export type AggregatedProgress = {
    mapping_id: number // p.taxon_id
    count: number // COUNT(*)
    last_observed_at: Date // p_last.observed_at
    last_display_name: string | null // COALESCE(s_last.guest_name, u.username)
}
export type DetailedProgress = {
    progress_id: number // p.id
    mapping_id: number // p.taxon_id
    observed_at: Date // p.observed_at
    quest_share_id: number // s.id
    display_name: string | null // COALESCE(s.guest_name, u.username)
}
export type LeaderboardEntry = {
    display_name: string | null
    observation_count: number
}