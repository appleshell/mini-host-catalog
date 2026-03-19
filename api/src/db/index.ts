import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'data/catalog.db')
const sqlite = new Database(dbPath)

// 开启 WAL 模式，提升并发读性能
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })
