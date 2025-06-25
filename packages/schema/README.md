# @linch-kit/schema

LinchKit Schema驱动开发引擎 - 基于TypeScript的企业级Schema定义和代码生成工具

## 概述

`@linch-kit/schema` 是LinchKit框架的核心组件，提供强类型的Schema定义系统和代码生成能力。通过统一的Schema定义，自动生成Prisma模型、TypeScript类型、API接口等代码，实现完整的端到端类型安全。

## 核心特性

### ✨ 双重定义方式
- **函数式API**: 使用 `defineField` 和 `defineEntity` 进行Schema定义
- **装饰器模式**: 支持基于class的装饰器定义方式

### 🔧 丰富的字段类型
- **基础类型**: string, number, boolean, date
- **特殊类型**: email, url, uuid, text, json
- **高级类型**: enum, array, relation, i18n
- **扩展支持**: 自定义字段类型和验证规则

### 🏗️ 强大的代码生成
- **Prisma Schema**: 生成完整的数据库模型定义
- **TypeScript类型**: 生成类型安全的接口定义
- **Zod验证**: 自动生成运行时验证Schema
- **可扩展**: 支持自定义生成器

### 🌍 企业级特性
- **国际化支持**: 内置i18n字段类型和多语言Schema
- **权限控制**: 字段级和实体级权限定义
- **审计跟踪**: 自动时间戳和软删除支持
- **索引优化**: 智能索引建议和优化

## 快速开始

### 安装

```bash
pnpm add @linch-kit/schema
```

### 基础使用

#### 函数式API

```typescript
import { defineField, defineEntity } from '@linch-kit/schema'

// 定义用户实体
const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  name: defineField.string().required().min(2).max(50),
  email: defineField.email().required().unique(),
  age: defineField.number().min(0).max(120).optional(),
  role: defineField.enum(['admin', 'user', 'guest']).default('user'),
  profile: defineField.json().optional(),
  createdAt: defineField.date().auto().required(),
  updatedAt: defineField.date().auto().required()
})
```

#### 装饰器模式

```typescript
import { Entity, Field, Required, Unique, Default } from '@linch-kit/schema'

@Entity('User')
export class User {
  @Field.uuid().auto()
  @Required()
  id: string

  @Field.string().min(2).max(50)
  @Required()
  name: string

  @Field.email()
  @Required()
  @Unique()
  email: string

  @Field.number().min(0).max(120)
  age?: number

  @Field.enum(['admin', 'user', 'guest'])
  @Default('user')
  role: 'admin' | 'user' | 'guest'

  @Field.json()
  profile?: Record<string, unknown>

  @Field.date().auto()
  @Required()
  createdAt: Date

  @Field.date().auto()
  @Required()
  updatedAt: Date
}
```

### 关系定义

```typescript
// 一对多关系
const Post = defineEntity('Post', {
  id: defineField.uuid().auto().required(),
  title: defineField.string().required(),
  content: defineField.text().required(),
  authorId: defineField.uuid().required(),
  author: defineField.relation('User').manyToOne(),
  tags: defineField.array(defineField.string())
})

// 多对多关系
const Tag = defineEntity('Tag', {
  id: defineField.uuid().auto().required(),
  name: defineField.string().required().unique(),
  posts: defineField.relation('Post').manyToMany()
})
```

### 国际化字段

```typescript
const Product = defineEntity('Product', {
  id: defineField.uuid().auto().required(),
  name: defineField.i18n({
    locales: ['en', 'zh-CN', 'ja'],
    required: ['en'],
    fallback: 'en'
  }).required(),
  description: defineField.i18n({
    locales: ['en', 'zh-CN', 'ja'],
    type: 'text'
  }).optional()
})
```

## 代码生成

### Prisma Schema生成

```typescript
import { PrismaGenerator } from '@linch-kit/schema'

const generator = new PrismaGenerator()
const entities = [User, Post, Tag]

const prismaSchema = await generator.generate(entities)
console.log(prismaSchema[0].content)
```

生成的Prisma Schema:
```prisma
model User {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(50)
  email     String   @unique
  age       Int?
  role      Role     @default(user)
  profile   Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]

  @@map("users")
}

enum Role {
  admin
  user
  guest
}
```

### TypeScript类型生成

```typescript
import { TypeScriptGenerator } from '@linch-kit/schema'

const generator = new TypeScriptGenerator()
const typeFiles = await generator.generate(entities)
```

生成的TypeScript类型:
```typescript
export interface User {
  id: string
  name: string
  email: string
  age?: number
  role: 'admin' | 'user' | 'guest'
  profile?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateUser {
  name: string
  email: string
  age?: number
  role?: 'admin' | 'user' | 'guest'
  profile?: Record<string, unknown>
}

export interface UpdateUser {
  name?: string
  email?: string
  age?: number
  role?: 'admin' | 'user' | 'guest'
  profile?: Record<string, unknown>
}
```

## CLI工具

### 安装CLI

```bash
pnpm add -g @linch-kit/schema
```

### 基础命令

```bash
# 生成Prisma Schema
linch-kit schema:generate:prisma --input ./schemas --output ./prisma/schema.prisma

# 生成TypeScript类型
linch-kit schema:generate:types --input ./schemas --output ./src/types

# 验证Schema文件
linch-kit schema:validate --input ./schemas

# 迁移管理
linch-kit schema:migrate --name "add_user_table"
```

## 高级特性

### 自定义字段类型

```typescript
import { defineCustomFieldType } from '@linch-kit/schema'

const phoneField = defineCustomFieldType({
  name: 'phone',
  tsType: 'string',
  prismaType: 'String',
  validate: (value: unknown) => {
    return typeof value === 'string' && /^\+?[\d\s-()]+$/.test(value)
  },
  transform: (value: unknown) => {
    return String(value).replace(/\D/g, '')
  }
})

// 使用自定义字段类型
const Contact = defineEntity('Contact', {
  id: defineField.uuid().auto().required(),
  phone: phoneField().required()
})
```

