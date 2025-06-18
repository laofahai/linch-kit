# @linch-kit/schema

🎯 **Type-safe schema definition library** built on Zod, providing unified field configuration and i18n support.

## ✨ Features

- 🎯 **Unified Field Definition**: `defineField()` function for clean, readable schema definitions
- 🌍 **i18n Support**: Built-in internationalization without binding to specific libraries
- 🔧 **Type Safety**: Complete TypeScript support and type inference
- 🚀 **Progressive Enhancement**: Start with simple `z.string()`, add configuration when needed
- 🗄️ **JSON Field Support**: Automatic mapping of nested objects to database JSON fields
- 🔐 **Permission Ready**: Pre-built interfaces for field and entity-level permissions
- 🔄 **Data Transformation**: Input sanitization and output formatting support
- 📊 **Virtual Fields**: Computed fields with dependency tracking
- 🏗️ **Code Generation**: Prisma schema, mock data, and OpenAPI spec generation
- 📦 **Minimal Dependencies**: Only depends on Zod, commander, and glob

## 📦 安装

```bash
npm install @linch-kit/schema zod
# 或
yarn add @linch-kit/schema zod
# 或
pnpm add @linch-kit/schema zod
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

// 🎯 Unified field definition
const User = defineEntity('User', {
  // Primary key
  id: defineField(z.string().uuid(), {
    primary: true
  }),

  // Direct Zod usage (simplest)
  email: z.string().email(),

  // Field with configuration
  username: defineField(z.string().min(3), {
    unique: true,
    label: 'user.username.label'
  }),

  // JSON field - nested objects automatically mapped to database JSON
  address: defineField(z.object({
    street: z.string(),
    city: z.string(),
    country: z.string().default('US')
  }).optional(), {
    label: 'user.address.label'
  }),

  // Timestamps
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'users'
})

// Export types and validators
export const CreateUserSchema = User.createSchema
export const UpdateUserSchema = User.updateSchema

export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
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

## 📚 API Reference

### defineField(schema, config?)

Define a field with complete configuration options:

```typescript
defineField(z.string(), {
  // Database
  primary?: boolean
  unique?: boolean
  default?: any
  createdAt?: boolean
  updatedAt?: boolean
  db?: {
    type?: 'JSON' | 'TEXT' | 'VARCHAR' | string
    length?: number
    precision?: number
    scale?: number
  }

  // UI
  label?: string
  description?: string
  placeholder?: string
  helpText?: string
  order?: number
  hidden?: boolean
  group?: string

  // Permissions (Preview)
  permissions?: {
    read?: string | string[]
    write?: string | string[]
  }

  // Data transformation (Preview)
  transform?: {
    input?: (value: any) => any
    output?: (value: any) => any
  }
})
```

### defineEntity(name, fields, config?)

Define an entity:

```typescript
defineEntity('EntityName', {
  field1: z.string(),
  field2: defineField(z.number(), { label: 'Field 2' })
}, {
  tableName?: string
  permissions?: {
    create?: string | string[]
    read?: string | string[]
    update?: string | string[]
    delete?: string | string[]
  }
})
```

## 🏗️ Architecture

Schema package focuses on data definition, while complex UI configurations are handled by CRUD package:

```typescript
// ✅ Schema package: Data structure and basic configuration
const User = defineEntity('User', {
  email: defineField(z.string().email(), {
    unique: true,
    label: 'user.email.label'
  })
})

// 🔄 CRUD package: UI configuration and business logic
const UserCrud = createCrud(User, {
  components: {
    email: {
      input: 'email-input',
      display: 'email-display',
      list: 'email-cell'
    }
  },
  views: {
    list: { columns: ['email', 'createdAt'] },
    form: { layout: 'vertical' }
  }
})
```



## 📖 Examples

Check out the [examples](./examples) directory for comprehensive usage examples:

- [Basic Usage](./examples/01-basic.ts) - Getting started with defineField
- [JSON Fields](./examples/02-json-fields.ts) - Working with nested objects
- [Internationalization](./examples/03-i18n.ts) - Setting up i18n
- [Permissions](./examples/04-permissions.ts) - Permission interfaces (preview)
- [Database Generation](./examples/05-database.ts) - Prisma schema generation

## 🤝 Contributing

We welcome Issues and Pull Requests!

## 📄 License

MIT License
