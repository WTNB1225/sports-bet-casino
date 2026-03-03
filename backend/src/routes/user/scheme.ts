import { z } from 'zod'

const createUserSchema = z.object({
    email: z.email(),
    name: z.string().min(1),
})

export { createUserSchema };