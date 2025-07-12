# LinchKit 包 API 参考

**版本**: v8.0  
**更新**: 2025-07-07  
**状态**: 包 API 文档索引和使用指南

## 📦 包概览

LinchKit 采用模块化架构，包含 4 个核心包，每个包都有明确的职责和 API 接口。

### 核心包架构依赖图

```
L0: @linch-kit/core      → 基础设施服务 (日志、配置、插件、Extension系统)
  ↓
L1: @linch-kit/auth      → 认证和权限管理 (NextAuth + CASL)
  ↓
L2: @linch-kit/platform  → 业务开发平台 (Schema+CRUD+tRPC+验证一体化)
  ↓
L3: @linch-kit/ui        → UI 组件和设计系统 (shadcn/ui + 企业组件)
  ↓
Extensions: extensions/console → 企业管理功能Extension
Tools: tools/schema → Schema 引擎工具 (代码生成、验证)
```

## 📚 包文档索引

### L0: 基础设施层

#### [@linch-kit/core](./core.md)

**职责**: 基础设施服务和核心功能

**核心 API**:

- `logger` - 结构化日志系统
- `config` - 类型安全配置管理
- `eventBus` - 事件系统
- `container` - 依赖注入容器
- `plugin` - 插件系统

**使用场景**:

- 应用启动和初始化
- 日志记录和监控
- 配置管理
- 事件处理
- 插件扩展

### L1: 认证层

#### [@linch-kit/auth](./auth.md)

**职责**: 认证、授权和会话管理

**核心 API**:

- `requireAuth()` - 认证中间件
- `can()` - 权限检查
- `AuthProvider` - 认证提供商
- `PermissionChecker` - 权限检查器
- `SessionManager` - 会话管理

**使用场景**:

- 用户登录登出
- 权限控制
- 会话管理
- 多租户支持
- 角色管理

### L2: 业务开发平台

#### [@linch-kit/platform](./platform.md)

**职责**: Schema+CRUD+tRPC+验证一体化业务开发平台

**核心 API**:

- `createPlatformCRUD()` - CRUD 操作创建
- `createPlatformRouter()` - 路由创建
- `defineEntity()` - 实体定义
- `createValidator()` - 验证器创建
- `QueryBuilder` - 查询构建器
- `TransactionManager` - 事务管理

**使用场景**:

- 数据库操作和验证
- API 路由定义
- 数据模型定义
- 关系查询
- 事务处理
- 端到端类型安全

### L3: UI 层

#### [@linch-kit/ui](./ui.md)

**职责**: UI 组件库和设计系统

**核心 API**:

- `Button` - 按钮组件
- `Form` - 表单组件
- `DataTable` - 数据表格
- `ThemeProvider` - 主题提供商
- `useLinchKit` - LinchKit Hook

**使用场景**:

- UI 界面构建
- 表单处理
- 数据展示
- 主题定制
- 响应式设计

### Extensions: 功能扩展

#### extensions/console

**职责**: 企业级管理控制台Extension

**核心功能**:

- 多租户管理
- 用户权限管理
- 系统监控
- 审计日志
- 可嵌入设计

**使用场景**:

- 企业管理后台
- 用户管理
- 权限配置
- 系统监控
- 运营数据分析

### Tools: 开发工具

#### tools/schema

**职责**: Schema 引擎工具 (代码生成、验证)

**核心功能**:

- 实体定义和验证
- TypeScript 类型生成
- Prisma Schema 生成
- 代码生成和转换

**使用场景**:

- 数据模型定义
- 类型安全开发
- 代码生成
- 数据验证

#### tools/cli

**职责**: LinchKit CLI 工具

**核心功能**:

- 项目脚手架
- Extension 管理
- 开发工具

#### tools/context

**职责**: Graph RAG 上下文工具

**核心功能**:

- AI 辅助开发
- 智能查询
- 上下文理解

## 🚀 快速 API 使用指南

### 基础设置

```typescript
// 1. 导入核心包
import { logger, config } from '@linch-kit/core'
import { requireAuth, can } from '@linch-kit/auth'
import { createPlatformCRUD, createPlatformRouter, defineEntity } from '@linch-kit/platform'
import { Button, Form } from '@linch-kit/ui'

// 2. 配置应用
logger.info('Application starting', { version: config.app.version })
```

