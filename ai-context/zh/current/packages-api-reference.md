# LinchKit 包 API 快速参考

**版本**: v3.0  
**更新**: 2025-06-28  
**用途**: 开发时快速查找包的核心 API，避免频繁查看源码

---

## 📦 @linch-kit/core

### 核心功能
- **插件系统** - 生命周期管理、依赖解析、事件总线
- **可观测性** - 日志、监控指标、链路追踪、健康检查
- **配置管理** - 多租户配置、热更新、环境变量
- **国际化** - 多语言支持、翻译函数、包级 i18n

### 主要 API
```typescript
// 插件系统
import { PluginSystem, definePlugin } from '@linch-kit/core'
await PluginSystem.register(plugin)
await PluginSystem.initialize()

// 日志系统
import { logger } from '@linch-kit/core'
logger.info('message', { meta: 'data' })
logger.error('error', error)

// 配置管理
import { ConfigManager } from '@linch-kit/core'
const config = await ConfigManager.get('key', defaultValue)
await ConfigManager.set('key', value)

// 国际化 (每个包都有自己的 i18n 实例)
import { createPackageI18n } from '@linch-kit/core'
const packageI18n = createPackageI18n({
  packageName: 'mypackage',
  defaultLocale: 'zh-CN',
  defaultMessages: { 'zh-CN': {}, 'en': {} },
  keyPrefix: 'mypackage'  // 命名空间前缀
})
const t = packageI18n.getTranslation(userT)
```

---

## 📊 @linch-kit/schema

### 核心功能
- **Schema 定义** - defineEntity、defineField 类型安全定义
- **代码生成** - Prisma schema、TypeScript 类型、验证器
- **类型推导** - 端到端类型安全
- **验证系统** - 基于 Zod 的运行时验证

### 主要 API
```typescript
// 国际化
import { useSchemaTranslation } from '@linch-kit/schema'
const t = useSchemaTranslation() // 使用 schema 包的翻译

// 字段定义
import { defineField } from '@linch-kit/schema'
const stringField = defineField.string({ required: true, maxLength: 100 })
const numberField = defineField.number({ minimum: 0, maximum: 100 })
const enumField = defineField.enum(['A', 'B', 'C'], { defaultValue: 'A' })
const dateField = defineField.date({ defaultValue: 'now' })
const jsonField = defineField.json()
const arrayField = defineField.array(defineField.string())

// 实体定义
import { defineEntity } from '@linch-kit/schema'
const UserEntity = defineEntity('User', {
  id: defineField.string({ required: true, unique: true }),
  email: defineField.email({ required: true, unique: true }),
  name: defineField.string({ maxLength: 100 }),
  status: defineField.enum(['ACTIVE', 'INACTIVE'], { defaultValue: 'ACTIVE' })
})

// 代码生成器
import { PrismaGenerator, TypeScriptGenerator } from '@linch-kit/schema'
const prismaSchema = await PrismaGenerator.generate(entities)
const types = await TypeScriptGenerator.generate(entities)
```

---

## 🔐 @linch-kit/auth

### 核心功能
- **多提供商认证** - NextAuth.js v5 集成、OAuth、凭据认证
- **权限控制** - RBAC/ABAC、CASL 引擎、字段级权限
- **多租户支持** - 租户隔离、权限隔离
- **企业级安全** - MFA、会话管理、审计日志

### 主要 API
```typescript
// 国际化 (Auth 包有自己的 i18n)
// Auth 包的翻译消息包括认证错误、权限提示等

// 用户类型 (扩展 NextAuth)
import type { LinchKitUser, LinchKitSession } from '@linch-kit/auth'

// 权限检查
import { PermissionChecker } from '@linch-kit/auth'
const canRead = await PermissionChecker.check(user, 'read', 'Post')
const accessiblePosts = await PermissionChecker.getAccessibleResources(user, 'read', 'Post')

// 角色和权限管理
import { RoleManager, PermissionManager } from '@linch-kit/auth'
await RoleManager.assignRole(userId, roleId)
await PermissionManager.grantPermission(roleId, permission)

// 会话管理
import { SessionManager } from '@linch-kit/auth'
const session = await SessionManager.create(user)
await SessionManager.validate(token)
```

---

## 🗃️ @linch-kit/crud

