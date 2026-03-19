import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import products from './routes/products'
import leads from './routes/leads'
import events from './routes/events'
import stats from './routes/stats'
import upload from './routes/upload'
import { logError, logInfo } from './lib/logger'
import { db } from './db'

const app = new Hono()

app.use('*', logger())

const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002']
app.use('*', cors({ origin: corsOrigin }))

app.use('/images/*', serveStatic({ root: './public' }))

app.route('/api/products', products)
app.route('/api/leads', leads)
app.route('/api/events', events)
app.route('/api/stats', stats)
app.route('/api/upload', upload)

app.get('/health', (c) => {
  try {
    db.prepare('SELECT 1').get()
    return c.json({ ok: true, database: 'connected', timestamp: new Date().toISOString() })
  } catch (error) {
    logError(error, 'Health check failed')
    return c.json({ ok: false, database: 'error' }, 500)
  }
})

app.onError((err, c) => {
  logError(err, `${c.req.method} ${c.req.url}`)
  return c.json({ error: 'Internal server error' }, 500)
})

app.onError((err, c) => {
  logError(err, `${c.req.method} ${c.req.url}`)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, () => {
  logInfo(`🚀 API server running on http://localhost:${port}`)
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
