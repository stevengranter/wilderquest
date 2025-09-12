// Hook for species progress management
import {
    AggregatedProgress,
    DetailedProgress,
    Quest,
    QuestMapping,
    Share,
} from '@/types/questTypes'
import { INatTaxon } from '@shared/types/iNaturalist'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import axiosInstance from '@/lib/axios'
import { clientDebug } from '@/lib/debug'
import { toast } from 'sonner'

export const useSpeciesProgress = ({
    mappings,
    detailedProgress,
}: {
    mappings?: QuestMapping[]
    detailedProgress?: DetailedProgress[]
}) => {
    const queryClient = useQueryClient()

    const handleProgressUpdate = useCallback(
        async (
            mapping: QuestMapping,
            isOwner: boolean,
            user?: { id: number; name?: string; username?: string },
            share?: Share,
            questData?: Quest | { id: number | string },
            token?: string
        ) => {
            if (!mapping) return

            try {
                const userDisplayName = isOwner
                    ? user?.username
                    : share?.guest_name
                const progress = detailedProgress?.find(
                    (p) =>
                        p.display_name === userDisplayName &&
                        p.mapping_id === mapping.id
                )

                const observed = !progress
                const endpoint =
                    isOwner && questData
                        ? `/quest-sharing/quests/${questData.id}/progress/${mapping.id}`
                        : `/quest-sharing/shares/token/${token}/progress/${mapping.id}`

                await axiosInstance.post(endpoint, { observed })
                clientDebug.quests('Progress updated')

                // Invalidate relevant queries
                queryClient.invalidateQueries({
                    queryKey: ['progress', questData?.id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['guestProgress', token],
                })
            } catch (_error) {
                toast.error('Action failed')
            }
        },
        [detailedProgress, queryClient]
    )

    const getAvatarOverlay = useCallback(
        (recentEntries: DetailedProgress[], questMode: string) => {
            if (recentEntries.length > 0) {
                if (questMode === 'competitive') {
                    // For competitive mode, show only the most recent finder
                    const mostRecentEntry = recentEntries.sort(
                        (a, b) =>
                            new Date(b.observed_at).getTime() -
                            new Date(a.observed_at).getTime()
                    )[0]
                    return {
                        username: mostRecentEntry.display_name,
                        isRegistered: mostRecentEntry.is_registered_user,
                    }
                } else if (questMode === 'cooperative') {
                    // For cooperative mode, show all users who found it
                    const uniqueEntries = recentEntries.filter(
                        (entry, index, arr) =>
                            arr.findIndex(
                                (e) => e.display_name === entry.display_name
                            ) === index
                    )

                    // Find the first finder (earliest observation)
                    const firstFinderEntry = recentEntries.sort(
                        (a, b) =>
                            new Date(a.observed_at).getTime() -
                            new Date(b.observed_at).getTime()
                    )[0]

                    return {
                        users: uniqueEntries.map((entry) => ({
                            username: entry.display_name,
                            isRegistered: entry.is_registered_user,
                        })),
                        firstFinder: firstFinderEntry.display_name,
                    }
                }
            }
            return null
        },
        []
    )

    return {
        handleProgressUpdate,
        getAvatarOverlay,
    }
}
