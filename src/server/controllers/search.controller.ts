import { NextFunction, Request, Response } from 'express' // Keep RequestHandler here
import { z } from 'zod'
import { fetchInatData } from '../services/ai/iNaturalistService.js'
import { identifySpecies } from '../services/ai/aiService.js'
import { titleCase } from '../utils/titleCase.js'

const SearchRequestSchema = z.object({
    type: z.enum(['image', 'text']),
    q: z.string().min(2).optional(),
    image: z.string().optional(),
    text: z.string().optional(),
})

export const search = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const parsed = SearchRequestSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message })
        return
    }

    const { type, q, image, text } = parsed.data

    try {
        let results
        if (type === 'image' && image) {
            results = await identifySpecies(image)
            // Format common names and species guesses in AI results
            if (results && typeof results === 'object' && 'subject' in results) {
                const resultsObj = results as { subject: any[] };
                resultsObj.subject = resultsObj.subject.map((item: any) => ({
                    ...item,
                    common_name: item.common_name ? titleCase(item.common_name) : item.common_name,
                    species_guess: item.species_guess ? titleCase(item.species_guess) : item.species_guess
                }))
            }
        } else if (type === 'text' && (q || text)) {
            results = await fetchInatData(q ?? text ?? '')
        } else {
            res.status(400).json({
                error: 'Missing search input for given type',
            })
            return
        }

        res.status(200).json({ results })
    } catch (error) {
        next(error)
    }
}
