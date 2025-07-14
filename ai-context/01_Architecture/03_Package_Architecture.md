# LinchKit 包架构设计 v9.0

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
  version: "9.0"
  last_verified: "2025-07-14"
  implementation_status: "production_ready"
  architecture_confirmation: "final_analysis_gemini_validated"

---

## 📦 包架构设计原则 (基于最终分析确认)

### 设计哲学 ✅ 已验证

- **单一职责**: 每个包专注一个核心功能领域
- **最小依赖**: 减少包之间的耦合度
- **类型安全**: 100% TypeScript，严格模式
- **可组合性**: 包可以独立使用或组合使用
- **完整基础设施**: packages/* 已形成完整的基础设施层

### 最终架构分层 (基于实际分析)

```
🏗️ LinchKit 最终架构 (已验证)
├── apps/starter/        # 🎯 轻量级宿主容器
├── extensions/console/  # ⭐ 企业功能库 v2.0.3
└── packages/*          # ✅ 完整基础设施
    ├── @linch-kit/core      # ExtensionManager + 核心功能
    ├── @linch-kit/platform  # PlatformManager + 业务支持
    ├── @linch-kit/auth      # NextAuth.js 集成
    └── @linch-kit/ui        # shadcn/ui 组件库
```

**严格禁止**：循环依赖和逆向依赖

## 🏗️ 包层详细分析 (基于实际代码验证)

### L0: @linch-kit/core ✅ 完整扩展引擎

**实际职责**: 扩展系统 + 基础设施 (已验证实现)

- **扩展引擎**: ExtensionManager - 完整的扩展加载和管理
- **扩展上下文**: ExtensionContext - 扩展运行环境
- **扩展注册**: ExtensionRegistry - 扩展注册和发现
- **配置管理**: ConfigManager - 统一配置读取和管理
- **日志系统**: Logger - 结构化日志记录
- **国际化**: i18n系统 - 多语言支持

**已验证导出** (packages/core/src/index.ts):
```typescript
export * from './extension'
export { ExtensionRegistry } from './extension'
export { ConfigManager } from './config'
export { Logger } from './logger'
export { i18n } from './i18n'
```

### L1: @linch-kit/platform ✅ 业务平台支持

**实际职责**: 平台管理 + 布局系统 (已验证实现)

- **平台管理器**: PlatformManager - 平台级业务逻辑管理
- **仪表板布局**: DashboardLayout - 企业级布局组件
- **布局系统**: Layout组件 - 完整的布局支持
- **平台配置**: Platform配置 - 平台级设置管理

**核心功能**:
```typescript
// Platform管理器
import { PlatformManager } from '@linch-kit/platform'

// 仪表板布局
import { DashboardLayout } from '@linch-kit/platform'
```

### L1.5: tools/schema ✅ Schema工具

**职责**: Schema定义、验证、转换 (工具包)

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

### L2: @linch-kit/auth ✅ 认证授权系统

**实际职责**: 认证、授权、会话管理 (已验证集成NextAuth.js)

- **认证集成**: NextAuth.js 5.0 深度集成 ✅
- **权限引擎**: 基于CASL的RBAC/ABAC系统
- **会话管理**: 安全的会话状态管理
- **中间件**: 权限检查中间件

**已验证特性**:
- ✅ NextAuth.js集成完整
- ✅ 权限系统基础完备
- ✅ 企业级认证流程

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

### L3: @linch-kit/ui ✅ 企业级组件库

**实际职责**: UI组件库 (已验证shadcn/ui集成)

- **基础组件**: 基于shadcn/ui的企业级组件 ✅
- **布局组件**: Sidebar、Header、Main等布局组件
- **业务组件**: 表格、表单、图表等业务组件
- **主题系统**: 统一的主题和样式管理

**已验证特性**:
- ✅ 完整shadcn/ui组件库
- ✅ 企业级组件标准
- ✅ TypeScript类型支持

**组件层次**:
```typescript
// 组合式基础组件
export { Sidebar, Header, Main, SidebarProvider, SidebarTrigger } from './components'

// 预制布局模板
export function VerticalLayout({ sidebar, header, children }) {
  // 布局实现
}
```

### L4: extensions/console ⭐ 成熟功能库 v2.0.3

**最终确认职责**: 企业级管理功能库 (不是应用外壳)

- **功能库定位**: 提供完整的企业管理功能组件 ✅
- **Starter集成**: 通过StarterIntegrationManager专门处理集成 ✅
- **完整特性**: Dashboard、TenantManager、ExtensionManager等 ✅
- **需要宿主**: 明确定位为功能库，需要宿主应用 ✅

**最终架构特点** (基于DESIGN.md分析):
- **功能库**: Console不是独立应用，是npm包被集成使用
- **成熟版本**: v2.0.3，功能完整成熟
- **专门集成**: StarterIntegrationManager处理与starter的集成
- **企业特性**: 多租户、权限控制、插件市场等完整功能

**集成方式** (已实现):
```typescript
// 通过StarterIntegrationManager集成
import { 
  StarterIntegrationManager,
  createStarterIntegrationManager 
} from '@linch-kit/console'

// 在starter中集成console
const integrationManager = createStarterIntegrationManager({
  autoInitialize: true,
  enableHotReload: true,
  defaultExtensions: ['console', 'blog-extension']
})

// 获取集成状态和路由
const state = integrationManager.getState()
const routes = integrationManager.getAllRoutes()
```

### L5: apps/starter 🎯 轻量级宿主容器

**最终确认职责**: 轻量级宿主容器 + 扩展集成能力

- **宿主环境**: 提供Next.js运行环境和基础设施 ✅
- **扩展集成**: 通过StarterIntegrationManager集成console等扩展 ✅
- **渐进架构**: 从空shell到完整企业应用的平滑演进 ✅
- **路由代理**: 为扩展提供路由和导航支持 ✅

**技术栈配置** (轻量化):
- **框架**: Next.js 15.3.4 + React 19 + App Router
- **语言**: TypeScript 5.8.3 (严格模式)
- **基础依赖**: @linch-kit/core + @linch-kit/console
- **包管理**: Bun 1.2.18

**集成模式**:
```typescript
// starter作为轻量宿主容器
import { starterIntegrationManager } from '@linch-kit/console'

// 提供基础路由和Provider包装
export default function StarterApp() {
  return (
    <ExtensionProvider manager={starterIntegrationManager}>
      <DynamicRoutes />
    </ExtensionProvider>
  )
}
```

## 🔒 包功能复用强制要求 (基于现有实现)

### 必须使用LinchKit内部功能

**绝对禁止**重新实现已有功能：

- **扩展系统**: 使用 `@linch-kit/core` ExtensionManager ✅
- **平台管理**: 使用 `@linch-kit/platform` PlatformManager ✅
- **日志系统**: 使用 `@linch-kit/core` logger ✅
- **配置管理**: 使用 `@linch-kit/core` ConfigManager ✅
- **认证授权**: 使用 `@linch-kit/auth` NextAuth.js集成 ✅
- **UI组件**: 使用 `@linch-kit/ui` shadcn/ui组件库 ✅
- **国际化**: 使用 `@linch-kit/core` i18n系统 ✅
- **Console功能**: 使用 `extensions/console` StarterIntegrationManager ✅

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

---

## 📋 最终架构确认总结

### ✅ 架构分析验证完成

通过对实际代码的完整分析和Gemini专家协商，最终确认LinchKit架构：

1. **packages/* = 完整基础设施层**
   - @linch-kit/core: ExtensionManager + 核心功能 ✅
   - @linch-kit/platform: PlatformManager + 业务平台 ✅
   - @linch-kit/auth: NextAuth.js完整集成 ✅
   - @linch-kit/ui: shadcn/ui企业级组件库 ✅

2. **extensions/console = 成熟功能库 v2.0.3**
   - 企业级管理功能的完整实现 ✅
   - StarterIntegrationManager专门处理集成 ✅
   - 需要宿主应用，不是独立应用 ✅

3. **apps/starter = 轻量级宿主容器**
   - 提供Next.js运行环境 ✅
   - 通过StarterIntegrationManager集成console ✅
   - 渐进式架构：从空shell到企业应用 ✅

### 🎯 职责边界清晰

- **starter**: 宿主容器，专注运行环境和扩展集成
- **console**: 功能库，专注企业管理功能实现
- **packages**: 基础设施，专注核心能力和技术支撑

**核心原则**: Host-Container模式，避免职责倒置，基于现有实现构建。
