import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema, signInWithIdentifierSchema } from "./schema";
import { prisma } from "../../lib/prisma";
import { createFirebaseCustomToken } from "../../middleware";

export const userRoutes = new Hono<{ Variables: { uid: string; email: string } }>()
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
    .post("/sign-in", zValidator("json", signInWithIdentifierSchema), async (c) => {
        const { identifier, password } = c.req.valid("json");
        try {
            const normalizedIdentifier = identifier.trim();
            const isEmail = normalizedIdentifier.includes("@");
            const user = await prisma.user.findUnique({
                where: isEmail
                    ? { email: normalizedIdentifier }
                    : { userId: normalizedIdentifier },
            });
            console.log("User found:", user);
            if (!user) {
                return c.json({ error: "Invalid credentials" }, 401);
            }
            const firebaseApiKey = process.env.FIREBASE_API_KEY;
            if (!firebaseApiKey) {
                console.error("FIREBASE_API_KEY is not set");
                return c.json({ error: "Authentication is not configured" }, 500);
            }
            const firebaseRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: user.email,
                    password,
                    returnSecureToken: true,
                }),
            });
            console.log("Firebase sign-in response status:", firebaseRes);

            if (!firebaseRes.ok) {
                return c.json({ error: "Invalid credentials" }, 401);
            }

            const firebaseData = await firebaseRes.json() as { localId?: string };
            console.log("Firebase sign-in response:", firebaseData);
            if (!firebaseData.localId || firebaseData.localId !== user.firebaseUid) {
                return c.json({ error: "Invalid credentials" }, 401);
            }

            const customToken = await createFirebaseCustomToken(user.firebaseUid);
            return c.json({ customToken });
        } catch (error) {
            console.error("Error signing in with identifier:", error);
            return c.json({ error: "Failed to sign in" }, 500);
        }
    })
    .post("/", zValidator("json", createUserSchema), async (c) => {
        const userId = c.req.valid("json").userId;
        const uid = c.get("uid");
        const email = c.get("email");
        try {
            await prisma.user.create({
                data: {
                    firebaseUid: uid,
                    email,
                    userId: userId,
                },
            });
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to create user" }, 500);
        }
        return c.json({ message: "User created successfully" });
    })