### 平台驱动开发

```typescript
// 1. 定义实体 (使用 tools/schema 或 @linch-kit/platform)
const UserEntity = defineEntity('User', {
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN'])
})

// 2. 创建平台 CRUD 操作
const userCRUD = createPlatformCRUD(UserEntity)

// 3. 创建平台 API 路由
const userRouter = createPlatformRouter()
  .middleware(requireAuth)
  .query('getUser', {
    input: z.string(),
    resolve: async ({ input, ctx }) => {
      if (!can(ctx.user, 'read', 'User')) {
        throw new Error('Permission denied')
      }
      return await userCRUD.findById(input)
    }
  })

// 4. 生成 UI 表单
const UserForm = () => (
  <Form
    schema={UserEntity.schema}
    onSubmit={async (data) => {
      await userCRUD.create(data)
    }}
  />
)
```

### 权限控制示例

```typescript
// 权限检查
const user = await requireAuth(request)
if (can(user, 'read', 'User')) {
  // 用户有读取权限
}

// 多租户权限
if (can(user, 'manage', 'Tenant', { tenantId: 'specific-tenant' })) {
  // 用户有管理特定租户的权限
}
```

### 事件处理示例

```typescript
// 定义事件
const UserCreatedEvent = defineEvent('user.created', {
  userId: z.string(),
  email: z.string(),
})

// 发送事件
eventBus.emit(UserCreatedEvent, {
  userId: '123',
  email: 'user@example.com',
})

// 监听事件
eventBus.on(UserCreatedEvent, async event => {
  await emailService.sendWelcomeEmail(event.email)
})
```

## 🔍 API 查找指南

### 按功能查找

- **日志记录** → [@linch-kit/core](./core.md#logger)
- **用户认证** → [@linch-kit/auth](./auth.md#authentication)
- **数据操作** → [@linch-kit/platform](./platform.md#crud)
- **API 创建** → [@linch-kit/platform](./platform.md#router)
- **数据验证** → [@linch-kit/platform](./platform.md#validation)
- **UI 组件** → [@linch-kit/ui](./ui.md#components)

### 按使用场景查找

- **创建新实体** → Platform 一体化开发链路
- **权限控制** → Auth 包权限 API
- **表单处理** → UI 表单 + Platform 验证
- **数据查询** → Platform 查询构建器
- **API 开发** → Platform 路由器

### 按包依赖查找

- **基础服务** → @linch-kit/core
- **认证权限** → @linch-kit/auth
- **业务开发** → @linch-kit/platform (一体化)
- **界面开发** → @linch-kit/ui

## 📖 API 文档约定

### 文档结构

每个包的 API 文档都包含：

1. **概述** - 包的职责和核心功能
2. **安装和配置** - 如何安装和配置包
3. **核心 API** - 主要 API 接口和使用方法
4. **类型定义** - TypeScript 类型和接口
5. **使用示例** - 完整的代码示例
6. **最佳实践** - 推荐的使用模式
7. **故障排除** - 常见问题和解决方案

### API 命名约定

- **函数**: camelCase，动词开头 (如 `createUser`)
- **类**: PascalCase (如 `UserManager`)
- **常量**: SCREAMING_SNAKE_CASE (如 `DEFAULT_CONFIG`)
- **类型**: PascalCase，Type 后缀 (如 `UserType`)
- **接口**: PascalCase，Interface 后缀 (如 `UserInterface`)

### 示例代码规范

- 所有示例都使用 TypeScript
- 包含完整的导入语句
- 展示错误处理
- 遵循 LinchKit 代码规范

## 🔗 相关文档

- **[快速启动指南](../../00_Getting_Started/02_Quick_Start.md)** - 开始使用 LinchKit
- **[开发工作流程](../../02_Guides/01_Development_Workflow.md)** - 开发约束和规范
- **[核心设计原则](../../01_Architecture/01_Core_Principles.md)** - 架构设计原则
- **[系统架构](../../01_Architecture/02_System_Architecture.md)** - 完整架构文档

---

**API 文档维护**: 所有 API 变更都会自动更新到对应的包文档中。
