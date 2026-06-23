# 项目规则

## 项目路径
- 项目根目录：`/www/wwwroot/woyouwu/`
- 前端：`/www/wwwroot/woyouwu/client/`
- 后端：`/www/wwwroot/woyouwu/server/`
- 所有文件操作（读、写、搜索）必须基于此路径，不要使用 `/root/Documents/trae_projects/`（该路径为空目录，由 IDE 默认生成，不是真实项目路径）

## 实现原则
- 不允许提出折中方案或妥协方案。用户要的是完整达成目标，不是"勉强能用"的简化版。
- 遇到技术障碍（如下载慢、API 不可用等），应想办法解决障碍本身，而不是换个弱化方案绕过去。
- 所有功能必须完整实现，不能因为某个依赖安装耗时较长就提议跳过。

## 技术栈
- 前端：React 18 + React Router v6 + Vite 5 + TailwindCSS
- 后端：Express.js + MongoDB (Mongoose)
- 进程管理：PM2
- 爬虫：Scrapling (Python CLI)
- AI：DeepSeek API

## 命名规范
- 代码命名：驼峰命名法（camelCase）
- 文件名：连字符（kebab-case）
- 缩进：2 个空格

## 安全红线
- 禁止硬编码密钥、密码，使用环境变量
- 用户输入必须在服务端校验和过滤
- 敏感信息（手机号、邮箱等）日志中脱敏
