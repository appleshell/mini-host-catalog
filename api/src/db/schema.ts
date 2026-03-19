import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),       // 分类
  model: text('model').notNull(),             // 产品型号
  imageUrl: text('image_url'),               // 图片路径
  cpu: text('cpu'),                           // 处理器
  memory: text('memory'),                     // 内存
  storage: text('storage'),                   // 硬盘
  gpu: text('gpu'),                           // 显卡
  network: text('network'),                   // 网络
  audio: text('audio'),                       // 音频
  display: text('display'),                   // 显示
  otherPorts: text('other_ports'),            // 其它接口
  dimensions: text('dimensions'),             // 物理尺寸
  os: text('os'),                             // 系统
  power: text('power'),                       // 电源
  cooling: text('cooling'),                   // 散热
  mounting: text('mounting'),                 // 安装方式
  notes: text('notes'),                       // 备注
  // 结构化字段，用于搜索筛选
  networkCount: integer('network_count'),     // 网口数量
  serialCount: integer('serial_count'),       // 串口数量
  hasWifi: integer('has_wifi', { mode: 'boolean' }),
  hasFanless: integer('has_fanless', { mode: 'boolean' }), // 无风扇
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  phone: text('phone'),
  wechat: text('wechat'),
  requirement: text('requirement'),           // 用户描述的需求
  interestedProducts: text('interested_products'), // JSON 数组，感兴趣的产品
  sessionId: text('session_id'),             // 匿名会话 ID，用于关联浏览行为
  source: text('source').default('catalog'), // 来源
  status: text('status').default('未跟进'),  // 未跟进 / 跟进中 / 已成交 / 无效
  adminNotes: text('admin_notes'),           // 管理员跟进备注
  followedAt: integer('followed_at', { mode: 'timestamp' }), // 最后跟进时间
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id'),             // 匿名会话 ID
  event: text('event').notNull(),            // 事件名：product_view / product_card_click / filter_applied / search_query
  productId: integer('product_id'),          // 关联产品 ID（可为空）
  productModel: text('product_model'),       // 产品型号快照
  extra: text('extra'),                      // JSON，存储额外信息（搜索词、筛选条件等）
  ua: text('ua'),                            // User-Agent（了解微信/浏览器）
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const chatLogs = sqliteTable('chat_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(),               // user | assistant
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
