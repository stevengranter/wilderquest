// import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { Router } from 'express'
import { Request, Response } from 'express'
import { taxonomicDataTools } from '../../3_services/ai/tools/index.js'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
    const { messages } = req.body
    try {

        const result = streamText({
            model: google('gemini-2.5-flash-preview-04-17'),
            system: 'You are a helpful assistant.',
            maxSteps: 3,
            messages,
            tools: taxonomicDataTools,
        })
        result.pipeDataStreamToResponse(res)
    } catch (error) {
        console.error('Streaming error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export { router as chatRouter }
