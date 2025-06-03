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
        filteredCards,
    } = useAppContext()

    const [inputValue, setInputValue] = useState('')
    const [locationGranted, setLocationGranted] = useState(false)
    const hasAppendedLocationResponse = useRef(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const {
        messages,
        input,
        append,
        handleInputChange,
        handleSubmit,
        isLoading,
    } = useChat({
        api: '/api/chat',
        maxSteps: 8,
        body: {
            currentCards: filteredCards || cards,
            selectedCard,
            filters,
        },
        onToolCall: async ({ toolCall }) => {
            if (toolCall.toolName === 'getUserLocationTool') {
                setLocationGranted(false)
                hasAppendedLocationResponse.current = false

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
                            resolve(coords)
                        },
                        (error) => {
                            resolve({
                                error: error.message,
                                fallback: 'ip-location',
                                message: 'Location access denied, please fallback to IP-based location',
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

            // Server-side tools
            return null
        },
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Inject interface state change as system message (using append, not setMessages)
    useEffect(() => {
        if (cards.length > 0 && messages.length > 0) {
            const last = messages[messages.length - 1]
            if (
                last.role !== 'system' ||
                !last.content?.includes('Current cards:')
            ) {
                append({
                    role: 'system',
                    content: `Current cards: ${cards.length} cards are displayed. ${
                        selectedCard ? `Selected card: ${selectedCard.title}` : 'No card selected.'
                    }`,
                })
            }
        }
    }, [cards, selectedCard])

    // Detect location tool completion and follow up
    useEffect(() => {
        const last = messages[messages.length - 1]
        const granted =
            last?.role === 'assistant' &&
            last.toolInvocations?.some(
                (inv) =>
                    inv.toolName === 'getUserLocationTool' &&
                    inv.state === 'result' &&
                    inv.result &&
                    !(inv.result as any)?.fallback,
            )

        if (granted && !locationGranted && !hasAppendedLocationResponse.current && !isLoading) {
            setLocationGranted(true)
            hasAppendedLocationResponse.current = true
            append({
                role: 'user',
                content: 'Great! Now that you have my location, please use it to help with my request.',
            })
        }
    }, [messages, locationGranted, isLoading])

    // Apply tool results to app state (cards, filters, selection)
    useEffect(() => {
        const last = messages[messages.length - 1]
        if (last?.role === 'assistant' && last.toolInvocations) {
            last.toolInvocations.forEach((inv) => {
                if (inv.state === 'result' && inv.result?.success) {
                    const data = inv.result.data
                    switch (inv.toolName) {
                        case 'fetchAllCards':
                        case 'fetchCardsByCategory':
                        case 'searchCards':
                            if (Array.isArray(data)) setCards(data)
                            break
                        case 'fetchCardById':
                            if (typeof data === 'object') setSelectedCard(data)
                            break
                    }
                }
            })
        }
    }, [messages])

    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        handleSubmit(e, {
            body: {
                currentCards: filteredCards || cards,
                selectedCard,
                filters,
            },
        })

        setInputValue('')
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
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground self-end'
                                        : 'bg-muted self-start',
                                )}
                            >
                                <span className='text-xs font-semibold mb-1'>
                                    {message.role === 'user' ? 'You' : 'Assistant'}
                                </span>
                                <div className='text-sm whitespace-pre-wrap'>{message.content}</div>

                                {message.toolInvocations?.map((toolInvocation) => (
                                    <div
                                        key={toolInvocation.toolCallId}
                                        className='mt-2 p-2 bg-background/50 rounded text-xs'
                                    >
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
