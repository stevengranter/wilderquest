'use client'

import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TaxonCard from '@/components/TaxonCard'
import { useState } from 'react'
import { INatObservation } from '../../shared/types/iNatTypes'

export default function Chatbot() {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
    const { messages, input, handleInputChange, handleSubmit, status, stop, error, reload, append } = useChat({})

    return (
        <>
            {messages.map((message) => (
                <div key={message.id}>
                    <div>{message.role === 'user' ? 'User: ' : 'AI: '}</div>

                    {/* Render message parts */}
                    {message.parts?.map((part, i) => {
                        switch (part.type) {
                            case 'text':
                                return <div key={i}>{part.text}</div>

                            case 'tool-invocation': {
                                const { toolInvocation } = part
                                const { toolName, toolCallId, state } = toolInvocation

                                if (state === 'result') {
                                    if (toolName === 'getINatObservationData') {
                                        const { result } = toolInvocation
                                        if (result.length === 0) {
                                            const observationList = result.map((observation: INatObservation) => {
                                                return <TaxonCard key={observation.id} item={observation.taxon} />
                                            })
                                            return (<div>"Observation results" <ul
                                                className='m-6 gap-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'>
                                                {observationList}
                                            </ul></div>)
                                        }
                                    } else if (toolName === 'getINatTaxonData') {
                                        const { result } = toolInvocation
                                        const taxonList = result.map((taxonData) => {
                                            // return (<li>{taxonData.preferred_common_name}</li>)
                                            return <TaxonCard key={taxonData.id} item={taxonData} />
                                        })
                                        return <ul
                                            className='m-6 gap-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'>
                                            {taxonList}
                                        </ul>
                                    } else if (toolName === 'getGeoLocationResults') {
                                        const { result } = toolInvocation
                                        if (result.length > 0) {
                                            const locationList = result.map((location) => (
                                                <li key={location.place_id} className='mb-2'>
                                                    <div className='flex justify-between items-center'>
                                                        {/*<span>{location.display_name}</span>*/}
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedLocation(location)
                                                                append({
                                                                    role: 'user',
                                                                    content: `I choose the location: ${location.display_name}`,
                                                                })
                                                            }}
                                                        >
                                                            {location.display_name}
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))
                                            return <ul>{locationList}</ul>
                                        }
                                    } else
                                    // Handle other tools with results
                                    return <div key={i}>Tool {toolName} completed</div>
                                } else if (state === 'call') {
                                    // Tool is being called
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
                                    // Tool call is being streamed
                                    return <div key={i}>Preparing {toolName}...</div>
                                }
                                break
                            }


                            case 'file':
                                // Handle file attachments
                                return (
                                    <img
                                        key={i}
                                        src={`data:${part.mimeType};base64,${part.data}`}
                                        alt='Attached file'
                                        className='max-w-md'
                                    />
                                )

                            case 'source':
                                // Handle source citations
                                return (
                                    <div key={i} className='text-sm text-gray-600'>
                                        Source:{' '}
                                        <a href={part.source.url} target='_blank' rel='noopener noreferrer'>
                                            {part.source.url}
                                        </a>
                                    </div>
                                )

                            case 'reasoning':
                                // Handle reasoning steps
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
            ))}

            {(status === 'submitted' || status === 'streaming') && (
                <div>
                    {status === 'submitted' && 'Submitted...'}
                    <button type='button' onClick={() => stop()}>
                        Stop
                    </button>
                </div>
            )}

            {error && (
                <>
                    <div>An error occurred.</div>
                    <button type='button' onClick={() => reload()}>
                        Retry
                    </button>
                </>
            )}

            <form onSubmit={handleSubmit}>
                <Input
                    name='prompt'
                    value={input}
                    onChange={handleInputChange}
                    disabled={status !== 'ready'}
                    className='w-100'
                />
                <Button type='submit'>Submit</Button>
            </form>
        </>
    )
}