### 核心功能
- **类型安全 CRUD** - 基于 Schema 的自动类型推导
- **查询构建器** - 链式操作、复杂查询、关联查询
- **权限集成** - 自动权限过滤、字段级权限
- **性能优化** - 查询缓存、连接池、批量操作

### 主要 API
```typescript
// 国际化 (CRUD 包有自己的 i18n)
// CRUD 包的翻译消息包括操作提示、错误信息等

// CRUD 工厂
import { createCRUD } from '@linch-kit/crud'
const userCRUD = createCRUD('User', UserEntity, {
  permissions: true,
  cache: true,
  validation: true
})

// 基础操作
const user = await userCRUD.create(data, { user: currentUser })
const users = await userCRUD.findMany({ 
  where: { status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
  take: 10
}, { user: currentUser })
const user = await userCRUD.findUnique({ where: { id: userId } })
await userCRUD.update({ where: { id: userId }, data: updateData })
await userCRUD.delete({ where: { id: userId } })

// 查询构建器
import { QueryBuilder } from '@linch-kit/crud'
const query = QueryBuilder.for('User')
  .where('status', 'ACTIVE')
  .where('email', 'contains', '@example.com')
  .orderBy('createdAt', 'desc')
  .include(['posts', 'profile'])
  .take(10)
const results = await query.execute()
```

---

## 🌐 @linch-kit/trpc

### 核心功能
- **端到端类型安全** - 自动类型推导、运行时验证
- **中间件生态** - 认证、权限、缓存、限流、指标收集
- **CRUD 路由工厂** - 基于 Schema 自动生成 CRUD API
- **企业级路由** - 健康检查、系统监控、认证管理

### 主要 API
```typescript
// 国际化 (tRPC 包有自己的 i18n)
// tRPC 包的翻译消息包括 API 错误、中间件提示等

// 路由器创建
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@linch-kit/trpc'

const userRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      // 查询逻辑
    }),
  
  create: protectedProcedure
    .input(CreateUserSchema)
    .mutation(async ({ input, ctx }) => {
      // 创建逻辑
    })
})

// CRUD 路由工厂
import { createCRUDRouter } from '@linch-kit/trpc'
const userCRUDRouter = createCRUDRouter('User', UserEntity, {
  permissions: ['create', 'read', 'update', 'delete'],
  middleware: ['auth', 'rateLimit']
})

// 中间件
import { authMiddleware, permissionMiddleware, rateLimitMiddleware } from '@linch-kit/trpc'
const protectedProcedure = publicProcedure
  .use(authMiddleware())
  .use(permissionMiddleware('read', 'User'))
  .use(rateLimitMiddleware({ max: 100, window: '15m' }))
```

---

## 🎨 @linch-kit/ui

### 核心功能
- **Schema 驱动 UI** - 自动表单生成、数据表格生成
- **设计系统** - 基于 shadcn/ui、Tailwind CSS v4
- **国际化支持** - 多语言 UI 组件
- **主题系统** - 亮/暗主题切换

### 主要 API
```typescript
// 国际化 (UI 包有自己的 i18n)
import { useUITranslation } from '@linch-kit/ui'
const { t } = useUITranslation()

// Schema 表单
import { SchemaForm } from '@linch-kit/ui'
<SchemaForm
  entity={UserEntity}
  onSubmit={handleSubmit}
  defaultValues={defaultValues}
  mode="create" // 'create' | 'edit'
/>

// Schema 表格
import { SchemaTable } from '@linch-kit/ui'
<SchemaTable
  entity={UserEntity}
  data={users}
  onEdit={handleEdit}
  onDelete={handleDelete}
  permissions={{ edit: true, delete: true }}
  pagination={{ page: 1, pageSize: 10, total: 100 }}
/>

// 基础组件
import { Button, Card, Input, Label, Table } from '@linch-kit/ui'
<Button variant="primary" size="lg">Click me</Button>
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// 字段渲染器
import { SchemaFieldRenderer } from '@linch-kit/ui'
<SchemaFieldRenderer
  field={field}
  value={value}
  onChange={onChange}
  mode="edit"
/>
```

---

## 📋 常用集成模式

