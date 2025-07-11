# LinchKit 核心包设计

---

document_type: "architecture_design"
purpose: "Graph RAG knowledge base - Package architecture and dependencies"
entities:

- "@linch-kit/core"
- "@linch-kit/auth"
- "@linch-kit/platform"
- "@linch-kit/ui"
- "extensions/console"
- "tools/schema"
- "tools/cli"
- "tools/context"
  relationships:
- type: "dependency_chain"
  sequence: ["core", "auth", "platform", "ui"]
- type: "layer_architecture"
  layers: ["L0", "L1", "L2", "L3"]
  version: "2.0.2"
  last_verified: "2025-07-07"
  implementation_status: "production_ready"

---

## 📦 包架构设计原则

### 设计哲学

- **单一职责**: 每个包专注一个核心功能领域
- **最小依赖**: 减少包之间的耦合度
- **类型安全**: 100% TypeScript，严格模式
- **可组合性**: 包可以独立使用或组合使用

### 依赖顺序约束

```
core → auth → platform → ui
```

**严格禁止**：循环依赖和逆向依赖

## 🏗️ 核心包详细设计

### L0: @linch-kit/core

**职责**: 基础设施和核心功能

- **配置管理**: ConfigManager - 统一配置读取和管理
- **日志系统**: Logger - 结构化日志记录
- **插件系统**: PluginManager - 插件注册和生命周期管理
- **事件系统**: EventEmitter - 类型安全的事件通信
- **审计日志**: AuditLogger - 企业级审计功能基础

**扩展能力**:

- 事件系统基础设施
- WebSocket实时通信支持
- 通知管理核心功能

### L1: @linch-kit/schema

**职责**: Schema定义、验证、转换

- **Schema定义**: defineEntity - 基于Zod的实体定义
- **类型生成**: 自动生成TypeScript类型
- **验证器**: 运行时数据验证
- **转换器**: 数据格式转换和映射

**核心功能**:

```typescript
// Schema定义示例
const UserSchema = defineEntity('User', {
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.date().default(() => new Date()),
})

// 自动生成类型
type User = z.infer<typeof UserSchema>
```

### L2: @linch-kit/auth

**职责**: 认证、授权、会话管理

- **认证集成**: NextAuth.js 5.0 深度集成
- **权限引擎**: 基于CASL的RBAC/ABAC系统
- **会话管理**: 安全的会话状态管理
- **中间件**: 权限检查中间件

**扩展功能**:

- 增强型RBAC + 混合行级权限
- 字段级权限控制和运行时过滤
- 角色继承和权限聚合
- PostgreSQL RLS集成

**权限模型**:

```typescript
// 权限检查示例
const permission = await permissionChecker.check({
  user: currentUser,
  action: 'read',
  resource: 'user_profile',
  resourceId: targetUserId,
})
```

### L2: @linch-kit/crud

**职责**: 通用CRUD操作

- **CRUD生成器**: createCRUD - 基于Schema自动生成CRUD操作
- **权限集成**: 自动集成@linch-kit/auth权限检查
- **查询优化**: 智能查询构建和优化
- **批量操作**: 高效的批量数据操作

**核心功能**:

```typescript
// CRUD操作示例
const userCRUD = createCRUD(UserSchema, {
  permissions: {
    create: 'user:create',
    read: 'user:read',
    update: 'user:update',
    delete: 'user:delete',
  },
})

// 自动权限检查的查询
const users = await userCRUD.findMany({
  where: { role: 'USER' },
  user: currentUser, // 自动应用权限过滤
})
```

### L3: @linch-kit/trpc

**职责**: 类型安全API层

- **路由生成**: 基于Schema自动生成tRPC路由
- **类型安全**: 端到端类型安全保障
- **中间件集成**: 认证和权限中间件
- **客户端生成**: 自动生成客户端SDK

**核心功能**:

```typescript
// tRPC路由示例
export const userRouter = router({
  list: publicProcedure.input(UserListSchema).query(async ({ input, ctx }) => {
    return userCRUD.findMany(input, { user: ctx.user })
  }),

  create: protectedProcedure.input(UserCreateSchema).mutation(async ({ input, ctx }) => {
    return userCRUD.create(input, { user: ctx.user })
  }),
})
```

### L3: @linch-kit/ui

**职责**: UI组件库

- **基础组件**: 基于shadcn/ui的企业级组件
- **布局组件**: Sidebar、Header、Main等布局组件
- **业务组件**: 表格、表单、图表等业务组件
- **主题系统**: 统一的主题和样式管理

**组件层次**:

```typescript
// 组合式基础组件
export { Sidebar, Header, Main, SidebarProvider, SidebarTrigger } from './components'

// 预制布局模板
export function VerticalLayout({ sidebar, header, children }) {
  // 布局实现
}
```

### L4: extensions/console

**职责**: 企业级管理控制台平台（集成器）

- **平台基础设施**: 统一的导航、主题、权限、布局系统
- **功能集成**: 将所有 packages 功能组合成完整管理界面
- **插件管理**: 官方插件和第三方插件的加载管理
- **扩展支持**: 支持自定义路由和组件的动态注册

**新架构特点**:

- **完全基于 packages**: Console 不实现业务逻辑，只做集成
- **配置驱动**: 通过 LinchKitConfig 控制功能和外观
- **可选使用**: 用户可以完全绕过 Console 直接使用 packages
- **渐进式扩展**: 支持从开箱即用到完全自定义的平滑升级

**集成方式**:

```typescript
// Console 作为平台基础设施
import { LinchKitConsole } from '@linch-kit/console'
import config from '@/linchkit.config'

export default function DashboardPage() {
  return <LinchKitConsole config={config} />
}

// 混合模式：Console + 自定义功能
const hybridConfig: LinchKitConfig = {
  mode: 'hybrid',
  console: {
    features: ['user-management', 'tenant-management']
  },
  hybrid: {
    customRoutes: [
      {
        path: '/inventory',
        component: './src/extensions/inventory/InventoryPage',
        name: '库存管理'
      }
    ]
  }
}
```

## 🔒 包功能复用强制要求

### 必须使用LinchKit内部功能

**绝对禁止**重新实现已有功能：

- **日志系统**: 使用 `@linch-kit/core` logger
- **配置管理**: 使用 `@linch-kit/core` ConfigManager
- **Schema定义**: 使用 `@linch-kit/schema` defineEntity
- **权限检查**: 使用 `@linch-kit/auth` PermissionChecker
- **CRUD操作**: 使用 `@linch-kit/crud` createCRUD
- **UI组件**: 使用 `@linch-kit/ui` 组件库

### 扩展包能力分析

**@linch-kit/auth 扩展潜力**:

- 现有能力: 已集成 CASL (RBAC/ABAC支持)、NextAuth.js 5.0
- 扩展方向: 增强权限检查器、字段级权限控制、角色继承

**extensions/console 扩展潜力**:

- 现有能力: 多租户管理、权限控制、完整组件架构
- 扩展方向: 权限管理UI、系统监控界面、插件市场

**@linch-kit/core 扩展潜力**:

- 现有能力: 基础设施、配置管理、插件系统
- 扩展方向: 事件系统、实时通信、审计日志框架

## 🎯 质量标准

### 测试覆盖率要求

- **@linch-kit/core**: > 90%
- **其他核心包**: > 80%
- **extensions/console**: > 80%

### 性能指标

- **构建时间**: < 10秒
- **包大小**: 最小化bundle size
- **运行时性能**: 无内存泄漏，高效执行

### 文档要求

- **JSDoc注释**: 所有公共API
- **使用示例**: 每个主要功能
- **迁移指南**: 版本升级指导
