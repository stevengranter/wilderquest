import axios from 'axios' // Import axios for error checking
import { useEffect, useState } from 'react'
import api from '@/api/api'
import { useAuth } from '@/hooks/useAuth'
import { Collection } from '../../../types/types'

export function useCollections(
    userIdFromProps?: string | number | null | undefined
) {
    const { token, user } = useAuth()
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCollections = async () => {
            setIsLoading(true)
            setIsError(null)

            let targetUserId: string | number | null | undefined =
                userIdFromProps

            // If userIdFromProps is not provided, try to use the authenticated user's ID
            if (!targetUserId && user && user.id) {
                targetUserId = user.id
            }

            if (!targetUserId) {
                console.log(
                    'No user ID provided or available from authentication. Cannot fetch collections.'
                )
                setIsLoading(false)
                return
            }

            if (!token) {
                console.log(
                    'User not authenticated. No token found. Cannot fetch collections.'
                )
                setIsLoading(false)
                // Optionally set an error here if unauthenticated access is truly an error
                // setIsError('Authentication required to fetch collections.');
                return
            }

            try {
                const endpoint = `/collections/user/${targetUserId}`
                const response = await api.get(endpoint)
                setCollections(response.data)
                setIsError(null)
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    const message =
                        err.response?.data?.message ||
                        err.message ||
                        'Failed to fetch collections.'
                    setIsError(message)
                } else {
                    setIsError('An unexpected error occurred.')
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchCollections()
    }, [userIdFromProps, token, user]) // Depend on userIdFromProps, token, and user

    return { collections, isError, isLoading }
}
