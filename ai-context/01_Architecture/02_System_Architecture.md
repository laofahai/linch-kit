# LinchKit 系统架构概览

**项目版本**: v2.0.3 - 最终架构确认  
**更新**: 2025-07-14  
**状态**: 基于实际代码分析和Gemini架构协商的最终确认版本

## 🏗️ 核心架构原则

> 详细的设计哲学和原则请参考 [核心设计原则](./01_Core_Principles.md) 和 [完整架构设计](./04_Complete_Architecture.md)

### 最终架构分层 ✅ 已验证

> 详细的包依赖关系和约束请参考 [包架构设计](./03_Package_Architecture.md)

```
🏗️ LinchKit 最终架构 (基于实际分析)
├── apps/starter/        # 🎯 轻量级宿主容器
├── extensions/console/  # ⭐ 企业功能库 v2.0.3
└── packages/*          # ✅ 完整基础设施
    ├── @linch-kit/core      # ExtensionManager + 核心功能
    ├── @linch-kit/platform  # PlatformManager + 业务支持
    ├── @linch-kit/auth      # NextAuth.js 集成
    └── @linch-kit/ui        # shadcn/ui 组件库
```

## 🎯 最终三层架构设计 (基于分析确认)

### 宿主容器层 (Host Container) ✅

```
apps/starter/       # 轻量级宿主容器 - 通过StarterIntegrationManager集成extensions
```

**✅ 宿主容器特点** (已验证):

- **运行环境**: 提供Next.js运行环境和基础设施 ✅
- **扩展集成**: 通过StarterIntegrationManager无缝集成console ✅
- **路由代理**: 为扩展提供路由和导航支持 ✅
- **渐进架构**: 从空shell到完整企业应用的平滑演进 ✅

### 功能库层 (Feature Libraries) ✅

> 详细的Extension系统设计和架构请参考 [Extension系统](./10_Extension_System.md)

```
extensions/console/  # ⭐ 企业级管理功能库 v2.0.3 (成熟完整)
extensions/blog-extension/  # 博客功能扩展
extensions/example-counter/ # 示例计数器
```

**✅ 功能库特点** (已验证):

- **成熟功能库**: Console v2.0.3提供完整的企业管理功能 ✅
- **专门集成**: StarterIntegrationManager专门处理与starter的集成 ✅
- **完整特性**: Dashboard、TenantManager、ExtensionManager等 ✅
- **需要宿主**: 明确定位为功能库，需要宿主应用 ✅

### 基础设施层 (Infrastructure Packages) ✅

```
@linch-kit/core/     # 扩展引擎 + 核心功能 (ExtensionManager)
@linch-kit/platform/ # 业务平台支持 (PlatformManager + DashboardLayout)
@linch-kit/auth/     # 认证授权系统 (NextAuth.js深度集成)
@linch-kit/ui/       # 企业级组件库 (shadcn/ui完整集成)
```

**✅ 基础设施特点** (已验证):

