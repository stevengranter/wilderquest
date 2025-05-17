import { genkit, z } from 'genkit'
import { googleAI, gemini20Flash } from '@genkit-ai/googleai'
import { aiTaxonIdentificationPromptAlt } from './prompts.js'
import { IdentifiedTaxonSchema } from './schemas.js'

const ai = genkit({ plugins: [googleAI()] })

export const identifySpecies = async (image: string) => {
    const { text } = await ai.generate({
        system: aiTaxonIdentificationPromptAlt,
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
