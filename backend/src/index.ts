import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { verifyFirebaseToken } from './middleware'
import { userRoutes } from './routes/user'

const app = new Hono()
  .use('*', logger())
  .use('*',  cors({
    origin: 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    maxAge: 600,
    credentials: true,
  }))
  .use('*', async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const token = authHeader.split(' ')[1];
    try {
      await verifyFirebaseToken(token);
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    await next();
  })
  .route('/users', userRoutes)
  
export default { 
  port: 3030, 
  fetch: app.fetch, 
} 

export type AppType = typeof app

