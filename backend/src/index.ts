import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { verifyFirebaseToken } from './middleware/middleware'
import { prisma } from '@/lib/prisma'
import { userRoutes } from './routes/user'
import { oddsRoutes } from './routes/odds'
import { eventRoutes } from './routes/event'
import { betRoutes } from './routes/bet'

const app = new Hono<{ Variables: { uid: string; email: string; userId: string } }>()
  .use('*', logger())
  .use('*', cors({
    origin: process.env.CORS_ORIGIN as string || 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    maxAge: 600,
    credentials: true,
  }))
  .use('*', async (c, next) => {
    if (c.req.path === '/users/sign-in' || (c.req.path).startsWith("/events")) {
      await next();
      return
    }
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await verifyFirebaseToken(token);
      if (!decodedToken.uid) {
        return c.json({ error: 'UID not found in token' }, 401)
      }
      c.set("uid", decodedToken.uid);
      if (!decodedToken.email) {
        return c.json({ error: 'Email not found in token' }, 401)
      }
      c.set("email", decodedToken.email);
      if (c.req.path !== '/users/registered' && c.req.path !== '/users') {
        const user = await prisma.user.findUnique({ where: { firebaseUid: decodedToken.uid } });
        if (!user) {
          return c.json({ error: 'User not found' }, 404)
        }
        c.set("userId", user.userId);
      }
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    await next();
  })
  .route('/users', userRoutes)
  .route('/odds', oddsRoutes)
  .route('/events', eventRoutes)
  .route('/bets', betRoutes)

export default {
  port: 3030,
  fetch: app.fetch,
}

export type AppType = typeof app

