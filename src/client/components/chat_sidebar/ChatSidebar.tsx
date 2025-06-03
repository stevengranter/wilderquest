'use client'

import type React from 'react'

import { useChat } from 'ai/react'
import { useAppContext } from '@/contexts/app-context'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export default function ChatSidebar() {
    const {
        location,
        setLocation,
        cards,
        setCards,
        selectedCard,
        setSelectedCard,
        filters,
        setFilters,
        filteredCards,
    } = useAppContext()
    const [locationGranted, setLocationGranted] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [inputValue, setInputValue] = useState('')

    // Initialize the chat - tools will be executed server-side
    const { messages, input, append, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: '/api/chat',
        maxSteps: 5, // Enable multi-step calls for server-side tool execution
        initialMessages: [
            {
                id: 'initial-system',
                role: 'system',
                content: `You are a helpful assistant that can help users navigate and interact with their dashboard.
      You can see the cards currently displayed in the main interface by using the getInterfaceState tool.
      Use the available tools to fetch data and help the user find what they're looking for.`,
            },
        ],
        body: {
            currentCards: filteredCards || cards,
            selectedCard: selectedCard,
            filters: filters,
        },
        async onToolCall({ toolCall }) {
            if (toolCall.toolName === 'getUserLocationTool') {
                // Reset location granted state for new requests
                setLocationGranted(false)

                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const coords = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                message: `Location coordinates obtained: ${position.coords.latitude}, ${position.coords.longitude}`,
                            }
                            setLocation((prev) => ({
                                ...prev,
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            }))

                            // Return location data directly to the AI model - don't use append()
                            resolve(coords)
                        },
                        (error) => {
                            console.log('Geolocation denied or failed, falling back to IP-based location')

                            // Return error info that will trigger the AI to use IP-based location
                            resolve({
                                error: error.message,
                                fallback: 'ip-location',
                                message: 'Location access denied, please use IP-based location detection instead',
                            })
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000,
                        },
                    )
                })
            }

            if (toolCall.toolName === 'getLocationByIPTool') {
                // This tool should be handled server-side
                return null
            }
        },
    })

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Update the chat context when cards or selected card changes
    useEffect(() => {
        // This would ideally be handled by updating the chat context
        // but for simplicity, we'll just add a system message
        if (cards.length > 0 && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role !== 'system' || !lastMessage.content.includes('Current cards:')) {
                setMessages([
                    ...messages,
                    {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `Current cards: ${cards.length} cards are displayed. ${
                            selectedCard ? `Selected card: ${selectedCard.title}` : 'No card selected.'
                        }`,
                    },
                ])
            }
        }
    }, [cards, selectedCard, setMessages, messages])

    // Add this useEffect after the existing useEffect for scrolling
    useEffect(() => {
        // Check if location was just granted by looking at the latest message
        const lastMessage = messages[messages.length - 1]
        if (lastMessage?.role === 'assistant' && lastMessage.parts) {
            const hasLocationGranted = lastMessage.parts.some(
                (part) =>
                    part.type === 'tool-invocation' &&
                    part.toolInvocation?.toolName === 'getUserLocationTool' &&
                    part.toolInvocation?.state === 'result' &&
                    part.toolInvocation?.result &&
                    !(part.toolInvocation.result as any)?.fallback,
            )

            if (hasLocationGranted && !locationGranted) {
                setLocationGranted(true)
                // Tell the AI to use the location data
                setTimeout(() => {
                    append({
                        role: 'user',
                        content: 'Great! Now that you have my location, please use it to help with my request.',
                    })
                }, 500) // Small delay to ensure the tool call is fully processed
            }
        }
    }, [messages, locationGranted, append])

    // Add this effect after the existing useEffect hooks
    useEffect(() => {
        // Listen for tool results in messages and update the app state accordingly
        const lastMessage = messages[messages.length - 1]

        if (lastMessage?.role === 'assistant' && lastMessage.toolInvocations) {
            lastMessage.toolInvocations.forEach((toolInvocation) => {
                if (toolInvocation.state === 'result' && toolInvocation.result) {
                    const result = toolInvocation.result

                    // Update app state based on tool results
                    if (result.success && result.data) {
                        switch (toolInvocation.toolName) {
                            case 'fetchAllCards':
                            case 'fetchCardsByCategory':
                            case 'searchCards':
                                if (Array.isArray(result.data)) {
                                    setCards(result.data)
                                }
                                break
                            case 'fetchCardById':
                                if (result.data && typeof result.data === 'object') {
                                    setSelectedCard(result.data)
                                }
                                break
                        }
                    }
                }
            })
        }
    }, [messages, setCards, setSelectedCard])

    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim()) {
            handleSubmit(e)
            setInputValue('')
        }
    }

    return (
        <Sidebar>
            <SidebarHeader className='border-b p-4'>
                <div className='flex items-center space-x-2'>
                    <Bot className='h-6 w-6' />
                    <h2 className='text-lg font-semibold'>AI Assistant</h2>
                </div>
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
                                    message.role === 'user' ? 'bg-primary text-primary-foreground self-end' : 'bg-muted self-start',
                                )}
                            >
                                <span
                                    className='text-xs font-semibold mb-1'>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                                <div className='text-sm whitespace-pre-wrap'>
                                    {message.content}

                                    {/* Show tool invocations */}
                                    {message.toolInvocations?.map((toolInvocation) => (
                                        <div key={toolInvocation.toolCallId}
                                             className='mt-2 p-2 bg-background/50 rounded text-xs'>
                                            {toolInvocation.state === 'call' && (
                                                <div className='flex items-center gap-2'>
                                                    <Loader2 className='h-3 w-3 animate-spin' />
                                                    <span>Executing {toolInvocation.toolName}...</span>
                                                </div>
                                            )}
                                            {toolInvocation.state === 'result' && (
                                                <div className='text-green-600'>
                                                    ✓ {toolInvocation.toolName} completed
                                                    {toolInvocation.result?.message && (
                                                        <div
                                                            className='mt-1 text-muted-foreground'>{toolInvocation.result.message}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    <div ref={messagesEndRef} />
                </div>
            </SidebarContent>
            <SidebarFooter className='border-t p-4'>
                <form onSubmit={handleLocalSubmit} className='flex space-x-2'>
                    <Input
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            handleInputChange(e)
                        }}
                        placeholder='Ask something...'
                        disabled={isLoading}
                        className='flex-1'
                    />
                    <Button type='submit' size='icon' disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                    </Button>
                </form>
            </SidebarFooter>
        </Sidebar>
    )
}
