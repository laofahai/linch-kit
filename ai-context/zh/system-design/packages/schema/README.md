# @linch-kit/schema

> **Schema驱动包** | **P0优先级** | **依赖**: core

## 🎯 包概览

@linch-kit/schema 是LinchKit的核心Schema驱动引擎，提供实体定义、代码生成、类型推导、数据验证等功能。

### 核心功能
- **Schema定义**: 声明式的实体和字段定义
- **代码生成**: 自动生成TypeScript类型、Prisma模型、API路由
- **数据验证**: 基于Zod的运行时验证
- **类型推导**: 完整的TypeScript类型推导
- **国际化集成**: 多语言字段和验证消息
- **权限集成**: Schema级别的权限定义

### 技术特色
- 单一Schema定义，多目标生成
- 完全的类型安全
- 可扩展的字段类型系统
- AI友好的Schema结构

## 📁 文档导航

| 文档 | 描述 |
|------|------|
| [API参考](./api-reference.md) | Schema定义和生成API |
| [实现指南](./implementation-guide.md) | 代码生成引擎 |
| [集成示例](./integration-examples.md) | Schema使用示例 |
| [高级特性](./advanced-features.md) | 自定义字段类型和生成器 |

## 🚀 快速开始

```typescript
import { defineEntity, generateCode } from '@linch-kit/schema'

// 定义Schema
const User = defineEntity('User', {
  name: { type: 'string', required: true },
  email: { type: 'email', unique: true },
  age: { type: 'number', min: 0 },
  profile: { type: 'relation', target: 'Profile' }
})

// 生成代码
await generateCode({
  entities: [User],
  targets: ['prisma', 'types', 'api']
})
```