import { Hono } from 'hono'
import { db } from '../db'
import { products } from '../db/schema'
import { like, or, eq, and } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')

function getProductImages(model: string): string[] {
  const modelSafe = model.replace(/\//g, '_').replace(/\\/g, '_')
  const dir = path.join(PUBLIC_DIR, 'images', modelSafe)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
    .sort((a, b) => {
      const ai = parseInt(a) || 0
      const bi = parseInt(b) || 0
      return ai - bi
    })
    .map(f => `/images/${modelSafe}/${f}`)
}

const app = new Hono()

// 获取所有产品（支持分类筛选）
app.get('/', async (c) => {
  const category = c.req.query('category')
  const rows = category
    ? await db.select().from(products).where(eq(products.category, category))
    : await db.select().from(products)
  return c.json({ data: rows })
})

// 搜索产品
app.get('/search', async (c) => {
  const q = c.req.query('q') ?? ''
  const category = c.req.query('category')
  const hasWifi = c.req.query('wifi')
  const fanless = c.req.query('fanless')

  const conditions = [
    or(
      like(products.model, `%${q}%`),
      like(products.cpu, `%${q}%`),
      like(products.network, `%${q}%`),
      like(products.notes, `%${q}%`),
    ),
  ]

  if (category) conditions.push(eq(products.category, category))
  if (hasWifi === '1') conditions.push(eq(products.hasWifi, true))
  if (fanless === '1') conditions.push(eq(products.hasFanless, true))

  const rows = await db.select().from(products).where(and(...conditions))
  return c.json({ data: rows })
})

// 获取单个产品（含所有图片）
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const row = await db.select().from(products).where(eq(products.id, id)).get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  const images = getProductImages(row.model)
  return c.json({ data: { ...row, images } })
})

// 新增产品
app.post('/', async (c) => {
  const body = await c.req.json()
  const result = await db.insert(products).values({
    category: body.category,
    model: body.model,
    imageUrl: body.imageUrl ?? null,
    cpu: body.cpu ?? null,
    memory: body.memory ?? null,
    storage: body.storage ?? null,
    gpu: body.gpu ?? null,
    network: body.network ?? null,
    audio: body.audio ?? null,
    display: body.display ?? null,
    otherPorts: body.otherPorts ?? null,
    dimensions: body.dimensions ?? null,
    os: body.os ?? null,
    power: body.power ?? null,
    cooling: body.cooling ?? null,
    mounting: body.mounting ?? null,
    notes: body.notes ?? null,
    networkCount: body.networkCount ?? null,
    serialCount: body.serialCount ?? null,
    hasWifi: body.hasWifi ?? null,
    hasFanless: body.hasFanless ?? null,
  }).returning()
  return c.json({ data: result[0] }, 201)
})

// 更新产品
app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const result = await db.update(products)
    .set({
      category: body.category,
      model: body.model,
      imageUrl: body.imageUrl ?? null,
      cpu: body.cpu ?? null,
      memory: body.memory ?? null,
      storage: body.storage ?? null,
      gpu: body.gpu ?? null,
      network: body.network ?? null,
      audio: body.audio ?? null,
      display: body.display ?? null,
      otherPorts: body.otherPorts ?? null,
      dimensions: body.dimensions ?? null,
      os: body.os ?? null,
      power: body.power ?? null,
      cooling: body.cooling ?? null,
      mounting: body.mounting ?? null,
      notes: body.notes ?? null,
      networkCount: body.networkCount ?? null,
      serialCount: body.serialCount ?? null,
      hasWifi: body.hasWifi ?? null,
      hasFanless: body.hasFanless ?? null,
    })
    .where(eq(products.id, id))
    .returning()
  if (!result.length) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: result[0] })
})

// 删除产品
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(products).where(eq(products.id, id))
  return c.json({ ok: true })
})

export default app

