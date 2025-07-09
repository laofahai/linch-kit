# LinchKit Extension 开发指南

**版本**: v2.0  
**更新时间**: 2025-07-09  
**状态**: 官方指南

## 📋 概述

本指南详细介绍如何在LinchKit平台上开发Extension（扩展），包括统一的扩展模型、开发流程、最佳实践和发布指南。

## 🔌 统一Extension模型

### 核心理念：一个概念，多种能力

LinchKit采用**统一的Extension模型**，摒弃了传统的Plugin vs Module区分。所有功能扩展都称为"Extension"，通过能力声明来描述其功能特性。

### Extension能力分类

#### 1. 纯逻辑扩展（hasHooks）

- **用途**: 增强或修改现有功能的行为
- **特点**: 无UI界面，主要通过钩子和事件工作
- **示例**: 审计日志、数据验证、邮件通知

#### 2. UI组件扩展（hasUI）

- **用途**: 提供新的界面组件或修改现有UI
- **特点**: 专注于用户界面，可能包含简单的状态管理
- **示例**: 自定义主题、Dashboard组件、表单控件

#### 3. API扩展（hasAPI）

- **用途**: 提供新的API端点或集成第三方服务
- **特点**: 后端逻辑，通过tRPC暴露API
- **示例**: 支付集成、短信服务、数据同步

#### 4. 完整应用（hasUI + hasAPI + hasSchema）

- **用途**: 提供完整的业务功能
- **特点**: 包含前后端、数据模型、完整的用户体验
- **示例**: 博客系统、电商模块、CRM系统

#### 5. 独立服务（standalone）

- **用途**: 独立运行的服务，通过API与LinchKit集成
- **特点**: 可以有自己的数据库和部署环境
- **示例**: 微服务、外部系统集成、AI服务

## 🚀 快速开始

### 5分钟创建你的第一个模块

```bash
# 1. 创建新模块
npx linch-kit new:module my-blog

# 2. 进入模块目录
cd my-blog

# 3. 安装依赖
pnpm install

# 4. 启动开发
pnpm dev
```

### 模块目录结构

```
my-blog/
├── manifest.json        # 模块元信息
├── package.json         # NPM包配置
├── tsconfig.json        # TypeScript配置
├── README.md           # 模块文档
├── src/
│   ├── server/         # 后端代码
│   │   ├── index.ts    # 后端入口
│   │   ├── router.ts   # API路由
│   │   └── services/   # 业务逻辑
│   ├── client/         # 前端代码
│   │   ├── index.ts    # 前端入口
│   │   ├── pages/      # 页面组件
│   │   └── components/ # UI组件
│   └── shared/         # 共享代码
│       ├── types.ts    # 类型定义
│       └── schemas.ts  # Schema定义
└── tests/              # 测试文件
```

## 📝 Extension配置 (package.json)

Extension配置集成在package.json中，通过`linchkit`字段定义：

```json
{
  "name": "@myorg/linchkit-ext-blog",
  "version": "1.0.0",
  "$schema": "https://unpkg.com/@linchkit/schema@1.0.0/schemas/extension.v1.json",
  "description": "Blog extension for LinchKit",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./client": "./dist/client.js",
    "./server": "./dist/server.js"
  },
  "linchkit": {
    "displayName": "博客系统",
    "capabilities": {
      "hasUI": true,
      "hasAPI": true,
      "hasSchema": true,
      "hasHooks": false,
      "standalone": false
    },
    "category": "content",
    "tags": ["blog", "cms", "content"],
    "permissions": ["database:read", "database:write"],
    "configuration": {
      "postsPerPage": {
        "type": "number",
        "default": 10,
        "description": "每页显示的文章数"
      },
      "enableComments": {
        "type": "boolean",
        "default": true,
        "description": "是否启用评论功能"
      }
    },
    "icon": "newspaper",
    "minCoreVersion": "1.2.0"
  },
  "peerDependencies": {
    "@linch-kit/core": "^1.2.0",
    "@linch-kit/crud": "^1.2.0"
  },
  "devDependencies": {
    "@linchkit/schema": "^1.0.0"
  }
}
```

### 🔧 JSON Schema支持

LinchKit提供完整的JSON Schema支持，为开发者提供：

- **IDE自动补全** - 键入`linchkit.`时自动显示可用字段
- **配置验证** - 错误配置会显示红色下划线和错误信息
- **文档提示** - 悬停时显示字段说明和示例
- **类型安全** - 自动生成TypeScript类型定义

### 设置Schema支持

1. **安装Schema包**：

   ```bash
   npm install --save-dev @linchkit/schema
   ```

2. **添加$schema字段**：

   ```json
   {
     "$schema": "https://unpkg.com/@linchkit/schema@1.0.0/schemas/extension.v1.json"
   }
   ```

3. **立即获得IDE支持** - 无需额外配置！

## 💻 开发模块

### 1. 定义数据模型

```typescript
// src/shared/schemas.ts
import { defineEntity } from '@linch-kit/schema'

export const BlogPost = defineEntity('BlogPost', {
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  content: z.string(),
  excerpt: z.string().optional(),
  publishedAt: z.date().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  author: z.relation('User'),
  tags: z.relation('Tag').array(),
})
```

### 2. 创建API路由

```typescript
// src/server/router.ts
import { createRouter } from '@linch-kit/trpc'
import { createCRUD } from '@linch-kit/crud'
import { BlogPost } from '../shared/schemas'

const blogCrud = createCRUD({
  entity: BlogPost,
  permissions: {
    create: 'blog:write',
    read: 'public',
    update: 'blog:write',
    delete: 'blog:admin',
  },
})

export const blogRouter = createRouter()
  .merge('post.', blogCrud.router)
  .query('getBySlug', {
    input: z.object({ slug: z.string() }),
    resolve: async ({ input }) => {
      return blogCrud.findFirst({
        where: { slug: input.slug },
      })
    },
  })
```

