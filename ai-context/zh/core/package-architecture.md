# Linch Kit 包架构设计

**最后更新**: 2025-06-21
**文档版本**: v3.1 (架构信息更新)
**原始来源**: `packages/core.md`, `packages/schema.md`, `architecture/system-architecture.md` (包架构部分), `architecture/technical-decisions.md`
**维护责任**: 架构团队
**更新内容**: UI 包架构统一、插件系统澄清、国际化要求补充

---

## 📦 包层次结构与依赖关系

### 核心包依赖图
```
@linch-kit/types (基础类型)
    ↓
@linch-kit/core (CLI + 配置 + 工具 + i18n)
    ↓
@linch-kit/schema (数据模式系统) ✅ 已发布
    ↓
@linch-kit/auth (认证和权限) ✅ 完成
    ↓
@linch-kit/crud (CRUD 操作核心) ✅ 完成
    ↓
@linch-kit/trpc (API 层集成) ✅ 完成
    ↓
@linch-kit/ui (完整 UI 组件库) ✅ 完成
    ├── 基础 UI 组件 (shadcn/ui)
    ├── CRUD UI 组件 (DataTable, FormBuilder 等)
    └── 认证 UI 组件 (LoginForm, AuthGuard 等)
```

### 包职责分工

#### 1. @linch-kit/types
- **状态**: ✅ 完成
- **职责**: 共享 TypeScript 类型定义
- **依赖**: 无
- **提供**: 基础类型、接口定义、通用工具类型

#### 2. @linch-kit/core
- **状态**: ✅ 核心功能完成
- **职责**: CLI 系统、配置管理、基础工具、国际化
- **依赖**: types
- **提供**:
  - 统一的命令行工具和插件化命令扩展
  - 配置文件系统和环境变量集成
  - CLI 插件发现、加载和生命周期管理
  - 统一的国际化 (i18n) 系统和工具
  - 常用工具函数库和日志系统

#### 3. @linch-kit/schema ✅ 已发布到 npm
- **状态**: ✅ 已发布 (v0.1.0)
- **职责**: 数据模式定义和代码生成
- **依赖**: core, types
- **提供**:
  - 基于 Zod 的类型安全实体定义
  - 装饰器支持 (primary, unique, createdAt, updatedAt, softDelete)
  - Prisma Schema、TypeScript 类型、验证器、Mock 数据生成
  - CLI 集成 (`schema:list`, `schema:generate:prisma` 等)

#### 4. @linch-kit/auth
- **状态**: ✅ 重构完成
- **职责**: 认证和权限管理
- **依赖**: core, schema, types
- **提供**:
  - 模块化权限系统 (RBAC/ABAC)
  - 多种认证提供商支持
  - JWT 会话管理和多租户支持
  - 企业级权限管理和国际化支持

#### 5. @linch-kit/crud
- **状态**: ✅ 核心完成
- **职责**: CRUD 操作核心逻辑
- **依赖**: auth, schema, core, types
- **提供**:
  - CRUDManager 类 (链式 API + 事件系统)
  - 基础、批量、高级 CRUD 操作
  - 操作级、字段级、行级权限集成
  - Schema 集成和自动配置生成

#### 6. @linch-kit/trpc
- **状态**: ✅ 集成完成
- **职责**: tRPC 集成和类型安全 API
- **依赖**: crud, auth, schema, core, types
- **提供**:
  - tRPC 路由生成器和中间件
  - 类型安全的客户端-服务端通信
  - Next.js App Router 兼容的 API 路由
  - 认证上下文管理

#### 7. @linch-kit/ui
- **状态**: ✅ 完整实现
- **职责**: 完整的 UI 组件库 (包含基础、CRUD、认证组件)
- **依赖**: types, core (i18n)
- **提供**:
  - **基础组件**: 基于 shadcn/ui 的完整组件库 (Button, Input, Card, Dialog 等)
  - **CRUD 组件**: DataTable, FormBuilder, SearchableSelect, Schema 驱动组件
  - **认证组件**: LoginForm, RegisterForm, AuthGuard, UserProfile 等
  - **布局组件**: DashboardLayout, 响应式布局系统
  - **主题系统**: 深色/浅色主题支持，完整的设计系统
  - **国际化支持**: 内置多语言支持，使用 @linch-kit/core 的 i18n 系统
  - **TypeScript 支持**: 完整的类型定义和类型安全

## 🏗️ 架构设计原则

### 1. Schema 驱动架构
```
Zod Schema 定义 (单一数据源)
    ↓
自动生成 Prisma Schema
    ↓
自动生成验证器 (create/update/response/query)
    ↓
自动生成 Mock 数据和 OpenAPI 文档
    ↓
自动生成 tRPC 路由和 CRUD UI 组件
```

