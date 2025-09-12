import { GuestProgressData, ProgressData, Quest } from '@/types/questTypes'
import axiosInstance from '@/lib/axios'
import { clientDebug } from '@/lib/debug'
import chunk from 'lodash/chunk'

export const fetchQuest = async (
    questId?: string | number
): Promise<Quest | null> => {
    const { data } = await axiosInstance.get(`/quests/${questId}`)
    clientDebug.quests('Fetched quest %s: %o', questId, data)
    return data
}
export const fetchQuestByToken = async (token?: string) => {
    console.log(
        'fetchQuestByToken called with token:',
        token?.substring(0, 10) + '...'
    )
    try {
        const { data } = await axiosInstance.get(
            `/quest-sharing/shares/token/${token}`
        )
        console.log('fetchQuestByToken response:', {
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            hasQuest: !!data?.quest,
            hasShare: !!data?.share,
            hasTaxaMappings: !!data?.taxa_mappings,
            questKeys: data?.quest ? Object.keys(data.quest) : [],
            shareKeys: data?.share ? Object.keys(data.share) : [],
        })
        clientDebug.quests('Fetched quest by token: %o', data)
        return data
    } catch (error) {
        console.error('fetchQuestByToken error:', error)
        throw error
    }
}
export const fetchTaxa = async (taxonIds: number[]) => {
    if (!taxonIds || taxonIds.length === 0) {
        return []
    }

    // Filter out invalid taxon IDs (null, undefined, empty strings, or non-positive numbers)
    const validTaxonIds = taxonIds.filter(
        (id) => id && typeof id === 'number' && id > 0
    )

    if (validTaxonIds.length === 0) {
        return []
    }

    const taxonIdChunks = chunk(validTaxonIds, 30)
    const taxaData = await Promise.all(
        taxonIdChunks.map(async (ids) => {
            const fields =
                'id,name,preferred_common_name,default_photo,iconic_taxon_name,rank,observations_count,wikipedia_url'
            const { data } = await axiosInstance.get(
                `/iNatAPI/taxa/${ids.join(',')}?fields=${fields}`
            )
            return data.results || []
        })
    )
    return taxaData.flatMap((data) => data)
}

export const fetchMappingsAndProgress = async (
    qid: string | number
): Promise<ProgressData> => {
    const [m, a, d] = await Promise.all([
        axiosInstance.get(`/quest-sharing/quests/${qid}/mappings`),
        axiosInstance.get(`/quest-sharing/quests/${qid}/progress/aggregate`),
        axiosInstance.get(`/quest-sharing/quests/${qid}/progress/detailed`),
    ])
    return {
        mappings: m.data || [],
        aggregatedProgress: a.data || [],
        detailedProgress: d.data || [],
    }
}
export const fetchGuestProgress = async (
    token: string
): Promise<GuestProgressData> => {
    const [p, a] = await Promise.all([
        axiosInstance.get(`/quest-sharing/shares/token/${token}/progress`),
        axiosInstance.get(
            `/quest-sharing/shares/token/${token}/progress/aggregate`
        ),
    ])
    return { aggregatedProgress: a.data || [], detailedProgress: p.data || [] }
}
export const fetchLeaderboard = async (questId: string | number) => {
    const { data } = await axiosInstance.get(
        `/quest-sharing/quests/${questId}/progress/leaderboard`
    )
    clientDebug.quests('Leaderboard: ', data)
    return data
}
export const fetchLeaderboardByToken = async (token: string) => {
    const { data } = await axiosInstance.get(
        `/quest-sharing/shares/token/${token}/progress/leaderboard`
    )
    return data
}
