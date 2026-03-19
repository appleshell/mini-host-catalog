# 部署指南

## 部署前检查清单

- [ ] 已配置所有环境变量
- [ ] 已测试数据库迁移
- [ ] 已设置强密码
- [ ] 已配置 CORS 域名
- [ ] 已测试备份脚本

## 服务器要求

- Node.js >= 18
- 至少 1GB RAM
- 至少 10GB 磁盘空间
- 支持 HTTPS 的域名（推荐）

## 部署步骤

### 1. 准备服务器

```bash
# 安装 Node.js 和 pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 克隆代码
git clone <your-repo-url> mini-host-catalog
cd mini-host-catalog
```

### 2. 配置环境变量

#### API (.env)
```bash
cd api
cp .env.example .env
nano .env
```

修改以下配置：
```env
PORT=3001
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
NODE_ENV=production
```

#### Web (.env.local)
```bash
cd ../web
cp .env.example .env.local
nano .env.local
```

修改：
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Admin (.env.local)
```bash
cd ../admin
cp .env.example .env.local
nano .env.local
```

修改：
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
ADMIN_PASSWORD=your_very_strong_password_here
```

### 3. 安装依赖

```bash
# API
cd api && pnpm install --prod

# Web
cd ../web && pnpm install

# Admin
cd ../admin && pnpm install
```

### 4. 初始化数据库

```bash
cd api
pnpm run db:migrate
```

### 5. 构建前端

```bash
# Web
cd web
pnpm run build

# Admin
cd ../admin
pnpm run build
```

### 6. 使用 PM2 启动服务

```bash
# 安装 PM2
pnpm add -g pm2

# 启动 API
cd api
pm2 start pnpm --name "catalog-api" -- start

# 启动 Web
cd ../web
pm2 start pnpm --name "catalog-web" -- start

# 启动 Admin
cd ../admin
pm2 start pnpm --name "catalog-admin" -- start

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 7. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/catalog

# API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Web
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/catalog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. 配置 SSL (使用 Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com
```

### 9. 设置自动备份

```bash
# 添加到 crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * cd /path/to/mini-host-catalog/api && pnpm run backup
```

## 验证部署

访问以下地址检查：
- https://yourdomain.com - 客户端网站
- https://admin.yourdomain.com - 管理后台
- https://api.yourdomain.com/health - API 健康检查

## 监控和维护

### 查看日志
```bash
# PM2 日志
pm2 logs catalog-api
pm2 logs catalog-web
pm2 logs catalog-admin

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 重启服务
```bash
pm2 restart catalog-api
pm2 restart catalog-web
pm2 restart catalog-admin
```

### 更新代码
```bash
git pull
cd api && pnpm install --prod
cd ../web && pnpm install && pnpm run build
cd ../admin && pnpm install && pnpm run build
pm2 restart all
```

## 故障排查

### API 无法启动
- 检查端口是否被占用：`lsof -i :3001`
- 检查数据库文件权限
- 查看 PM2 日志：`pm2 logs catalog-api`

### 前端无法连接 API
- 检查 CORS 配置
- 检查环境变量中的 API 地址
- 检查防火墙规则

### 数据库错误
- 检查数据库文件是否存在
- 运行迁移：`cd api && pnpm run db:migrate`
- 恢复备份：`cp data/backups/catalog-xxx.db data/catalog.db`

## 安全建议

1. 使用强密码
2. 定期更新依赖：`pnpm update`
3. 启用防火墙，只开放必要端口
4. 定期检查日志
5. 设置备份到远程存储
6. 考虑使用 CDN 加速静态资源

## 性能优化

1. 启用 Nginx gzip 压缩
2. 配置静态资源缓存
3. 使用 PM2 cluster 模式（如需要）
4. 定期清理旧日志文件
5. 监控磁盘空间使用

## 回滚流程

如果部署出现问题：

```bash
# 1. 停止服务
pm2 stop all

# 2. 恢复代码
git checkout <previous-commit>

# 3. 恢复数据库
cd api
cp data/backups/catalog-<timestamp>.db data/catalog.db

# 4. 重启服务
pm2 restart all
```
