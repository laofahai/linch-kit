# @linch-kit/schema 集成示例

> **文档类型**: 集成示例  
> **适用场景**: 快速上手Schema驱动开发，了解最佳实践

## 🎯 概览

本文档提供 @linch-kit/schema 与其他包的集成示例，展示如何在实际项目中使用Schema驱动开发模式。

## 📝 基础Schema定义

### 实体定义

```typescript
// schemas/user.schema.ts
import { defineEntity, defineField } from '@linch-kit/schema'

export const UserSchema = defineEntity('User', {
  // 基础字段
  id: defineField({
    type: 'string',
    primary: true,
    generated: 'uuid'
  }),
  
  email: defineField({
    type: 'email',
    required: true,
    unique: true,
    validation: {
      message: 'validation.email.invalid'
    }
  }),
  
  name: defineField({
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    validation: {
      message: 'validation.name.required'
    }
  }),
  
  age: defineField({
    type: 'number',
    optional: true,
    min: 0,
    max: 150
  }),
  
  // 关系字段
  profile: defineField({
    type: 'relation',
    target: 'UserProfile',
    relation: 'one-to-one'
  }),
  
  posts: defineField({
    type: 'relation',
    target: 'Post',
    relation: 'one-to-many'
  }),
  
  // 审计字段
  createdAt: defineField({
    type: 'datetime',
    generated: 'created'
  }),
  
  updatedAt: defineField({
    type: 'datetime',
    generated: 'updated'
  })
}, {
  // 实体配置
  tableName: 'users',
  permissions: {
    read: ['user', 'admin'],
    write: ['admin'],
    delete: ['admin']
  },
  i18n: {
    name: 'entities.user.name',
    description: 'entities.user.description'
  }
})
```

### 复杂关系定义

```typescript
// schemas/blog.schema.ts
import { defineEntity, defineField, defineRelation } from '@linch-kit/schema'

// 用户实体
export const UserSchema = defineEntity('User', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  email: defineField({ type: 'email', required: true, unique: true }),
  name: defineField({ type: 'string', required: true })
})

// 文章实体
export const PostSchema = defineEntity('Post', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  title: defineField({ type: 'string', required: true }),
  content: defineField({ type: 'text', required: true }),
  status: defineField({ 
    type: 'enum',
    values: ['draft', 'published', 'archived'],
    default: 'draft'
  }),
  authorId: defineField({ type: 'string', required: true }),
  
  // 关系字段
  author: defineField({
    type: 'relation',
    target: 'User',
    relation: 'many-to-one',
    foreignKey: 'authorId'
  }),
  
  tags: defineField({
    type: 'relation',
    target: 'Tag',
    relation: 'many-to-many',
    through: 'PostTag'
  }),
  
  comments: defineField({
    type: 'relation',
    target: 'Comment',
    relation: 'one-to-many'
  })
})

// 标签实体
export const TagSchema = defineEntity('Tag', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  name: defineField({ type: 'string', required: true, unique: true }),
  color: defineField({ type: 'string', optional: true }),
  
  posts: defineField({
    type: 'relation',
    target: 'Post',
    relation: 'many-to-many',
    through: 'PostTag'
  })
})

// 多对多关联表
export const PostTagSchema = defineEntity('PostTag', {
  postId: defineField({ type: 'string', required: true }),
  tagId: defineField({ type: 'string', required: true }),
  
  post: defineField({
    type: 'relation',
    target: 'Post',
    relation: 'many-to-one',
    foreignKey: 'postId'
  }),
  
  tag: defineField({
    type: 'relation',
    target: 'Tag',
    relation: 'many-to-one',
    foreignKey: 'tagId'
  })
}, {
  primaryKey: ['postId', 'tagId']
})
```

## 🔧 代码生成集成

### 基础代码生成

