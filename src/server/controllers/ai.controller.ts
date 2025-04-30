import { genkit, z } from 'genkit'
import { googleAI, gemini20Flash } from '@genkit-ai/googleai'
import { Request, Response } from 'express'

const ai = genkit({ plugins: [googleAI()] })

export const ImageSubjectSchema = z.object({
    scientific_name: z
        .string()
        .describe('the scientific name of the subject species'),
    common_name: z.string().describe('the common name for the subject species'),
    description: z
        .string()
        .describe('a single sentence detailed description of the object'),
    box2d: z
        .array(z.number())
        .describe('bounding box for the subject in [y1,x1,y2,x2] format'),
    confidence: z.number().describe('confidence score for the subject'),
})

export const ImageObjectSchema = z.object({
    name: z.string().describe('a short but unique name of the object'),
    description: z
        .string()
        .describe('a single sentence detailed description of the object'),
    text: z.string().describe('any written text on the object').nullish(),
    colors: z
        .array(z.string())
        .describe(
            'a list of one or more valid CSS named colors that make up the object, from most to least prevalent'
        ),
    box2d: z
        .array(z.number())
        .describe('bounding box for the object in [y1,x1,y2,x2] format'),
    error: z.string().describe('error message if the object is invalid'),
})

const sayHello = async (req: Request, res: Response) => {
    const { text } = await ai.generate({
        model: gemini20Flash,
        prompt: 'Hi!',
    })
    res.status(200).send(text)
}

const getParams = (req: Request, res: Response) => {
    res.status(200).send(req.params)
}

const identifySubject = async (req: Request, res: Response) => {
    const image = req.body.image
    console.log(image)
    console.log('Received image, size:', req.body.image.length) // base64 string length

    const { text } = await ai.generate({
        system:
            'Identify the main subject of the image. ' +
            'It should be an animal, fungi, or plant. ' +
            'Prioritize animals over fungi over plants. ' +
            'If the image appears to be an illustration, cartoon, digital painting, or does not contain a clear animal, fungi, or plant subject, ' +
            'Say that the image does not contain a subject. ',
        model: gemini20Flash,
        prompt: [{ media: { url: image } }], // base64-encoded data uri
        output: {
            schema: z.object({
                subject: z
                    .array(ImageSubjectSchema)
                    .describe('main subject in the image'),
            }),
        },
    })
    if (text.includes('Error')) {
        res.status(400).send(text)
        return
    }
    res.status(200).send(text)
    return
}

const identifyObjects = async (req: Request, res: Response) => {
    const image = req.body.image
    console.log(image)
    console.log('Received image, size:', req.body.image.length) // base64 string length

    const { text } = await ai.generate({
        system: 'Identify the species in the provided image. Be as specific as possible. ',
        model: gemini20Flash,
        prompt: [{ media: { url: image } }], // base64-encoded data uri
        output: {
            schema: z.object({
                objects: z
                    .array(ImageObjectSchema)
                    .describe('list of objects in the image'),
            }),
        },
    })
    if (text.includes('Error')) {
        res.status(400).send(text)
        return
    }
    res.status(200).send(text)
    return
}

const aiController = {
    sayHello,
    getParams,
    identifyObjects,
    identifySubject,
}

export default aiController
