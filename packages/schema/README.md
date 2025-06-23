# @linch-kit/schema

🎯 **Linch Kit Schema 包** - 基于 Zod 的类型安全 Schema 定义库，支持统一字段配置、代码生成和国际化。

## ✨ 核心特性

- 🎯 **统一字段定义** - `defineField()` 函数提供清晰、可读的 Schema 定义
- 🌍 **国际化支持** - 内置 i18n 支持，不绑定特定库
- 🔧 **类型安全** - 完整的 TypeScript 支持和类型推导
- 🚀 **渐进增强** - 从简单的 `z.string()` 开始，需要时再加配置
- 🗄️ **JSON 字段支持** - 嵌套对象自动映射为数据库 JSON 字段
- 🔐 **权限预留** - 为字段和实体级别权限提供预置接口
- 🔄 **数据转换** - 输入清理和输出格式化支持
- 📊 **虚拟字段** - 带依赖追踪的计算字段
- 🏗️ **代码生成** - Prisma schema、Mock 数据、验证器和 OpenAPI 规范生成
- 🛠️ **CLI 工具** - 强大的命令行工具支持多种生成任务
- 📦 **最小依赖** - 仅依赖 Zod、commander 和 glob

## 📦 安装

```bash
pnpm add @linch-kit/schema zod
# 或
npm install @linch-kit/schema zod
```

## 🚀 快速开始

### 基础用法

```typescript
import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

// 定义用户实体
const User = defineEntity('User', {
  // 主键
  id: defineField(z.string().uuid(), {
    primary: true
  }),

  // 直接使用 Zod（最简单）
  email: z.string().email(),

  // 带配置的字段
  username: defineField(z.string().min(3), {
    unique: true,
    label: 'user.username.label'
  }),

  // JSON 字段 - 嵌套对象自动映射为数据库 JSON
  profile: defineField(z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().url().optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark']).default('light'),
      language: z.string().default('zh-CN')
    })
  }).optional(), {
    label: 'user.profile.label'
  }),

  // 时间戳
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'users'
})

// 导出类型和验证器
export const CreateUserSchema = User.createSchema
export const UpdateUserSchema = User.updateSchema
export const QueryUserSchema = User.querySchema

export type User = z.infer<typeof User.schema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
```

### CLI 工具使用

```bash
# 查看所有可用命令
npx linch-schema --help

# 生成 Prisma schema
npx linch-schema generate:prisma

# 生成验证器
npx linch-schema generate:validators

# 生成 Mock 数据工厂
npx linch-schema generate:mocks

# 生成 OpenAPI 文档
npx linch-schema generate:openapi

# 生成所有文件
npx linch-schema generate:all
```

## 🗄️ JSON Fields

Nested objects, arrays, and complex data types are automatically mapped to database JSON fields:

```typescript
const Product = defineEntity('Product', {
  id: defineField(z.string().uuid(), { primary: true }),

  // Nested object → JSON field
  specifications: z.object({
    weight: z.number(),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number()
    }),
    features: z.array(z.string())
  }),

  // Array → JSON field
  images: z.array(z.string().url()),

  // Record → JSON field
  metadata: z.record(z.string(), z.any()),

  // Explicit JSON type
  customData: defineField(z.any(), {
    db: { type: 'JSON' }
  })
})
```

**Generated Prisma Schema:**
```prisma
model Product {
  id             String @id
  specifications Json
  images         Json
  metadata       Json
  customData     Json   @db.JSON
}
```

## 🌍 Internationalization

### Setup

```typescript
import { setTranslateFunction } from '@linch-kit/schema'

// Vue.js + vue-i18n
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
setTranslateFunction(t)

// React + react-i18next
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
setTranslateFunction(t)
```

### Usage

```typescript
import { getFieldLabel, getEntityDisplayName } from '@linch-kit/schema'

// Custom translation key
email: defineField(z.string().email(), {
  label: 'user.email.label'  // Will be translated
})

// Auto-generated key
name: z.string()  // Will try 'schema.User.fields.name.label'

// Get translated labels
const emailLabel = getFieldLabel('User', 'email')
const entityName = getEntityDisplayName('User')
```

## 🔐 Permissions (Preview)

Schema package provides interfaces for permission configuration:

