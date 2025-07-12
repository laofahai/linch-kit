# LinchKit

**🚀 生产就绪的企业级 AI-First 全栈开发框架 v2.0.2**

[![npm](https://img.shields.io/npm/v/@linch-kit/core)](https://www.npmjs.com/package/@linch-kit/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)

LinchKit 是一个 Schema 驱动的企业级全栈开发框架，提供端到端类型安全、AI-First 设计、多租户架构和完整的开发工具链。

## ✨ 核心特性

- 🧠 **AI-First 设计** - Graph RAG 知识图谱、智能代码理解、AI 辅助开发
- 📊 **Schema 驱动** - 以 Zod Schema 为单一数据源，自动生成类型、验证、API 和 UI
- 🔒 **端到端类型安全** - 从数据库到前端的完整 TypeScript 类型安全
- 🏢 **企业级架构** - 多租户、权限管理、审计日志、插件系统
- ⚡ **现代技术栈** - Next.js 15、React 19、Tailwind CSS 4、tRPC、Prisma
- 🔧 **开发友好** - 完整的开发工具链、测试覆盖、CI/CD 自动化

## 🏗️ 架构概览

LinchKit 采用分层架构设计，确保高内聚、低耦合：

```
L0: @linch-kit/core      基础设施 (日志、配置、插件、Extension系统)
L1: @linch-kit/auth      认证权限 (NextAuth + CASL)
L2: @linch-kit/platform  业务开发平台 (Schema+CRUD+tRPC+验证)
L3: @linch-kit/ui        UI 组件库 (shadcn/ui + 企业组件)

Extensions:
- extensions/console     管理平台Extension (多租户、权限管理)
- extensions/admin       管理功能Extension (规划中)
- extensions/blog        博客系统Extension (开发中)

Tools:
- tools/schema          Schema 引擎工具 (代码生成、验证)
- tools/cli             LinchKit CLI 工具
- tools/ai-platform     LinchKit AI平台 - Graph RAG知识图谱
```

## 📦 包介绍

### 核心包

| 包                                                                           | 版本                                                     | 描述                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| **[@linch-kit/core](https://www.npmjs.com/package/@linch-kit/core)**         | ![npm](https://img.shields.io/npm/v/@linch-kit/core)     | 基础设施包 - 插件系统、配置管理、日志系统、Extension系统 |
| **[@linch-kit/auth](https://www.npmjs.com/package/@linch-kit/auth)**         | ![npm](https://img.shields.io/npm/v/@linch-kit/auth)     | 认证权限 - NextAuth.js + CASL 权限控制                   |
| **[@linch-kit/platform](https://www.npmjs.com/package/@linch-kit/platform)** | ![npm](https://img.shields.io/npm/v/@linch-kit/platform) | 业务开发平台 - Schema+CRUD+tRPC+验证一体化               |
| **[@linch-kit/ui](https://www.npmjs.com/package/@linch-kit/ui)**             | ![npm](https://img.shields.io/npm/v/@linch-kit/ui)       | UI 组件库 - shadcn/ui + 企业级组件                       |

### Extensions

| Extension              | 描述                                               |
| ---------------------- | -------------------------------------------------- |
| **extensions/console** | 管理平台Extension - 多租户管理、权限控制、系统监控 |
| **extensions/admin**   | 管理功能Extension (规划中)                         |
| **extensions/blog**    | 博客系统Extension (开发中)                         |

### 工具包

| 工具                 | 描述                                          |
| -------------------- | --------------------------------------------- |
| **tools/schema**     | Schema 引擎工具 - 代码生成、验证、转换        |
| **tools/cli**        | LinchKit CLI 工具 - 项目脚手架、Extension管理 |
| **tools/ai-platform** | LinchKit AI平台 - Graph RAG知识图谱、AI辅助开发 |
| **create-linch-kit** | 项目脚手架 - 一键创建 LinchKit 项目           |

## 🚀 快速开始

### 方式一：使用脚手架（推荐）

```bash
# 一键创建 LinchKit 项目
bunx create-linch-kit my-app

# 进入项目目录
cd my-app

# 启动开发服务器
bun dev
```

### 方式二：手动安装

```bash
# 创建新项目
bunx create-next-app@latest my-app --typescript --tailwind --eslint --app

cd my-app

# 安装 LinchKit 核心包
bun add @linch-kit/core @linch-kit/auth @linch-kit/platform @linch-kit/ui
```

### 配置说明

使用 `create-linch-kit` 创建的项目已包含完整配置：

- ✅ **认证系统** - NextAuth.js 5.0 + 权限管理
- ✅ **数据库** - Prisma + PostgreSQL Schema
- ✅ **API 层** - tRPC 路由和类型安全
- ✅ **UI 组件** - shadcn/ui + 企业级组件
- ✅ **管理界面** - 多租户管理平台
- ✅ **开发工具** - ESLint、TypeScript、测试配置

### 快速体验

```bash
# 一键创建项目
bunx create-linch-kit my-app

# 启动开发
cd my-app
bun dev
```

项目将自动配置：

- ✅ 认证系统 (NextAuth.js 5.0)
- ✅ 数据库 (Prisma + PostgreSQL)
- ✅ API 层 (tRPC)
- ✅ UI 组件 (shadcn/ui)
- ✅ 管理界面 (多租户)
- ✅ 开发工具 (ESLint, TypeScript, 测试)

## 📚 文档

- **[贡献指南](./CONTRIBUTING.md)** - 如何参与开发
- **[完整文档](./ai-context/README.md)** - 架构设计、API 参考、开发指南
- **[快速开始](./ai-context/00_Getting_Started/02_Quick_Start.md)** - 详细上手指南

## 🏢 企业功能

- **多租户架构** - 租户数据隔离、角色权限管理
- **认证与权限** - NextAuth.js 5.0 + CASL 权限控制
- **管理平台** - 统一管理控制台、系统监控

## 🛠️ 开发

想要参与开发？请查看我们的 **[贡献指南](./CONTRIBUTING.md)**。

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/laofahai/linch-kit.git
cd linch-kit

# 安装依赖
bun install

# 启动开发
bun dev
```

## 📄 许可证

MIT © [LinchKit Team](https://github.com/laofahai/linch-kit)

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 🔗 相关链接

- [GitHub](https://github.com/laofahai/linch-kit)
- [NPM 组织](https://www.npmjs.com/org/linch-kit)
- [文档站点](https://kit.linch.tech)
- [演示应用](https://kit-demo.linch.tech)

---

**Built with ❤️ by LinchKit Team**