```typescript
// scripts/generate-code.ts
import { generateCode, loadSchemas } from '@linch-kit/schema'
import { Logger } from '@linch-kit/core'

export async function generateAllCode() {
  try {
    Logger.info('Loading schemas...')
    
    // 加载所有Schema
    const schemas = await loadSchemas('./schemas/**/*.schema.ts')
    
    Logger.info(`Found ${schemas.length} schemas`)
    
    // 生成TypeScript类型
    await generateCode({
      schemas,
      target: 'typescript',
      outputDir: './src/types',
      options: {
        includeValidation: true,
        includeHelpers: true
      }
    })
    
    // 生成Prisma模型
    await generateCode({
      schemas,
      target: 'prisma',
      outputDir: './prisma',
      options: {
        databaseProvider: 'postgresql',
        includeSeeds: true
      }
    })
    
    // 生成API路由
    await generateCode({
      schemas,
      target: 'api',
      outputDir: './src/api',
      options: {
        framework: 'trpc',
        includeValidation: true,
        includePermissions: true
      }
    })
    
    Logger.info('Code generation completed successfully')
    
  } catch (error) {
    Logger.error('Code generation failed', error)
    throw error
  }
}

// 运行生成
generateAllCode()
```

### 监听模式代码生成

```typescript
// scripts/watch-generate.ts
import { watchSchemas, generateCode } from '@linch-kit/schema'
import { Logger } from '@linch-kit/core'

export async function watchAndGenerate() {
  Logger.info('Starting schema watch mode...')
  
  await watchSchemas('./schemas/**/*.schema.ts', async (changedSchemas) => {
    Logger.info(`Schema changed: ${changedSchemas.map(s => s.name).join(', ')}`)
    
    try {
      // 只重新生成受影响的代码
      await generateCode({
        schemas: changedSchemas,
        targets: ['typescript', 'prisma'],
        incremental: true
      })
      
      Logger.info('Incremental generation completed')
    } catch (error) {
      Logger.error('Incremental generation failed', error)
    }
  })
}
```

## 🔗 与其他包的集成

### 与 @linch-kit/core 集成

```typescript
// plugins/schema-plugin.ts
import { Plugin, PluginSystem, ConfigManager } from '@linch-kit/core'
import { loadSchemas, generateCode } from '@linch-kit/schema'

export const schemaPlugin: Plugin = {
  id: 'schema-plugin',
  name: 'Schema Plugin',
  version: '1.0.0',
  dependencies: ['@linch-kit/core'],
  
  async setup(config: any) {
    // 监听配置变化
    ConfigManager.onConfigChange('schema', async (schemaConfig) => {
      await this.regenerateSchemas(schemaConfig)
    })
    
    // 注册Schema相关事件
    PluginSystem.on('schema:reload', async () => {
      await this.loadAndValidateSchemas()
    })
    
    PluginSystem.on('schema:generate', async (options) => {
      await this.generateCodeWithOptions(options)
    })
    
    // 初始化Schema
    await this.loadAndValidateSchemas()
  },
  
  async loadAndValidateSchemas() {
    try {
      const schemas = await loadSchemas('./schemas/**/*.schema.ts')
      
      // 验证Schema
      for (const schema of schemas) {
        await this.validateSchema(schema)
      }
      
      // 发布Schema加载完成事件
      PluginSystem.emit('schema:loaded', { schemas })
      
    } catch (error) {
      PluginSystem.emit('schema:error', { error })
      throw error
    }
  },
  
  async regenerateSchemas(config: any) {
    await generateCode({
      schemas: await loadSchemas('./schemas/**/*.schema.ts'),
      targets: config.targets || ['typescript', 'prisma'],
      outputDir: config.outputDir || './generated'
    })
    
    PluginSystem.emit('schema:regenerated', { config })
  }
}
```

### 与 @linch-kit/auth 集成

