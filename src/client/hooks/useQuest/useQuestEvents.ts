import { useEffect } from 'react'
import { useQueryClient, QueryClient } from '@tanstack/react-query'
import { clientDebug } from '@/lib/debug'
import { toast } from 'sonner'
import React from 'react'
import QuestEventToast from '@/components/QuestEventToast'
import { INatTaxon } from '@shared/types/iNaturalist'
import { QuestMapping, ProgressData } from '@/types/questTypes'

interface QuestEventConfig {
    questId: number
    token?: string
    getValidToken?: () => Promise<string | null>
    isOwner: boolean
}

interface SpeciesEvent {
    type: 'SPECIES_FOUND' | 'SPECIES_UNFOUND'
    payload: {
        guestName?: string
        mappingId: number
    }
}

interface QuestStatusEvent {
    type: 'QUEST_STATUS_UPDATED'
    payload: {
        status: string
    }
}

interface QuestEditingEvent {
    type: 'QUEST_EDITING_STARTED'
    payload: {
        message: string
    }
}

type QuestEvent = SpeciesEvent | QuestStatusEvent | QuestEditingEvent

export const useQuestEvents = ({
    questId,
    token,
    getValidToken,
    isOwner,
}: QuestEventConfig) => {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!questId) return

        let eventSource: EventSource | null = null

        const setupEventSource = async () => {
            try {
                // Build EventSource URL based on context
                let eventSourceUrl: string
                if (isOwner) {
                    // For owners, get the current access token synchronously from localStorage
                    const accessToken = localStorage.getItem('access_token')
                    eventSourceUrl = accessToken
                        ? `/api/quests/${questId}/events?token=${encodeURIComponent(accessToken)}`
                        : `/api/quests/${questId}/events`
                } else if (token) {
                    eventSourceUrl = `/api/quests/${questId}/events?token=${encodeURIComponent(token)}`
                } else {
                    return // No valid authentication
                }

                clientDebug.events(
                    `Setting up EventSource for quest ${questId}`
                )
                clientDebug.events(`EventSource URL: ${eventSourceUrl}`)

                eventSource = new EventSource(eventSourceUrl, {
                    withCredentials: true,
                })

                eventSource.onopen = () => {
                    clientDebug.events('EventSource connected successfully')
                }

                eventSource.onmessage = (e) => {
                    if (!e.data || e.data.trim() === '') return

                    try {
                        const data: QuestEvent = JSON.parse(e.data)
                        handleQuestEvent(data, questId, token, queryClient)
                    } catch (error) {
                        clientDebug.events('Error parsing event data:', error)
                    }
                }

                eventSource.onerror = (error) => {
                    clientDebug.events('EventSource error:', error)
                }

                eventSource.addEventListener('close', () => {
                    clientDebug.events('EventSource connection closed')
                })
            } catch (error) {
                clientDebug.events('Failed to setup EventSource:', error)
            }
        }

        setupEventSource()

        return () => {
            if (eventSource) {
                clientDebug.events('Cleaning up EventSource')
                eventSource.close()
            }
        }
    }, [questId, token, getValidToken, isOwner, queryClient])
}

const handleQuestEvent = (
    data: QuestEvent,
    questId: number,
    token: string | undefined,
    queryClient: QueryClient
) => {
    clientDebug.events('Processing quest event:', data.type)

    if (data.type === 'QUEST_STATUS_UPDATED') {
        handleQuestStatusUpdate(
            data.payload.status,
            questId,
            token,
            queryClient
        )
    } else if (data.type === 'QUEST_EDITING_STARTED') {
        handleQuestEditingStarted(data.payload.message)
    } else if (
        data.type === 'SPECIES_FOUND' ||
        data.type === 'SPECIES_UNFOUND'
    ) {
        handleSpeciesEvent(data, questId, token, queryClient)
    } else {
        clientDebug.events('Unknown event type:', data.type)
    }
}

const handleQuestStatusUpdate = (
    status: string,
    questId: number,
    token: string | undefined,
    queryClient: QueryClient
) => {
    toast.info(`Quest status updated to ${status}`)

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['quest', questId] })
    if (token) {
        queryClient.invalidateQueries({ queryKey: ['sharedQuest', token] })
    }
}

const handleQuestEditingStarted = (message: string) => {
    toast.info('Quest Editing in Progress', {
        description: message,
        duration: 8000,
    })
}

const handleSpeciesEvent = (
    data: SpeciesEvent,
    questId: number,
    token: string | undefined,
    queryClient: QueryClient
) => {
    // Get cached data based on context
    let mappings: QuestMapping[] | undefined
    let taxaData: INatTaxon[] | undefined

    if (token) {
        // Guest context
        const sharedQuestData = queryClient.getQueryData([
            'sharedQuest',
            token,
        ]) as { taxa_mappings?: QuestMapping[] } | undefined
        mappings = sharedQuestData?.taxa_mappings
        taxaData = queryClient.getQueryData(['taxa', questId]) as
            | INatTaxon[]
            | undefined
    } else {
        // Owner context
        const progressData = queryClient.getQueryData(['progress', questId]) as
            | ProgressData
            | undefined
        mappings = progressData?.mappings
        taxaData = queryClient.getQueryData(['taxa', questId]) as
            | INatTaxon[]
            | undefined
    }

    if (!mappings) return

    const mapping = mappings.find(
        (m: QuestMapping) => m.id === data.payload.mappingId
    )
    if (!mapping) return

    const species = taxaData?.find((t: INatTaxon) => t.id === mapping.taxon_id)
    const speciesName =
        species?.preferred_common_name || species?.name || 'a species'

    const guestName = data.payload.guestName || 'A guest'
    const action = data.type === 'SPECIES_FOUND' ? 'found' : 'unmarked'

    // Show notification
    toast(
        React.createElement(QuestEventToast, {
            guestName,
            speciesName,
            action,
            speciesImage: species?.default_photo?.square_url,
        }),
        {
            position: 'top-left',
            style: {
                padding: 0,
                margin: 0,
                width: '90svw',
                borderWidth: 0,
                boxShadow: 'none',
                background: 'none',
                outline: 'none',
            },
        }
    )

    // Invalidate queries
    if (token) {
        queryClient.invalidateQueries({ queryKey: ['guestProgress', token] })
        queryClient.invalidateQueries({ queryKey: ['leaderboard', token] })
    } else {
        queryClient.invalidateQueries({ queryKey: ['progress', questId] })
        queryClient.invalidateQueries({ queryKey: ['leaderboard', questId] })
    }
}
