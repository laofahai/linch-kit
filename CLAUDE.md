# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要说明 (Important Notice)

**当前项目状态**: LinchKit 是一个中文为主的AI-First全栈开发框架项目，所有技术文档集中在 `ai-context/zh/` 目录中。当前的 `packages/*` 和 `apps/*` 需要按照设计文档进行全面重写。

**AI开发指导**: 请直接使用 `ai-context/zh/ai-development-guidelines.md` 中的开发指导方针开始工作。该文档包含完整的开发约束、架构设计和实施计划。

**全包重写策略**: 所有 @linch-kit/* 包需要从零开始重新实现，现有代码仅作为架构参考。严格按照 `ai-context/zh/project/development-plan.md` 执行4阶段8周实施计划。

## Essential Commands

### Development
- `pnpm dev` - Start complete development mode (apps + packages watch)
- `pnpm dev:apps` - Start only application development servers
- `pnpm dev:packages` - Watch and rebuild packages only
- `pnpm setup` - Initialize project configuration and dependencies
- `pnpm validate` - Run full validation workflow (test, build, lint)

### Building
- `pnpm build` - Build all packages and apps
- `pnpm build:packages` - Build only packages (dependency order)
- `pnpm build:apps` - Build only applications
- `pnpm build:watch` - Watch and rebuild packages continuously

### Testing & Quality
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate test coverage reports
- `pnpm check-types` - TypeScript type checking
- `pnpm lint` - Run ESLint on all packages
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Check code formatting with Prettier
- `pnpm format:fix` - Auto-fix formatting issues

### Package Management
- `pnpm linch` - Run the CLI tool (packages/core/dist/cli.js)
- `pnpm clean` - Clean build artifacts and cache
- `pnpm clean:dist` - Remove only dist directories
- `pnpm reset` - Full reset (clean + reinstall dependencies)

## Project Architecture

### LinchKit AI-First 全栈开发框架
LinchKit 是一个企业级AI-First全栈开发框架，采用Schema驱动的代码生成架构，提供端到端类型安全的开发体验。

### 核心设计文档 📚
- **系统架构**: `ai-context/zh/system-design/architecture.md` - 完整的分层架构设计
- **开发约束**: `ai-context/zh/system-design/development-constraints.md` - 强制性技术要求
- **实施计划**: `ai-context/zh/project/development-plan.md` - 4阶段8周重写计划
- **完整指导**: `ai-context/zh/ai-development-guidelines.md` - AI开发助手指导方针

### 6层架构设计 🏗️
```
应用层: apps/starter - 完整功能演示应用
表现层: @linch-kit/ui - Schema驱动UI组件库  
API层: @linch-kit/trpc - 端到端类型安全API
业务层: @linch-kit/crud + @linch-kit/auth - CRUD操作 + 认证权限
数据层: @linch-kit/schema - Schema驱动代码生成
基础层: @linch-kit/core - 插件系统 + 配置管理 + 可观测性
```

### 8个核心包设计 📦
- **@linch-kit/core** (P0) - 插件系统、多租户配置、企业级可观测性
- **@linch-kit/schema** (P0) - Schema驱动架构、代码生成器
- **@linch-kit/auth** (P1) - 多提供商认证、RBAC/ABAC权限控制
- **@linch-kit/crud** (P1) - 类型安全CRUD、权限集成、事务管理
- **@linch-kit/trpc** (P1) - 端到端类型安全API、中间件生态
- **@linch-kit/ui** (P1) - Schema驱动UI、设计系统、国际化
- **@linch-kit/console** (P1) - 企业级管理平台 (商业化产品)
- **@linch-kit/ai** (P2) - 多AI提供商集成、智能缓存

### 技术特色 ⭐
- **AI-First设计**: 为AI理解和处理优化的架构
- **Schema驱动**: 单一Schema定义生成完整CRUD应用
- **企业级特性**: 多租户、可观测性、性能监控、安全审计
- **插件化生态**: 运行时插件系统、可视化插件市场
- **商业化平衡**: 核心开源(MIT) + 企业功能商业化

### 现代化技术栈 🚀
- **前端**: React 19 + Next.js 15 + Tailwind CSS + shadcn/ui
- **后端**: tRPC 11 + Prisma 5 + PostgreSQL + Zod 3
- **工具链**: Turborepo + pnpm + TypeScript 严格模式
- **可观测性**: Prometheus + OpenTelemetry + Pino
- **第三方集成**: 避免重复造轮子，使用成熟生态

## Development Workflow

1. **Setup**: Run `pnpm setup` for initial configuration
2. **Development**: Use `pnpm dev` to start all services in watch mode
3. **Testing**: Run `pnpm validate` before committing changes
4. **Building**: Packages must build before apps (handled by Turborepo)
5. **Type Safety**: Always run `pnpm check-types` after changes

## Important Notes

- **pnpm required**: This project uses pnpm for workspace management
- **Node.js >= 18**: Minimum Node.js version requirement
- **Build dependencies**: Apps depend on packages being built first
- **Changesets**: Use `pnpm changeset` for version management
- **Enterprise features**: Core package includes observability and health monitoring