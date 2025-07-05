# @linch-kit/schema API Reference

## 📋 包概览

- **用途**: Schema 驱动开发引擎，提供类型安全的实体定义、代码生成、验证和迁移功能
- **版本**: 2.0.2
- **位置**: `packages/schema/`
- **层级**: L1 层核心组件
- **依赖**: @linch-kit/core (workspace), zod ^3.25.67, ts-morph ^26.0.0

## 🏗 架构设计

### 设计模式
- **建造者模式** - 字段和实体定义的链式调用
- **工厂模式** - defineField 和 defineEntity 工厂函数
- **模板方法模式** - 代码生成器的统一接口
- **组合模式** - Schema 的复用和组合能力

### 核心概念
- **字段定义** - 基于 FieldBuilder 的类型安全字段构建器
- **实体定义** - 完整的数据模型定义，包含字段、选项、权限等
- **Schema 组合** - 支持继承、混入、变体等多种组合模式
- **代码生成** - 从 Schema 定义生成 Prisma、TypeScript 等代码

### 集成方式
- **与 @linch-kit/core 集成** - 复用日志系统和基础设施
- **被其他包依赖** - 为 auth、crud、trpc 等包提供类型基础
- **插件系统** - 支持自定义生成器和验证器扩展

## 📖 核心API

### 核心导出

```typescript
// 类型定义
export type * from './types'

// 核心功能
export * from './core'              // 字段、实体、Schema 构建器
export * from './generators'        // 代码生成器系统
export * from './validation'        // 验证系统
export * from './migration'         // 迁移系统
export * from './plugins'           // 插件系统

// 装饰器
export { Entity as EntityDecorator, Field } from './decorators'

// 版本信息
export const VERSION = '0.1.0'
```

### 字段定义 API

#### defineField 工厂对象

```typescript
import { defineField } from '@linch-kit/schema'

// 基础类型
defineField.string()      // 字符串字段
defineField.number()      // 数字字段
defineField.boolean()     // 布尔字段
defineField.date()        // 日期字段

// 特殊类型
defineField.email()       // 邮箱字段
defineField.url()         // URL字段
defineField.uuid()        // UUID字段
defineField.text()        // 长文本字段
defineField.json()        // JSON字段

// 高级类型
defineField.enum(['a', 'b', 'c'])     // 枚举字段
defineField.array(defineField.string()) // 数组字段
defineField.relation('User')          // 关系字段
defineField.i18n({                    // 国际化字段
  locales: ['en', 'zh-CN'],
  required: ['en']
})
```

#### 字段构建器方法

```typescript
// 通用属性
field.required()          // 必填
field.optional()          // 可选
field.default(value)      // 默认值
field.unique()            // 唯一约束
field.index()             // 索引
field.description(text)   // 描述

// 字符串字段特有
field.min(length)         // 最小长度
field.max(length)         // 最大长度
field.pattern(regex)      // 正则模式
field.trim()              // 去除空格

// 数字字段特有
field.min(value)          // 最小值
field.max(value)          // 最大值
field.positive()          // 正数
field.negative()          // 负数
field.integer()           // 整数

// 关系字段特有
field.oneToOne()          // 一对一
field.oneToMany()         // 一对多
field.manyToOne()         // 多对一
field.manyToMany()        // 多对多
field.cascadeDelete()     // 级联删除
field.onDelete('CASCADE') // 删除行为
```

### 实体定义 API

#### defineEntity 函数

```typescript
import { defineEntity } from '@linch-kit/schema'

// 基础实体定义
const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  name: defineField.string().required().min(2).max(50),
  email: defineField.email().required().unique(),
  createdAt: defineField.date().auto().required(),
  updatedAt: defineField.date().auto().required()
})

// 带选项的实体定义
const Post = defineEntity('Post', {
  id: defineField.uuid().auto().required(),
  title: defineField.string().required(),
  content: defineField.text().required(),
  status: defineField.enum(['draft', 'published']).default('draft')
}, {
  // 实体选项
  tableName: 'posts',
  timestamps: true,
  softDelete: true,
  permissions: {
    read: [{ role: 'authenticated' }],
    create: [{ role: 'user' }],
    update: [{ role: 'owner' }],
    delete: [{ role: 'admin' }]
  }
})
```

