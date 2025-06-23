import { useEffect, useState } from 'react'
import api from '@/api/api'
import axios from 'axios'
import { useAuth } from '@/hooks/useAuth'
import { Collection } from '../../../types/types'

export function useCollections() {
    const { token } = useAuth()
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            console.log('User not authenticated. No token found.')
        }
        setIsLoading(true)
        setIsError(null)
        try {
            api.get('/collections/mine').then((res) => {
                console.log(res.data)
                setCollections(res.data)
                setIsError(null)
                setIsLoading(false)
            })
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const message =
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to fetch collections.'
                setIsError(message)
                setIsLoading(false)
            } else {
                setIsError('An unexpected error occurred.')
                setIsLoading(false)
            }
        }
    }, [token])

    return { collections, isError, isLoading }
}
