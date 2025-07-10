# @linch-kit/platform

**版本**: v2.0.2  
**更新**: 2025-07-09  
**状态**: 业务开发平台包 - Schema+CRUD+tRPC+验证一体化

## 📋 概述

`@linch-kit/platform` 是 LinchKit 的业务开发平台包，整合了 Schema 定义、CRUD 操作、tRPC API 路由和数据验证等功能，提供一体化的业务开发体验。

### 核心价值

- **一体化开发**: Schema+CRUD+tRPC+验证统一体验
- **类型安全**: 端到端 TypeScript 类型安全
- **高性能**: 优化的查询构建器和事务管理
- **灵活扩展**: 支持复杂业务逻辑和自定义操作
- **开发效率**: 减少样板代码，提升开发体验

## 🚀 安装和配置

### 安装

```bash
bun add @linch-kit/platform
```

### 基础配置

```typescript
// platform.config.ts
import { definePlatformConfig } from '@linch-kit/platform'

export const platformConfig = definePlatformConfig({
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  },
  validation: {
    strict: true,
    throwOnError: true
  },
  cache: {
    enabled: true,
    ttl: 60 * 5 // 5 minutes
  }
})
```

## 🔧 核心 API

### 实体定义

```typescript
import { defineEntity, z } from '@linch-kit/platform'

// 定义用户实体
const UserEntity = defineEntity('User', {
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional()
})

// 定义关系
const PostEntity = defineEntity('Post', {
  id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string(),
  authorId: z.string().uuid(),
  publishedAt: z.date().optional()
}).relations({
  author: UserEntity
})
```

### CRUD 操作

```typescript
import { createPlatformCRUD } from '@linch-kit/platform'

// 创建 CRUD 管理器
const userCRUD = createPlatformCRUD(UserEntity)

// 基础操作
const user = await userCRUD.create({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'USER'
})

const foundUser = await userCRUD.findById(user.id)
const users = await userCRUD.findMany({
  where: { role: 'USER' },
  orderBy: { createdAt: 'desc' },
  take: 10
})

await userCRUD.update(user.id, { name: 'Jane Doe' })
await userCRUD.delete(user.id)
```

### 查询构建器

```typescript
import { QueryBuilder } from '@linch-kit/platform'

// 复杂查询
const queryBuilder = new QueryBuilder(UserEntity)
const results = await queryBuilder
  .where('role', 'USER')
  .where('createdAt', '>', new Date('2024-01-01'))
  .include('posts')
  .orderBy('createdAt', 'desc')
  .take(20)
  .execute()

// 聚合查询
const stats = await queryBuilder
  .groupBy('role')
  .count()
  .execute()
```

### tRPC 路由

```typescript
import { createPlatformRouter } from '@linch-kit/platform'
import { requireAuth } from '@linch-kit/auth'

// 创建平台路由
const userRouter = createPlatformRouter()
  .middleware(requireAuth)
  .query('getUser', {
    input: z.string().uuid(),
    resolve: async ({ input, ctx }) => {
      return await userCRUD.findById(input)
    }
  })
  .mutation('createUser', {
    input: UserEntity.createSchema,
    resolve: async ({ input, ctx }) => {
      return await userCRUD.create(input)
    }
  })
  .mutation('updateUser', {
    input: z.object({
      id: z.string().uuid(),
      data: UserEntity.updateSchema
    }),
    resolve: async ({ input, ctx }) => {
      return await userCRUD.update(input.id, input.data)
    }
  })
```

### 数据验证

```typescript
import { createValidator } from '@linch-kit/platform'

// 创建验证器
const userValidator = createValidator(UserEntity)

// 验证数据
const validationResult = userValidator.validate({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'USER'
})

if (validationResult.success) {
  // 数据有效
  console.log(validationResult.data)
} else {
  // 处理验证错误
  console.error(validationResult.error)
}
```

### 事务管理