#### 实体实例方法

```typescript
// 获取字段定义
User.getField('name')           // 获取字段
User.getFields()                // 获取所有字段
User.getFieldNames()            // 获取字段名列表

// 获取关系
User.getRelations()             // 获取关系字段
User.getRelation('posts')       // 获取指定关系

// 验证功能
User.validate(data)             // 验证数据
User.validateCreate(data)       // 验证创建数据
User.validateUpdate(data)       // 验证更新数据

// Schema 获取
User.zodSchema                  // 获取 Zod Schema
User.zodCreateSchema            // 获取创建 Schema
User.zodUpdateSchema            // 获取更新 Schema

// 元数据
User.name                       // 实体名称
User.tableName                  // 表名
User.options                    // 实体选项
```

### Schema 组合 API

#### SchemaBuilder 类

```typescript
import { SchemaBuilder } from '@linch-kit/schema'

// 创建 Schema 构建器
const builder = new SchemaBuilder()

// 基础字段添加
builder.field('name', defineField.string().required())
builder.field('age', defineField.number().min(0))

// 条件字段
builder.when('userType', 'admin', {
  permissions: defineField.json()
})

// 字段组
builder.group('contact', {
  email: defineField.email(),
  phone: defineField.string()
})

// 构建实体
const User = builder.build('User')
```

#### Schema 组合函数

```typescript
// 混入
const Timestamped = defineEntity('Timestamped', {
  createdAt: defineField.date().auto().required(),
  updatedAt: defineField.date().auto().required()
})

const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  name: defineField.string().required()
}).mixin(Timestamped)

// 模板
const createAuditableEntity = (fields: Record<string, any>) => {
  return defineEntity('', {
    ...fields,
    createdAt: defineField.date().auto().required(),
    updatedAt: defineField.date().auto().required(),
    createdBy: defineField.uuid(),
    updatedBy: defineField.uuid()
  })
}

// 变体
const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  name: defineField.string().required()
}).variants({
  admin: {
    permissions: defineField.json()
  },
  regular: {
    lastLogin: defineField.date()
  }
})
```

### 代码生成 API

#### 生成器基类

```typescript
import { BaseGenerator } from '@linch-kit/schema'

class CustomGenerator extends BaseGenerator {
  async generate(entities: Entity[]): Promise<GeneratedFile[]> {
    // 实现自定义生成逻辑
    return []
  }
}
```

#### Prisma 生成器

```typescript
import { PrismaGenerator } from '@linch-kit/schema'

const generator = new PrismaGenerator({
  databaseProvider: 'postgresql',
  previewFeatures: ['tracing']
})

const entities = [User, Post, Comment]
const files = await generator.generate(entities)

// 生成的文件结构
files.forEach(file => {
  console.log(file.path)      // 文件路径
  console.log(file.content)   // 文件内容
})
```

#### TypeScript 生成器

```typescript
import { TypeScriptGenerator } from '@linch-kit/schema'

const generator = new TypeScriptGenerator({
  generateHelpers: true,
  includeComments: true
})

const files = await generator.generate(entities)

// 生成的类型文件包含：
// - 实体接口定义
// - 创建/更新输入类型
// - 查询过滤器类型
// - 关系类型
// - 工具类型
```

#### 代码生成器管理

```typescript
import { CodeGenerator } from '@linch-kit/schema'

const generator = new CodeGenerator([
  new PrismaGenerator(),
  new TypeScriptGenerator(),
  new CustomGenerator()
])

// 生成所有代码
const allFiles = await generator.generateAll(entities)

// 写入文件
await generator.writeFiles(allFiles, './generated')
```

### 验证系统 API

#### 基础验证

```typescript
import { SchemaValidator } from '@linch-kit/schema'

const validator = new SchemaValidator()

// 验证实体定义
const isValid = validator.validateEntity(User)
if (!isValid) {
  const errors = validator.getErrors()
  console.log(errors)
}

// 验证数据
const userData = { name: 'John', email: 'john@example.com' }
const result = User.validate(userData)

if (result.success) {
  console.log('Valid data:', result.data)
} else {
  console.log('Validation errors:', result.error.issues)
}
```

