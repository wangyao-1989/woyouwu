# Wowoo 网站部署指南

## 📋 部署概览

本指南将帮助你把 Wowoo 网站部署到你的云服务器（VPS）上。

### 架构
- **前端**: React + Vite 静态文件，通过 Nginx 提供服务
- **后端**: Node.js + Express API 服务，通过 PM2 管理
- **数据库**: MongoDB（需要你自行安装或使用云数据库）
- **反向代理**: Nginx

---

## 🚀 快速开始

### 第一步：准备你的服务器

#### 1.1 系统要求
- Ubuntu 20.04+ 或 CentOS 7+
- 1GB+ RAM
- 20GB+ 可用磁盘空间
- Root 或 sudo 权限

#### 1.2 安装必要软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 MongoDB（或者使用云数据库如 MongoDB Atlas）
sudo apt install -y mongodb-org

# 安装 PM2
sudo npm install -g pm2
```

#### 1.3 启动 MongoDB
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 第二步：上传项目文件到服务器

#### 2.1 在本地打包文件
在你的本地机器上：
```bash
cd /workspace

# 打包 client（已构建的生产版本）
cp -r client/dist ./client-build

# 打包 server
cp -r server ./server-build

# 打包部署配置
cp -r deploy ./deploy-build
```

#### 2.2 上传到服务器
```bash
# 使用 scp 上传（替换 your-server-ip 和 your-username）
scp -r ./client-build your-username@your-server-ip:/tmp/woyouwu-client
scp -r ./server-build your-username@your-server-ip:/tmp/woyouwu-server
scp -r ./deploy-build your-username@your-server-ip:/tmp/woyouwu-deploy
```

#### 2.3 在服务器上组织文件
```bash
# SSH 登录到服务器
ssh your-username@your-server-ip

# 创建部署目录
sudo mkdir -p /var/www/woyouwu
sudo mkdir -p /var/log/woyouwu

# 移动文件
sudo mv /tmp/woyouwu-client/* /var/www/woyouwu/client/
sudo mv /tmp/woyouwu-server/* /var/www/woyouwu/server/
sudo mv /tmp/woyouwu-deploy/* /var/www/woyouwu/

# 设置权限
sudo chown -R www-data:www-data /var/www/woyouwu/client
sudo chown -R www-data:www-data /var/www/woyouwu/server/uploads
```

### 第三步：配置后端

#### 3.1 安装后端依赖
```bash
cd /var/www/woyouwu/server
npm install --production
```

#### 3.2 配置环境变量
```bash
# 复制示例配置
cp .env.production .env

# 编辑配置
nano .env
```

修改以下内容：
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/woyouwu  # 或使用你的 MongoDB 连接字符串
JWT_SECRET=your-super-secret-jwt-key-change-this  # 修改为强密码
FRONTEND_URL=https://your-domain.com  # 替换为你的域名
```

### 第四步：配置 Nginx

#### 4.1 创建 Nginx 配置
```bash
sudo nano /etc/nginx/sites-available/woyouwu
```

粘贴 `/workspace/deploy/nginx.conf` 的内容，修改：
- `server_name your-domain.com;` 改为你的域名或服务器 IP

#### 4.2 启用站点
```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/woyouwu /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 第五步：启动后端服务

#### 5.1 使用 PM2 启动
```bash
cd /var/www/woyouwu/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5.2 检查状态
```bash
pm2 status
pm2 logs woyouwu-server
```

### 第六步：配置防火墙

```bash
# 允许 SSH（重要！）
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable
```

### 第七步：配置 SSL（可选但强烈推荐）

#### 使用 Let's Encrypt 免费 SSL：
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（替换 your-domain.com）
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

## 🔧 常用运维命令

### 服务管理
```bash
# 查看后端状态
pm2 status

# 重启后端
pm2 restart woyouwu-server

# 查看日志
pm2 logs woyouwu-server --lines 100

# 重启 Nginx
sudo systemctl restart nginx

# 测试 Nginx 配置
sudo nginx -t
```

### 更新部署
```bash
# 1. 在本地重新构建前端
cd /workspace/client
npm run build

# 2. 上传新文件
scp -r ./dist/* your-username@your-server-ip:/tmp/woyouwu-client/
ssh your-username@your-server-ip "sudo mv /tmp/woyouwu-client/* /var/www/woyouwu/client/"

# 3. 重启后端（如果有更新）
cd /var/www/woyouwu/server
npm install --production
pm2 restart woyouwu-server
```

### 备份数据库
```bash
# 备份
mongodump --db woyouwu --out /var/backup/woyouwu-$(date +%Y%m%d)

# 恢复
mongorestore --db woyouwu /var/backup/woyouwu-20240101
```

---

## 🐛 故障排查

### 后端无法启动
```bash
# 检查端口占用
sudo lsof -i :5000

# 检查日志
pm2 logs woyouwu-server
```

### Nginx 502 错误
- 检查后端是否运行：`pm2 status`
- 检查后端端口：`curl http://localhost:5000`

### 数据库连接失败
- 检查 MongoDB 是否运行：`sudo systemctl status mongod`
- 检查连接字符串是否正确

### 前端无法加载
- 检查 Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`
- 检查静态文件路径：`ls -la /var/www/woyouwu/client`

---

## 📊 监控和维护

### 设置定时任务
```bash
# 编辑 crontab
crontab -e

# 添加自动备份（每天凌晨 3 点）
0 3 * * * mongodump --db woyouwu --out /var/backup/woyouwu-$(date +\%Y\%m\%d)

# 添加自动清理日志（每周）
0 0 * * 0 find /var/log/woyouwu -name "*.log" -mtime +7 -delete
```

### 设置日志轮转
```bash
sudo nano /etc/logrotate.d/woyouwu
```

添加：
```
/var/log/woyouwu/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

---

## 🎉 部署完成检查清单

- [ ] 服务器可以 ping 通
- [ ] SSH 可以连接
- [ ] MongoDB 已启动
- [ ] 后端服务运行中
- [ ] Nginx 配置正确
- [ ] 防火墙已配置
- [ ] 可以通过 HTTP 访问网站
- [ ] API 端点工作正常
- [ ] （可选）SSL 证书已配置

---

## 📞 获取帮助

如果遇到问题：
1. 查看日志文件
2. 检查服务状态
3. 确认配置文件正确
4. 查看本文档的故障排查部分

祝部署顺利！🎊