```typescript
// integration/schema-auth.ts
import { defineEntity, defineField } from '@linch-kit/schema'

// 用户实体（集成权限）
export const UserSchema = defineEntity('User', {
  id: defineField({ type: 'string', primary: true }),
  email: defineField({ type: 'email', required: true }),
  
  // 权限相关字段
  role: defineField({
    type: 'enum',
    values: ['user', 'admin', 'moderator'],
    default: 'user'
  }),
  
  permissions: defineField({
    type: 'json',
    optional: true,
    validation: {
      schema: 'permissions.schema.json'
    }
  })
}, {
  // 实体级权限配置
  permissions: {
    read: ['user', 'admin'],
    write: ['admin'],
    delete: ['admin']
  },
  
  // 字段级权限配置
  fieldPermissions: {
    email: {
      read: ['self', 'admin'],
      write: ['self', 'admin']
    },
    role: {
      read: ['admin'],
      write: ['admin']
    },
    permissions: {
      read: ['admin'],
      write: ['admin']
    }
  }
})

// 生成权限感知的API
export async function generateAuthAwareAPI() {
  await generateCode({
    schemas: [UserSchema],
    target: 'api',
    options: {
      includePermissions: true,
      authenticationRequired: true,
      roleBasedAccess: true
    }
  })
}
```

### 与 @linch-kit/crud 集成

```typescript
// integration/schema-crud.ts
import { defineEntity, defineField, generateCode } from '@linch-kit/schema'

// 定义实体
export const ProductSchema = defineEntity('Product', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  name: defineField({ type: 'string', required: true }),
  price: defineField({ type: 'decimal', required: true, precision: 10, scale: 2 }),
  description: defineField({ type: 'text', optional: true }),
  category: defineField({ type: 'string', required: true }),
  stock: defineField({ type: 'number', required: true, min: 0 }),
  
  // 审计字段
  createdAt: defineField({ type: 'datetime', generated: 'created' }),
  updatedAt: defineField({ type: 'datetime', generated: 'updated' }),
  deletedAt: defineField({ type: 'datetime', optional: true })
}, {
  // CRUD配置
  crud: {
    create: {
      enabled: true,
      permissions: ['admin', 'manager'],
      validation: 'strict'
    },
    read: {
      enabled: true,
      permissions: ['user', 'admin'],
      pagination: true,
      sorting: true,
      filtering: true
    },
    update: {
      enabled: true,
      permissions: ['admin', 'manager'],
      validation: 'strict',
      optimisticLocking: true
    },
    delete: {
      enabled: true,
      permissions: ['admin'],
      softDelete: true
    }
  }
})

// 生成CRUD操作
export async function generateProductCRUD() {
  await generateCode({
    schemas: [ProductSchema],
    target: 'crud',
    options: {
      includeValidation: true,
      includePermissions: true,
      includePagination: true,
      includeFiltering: true,
      includeSorting: true
    }
  })
}
```

### 与 @linch-kit/trpc 集成

```typescript
// integration/schema-trpc.ts
import { defineEntity, defineField, generateCode } from '@linch-kit/schema'

// 定义API Schema
export const BlogSchema = defineEntity('Blog', {
  id: defineField({ type: 'string', primary: true }),
  title: defineField({ type: 'string', required: true }),
  content: defineField({ type: 'text', required: true }),
  authorId: defineField({ type: 'string', required: true }),
  
  author: defineField({
    type: 'relation',
    target: 'User',
    relation: 'many-to-one'
  })
}, {
  // tRPC配置
  trpc: {
    routes: {
      create: {
        enabled: true,
        input: 'CreateBlogInput',
        output: 'BlogOutput',
        middleware: ['auth', 'validate']
      },
      findMany: {
        enabled: true,
        input: 'FindManyBlogInput',
        output: 'BlogListOutput',
        middleware: ['paginate']
      },
      findUnique: {
        enabled: true,
        input: 'FindUniqueBlogInput',
        output: 'BlogOutput'
      },
      update: {
        enabled: true,
        input: 'UpdateBlogInput',
        output: 'BlogOutput',
        middleware: ['auth', 'validate', 'ownership']
      },
      delete: {
        enabled: true,
        input: 'DeleteBlogInput',
        output: 'DeleteBlogOutput',
        middleware: ['auth', 'ownership']
      }
    }
  }
})

// 生成tRPC路由
export async function generateBlogTRPC() {
  await generateCode({
    schemas: [BlogSchema],
    target: 'trpc',
    options: {
      includeMiddleware: true,
      includeValidation: true,
      includeTypes: true,
      outputDir: './src/trpc/routers'
    }
  })
}
```

