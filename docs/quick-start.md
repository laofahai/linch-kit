# 快速开始

## 🚀 环境要求

- Node.js 18+
- pnpm 8+
- Git

## 📦 安装

### 1. 克隆项目

```bash
git clone https://github.com/your-org/linch-kit.git
cd linch-kit
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 构建所有包

```bash
pnpm build:packages
```

### 4. 启动开发模式

```bash
pnpm dev
```

## 🎯 创建第一个应用

### 1. 使用 Starter 模板

```bash
# 复制 starter 应用
cp -r apps/starter apps/my-app
cd apps/my-app

# 更新 package.json
vim package.json  # 修改 name 字段

# 安装依赖
pnpm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

### 3. 启动应用

```bash
pnpm dev
```

## 📚 核心概念

### Schema 定义

```typescript
import { defineField, createSchema } from '@linch-kit/schema'

const UserSchema = createSchema('User', {
  id: defineField.string().primary(),
  name: defineField.string().required(),
  email: defineField.string().email().unique(),
  role: defineField.enum(['admin', 'user']).default('user')
})
```

### tRPC 路由

```typescript
import { router, publicProcedure } from '@linch-kit/trpc'
import { UserSchema } from './schemas'

export const userRouter = router({
  list: publicProcedure
    .input(UserSchema.pick({ role: true }).partial())
    .query(async ({ input }) => {
      // 查询逻辑
    }),
    
  create: publicProcedure
    .input(UserSchema.omit({ id: true }))
    .mutation(async ({ input }) => {
      // 创建逻辑
    })
})
```

### 认证配置

```typescript
import { createAuthConfig } from '@linch-kit/auth-core'

export const authConfig = createAuthConfig({
  providers: [
    // OAuth 提供商
    {
      id: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
})
```

## 🛠️ 开发工作流

### 1. 创建新功能

```bash
# 创建功能分支
git checkout -b feature/user-management

# 开发和测试
pnpm dev
pnpm test
pnpm lint
```

### 2. 添加变更集

```bash
# 添加变更描述
pnpm changeset

# 选择变更类型
# - patch: 修复 bug
# - minor: 新功能
# - major: 破坏性变更
```

### 3. 提交代码

```bash
git add .
git commit -m "feat: add user management"
git push origin feature/user-management
```

## 📖 下一步

- 阅读 [Monorepo 架构](./monorepo-architecture.md) 了解项目结构
- 查看 [包文档](./packages/) 了解各个包的用法
- 学习 [开发原则](./development/principles.md) 和最佳实践

## 🆘 获取帮助

- [GitHub Issues](https://github.com/your-org/linch-kit/issues)
- [讨论区](https://github.com/your-org/linch-kit/discussions)
- [文档](https://linch-kit.dev)

## 🎉 示例项目

查看 [示例仓库](https://github.com/your-org/linch-kit-examples) 获取更多实际应用案例。
