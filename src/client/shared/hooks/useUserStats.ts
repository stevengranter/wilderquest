import { useQuery } from '@tanstack/react-query'
import api from '@/core/api/axios'

export interface UserStats {
    totalQuestsParticipated: number
    activeQuests: number
    taxaFound: number
}

export function useUserStats(username: string | undefined) {
    return useQuery({
        queryKey: ['userStats', username],
        queryFn: () =>
            api
                .get<UserStats>(`/users/${username}/stats`)
                .then((res) => res.data),
        enabled: !!username,
    })
}
