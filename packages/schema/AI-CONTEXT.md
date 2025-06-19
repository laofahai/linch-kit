# Schema 包 AI 上下文

## 概述

`@linch-kit/schema` 是 Linch Kit 的数据模式定义包，提供类型安全的数据验证、代码生成和数据库集成功能。

## 核心功能

### 1. Schema 定义系统

```typescript
// 基于 Zod 的 Schema 定义
const userSchema = defineSchema({
  name: 'User',
  fields: {
    id: defineField().string().uuid(),
    name: defineField().string().min(1).max(100),
    email: defineField().string().email(),
    age: defineField().number().min(0).max(150).optional(),
    role: defineField().enum(['admin', 'user', 'guest']).default('user'),
    profile: defineField().object({
      bio: defineField().string().optional(),
      avatar: defineField().string().url().optional()
    }).optional(),
    tags: defineField().array(defineField().string()).default([]),
    createdAt: defineField().date().default(() => new Date()),
    updatedAt: defineField().date().optional()
  },
  
  // 数据库配置
  database: {
    table: 'users',
    indexes: ['email'],
    relations: {
      posts: { type: 'hasMany', target: 'Post', foreignKey: 'authorId' }
    }
  },
  
  // UI 配置
  ui: {
    listView: {
      columns: ['name', 'email', 'role', 'createdAt'],
      searchFields: ['name', 'email'],
      filters: ['role']
    },
    detailView: {
      groups: [
        { name: '基本信息', fields: ['name', 'email', 'role'] },
        { name: '个人资料', fields: ['profile'] },
        { name: '其他', fields: ['tags'] }
      ]
    }
  }
})
```

### 2. 类型生成

```typescript
// 自动生成的类型
type User = InferSchemaType<typeof userSchema>
type CreateUserInput = InferCreateInput<typeof userSchema>
type UpdateUserInput = InferUpdateInput<typeof userSchema>

// 验证函数
const validateUser = createValidator(userSchema)
const parseUser = createParser(userSchema)
```

### 3. 数据库集成

```typescript
// Prisma Schema 生成
generatePrismaSchema({
  schemas: [userSchema, postSchema],
  output: './prisma/schema.prisma'
})

// Drizzle Schema 生成
generateDrizzleSchema({
  schemas: [userSchema, postSchema],
  output: './src/db/schema.ts'
})
```

## 架构设计

### 1. 分层架构

```
Schema 包架构
├── 定义层 (Definition Layer)
│   ├── Field Definitions
│   ├── Schema Definitions
│   └── Validation Rules
├── 转换层 (Transform Layer)
│   ├── Type Generation
│   ├── Validation Generation
│   └── Parser Generation
├── 集成层 (Integration Layer)
│   ├── Database Integration
│   ├── API Integration
│   └── UI Integration
└── 工具层 (Utility Layer)
    ├── Code Generation
    ├── Migration Tools
    └── Development Tools
```

### 2. 核心组件

```typescript
interface SchemaSystem {
  // 字段定义
  fieldDefinition: {
    types: FieldType[]
    validators: Validator[]
    transformers: Transformer[]
  }
  
  // Schema 定义
  schemaDefinition: {
    fields: FieldDefinition[]
    metadata: SchemaMetadata
    relations: Relation[]
  }
  
  // 代码生成
  codeGeneration: {
    types: TypeGenerator
    validators: ValidatorGenerator
    parsers: ParserGenerator
  }
  
  // 数据库集成
  databaseIntegration: {
    prisma: PrismaGenerator
    drizzle: DrizzleGenerator
    migrations: MigrationGenerator
  }
}
```

## 使用模式

### 1. 基础 Schema 定义

```typescript
import { defineSchema, defineField } from '@linch-kit/schema'

const productSchema = defineSchema({
  name: 'Product',
  fields: {
    id: defineField().string().uuid(),
    name: defineField().string().min(1).max(200),
    description: defineField().string().optional(),
    price: defineField().number().min(0),
    category: defineField().string(),
    inStock: defineField().boolean().default(true),
    tags: defineField().array(defineField().string()).default([])
  }
})
```

### 2. 复杂关系定义

```typescript
const orderSchema = defineSchema({
  name: 'Order',
  fields: {
    id: defineField().string().uuid(),
    userId: defineField().string().uuid(),
    items: defineField().array(defineField().object({
      productId: defineField().string().uuid(),
      quantity: defineField().number().min(1),
      price: defineField().number().min(0)
    })),
    total: defineField().number().min(0),
    status: defineField().enum(['pending', 'paid', 'shipped', 'delivered']),
    createdAt: defineField().date().default(() => new Date())
  },
  
  database: {
    table: 'orders',
    relations: {
      user: { type: 'belongsTo', target: 'User', foreignKey: 'userId' },
      items: { type: 'hasMany', target: 'OrderItem', foreignKey: 'orderId' }
    }
  }
})
```

### 3. 验证和解析

```typescript
// 数据验证
const result = validateUser({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
})

if (result.success) {
  console.log('Valid user:', result.data)
} else {
  console.log('Validation errors:', result.errors)
}

// 数据解析
const user = parseUser(rawData) // 抛出错误如果无效
```

## 扩展点

### 1. 自定义字段类型

```typescript
// 注册自定义字段类型
registerFieldType('phone', {
  baseType: 'string',
  validator: (value) => /^\+?[\d\s-()]+$/.test(value),
  transformer: (value) => value.replace(/\D/g, ''),
  metadata: {
    inputType: 'tel',
    placeholder: '+1 (555) 123-4567'
  }
})

// 使用自定义字段类型
const contactSchema = defineSchema({
  name: 'Contact',
  fields: {
    phone: defineField().phone()
  }
})
```

### 2. 自定义验证器

```typescript
// 注册自定义验证器
registerValidator('uniqueEmail', async (value, context) => {
  const exists = await context.db.user.findFirst({
    where: { email: value }
  })
  return !exists || 'Email already exists'
})

// 使用自定义验证器
const userSchema = defineSchema({
  name: 'User',
  fields: {
    email: defineField().string().email().validate('uniqueEmail')
  }
})
```

## 性能优化

### 1. 延迟加载

```typescript
// Schema 延迟加载
const lazySchema = defineLazySchema(() => import('./user-schema'))

// 字段延迟验证
const expensiveField = defineField()
  .string()
  .validate(async (value) => {
    // 只在需要时执行昂贵的验证
    return await expensiveValidation(value)
  }, { lazy: true })
```

### 2. 缓存策略

```typescript
// 验证结果缓存
const cachedValidator = createCachedValidator(userSchema, {
  ttl: 60000, // 1分钟缓存
  maxSize: 1000 // 最大缓存条目
})

// Schema 编译缓存
const compiledSchema = compileSchema(userSchema, {
  cache: true,
  optimize: true
})
```

## 开发工具

### 1. CLI 工具

```bash
# 生成 Schema 文件
linch-kit schema generate --input ./schemas --output ./generated

# 验证 Schema 定义
linch-kit schema validate ./schemas/**/*.ts

# 生成数据库迁移
linch-kit schema migrate --from ./old-schema --to ./new-schema
```

### 2. 开发服务器

```typescript
// Schema 开发服务器
startSchemaDevServer({
  schemas: './schemas',
  watch: true,
  port: 3001,
  features: {
    typeGeneration: true,
    validationTesting: true,
    schemaVisualization: true
  }
})
```

这个 Schema 包为 Linch Kit 提供了强大、灵活和类型安全的数据模式定义能力。
