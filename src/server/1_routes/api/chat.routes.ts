// import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { Router } from 'express'
import { Request, Response } from 'express'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
    const { messages } = req.body
    try {

        const result = streamText({
            model: google('gemini-2.0-flash-exp'),
            system: 'You are a helpful assistant.',
            messages,
            // messages: [{"role":"user","content":"What is the capital of France?"}]
        })
        result.pipeDataStreamToResponse(res)
    } catch (error) {
        console.error('Streaming error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export { router as chatRouter }