```typescript
const User = defineEntity('User', {
  // Field-level permissions
  email: defineField(z.string().email(), {
    permissions: {
      read: 'users:read-email',
      write: 'users:write-email'
    }
  }),

  // Sensitive field with data transformation
  ssn: defineField(z.string().optional(), {
    permissions: {
      read: ['users:read-pii', 'admin:full-access']
    },
    transform: {
      output: (value) => value ? `***-**-${value.slice(-4)}` : undefined
    }
  })
}, {
  // Entity-level permissions
  permissions: {
    create: 'users:create',
    read: 'users:read',
    update: 'users:update',
    delete: 'users:delete'
  }
})
```

> **Note**: Permission interfaces are provided by Schema package, but actual permission checking is implemented in CRUD package.

## 🏗️ Code Generation

Generate Prisma schema, mock data, and more:

```typescript
import { generatePrismaSchema, generateMockData } from '@linch-kit/schema'

// Generate Prisma schema
const prismaSchema = generatePrismaSchema([User, Product])

// Generate mock data
const mockUser = generateMockData(User)
const mockUsers = generateMockData(User, { count: 10 })
```

## 📚 API 文档

### 核心函数

#### defineField(schema, config?)

定义字段的完整配置选项：

```typescript
import { defineField } from '@linch-kit/schema'

defineField(z.string(), {
  // 数据库相关
  primary?: boolean              // 是否为主键
  unique?: boolean              // 是否唯一
  default?: any                 // 默认值
  createdAt?: boolean           // 是否为创建时间
  updatedAt?: boolean           // 是否为更新时间
  softDelete?: boolean          // 是否为软删除字段
  map?: string                  // 数据库字段名映射

  db?: {
    type?: 'JSON' | 'TEXT' | 'VARCHAR' | 'CHAR' | 'DECIMAL' | 'INT' | 'BIGINT' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TIMESTAMP' | string
    length?: number             // 字段长度
    precision?: number          // 精度
    scale?: number              // 小数位数
    json?: boolean              // 是否存储为 JSON
  }

  // UI 相关
  label?: string                // 字段标签（支持 i18n key）
  description?: string          // 字段描述
  placeholder?: string          // 占位符文本
  helpText?: string            // 帮助文本
  order?: number               // 显示顺序
  hidden?: boolean             // 是否隐藏
  group?: string               // 字段分组

  // 权限控制（预留接口）
  permissions?: {
    read?: string | string[]    // 读取权限
    write?: string | string[]   // 写入权限
  }

  // 数据转换（预留接口）
  transform?: {
    input?: (value: any) => any   // 输入转换
    output?: (value: any) => any  // 输出转换
  }

  // 虚拟字段（预留接口）
  virtual?: {
    computed?: boolean          // 是否为计算字段
    compute?: (entity: any) => any  // 计算函数
    dependencies?: string[]     // 依赖字段
  }

  // 关系配置
  relation?: {
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
    model: string               // 关联模型
    foreignKey?: string         // 外键字段
    references?: string         // 引用字段
    onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
    onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  }
})
```

#### defineEntity(name, fields, config?)

定义实体：

```typescript
import { defineEntity } from '@linch-kit/schema'

defineEntity('EntityName', {
  field1: z.string(),
  field2: defineField(z.number(), { label: 'Field 2' })
}, {
  tableName?: string            // 数据表名

  // 索引配置
  indexes?: Array<{
    fields: string[]            // 索引字段
    unique?: boolean            // 是否唯一索引
    name?: string               // 索引名称
  }>

  // 复合主键
  compositePrimaryKey?: string[]

  // 实体级权限（预留接口）
  permissions?: {
    create?: string | string[]
    read?: string | string[]
    update?: string | string[]
    delete?: string | string[]
  }

  // UI 配置
  ui?: {
    displayName?: string        // 显示名称
    description?: string        // 描述
    icon?: string              // 图标
    color?: string             // 颜色
  }
})
```

### 代码生成器

#### 生成 Prisma Schema

```typescript
import { generatePrismaSchema } from '@linch-kit/schema/generators'

// 生成 Prisma schema
const prismaSchema = generatePrismaSchema([User, Product], {
  provider: 'postgresql',
  url: process.env.DATABASE_URL
})

// 写入文件
await writePrismaSchema('./prisma/schema.prisma', { provider: 'postgresql' })
```

