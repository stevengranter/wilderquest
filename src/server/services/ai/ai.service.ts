import { genkit, z } from 'genkit'
import { googleAI, gemini20Flash } from '@genkit-ai/googleai'
import { aiTaxonIdentificationPrompt } from './prompts.js'
import { IdentifiedTaxonSchema } from './schemas.js'

const ai = genkit({ plugins: [googleAI()] })

const identify = async (image: string) => {
    const { text } = await ai.generate({
        system: aiTaxonIdentificationPrompt,
        model: gemini20Flash,
        prompt: [{ media: { url: image } }], // base64-encoded data uri
        output: {
            schema: z.object({
                subject: z
                    .array(IdentifiedTaxonSchema)
                    .describe('main subject in the image'),
            }),
        },
    })
    return text
}

const aiService = {
    identifySpecies: identify,
}

export default aiService
