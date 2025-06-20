# Schema 包文档

## 📦 包概述

`@linch-kit/schema` 是 Linch Kit 的数据模式系统，基于 Zod 提供类型安全的数据定义、验证和代码生成功能。

**包状态**: ✅ 已发布到 npm  
**版本**: 0.1.0  
**npm**: [@linch-kit/schema](https://www.npmjs.com/package/@linch-kit/schema)

## 🎯 主要功能

### 1. 实体定义系统
- 基于 Zod 的类型安全实体定义
- 装饰器支持 (primary, unique, createdAt, updatedAt, softDelete)
- 关联关系定义
- 自动类型推导

### 2. 代码生成器
- Prisma Schema 生成
- TypeScript 类型生成
- 验证器生成 (create/update/response/query)
- Mock 数据生成
- OpenAPI 文档生成

### 3. CLI 集成
- `linch schema-list` - 列出所有实体
- `linch schema-generate-prisma` - 生成 Prisma Schema
- `linch schema-generate-types` - 生成 TypeScript 类型
- `linch schema-generate-all` - 生成所有代码

### 4. 配置系统
- 灵活的配置选项
- 自动发现实体文件
- 自定义输出目录

## 🏗️ 核心概念

### 实体定义
```typescript
import { defineEntity, primary, unique, createdAt, updatedAt } from '@linch-kit/schema'
import { z } from 'zod'

export const User = defineEntity('User', {
  // 主键
  id: primary(z.string().uuid()),
  
  // 唯一字段
  email: unique(z.string().email()),
  
  // 普通字段
  name: z.string().min(2).max(50),
  age: z.number().int().min(0).max(150).optional(),
  
  // 枚举字段
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  
  // 时间戳
  createdAt: createdAt(),
  updatedAt: updatedAt()
})
```

### 关联关系
```typescript
import { relation, hasMany, belongsTo } from '@linch-kit/schema'

export const Post = defineEntity('Post', {
  id: primary(z.string().uuid()),
  title: z.string(),
  content: z.string(),
  authorId: z.string().uuid(),
  
  // 多对一关系
  author: belongsTo('User', 'authorId'),
  
  // 一对多关系
  comments: hasMany('Comment', 'postId')
})

export const Comment = defineEntity('Comment', {
  id: primary(z.string().uuid()),
  content: z.string(),
  postId: z.string().uuid(),
  
  // 关联关系
  post: belongsTo('Post', 'postId')
})
```

### 软删除支持
```typescript
export const Product = defineEntity('Product', {
  id: primary(z.string().uuid()),
  name: z.string(),
  price: z.number(),
  
  // 软删除字段
  deletedAt: softDelete(),
  
  createdAt: createdAt(),
  updatedAt: updatedAt()
})
```

## 📋 API 参考

### 核心函数

#### defineEntity
```typescript
function defineEntity<T extends ZodRawShape>(
  name: string,
  shape: T,
  options?: EntityOptions
): EntityDefinition<T>
```

#### 装饰器函数
```typescript
// 主键装饰器
function primary<T extends ZodType>(schema: T): T & { _primary: true }

// 唯一约束装饰器
function unique<T extends ZodType>(schema: T): T & { _unique: true }

// 创建时间装饰器
function createdAt(): ZodDate & { _createdAt: true }

// 更新时间装饰器
function updatedAt(): ZodDate & { _updatedAt: true }

// 软删除装饰器
function softDelete(): ZodOptional<ZodDate> & { _softDelete: true }
```

#### 关系装饰器
```typescript
// 一对多关系
function hasMany<T extends string>(
  target: T,
  foreignKey: string
): RelationDefinition

// 多对一关系
function belongsTo<T extends string>(
  target: T,
  foreignKey: string
): RelationDefinition

// 多对多关系
function manyToMany<T extends string>(
  target: T,
  through: string
): RelationDefinition
```

### 代码生成

#### 生成 Prisma Schema
```typescript
import { generatePrismaSchema } from '@linch-kit/schema'

const entities = [User, Post, Comment]
const prismaSchema = generatePrismaSchema(entities)

// 输出到文件
await fs.writeFile('prisma/schema.prisma', prismaSchema)
```

#### 生成验证器
```typescript
import { generateValidators } from '@linch-kit/schema'

const validators = generateValidators(User)

// 使用生成的验证器
const createUserData = validators.create.parse({
  name: 'John Doe',
  email: 'john@example.com'
})
```

#### 生成 Mock 数据
```typescript
import { generateMockData } from '@linch-kit/schema'

const mockUser = generateMockData(User)
console.log(mockUser)
// { id: 'uuid', name: 'Mock Name', email: 'mock@example.com', ... }
```

## 🔧 配置

### linch-kit.config.ts
```typescript
import { defineConfig } from '@linch-kit/core'

export default defineConfig({
  schema: {
    // 实体文件目录
    schemaDir: './app/_lib/schemas',
    
    // 输出目录
    outputDir: './generated',
    
    // 生成选项
    generate: {
      prisma: true,
      validators: true,
      mocks: true,
      openapi: true
    },
    
    // Prisma 配置
    prisma: {
      provider: 'postgresql',
      output: './prisma/schema.prisma'
    },
    
    // 类型生成配置
    types: {
      output: './generated/types.ts'
    }
  }
})
```

## 🧪 使用示例

### 完整的用户管理示例

```typescript
// schemas/user.ts
import { defineEntity, primary, unique, createdAt, updatedAt } from '@linch-kit/schema'
import { z } from 'zod'

export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string().min(2).max(50),
  avatar: z.string().url().optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  createdAt: createdAt(),
  updatedAt: updatedAt()
})

// 自动生成的类型
export type User = z.infer<typeof User.schema>
export type UserCreateInput = z.infer<typeof User.createSchema>
export type UserUpdateInput = z.infer<typeof User.updateSchema>
export type UserResponse = z.infer<typeof User.responseSchema>
```

### 生成和使用代码

```bash
# 生成 Prisma Schema
pnpm linch schema-generate-prisma

# 生成所有代码
pnpm linch schema-generate-all
```

```typescript
// 使用生成的验证器
import { UserValidators } from '../generated/validators'

// 验证创建数据
const createData = UserValidators.create.parse({
  name: 'John Doe',
  email: 'john@example.com'
})

// 验证更新数据
const updateData = UserValidators.update.parse({
  name: 'Jane Doe'
})
```

## 🧪 测试

### 运行测试
```bash
cd packages/schema
pnpm test
```

### 测试覆盖率
```bash
pnpm test:coverage
```

## 📝 开发指南

### 添加新装饰器

1. 在 `src/decorators/` 下创建装饰器文件
2. 实现装饰器逻辑
3. 在代码生成器中添加支持
4. 添加测试用例

### 扩展代码生成器

1. 在 `src/generators/` 下创建生成器
2. 实现生成逻辑
3. 在 CLI 中添加命令
4. 添加配置选项

## 🔗 相关包

- `@linch-kit/core` - 核心基础设施
- `@linch-kit/auth-core` - 认证系统
- `@linch-kit/crud` - CRUD 操作

## 📚 更多资源

- [Schema 系统设计](../architecture/system-architecture.md#schema-系统)
- [代码生成指南](../templates/code-generation.md)
- [最佳实践](../templates/ai-first-practices.md#schema-驱动的开发)

---

**包状态**: ✅ 已发布  
**最后更新**: 2025-06-20  
**维护者**: Linch Kit 团队
