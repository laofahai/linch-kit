# @linch-kit/schema

🎯 **类型安全的 Schema 定义库**，基于 Zod 构建，提供统一的字段配置和国际化支持。

## ✨ 特性

- 🎯 **统一字段定义**：`defineField()` 函数提供清晰、可读的 Schema 定义
- 🌍 **国际化支持**：内置 i18n 支持，不绑定特定库
- 🔧 **类型安全**：完整的 TypeScript 支持和类型推导
- 🚀 **渐进增强**：从简单的 `z.string()` 开始，需要时再加配置
- 🗄️ **JSON 字段支持**：嵌套对象自动映射为数据库 JSON 字段
- 🔐 **权限预留**：为字段和实体级别权限提供预置接口
- 🔄 **数据转换**：输入清理和输出格式化支持
- 📊 **虚拟字段**：带依赖追踪的计算字段
- 🏗️ **代码生成**：Prisma schema、Mock 数据和 OpenAPI 规范生成
- 📦 **最小依赖**：仅依赖 Zod、commander 和 glob

## 📦 安装

```bash
npm install @linch-kit/schema zod
# 或
yarn add @linch-kit/schema zod
# 或
pnpm add @linch-kit/schema zod
```

## 🚀 快速开始

### 基础用法

```typescript
import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

// 🎯 统一字段定义
const User = defineEntity('User', {
  // 直接使用 Zod（最简单）
  email: z.string().email(),
  
  // 带配置的字段定义
  username: defineField(z.string().min(3), {
    unique: true,
    label: 'user.username.label',
    placeholder: 'user.username.placeholder'
  }),
  
  // JSON 字段 - 嵌套对象自动映射为数据库 JSON
  address: defineField(z.object({
    street: z.string(),
    city: z.string(),
    country: z.string().default('US')
  }).optional(), {
    label: 'user.address.label'
  })
})
```

## 🗄️ JSON 字段支持

Schema 包自动将嵌套对象、数组等复杂类型映射为数据库的 JSON 字段：

```typescript
const Product = defineEntity('Product', {
  // 嵌套对象 → JSON 字段
  specifications: z.object({
    weight: z.number(),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number()
    }),
    features: z.array(z.string())
  }),
  
  // 数组 → JSON 字段
  images: z.array(z.string().url()),
  
  // Record → JSON 字段
  metadata: z.record(z.string(), z.any()),
  
  // 明确指定 JSON 类型
  customData: defineField(z.any(), {
    db: { type: 'JSON' }
  })
})
```

生成的 Prisma Schema：
```prisma
model Product {
  specifications Json
  images         Json
  metadata       Json
  customData     Json @db.JSON
}
```

## 🌍 国际化支持

### 设置翻译函数

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

### 使用翻译

```typescript
import { getFieldLabel, getEntityDisplayName } from '@linch-kit/schema'

// 获取字段标签
const emailLabel = getFieldLabel('User', 'email')
// 如果有自定义 label，使用自定义的
// 否则尝试翻译 'schema.User.fields.email.label'
// 最后回退到格式化的字段名 'Email'

// 获取实体显示名称
const entityName = getEntityDisplayName('User')
```

## 🏗️ 架构设计

Schema 包专注于数据定义，复杂的 UI 配置留给 CRUD 包：

```typescript
// ✅ Schema 包职责：数据结构和基础配置
const User = defineEntity('User', {
  email: defineField(z.string().email(), {
    unique: true,
    label: 'user.email.label'
  })
})

// 🔄 CRUD 包职责：UI 配置和业务逻辑
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

## 📚 API 参考

### defineField(schema, config?)

```typescript
defineField(z.string(), {
  // 数据库相关
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
  
  // UI 相关
  label?: string
  description?: string
  placeholder?: string
  helpText?: string
  order?: number
  hidden?: boolean
  group?: string
})
```



## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
