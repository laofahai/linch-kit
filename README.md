# Linch Kit

一个现代化的全栈开发工具包，基于 TypeScript + Turborepo + tRPC，提供类型安全、可扩展的开发体验。

## ✨ 特性

- 🚀 **AI-First 设计** - 为 AI 辅助开发优化的架构和文档
- 🔒 **端到端类型安全** - 从数据库到前端的完整类型安全
- 📦 **Monorepo 架构** - 基于 Turborepo 的高效包管理
- 🎯 **插件化系统** - 可扩展的插件架构
- 🛠️ **开发工具链** - 完整的开发、测试、构建工具链
- 📚 **完善文档** - 详细的 AI 上下文和开发文档
- ⚡ **ES 模块兼容** - 完全支持现代 ES 模块和 CommonJS 环境
- 🔧 **动态配置** - 智能配置加载和认证套件选择

## 📁 项目结构

### 应用 (Apps)

- `starter` - 示例应用，展示 Linch Kit 的使用方式
- `linch.tech` - 官方网站和文档站点

### 包 (Packages)

- `@linch-kit/core` - 核心工具包，CLI 和配置系统
- `@linch-kit/types` - TypeScript 类型定义
- `@linch-kit/auth-core` - 认证核心包
- `@linch-kit/schema` - 数据模式定义和验证
- `@linch-kit/trpc` - tRPC 集成包
- `@linch-kit/crud` - CRUD 操作包
- `@linch-kit/ui` - React UI 组件库

所有包都使用 [TypeScript](https://www.typescriptlang.org/) 开发，确保类型安全。

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8.0.0

### 安装和设置

```bash
# 克隆项目
git clone <repository-url>
cd linch-kit

# 安装依赖
pnpm install

# 初始化配置
pnpm setup

# 验证环境
pnpm validate
```

### 开发

```bash
# 启动完整开发模式（推荐）
pnpm dev

# 只启动应用开发服务器
pnpm dev:apps

# 只监听包变化
pnpm dev:packages
```

### 构建

```bash
# 构建所有包
pnpm build:packages

# 构建所有应用
pnpm build:apps

# 构建全部
pnpm build
```

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 类型检查
pnpm check-types

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 📦 发布

```bash
# 添加变更集
pnpm changeset

# 版本更新
pnpm changeset:version

# 发布到 npm
pnpm changeset:publish

# 或使用自动化发布脚本
pnpm release
```

## 🛠️ 开发工具

项目包含完整的开发工具链：

- **TypeScript** - 静态类型检查
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Vitest** - 单元测试
- **Turborepo** - 构建编排和缓存
- **Changesets** - 版本管理
- **tsup** - 快速 TypeScript 打包

## 📚 文档

- [快速开始](./ai-context/zh/overview/quick-start.md) - 快速上手指南
- [项目概览](./ai-context/zh/overview/project-overview.md) - 项目整体介绍
- [架构优化记录](./ai-context/zh/reference/architecture-optimization.md) - 最新技术改进
- [开发工作流程](./ai-context/zh/workflows/development.md) - 开发标准和流程
- [AI 上下文](./ai-context/zh/README.md) - AI 辅助开发文档

### 🔧 技术文档

- **ES 模块兼容性** - 支持 CommonJS 和 ES 模块混合环境
- **动态认证套件选择** - 根据配置自动选择合适的认证套件
- **JSDoc 文档标准** - 完整的代码文档规范
- **错误处理机制** - 健壮的错误处理和回退策略

## 🤝 贡献

欢迎贡献代码！请查看我们的[贡献指南](./ai-context/workflows/development.md)了解开发流程。

## 📄 许可证

MIT License - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 🔗 相关链接

- [Turborepo 文档](https://turborepo.com/docs)
- [tRPC 文档](https://trpc.io/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
