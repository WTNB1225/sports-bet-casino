import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema } from "./scheme";


export const userRoutes = new Hono()
    .post("/", zValidator("json", createUserSchema), async (c) => {
        const { email, name } = c.req.valid("json");
        console.log(email, name);
        return c.json({ message: "User created successfully" });
    })