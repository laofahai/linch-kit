# LinchKit Starter - AI-First 企业级应用

> 基于 LinchKit 框架构建的生产级 AI-First 全栈应用

## 🚀 项目概述

LinchKit Starter 是一个完整的企业级应用实现，展示了 LinchKit 框架的全部能力。它集成了现代化的 AI Dashboard、管理控制台、认证系统和国际化支持。

### ✅ 核心特性

- **🧠 AI-First 架构** - 原生 AI 集成和智能数据分析
- **🔐 完整认证系统** - NextAuth.js + 多种登录方式
- **🌍 国际化支持** - 中英文无缝切换
- **📊 实时 Dashboard** - AI 洞察和性能监控
- **👥 用户管理** - 完整的 CRUD 和权限控制
- **🎨 现代化 UI** - shadcn/ui + Tailwind CSS
- **📱 响应式设计** - 移动端友好

## 🏗️ 技术架构

### 应用层级
```
apps/starter (应用层)    - 布局、环境配置、页面路由
modules/console (模块层) - 企业管理功能、UI组件
packages/* (包层)       - 基础功能库、API、认证
```

### 核心依赖
- **框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: TanStack Query + tRPC
- **认证**: NextAuth.js v5 + Prisma
- **国际化**: next-intl
- **类型安全**: TypeScript + Zod

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env.local

# 数据库初始化
pnpm db:generate
pnpm db:push
pnpm db:seed

# Schema 生成
pnpm schema:generate

# 开发服务器
pnpm dev
```

## 📁 项目结构

```
starter/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # 应用组件
│   ├── lib/             # 工具函数
│   ├── schemas/         # Schema 定义
│   └── server/          # 服务端逻辑
├── prisma/              # 数据库 Schema
├── public/              # 静态资源
└── docs/                # 文档
```

## 🔧 配置

### 环境变量

```bash
# 数据库
DATABASE_URL="postgresql://..."

# 认证
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Console 配置
CONSOLE_BASE_PATH="/admin"
CONSOLE_FEATURES="dashboard,tenants,users,permissions,plugins"
```

### Console 集成

```typescript
// app/admin/layout.tsx
import { ConsoleProvider, createConsoleRoutes } from '@linch-kit/console'

export default function AdminLayout({ children }) {
  return (
    <ConsoleProvider
      config={{
        basePath: '/admin',
        features: ['dashboard', 'tenants', 'users'],
      }}
    >
      {children}
    </ConsoleProvider>
  )
}
```

## 📖 文档

- [开发指南](./docs/development.md)
- [部署指南](./docs/deployment.md)
- [API 参考](./docs/api.md)
- [Console 使用](./docs/console.md)

## 🚀 部署

### Vercel

```bash
# 一键部署
vercel --prod
```

### Docker

```bash
# 构建镜像
docker build -t linchkit-starter .

# 运行容器
docker run -p 3000:3000 linchkit-starter
```

## 📊 性能

- ⚡ **首次加载** < 2s
- 🔄 **热重载** < 100ms
- 📦 **包大小** < 500kb (gzipped)
- 🎯 **Lighthouse** 95+ 分

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License