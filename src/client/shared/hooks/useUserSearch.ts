import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '@/core/auth/useAuth'

export interface SafeUser {
    id: number
    username: string
    created_at: string
    updated_at: string
}

export interface UserSearchResponse {
    users: SafeUser[]
    pagination: {
        total: number
        limit: number
        offset: number
    }
}

export const useUserSearch = (query: string, enabled: boolean = true) => {
    const { getValidToken } = useAuth()

    return useQuery<UserSearchResponse, Error>({
        queryKey: ['userSearch', query],
        queryFn: async () => {
            const token = await getValidToken()
            if (!token) {
                throw new Error('Authentication required')
            }

            const response = await axios.get<UserSearchResponse>(
                '/api/users/search',
                {
                    params: {
                        q: query,
                        limit: 20,
                        offset: 0,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            return response.data
        },
        enabled: enabled && query.length >= 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry on authentication errors
            if (error.message === 'Authentication required') {
                return false
            }
            return failureCount < 2
        },
    })
}
