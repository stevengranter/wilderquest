import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { Router } from 'express'
import { Request, Response } from 'express'
import { geolocationTools, taxonomicDataTools } from '../../3_services/ai/tools/index.js'
import z from 'zod'
import { truncateMessages } from '../../utils/truncateMessages.js'

const router = Router()

const systemPrompt = `You are a helpful assistant. For species/location questions, use tools like getINatObservationData and reverseGeocodeTool. Be conversational, don't call multiple tools at once, and return Markdown.`


// const systemPrompt = `You are a helpful and knowledgeable assistant.
// Answer the question as detailed as possible.
// For any species-related questions, use the getINatObservationData tool — particularly for location-based inquiries.
// Use the displayTaxonomicData tool to display information about species to the user.
// When a user requests their location or you successfully get location coordinates:
// 1. Always call the reverseGeocodeTool to convert coordinates to a readable address
// 2. Show the user their current city/location in a friendly way
// 3. You can then offer location-based suggestions or information.
// Be conversational and helpful when presenting location information.
// When resolving ambiguous locations, always:
// 1. First call forwardGeocodeTool to disambiguate the location.
// 2. Wait for the user to confirm their intended location.
// 3. Only then proceed to call getINatObservationData or other related tools.
// Never call multiple tools in parallel unless all needed parameters are known.
// Only present the information that is relevant to the question.
// Return text in Markdown format.`

router.post('/', async (req: Request, res: Response) => {
    const { messages, currentCards, selectedCard, filters } = req.body
    const truncatedMessages = truncateMessages(messages, 8)
    try {
        const result = streamText({
            model: google('gemini-2.5-flash-preview-04-17'),
            system: systemPrompt,
            messages: truncatedMessages,
            maxSteps: 5,
            tools: {
                ...geolocationTools,
                ...taxonomicDataTools,
                getInterfaceState: {
                    description: 'Get the current state of the user interface including displayed cards and selected card',
                    parameters: z.object({}),
                    execute: async () => {
                        return {
                            success: true,
                            message: 'Retrieved current interface state',
                            data: {
                                currentCards: currentCards || [],
                                selectedCard: selectedCard || null,
                                totalCards: currentCards?.length || 0,
                                filters: filters || {
                                    category: null,
                                    searchTerm: null,
                                },
                            },
                        }
                    },
                },
            },
        })

        result.pipeDataStreamToResponse(res)
    } catch (error) {
        console.error('Streaming error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export { router as chatRouter }