#### 字段级验证

```typescript
// 自定义验证器
const customValidator = defineField.string()
  .refine(value => {
    return /^[A-Z]/.test(value)
  }, 'Must start with uppercase letter')

// 异步验证
const asyncValidator = defineField.string()
  .refine(async value => {
    const exists = await checkUserExists(value)
    return !exists
  }, 'Username already exists')
```

### 迁移系统 API

#### 迁移定义

```typescript
import { defineMigration } from '@linch-kit/schema'

const migration = defineMigration({
  name: 'add_user_profile',
  up: async (schema) => {
    // 添加字段
    schema.addField('User', 'profile', defineField.json())
    
    // 删除字段
    schema.removeField('User', 'oldField')
    
    // 修改字段
    schema.modifyField('User', 'email', defineField.email().unique())
  },
  down: async (schema) => {
    // 回滚操作
    schema.removeField('User', 'profile')
  }
})
```

#### 迁移管理

```typescript
import { MigrationManager } from '@linch-kit/schema'

const manager = new MigrationManager()

// 添加迁移
manager.addMigration(migration)

// 执行迁移
await manager.migrate()

// 回滚迁移
await manager.rollback()

// 获取迁移状态
const status = await manager.getStatus()
```

### 装饰器 API

#### Entity 装饰器

```typescript
import { Entity, Field, Required, Optional, Default, Unique } from '@linch-kit/schema'

@Entity('User', {
  tableName: 'users',
  timestamps: true
})
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

  @Field.number().min(0)
  @Optional()
  age?: number

  @Field.enum(['admin', 'user'])
  @Default('user')
  role: 'admin' | 'user'
}
```

#### Field 装饰器

```typescript
// 字段类型装饰器
@Field.string()
@Field.number()
@Field.boolean()
@Field.date()
@Field.email()
@Field.url()
@Field.uuid()
@Field.text()
@Field.json()
@Field.enum(['a', 'b', 'c'])
@Field.array(elementType)
@Field.relation('EntityName')
@Field.i18n(options)

// 字段约束装饰器
@Required()
@Optional()
@Default(value)
@Unique()
@Index()
@Min(value)
@Max(value)
@Length(min, max)
@Pattern(regex)
```

### 插件系统 API

#### 插件定义

```typescript
import { definePlugin } from '@linch-kit/schema'

const validationPlugin = definePlugin({
  name: 'validation-plugin',
  version: '1.0.0',
  hooks: {
    beforeGenerate: async (entities) => {
      // 生成前验证
      return entities
    },
    afterGenerate: async (files) => {
      // 生成后处理
      return files
    }
  },
  generators: {
    'custom': CustomGenerator
  }
})
```

#### 插件管理

```typescript
import { PluginManager } from '@linch-kit/schema'

const manager = new PluginManager()

// 注册插件
manager.register(validationPlugin)

// 使用插件
const generator = new CodeGenerator([], {
  plugins: [validationPlugin]
})
```

## 🔧 使用指南

### 基本用法

```typescript
import { defineField, defineEntity } from '@linch-kit/schema'

// 1. 定义字段
const nameField = defineField.string().required().min(2).max(50)
const emailField = defineField.email().required().unique()

// 2. 定义实体
const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  name: nameField,
  email: emailField,
  createdAt: defineField.date().auto().required()
})

// 3. 使用实体
const userData = { name: 'John', email: 'john@example.com' }
const validatedData = User.validate(userData)
```

### 关系定义

```typescript
// 一对多关系
const User = defineEntity('User', {
  id: defineField.uuid().auto().required(),
  posts: defineField.relation('Post').oneToMany()
})

const Post = defineEntity('Post', {
  id: defineField.uuid().auto().required(),
  authorId: defineField.uuid().required(),
  author: defineField.relation('User').manyToOne()
})

// 多对多关系
const Post = defineEntity('Post', {
  id: defineField.uuid().auto().required(),
  tags: defineField.relation('Tag').manyToMany()
})

const Tag = defineEntity('Tag', {
  id: defineField.uuid().auto().required(),
  posts: defineField.relation('Post').manyToMany()
})
```

### 代码生成

