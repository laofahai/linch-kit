# @linch-kit/schema

一个强大的 Schema 优先开发包，使用 Zod 作为数据结构的单一数据源，自动生成 Prisma schema、验证器、Mock 数据和 API 文档。

[English](./README.md) | 简体中文

## 特性

- 🎯 **Zod 优先**: 使用 Zod 定义一次数据结构
- 🗄️ **Prisma 生成**: 从 Zod 定义自动生成 Prisma schema
- ✅ **验证器**: 自动生成创建、更新和查询验证器
- 🎭 **Mock 数据**: 为开发和测试生成真实的测试数据
- 📚 **OpenAPI 文档**: 自动生成 API 文档
- 🔗 **关系支持**: 支持数据库关系
- 🗑️ **软删除**: 内置软删除支持
- 🏗️ **类型安全**: 端到端 TypeScript 类型安全
- 🛠️ **CLI 工具**: 用于代码生成的命令行工具

## 安装

```bash
npm install @linch-kit/schema
# 或
pnpm add @linch-kit/schema
# 或
yarn add @linch-kit/schema
```

## 快速开始

### 1. 安装和初始化

```bash
npm install @linch-kit/schema

# 初始化配置
npx linch-schema init
```

### 2. 定义实体

```typescript
// src/entities/user.ts
import { z } from 'zod'
import { defineEntity, primary, unique, createdAt, updatedAt, defaultValue, softDelete } from '@linch-kit/schema'

export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  username: unique(z.string().min(3).max(20)),
  password: z.string().min(8),
  role: defaultValue(z.enum(['USER', 'ADMIN']), 'USER'),
  isActive: defaultValue(z.boolean(), true),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
  deletedAt: softDelete(z.date().optional()),
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['deletedAt'] },
  ]
})

// 导出类型和验证器
export const CreateUserSchema = User.createSchema
export const UpdateUserSchema = User.updateSchema
export const UserResponseSchema = User.responseSchema.omit({ password: true, deletedAt: true })

export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
```

### 3. 生成代码

```bash
# 生成所有文件
npx linch-schema generate:all

# 或单独生成
npx linch-schema generate:prisma
npx linch-schema generate:validators
npx linch-schema generate:mocks
npx linch-schema generate:openapi
```

### 4. 在应用中使用

```typescript
// 在 tRPC 路由中使用
import { CreateUserSchema, UpdateUserSchema, UserResponseSchema } from '../entities/user'

export const userRouter = router({
  create: publicProcedure
    .input(CreateUserSchema)
    .output(UserResponseSchema)
    .mutation(async ({ input }) => {
      // input 已完全验证和类型化
      return await createUser(input)
    }),
    
  update: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).merge(UpdateUserSchema))
    .output(UserResponseSchema)
    .mutation(async ({ input }) => {
      return await updateUser(input.id, input)
    })
})
```

### 5. 数据库迁移

```bash
# 开发环境
npx prisma db push

# 生产环境
npx prisma migrate dev --name init
npx prisma migrate deploy
```

## API 参考

### 装饰器

#### 字段装饰器

- `primary(schema)` - 标记字段为主键
- `unique(schema)` - 添加唯一约束
- `defaultValue(schema, value)` - 设置默认值
- `createdAt(schema)` - 自动管理的创建时间戳
- `updatedAt(schema)` - 自动管理的更新时间戳
- `softDelete(schema)` - 软删除字段
- `dbField(schema, name)` - 映射到不同的数据库列名
- `dbType(schema, type, options)` - 指定数据库特定类型

#### 关系装饰器

- `relation(schema, targetEntity, type, options)` - 定义关系

```typescript
// 一对多关系
author: relation(z.any(), 'User', 'many-to-one', {
  foreignKey: 'authorId',
  references: 'id',
  onDelete: 'CASCADE'
})

// 多对多关系
tags: relation(z.array(z.any()), 'Tag', 'many-to-many')
```

### 实体定义

```typescript
defineEntity(name, fields, config?)
```

- `name`: 实体名称（用于表名和类型生成）
- `fields`: 使用 Zod schema 和装饰器的字段定义对象
- `config`: 可选配置
  - `tableName`: 自定义表名
  - `indexes`: 索引定义
  - `compositePrimaryKey`: 复合主键字段

### 生成的 Schema

每个实体自动提供：

- `entity.createSchema` - 用于创建操作（排除自动生成字段）
- `entity.updateSchema` - 用于更新操作（所有字段可选，排除自动生成字段）
- `entity.responseSchema` - 用于 API 响应（可使用 `.omit()` 自定义）
- `entity.querySchema` - 用于查询参数，包含过滤和分页

## CLI 命令

```bash
# 列出所有已注册的实体
linch-schema list

# 显示实体详情
linch-schema show User

# 生成 Prisma schema
linch-schema generate:prisma [选项]

# 生成 Zod 验证器
linch-schema generate:validators [选项]

# 生成 mock 数据工厂
linch-schema generate:mocks [选项]

# 生成 OpenAPI 规范
linch-schema generate:openapi [选项]

# 生成测试数据 JSON 文件
linch-schema generate:test-data [选项]

# 生成所有文件
linch-schema generate:all [选项]
```

## 配置

### 数据库提供商

支持 PostgreSQL、MySQL、SQLite 和 SQL Server：

```bash
linch-schema generate:prisma --provider postgresql
linch-schema generate:prisma --provider mysql
linch-schema generate:prisma --provider sqlite
```

### 自定义输出路径

```bash
linch-schema generate:prisma --output ./database/schema.prisma
linch-schema generate:validators --output ./src/schemas/validators.ts
linch-schema generate:openapi --output ./docs/api-spec.json
```

### 配置文件

创建 `linch-schema.config.js`：

```javascript
export default {
  // 实体文件路径模式
  entities: [
    'src/entities/**/*.{ts,js}',
    'src/models/**/*.{ts,js}',
  ],
  
  // 输出配置
  output: {
    prisma: './prisma/schema.prisma',
    validators: './src/validators/generated.ts',
    mocks: './src/mocks/factories.ts',
    openapi: './docs/api.json',
    testData: './test-data',
  },
  
  // 数据库配置
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  
  // API 文档配置
  api: {
    title: '我的 API',
    version: '1.0.0',
    description: '我的超棒 API',
  },
}
```

## 与 Prisma 集成

生成 Prisma schema 后：

```bash
# 推送 schema 到数据库（开发环境）
npx prisma db push

# 或创建并运行迁移（生产环境）
npx prisma migrate dev --name init
npx prisma migrate deploy
```

## 最佳实践

1. **单一数据源**: 在 Zod 中定义一次数据结构
2. **到处验证**: 在 API 路由中使用生成的验证器
3. **类型安全**: 利用从 schema 生成的 TypeScript 类型
4. **测试**: 使用生成的 mock 数据进行一致的测试
5. **文档**: 使用生成的 OpenAPI 规范保持 API 文档最新

## 示例

查看 `examples/` 目录中的示例实体定义，包括：
- 基础使用示例（用户和文章实体）
- 高级功能示例（商品和订单实体，复杂验证）
- 软删除和复杂关系模式

## 贡献

此包是 Linch Kit 框架的一部分。请参阅主仓库的贡献指南。