### 2. 插件系统架构
采用双层插件架构：

#### CLI 插件系统 ✅ 已实现
- **职责**: 命令行工具和开发时扩展
- **实现状态**: 完整实现，支持插件发现、加载、注册
- **通信机制**:
  - 命令注册器 (CommandRegistry)
  - 配置合并器 (Config Merger)
  - 插件发现机制 (PluginLoader)
- **支持的插件**: @linch-kit/schema, @linch-kit/auth 等
- **插件位置**: 自动扫描 node_modules/@linch-kit/*, packages/*, plugins/* 等

#### 运行时插件系统 📋 规划中
- **职责**: 应用运行时的业务模块和功能扩展
- **规划功能**:
  - 业务功能模块 (产品管理、CRM、WMS、财务等)
  - 可选功能扩展和第三方集成
- **计划通信机制**:
  - 模块注册器、服务依赖注入
  - 事件总线系统、钩子系统、中间件机制

**重要说明**: 产品管理功能将作为独立插件模块在插件系统(@linch-kit/plugin)完成后实现，不在当前核心包开发范围内。

### 3. 权限集成数据流
```
用户请求
    ↓
认证中间件 (JWT 验证)
    ↓
权限检查 (操作级/字段级/行级)
    ↓
CRUD 操作执行
    ↓
数据过滤和脱敏
    ↓
响应返回
```

## 🔑 关键架构决策 (ADR)

### ADR-001: Monorepo 架构选择
**决策日期**: 2024-12-15  
**状态**: ✅ 已确认

**决策**: 采用 Turborepo + pnpm 的 Monorepo 架构

**决策理由**:
- ✅ 代码共享和复用效率高
- ✅ 统一的构建和发布流程
- ✅ 依赖管理简化
- ✅ 开发体验一致

### ADR-002: Schema-First 设计
**决策日期**: 2024-12-15  
**状态**: ✅ 已确认

**决策**: 以 Zod Schema 为单一数据源

**决策理由**:
- ✅ 减少重复定义，提高开发效率
- ✅ 类型安全和自动化代码生成
- ✅ 支持模块化 Schema 合并

### ADR-003: 不重复造轮子原则
**决策日期**: 2024-12-16  
**状态**: ✅ 最高优先级

**决策**: 优先使用现有成熟方案

**实施示例**:
- ✅ 使用 Prisma 事务系统而非自研
- ✅ 使用 shadcn/ui 而非完全自研 UI 组件库
- ✅ 通过适配器模式集成现有优秀工具

## 🔧 技术栈集成

**完整的技术栈信息请查看**: **[项目核心要点](./project-essentials.md#技术架构概览)**

### 包间技术栈集成关系
```
@linch-kit/ui (shadcn/ui + CRUD + Auth 组件)
    ↓
@linch-kit/trpc (tRPC 集成)
    ↓
@linch-kit/crud + @linch-kit/auth (业务逻辑)
    ↓
@linch-kit/schema (Zod + Prisma 生成)
    ↓
@linch-kit/core (CLI + 配置 + 基础设施)
    ↓
@linch-kit/types (共享类型定义)
```

## 📊 包开发状态总览

| 包名 | 状态 | 版本 | 发布状态 | 主要功能 |
|------|------|------|----------|----------|
| types | ✅ 完成 | - | 内部 | 基础类型定义 |
| core | ✅ 完成 | - | 待发布 | CLI、配置、插件系统、i18n |
| schema | ✅ 完成 | 0.1.0 | 已发布 | 数据模式和代码生成 |
| auth | ✅ 完成 | - | 待发布 | 认证和权限管理 |
| crud | ✅ 完成 | - | 待发布 | CRUD 操作核心 |
| trpc | ✅ 完成 | - | 待发布 | tRPC 集成 |
| ui | ✅ 完成 | - | 待发布 | 完整 UI 组件库 (基础+CRUD+认证) |

**注意**: 原计划的独立 `crud-ui` 和 `auth-ui` 包已整合到 `@linch-kit/ui` 包中，作为该包的子模块实现。

## 🔗 相关文档导航

- [项目核心要点](./project-essentials.md) - 项目概览和技术栈
- [代码位置索引](./code-locations.md) - 快速定位关键文件
- [开发规范](../standards/development-standards.md) - 必须遵循的开发标准
- [当前进度](../tasks/current-progress.md) - 最新开发状态

---

**重要提醒**: 本文档描述了 Linch Kit 的完整包架构设计。所有包的开发都必须严格遵循这里定义的依赖关系和职责分工。
