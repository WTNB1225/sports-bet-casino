import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../../../lib/prisma";

export const eventRoutes = new Hono()
    .get("/", async (c) => {
        
    })