```typescript
import { PrismaGenerator, TypeScriptGenerator } from '@linch-kit/schema'

// 定义实体
const entities = [User, Post, Tag]

// 生成 Prisma Schema
const prismaGenerator = new PrismaGenerator()
const prismaFiles = await prismaGenerator.generate(entities)

// 生成 TypeScript 类型
const tsGenerator = new TypeScriptGenerator()
const tsFiles = await tsGenerator.generate(entities)

// 写入文件
await Promise.all([
  ...prismaFiles.map(file => writeFile(file.path, file.content)),
  ...tsFiles.map(file => writeFile(file.path, file.content))
])
```

### 最佳实践

1. **字段复用**
   ```typescript
   // 定义通用字段
   const idField = defineField.uuid().auto().required()
   const timestampFields = {
     createdAt: defineField.date().auto().required(),
     updatedAt: defineField.date().auto().required()
   }
   
   // 在实体中复用
   const User = defineEntity('User', {
     id: idField,
     ...timestampFields,
     name: defineField.string().required()
   })
   ```

2. **实体组合**
   ```typescript
   // 定义基础实体
   const BaseEntity = defineEntity('BaseEntity', {
     id: defineField.uuid().auto().required(),
     createdAt: defineField.date().auto().required(),
     updatedAt: defineField.date().auto().required()
   })
   
   // 继承基础实体
   const User = defineEntity('User', {
     name: defineField.string().required(),
     email: defineField.email().required()
   }).extends(BaseEntity)
   ```

3. **权限控制**
   ```typescript
   const User = defineEntity('User', {
     id: defineField.uuid().auto().required(),
     email: defineField.email().required(),
     password: defineField.string().permissions({
       read: [{ role: 'admin' }],
       write: [{ role: 'owner' }]
     })
   }, {
     permissions: {
       read: [{ role: 'authenticated' }],
       create: [{ role: 'admin' }],
       update: [{ role: 'owner' }],
       delete: [{ role: 'admin' }]
     }
   })
   ```

### 注意事项

1. **类型安全** - 始终使用 TypeScript 严格模式，避免类型断言
2. **性能考虑** - 大型 Schema 建议使用缓存机制
3. **验证规则** - 复杂验证逻辑建议使用自定义验证器
4. **关系设计** - 避免过度嵌套的关系定义
5. **国际化** - 统一规划支持的语言和回退策略

## 🔗 相关资源

- **源码位置**: `packages/schema/`
- **相关包**: @linch-kit/core (基础设施)
- **被依赖包**: @linch-kit/auth, @linch-kit/crud, @linch-kit/trpc
- **外部依赖**: 
  - zod ^3.25.67 (运行时验证)
  - ts-morph ^26.0.0 (TypeScript 代码操作)
  - @prisma/generator-helper ^6.10.1 (Prisma 生成器)
  - change-case ^5.4.4 (命名转换)
  - deep-diff ^1.0.2 (对象差异比较)

## 📊 开发状态

### ✅ 已完成功能 (90%)
- 完整的字段类型系统 (13种类型)
- 函数式 defineField API
- defineEntity 实体定义系统
- 装饰器模式支持
- Prisma Schema 生成器
- TypeScript 类型生成器
- 核心代码生成引擎
- 基础测试框架
- Schema 组合和复用功能

### 🚧 开发中功能 (10%)
- Schema 验证系统完善
- 数据库迁移系统
- CLI 命令实现
- 性能优化和缓存机制

### 📋 计划功能
- 更多代码生成器 (GraphQL, OpenAPI)
- 可视化 Schema 编辑器
- 高级权限控制系统
- 插件生态建设

## 📈 质量指标

- **类型安全**: ★★★★★ (完全类型安全)
- **API 设计**: ★★★★★ (直观易用)
- **扩展性**: ★★★★☆ (良好的插件系统)
- **性能**: ★★★☆☆ (需要缓存优化)
- **文档**: ★★★★☆ (API 文档完善)
- **测试**: ★★★☆☆ (需要提升覆盖率)

---

这个 API 文档为开发者和 AI 助手提供了完整的 @linch-kit/schema 包参考。通过结构化的信息组织，确保了良好的可读性和实用性。