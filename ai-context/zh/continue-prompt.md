# LinchKit 继续开发提示词

**复制以下内容给 AI 助手即可继续开发**

---

你是 LinchKit 项目的开发助手。LinchKit 是一个 AI-First 的快速开发框架，专为企业级管理系统设计。

## 项目状态 (2025-06-21)

### 已完成
- ✅ 安全架构重构 (移除硬编码敏感信息 + pre-commit 检查)
- ✅ 统一国际化架构 (@linch-kit/core 统一 i18n 系统)
- ✅ 包重命名 (@linch-kit/auth-core → @linch-kit/auth)
- ✅ UI 组件优化 (DataTable 第三方组件封装策略)
- ✅ 脚本 TypeScript 化

### 当前任务 (P0)
**Schema 驱动的深度集成** - 实现 Schema 到 UI 的自动化生成

子任务:
1. Schema 驱动的高级筛选 (基于字段类型自动生成筛选组件)
2. Schema 驱动的表单生成 (FormBuilder 支持 Schema 自动生成)
3. 类型安全和验证 (端到端类型安全保障)

## 技术栈
- 前端: Next.js 15 + React 19 + TypeScript + Tailwind CSS 4.0
- UI: shadcn/ui + TanStack Table + React Hook Form + Zod
- API: tRPC + Next.js API Routes
- 数据: Prisma ORM + PostgreSQL
- 构建: Turborepo + pnpm + tsup
- 国际化: @linch-kit/core 统一 i18n 架构

## 核心包状态
- @linch-kit/core (95%) - CLI + 配置 + 统一 i18n ✅
- @linch-kit/schema (100%) - Zod Schema 驱动 ✅
- @linch-kit/auth (90%) - 认证核心 + 权限系统 ✅
- @linch-kit/ui (85%) - React 组件库 + CRUD 组件 ✅
- @linch-kit/trpc (70%) - tRPC 集成工具 🔄
- @linch-kit/crud (80%) - CRUD 操作核心 🔄

## 开发规范 (强制)
1. **Context7 MCP 优先**: 使用第三方库前必须查询最新文档
2. **MCP Interactive Feedback**: 每个阶段必须调用获取用户反馈
3. **统一 i18n**: 使用 @linch-kit/core 的 createPackageI18n 模式
4. **安全检查**: 禁止硬编码敏感信息，使用环境变量
5. **包管理**: 使用 pnpm，添加 PATH 前缀: `export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"`

## 开发流程
1. 使用 `codebase-retrieval` 了解当前状态
2. 制定详细计划，列出需要修改的文件
3. 使用 `str-replace-editor` 进行编辑
4. 运行验证: `pnpm type-check && pnpm lint && pnpm build`
5. 调用 `mcp-feedback-enhanced` 获取反馈
6. 完成后更新本文档

## 快速启动
```bash
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm install
pnpm build:packages
pnpm dev
```

## 关键文件位置
- 项目根目录: `/home/laofahai/workspace/linch-kit`
- AI 上下文: `ai-context/` (项目信息、规范、任务)
- 核心包: `packages/core/src/` (CLI + 配置 + i18n)
- UI 组件: `packages/ui/src/components/` (DataTable 等)
- Schema 系统: `packages/schema/src/` (Zod Schema 驱动)
- 示例应用: `apps/linch-starter/` (验证功能)

请基于当前任务继续开发，遵循开发规范，确保代码质量。
