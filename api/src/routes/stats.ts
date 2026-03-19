import { Hono } from 'hono'
import { db } from '../db'
import { products, leads, events } from '../db/schema'
import { sql, gte } from 'drizzle-orm'

const app = new Hono()

// 汇总统计
app.get('/', async (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [productCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(products)

  const [leadCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leads)

  const [todayLeadCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leads)
    .where(gte(leads.createdAt, today))

  // 总访客（去重 sessionId）
  const [totalVisitors] = await db
    .select({ count: sql<number>`COUNT(DISTINCT session_id)` })
    .from(events)

  // 今日访客（去重 sessionId）
  const [todayVisitors] = await db
    .select({ count: sql<number>`COUNT(DISTINCT session_id)` })
    .from(events)
    .where(gte(events.createdAt, today))

  return c.json({
    products: productCount?.count ?? 0,
    leads: leadCount?.count ?? 0,
    todayLeads: todayLeadCount?.count ?? 0,
    totalVisitors: totalVisitors?.count ?? 0,
    todayVisitors: todayVisitors?.count ?? 0,
  })
})

export default app
