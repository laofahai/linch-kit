# LinchKit 包 API 快速参考

**版本**: v4.0  
**更新**: 2025-06-30  
**状态**: 生产就绪

---

## 📦 @linch-kit/core (基础设施)

### 核心功能
- **插件系统** - 生命周期管理、依赖解析、事件总线
- **配置管理** - 多租户配置、热更新、Next.js集成
- **日志系统** - 结构化日志、级别控制
- **审计系统** - 审计日志、数据脱敏、多存储支持
- **CLI框架** - 插件化命令行工具
- **可观测性** - 健康检查、指标收集、分布式追踪（部分实现）

### 主要 API
```typescript
// 插件系统
import { createPluginRegistry } from '@linch-kit/core'
const registry = createPluginRegistry()
await registry.register(plugin)

// 配置管理
import { createSimpleTenantConfigManager } from '@linch-kit/core'
const configManager = createSimpleTenantConfigManager()

// 日志系统
import { createLogger } from '@linch-kit/core'
const logger = createLogger({ name: 'my-service' })
```

📖 **[完整 API 文档](./library_api/core.md)** - 详细的接口文档、使用示例和最佳实践

---

## 📊 @linch-kit/schema (Schema引擎)

### 核心功能
- **Schema 定义** - 实体和字段的类型安全定义
- **代码生成** - Prisma schema、TypeScript 类型
- **验证系统** - 基于 Zod 的运行时验证

### 主要 API
```typescript
// 字段定义
import { defineField } from '@linch-kit/schema'
const stringField = defineField.string({ required: true })
const emailField = defineField.email({ unique: true })

// 实体定义
import { defineEntity } from '@linch-kit/schema'
const UserEntity = defineEntity('User', {
  id: defineField.string({ required: true, unique: true }),
  email: defineField.email({ required: true, unique: true }),
  name: defineField.string({ maxLength: 100 })
})
```

---

## 🔐 @linch-kit/auth (认证权限)

### 核心功能
- **多提供商认证** - NextAuth.js v5 集成
- **权限控制** - RBAC/ABAC、字段级权限
- **多租户支持** - 租户隔离、权限隔离

### 主要 API
```typescript
// 权限检查
import { PermissionChecker } from '@linch-kit/auth'
const canRead = await PermissionChecker.check(user, 'read', 'Post')

// 角色管理
import { RoleManager } from '@linch-kit/auth'
await RoleManager.assignRole(userId, roleId)

// 会话管理
import { SessionManager } from '@linch-kit/auth'
const session = await SessionManager.create(user)
```

---

## 🗃️ @linch-kit/crud (CRUD操作)

### 核心功能
- **类型安全 CRUD** - 基于 Schema 的自动类型推导
- **查询构建器** - 链式操作、复杂查询
- **权限集成** - 自动权限过滤

### 主要 API
```typescript
// CRUD 工厂
import { createCRUD } from '@linch-kit/crud'
const userCRUD = createCRUD('User', UserEntity, {
  permissions: true,
  validation: true
})

// 基础操作
const user = await userCRUD.create(data, { user: currentUser })
const users = await userCRUD.findMany({ 
  where: { status: 'ACTIVE' },
  take: 10
}, { user: currentUser })

// tRPC集成
import { createCrudRouter } from '@linch-kit/crud'
const crudRouter = createCrudRouter({ router, protectedProcedure })
```

---

## 🌐 @linch-kit/trpc (API层)

### 核心功能
- **类型安全 API** - 端到端类型安全
- **路由管理** - 模块化路由组织
- **中间件支持** - 认证、权限、日志

### 主要 API
```typescript
// 服务端 (Node.js)
import { router, publicProcedure, protectedProcedure } from '@linch-kit/trpc/server'

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  users: protectedProcedure.query(async ({ ctx }) => {
    return await getUserList(ctx.user)
  })
})

// 客户端
import { createTRPCProxyClient } from '@linch-kit/trpc'
const client = createTRPCProxyClient<AppRouter>({ /* config */ })
```

---

## 🎨 @linch-kit/ui (UI组件)

### 核心功能
- **现代化组件** - 基于 shadcn/ui + Radix UI
- **主题系统** - 暗黑模式、自定义主题
- **表单组件** - react-hook-form 集成
- **数据表格** - 排序、筛选、分页

### 主要 API
```typescript
// 基础组件
import { 
  Button, 
  Card, 
  Input, 
  Table,
  Dialog,
  Form
} from '@linch-kit/ui/components'

// 表单集成
import { useForm } from '@linch-kit/ui/forms'
const form = useForm({
  schema: userSchema,
  defaultValues: {}
})

// 数据表格
import { DataTable } from '@linch-kit/ui/tables'
<DataTable 
  columns={columns} 
  data={data} 
  pagination={true}
/>
```

---

## 🏢 modules/console (管理控制台)

### 核心功能
- **企业管理** - 用户、租户、权限管理
- **系统监控** - 健康检查、性能指标
- **可视化面板** - Dashboard、图表展示

### 主要 API
```typescript
// Provider集成
import { ConsoleProvider } from '@linch-kit/console'
<ConsoleProvider>
  <App />
</ConsoleProvider>

// 管理组件
import { 
  UserManagement,
  TenantManagement,
  Dashboard
} from '@linch-kit/console'

// Hooks
import { useConsole, useTenants } from '@linch-kit/console'
const { currentTenant } = useConsole()
const { tenants, createTenant } = useTenants()
```

---

## 🔗 集成示例

### 完整应用架构
```typescript
// 1. 定义Schema
const UserEntity = defineEntity('User', {
  id: defineField.string({ required: true }),
  email: defineField.email({ required: true })
})

// 2. 创建CRUD
const userCRUD = createCRUD('User', UserEntity)

// 3. 创建tRPC路由
const userRouter = router({
  list: protectedProcedure.query(() => userCRUD.findMany()),
  create: protectedProcedure
    .input(UserEntity.createSchema)
    .mutation(({ input }) => userCRUD.create(input))
})

// 4. UI组件
function UserList() {
  const { data: users } = trpc.user.list.useQuery()
  return <DataTable columns={userColumns} data={users} />
}
```

### 企业级功能
```typescript
// 多租户
const tenantCRUD = createCRUD('Tenant', TenantEntity, {
  permissions: true,
  multiTenant: true
})

// 权限控制
const canCreateUser = await PermissionChecker.check(
  currentUser, 
  'create', 
  'User'
)

// AI Dashboard集成
import { DashboardView } from '@/components/dashboard'
// 提供实时数据可视化、AI洞察分析
```

---

## 🚀 快速上手

1. **安装依赖**
   ```bash
   bun add @linch-kit/core @linch-kit/schema @linch-kit/auth
   bun add @linch-kit/crud @linch-kit/trpc @linch-kit/ui
   ```

2. **基础配置**
   ```typescript
   // 初始化插件系统
   await PluginSystem.initialize()
   
   // 配置认证
   export const authOptions = createAuthConfig(/* ... */)
   
   // 设置tRPC
   export const appRouter = createAppRouter()
   ```

3. **构建应用**
   ```typescript
   // 创建实体 → 生成CRUD → 构建API → 开发UI
   ```

LinchKit 提供完整的企业级全栈解决方案，从 Schema 定义到 UI 展示的端到端类型安全开发体验。