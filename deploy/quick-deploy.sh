#!/bin/bash

# Wowoo 快速部署脚本 - 适用于 101.35.238.15

set -e

echo "🚀 Wowoo 快速部署脚本"
echo "   ═══════════════════════════════════"

# 定义变量
DEPLOY_PATH="/var/www/woyouwu"
LOG_PATH="/var/log/woyouwu"
SERVER_IP="101.35.238.15"

# 检查是否是 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  请使用 sudo 或 root 权限运行此脚本"
    exit 1
fi

echo ""
echo "📋 步骤 1/5: 创建目录..."
mkdir -p $DEPLOY_PATH
mkdir -p $LOG_PATH
mkdir -p $DEPLOY_PATH/client
mkdir -p $DEPLOY_PATH/server
mkdir -p $DEPLOY_PATH/server/uploads

echo "✅ 目录创建完成"
echo ""

echo "📋 步骤 2/5: 检查文件是否已上传..."
if [ ! -f /tmp/woyouwu-client.tar.gz ] && [ ! -d /var/www/woyouwu/client/dist ]; then
    echo "⚠️  请先上传文件到服务器！"
    echo ""
    echo "在你的本地机器上执行："
    echo "  cd /workspace"
    echo "  tar -czvf woyouwu-client.tar.gz client/dist/"
    echo "  tar -czvf woyouwu-server.tar.gz server/"
    echo "  tar -czvf woyouwu-deploy.tar.gz deploy/"
    echo "  scp woyouwu-*.tar.gz root@$SERVER_IP:/tmp/"
    echo ""
    echo "文件上传完成后重新运行此脚本"
    exit 1
fi

# 解压文件（如果找到压缩包）
if [ -f /tmp/woyouwu-client.tar.gz ]; then
    echo "解压客户端文件..."
    tar -xzvf /tmp/woyouwu-client.tar.gz -C /var/www/woyouwu/
fi

if [ -f /tmp/woyouwu-server.tar.gz ]; then
    echo "解压服务器文件..."
    tar -xzvf /tmp/woyouwu-server.tar.gz -C /var/www/woyouwu/
fi

if [ -f /tmp/woyouwu-deploy.tar.gz ]; then
    echo "解压部署配置文件..."
    tar -xzvf /tmp/woyouwu-deploy.tar.gz -C /var/www/woyouwu/
fi

echo "✅ 文件准备完成"
echo ""

echo "📋 步骤 3/5: 安装依赖和配置..."
cd $DEPLOY_PATH/server

if [ ! -f node_modules ]; then
    echo "安装后端依赖..."
    npm install --production
fi

# 配置环境变量
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        echo "✅ 环境变量文件已创建"
    else
        echo "⚠️  .env.production 文件缺失"
    fi
fi

# 生成一个随机 JWT Secret（如果还是默认值）
if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i "s|JWT_SECRET=your-super-secret-jwt-key-change-this-in-production|JWT_SECRET=$NEW_SECRET|" .env
    echo "✅ JWT Secret 已随机生成"
fi

echo "✅ 配置完成"
echo ""

echo "📋 步骤 4/5: 配置服务..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    echo "安装 Nginx..."
    apt install -y nginx
fi

# 检查 MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB 未安装"
    echo "如果需要本地数据库，请运行："
    echo "  apt install -y mongodb-org"
    echo ""
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
fi

# 配置 Nginx
echo "配置 Nginx..."
if [ -f $DEPLOY_PATH/nginx.conf ]; then
    cp $DEPLOY_PATH/nginx.conf /etc/nginx/sites-available/woyouwu
    if [ ! -f /etc/nginx/sites-enabled/woyouwu ]; then
        ln -s /etc/nginx/sites-available/woyouwu /etc/nginx/sites-enabled/
    fi
    nginx -t && systemctl reload nginx
    echo "✅ Nginx 配置完成"
else
    echo "⚠️  Nginx 配置文件缺失"
fi

# 启动后端服务
echo "启动后端服务..."
if [ -f $DEPLOY_PATH/ecosystem.config.js ]; then
    cp $DEPLOY_PATH/ecosystem.config.js $DEPLOY_PATH/server/
    cd $DEPLOY_PATH/server
    pm2 stop woyouwu-server 2>/dev/null || true
    pm2 delete woyouwu-server 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ PM2 服务已启动"
else
    echo "⚠️  PM2 配置文件缺失"
fi

echo ""

echo "📋 步骤 5/5: 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp -y
    ufw allow 'Nginx Full' -y
    if ! ufw status | grep -q "Status: active"; then
        echo "启用防火墙..."
        ufw --force enable
    fi
    echo "✅ 防火墙已配置"
else
    echo "⚠️  未检测到 ufw，请手动配置防火墙"
fi

# 设置权限
chown -R www-data:www-data $DEPLOY_PATH/client
chown -R www-data:www-data $DEPLOY_PATH/server/uploads

echo ""
echo "🎉 部署完成！"
echo "   ═══════════════════════════════════"
echo ""
echo "🌐 访问地址: http://$SERVER_IP"
echo ""
echo "📝 下一步操作："
echo "1. 检查服务状态：pm2 status"
echo "2. 查看日志：pm2 logs woyouwu-server"
echo "3. 确保 MongoDB 已启动"
echo "4. 访问 http://$SERVER_IP 测试"
echo ""
echo "🔧 常用命令："
echo "  pm2 status           - 查看服务状态"
echo "  pm2 logs             - 查看日志"
echo "  pm2 restart woyouwu-server - 重启后端"
echo "  systemctl status nginx - 查看 Nginx 状态"
echo ""