### 权限控制

```typescript
const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  email: defineField.email().required().unique(),
  password: defineField.string().required().permissions({
    read: [{ role: 'admin' }],
    write: [{ role: 'owner', condition: 'self' }]
  }),
  salary: defineField.number().permissions({
    read: [{ role: 'admin' }, { role: 'hr' }],
    write: [{ role: 'admin' }]
  })
}, {
  permissions: {
    read: [{ role: 'authenticated' }],
    create: [{ role: 'admin' }],
    update: [{ role: 'admin' }, { role: 'owner', condition: 'self' }],
    delete: [{ role: 'admin' }]
  }
})
```

### Schema验证

```typescript
import { SchemaValidator } from '@linch-kit/schema'

const validator = new SchemaValidator()

// 验证实体定义
const isValid = validator.validateEntity(User)
if (!isValid) {
  console.log('Schema validation errors:', validator.getErrors())
}

// 验证数据
const userData = { name: 'John', email: 'john@example.com', age: 25 }
const validatedData = User.validateCreate(userData)
```

## 插件生态

### 官方插件

- `@linch-kit/schema-plugin-audit`: 审计日志插件
- `@linch-kit/schema-plugin-cache`: 缓存优化插件
- `@linch-kit/schema-plugin-search`: 全文搜索插件

### 自定义插件

```typescript
import { SchemaPlugin } from '@linch-kit/schema'

const auditPlugin: SchemaPlugin = {
  name: 'audit-plugin',
  transformEntity: (entity) => {
    // 自动为所有实体添加审计字段
    return entity.extend({
      createdBy: defineField.uuid().required(),
      updatedBy: defineField.uuid().required(),
      deletedBy: defineField.uuid().optional(),
      deletedAt: defineField.date().optional()
    })
  }
}
```

## 配置选项

### 全局配置

```typescript
import { configureSchema } from '@linch-kit/schema'

configureSchema({
  // 全局默认选项
  defaultTimestamps: true,
  defaultSoftDelete: true,
  defaultI18n: ['en', 'zh-CN'],
  
  // 命名约定
  tableNamePattern: 'snake_case',
  fieldNamePattern: 'camelCase',
  
  // 代码生成选项
  generators: {
    prisma: {
      outputPath: './prisma/schema.prisma',
      databaseProvider: 'postgresql'
    },
    typescript: {
      outputPath: './src/types',
      generateHelpers: true
    }
  }
})
```

## 最佳实践

### 1. Schema组织
- 将相关实体放在同一个文件中
- 使用命名空间避免命名冲突
- 合理使用Schema继承和组合

### 2. 字段设计
- 优先使用具体的字段类型而非通用类型
- 为所有字段添加适当的验证规则
- 合理设置字段的可选性和默认值

### 3. 关系设计
- 避免过度嵌套的关系
- 使用适当的关系类型
- 考虑查询性能优化索引

### 4. 国际化
- 统一规划支持的语言
- 设置合理的回退语言
- 考虑内容的本地化需求

## API 参考

### 核心API

#### defineField
字段定义的主入口，支持所有字段类型的链式调用。

#### defineEntity
实体定义函数，支持字段映射和选项配置。

#### Entity装饰器
基于class的实体定义装饰器。

#### Field装饰器
字段定义装饰器，支持所有字段类型。

### 生成器API

#### BaseGenerator
所有生成器的抽象基类。

#### PrismaGenerator
Prisma Schema生成器。

#### TypeScriptGenerator
TypeScript类型生成器。

## 开发状态

当前版本: `0.1.0`

### ✅ 已完成功能
- [x] 完整的字段类型系统 (string, number, boolean, date, email, url, uuid, text, json, enum, array, relation, i18n)
- [x] 函数式 defineField API
- [x] defineEntity 实体定义系统
- [x] 装饰器模式支持
- [x] Prisma Schema 生成器
- [x] TypeScript 类型生成器
- [x] 核心代码生成引擎
- [x] 基础测试框架

### 🚧 开发中功能
- [ ] 完整的类型错误修复
- [ ] Schema验证系统完善
- [ ] 数据库迁移系统
- [ ] 插件管理系统
- [ ] CLI命令实现

### 📋 计划功能
- [ ] 性能优化和缓存
- [ ] 更多代码生成器 (GraphQL, OpenAPI)
- [ ] 可视化Schema编辑器
- [ ] 高级权限控制
- [ ] 插件生态建设

## 技术架构

### 依赖关系
- `@linch-kit/core`: 基础设施和工具
- `zod`: 运行时类型验证
- `ts-morph`: TypeScript代码操作
- `reflect-metadata`: 装饰器元数据支持

### 兼容性
- Node.js >= 18
- TypeScript >= 5.0
- 支持 ES2022+ 环境

## 贡献指南

### 开发环境
```bash
# 克隆项目
git clone <repository-url>
cd linch-kit/packages/schema

# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建项目
pnpm build

# 类型检查
pnpm check-types
```

### 代码规范
- 严格遵循 TypeScript strict 模式
- 禁止使用 `any` 类型，必须使用 `unknown`
- 所有公共 API 必须有 JSDoc 注释
- 测试覆盖率目标: > 85%

## 许可证

MIT License

## 更新日志

### v0.1.0 (2025-06-25)
- 🎉 初始版本发布
- ✨ 完整的字段类型系统
- ✨ 双重定义方式支持
- ✨ 基础代码生成器
- ✨ TypeScript 严格模式支持

---

更多详细信息请查看 [LinchKit 官方文档](https://linch-kit.dev)