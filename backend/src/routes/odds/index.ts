import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createOddsSchema } from "./schema";
import { syncOdds } from "../../service/sync";

export const oddsRoutes = new Hono()
    .post("/sync", zValidator("json", createOddsSchema), async (c) => {
        const { sportsLeague, region, market, bookmaker } = c.req.valid("json");
        try {
            await syncOdds(sportsLeague, region, market, bookmaker);
            return c.json({ success: true });
        } catch (error) {
            console.error("Error syncing odds:", error);
            return c.json({ error: "Failed to sync odds" }, 500);
        }
    })