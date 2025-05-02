import { Request, RequestHandler, Response } from 'express'
import aiService from '../services/ai/ai.service.js'

const identifySubject: RequestHandler = async (req: Request, res: Response) => {
    const image = req.body.image
    if (!image) {
        res.status(400).send({ message: 'Image file required' })
        return
    }
    if (image) {
        const result = await aiService.identifySpecies(image)
        res.status(200).send(result)
        console.log('Received image, size:', req.body.image.length) // base64 string length
    }
}

const aiController = {
    identifySubject,
}

export default aiController
