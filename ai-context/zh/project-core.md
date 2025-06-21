# LinchKit 项目核心信息

## 🎯 项目定位

**LinchKit = AI-First 快速开发框架 + 企业级管理系统**

### 核心特色
- **AI-First**: 代码、配置、文档都便于 AI 理解和处理
- **Schema 驱动**: Zod 作为单一数据源，自动生成 Prisma/验证器/Mock
- **插件化**: 运行时模块加载，支持业务模块热插拔
- **企业级**: 内置权限、工作流、多租户等企业功能

## 🏗️ 技术架构

### 核心技术栈
```
前端: Next.js 15 + React 19 + TypeScript + Tailwind CSS 4.0
UI: shadcn/ui + TanStack Table + React Hook Form + Zod
API: tRPC + Next.js API Routes
数据: Prisma ORM + PostgreSQL
认证: NextAuth.js + 自研权限系统
构建: Turborepo + pnpm + tsup
国际化: @linch-kit/core 统一 i18n 架构
```

### Monorepo 结构
```
linch-kit/
├── apps/
│   └── linch-starter/           # Next.js 应用启动器
├── packages/
│   ├── core/                    # CLI + 配置 + 统一 i18n
│   ├── schema/                  # Zod Schema 系统
│   ├── auth/                    # 认证核心 (原 auth-core)
│   ├── ui/                      # React 组件库 + CRUD 组件
│   ├── trpc/                    # tRPC 集成
│   ├── crud/                    # CRUD 操作核心
│   └── types/                   # 共享类型定义
└── scripts/                     # TypeScript 构建脚本
```

## 📦 包状态和功能

### ✅ 已完成包
- **@linch-kit/core**: CLI 系统 + 配置管理 + 统一 i18n 架构
- **@linch-kit/schema**: Zod Schema 驱动开发 + Prisma 生成
- **@linch-kit/auth**: 认证核心 + 权限系统 + 多租户支持
- **@linch-kit/ui**: React 组件库 + DataTable + FormBuilder + shadcn/ui
- **@linch-kit/types**: 共享 TypeScript 类型定义

### 🔄 开发中包
- **@linch-kit/trpc**: tRPC 集成工具
- **@linch-kit/crud**: CRUD 操作核心逻辑

## 🔒 安全架构 (2025-06-21 完成)

### 统一国际化
- **@linch-kit/core** 提供统一 i18n 系统
- 所有包使用 `createPackageI18n()` 模式
- 组件接受调用方传入的翻译函数
- 禁止包内自定义 i18n 实现

### 敏感信息保护
- 移除所有硬编码敏感信息
- 强制使用环境变量
- pre-commit hook 自动检查
- `.env.example` 模板文件

## 🎯 核心价值

### 开发者体验
- **快速启动**: 几分钟搭建完整管理系统
- **类型安全**: 端到端 TypeScript 支持
- **AI 友好**: 所有代码便于 AI 理解和生成

### 企业应用
- **模块化**: 按需启用业务模块
- **可扩展**: 支持大规模团队和复杂业务
- **最佳实践**: 集成企业级开发模式

## 📊 项目指标

- **包数量**: 7 个核心包
- **开发进度**: 核心功能 95% 完成
- **文档覆盖**: 核心功能完整文档
- **发布状态**: @linch-kit/schema 已发布到 npm
- **架构稳定性**: 关键决策已确定

## 🔮 技术决策

### 已确定决策
- **插件系统**: 运行时模块加载
- **CLI 统一**: 冒号分隔命令格式
- **配置管理**: 动态注册机制
- **UI 架构**: 单一 @linch-kit/ui 包
- **国际化**: 统一 i18n 架构
- **安全**: 环境变量 + 自动检查

### 待决策项
- 插件市场和生态系统
- 跨框架支持 (Vue/React)
- SaaS 化部署方案

---

**最后更新**: 2025-06-21
**维护原则**: 仅记录核心信息，具体实现查看代码
