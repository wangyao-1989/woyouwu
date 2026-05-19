#!/bin/bash

# 部署脚本 - 在服务器上执行

set -e

echo "🚀 开始部署 Wowoo 网站..."

# 定义变量
DEPLOY_PATH="/var/www/woyouwu"
LOG_PATH="/var/log/woyouwu"

# 1. 创建目录
echo "📁 创建部署目录..."
sudo mkdir -p $DEPLOY_PATH
sudo mkdir -p $LOG_PATH
sudo mkdir -p $DEPLOY_PATH/client
sudo mkdir -p $DEPLOY_PATH/server

# 2. 复制文件（你需要先上传文件到服务器）
# 如果使用 scp 上传：
# scp -r ./client root@your-server:$DEPLOY_PATH/
# scp -r ./server root@your-server:$DEPLOY_PATH/

echo "⚠️ 请先将项目文件上传到服务器:"
echo "   scp -r ./client root@your-server:$DEPLOY_PATH/"
echo "   scp -r ./server root@your-server:$DEPLOY_PATH/"
echo "   scp ./deploy/* root@your-server:$DEPLOY_PATH/"

# 3. 安装后端依赖
echo "📦 安装后端依赖..."
cd $DEPLOY_PATH/server
npm install --production

# 4. 复制环境配置文件
echo "⚙️ 配置环境变量..."
if [ ! -f $DEPLOY_PATH/server/.env ]; then
    sudo cp $DEPLOY_PATH/server/.env.production $DEPLOY_PATH/server/.env
    echo "⚠️ 请编辑 $DEPLOY_PATH/server/.env 文件，设置你的 MongoDB URI 和 JWT Secret"
fi

# 5. 安装 PM2
echo "🔧 安装 PM2..."
sudo npm install -g pm2

# 6. 配置 PM2
echo "🚀 配置 PM2..."
sudo cp $DEPLOY_PATH/ecosystem.config.js $DEPLOY_PATH/server/
cd $DEPLOY_PATH/server
sudo pm2 start ecosystem.config.js
sudo pm2 save

# 7. 配置 Nginx
echo "🌐 配置 Nginx..."
sudo cp $DEPLOY_PATH/nginx.conf /etc/nginx/sites-available/woyouwu
sudo ln -s /etc/nginx/sites-available/woyouwu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. 设置防火墙
echo "🔒 配置防火墙..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# 9. 配置 SSL（可选）
echo "🔒 SSL 配置（可选）..."
echo "如果需要配置 SSL，请运行:"
echo "sudo certbot --nginx -d your-domain.com"

# 10. 完成
echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 后续操作:"
echo "1. 编辑 $DEPLOY_PATH/server/.env 配置数据库和密钥"
echo "2. 确保 MongoDB 已启动并运行"
echo "3. 访问你的域名检查网站是否正常运行"
echo ""
echo "🔧 常用命令:"
echo "  查看日志: pm2 logs woyouwu-server"
echo "  重启服务: pm2 restart woyouwu-server"
echo "  查看状态: pm2 status"
echo "  重启 Nginx: sudo systemctl restart nginx"
