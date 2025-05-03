import { z } from 'genkit'

export const IdentifiedTaxonSchema = z.object({
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
