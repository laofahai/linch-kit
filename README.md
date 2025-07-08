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
L0: @linch-kit/core      基础设施 (日志、配置、插件)
L1: @linch-kit/schema    Schema 引擎 (代码生成、验证)
L2: @linch-kit/auth      认证权限 (NextAuth + CASL)
L2: @linch-kit/crud      CRUD 操作 (类型安全、权限集成)
L3: @linch-kit/trpc      API 层 (端到端类型安全)
L3: @linch-kit/ui        UI 组件库 (shadcn/ui + 企业组件)
L4: @linch-kit/ai        AI 集成 (Graph RAG、智能查询)
L4: @linch-kit/console   管理平台 (多租户、权限管理)
```

## 📦 包介绍

### 核心包

| 包                                                                       | 版本                                                   | 描述                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------- |
| **[@linch-kit/core](https://www.npmjs.com/package/@linch-kit/core)**     | ![npm](https://img.shields.io/npm/v/@linch-kit/core)   | 基础设施包 - 插件系统、配置管理、日志系统 |
| **[@linch-kit/schema](https://www.npmjs.com/package/@linch-kit/schema)** | ![npm](https://img.shields.io/npm/v/@linch-kit/schema) | Schema 引擎 - 代码生成、验证、转换        |
| **[@linch-kit/auth](https://www.npmjs.com/package/@linch-kit/auth)**     | ![npm](https://img.shields.io/npm/v/@linch-kit/auth)   | 认证权限 - NextAuth.js + CASL 权限控制    |
| **[@linch-kit/crud](https://www.npmjs.com/package/@linch-kit/crud)**     | ![npm](https://img.shields.io/npm/v/@linch-kit/crud)   | CRUD 操作 - 类型安全、权限集成、复杂查询  |
| **[@linch-kit/trpc](https://www.npmjs.com/package/@linch-kit/trpc)**     | ![npm](https://img.shields.io/npm/v/@linch-kit/trpc)   | API 层 - 端到端类型安全的 tRPC 集成       |
| **[@linch-kit/ui](https://www.npmjs.com/package/@linch-kit/ui)**         | ![npm](https://img.shields.io/npm/v/@linch-kit/ui)     | UI 组件库 - shadcn/ui + 企业级组件        |
| **[@linch-kit/ai](https://www.npmjs.com/package/@linch-kit/ai)**         | ![npm](https://img.shields.io/npm/v/@linch-kit/ai)     | AI 集成 - Graph RAG、智能查询、代码理解   |

### 企业模块

| 包                                                                         | 版本                                                    | 描述                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| **[@linch-kit/console](https://www.npmjs.com/package/@linch-kit/console)** | ![npm](https://img.shields.io/npm/v/@linch-kit/console) | 管理平台 - 多租户管理、权限控制、系统监控 |

### 工具包

| 包                                                                     | 版本                                                  | 描述                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| **[create-linch-kit](https://www.npmjs.com/package/create-linch-kit)** | ![npm](https://img.shields.io/npm/v/create-linch-kit) | 项目脚手架 - 一键创建 LinchKit 项目 |

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
bun add @linch-kit/core @linch-kit/schema @linch-kit/auth @linch-kit/crud @linch-kit/trpc @linch-kit/ui @linch-kit/ai
```

### 配置说明

使用 `create-linch-kit` 创建的项目已包含完整配置：

- ✅ **认证系统** - NextAuth.js 5.0 + 权限管理
- ✅ **数据库** - Prisma + PostgreSQL Schema
- ✅ **API 层** - tRPC 路由和类型安全
- ✅ **UI 组件** - shadcn/ui + 企业级组件
- ✅ **管理界面** - 多租户管理平台
- ✅ **开发工具** - ESLint、TypeScript、测试配置

### 手动配置（仅手动安装需要）

```typescript
// lib/linch-kit.ts
import { createConfig, createLogger } from '@linch-kit/core'
import { createSchemaEngine } from '@linch-kit/schema'
import { setupAuth } from '@linch-kit/auth'
import { createCRUD } from '@linch-kit/crud'

// 配置 LinchKit
export const config = createConfig({
  app: {
    name: 'My App',
    env: process.env.NODE_ENV,
  },
})

export const logger = createLogger({ name: 'my-app' })
export const schemaEngine = createSchemaEngine()
export const crud = createCRUD()
```

### Schema 定义

```typescript
// schemas/user.ts
import { z } from 'zod'
import { defineSchema } from '@linch-kit/schema'

export const UserSchema = defineSchema('User', {
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// 自动生成类型和验证器
export type User = z.infer<typeof UserSchema>
```

### 使用 UI 组件

```tsx
// components/UserForm.tsx
import { Form, Button, Input } from '@linch-kit/ui'
import { UserSchema } from '@/schemas/user'

export function UserForm() {
  return (
    <Form schema={UserSchema}>
      <Input name="email" label="邮箱" />
      <Input name="name" label="姓名" />
      <Button type="submit">保存</Button>
    </Form>
  )
}
```

## 📚 文档

- [快速开始指南](./docs/getting-started.md)
- [架构设计](./ai-context/01_System/01_Architecture_Overview.md)
- [API 参考](./ai-context/03_Reference/01_Packages_API/)
- [开发指南](./ai-context/02_Guides/01_Development_Workflow.md)
- [AI 功能指南](./packages/ai/README.md)

## 🏢 企业功能

### 多租户架构

- 租户数据隔离
- 角色权限管理 (RBAC + ABAC)
- 租户配置管理

### 认证与权限

- NextAuth.js 5.0 集成
- CASL 权限控制
- 字段级权限过滤
- 行级权限控制

### 管理平台

- 统一管理控制台
- 用户和权限管理
- 系统监控和审计
- 插件管理

## 🛠️ 开发

### 环境要求

- Node.js >= 18
- bun >= 1.0 (主要包管理器)
- TypeScript >= 5.0

### 开发规范

- 📖 [Git 工作流规范](./ai-context/02_Guides/02_Git_Workflow.md) - 分支管理、提交规范、PR 流程
- 🔒 [开发约束文档](./ai-context/02_Guides/01_Development_Workflow.md) - 技术约束、代码规范
- 🏗️ [架构设计文档](./ai-context/01_System/01_Architecture_Overview.md) - 系统架构、模块设计

### 开发命令

```bash
# 安装依赖
bun install

# 开发模式
bun dev

# 构建所有包
bun build:packages

# 运行测试
bun test

# 类型检查
bun type-check

# 代码检查
bun lint
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
