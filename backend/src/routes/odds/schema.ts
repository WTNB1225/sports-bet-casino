import { boolean, z } from 'zod'

const createOddsSchema = z.object({
    sportsLeague: z.string(),
    region: z.string(),
    market: z.string(),
    bookmaker: z.string().optional().default("pinnacle"),
})

export { createOddsSchema };