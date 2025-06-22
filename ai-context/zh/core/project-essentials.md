# Linch Kit 项目核心要点

**最后更新**: 2025-06-21
**文档版本**: v3.1 (架构信息更新)
**原始来源**: `overview/project-overview.md`, `overview/quick-start.md`, `architecture/system-architecture.md` (概览部分)
**维护责任**: 项目核心团队
**更新内容**: 技术栈版本验证、包状态同步

---

## 🎯 项目定位与价值

### 核心定位
Linch Kit 是一个 **AI-First 快速开发框架 + AI-First 企业级应用**，专注于智能化企业级管理系统开发。

### 🤖 AI-First 核心特色
- **AI 理解优先**: 所有代码、配置、文档都便于 AI 理解和处理
- **智能开发体验**: AI 辅助代码生成、配置管理、错误诊断
- **自动化工具链**: AI 驱动的构建、测试、部署流程

### 🚀 快速开发框架
- **模块化架构**: 基于 Odoo 理念的业务模块系统，支持灵活组合
- **运行时插件**: 业务模块和功能插件统一管理，支持热插拔
- **Schema 驱动**: 使用 Zod 作为单一数据源，自动生成 Prisma、验证器、Mock 数据
- **动态扩展**: CLI 和配置系统支持其他包动态注册命令和配置

### 🏢 企业级应用
- **开箱即用**: 内置权限、工作流、任务调度等企业功能
- **模块组合**: 按需启用业务模块，形成不同的应用组合
- **可扩展性**: 支持大规模团队和复杂业务场景

## 🏗️ 技术架构概览

### 核心技术栈
- **前端**: Next.js 15.3.4 + React 19.1.0 + TypeScript 5.8.3 + Tailwind CSS 4.1.10
- **UI 组件**: shadcn/ui (基于 Radix UI) + 完整 CRUD 和认证组件
- **API 层**: tRPC 11.3.1 + Next.js API Routes
- **数据层**: Prisma ORM 5.22.0 + PostgreSQL (支持多种数据库)
- **认证**: 自定义认证系统 (模块化权限系统) + NextAuth.js 4.24.5
- **构建工具**: Turborepo 2.5.4 + pnpm 10.12.1
- **Schema**: Zod 3.25.67 (类型安全的数据验证)
- **国际化**: 内置 i18n 系统 (@linch-kit/core)

### Monorepo 结构
```
linch-kit/
├── apps/
│   ├── starter/             # 应用启动器 (Next.js)
│   └── docs/                # 文档站点 (规划中)
├── packages/
│   ├── core/                # 核心基础设施 (CLI、配置、工具)
│   ├── schema/              # Schema 系统 ✅ 已发布
│   ├── auth/                # 认证核心
│   ├── trpc/                # tRPC 集成
│   ├── ui/                  # UI 组件库
│   ├── crud/                # 通用 CRUD 操作
│   └── types/               # 共享类型定义
├── modules/                 # 业务模块 (规划中)
└── plugins/                 # 功能插件 (规划中)
```

### 架构原则
- **AI-First**: 所有组件都便于 AI 理解和处理
- **模块化**: 功能按包分离，支持独立开发和部署
- **插件化**: 支持运行时插件加载和扩展
- **类型安全**: 端到端 TypeScript 支持
- **Schema 驱动**: 使用 Zod 作为单一数据源

## 📊 项目当前状态

### 核心包开发状态
**详细的包状态和依赖关系请查看**: **[包架构设计](./package-architecture.md#包开发状态总览)**

**快速概览**：
- ✅ 所有核心包 (schema, core, auth, crud, trpc, ui, types) 均已完成开发
- ✅ @linch-kit/schema 包已发布到 npm
- ✅ linch-starter 基座应用前端认证集成已完成 (2025-06-20)

### 当前开发重点
- 🔄 **进行中**: AI Context 文档重构优化
- 📋 **下一步**: 全面项目测试和bug修复
- 🎯 **后续规划**: 详见 [任务优先级文档](../tasks/task-priorities.md)

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0 (推荐 20.0.0+)
- pnpm >= 8.0.0 (当前使用 10.12.1)
- Git >= 2.30.0

### 安装和启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd linch-kit

# 2. 安装依赖 (设置 Node.js 环境)
# 如果使用 nvm: export PATH="[nvm node 路径]:$PATH"
pnpm install

# 3. 构建包
pnpm build

# 4. 启动开发服务器
pnpm dev

# 5. 验证 CLI 工具
pnpm linch --help
```

### 核心命令
```bash
# Schema 相关
pnpm linch schema:list          # 列出所有实体
pnpm linch schema:generate:prisma  # 生成 Prisma schema

# 开发相关
pnpm dev                        # 启动开发服务器
pnpm build                      # 构建所有包
pnpm lint                       # 代码检查
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

## 🔮 发展愿景

1. **成为企业级管理系统的首选框架**
2. **建立丰富的插件生态系统**
3. **支持跨框架使用 (Vue/React)**
4. **提供 SaaS 化的插件市场**

## 🔗 相关文档导航

- [包架构设计](./package-architecture.md) - 详细的包结构和依赖关系
- [代码位置索引](./code-locations.md) - 快速定位关键文件
- [开发规范](../standards/development-standards.md) - 必须遵循的开发标准
- [当前进度](../tasks/current-progress.md) - 最新开发状态
- [继续开发](../tasks/continue-prompt.md) - AI 工作流入口

---

**重要提醒**: 本文档整合了项目的核心信息，是理解 Linch Kit 项目的起点。所有开发工作都必须严格遵循 [开发规范](../standards/development-standards.md)。
