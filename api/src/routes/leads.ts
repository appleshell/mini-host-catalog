import { Hono } from 'hono'
import { db } from '../db'
import { leads } from '../db/schema'
import { desc, eq, sql } from 'drizzle-orm'

const app = new Hono()

// 创建线索（前台调用）
app.post('/', async (c) => {
  const body = await c.req.json()
  const { name, phone, wechat, requirement, interestedProducts, source, sessionId } = body

  if (!phone && !wechat) {
    return c.json({ error: '请提供手机号或微信号' }, 400)
  }

  await db.insert(leads).values({
    name,
    phone,
    wechat,
    requirement,
    interestedProducts: JSON.stringify(interestedProducts ?? []),
    sessionId: sessionId ?? null,
    source: source ?? 'catalog',
    status: '未跟进',
  })

  return c.json({ success: true })
})

// 获取线索列表（管理后台）
app.get('/', async (c) => {
  const status = c.req.query('status')
  const page = Number(c.req.query('page') || '1')
  const pageSize = Number(c.req.query('pageSize') || '20')
  const offset = (page - 1) * pageSize

  const baseQuery = db.select().from(leads)
  const rows = status
    ? await baseQuery.where(eq(leads.status, status)).orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset)
    : await baseQuery.orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset)

  const countQuery = status
    ? await db.select({ total: sql<number>`COUNT(*)` }).from(leads).where(eq(leads.status, status))
    : await db.select({ total: sql<number>`COUNT(*)` }).from(leads)

  const total = countQuery[0]?.total ?? 0

  return c.json({ data: rows, total, page, pageSize })
})

// 更新线索状态/备注
app.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const { status, adminNotes } = body

  const updateData: Record<string, unknown> = {}
  if (status !== undefined) updateData.status = status
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes
  if (status !== undefined) updateData.followedAt = new Date()

  const result = await db.update(leads).set(updateData).where(eq(leads.id, id)).returning()
  if (!result.length) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: result[0] })
})

export default app
