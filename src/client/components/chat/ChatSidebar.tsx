'use client'

import type React from 'react'
import { useEffect, useMemo, useReducer, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar'
import { useAppContext } from '@/contexts/app-context'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import {
    BookOpen,
    Bot,
    ExternalLink,
    Globe,
    Loader2,
    Newspaper,
    Send,
} from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Chat sidebar state
type ChatState = {
    inputValue: string;
    locationGranted: boolean;
    hasAppendedLocationResponse: boolean;
    lastProcessedMessageId: string | null;
};

// Chat sidebar actions
type ChatAction =
    | { type: 'SET_INPUT_VALUE'; payload: string }
    | { type: 'SET_LOCATION_GRANTED'; payload: boolean }
    | { type: 'SET_HAS_APPENDED_LOCATION_RESPONSE'; payload: boolean }
    | { type: 'SET_LAST_PROCESSED_MESSAGE_ID'; payload: string | null }
    | { type: 'RESET_INPUT' };

const initialChatState: ChatState = {
    inputValue: '',
    locationGranted: false,
    hasAppendedLocationResponse: false,
    lastProcessedMessageId: null,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
    switch (action.type) {
        case 'SET_INPUT_VALUE':
            return { ...state, inputValue: action.payload }
        case 'SET_LOCATION_GRANTED':
            return { ...state, locationGranted: action.payload }
        case 'SET_HAS_APPENDED_LOCATION_RESPONSE':
            return { ...state, hasAppendedLocationResponse: action.payload }
        case 'SET_LAST_PROCESSED_MESSAGE_ID':
            return { ...state, lastProcessedMessageId: action.payload }
        case 'RESET_INPUT':
            return { ...state, inputValue: '' }
        default:
            return state
    }
}

// Helper function to safely convert to a Set
function ensureSet(value: any): Set<string> {
    if (value instanceof Set) return value
    if (Array.isArray(value)) return new Set(value)
    if (value == null) return new Set()
    // If it's a function or other non-iterable, return empty Set
    try {
        return new Set(Object.values(value))
    } catch (e) {
        console.warn('Could not convert value to Set:', value)
        return new Set()
    }
}

// Helper function to simplify card/result data for the LLM
function simplifyCardForLLM(
    card: any,
    searchType: 'species' | 'observations' | 'collections',
): any {
    if (!card) return null

    // Common fields
    const simplified = {
        id: card.id,
    }

    switch (searchType) {
        case 'species':
            return {
                ...simplified,
                name: card.name,
                preferred_common_name: card.preferred_common_name,
                rank: card.rank,
                wikipedia_url: card.wikipedia_url,
            }
        case 'observations':
            return {
                ...simplified,
                species_guess: card.species_guess,
                observed_on: card.observed_on,
                place_guess: card.place_guess,
            }
        case 'collections':
            return {
                ...simplified,
                title: card.title,
                slug: card.slug,
            }
        default:
            return simplified
    }
}

export default function ChatSidebar() {
    const {
        location,
        setLocation,
        results: cards,
        setResults: setCards,
        filteredResults,
        selectedIds: rawSelectedIds,
        setSelectedIds,
        addToSelection,
        removeFromSelection,
        clearSelection,
        filters,
        setFilters,
        clearFilters,
        query,
        setQuery,
        submitQuery,
        viewMode,
        setViewMode,
        searchType,
        setSearchType,
    } = useAppContext()

    // Safely convert selectedIds to a Set
    const selectedIds = useMemo(
        () => ensureSet(rawSelectedIds),
        [rawSelectedIds],
    )

    const [chatState, chatDispatch] = useReducer(chatReducer, initialChatState)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Use useMemo to memoize simplifiedCurrentCards and simplifiedSelectedCards
    const simplifiedCurrentCards = useMemo(
        () => cards.map((card) => simplifyCardForLLM(card, searchType)),
        [cards, searchType],
    )

    // Get selected cards based on selectedIds - ensure it's a Set
    const selectedCards = useMemo(() => {
        return cards.filter((card) => selectedIds.has(card.id.toString()))
    }, [cards, selectedIds])

    const simplifiedSelectedCards = useMemo(
        () => selectedCards.map((card) => simplifyCardForLLM(card, searchType)),
        [selectedCards, searchType],
    )

    // Convert Set to Array for serialization - with defensive check
    const serializableFilters = useMemo(
        () => ({
            kingdoms: Array.from(
                filters.kingdoms instanceof Set ? filters.kingdoms : new Set(),
            ),
            ranks: Array.from(
                filters.ranks instanceof Set ? filters.ranks : new Set(),
            ),
            hasPhotos: filters.hasPhotos,
            dateRange: filters.dateRange,
            location: filters.location,
        }),
        [filters],
    )

    // Ensure selectedIds is always a Set for size calculation
    const selectedCount = selectedIds.size

    const {
        messages,
        input,
        append,
        handleInputChange,
        handleSubmit,
        isLoading,
    } = useChat({
        api: '/api/chat',
        maxSteps: 5,
        body: {
            currentCards: simplifiedCurrentCards,
            filteredCards: filteredResults.map((card) =>
                simplifyCardForLLM(card, searchType),
            ),
            selectedCards: simplifiedSelectedCards,
            selectedCount: selectedCount,
            filters: serializableFilters,
            viewMode,
            searchType,
            currentLocation: location,
        },
        onToolCall: async ({ toolCall }) => {
            const toolName = toolCall.toolName

            switch (toolName) {
                case 'submitSearch': {
                    const searchText = toolCall.args.searchText
                    setQuery(searchText)
                    await submitQuery(searchText)
                    return {
                        success: true,
                        data: searchText,
                        message: `Set search text to "${searchText}" and submitted search.`,
                    }
                }

                case 'setSearchText': {
                    const searchText = toolCall.args.searchText
                    console.log('AI requested setSearchText:', searchText)
                    setQuery(searchText)
                    return {
                        success: true,
                        data: searchText,
                        message: `Set search text to "${searchText}".`,
                    }
                }

                case 'selectCards': {
                    const cardIds = toolCall.args.cardIds
                    console.log('AI requested to select cards:', cardIds)
                    const newSelectedIds = new Set(
                        cardIds.map((id: any) => id.toString()),
                    )
                    setSelectedIds(newSelectedIds)
                    return {
                        success: true,
                        data: { selectedIds: Array.from(newSelectedIds) },
                        message: `Selected ${newSelectedIds.size} cards.`,
                    }
                }

                case 'addToSelection': {
                    const cardIds = toolCall.args.cardIds
                    console.log('AI requested to add cards to selection:', cardIds)
                    const newIds = cardIds.map((id: any) => id.toString())
                    addToSelection(newIds)
                    return {
                        success: true,
                        data: { selectedIds: cardIds },
                        message: `Added ${cardIds.length} cards to selection.`,
                    }
                }

                case 'removeFromSelection': {
                    const cardIds = toolCall.args.cardIds
                    console.log('AI requested to remove cards from selection:', cardIds)
                    const newIds = cardIds.map((id: any) => id.toString())
                    removeFromSelection(newIds)
                    return {
                        success: true,
                        data: { selectedIds: cardIds },
                        message: `Removed ${cardIds.length} cards from selection.`,
                    }
                }

                case 'clearSelection': {
                    console.log('AI requested to clear selection')
                    clearSelection()
                    return {
                        success: true,
                        data: { selectedIds: [] },
                        message: 'Cleared all selections.',
                    }
                }

                case 'getAppContext':
                    console.log('AI requested getAppContext')
                    return {
                        success: true,
                        data: {
                            currentCards: simplifiedCurrentCards,
                            selectedCards: simplifiedSelectedCards,
                            selectedCount: selectedIds.size,
                            filters,
                            viewMode,
                            searchType,
                            currentLocation: location,
                        },
                    }

                case 'getUserLocationTool':
                    chatDispatch({ type: 'SET_LOCATION_GRANTED', payload: false })
                    chatDispatch({
                        type: 'SET_HAS_APPENDED_LOCATION_RESPONSE',
                        payload: false,
                    })

                    return new Promise((resolve) => {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const coords = {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    message: `Location obtained: ${position.coords.latitude}, ${position.coords.longitude}`,
                                }
                                setLocation({
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                })
                                resolve({
                                    success: true,
                                    data: coords,
                                })
                            },
                            (error) => {
                                resolve({
                                    success: false,
                                    error: error.message,
                                    message:
                                        'Location access denied, please fallback to IP-based location',
                                })
                            },
                            {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 60000,
                            },
                        )
                    })

                case 'setViewMode': {
                    const mode = toolCall.args.mode
                    console.log(`AI requested to set view mode to: ${mode}`)
                    setViewMode(mode)
                    return {
                        success: true,
                        data: { newViewMode: mode },
                        message: `View mode set to ${mode}.`,
                    }
                }

                case 'setSearchType': {
                    const type = toolCall.args.type
                    console.log(`AI requested to set search type to: ${type}`)
                    setSearchType(type)
                    return {
                        success: true,
                        data: { newSearchType: type },
                        message: `Search type set to ${type}.`,
                    }
                }

                case 'setFilters': {
                    const filterData = toolCall.args.filters
                    console.log('AI requested to set filters:', filterData)

                    const newFilters = {
                        kingdoms: new Set(filterData.kingdoms || []),
                        ranks: new Set(filterData.ranks || []),
                        hasPhotos: filterData.hasPhotos,
                        dateRange: filterData.dateRange || { start: '', end: '' },
                        location: filterData.location || '',
                    }

                    setFilters(newFilters)
                    return {
                        success: true,
                        data: { newFilters: serializableFilters },
                        message: `Filters updated successfully.`,
                    }
                }

                case 'clearFilters': {
                    console.log('AI requested to clear filters')
                    clearFilters()
                    return {
                        success: true,
                        data: { clearedFilters: true },
                        message: 'All filters cleared.',
                    }
                }

                default:
                    console.warn(`Unknown tool called: ${toolName}`)
                    return {
                        success: false,
                        error: `Unknown tool: ${toolName}`,
                    }
            }
        },
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const last = messages[messages.length - 1]
        if (!last || last.id === chatState.lastProcessedMessageId) return

        chatDispatch({ type: 'SET_LAST_PROCESSED_MESSAGE_ID', payload: last.id })

        if (last?.role === 'assistant' && last.toolInvocations) {
            last.toolInvocations.forEach((inv) => {
                if (inv.state === 'result' && inv.result) {
                    console.log('Tool result received:', inv.toolName, inv.result)
                    // Handle tool results as needed
                }
            })
        }
    }, [messages, chatState.lastProcessedMessageId])

    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatState.inputValue.trim()) return

        handleSubmit(e, {
            body: {
                query,
                currentCards: simplifiedCurrentCards,
                filteredCards: filteredResults.map((card) =>
                    simplifyCardForLLM(card, searchType),
                ),
                selectedCards: simplifiedSelectedCards,
                selectedCount: selectedCount,
                filters: serializableFilters,
                viewMode,
                searchType,
                currentLocation: location,
            },
        })

        chatDispatch({ type: 'RESET_INPUT' })
    }

    // Helper function to get icon for tool type
    const getToolIcon = (toolName: string) => {
        switch (toolName) {
            case 'searchWeb':
                return <Globe className='h-3 w-3' />
            case 'searchNews':
                return <Newspaper className='h-3 w-3' />
            case 'searchScientificPapers':
                return <BookOpen className='h-3 w-3' />
            case 'fetchWikipediaArticle':
                return <ExternalLink className='h-3 w-3' />
            default:
                return <Loader2 className='h-3 w-3' />
        }
    }

    return (
        <Sidebar>
            <SidebarHeader className='border-b p-4'>
                <div className='flex items-center space-x-2'>
                    <Bot className='h-6 w-6' />
                    <h2 className='text-lg font-semibold'>AI Assistant</h2>
                    {selectedCount > 0 && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
							{selectedCount} selected
						</span>
                    )}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                    I can search the web, find research papers, and help with your
                    iNaturalist data
                </p>
            </SidebarHeader>
            <SidebarContent>
                <div className='flex flex-col p-4 space-y-4'>
                    {messages
                        .filter((m) => m.role !== 'system')
                        .map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex flex-col rounded-lg p-3',
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground self-end'
                                        : 'bg-muted self-start',
                                )}
                            >
								<span className='text-xs font-semibold mb-1'>
									{message.role === 'user' ? 'You' : 'Assistant'}
								</span>
                                <div>
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </Markdown>
                                </div>

                                {message.toolInvocations?.map((toolInvocation) => (
                                    <div
                                        key={toolInvocation.toolCallId}
                                        className='mt-2 p-2 bg-background/50 rounded text-xs'
                                    >
                                        {toolInvocation.state === 'call' && (
                                            <div className='flex items-center gap-2'>
                                                {getToolIcon(toolInvocation.toolName)}
                                                <span>Executing {toolInvocation.toolName}...</span>
                                            </div>
                                        )}
                                        {toolInvocation.state === 'result' && (
                                            <div className='text-green-600'>
                                                <div className='flex items-center gap-2'>
                                                    ✓ {getToolIcon(toolInvocation.toolName)}
                                                    <span>{toolInvocation.toolName} completed</span>
                                                </div>
                                                {toolInvocation.result?.message && (
                                                    <div className='mt-1 text-muted-foreground'>
                                                        {toolInvocation.result.message}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    <div ref={messagesEndRef} />
                </div>
            </SidebarContent>
            <SidebarFooter className='border-t p-4'>
                <form onSubmit={handleLocalSubmit} className='flex space-x-2'>
                    <Input
                        value={chatState.inputValue}
                        onChange={(e) => {
                            chatDispatch({
                                type: 'SET_INPUT_VALUE',
                                payload: e.target.value,
                            })
                            handleInputChange(e)
                        }}
                        placeholder='Ask about species, search the web, or get help...'
                        disabled={isLoading}
                        className='flex-1'
                    />
                    <Button
                        type='submit'
                        size='icon'
                        disabled={isLoading || !chatState.inputValue.trim()}
                    >
                        {isLoading ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                            <Send className='h-4 w-4' />
                        )}
                    </Button>
                </form>
            </SidebarFooter>
        </Sidebar>
    )
}