#### 生成验证器

```typescript
import { generateValidators } from '@linch-kit/schema/generators'

// 生成 Zod 验证器
const validators = generateValidators([User, Product])

// 写入文件
await writeValidators('./src/validators/generated.ts')
```

#### 生成 Mock 数据

```typescript
import { generateMockData, generateMockFactories } from '@linch-kit/schema/generators'

// 生成单个 Mock 数据
const mockUser = generateMockData(User)

// 生成多个 Mock 数据
const mockUsers = generateMockData(User, { count: 10 })

// 生成 Mock 工厂文件
await writeMockFactories('./src/mocks/factories.ts')
```

#### 生成 OpenAPI 文档

```typescript
import { generateOpenAPISpec } from '@linch-kit/schema/generators'

// 生成 OpenAPI 规范
const openApiSpec = generateOpenAPISpec([User, Product], {
  info: {
    title: 'My API',
    version: '1.0.0'
  }
})

// 写入文件
await writeOpenAPISpec('./docs/api.json')
```

### CLI 命令

```bash
# 初始化配置文件
npx linch-schema init

# 列出所有实体
npx linch-schema list

# 生成 Prisma schema
npx linch-schema generate:prisma [--provider postgresql] [--output ./prisma/schema.prisma]

# 生成验证器
npx linch-schema generate:validators [--output ./src/validators/generated.ts]

# 生成 Mock 工厂
npx linch-schema generate:mocks [--output ./src/mocks/factories.ts]

# 生成 OpenAPI 文档
npx linch-schema generate:openapi [--output ./docs/api.json]

# 生成测试数据
npx linch-schema generate:test-data [--count 10] [--output ./data/test-data.json]

# 生成所有文件
npx linch-schema generate:all

# 验证 Schema 定义
npx linch-schema validate

# 显示帮助
npx linch-schema --help
```

## 🏗️ 架构设计

Schema 包专注于数据定义，复杂的 UI 配置由 CRUD 包处理：

```typescript
// ✅ Schema 包：数据结构和基础配置
const User = defineEntity('User', {
  email: defineField(z.string().email(), {
    unique: true,
    label: 'user.email.label'
  })
})

// 🔄 CRUD 包：UI 配置和业务逻辑
const UserCrud = createCRUDFromSchema(User, {
  dataSource: databaseDataSource,
  permissions: {
    create: ['admin'],
    read: ['admin', 'user'],
    update: ['admin', 'owner'],
    delete: ['admin']
  }
})
```



## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm check-types

# 代码检查
pnpm lint

# 测试
pnpm test
```

## 📋 变更日志

### v0.2.1 (2024-06-21)

**新增功能**
- ✨ 完整的 CLI 工具支持
- ✨ 多种代码生成器（Prisma、验证器、Mock、OpenAPI）
- ✨ 实体注册表和全局管理
- ✨ 关系配置支持
- ✨ 虚拟字段和计算字段
- ✨ 数据转换接口

**改进**
- 🔧 优化 `defineField` 函数的类型推导
- 🔧 增强 JSON 字段自动检测
- 🔧 完善国际化支持
- 🔧 改进错误处理和验证

**技术特性**
- 🔒 完整的 TypeScript 类型支持
- 🚀 AI-First 设计理念
- 📦 最小化依赖管理
- 🛠️ 强大的 CLI 工具链

### v0.1.0 (2024-06-19)

**初始版本**
- ✨ 基础 Schema 定义功能
- ✨ Zod 集成和类型安全
- ✨ 基础代码生成
- ✨ 国际化框架

## 📖 示例

查看 [examples](./examples) 目录获取完整的使用示例：

- [基础用法](./examples/01-basic.ts) - defineField 入门
- [JSON 字段](./examples/02-json-fields.ts) - 嵌套对象处理
- [国际化](./examples/03-i18n.ts) - i18n 设置
- [权限配置](./examples/04-permissions.ts) - 权限接口（预览）
- [数据库生成](./examples/05-database.ts) - Prisma schema 生成

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/laofahai/linch-kit)
- [AI 上下文文档](../../ai-context/packages/schema.md)
- [@linch-kit/crud](../crud/README.md)
- [@linch-kit/core](../core/README.md)
- [示例项目](../../apps/starter)
