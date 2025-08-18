// src/client/routes/loaders.ts
import { QueryClient } from '@tanstack/react-query'
import { fetchQuest, fetchTaxa } from '@/hooks/useQuest'
import { QuestWithTaxa } from '../../server/repositories/QuestRepository'

export const questLoader =
    (queryClient: QueryClient) =>
    async ({ params }: { params: any }) => {
        const questQuery = {
            queryKey: ['quest', params.questId],
            queryFn: () => fetchQuest(params.questId),
            staleTime: 1000 * 60 * 5, // 5 minutes
        }

        const quest : QuestWithTaxa =
            queryClient.getQueryData(questQuery.queryKey) ??
            (await queryClient.fetchQuery(questQuery))
        let taxa

        console.log("questLoader quest:")
        console.log(quest)

        if (quest && quest.taxon_ids) {
            const taxaQuery = {
                queryKey: ['taxa', params.questId],
                queryFn: () => fetchTaxa(quest.taxon_ids),
                staleTime: 1000 * 60 * 5, // 5 minutes
            }
            taxa = await (queryClient.getQueryData(taxaQuery.queryKey) ??
                (await queryClient.fetchQuery(taxaQuery)))
        }

        return {quest, taxa}
    }
