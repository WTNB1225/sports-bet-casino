import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createBetSchema } from "./schema";
import { prisma } from "@/lib/prisma";

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