'use client'

import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TaxonCard from '@/components/TaxonCard'
import { useState, useEffect, useRef } from 'react'
import type { INatObservation, INatTaxon } from '../../shared/types/iNatTypes'
import type { LocationIQPlace } from '../../shared/types/LocationIQPlace'
import Markdown from 'react-markdown'
import type { Message } from 'ai'

type UserLocation = {
    lat?: number
    lng?: number
    displayName?: string
}

export default function Chatbot() {
    const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null)
    // Add this state to track when location is granted
    const [locationGranted, setLocationGranted] = useState(false)
    const { messages, input, handleInputChange, handleSubmit, status, stop, error, reload, append } = useChat({
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
                            setSelectedLocation((prev) => ({
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

    const messagesEndRef = useRef<HTMLDivElement>(null)


    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

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

    // Helper function to determine if TaxonCards should be shown
    const shouldShowTaxonCards = (message: Message, currentIndex: number) => {
        if (!message.parts) return false

        const lastTaxonDataIndex = message.parts.reduce((lastIndex, part, index) => {
            if (
                part.type === 'tool-invocation' &&
                part.toolInvocation?.toolName === 'getINatTaxonData' &&
                part.toolInvocation?.state === 'result'
            ) {
                return index
            }
            return lastIndex
        }, -1)

        if (lastTaxonDataIndex === -1 || currentIndex !== lastTaxonDataIndex) {
            return false
        }

        for (let i = lastTaxonDataIndex + 1; i < message.parts.length; i++) {
            const part = message.parts[i]
            if (
                part.type === 'tool-invocation' &&
                part.toolInvocation?.toolName === 'getINatObservationData' &&
                part.toolInvocation?.state === 'result'
            ) {
                return false
            }
        }

        return true
    }

    return (
        <div className='flex flex-col h-screen'>
            <div className='flex-1 overflow-y-auto p-4'>
                {messages.map((message) => (
                    <div key={message.id}
                         className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`px-4 py-2 my-1 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                                message.role === 'user'
                                    ? 'bg-teal-200 dark:bg-secondary-background text-black dark:text-teal-50 text-right border-1 border-black shadow-shadow'
                                    : 'bg-white dark:bg-teal-900 dark:p-6 dark:font-light dark:tracking-wider text-black dark:text-white dark:text-shadow-md text-left border-2 border-black shadow-shadow'
                            }`}
                        >
                            {message.parts?.map((part, i) => {
                                switch (part.type) {
                                    case 'text': {
                                        // This part is now mostly for the initial text response from the model
                                        // before any tools are called or if no tools are called.
                                        return <Markdown key={i}>{part.text}</Markdown>
                                    }

                                    case 'tool-invocation': {
                                        const { toolInvocation } = part
                                        const { toolName, state } = toolInvocation

                                        switch (toolName) {
                                            case 'getUserLocationTool':
                                                switch (state) {
                                                    case 'call':
                                                        return 'Requesting user location:'
                                                    case 'result':
                                                        return <div key={i}>Location access allowed:</div>
                                                }
                                                break

                                            case 'getINatObservationData':
                                                if (state === 'result') {
                                                    const { result } = toolInvocation as { result: INatObservation[] }
                                                    if (result.length > 0) {
                                                        const uniqueTaxaMap = new Map<number, INatObservation>()
                                                        result.forEach((observation) => {
                                                            const taxonId = observation.taxon?.id
                                                            if (taxonId && !uniqueTaxaMap.has(taxonId)) {
                                                                uniqueTaxaMap.set(taxonId, observation)
                                                            }
                                                        })

                                                        const observationList = Array.from(uniqueTaxaMap.values()).map((observation) => (
                                                            <TaxonCard key={observation?.taxon?.id}
                                                                       item={observation.taxon} />
                                                        ))

                                                        const textPart = message.parts?.find((p, idx) => p.type === 'text' && idx < i) as
                                                            | { type: 'text'; text: string }
                                                            | undefined

                                                        return (
                                                            <div key={i}>
                                                                {textPart && <Markdown>{textPart.text}</Markdown>}
                                                                <p className='my-2 text-gray-700'>Here are some recent
                                                                    observations:</p>
                                                                <ul className='m-6 gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
                                                                    {observationList}
                                                                </ul>
                                                            </div>
                                                        )
                                                    }
                                                }
                                                break

                                            case 'getINatTaxonData':
                                                switch (state) {
                                                    case 'result':
                                                        if (shouldShowTaxonCards(message, i)) {
                                                            const { result } = toolInvocation as { result: INatTaxon[] }
                                                            if (result.length > 0) {
                                                                const uniqueTaxaMap = new Map<number, INatTaxon>()
                                                                result.forEach((taxon) => {
                                                                    const taxonId = taxon?.id
                                                                    if (taxonId && !uniqueTaxaMap.has(taxonId)) {
                                                                        uniqueTaxaMap.set(taxonId, taxon)
                                                                    }
                                                                })

                                                                const taxonList = Array.from(uniqueTaxaMap.values()).map((taxon) => (
                                                                    <TaxonCard key={taxon?.id} item={taxon} />
                                                                ))

                                                                const textPart = message.parts?.find((p, idx) => p.type === 'text' && idx < i) as
                                                                    | { type: 'text'; text: string }
                                                                    | undefined

                                                                return (
                                                                    <div key={i}>
                                                                        {textPart &&
                                                                            <Markdown>{textPart.text}</Markdown>}
                                                                        <p className='my-2 text-gray-700'>Here's what I
                                                                            found about that taxon:</p>
                                                                        <ul className='m-6 gap-8 grid grid-cols-2'>{taxonList}</ul>
                                                                    </div>
                                                                )
                                                            }
                                                        } else {
                                                            return <div key={i}>Retrieving taxon data...</div>
                                                        }
                                                        break

                                                    case 'call':
                                                        return <div key={i}>Loading taxon data...</div>
                                                }
                                                break

                                            case 'forwardGeocodeTool':
                                                if (state === 'result') {
                                                    const { result } = toolInvocation as { result: LocationIQPlace[] }
                                                    if (result.length > 0) {
                                                        const locationList = result.map((location) => (
                                                            <li key={location.place_id} className='mb-2'>
                                                                <div className='flex justify-between items-center'>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setSelectedLocation(location.display_name)
                                                                            append({
                                                                                role: 'user',
                                                                                content: `I choose the location: ${location.display_name}`,
                                                                            })
                                                                        }}
                                                                        className='whitespace-normal break-words max-w-full text-left'
                                                                    >
                                                                        {location.display_name}
                                                                    </Button>
                                                                </div>
                                                            </li>
                                                        ))

                                                        const textPart = message.parts?.find((p, idx) => p.type === 'text' && idx < i) as
                                                            | { type: 'text'; text: string }
                                                            | undefined

                                                        return (
                                                            <div key={i}>
                                                                {textPart && <Markdown>{textPart.text}</Markdown>}
                                                                <p className='my-2'>Please select a location:</p>
                                                                <ul>{locationList}</ul>
                                                            </div>
                                                        )
                                                    }
                                                }
                                                break

                                            case 'reverseGeocodeTool':
                                                switch (state) {
                                                    case 'call':
                                                        return <div key={i}>Getting location information...</div>
                                                    case 'result':
                                                        const { result } = toolInvocation as {
                                                            result: {
                                                                display_name?: string
                                                                city?: string
                                                                state?: string
                                                                country?: string
                                                                error?: string
                                                            }
                                                        }

                                                        if (result.error) {
                                                            return (
                                                                <div key={i} className='text-red-600'>
                                                                    Error: {result.error}
                                                                </div>
                                                            )
                                                        }

                                                        return (
                                                            <div key={i} className='bg-blue-50 p-3 rounded-lg border'>
                                                                <h4 className='font-semibold text-blue-800'>📍 Your
                                                                    Location</h4>
                                                                <p className='text-sm text-gray-700'>
                                                                    {result.city && result.state
                                                                        ? `${result.city}, ${result.state}, ${result.country}`
                                                                        : result.display_name}
                                                                </p>
                                                            </div>
                                                        )
                                                }
                                                break

                                            case 'displayWeather':
                                                if (state === 'call') {
                                                    return <div key={i}>Loading weather...</div>
                                                }
                                                break

                                            default:
                                                switch (state) {
                                                    case 'call':
                                                        return <div key={i}>Calling {toolName}...</div>
                                                    case 'partial-call':
                                                        return <div key={i}>Preparing {toolName}...</div>
                                                    case 'result':
                                                        return <div key={i}>Tool {toolName} completed</div>
                                                }
                                        }

                                        break
                                    }

                                    case 'file':
                                        return (
                                            <img
                                                key={i}
                                                src={`data:${part.mimeType};base64,${part.data}`}
                                                alt='Attached file'
                                                className='max-w-md'
                                            />
                                        )

                                    case 'source':
                                        return (
                                            <div key={i} className='text-sm text-gray-600'>
                                                Source:{' '}
                                                <a href={part.source.url} target='_blank' rel='noopener noreferrer'>
                                                    {part.source.url}
                                                </a>
                                            </div>
                                        )

                                    case 'reasoning':
                                        return (
                                            <div key={i} className='bg-gray-100 p-2 rounded'>
                                                <strong>Reasoning:</strong> {part.reasoning}
                                            </div>
                                        )

                                    default:
                                        return null
                                }
                            })}

                            {!message.parts && message.content && <div>{message.content}</div>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {(status === 'submitted' || status === 'streaming') && (
                <div className='p-4'>
                    {status === 'submitted' && 'Submitted...'}
                    <button type='button' onClick={() => stop()}>
                        Stop
                    </button>
                </div>
            )}

            {error && (
                <div className='p-4'>
                    <div>An error occurred.</div>
                    <button type='button' onClick={() => reload()}>
                        Retry
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className='flex gap-2 items-center mt-4 p-4'>
                <Input
                    name='prompt'
                    value={input}
                    onChange={handleInputChange}
                    disabled={status !== 'ready'}
                    className='flex-1'
                />
                <Button type='submit'>Submit</Button>
            </form>
        </div>
    )
}
