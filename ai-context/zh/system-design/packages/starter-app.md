# LinchKit Starter 应用架构设计

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**最后更新**: 2025-06-24
**开发优先级**: P2 - 中优先级
**依赖关系**: 依赖所有 LinchKit 包
**维护状态**: 🔄 设计中

---

## 🎯 应用目标定位

### 功能目标
- **完整功能演示**: 展示 LinchKit 所有核心功能
- **最佳实践示例**: 提供标准的开发模式和代码结构
- **快速启动模板**: 开发者可以基于此快速创建新项目
- **集成测试平台**: 验证所有包的集成效果

### 技术目标
- **全栈 TypeScript**: 端到端类型安全
- **现代化技术栈**: Next.js 15 + React 19 + tRPC
- **生产就绪**: 包含完整的部署和监控配置
- **开发友好**: 完善的开发工具和调试支持

---

## 🏗️ 应用架构

### 目录结构
```
apps/starter/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # 认证相关页面
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # 仪表板页面
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── settings/
│   │   │   ├── workflow/             # 工作流管理
│   │   │   └── layout.tsx
│   │   ├── api/                      # API 路由
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                   # 应用特定组件
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   └── layout/
│   ├── lib/                          # 工具和配置
│   │   ├── auth.ts                   # NextAuth 配置
│   │   ├── db.ts                     # 数据库配置
│   │   ├── trpc.ts                   # tRPC 配置
│   │   ├── env.ts                    # 环境变量验证
│   │   └── utils.ts
│   ├── server/                       # 服务端逻辑
│   │   ├── api/                      # tRPC 路由
│   │   │   ├── routers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── posts.ts
│   │   │   │   └── workflow.ts
│   │   │   ├── root.ts
│   │   │   └── trpc.ts
│   │   └── db/                       # 数据库相关
│   │       ├── schema.ts             # Prisma schema
│   │       └── seed.ts               # 数据种子
│   ├── entities/                     # LinchKit 实体定义
│   │   ├── user.entity.ts
│   │   ├── post.entity.ts
│   │   ├── category.entity.ts
│   │   └── index.ts
│   └── types/                        # 应用特定类型
│       └── index.ts
├── public/                           # 静态资源
├── prisma/                           # Prisma 配置
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── README.md
└── DEPLOYMENT.md
```

---

## 📊 功能模块设计

### 1. 认证模块
**路径**: `src/app/(auth)/`  
**功能**: 完整的用户认证流程  

#### 核心功能
- **登录页面** (`/login`)
  - 邮箱/密码登录
  - OAuth 登录 (Google, GitHub)
  - 记住我功能
  - 忘记密码链接

- **注册页面** (`/register`)
  - 用户注册表单
  - 邮箱验证
  - 用户协议确认

- **密码重置** (`/reset-password`)
  - 邮箱验证
  - 密码重置表单

#### 技术实现
```typescript
// 使用 @linch-kit/auth 和 @linch-kit/ui
import { LoginForm, AuthGuard } from '@linch-kit/ui'
import { useAuth } from '@linch-kit/auth'

export default function LoginPage() {
  const { login } = useAuth()
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm 
        onSubmit={login}
        providers={['credentials', 'google', 'github']}
      />
    </div>
  )
}
```

### 2. 仪表板模块
**路径**: `src/app/(dashboard)/`  
**功能**: 主要业务功能展示  

#### 核心功能
- **仪表板首页** (`/dashboard`)
  - 数据统计卡片
  - 图表展示
  - 快速操作入口

- **用户管理** (`/users`)
  - 用户列表 (DataTable)
  - 用户详情
  - 用户编辑表单
  - 权限管理

- **内容管理** (`/posts`)
  - 文章列表
  - 文章编辑器
  - 分类管理
  - 标签系统

- **工作流管理** (`/workflow`)
  - 流程定义列表
  - 流程实例监控
  - 任务处理
  - 审批历史

#### 技术实现
```typescript
// 使用 @linch-kit/crud 和 @linch-kit/ui
import { DataTable, FormBuilder } from '@linch-kit/ui'
import { useCRUD } from '@linch-kit/crud'
import { UserEntity } from '../entities/user.entity'

export default function UsersPage() {
  const { data, create, update, delete: remove } = useCRUD(UserEntity)
  
  return (
    <div className="space-y-6">
      <DataTable
        data={data}
        entity={UserEntity}
        onEdit={update}
        onDelete={remove}
      />
      <FormBuilder
        entity={UserEntity}
        onSubmit={create}
      />
    </div>
  )
}
```

