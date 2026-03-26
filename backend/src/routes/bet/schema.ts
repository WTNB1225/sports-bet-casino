import { z } from 'zod'

export const createBetSchema = z.object({
    oddId: z.string(),
    amount: z.number().positive(),
})