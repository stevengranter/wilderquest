import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/api'
import { chunk } from 'lodash'
import { toast } from 'sonner'
import titleCase from '@/components/search/titleCase'
import { Quest } from '../../server/repositories/QuestRepository'

type TaxonMapping = { id: number; quest_id: number; taxon_id: number; };
type ProgressData = { mappings: TaxonMapping[]; aggregatedProgress: any[]; detailedProgress: any[]; };
type GuestProgressData = { aggregatedProgress: any[]; detailedProgress: any[]; };

const fetchQuest = async (questId?: string | number): Promise<Quest | null> => {
    const { data } = await api.get(`/quests/${questId}`);
    console.log(data)
    return data;
};

const fetchQuestByToken = async (token?: string) => {
    const { data } = await api.get(`/quest-sharing/shares/token/${token}`);
    console.log(data);
    return data;
};

const fetchTaxa = async (taxonIds: number[]): Promise<any[]> => {
    const chunks = chunk(taxonIds, 30);
    const results: any[] = [];
    for (const c of chunks) {
        const { data } = await api.get(`/iNatAPI/taxa/${c.join(',')}`);
        if (data.results) results.push(...data.results);
    }
    return results;
};

const fetchMappingsAndProgress = async (qid: string | number): Promise<ProgressData> => {
    const [m, a, d] = await Promise.all([
        api.get(`/quest-sharing/quests/${qid}/mappings`),
        api.get(`/quest-sharing/quests/${qid}/progress/aggregate`),
        api.get(`/quest-sharing/quests/${qid}/progress/detailed`),
    ]);
    return { mappings: m.data || [], aggregatedProgress: a.data || [], detailedProgress: d.data || [] };
};

const fetchGuestProgress = async (token: string): Promise<GuestProgressData> => {
    const [p, a] = await Promise.all([
        api.get(`/quest-sharing/shares/token/${token}/progress`),
        api.get(`/quest-sharing/shares/token/${token}/progress/aggregate`),
    ]);
    return { aggregatedProgress: a.data || [], detailedProgress: p.data || [] };
};

export const useQuest = ({ questId, token }: { questId?: string | number; token?: string; }) => {
    const queryClient = useQueryClient();

    const questQuery = useQuery({ queryKey: ['quest', questId], queryFn: () => fetchQuest(questId), enabled: !!questId });
    const sharedQuestQuery = useQuery({ queryKey: ['sharedQuest', token], queryFn: () => fetchQuestByToken(token), enabled: !!token });

    const quest = questQuery.data || sharedQuestQuery.data?.quest;
    const share = sharedQuestQuery.data?.share;
    console.log('quest', quest);
    const taxaQuery = useQuery({ queryKey: ['taxa', quest?.id], queryFn: () => fetchTaxa(quest!.taxon_ids!), enabled: !!quest?.taxon_ids?.length });

    const progressQuery = useQuery({ queryKey: ['progress', quest?.id], queryFn: () => fetchMappingsAndProgress(quest!.id), enabled: !!quest?.id && !!questId });
    const guestProgressQuery = useQuery({ queryKey: ['guestProgress', token], queryFn: () => fetchGuestProgress(token!), enabled: !!token });

    const updateStatus = useMutation({
        mutationFn: (status: 'pending' | 'active' | 'paused' | 'ended') => api.patch(`/quests/${quest!.id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quest', questId] });
            queryClient.invalidateQueries({ queryKey: ['sharedQuest', token] });
        },
        onError: () => toast.error('Failed to update quest status'),
    });

    // useEffect for side-effects previously done in onSuccess
    useEffect(() => {
        if (progressQuery.isSuccess && progressQuery.data) {
            console.log('Progress data:', progressQuery.data);
        }
    }, [progressQuery.isSuccess, progressQuery.data]);

    useEffect(() => {
        if (guestProgressQuery.isSuccess && guestProgressQuery.data) {
            console.log('Guest progress data:', guestProgressQuery.data);
        }
    }, [guestProgressQuery.isSuccess, guestProgressQuery.data]);

    useEffect(() => {
        if (!quest?.id || !taxaQuery.data) return;
        const eventSource = new EventSource(`/api/quests/${quest.id}/events`);
        eventSource.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'QUEST_STATUS_UPDATED') {
                toast.info(`Quest status updated to ${data.payload.status}`);
                queryClient.invalidateQueries({ queryKey: ['quest', questId] });
                queryClient.invalidateQueries({ queryKey: ['sharedQuest', token] });
            } else if (['SPECIES_FOUND', 'SPECIES_UNFOUND'].includes(data.type)) {
                const guestName = data.payload.guestName || (data.payload.owner ? 'The owner' : 'A guest');
                const mappings = progressQuery.data?.mappings || sharedQuestQuery.data?.taxa_mappings;
                const mapping = mappings.find((m: TaxonMapping) => m.id === data.payload.mappingId);
                const species = taxaQuery.data?.find((t: any) => t.id === mapping?.taxon_id);
                const speciesName = species?.preferred_common_name
                    ? titleCase(species.preferred_common_name)
                    : species?.name || 'a species';

                if (data.type === 'SPECIES_FOUND') toast.success(`${guestName} found ${speciesName}!`);
                else toast.info(`${guestName} unmarked ${speciesName}.`);

                queryClient.invalidateQueries({ queryKey: ['progress', quest.id] });
                queryClient.invalidateQueries({ queryKey: ['guestProgress', token] });
                queryClient.invalidateQueries({ queryKey: ['sharedQuest', token] });
            }
        };
        return () => eventSource.close();
    }, [quest?.id, taxaQuery.data, progressQuery.data, sharedQuestQuery.data, queryClient, questId, token]);

    const finalProgress = questId ? progressQuery.data : { ...guestProgressQuery.data, mappings: sharedQuestQuery.data?.taxa_mappings };

    return {
        questData: quest,
        taxa: taxaQuery.data,
        share,
        ...finalProgress,
        isLoading:
            questQuery.isLoading ||
            sharedQuestQuery.isLoading ||
            taxaQuery.isLoading ||
            progressQuery.isLoading ||
            guestProgressQuery.isLoading,
        isError: questQuery.isError || sharedQuestQuery.isError,
        updateStatus: updateStatus.mutate,
    };
};
