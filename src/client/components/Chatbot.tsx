'use client'

import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TaxonCard from '@/components/TaxonCard'

export default function Chatbot() {
    const { messages, input, handleInputChange, handleSubmit, status, stop, error, reload } = useChat({})

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
                                    if (toolName === 'getINatTaxonData') {
                                        const { result } = toolInvocation
                                        return (
                                            <div className='w-150'>
                                                <TaxonCard item={result} />
                                            </div>
                                        )
                                    }
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
