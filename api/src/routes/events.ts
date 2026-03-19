import { Hono } from 'hono'
import { db } from '../db'
import { events } from '../db/schema'
import { eq, desc, sql, gte } from 'drizzle-orm'

const app = new Hono()

// 写入一条事件
app.post('/', async (c) => {
  const body = await c.req.json()
  const ua = c.req.header('user-agent') ?? ''

  const { sessionId, event, productId, productModel, extra } = body

  if (!event) {
    return c.json({ error: 'event is required' }, 400)
  }

  await db.insert(events).values({
    sessionId: sessionId ?? null,
    event,
    productId: productId ?? null,
    productModel: productModel ?? null,
    extra: extra ? JSON.stringify(extra) : null,
    ua,
  })

  return c.json({ ok: true })
})

// 按 sessionId 查询事件（线索浏览轨迹）
app.get('/', async (c) => {
  const sessionId = c.req.query('sessionId')
  if (!sessionId) return c.json({ data: [] })
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.sessionId, sessionId))
    .orderBy(desc(events.createdAt))
    .limit(50)
  return c.json({ data: rows })
})

// 查询热门产品（按 product_view 事件统计）
app.get('/popular-products', async (c) => {
  const rows = await db
    .select({
      productId: events.productId,
      productModel: events.productModel,
      views: sql<number>`COUNT(*)`.as('views'),
    })
    .from(events)
    .where(eq(events.event, 'product_view'))
    .groupBy(events.productId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(20)

  return c.json({ data: rows })
})

// 访问量趋势（过去 N 天，按日统计 session 数）
app.get('/trend', async (c) => {
  const days = Number(c.req.query('days') || '14')
  const from = new Date()
  from.setDate(from.getDate() - days)
  from.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`.as('date'),
      visitors: sql<number>`COUNT(DISTINCT session_id)`.as('visitors'),
      events: sql<number>`COUNT(*)`.as('events'),
    })
    .from(events)
    .where(gte(events.createdAt, from))
    .groupBy(sql`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`)
    .orderBy(sql`date`)

  return c.json({ data: rows })
})

// 热门搜索词 Top 10
app.get('/search-terms', async (c) => {
  const rows = await db
    .select({
      term: sql<string>`json_extract(extra, '$.query')`.as('term'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(events)
    .where(eq(events.event, 'search_query'))
    .groupBy(sql`json_extract(extra, '$.query')`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10)

  return c.json({ data: rows.filter((r) => r.term) })
})

// UA 来源分析
app.get('/ua-stats', async (c) => {
  const rows = await db
    .select({
      ua: events.ua,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(events)
    .groupBy(events.ua)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(50)

  // 简单分类
  let wechat = 0, mobile = 0, desktop = 0
  for (const row of rows) {
    const ua = (row.ua ?? '').toLowerCase()
    if (ua.includes('micromessenger')) wechat += row.count
    else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) mobile += row.count
    else desktop += row.count
  }

  return c.json({ data: { wechat, mobile, desktop } })
})

export default app