### 3. API 模块
**路径**: `src/server/api/`  
**功能**: tRPC API 路由定义  

#### 路由结构
```typescript
// src/server/api/root.ts
import { createTRPCRouter } from '@linch-kit/trpc'
import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users'
import { postsRouter } from './routers/posts'
import { workflowRouter } from './routers/workflow'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  users: usersRouter,
  posts: postsRouter,
  workflow: workflowRouter,
})

export type AppRouter = typeof appRouter
```

---

## 🗄️ 数据模型设计

### 实体定义
使用 @linch-kit/schema 定义实体：

```typescript
// src/entities/user.entity.ts
import { defineEntity, defineField } from '@linch-kit/schema'

export const UserEntity = defineEntity('User', {
  id: defineField.primary(),
  email: defineField.string().unique().email(),
  name: defineField.string().min(2).max(50),
  avatar: defineField.string().url().optional(),
  role: defineField.enum(['admin', 'user', 'moderator']).default('user'),
  isActive: defineField.boolean().default(true),
  profile: defineField.json().optional(),
  ...defineField.timestamps(),
  ...defineField.softDelete(),
})

// src/entities/post.entity.ts
export const PostEntity = defineEntity('Post', {
  id: defineField.primary(),
  title: defineField.string().min(1).max(200),
  content: defineField.text(),
  excerpt: defineField.string().max(500).optional(),
  status: defineField.enum(['draft', 'published', 'archived']).default('draft'),
  authorId: defineField.string().relation('User'),
  categoryId: defineField.string().relation('Category').optional(),
  tags: defineField.array(defineField.string()).optional(),
  metadata: defineField.json().optional(),
  ...defineField.timestamps(),
  ...defineField.softDelete(),
})
```

### 数据库 Schema
自动生成的 Prisma Schema：

```prisma
// prisma/schema.prisma (自动生成)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  avatar    String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  profile   Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  posts     Post[]
  
  @@map("users")
}

model Post {
  id         String      @id @default(cuid())
  title      String
  content    String
  excerpt    String?
  status     PostStatus  @default(DRAFT)
  authorId   String
  categoryId String?
  tags       String[]
  metadata   Json?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  deletedAt  DateTime?
  
  author     User        @relation(fields: [authorId], references: [id])
  category   Category?   @relation(fields: [categoryId], references: [id])
  
  @@map("posts")
}

enum Role {
  ADMIN
  USER
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## 🔧 配置和部署

### 环境配置
```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

### Docker 配置
```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🚀 开发优先级

### 第一阶段 (P0 - 最高优先级)
**时间**: 3-4天  
**目标**: 基础应用框架  

- ✅ 项目初始化和配置
- ✅ 基础页面结构 (layout, 路由)
- ✅ 认证系统集成
- ✅ 数据库配置和实体定义

### 第二阶段 (P1 - 高优先级)
**时间**: 4-5天  
**目标**: 核心功能实现  

- ✅ 用户管理功能
- ✅ 内容管理功能
- ✅ CRUD 操作演示
- ✅ 权限控制演示

### 第三阶段 (P2 - 中优先级)
**时间**: 3-4天  
**目标**: 高级功能和优化  

- ✅ 工作流集成
- ✅ AI 功能演示
- ✅ 性能优化
- ✅ 测试覆盖

### 第四阶段 (P3 - 低优先级)
**时间**: 2-3天  
**目标**: 部署和文档  

- ✅ 部署配置
- ✅ 监控集成
- ✅ 文档完善
- ✅ 示例数据

---

## 📋 成功标准

### 功能完整性
- [ ] 所有 LinchKit 包功能都有演示
- [ ] 认证流程完整可用
- [ ] CRUD 操作类型安全
- [ ] 权限控制正常工作
- [ ] 工作流功能可用

### 技术质量
- [ ] 端到端类型安全
- [ ] 测试覆盖率 > 80%
- [ ] 性能指标达标
- [ ] 无安全漏洞

### 开发体验
- [ ] 开发环境一键启动
- [ ] 热重载正常工作
- [ ] 错误提示清晰
- [ ] 调试工具完善

### 部署就绪
- [ ] Docker 容器化
- [ ] 环境变量配置
- [ ] 数据库迁移
- [ ] 监控和日志

---

**重要提醒**: Starter 应用是 LinchKit 的门面，必须展示所有核心功能并提供最佳实践示例。代码质量和文档质量都必须达到生产级别标准。
