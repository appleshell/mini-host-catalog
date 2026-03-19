#!/bin/bash

echo "🚀 启动迷你主机产品目录系统"
echo ""

# 检查环境变量
check_env() {
  if [ ! -f "$1" ]; then
    echo "❌ 缺少环境变量文件: $1"
    echo "   请复制 $2 并配置"
    return 1
  fi
  echo "✅ $1"
  return 0
}

echo "检查环境变量..."
check_env "api/.env" "api/.env.example"
check_env "web/.env.local" "web/.env.example"
check_env "admin/.env.local" "admin/.env.example"

echo ""
echo "检查数据库..."
if [ ! -f "api/data/catalog.db" ]; then
  echo "⚠️  数据库不存在，正在初始化..."
  cd api && pnpm run db:migrate && cd ..
  echo "✅ 数据库初始化完成"
else
  echo "✅ 数据库已存在"
fi

echo ""
echo "启动服务..."
echo "请在不同终端窗口运行以下命令："
echo ""
echo "  终端 1: cd api && pnpm run dev"
echo "  终端 2: cd web && pnpm run dev"
echo "  终端 3: cd admin && pnpm run dev"
echo ""
echo "或使用 PM2 启动："
echo "  pm2 start ecosystem.config.js"
