# 迷你主机产品目录系统

一个用于展示迷你主机产品、收集客户线索、分析用户行为的完整系统。

## 项目结构

```
mini-host-catalog/
├── api/          # 后端 API (Hono + SQLite)
├── web/          # 客户端网站 (Next.js)
├── admin/        # 管理后台 (Next.js)
└── scripts/      # 工具脚本
```

## 技术栈

- **后端**: Hono + SQLite + Drizzle ORM
- **前端**: Next.js 15 + React + TypeScript
- **数据库**: SQLite (生产环境可升级为 PostgreSQL)

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
# 安装 API 依赖
cd api && pnpm install

# 安装 Web 依赖
cd ../web && pnpm install

# 安装 Admin 依赖
cd ../admin && pnpm install
```

### 配置环境变量

每个项目都需要配置环境变量，参考各目录下的 `.env.example` 文件：

```bash
# API
cp api/.env.example api/.env

# Web
cp web/.env.example web/.env.local

# Admin
cp admin/.env.example admin/.env.local
```

### 初始化数据库

```bash
cd api
pnpm run db:migrate
```

### 启动开发服务器

```bash
# 终端 1: 启动 API (端口 3001)
cd api && pnpm run dev

# 终端 2: 启动客户端网站 (端口 3000)
cd web && pnpm run dev

# 终端 3: 启动管理后台 (端口 3002)
cd admin && pnpm run dev
```

访问地址：
- 客户端: http://localhost:3000
- 管理后台: http://localhost:3002
- API: http://localhost:3001

## 核心功能

### 客户端 (web)
- 产品展示和搜索
- 产品详情页
- 线索提交表单
- 用户行为追踪

### 管理后台 (admin)
- 产品管理 (增删改查)
- 线索管理 (查看、更新状态、添加备注)
- 数据分析仪表板
- 用户行为统计

### API
- RESTful API
- 产品、线索、事件管理
- 统计分析接口
- 图片上传

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 数据备份

```bash
cd api
pnpm run backup
```

备份文件保存在 `api/data/backups/` 目录。

## 开发指南

### 添加新产品

1. 登录管理后台
2. 进入"产品管理"
3. 点击"添加产品"
4. 填写产品信息并上传图片

### 查看线索

1. 登录管理后台
2. 进入"线索管理"
3. 查看客户提交的询盘信息
4. 更新跟进状态和备注

## 常见问题

### 数据库文件在哪里？
`api/data/catalog.db`

### 如何重置数据库？
```bash
cd api
rm data/catalog.db
pnpm run db:migrate
```

### 管理后台默认密码？
需要在 `admin/.env.local` 中配置 `ADMIN_PASSWORD`

## 许可证

MIT
