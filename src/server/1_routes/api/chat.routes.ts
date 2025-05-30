// import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { Router } from 'express'
import { Request, Response } from 'express'
import { geolocationTools, taxonomicDataTools } from '../../3_services/ai/tools/index.js'

const router = Router()

const systemPrompt = 'You are a helpful an knowledgeable assistant. Answer the question as detailed as possible. For any species related questions, use the iNat tools to retrieve more details to present them to the user'

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
