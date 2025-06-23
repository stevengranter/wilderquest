import axios from 'axios'
import { useEffect, useState } from 'react'
import api from '@/api/api'
import { useAuth } from '@/hooks/useAuth'
import { Collection } from './collection.types'

export function useCollections(
    userIdFromProps?: string | number | null | undefined
) {
    const { token, user } = useAuth()
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<string | null>(null)
    const [taxa, setTaxa] = useState<number[] | null>(null)

    useEffect(() => {
        if (!collections) return

        const taxon_ids = collections.map((collection) => {
            return collection.taxon_ids
        })

        if (taxon_ids.length === 0) {
            setTaxa(null) // Set to null if there are no taxon_ids
            return
        }

        const flattenedTaxa = taxon_ids.flat() as (number | undefined)[] // Explicitly type after flat() for clarity

        // Filter out undefined values and assert the type
        const uniqueTaxa: number[] = [
            ...new Set(
                flattenedTaxa.filter((id): id is number => id !== undefined),
            ),
        ]

        console.log(uniqueTaxa)
        setTaxa(uniqueTaxa)
    }, [collections])

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
                console.log(response.data)
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
    }, [userIdFromProps, token, user])

    return { collections, taxa, isError, isLoading }
}
