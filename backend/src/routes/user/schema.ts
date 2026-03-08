import { z } from 'zod'

const createUserSchema = z.object({
    userId: z.string().min(3).max(20),
})

export { createUserSchema };