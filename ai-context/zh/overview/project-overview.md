# Linch Kit 项目总览

## 🎯 项目定位

Linch Kit 是一个 **AI-First 快速开发框架 + AI-First 企业级应用**，专注于智能化企业级管理系统开发：

### 🤖 AI-First 核心特色
- **AI 理解优先**: 所有代码、配置、文档都便于 AI 理解和处理
- **智能开发体验**: AI 辅助代码生成、配置管理、错误诊断
- **自动化工具链**: AI 驱动的构建、测试、部署流程

### 🚀 快速开发框架
- **模块化架构**: 基于 Odoo 理念的业务模块系统，支持灵活组合
- **运行时插件**: 业务模块和功能插件统一管理，支持热插拔
- **Schema 驱动**: 使用 Zod 作为单一数据源，自动生成 Prisma、验证器、Mock 数据
- **动态扩展**: CLI 和配置系统支持其他包动态注册命令和配置
- **跨模块事务**: 支持分布式事务管理，确保数据一致性

### 🏢 企业级应用
- **开箱即用**: 内置权限、工作流、任务调度等企业功能
- **模块组合**: 按需启用业务模块，形成不同的应用组合
- **可扩展性**: 支持大规模团队和复杂业务场景
- **最佳实践**: 集成企业级开发和部署最佳实践

## 🏗️ 技术架构

### 核心技术栈
- **前端**: Next.js + React + TypeScript + Tailwind CSS
- **UI 组件**: shadcn/ui (基于 Radix UI) + 自研 CRUD 组件
- **API 层**: tRPC + Next.js API Routes
- **数据层**: Prisma ORM + PostgreSQL (支持多种数据库)
- **认证**: NextAuth.js (模块化权限系统)
- **构建工具**: Turborepo + pnpm
- **Schema**: Zod (类型安全的数据验证)
- **插件系统**: 运行时模块加载和管理

### Monorepo 结构
```
linch-kit/
├── apps/
│   ├── starter/             # 应用启动器 (Next.js)
│   └── docs/                # 文档站点 (规划中)
├── packages/
│   ├── core/                # 核心基础设施 (CLI、配置、工具)
│   ├── plugin-system/       # 运行时插件系统 (规划中)
│   ├── schema/              # Schema 系统 ✅ 已发布
│   ├── auth-core/           # 认证核心 (重构中)
│   ├── trpc/                # tRPC 集成 (独立包)
│   ├── ui/                  # UI 组件库
│   ├── crud/                # 通用 CRUD 视图 (规划中)
│   └── types/               # 共享类型定义
├── modules/                 # 业务模块 (规划中)
│   ├── module-wms/          # 仓储管理模块
│   ├── module-crm/          # 客户关系管理模块
│   └── module-hr/           # 人力资源模块
└── plugins/                 # 功能插件 (规划中)
    ├── plugin-wms-barcode/  # WMS 条码扫描插件
    ├── plugin-multi-tenant/ # 多租户插件
    └── plugin-workflow/     # 工作流插件
```

## 🎯 核心价值主张

### 对开发者
- **快速启动**: 几分钟内搭建完整的管理系统
- **类型安全**: 端到端 TypeScript 支持
- **最佳实践**: 内置企业级开发模式
- **可扩展**: 插件化架构支持业务扩展

### 对企业
- **降低成本**: 减少重复开发工作
- **提高效率**: 标准化的开发流程
- **易于维护**: 清晰的架构和文档
- **业务聚焦**: 专注业务逻辑而非基础设施

## 🔮 未来愿景

1. **成为企业级管理系统的首选框架**
2. **建立丰富的插件生态系统**
3. **支持跨框架使用 (Vue/React)**
4. **提供 SaaS 化的插件市场**

## 📊 项目指标

- **包数量**: 7 个核心包 (core, schema, auth-core, types, ui, trpc, crud)
- **开发进度**:
  - ✅ Schema 系统 100% 完成并发布
  - ✅ Core 基础设施 95% 完成
  - ✅ Auth-core 重构 90% 完成
  - 🔄 Starter 验证进行中
  - 🔄 tRPC 包开发中
- **文档覆盖**: 核心功能已有完整文档和 AI 上下文
- **测试覆盖**: 待完善 (下一阶段重点)
- **发布状态**: @linch-kit/schema 已发布到 npm
- **架构决策**: 插件系统、CLI 统一、配置管理等关键决策已确定

---

**相关文档**:
- [快速开始指南](./quick-start.md)
- [系统架构详解](../architecture/system-architecture.md)
- [当前开发进度](../management/current-progress.md)
