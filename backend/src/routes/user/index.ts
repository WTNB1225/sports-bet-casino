import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema } from "./scheme";
import { prisma } from "../../lib/prisma";

export const userRoutes = new Hono<{ Variables: { uid: string } }>()
    .get("/registered", async (c) => { //firebase登録後、自前DBにユーザが存在するか確認するエンドポイント
        const uid = c.get("uid");
        if (!uid) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        try {
            const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
            if (!user) {
                return c.json({ registered: false });
            }
            return c.json({ registered: true });
        } catch (error) {
            console.error("Error checking user registration:", error);
            return c.json({ error: "Failed to check user registration" }, 500);
        }

    })
    .post("/", zValidator("json", createUserSchema), async (c) => {
        const { email, name } = c.req.valid("json");
        console.log(email, name);
        try {
            await prisma.user.create({
                data: {
                    firebaseUid: c.get("uid"),
                    email,
                    userId: name,
                    password: "dummy", // パスワードはダミーで保存（Google認証のみを想定）
                },
            });
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to create user" }, 500);
        }
        return c.json({ message: "User created successfully" });
    })