```typescript
import { TransactionManager } from '@linch-kit/platform'

// 事务操作
const result = await TransactionManager.execute(async (tx) => {
  const user = await userCRUD.create({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER'
  }, { tx })
  
  const post = await postCRUD.create({
    title: 'First Post',
    content: 'Hello World',
    authorId: user.id
  }, { tx })
  
  return { user, post }
})
```

## 🎯 使用场景

### 1. 快速 CRUD 开发

```typescript
// 一行代码创建完整的 CRUD API
const userCRUD = createPlatformCRUD(UserEntity)
const userRouter = createPlatformRouter().crud(userCRUD)
```

### 2. 复杂业务逻辑

```typescript
// 扩展 CRUD 操作
const userCRUD = createPlatformCRUD(UserEntity, {
  beforeCreate: async (data, ctx) => {
    // 创建前的业务逻辑
    data.slug = slugify(data.name)
    return data
  },
  afterCreate: async (user, ctx) => {
    // 创建后的业务逻辑
    await emailService.sendWelcomeEmail(user.email)
  }
})
```

### 3. 权限集成

```typescript
// 集成权限控制
const userCRUD = createPlatformCRUD(UserEntity, {
  permissions: {
    read: 'user:read',
    create: 'user:create',
    update: 'user:update',
    delete: 'user:delete'
  }
})
```

### 4. 数据缓存

```typescript
// 启用缓存
const userCRUD = createPlatformCRUD(UserEntity, {
  cache: {
    enabled: true,
    ttl: 60 * 10, // 10 minutes
    tags: ['user']
  }
})
```

## 🔍 高级特性

### 软删除

```typescript
const userCRUD = createPlatformCRUD(UserEntity, {
  softDelete: true,
  deletedAtField: 'deletedAt'
})

// 软删除
await userCRUD.softDelete(userId)

// 恢复
await userCRUD.restore(userId)

// 永久删除
await userCRUD.forceDelete(userId)
```

### 审计日志

```typescript
const userCRUD = createPlatformCRUD(UserEntity, {
  audit: {
    enabled: true,
    fields: ['name', 'email', 'role'],
    userIdField: 'userId'
  }
})
```

### 版本控制

```typescript
const userCRUD = createPlatformCRUD(UserEntity, {
  versioning: {
    enabled: true,
    versionField: 'version'
  }
})
```

## 📝 最佳实践

### 1. 实体设计

```typescript
// 使用描述性字段名和适当的验证
const UserEntity = defineEntity('User', {
  id: z.string().uuid(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  dateOfBirth: z.date().max(new Date()),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional()
})
```

### 2. 错误处理

```typescript
// 统一错误处理
const userCRUD = createPlatformCRUD(UserEntity, {
  errorHandler: (error, operation, data) => {
    logger.error(`CRUD operation failed: ${operation}`, {
      error: error.message,
      data
    })
    throw new PlatformError(error.message, error.code)
  }
})
```

### 3. 性能优化

```typescript
// 使用查询优化
const users = await userCRUD.findMany({
  where: { isActive: true },
  select: { id: true, name: true, email: true }, // 只选择需要的字段
  take: 100,
  skip: 0
})
```

## 🚨 故障排除

### 常见问题

1. **类型错误**: 确保 Schema 定义正确
2. **验证失败**: 检查输入数据格式
3. **权限错误**: 确认用户有相应权限
4. **事务失败**: 检查事务逻辑和数据一致性

### 调试技巧

```typescript
// 启用调试模式
const userCRUD = createPlatformCRUD(UserEntity, {
  debug: true,
  logger: console
})
```

## 🔗 相关文档

- **[@linch-kit/auth](./auth.md)** - 认证和权限管理
- **[@linch-kit/core](./core.md)** - 基础设施服务
- **[@linch-kit/ui](./ui.md)** - UI 组件库
- **[tools/schema](../../04_Project_Management/01_Roadmap.md#tools-schema)** - Schema 工具

---

**注意**: 这是一个整合包，包含了原来的 schema, crud, trpc 包的所有功能。