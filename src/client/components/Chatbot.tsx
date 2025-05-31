'use client'

import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TaxonCard from '@/components/TaxonCard'
import { useState, useEffect, useRef } from 'react' // Import useEffect and useRef
import { INatObservation, INatTaxon } from '../../shared/types/iNatTypes'
import { LocationIQPlace } from '../../shared/types/LocationIQPlace'
import Markdown from 'react-markdown'

export default function Chatbot() {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
    const { messages, input, handleInputChange, handleSubmit, status, stop, error, reload, append } = useChat({})

    // Create a ref for the messages container
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to the bottom whenever messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages]) // Depend on the messages array

    return (
        <div className='flex flex-col h-screen'> {/* Add a container to manage layout */}
            <div className='flex-1 overflow-y-auto p-4'> {/* This div will scroll */}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`px-4 py-2 my-1 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                                message.role === 'user'
                                    ? 'bg-teal-200 text-right border-1 border-black shadow-shadow'
                                    : 'bg-white text-left border-2 border-black shadow-shadow'
                            }`}
                        >
                            {/* Render message parts */}
                            {message.parts?.map((part, i) => {
                                switch (part.type) {
                                    case 'text': {
                                        let displayText = part.text

                                        // // If there's a related tool result (e.g., TaxonCards) and the text includes a list, trim it
                                        // const hasObservationResult = message.parts?.some(
                                        //     (p) =>
                                        //         p.type === 'tool-invocation' &&
                                        //         p.toolInvocation?.toolName === 'getINatObservationData' &&
                                        //         p.toolInvocation?.state === 'result',
                                        // )
                                        //
                                        // if (hasObservationResult && displayText.includes('\n\n')) {
                                        //     // Keep only the first paragraph (the intro), discard the list
                                        //     displayText = displayText.split('\n\n')[0]
                                        // }

                                        return (

                                            <Markdown key={i}>{displayText}</Markdown>

                                        )
                                    }

                                    case 'tool-invocation': {
                                        const { toolInvocation } = part
                                        const { toolName, toolCallId, state } = toolInvocation

                                        if (state === 'result') {
                                            if (toolName === 'getINatObservationData') {
                                                const { result } = toolInvocation as { result: INatObservation[] }
                                                if (result.length > 0) {
                                                    const uniqueTaxaMap = new Map<number, INatObservation>()
                                                    result.forEach((observation) => {
                                                        const taxonId = observation.taxon?.id
                                                        if (taxonId && !uniqueTaxaMap.has(taxonId)) {
                                                            uniqueTaxaMap.set(taxonId, observation)
                                                        }
                                                    })

                                                    const observationList = Array.from(uniqueTaxaMap.values()).map(
                                                        (observation) => (
                                                            <TaxonCard
                                                                key={observation?.taxon?.id}
                                                                item={observation.taxon}
                                                            />
                                                        ),
                                                    )

                                                    return (
                                                        <div key={i}>
                                                            "Observation results"
                                                            <ul className='m-6 gap-8 grid grid-cols-2'>
                                                                {observationList}
                                                            </ul>
                                                        </div>
                                                    )
                                                }
                                            } else if (toolName === 'getINatTaxonData') {
                                                return ('Retrieving taxon data...')
                                                // const { result } = toolInvocation as { result: INatTaxon[] }
                                                // if (result.length > 0) {
                                                //     const uniqueTaxaMap = new Map<number, INatTaxon>()
                                                //     result.forEach((taxon) => {
                                                //         const taxonId = taxon?.id
                                                //         if (taxonId && !uniqueTaxaMap.has(taxonId)) {
                                                //             uniqueTaxaMap.set(taxonId, taxon)
                                                //         }
                                                //     })
                                                //
                                                //     const taxonList = Array.from(uniqueTaxaMap.values()).map(
                                                //         (taxon) => (
                                                //             <TaxonCard
                                                //                 key={taxon?.id}
                                                //                 item={taxon}
                                                //             />
                                                //         )
                                                //     )
                                                //
                                                //     return (
                                                //         <div key={i}>
                                                //             "Taxon results"
                                                //             <ul className='m-6 gap-8 grid grid-cols-2'>
                                                //                 {taxonList}
                                                //             </ul>
                                                //         </div>
                                                //     )
                                                // }
                                            } else if (toolName === 'getGeoLocationResults') {
                                                const { result } = toolInvocation as { result: LocationIQPlace[] }
                                                if (result.length > 0) {
                                                    const locationList = result.map((location) => (
                                                        <li key={location.place_id} className='mb-2'>
                                                            <div className='flex justify-between items-center'>
                                                                <Button
                                                                    onClick={() => {
                                                                        setSelectedLocation(location.display_name) // Corrected to use display_name
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
                                                    return <ul key={i}>{locationList}</ul>
                                                }
                                            }

                                            return <div key={i}>Tool {toolName} completed</div>
                                        } else if (state === 'call') {
                                            return (
                                                <div key={i}>
                                                    {toolName === 'getInatTaxonData' ? (
                                                        <div>Loading taxon data...</div>
                                                    ) : toolName === 'displayWeather' ? (
                                                        <div>Loading weather...</div>
                                                    ) : (
                                                        <div>Calling {toolName}...</div>
                                                    )}
                                                </div>
                                            )
                                        } else if (state === 'partial-call') {
                                            return <div key={i}>Preparing {toolName}...</div>
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

                            {/* Fallback for backward compatibility - remove once fully migrated */}
                            {!message.parts && message.content && <div>{message.content}</div>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                {/* This empty div will be scrolled into view */}
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