## 🎨 与 @linch-kit/ui 集成

### 表单生成

```typescript
// integration/schema-ui-forms.ts
import { defineEntity, defineField, generateCode } from '@linch-kit/schema'

export const ContactFormSchema = defineEntity('ContactForm', {
  name: defineField({
    type: 'string',
    required: true,
    ui: {
      component: 'Input',
      label: 'forms.contact.name.label',
      placeholder: 'forms.contact.name.placeholder',
      validation: {
        required: 'forms.contact.name.required'
      }
    }
  }),
  
  email: defineField({
    type: 'email',
    required: true,
    ui: {
      component: 'EmailInput',
      label: 'forms.contact.email.label',
      placeholder: 'forms.contact.email.placeholder',
      validation: {
        required: 'forms.contact.email.required',
        invalid: 'forms.contact.email.invalid'
      }
    }
  }),
  
  subject: defineField({
    type: 'enum',
    values: ['general', 'support', 'sales', 'feedback'],
    required: true,
    ui: {
      component: 'Select',
      label: 'forms.contact.subject.label',
      options: [
        { value: 'general', label: 'forms.contact.subject.general' },
        { value: 'support', label: 'forms.contact.subject.support' },
        { value: 'sales', label: 'forms.contact.subject.sales' },
        { value: 'feedback', label: 'forms.contact.subject.feedback' }
      ]
    }
  }),
  
  message: defineField({
    type: 'text',
    required: true,
    ui: {
      component: 'Textarea',
      label: 'forms.contact.message.label',
      placeholder: 'forms.contact.message.placeholder',
      rows: 5,
      validation: {
        required: 'forms.contact.message.required',
        minLength: 'forms.contact.message.minLength'
      }
    }
  }),
  
  priority: defineField({
    type: 'enum',
    values: ['low', 'medium', 'high'],
    default: 'medium',
    ui: {
      component: 'RadioGroup',
      label: 'forms.contact.priority.label',
      options: [
        { value: 'low', label: 'forms.contact.priority.low' },
        { value: 'medium', label: 'forms.contact.priority.medium' },
        { value: 'high', label: 'forms.contact.priority.high' }
      ]
    }
  })
}, {
  ui: {
    form: {
      title: 'forms.contact.title',
      description: 'forms.contact.description',
      submitButton: 'forms.contact.submit',
      cancelButton: 'forms.contact.cancel'
    }
  }
})

// 生成表单组件
export async function generateContactForm() {
  await generateCode({
    schemas: [ContactFormSchema],
    target: 'ui-forms',
    options: {
      framework: 'react',
      styling: 'tailwind',
      validation: 'zod',
      i18n: true
    }
  })
}
```

### 数据表格生成

