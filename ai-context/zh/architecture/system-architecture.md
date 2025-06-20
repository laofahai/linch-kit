# 系统架构详解

## 🏗️ 整体架构概览

Linch Kit 采用模块化、插件化的架构设计，基于 Odoo 理念构建企业级快速开发框架。

### 架构原则
- **AI-First**: 所有组件都便于 AI 理解和处理
- **模块化**: 功能按包分离，支持独立开发和部署
- **插件化**: 支持运行时插件加载和扩展
- **类型安全**: 端到端 TypeScript 支持
- **Schema 驱动**: 使用 Zod 作为单一数据源

## 📦 包架构设计

### 核心包层次结构

```
@linch-kit/types (基础类型)
    ↓
@linch-kit/core (CLI + 配置 + 工具)
    ↓
@linch-kit/schema (数据模式系统)
    ↓
@linch-kit/auth-core (认证和权限)
    ↓
@linch-kit/crud (CRUD 操作核心)
    ↓
@linch-kit/trpc (API 层集成)
    ↓
@linch-kit/ui (基础 UI 组件)
    ↓
@linch-kit/crud-ui (CRUD UI 组件)
@linch-kit/auth-ui (认证 UI 组件)
```

### 包职责分工

#### 1. @linch-kit/types
- **职责**: 共享 TypeScript 类型定义
- **依赖**: 无
- **提供**: 基础类型、接口定义

#### 2. @linch-kit/core
- **职责**: CLI 系统、配置管理、基础工具
- **依赖**: types
- **提供**: 命令系统、插件加载、配置管理

#### 3. @linch-kit/schema
- **职责**: 数据模式定义和代码生成
- **依赖**: core, types
- **提供**: Zod 实体定义、Prisma 生成、验证器

#### 4. @linch-kit/auth-core
- **职责**: 认证和权限管理
- **依赖**: core, schema, types
- **提供**: 认证提供商、权限系统、会话管理

#### 5. @linch-kit/crud
- **职责**: CRUD 操作核心逻辑
- **依赖**: auth-core, schema, core, types
- **提供**: CRUDManager、操作抽象、权限集成

#### 6. @linch-kit/trpc
- **职责**: tRPC 集成和类型安全 API
- **依赖**: crud, auth-core, schema, core, types
- **提供**: tRPC 路由生成、中间件、类型安全 API

#### 7. @linch-kit/ui
- **职责**: 基础 UI 组件库
- **依赖**: types
- **提供**: shadcn/ui 组件、主题系统

#### 8. @linch-kit/crud-ui
- **职责**: CRUD 相关 UI 组件
- **依赖**: crud, ui, auth-core, types
- **提供**: 数据表格、表单、列表组件

#### 9. @linch-kit/auth-ui
- **职责**: 认证相关 UI 组件
- **依赖**: auth-core, ui, types
- **提供**: 登录表单、权限门控、用户管理

## 🔧 技术栈集成

### 前端技术栈
```
Next.js 14 (App Router)
    ↓
React 18 + TypeScript
    ↓
Tailwind CSS + shadcn/ui
    ↓
@linch-kit/ui + @linch-kit/crud-ui + @linch-kit/auth-ui
```

### 后端技术栈
```
Next.js API Routes
    ↓
tRPC (@linch-kit/trpc)
    ↓
@linch-kit/crud + @linch-kit/auth-core
    ↓
Prisma ORM (@linch-kit/schema)
    ↓
PostgreSQL / MySQL / SQLite
```

### 开发工具链
```
Turborepo (Monorepo 管理)
    ↓
pnpm (包管理)
    ↓
tsup (构建工具)
    ↓
TypeScript (类型检查)
    ↓
@linch-kit/core (CLI 工具)
```

## 🔌 插件系统架构

### 插件类型
1. **CLI 插件**: 扩展命令行功能
2. **配置插件**: 扩展配置选项
3. **Schema 插件**: 扩展数据模式
4. **认证插件**: 扩展认证提供商
5. **CRUD 插件**: 扩展 CRUD 操作
6. **UI 插件**: 扩展 UI 组件

### 插件加载机制
```
应用启动
    ↓
插件发现 (packages/*/plugins/)
    ↓
依赖解析
    ↓
插件注册
    ↓
扩展点激活
    ↓
运行时可用
```

## 🗄️ 数据流架构

### Schema 驱动的数据流
```
Zod Schema 定义
    ↓
自动生成 Prisma Schema
    ↓
自动生成验证器 (create/update/response/query)
    ↓
自动生成 Mock 数据
    ↓
自动生成 OpenAPI 文档
    ↓
自动生成 tRPC 路由
    ↓
自动生成 CRUD UI 组件
```

### 权限集成数据流
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

## 🔄 事件系统架构

### 事件类型
1. **生命周期事件**: 应用启动、关闭
2. **CRUD 事件**: 创建前/后、更新前/后、删除前/后
3. **认证事件**: 登录、登出、权限变更
4. **插件事件**: 插件加载、卸载、错误

### 事件流
```
事件触发
    ↓
事件总线
    ↓
监听器匹配
    ↓
异步处理
    ↓
结果聚合
    ↓
回调执行
```

## 🏢 企业级特性架构

### 多租户支持
```
租户识别 (域名/子域名/路径)
    ↓
租户上下文注入
    ↓
数据隔离 (Row Level Security)
    ↓
权限隔离 (租户级权限)
    ↓
配置隔离 (租户级配置)
```

### 工作流引擎
```
工作流定义 (BPMN/JSON)
    ↓
流程实例化
    ↓
任务分配
    ↓
状态跟踪
    ↓
审批流程
    ↓
完成回调
```

### 审计日志
```
操作拦截
    ↓
上下文收集 (用户/时间/操作/数据)
    ↓
日志存储 (数据库/文件/外部服务)
    ↓
查询接口
    ↓
报表生成
```

## 🚀 性能优化架构

### 缓存策略
1. **内存缓存**: 热点数据缓存
2. **Redis 缓存**: 分布式缓存
3. **CDN 缓存**: 静态资源缓存
4. **浏览器缓存**: 客户端缓存

### 懒加载策略
1. **代码分割**: 按路由分割
2. **组件懒加载**: 按需加载组件
3. **插件懒加载**: 按需加载插件
4. **数据懒加载**: 分页和虚拟滚动

### 构建优化
1. **Tree Shaking**: 移除未使用代码
2. **Bundle 分析**: 优化包大小
3. **并行构建**: 多包并行构建
4. **增量构建**: 只构建变更部分

## 🔒 安全架构

### 认证安全
1. **JWT 令牌**: 无状态认证
2. **刷新令牌**: 安全令牌更新
3. **多因素认证**: 增强安全性
4. **会话管理**: 安全会话控制

### 权限安全
1. **RBAC**: 基于角色的访问控制
2. **ABAC**: 基于属性的访问控制
3. **字段级权限**: 细粒度权限控制
4. **行级安全**: 数据行级访问控制

### 数据安全
1. **输入验证**: Zod 模式验证
2. **SQL 注入防护**: Prisma ORM 保护
3. **XSS 防护**: 输出转义
4. **CSRF 防护**: 令牌验证

---

**相关文档**:
- [技术栈说明](./tech-stack.md)
- [包依赖关系](./package-dependencies.md)
- [构建系统](./build-system.md)
