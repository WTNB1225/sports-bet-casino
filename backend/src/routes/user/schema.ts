import { z } from 'zod'

const createUserSchema = z.object({
    userId: z.string().min(3).max(20),
})

const signInWithIdentifierSchema = z.object({
    identifier: z.string().trim().min(3).max(100),
    password: z.string().min(6),
})

export { createUserSchema, signInWithIdentifierSchema };