```typescript
// integration/schema-ui-tables.ts
import { defineEntity, defineField } from '@linch-kit/schema'

export const UserTableSchema = defineEntity('User', {
  id: defineField({
    type: 'string',
    primary: true,
    ui: {
      table: {
        hidden: true
      }
    }
  }),
  
  avatar: defineField({
    type: 'string',
    optional: true,
    ui: {
      table: {
        component: 'Avatar',
        width: 40,
        sortable: false
      }
    }
  }),
  
  name: defineField({
    type: 'string',
    required: true,
    ui: {
      table: {
        component: 'Text',
        sortable: true,
        searchable: true,
        width: 200
      }
    }
  }),
  
  email: defineField({
    type: 'email',
    required: true,
    ui: {
      table: {
        component: 'Email',
        sortable: true,
        searchable: true,
        width: 250
      }
    }
  }),
  
  role: defineField({
    type: 'enum',
    values: ['user', 'admin', 'moderator'],
    ui: {
      table: {
        component: 'Badge',
        sortable: true,
        filterable: true,
        width: 100,
        colorMap: {
          user: 'blue',
          admin: 'red',
          moderator: 'green'
        }
      }
    }
  }),
  
  status: defineField({
    type: 'enum',
    values: ['active', 'inactive', 'pending'],
    ui: {
      table: {
        component: 'StatusBadge',
        sortable: true,
        filterable: true,
        width: 100
      }
    }
  }),
  
  createdAt: defineField({
    type: 'datetime',
    ui: {
      table: {
        component: 'DateTime',
        sortable: true,
        width: 150,
        format: 'YYYY-MM-DD HH:mm'
      }
    }
  }),
  
  actions: defineField({
    type: 'virtual',
    ui: {
      table: {
        component: 'Actions',
        width: 120,
        actions: [
          { type: 'edit', icon: 'edit', permission: 'user.edit' },
          { type: 'delete', icon: 'trash', permission: 'user.delete', confirm: true }
        ]
      }
    }
  })
}, {
  ui: {
    table: {
      title: 'tables.users.title',
      description: 'tables.users.description',
      defaultSort: { field: 'createdAt', direction: 'desc' },
      pagination: { pageSize: 25, showSizeChanger: true },
      selection: { enabled: true, actions: ['delete', 'export'] },
      filters: {
        role: { type: 'select', options: 'enum' },
        status: { type: 'select', options: 'enum' },
        createdAt: { type: 'dateRange' }
      }
    }
  }
})
```

## 🚀 完整项目示例

### 电商项目Schema

```typescript
// schemas/ecommerce.schema.ts
import { defineEntity, defineField, defineRelation } from '@linch-kit/schema'

// 产品实体
export const ProductSchema = defineEntity('Product', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  sku: defineField({ type: 'string', unique: true, required: true }),
  name: defineField({ type: 'string', required: true }),
  description: defineField({ type: 'text', optional: true }),
  price: defineField({ type: 'decimal', required: true, precision: 10, scale: 2 }),
  comparePrice: defineField({ type: 'decimal', optional: true, precision: 10, scale: 2 }),
  stock: defineField({ type: 'number', required: true, min: 0 }),
  
  // 分类关系
  categoryId: defineField({ type: 'string', required: true }),
  category: defineField({
    type: 'relation',
    target: 'Category',
    relation: 'many-to-one',
    foreignKey: 'categoryId'
  }),
  
  // 图片关系
  images: defineField({
    type: 'relation',
    target: 'ProductImage',
    relation: 'one-to-many'
  }),
  
  // 变体关系
  variants: defineField({
    type: 'relation',
    target: 'ProductVariant',
    relation: 'one-to-many'
  })
}, {
  tableName: 'products',
  permissions: {
    read: ['public'],
    write: ['admin', 'manager'],
    delete: ['admin']
  },
  crud: {
    create: { enabled: true, permissions: ['admin', 'manager'] },
    read: { enabled: true, permissions: ['public'] },
    update: { enabled: true, permissions: ['admin', 'manager'] },
    delete: { enabled: true, permissions: ['admin'] }
  }
})

// 订单实体
export const OrderSchema = defineEntity('Order', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  orderNumber: defineField({ type: 'string', unique: true, required: true }),
  
  // 用户关系
  userId: defineField({ type: 'string', required: true }),
  user: defineField({
    type: 'relation',
    target: 'User',
    relation: 'many-to-one',
    foreignKey: 'userId'
  }),
  
  // 订单状态
  status: defineField({
    type: 'enum',
    values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }),
  
  // 价格信息
  subtotal: defineField({ type: 'decimal', required: true, precision: 10, scale: 2 }),
  tax: defineField({ type: 'decimal', required: true, precision: 10, scale: 2 }),
  shipping: defineField({ type: 'decimal', required: true, precision: 10, scale: 2 }),
  total: defineField({ type: 'decimal', required: true, precision: 10, scale: 2 }),
  
  // 订单项关系
  items: defineField({
    type: 'relation',
    target: 'OrderItem',
    relation: 'one-to-many'
  })
}, {
  permissions: {
    read: ['owner', 'admin'],
    write: ['admin'],
    delete: ['admin']
  }
})

// 生成完整电商系统
export async function generateEcommerceSystem() {
  const schemas = [ProductSchema, OrderSchema]
  
  // 生成数据库模型
  await generateCode({
    schemas,
    target: 'prisma',
    outputDir: './prisma'
  })
  
  // 生成TypeScript类型
  await generateCode({
    schemas,
    target: 'typescript',
    outputDir: './src/types'
  })
  
  // 生成API路由
  await generateCode({
    schemas,
    target: 'trpc',
    outputDir: './src/trpc/routers'
  })
  
  // 生成管理界面
  await generateCode({
    schemas,
    target: 'ui-admin',
    outputDir: './src/admin/pages'
  })
}
```

