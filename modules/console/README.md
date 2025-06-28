# LinchKit Console

企业级管理控制台 - LinchKit 框架的旗舰应用

## 🎯 项目定位

LinchKit Console 是一个完整的企业级管理平台，用于：

- **验证 LinchKit 框架完整功能** - 集成所有 @linch-kit/* 包
- **提供企业级管理能力** - 多租户、权限、监控、插件管理
- **作为生产级 Starter 基础** - 为 apps/starter 提供完整模板

## 🏗️ 架构设计

### 技术栈
- **框架**: Next.js 15 + React 18 + TypeScript
- **UI**: @linch-kit/ui + shadcn/ui + Tailwind CSS
- **API**: @linch-kit/trpc (端到端类型安全)
- **认证**: @linch-kit/auth (NextAuth.js v5)
- **数据**: @linch-kit/schema + @linch-kit/crud + Prisma + PostgreSQL
- **基础设施**: @linch-kit/core (日志、配置、监控、插件)

### LinchKit 包集成
```typescript
import { logger } from '@linch-kit/core'           // 日志系统
import { defineEntity } from '@linch-kit/schema'   // 数据建模
import { authOptions } from '@linch-kit/auth'      // 认证配置
import { createCRUD } from '@linch-kit/crud'       // 数据操作
import { createTRPCRouter } from '@linch-kit/trpc' // API 路由
import { SchemaForm } from '@linch-kit/ui'         // UI 组件
```

## 🚀 核心功能

### 1. 仪表板 (Dashboard)
- 系统概览 - 用户数、租户数、插件数
- 实时监控 - CPU、内存、数据库状态
- 快速操作 - 常用管理功能入口

### 2. 租户管理 (Tenant Management)
- 租户生命周期管理
- 资源配额和计费
- 数据隔离配置

### 3. 用户管理 (User Management)
- 用户 CRUD 操作
- 角色和权限分配
- 用户活动监控

### 4. 权限管理 (Permission Management)
- RBAC/ABAC 权限配置
- 权限策略管理
- 权限审计日志

### 5. 插件市场 (Plugin Marketplace)
- 插件发现和安装
- 插件配置管理
- 插件状态监控

### 6. 系统监控 (System Monitoring)
- 实时性能监控
- 告警和通知
- 系统日志查看

### 7. Schema 管理 (Schema Management)
- 可视化 Schema 设计
- 代码生成和迁移
- 数据模型管理

## 🛠️ 开发指南

### 环境要求
- Node.js >= 20.0.0
- pnpm >= 10.0.0
- PostgreSQL >= 14.0

### 快速开始
```bash
# 安装依赖
pnpm install

# 设置数据库
cp .env.example .env.local
# 编辑 .env.local 配置数据库连接

# 初始化数据库
pnpm db:migrate
pnpm db:seed

# 启动开发服务器
pnpm dev
```

### 开发命令
```bash
pnpm dev          # 开发模式 (端口 3001)
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
pnpm type-check   # TypeScript 类型检查
pnpm db:generate  # 生成 Prisma 客户端
pnpm db:migrate   # 运行数据库迁移
pnpm db:seed      # 填充测试数据
```

## 📊 项目状态

### 开发进度
- [ ] **Phase 1**: 基础架构搭建
- [ ] **Phase 2**: 核心功能开发
- [ ] **Phase 3**: 高级功能实现
- [ ] **Phase 4**: 优化和发布

### 质量标准
- [ ] TypeScript 严格模式，无 any 类型
- [ ] 测试覆盖率 > 80%
- [ ] 构建时间 < 30 秒
- [ ] API 响应时间 < 500ms

## 📚 相关文档

- [架构设计](./docs/architecture.md)
- [API 文档](./docs/api.md)
- [部署指南](./docs/deployment.md)
- [开发约束](../../ai-context/zh/current/development-constraints.md)

## 🔗 相关项目

- **apps/demo-app** - LinchKit 功能演示应用
- **apps/starter** - 基于 Console 的生产级 Starter 包 (计划中)
- **packages/*** - LinchKit 核心包

---

**LinchKit Console 展示了企业级全栈开发框架的完整能力，是 LinchKit 框架的最佳实践示例。**