import z from 'zod'

export const AddTaxaToCollectionRequestSchema = z.object({
    taxa: z.number().array(),
})
