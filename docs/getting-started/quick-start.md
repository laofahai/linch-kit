# 快速开始

在 5 分钟内开始使用 Linch Kit 构建你的第一个应用。

## 📋 前置要求

- Node.js 18+ 
- pnpm 8+
- Git

## 🚀 安装

### 1. 创建新项目

```bash
# 使用模板创建项目
npx create-linch-kit@latest my-app
cd my-app

# 或者克隆 starter 模板
git clone https://github.com/your-org/linch-kit-starter.git my-app
cd my-app
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看你的应用。

## 🎯 核心概念

### Schema 定义

Linch Kit 使用 Schema 来定义数据结构和验证规则：

```typescript
import { defineField, createSchema } from '@linch-kit/schema'

const UserSchema = createSchema('User', {
  id: defineField.string().primary(),
  name: defineField.string().required(),
  email: defineField.string().email().unique(),
  role: defineField.enum(['admin', 'user']).default('user'),
  createdAt: defineField.date().default(() => new Date())
})
```

### tRPC 路由

创建类型安全的 API 路由：

```typescript
import { router, publicProcedure } from '@linch-kit/trpc'
import { UserSchema } from './schemas'

export const userRouter = router({
  list: publicProcedure
    .input(UserSchema.pick({ role: true }).partial())
    .query(async ({ input }) => {
      // 查询用户列表
      return await db.user.findMany({
        where: input
      })
    }),
    
  create: publicProcedure
    .input(UserSchema.omit({ id: true, createdAt: true }))
    .mutation(async ({ input }) => {
      // 创建新用户
      return await db.user.create({
        data: input
      })
    })
})
```

### 认证配置

设置用户认证：

```typescript
import { createAuthConfig } from '@linch-kit/auth-core'

export const authConfig = createAuthConfig({
  providers: [
    {
      id: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    jwt: async (token, user) => {
      if (user) {
        token.role = user.role
      }
      return token
    }
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

### 2. 构建和部署

```bash
# 构建应用
pnpm build

# 运行生产版本
pnpm start
```

### 3. 添加新包

如果你在 monorepo 环境中工作：

```bash
# 创建新包
mkdir packages/my-package
cd packages/my-package

# 初始化包
pnpm init
```

## 📚 下一步

- 阅读 [架构概览](../architecture/overview.md) 了解系统设计
- 查看 [API 文档](../api/) 了解各包的详细用法
- 浏览 [示例代码](../examples/) 学习最佳实践
- 参考 [故障排除](../guides/troubleshooting.md) 解决常见问题

## 💡 示例项目

查看完整的示例项目：

- [博客系统](https://github.com/your-org/linch-kit-blog-example)
- [电商应用](https://github.com/your-org/linch-kit-ecommerce-example)
- [管理后台](https://github.com/your-org/linch-kit-admin-example)

## 🆘 获取帮助

遇到问题？

- 查看 [故障排除指南](../guides/troubleshooting.md)
- 搜索 [GitHub Issues](https://github.com/your-org/linch-kit/issues)
- 在 [讨论区](https://github.com/your-org/linch-kit/discussions) 提问
- 加入 [Discord 社区](https://discord.gg/linch-kit)