- **完整基础设施**: packages/*已形成完整的基础设施层 ✅
- **扩展引擎**: @linch-kit/core提供ExtensionManager等完整扩展系统 ✅
- **成熟集成**: NextAuth.js、shadcn/ui等成熟技术栈深度集成 ✅
- **类型安全**: 完整的 TypeScript 严格模式支持 ✅

### 基础设施层 (Infrastructure)

```
数据库: PostgreSQL + Prisma
认证: NextAuth.js 5.0
权限: CASL (能力访问控制)
UI: Tailwind CSS 4 + shadcn/ui
AI: Neo4j 知识图谱 + Graph RAG
```

## 📦 核心包详细架构 (基于实际代码验证)

### ✅ @linch-kit/core (扩展引擎 + 基础设施)

**实际职责**: 扩展系统 + 基础设施 (已验证实现)

**已验证核心功能**:

- **扩展引擎**: ExtensionManager - 完整的扩展加载和管理 ✅
- **扩展上下文**: ExtensionContext - 扩展运行环境 ✅
- **扩展注册**: ExtensionRegistry - 扩展注册和发现 ✅
- **日志系统**: Logger - 结构化日志记录 ✅
- **配置管理**: ConfigManager - 统一配置管理 ✅
- **国际化**: i18n系统 - 多语言支持 ✅

```typescript
// 已验证导出 (packages/core/src/index.ts)
export * from './extension'
export { ExtensionRegistry } from './extension'
export { ConfigManager } from './config'
export { Logger } from './logger'
export { i18n } from './i18n'
```

### L1: @linch-kit/schema (Schema引擎)

**职责**: Schema 定义、验证和类型生成

**核心功能**:

- **实体定义**: `defineEntity()` API
- **关系定义**: 实体间关系建模
- **类型生成**: 自动生成 TypeScript 类型
- **验证规则**: Zod 验证集成
- **数据库集成**: Prisma Schema 生成

```typescript
// 使用示例
import { defineEntity } from '@linch-kit/schema'

export const UserSchema = defineEntity('User', {
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
})
```

### L2: @linch-kit/auth (认证权限)

**职责**: 用户认证和权限管理

**核心功能**:

- **认证集成**: NextAuth.js 5.0 集成
- **权限控制**: CASL 能力访问控制
- **会话管理**: 类型安全的会话处理
- **多租户**: 租户级别的权限隔离
- **角色管理**: RBAC 角色权限模型

```typescript
// 使用示例
import { requireAuth, can } from '@linch-kit/auth'

const user = await requireAuth(request)
if (can(user, 'read', 'User')) {
  // 用户有读取用户的权限
}
```

### L2: @linch-kit/crud (CRUD操作)

**职责**: 通用的增删改查操作

**核心功能**:

- **类型安全 CRUD**: 基于 Schema 的 CRUD 操作
- **权限集成**: 与 @linch-kit/auth 深度集成
- **查询构建**: 类型安全的查询 API
- **数据验证**: 自动数据验证和清理
- **关系处理**: 复杂关系的 CRUD 支持

```typescript
// 使用示例
import { createCRUD } from '@linch-kit/crud'

const userCRUD = createCRUD(UserSchema)
const user = await userCRUD.create({ name: 'John', email: 'john@example.com' })
```

### L3: @linch-kit/trpc (API层)

**职责**: 端到端类型安全的 API

**核心功能**:

- **tRPC 集成**: 完整的 tRPC 服务器和客户端
- **类型安全**: 编译时类型检查
- **中间件系统**: 认证、权限、日志中间件
- **错误处理**: 统一的错误处理机制
- **API 生成**: 基于 Schema 自动生成 API

```typescript
// 使用示例
import { createRouter } from '@linch-kit/trpc'

export const userRouter = createRouter().query('getUser', {
  input: z.string(),
  resolve: async ({ input, ctx }) => {
    return await ctx.db.user.findUnique({ where: { id: input } })
  },
})
```

### L3: @linch-kit/ui (UI组件)

**职责**: 可复用的 UI 组件库

**核心功能**:

- **shadcn/ui 集成**: 现代 UI 组件库
- **主题系统**: Tailwind CSS 4 主题支持
- **表单组件**: 基于 Schema 的表单生成
- **数据展示**: 表格、列表等数据组件
- **企业组件**: 复杂的企业级 UI 组件

```typescript
// 使用示例
import { Button, Form, DataTable } from '@linch-kit/ui'

<Form schema={UserSchema} onSubmit={handleSubmit} />
<DataTable data={users} columns={userColumns} />
```

### L4: extensions/console (管理平台)

**职责**: 企业级管理控制台

**核心功能**:

- **多租户管理**: 租户创建、配置、监控
- **用户权限管理**: 用户、角色、权限管理界面
- **系统监控**: 系统状态、性能监控
- **审计日志**: 操作日志查看和分析
- **可嵌入设计**: 可以被应用层集成

## 🔄 数据流架构

### 请求处理流程

```
用户请求 → Next.js Router → tRPC Handler → 权限检查 → CRUD 操作 → 数据库
                ↑              ↑           ↑         ↑          ↑
            @linch-kit/ui  @linch-kit/trpc  @linch-kit/auth  @linch-kit/crud  @linch-kit/core
```

### Schema 驱动流程

```
Schema 定义 → 类型生成 → API 生成 → 表单生成 → 验证规则
     ↑          ↑         ↑         ↑         ↑
@linch-kit/schema → @linch-kit/trpc → @linch-kit/ui → 运行时验证
```

## 🧠 AI 集成架构

### Neo4j 知识图谱

```
代码库扫描 → AST 分析 → 图谱构建 → 关系分析 → AI 查询接口
    ↑          ↑         ↑         ↑         ↑
  源代码    语法树   Neo4j 数据库  Graph RAG  AI Session 工具
```

**图谱 Schema**:

- **节点类型**: Package, Function, Class, Interface, Schema
- **关系类型**: CALLS, EXTENDS, IMPLEMENTS, IMPORTS, DEPENDS_ON
- **数据状态**: 5,446+ 节点，7,969+ 关系

### AI Session 工具集成

```
bun run ai:session → 意图识别 → 图谱查询 → 上下文生成 → AI 响应
        ↑              ↑         ↑         ↑         ↑
   命令行接口      NLP 处理   Neo4j 查询   结构化数据   智能建议
```

## 🎯 架构扩展原则

### 水平扩展 (同层扩展)

- **新包**: 在同一层级添加新的包 (如 @linch-kit/analytics)
- **新模块**: 在模块层添加新的业务模块
- **新应用**: 创建新的应用集成现有功能

### 垂直扩展 (功能增强)

- **包内扩展**: 在现有包内增加新功能
- **配置驱动**: 通过配置启用新特性
- **插件机制**: 通过插件系统扩展功能

### 扩展约束

- ✅ **遵循依赖方向**: 新功能不能违反依赖层次
- ✅ **保持职责边界**: 功能添加要符合包的职责定义
- ✅ **向后兼容**: 新功能不能破坏现有 API
- ❌ **禁止循环依赖**: 绝不允许引入循环依赖

## 📊 架构健康指标

### 代码质量指标

- **测试覆盖率**: core >95%, 其他 >80%
- **类型覆盖率**: 100% TypeScript 严格模式
- **构建时间**: 全量构建 <10秒
- **包大小**: 核心包 <50KB gzipped

### 依赖健康指标

- **依赖深度**: 最大依赖层级 ≤4
- **循环依赖**: 0个循环依赖
- **外部依赖**: 最小化第三方依赖
- **安全漏洞**: 0个高危漏洞

### 性能指标

- **API 响应时间**: 平均 <200ms
- **首屏加载**: <3秒
- **构建缓存命中率**: >80%
- **热重载时间**: <1秒

---

## 📋 最终架构确认总结

### ✅ 架构分析验证完成

通过对实际代码的完整分析和Gemini专家协商，最终确认LinchKit v9.0架构：

**三层架构模式**: Host-Container模式，职责边界清晰

1. **apps/starter = 轻量级宿主容器**
   - 提供Next.js运行环境和基础设施 ✅
   - 通过StarterIntegrationManager集成console ✅
   - 渐进式架构：从空shell到企业应用 ✅

2. **extensions/console = 企业功能库 v2.0.3**
   - 成熟的企业级管理功能实现 ✅
   - StarterIntegrationManager专门处理集成 ✅
   - 需要宿主应用，不是独立应用 ✅

3. **packages/* = 完整基础设施层**
   - @linch-kit/core: ExtensionManager + 核心功能 ✅
   - @linch-kit/platform: PlatformManager + 业务支持 ✅
   - @linch-kit/auth: NextAuth.js完整集成 ✅
   - @linch-kit/ui: shadcn/ui企业级组件库 ✅

### 🎯 关键架构原则

- **职责边界清晰**: starter=宿主容器, console=功能库, packages=基础设施
- **Host-Container模式**: 避免职责倒置，星状依赖关系
- **基于现有实现**: 架构设计基于实际代码验证，不是理论设计
- **成熟技术栈**: NextAuth.js、shadcn/ui、ExtensionManager等成熟实现

**核心原则**: 这个架构是基于实际代码分析确认的最终版本，所有开发活动都应该遵循这个架构设计进行。
