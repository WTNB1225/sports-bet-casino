import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../../../lib/prisma";

export const eventRoutes = new Hono()
    .get("/sports", async (c) => {
        try {
            const sports = await prisma.sport.findMany();
            return c.json(sports);
        } catch (error) {
            return c.json({ error: "Failed to fetch sports" }, 500);
        }
    })
    .get("/leagues", async (c) => {
        if (!c.req.query("sportId")) {
            return c.json({ error: "Missing sportId query parameter" }, 400);
        }
        try {
            const leagues = await prisma.league.findMany({
                where: {
                    sportId: c.req.query("sportId")
                }
            });
            return c.json(leagues);
        } catch (error) {
            return c.json({ error: "Failed to fetch leagues" }, 500);
        }
    })
    .get("/league/:leagueId", async(c) => {
        const leagueId  = c.req.param("leagueId");
        try {
            const result = await prisma.market.findMany({
                where: {
                    event: {
                        leagueId: leagueId,
                    }
                },
                include: {
                    event: true,
                    odds: true,
                }
            });
            return c.json({
                markets: result
            });
        } catch (error) {
            return c.json({ error: "Failed to fetch league details" }, 500);
        }
    })
    