## 📝 最佳实践

### 1. Schema组织规范

```typescript
// ✅ 推荐的Schema文件组织
// schemas/
//   ├── entities/
//   │   ├── user.schema.ts
//   │   ├── product.schema.ts
//   │   └── order.schema.ts
//   ├── relations/
//   │   ├── user-product.schema.ts
//   │   └── order-item.schema.ts
//   ├── common/
//   │   ├── audit.schema.ts
//   │   └── base.schema.ts
//   └── index.ts

// schemas/common/audit.schema.ts
export const auditFields = {
  createdAt: defineField({ type: 'datetime', generated: 'created' }),
  updatedAt: defineField({ type: 'datetime', generated: 'updated' }),
  deletedAt: defineField({ type: 'datetime', optional: true })
}

// schemas/entities/user.schema.ts
import { auditFields } from '../common/audit.schema'

export const UserSchema = defineEntity('User', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  email: defineField({ type: 'email', required: true, unique: true }),
  name: defineField({ type: 'string', required: true }),
  
  // 继承审计字段
  ...auditFields
})
```

### 2. 验证和约束

```typescript
// ✅ 完整的验证配置
export const UserProfileSchema = defineEntity('UserProfile', {
  email: defineField({
    type: 'email',
    required: true,
    validation: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'validation.email.invalid',
      transform: (value: string) => value.toLowerCase().trim()
    }
  }),
  
  age: defineField({
    type: 'number',
    optional: true,
    validation: {
      min: { value: 13, message: 'validation.age.minimum' },
      max: { value: 150, message: 'validation.age.maximum' },
      integer: { message: 'validation.age.integer' }
    }
  }),
  
  phone: defineField({
    type: 'string',
    optional: true,
    validation: {
      pattern: /^\+?[1-9]\d{1,14}$/,
      message: 'validation.phone.invalid',
      transform: (value: string) => value.replace(/\D/g, '')
    }
  })
})
```

### 3. 性能优化

```typescript
// ✅ 性能优化配置
export const PerformantSchema = defineEntity('LargeEntity', {
  id: defineField({ type: 'string', primary: true }),
  
  // 索引优化
  email: defineField({ 
    type: 'email', 
    required: true,
    index: { unique: true, name: 'idx_email' }
  }),
  
  // 复合索引
  status: defineField({ type: 'string', required: true }),
  category: defineField({ type: 'string', required: true })
}, {
  // 实体级索引
  indexes: [
    { fields: ['status', 'category'], name: 'idx_status_category' },
    { fields: ['createdAt'], name: 'idx_created_at' }
  ],
  
  // 查询优化
  queries: {
    findByStatus: {
      where: { status: 'active' },
      select: ['id', 'name', 'status'],
      orderBy: { createdAt: 'desc' }
    }
  }
})
```

## 🔗 相关链接

- [API参考](./api-reference.md) - 完整API文档
- [实现指南](./implementation-guide.md) - 内部实现细节
- [依赖分析](./dependencies-analysis.md) - 包依赖关系
- [高级特性](./advanced-features.md) - 自定义字段和生成器
- [集成模式](../../../shared/integration-patterns.md) - 通用集成模式