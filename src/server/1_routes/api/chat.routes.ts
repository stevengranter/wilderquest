// import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { Router } from 'express'
import { Request, Response } from 'express'
import { geolocationTools, taxonomicDataTools } from '../../3_services/ai/tools/index.js'

const router = Router()

const systemPrompt = 'You are a helpful and knowledgeable assistant.' +
    'Answer the question as detailed as possible. ' +
    'For any species related questions, first rely on your own knowledge, then use the iNat tools to retrieve more details' +
    'When the user asks for information about a specific place, use the geoLocation tools to  ' +
    'look up the latitude and longitude of the place. ' +
    'When resolving ambiguous locations, always:' +
    '1. First call `getGeoLocationResults` to disambiguate the location.' +
    '2. Wait for the user to confirm their intended location. ' +
    '3. Only then proceed to call `getINatObservationData` or other related tools. ' +
    'Never call multiple tools in parallel unless all needed parameters are known. ' +
    'Only present the information that is relevant to the question.' +
    'Return text in Markdown format.'


router.post('/', async (req: Request, res: Response) => {
    const { messages } = req.body
    try {

        const result = streamText({
            model: google('gemini-2.5-flash-preview-04-17'),
            system: systemPrompt,
            maxSteps: 8,
            messages,
            tools: { ...taxonomicDataTools, ...geolocationTools },
        })
        result.pipeDataStreamToResponse(res)
    } catch (error) {
        console.error('Streaming error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export { router as chatRouter }
