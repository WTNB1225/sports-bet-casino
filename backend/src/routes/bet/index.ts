import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createBetSchema } from "./schema";
import { prisma } from "@/lib/prisma";
import { Outcome } from "@/lib/generated/prisma/enums";

interface Bet {
    oddId: string;
    amount: bigint;
    id: string;
    outcome: Outcome;
    createdAt: Date;
    userId: string;
}

const BigintToNumber = (bet: Bet[]): (Omit<Bet, "amount"> & { amount: number })[] => {
    return bet.map((b) => ({
        ...b,
        amount: Number(b.amount) / 100
    }));
};

export const betRoutes = new Hono<{Variables: { userId: string }}>()
    .post("/", zValidator("json", createBetSchema), async (c) => {
        const { oddId, amount } = c.req.valid("json");
        const userId = c.get("userId");
        console.log(oddId, amount, userId);
        if (!userId) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        try {
            //ここでベットの作成処理を実装する
            const result = await prisma.bet.create({
                data: {
                    userId: userId,
                    oddId: oddId,
                    amount: amount * 100,
                }
            })
            if (!result) {
                return c.json({ error: "Failed to create bet" }, 500);
            }
            return c.json({ success: true, betId: result.id });
        } catch (error) {
            console.error("Error creating bet:", error);
            return c.json({ error: "Failed to create bet" }, 500);
        }
    })
    .get("/", async (c) => {
        const userId = c.get("userId");
        const result = await prisma.bet.findMany({
            where: {
                userId: userId,
            }
        });
        const bets = BigintToNumber(result);
        return c.json({ bets });
    })
    .get("/:outcome", async (c) => {
        const userId = c.get("userId");
        const outcome = c.req.param("outcome");
        const result = await prisma.bet.findMany({
            where: {
                userId: userId,
                outcome: outcome.toUpperCase() as Outcome,
            }
        });
        const bets = BigintToNumber(result);
        return c.json({ bets });
    })