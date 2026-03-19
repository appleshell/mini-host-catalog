# API 文档

Base URL: `http://localhost:3001` (开发环境)

## 健康检查

### GET /health
检查 API 和数据库状态

**响应示例：**
```json
{
  "ok": true,
  "database": "connected",
  "timestamp": "2026-03-16T07:39:45.039Z"
}
```

## 产品 API

### GET /api/products
获取产品列表

**查询参数：**
- `search` - 搜索关键词
- `category` - 产品分类
- `minPrice` - 最低价格
- `maxPrice` - 最高价格

**响应示例：**
```json
[
  {
    "id": 1,
    "name": "产品名称",
    "category": "分类",
    "price": 3500,
    "specs": {},
    "images": ["url1", "url2"]
  }
]
```

### GET /api/products/:id
获取产品详情

### POST /api/products
创建产品（管理员）

### PUT /api/products/:id
更新产品（管理员）

### DELETE /api/products/:id
删除产品（管理员）

## 线索 API

### GET /api/leads
获取线索列表（管理员）

### POST /api/leads
提交线索

**请求体：**
```json
{
  "name": "客户姓名",
  "phone": "13800138000",
  "wechat": "微信号",
  "requirements": "需求描述",
  "productId": 1
}
```

### PUT /api/leads/:id
更新线索状态（管理员）

## 事件追踪 API

### POST /api/events
记录用户行为事件

**请求体：**
```json
{
  "type": "product_view",
  "productId": 1,
  "sessionId": "uuid"
}
```

## 统计 API

### GET /api/stats/overview
获取概览统计

### GET /api/stats/products
获取产品统计

### GET /api/stats/leads
获取线索统计

## 上传 API

### POST /api/upload
上传图片

**Content-Type:** `multipart/form-data`

**响应示例：**
```json
{
  "url": "/images/uploads/filename.jpg"
}
```
