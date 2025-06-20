# 工作交接指南

## 📋 项目背景

Linch Kit 是一个 AI-First 的企业级快速开发框架，采用 Turborepo monorepo 架构，包含多个核心包和一个 starter 应用用于验证功能集成。

## 🎯 当前任务状态

### 主要任务
通过 Starter 应用实现完整的用户管理功能，验证各个包的集成。

**详细任务状态请查看**: [任务优先级](./task-priorities.md) 和 [当前进度](./current-progress.md)

## 🚀 快速开始步骤

### 1. 环境检查
```bash
cd /home/laofahai/workspace/linch-kit
pwd  # 确认在正确目录
node --version  # 确认 Node.js 版本
pnpm --version  # 确认 pnpm 可用
```

### 2. 项目状态检查
```bash
pnpm linch --help        # 检查 CLI 基础功能
pnpm linch plugin:list   # 检查插件加载
pnpm linch schema:list   # 检查 Schema 系统
```

## 📁 关键文件位置

### CLI 系统
- **CLI 入口**: `apps/starter/scripts/linch.js`
- **Core CLI**: `packages/core/src/cli/`
- **插件加载器**: `packages/core/src/cli/core/plugin-loader.ts`
- **命令注册**: `packages/core/src/cli/core/command-registry.ts`

### 配置系统
- **统一配置**: `apps/starter/linch.config.ts`
- **配置管理器**: `packages/core/src/config/`
- **Schema 配置**: `packages/schema/src/config/`

### Schema 系统
- **Schema CLI 插件**: `packages/schema/src/plugins/cli-plugin.ts`
- **用户实体**: `apps/starter/app/_lib/schemas/user.ts`
- **Schema 核心**: `packages/schema/src/`

### 应用代码
- **Starter 应用**: `apps/starter/`
- **用户管理**: `apps/starter/app/(dashboard)/users/`
- **认证**: `apps/starter/app/auth/`

## 🔧 重要原则

1. **优先使用现有包功能** - 不要重新实现，要使用 packages/ 下已有的功能
2. **不要手动修改生成的文件** - 使用 CLI 命令来生成和管理
3. **保持类型安全** - 不要将 TypeScript 文件改为 JavaScript
4. **遵循用户要求** - 命令格式要符合用户偏好（不用冒号分隔符）

## 📖 必读文档

### 项目理解
1. [项目总览](../overview/project-overview.md) - 项目整体介绍
2. [系统架构](../architecture/system-architecture.md) - 技术架构设计
3. [当前进度](./current-progress.md) - 最新开发状态

### 包级文档
4. [Core 包](../packages/core.md) - CLI 和基础设施
5. [Schema 包](../packages/schema.md) - 数据模式系统
6. [Auth Core 包](../packages/auth-core.md) - 认证和权限

### 工作流程
7. [开发流程](../workflows/development.md) - 开发规范
8. [任务优先级](./task-priorities.md) - 当前任务安排

## 🎯 最终目标

通过 Starter 应用实现完整的用户管理功能，验证以下包的集成：
- `@linch-kit/core` - CLI 工具和基础设施
- `@linch-kit/schema` - 数据模式定义和 Prisma 生成
- `@linch-kit/auth-core` - 认证和权限管理
- `@linch-kit/trpc` - API 层
- `@linch-kit/ui` - UI 组件

## 🔍 常见问题

### Q: CLI 命令不工作怎么办？
A: 检查插件加载流程，确认配置文件正确，查看错误日志

### Q: Schema 命令找不到实体？
A: 检查实体文件路径，确认配置中的 schemaDir 设置正确

### Q: 包之间集成有问题？
A: 检查包的版本依赖，确认类型定义一致

### Q: 构建失败？
A: 运行 `pnpm build` 重新构建所有包，检查 TypeScript 错误

## 📞 协作信息

- **开发环境**: Node.js 20+, pnpm, TypeScript
- **工作目录**: `/home/laofahai/workspace/linch-kit`
- **包管理**: pnpm + Turborepo
- **版本控制**: Git + GitHub
- **数据库**: PostgreSQL (Supabase)

## 🚨 注意事项

1. **始终在正确的工作目录下操作**
2. **修改代码前先运行测试命令确认当前状态**
3. **遇到问题时先查看相关包的文档**
4. **重要变更前先备份或提交代码**
5. **使用 AI 助手时提供足够的上下文信息**

---

**最后更新**: 2025-06-20  
**适用版本**: Linch Kit v0.x  
**相关文档**: [任务优先级](./task-priorities.md) | [当前进度](./current-progress.md)