### 3. 创建UI组件

```tsx
// src/client/pages/BlogList.tsx
import { useQuery } from '@linch-kit/trpc/client'
import { Card, Button } from '@linch-kit/ui'

export function BlogList() {
  const { data: posts } = useQuery(['post.list'])

  return (
    <div className="space-y-4">
      {posts?.map(post => (
        <Card key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <Button href={`/blog/${post.slug}`}>阅读更多</Button>
        </Card>
      ))}
    </div>
  )
}
```

### 4. 注册模块

```typescript
// src/server/index.ts
import type { ModuleDefinition } from '@linch-kit/core'
import { blogRouter } from './router'
import { BlogPost } from '../shared/schemas'

export default {
  name: 'blog',

  async onInit(registry) {
    // 注册Schema
    registry.schema.register(BlogPost)

    // 注册路由
    registry.router.register('blog', blogRouter)

    // 注册导航
    registry.navigation.add({
      id: 'blog',
      title: '博客',
      icon: 'newspaper',
      href: '/blog',
    })
  },
} satisfies ModuleDefinition
```

## 🔌 开发插件

插件开发相对简单，主要通过钩子扩展功能：

```typescript
// audit-plugin.ts
import type { Plugin } from '@linch-kit/core'

export const auditPlugin: Plugin = {
  metadata: {
    id: 'audit-log',
    name: '审计日志插件',
    version: '1.0.0',
  },

  hooks: {
    afterCreate: async (entity, data, context) => {
      console.log(`Created ${entity}: ${JSON.stringify(data)}`)
      // 记录到审计日志
    },

    afterUpdate: async (entity, data, context) => {
      console.log(`Updated ${entity}: ${JSON.stringify(data)}`)
      // 记录变更
    },
  },
}
```

## 🧪 测试模块

```typescript
// tests/blog.test.ts
import { describe, it, expect } from 'bun:test'
import { createTestClient } from '@linch-kit/test-utils'

describe('Blog Module', () => {
  const client = createTestClient()

  it('should create a blog post', async () => {
    const post = await client.blog.post.create({
      title: 'Hello World',
      slug: 'hello-world',
      content: 'This is my first post',
    })

    expect(post.id).toBeDefined()
    expect(post.title).toBe('Hello World')
  })
})
```

## 📦 发布模块

### 1. 构建模块

```bash
# 运行构建
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm type-check
```

### 2. 发布到NPM

```json
// package.json
{
  "name": "@yourorg/linchkit-module-blog",
  "version": "1.0.0",
  "main": "./dist/server/index.js",
  "module": "./dist/client/index.js",
  "types": "./dist/types/index.d.ts",
  "files": ["dist", "manifest.json"],
  "peerDependencies": {
    "@linch-kit/core": "^1.2.0"
  }
}
```

```bash
# 发布
npm publish
```

### 3. 提交到Marketplace

1. 在 [linchkit.io/marketplace](https://linchkit.io/marketplace) 注册开发者账号
2. 提交模块信息和NPM包名
3. 等待审核（通常24小时内）
4. 审核通过后自动出现在市场中

## 🎯 最佳实践

### 1. 遵循LinchKit设计原则

- **Schema驱动**: 使用defineEntity定义数据模型
- **类型安全**: 全程TypeScript，避免any
- **权限控制**: 合理设置操作权限
- **国际化**: 支持多语言

### 2. 性能优化

- **按需加载**: 使用动态import
- **缓存策略**: 合理使用React Query缓存
- **优化Bundle**: 注意包大小

### 3. 用户体验

- **响应式设计**: 支持移动端
- **错误处理**: 友好的错误提示
- **加载状态**: 合理的loading体验
- **文档完善**: README和API文档

### 4. 安全考虑

- **输入验证**: 使用Zod严格验证
- **权限检查**: 每个操作都要检查权限
- **SQL注入**: 使用Prisma防止注入
- **XSS防护**: 正确处理用户输入

## 🛠️ 调试技巧

### 使用LinchKit DevTools

```typescript
// 启用调试日志
import { logger } from '@linch-kit/core'

logger.debug('blog', 'Creating post', { data })
```

### 本地开发链接

```bash
# 在模块目录
pnpm link

# 在starter应用
pnpm link @yourorg/linchkit-module-blog
```

## 📚 进阶主题

### 模块间通信

```typescript
// 发送事件
registry.events.emit('blog:post:created', { postId })

// 监听事件
registry.events.on('user:login', async data => {
  // 处理用户登录
})
```

### 扩展现有模块

```typescript
// 扩展其他模块的Schema
registry.schema.extend('User', {
  blogPosts: z.relation('BlogPost').array(),
})
```

### 自定义配置

```typescript
// 读取配置
const config = registry.config.get('blog')
const postsPerPage = config.postsPerPage || 10
```

## 🤝 获取帮助

- **文档**: [docs.linchkit.io](https://docs.linchkit.io)
- **示例**: [github.com/laofahai/linch-kit/examples](https://github.com/laofahai/linch-kit/examples)
- **社区**: [Discord](https://discord.gg/linchkit)
- **问题**: [GitHub Issues](https://github.com/laofahai/linch-kit/issues)

---

**下一步**: 查看[示例模块](https://github.com/laofahai/linch-kit/tree/main/examples/modules)开始你的模块开发之旅！