### 1. 新包开发模式
```typescript
// 1. 定义 Schema
const MyEntity = defineEntity('MyEntity', {
  id: defineField.string({ required: true, unique: true }),
  name: defineField.string({ required: true, maxLength: 100 })
})

// 2. 创建 CRUD 服务
const myCRUD = createCRUD('MyEntity', MyEntity)

// 3. 创建 tRPC 路由
const myRouter = createCRUDRouter('MyEntity', MyEntity)

// 4. 创建 UI 组件
<SchemaForm entity={MyEntity} onSubmit={handleSubmit} />
<SchemaTable entity={MyEntity} data={data} />
```

### 2. 权限控制模式
```typescript
// 在 CRUD 操作中
const data = await userCRUD.findMany({}, { 
  user: currentUser,  // 自动权限过滤
  permissions: ['read'] 
})

// 在 tRPC 中
const protectedProcedure = publicProcedure
  .use(authMiddleware())
  .use(permissionMiddleware('read', 'User'))
```

### 3. 多租户模式
```typescript
// 在查询中自动添加租户过滤
const data = await userCRUD.findMany({}, { 
  tenantId: currentUser.tenantId 
})

// 在权限检查中包含租户上下文
const canAccess = await PermissionChecker.check(user, 'read', resource, {
  tenantId: user.tenantId
})
```

### 4. 国际化模式
```typescript
// 每个包都有自己的 i18n 实例和命名空间
// @linch-kit/schema
import { useSchemaTranslation } from '@linch-kit/schema'
const schemaT = useSchemaTranslation()

// @linch-kit/ui  
import { useUITranslation } from '@linch-kit/ui'
const { t: uiT } = useUITranslation()

// 新包中创建 i18n
import { createPackageI18n } from '@linch-kit/core'
const packageI18n = createPackageI18n({
  packageName: 'mypackage',
  defaultLocale: 'zh-CN',
  defaultMessages: { 'zh-CN': {}, 'en': {} },
  keyPrefix: 'mypackage'  // 确保命名空间隔离
})

// 翻译消息会自动带上前缀: mypackage.error.validation.required
const errorMessage = packageI18n.getTranslation()('error.validation.required')
```

---

## 🌐 已有包的 i18n 实现

### @linch-kit/schema
- **翻译函数**: `useSchemaTranslation(userT?: TranslationFunction)`
- **消息类型**: 代码生成、Schema验证、CLI命令、插件注册、错误信息
- **命名空间**: `schema.`
- **语言**: 支持 en (默认) 和 zh-CN

### @linch-kit/ui  
- **翻译函数**: `useUITranslation()` 返回 `{ t }`
- **消息类型**: 表单操作、表格显示、通用UI文本
- **命名空间**: `ui.`
- **语言**: 支持 zh-CN (默认) 和 en

### 其他包的 i18n 状态
- **@linch-kit/auth**: 需要检查是否已实现
- **@linch-kit/crud**: 需要检查是否已实现  
- **@linch-kit/trpc**: 需要检查是否已实现
- **@linch-kit/console**: 正在开发中

### 新包 i18n 标准模式
```typescript
// 1. 创建包级 i18n
import { createPackageI18n } from '@linch-kit/core'
const packageI18n = createPackageI18n({
  packageName: 'newpackage',
  defaultLocale: 'zh-CN',
  defaultMessages: { 'zh-CN': messages, 'en': englishMessages },
  keyPrefix: 'newpackage'
})

// 2. 导出翻译函数
export const useNewPackageTranslation = (userT?: TranslationFunction) =>
  packageI18n.getTranslation(userT)

// 3. 在包内使用
const t = useNewPackageTranslation()
const message = t('operation.success') // 实际key: newpackage.operation.success
```

---

## 🔧 开发提示

### Schema 设计原则
- 优先使用 `defineField` 而非手写 Prisma
- 所有实体必须有 `id`、`createdAt`、`updatedAt` 字段
- 多租户实体添加 `tenantId` 字段
- 软删除实体添加 `deletedAt` 字段

### 性能优化
- 使用 CRUD 的查询缓存: `cache: true`
- 使用 tRPC 的响应缓存中间件
- 在高频查询字段上添加数据库索引: `index: true`

### 安全最佳实践
- 所有用户输入必须通过 Schema 验证
- 使用权限中间件保护敏感操作
- 审计日志记录重要操作
- 敏感数据加密存储

---

**使用此文档可以快速开发 LinchKit 包，避免频繁查看源码，提高开发效率。**