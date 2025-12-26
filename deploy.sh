#!/bin/bash

# ============================================
# Watermark Remover 后端部署脚本
# 用法: ./deploy.sh
# ============================================

set -e

# 配置
SERVER_USER="root"
SERVER_HOST="139.196.192.211"
SERVER_PATH="/www/wwwroot/watermark-backend"
LOCAL_BACKEND="./backend"

echo "🚀 开始部署 Watermark Remover 后端..."

# 1. 打包（排除 node_modules、.env 和数据库文件）
echo "📦 步骤 1/4: 打包文件..."
tar -czvf /tmp/watermark-backend.tar.gz \
  --exclude='backend/node_modules' \
  --exclude='backend/.env' \
  --exclude='backend/*.db' \
  --exclude='backend/*.db-shm' \
  --exclude='backend/*.db-wal' \
  backend

# 2. 上传到服务器
echo "📤 步骤 2/4: 上传到服务器..."
scp /tmp/watermark-backend.tar.gz "$SERVER_USER@$SERVER_HOST:/tmp/"

# 3. 在服务器上解压并部署
echo "🔧 步骤 3/4: 服务器端部署..."
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

# 创建目录
mkdir -p /www/wwwroot/watermark-backend

# 备份旧的 .env 和数据库
if [ -f /www/wwwroot/watermark-backend/.env ]; then
  cp /www/wwwroot/watermark-backend/.env /tmp/watermark-backend-env-backup
fi
if [ -f /www/wwwroot/watermark-backend/watermark.db ]; then
  cp /www/wwwroot/watermark-backend/watermark.db /tmp/watermark-backend-db-backup
fi

# 解压新代码
cd /www/wwwroot
rm -rf watermark-backend-old
[ -d watermark-backend ] && mv watermark-backend watermark-backend-old
tar -xzvf /tmp/watermark-backend.tar.gz
mv backend watermark-backend

# 恢复 .env
if [ -f /tmp/watermark-backend-env-backup ]; then
  cp /tmp/watermark-backend-env-backup /www/wwwroot/watermark-backend/.env
fi

# 恢复数据库
if [ -f /tmp/watermark-backend-db-backup ]; then
  cp /tmp/watermark-backend-db-backup /www/wwwroot/watermark-backend/watermark.db
fi

# 安装依赖
cd /www/wwwroot/watermark-backend
npm install --production

# 重启服务
pm2 restart watermark-backend 2>/dev/null || pm2 start src/index.js --name watermark-backend
pm2 save

echo "✅ 服务器端部署完成！"
ENDSSH

# 4. 清理
echo "🧹 步骤 4/4: 清理临时文件..."
rm /tmp/watermark-backend.tar.gz

echo ""
echo "✅ 部署完成！"
echo "📍 服务地址: http://$SERVER_HOST:3000"
echo ""
echo "⚠️  首次部署请在服务器上配置 .env 文件："
echo "   ssh $SERVER_USER@$SERVER_HOST"
echo "   vi /www/wwwroot/watermark-backend/.env"
echo ""
echo "📝 必须配置的环境变量："
echo "   # 火山引擎 Ark API"
echo '   ARK_API_KEY="your-ark-api-key"'
echo '   ARK_MODEL="doubao-seedream-4-5-251128"'
echo ""
echo "   # Apple IAP (可选)"
echo '   APPLE_SHARED_SECRET="your-apple-shared-secret"'
echo ""
echo "   # 生产模式"
echo '   NODE_ENV="production"'
