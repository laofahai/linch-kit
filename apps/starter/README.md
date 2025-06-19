# Linch Kit Starter

AI-First 企业级开发框架的起始模板，集成了完整的认证、权限、CRUD 和 Schema 管理系统。

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

配置必要的环境变量：

```env
# 数据库
DATABASE_URL="postgresql://localhost:5432/linch_kit_dev"

# 认证
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth 提供商 (可选)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

### 3. 初始化项目

```bash
# 初始化认证配置
pnpm auth:init

# 初始化 Schema 配置
pnpm schema:init

# 生成数据库 Schema
pnpm schema:prisma
```

### 4. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📦 包含的功能

### 🔐 认证系统 (@linch-kit/auth-core)
- 多种认证提供商支持 (OAuth, 邮箱密码)
- JWT 会话管理
- 权限和角色系统
- 多租户支持

### 📊 Schema 管理 (@linch-kit/schema)
- 类型安全的实体定义
- 自动生成 Prisma Schema
- Zod 验证器生成
- Mock 数据工厂
- OpenAPI 文档生成

### 🎨 UI 组件 (@linch-kit/ui)
- 基于 shadcn/ui 的组件库
- 深色/浅色主题支持
- 响应式设计
- 可访问性支持

### 🌐 国际化 (i18n)
- 多语言支持 (中文/英文)
- 动态语言切换
- 组件级翻译

## 🛠️ CLI 命令

### 认证相关

```bash
# 初始化认证配置
pnpm auth:init

# 生成认证实体
pnpm auth:generate --kit enterprise --roles --departments

# 生成权限系统
pnpm auth:permissions --strategy rbac --hierarchical

# 验证认证配置
pnpm auth:validate

# 显示认证信息
pnpm auth:info
```

### Schema 相关

```bash
# 初始化 Schema 配置
pnpm schema:init

# 生成所有文件
pnpm schema:generate

# 只生成 Prisma Schema
pnpm schema:prisma

# 列出所有实体
pnpm schema:list
```
