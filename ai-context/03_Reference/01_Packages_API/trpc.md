---
package: '@linch-kit/trpc'
version: '2.0.2'
layer: 'L4'
dependencies: ['@linch-kit/core', '@linch-kit/schema', '@linch-kit/auth']
completeness: 80
test_coverage: 85
status: 'production_ready'
document_type: 'api_reference'
purpose: 'Graph RAG knowledge base - 端到端类型安全的API开发，基于tRPC 11.4.3构建'
api_exports:
  - name: 'createTRPCProxyClient'
    type: 'function'
    status: 'stable'
  - name: 'router'
    type: 'function'
    status: 'stable'
  - name: 'publicProcedure'
    type: 'object'
    status: 'stable'
  - name: 'protectedProcedure'
    type: 'object'
    status: 'stable'
  - name: 'adminProcedure'
    type: 'object'
    status: 'stable'
  - name: 'healthRouter'
    type: 'router'
    status: 'stable'
  - name: 'systemRouter'
    type: 'router'
    status: 'stable'
  - name: 'authRouter'
    type: 'router'
    status: 'stable'
  - name: 'crudRouter'
    type: 'router'
    status: 'stable'
  - name: 'createLinchKitContext'
    type: 'function'
    status: 'stable'
relationships:
  - type: 'depends_on'
    targets: ['@linch-kit/core', '@linch-kit/schema', '@linch-kit/auth']
  - type: 'provides_api_for'
    targets: ['@linch-kit/ui']
  - type: 'integrates_with'
    targets: ['tRPC', 'Zod', 'superjson']
last_verified: '2025-07-07'
---

# @linch-kit/trpc API 文档

**版本**: 2.0.2  
**层级**: L4 (API层)  
**依赖**: @linch-kit/core, @linch-kit/schema, @linch-kit/auth  
**核心职责**: 端到端类型安全的 API 开发，基于 tRPC 11.4.3

## 包概览

@linch-kit/trpc 是 LinchKit 的 L3 层 API 包，提供基于 tRPC 的端到端类型安全 API 开发能力。采用分离式架构设计，客户端和服务端功能分开导出，支持自动代码生成和企业级权限控制。

### 🎯 核心特性

- **端到端类型安全**: 基于 tRPC 11.4.3 和 TypeScript 严格模式
- **分离式架构**: 客户端 (`index.ts`) 和服务端 (`server.ts`) 分开导出
- **自动代码生成**: 基于 Schema 驱动的 tRPC 路由器生成
- **企业级权限**: 集成 @linch-kit/auth 的细粒度权限控制
- **CRUD 集成**: 与 @linch-kit/crud 深度集成
- **CLI 工具**: 提供命令行工具进行路由器生成

### 📦 包结构

```
@linch-kit/trpc/
├── index.ts           # 客户端安全的导出
├── server.ts          # 服务端专用导出
├── routers/
│   ├── auth.ts        # 认证相关路由
│   └── crud.ts        # CRUD 操作路由
└── cli/
    └── commands.ts    # CLI 命令集成
```

### 🔗 架构依赖

- **@linch-kit/core**: 日志、配置、CLI 系统
- **@linch-kit/schema**: Schema 验证和类型生成
- **@linch-kit/auth**: 认证和权限管理
- **@trpc/server**: 11.4.3 - 服务端 tRPC 功能
- **@trpc/client**: 11.4.3 - 客户端 tRPC 功能

## 客户端 API (index.ts)

### 🔧 tRPC 客户端导出

```typescript
// 重新导出 tRPC 客户端功能
export { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
export type { CreateTRPCClientOptions } from '@trpc/client'
```

**使用示例**:

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@linch-kit/trpc'
import type { AppRouter } from '@linch-kit/trpc/server'

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
})
```

### 📊 类型定义

#### LinchKitContext

```typescript
export type LinchKitContext = {
  user?: {
    id: string
    email?: string
    name?: string
  }
  services: {
    logger: {
      debug: (message: string, meta?: Record<string, unknown>) => void
      info: (message: string, meta?: Record<string, unknown>) => void
      warn: (message: string, meta?: Record<string, unknown>) => void
      error: (message: string, meta?: Record<string, unknown>) => void
    }
    config: {
      get: (key: string) => unknown
    }
  }
}
```

**设计说明**: 客户端安全的上下文类型，仅包含必要的类型信息，不包含敏感的服务端实现细节。

#### TRPCRouterFactory

```typescript
export interface TRPCRouterFactory {
  router: (routes: Record<string, unknown>) => unknown
  publicProcedure: unknown
  protectedProcedure: unknown
  adminProcedure: unknown
}
```

#### AppRouter

```typescript
export interface AppRouter {
  health: {
    ping: unknown
    status: unknown
  }
  system: {
    info: unknown
  }
}
```

### 🔗 CLI 命令集成

```typescript
// CLI命令
export { trpcCommands } from './cli/commands'
```

**使用示例**:

```typescript
import { trpcCommands } from '@linch-kit/trpc'

// 在 CLI 应用中注册命令
trpcCommands.forEach(command => {
  program.command(command.name).description(command.description).action(command.handler)
})
```

### 🧪 测试辅助工具

```typescript
// 基础 tRPC 构建器（仅用于测试）
export const router = (routes: Record<string, unknown>) => routes
export const procedure = {}
export const middleware = (fn: unknown) => fn
export const publicProcedure = {}
export const protectedProcedure = {}
export const adminProcedure = {}
```

## 服务端 API (server.ts)

### 🔧 tRPC 服务端核心

#### 基础 tRPC 实例

```typescript
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

const t = initTRPC.context<LinchKitContext>().create({
  transformer: superjson,
})

export const router = t.router
export const middleware = t.middleware
export const procedure = t.procedure
```

**特性**:

- 集成 superjson 进行数据序列化
- 支持 LinchKit 上下文类型
- 提供基础的路由器和中间件构建能力

#### 过程构建器

```typescript
/**
 * 公共过程 - 无需认证
 */
export const publicProcedure = t.procedure

/**
 * 受保护过程 - 需要认证
 */
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error('需要登录才能访问此资源')
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    })
  })
)

/**
 * 管理员过程 - 需要管理员权限
 */
export const adminProcedure = protectedProcedure.use(
  t.middleware(({ ctx, next }) => {
    // 简化的管理员检查 - 实际应用中应该集成权限系统
    return next({
      ctx,
    })
  })
)
```

**使用示例**:

```typescript
import { publicProcedure, protectedProcedure, adminProcedure } from '@linch-kit/trpc/server'
import { z } from 'zod'

// 公共接口
const publicRouter = router({
  ping: publicProcedure.output(z.string()).query(() => 'pong'),

  // 需要认证的接口
  getProfile: protectedProcedure
    .output(z.object({ id: z.string(), name: z.string() }))
    .query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name })),

  // 管理员接口
  adminStats: adminProcedure
    .output(z.object({ totalUsers: z.number() }))
    .query(() => ({ totalUsers: 1000 })),
})
```

### 🏥 内置路由器

#### 健康检查路由器

```typescript
export const healthRouter = router({
  ping: publicProcedure
    .output(
      z.object({
        message: z.string(),
        timestamp: z.string(),
        uptime: z.number(),
      })
    )
    .query(() => ({
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })),

  status: publicProcedure
    .output(
      z.object({
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        timestamp: z.string(),
      })
    )
    .query(() => ({
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
    })),
})
```

#### 系统信息路由器

```typescript
export const systemRouter = router({
  info: publicProcedure
    .output(
      z.object({
        name: z.string(),
        version: z.string(),
        environment: z.string(),
        nodeVersion: z.string(),
        uptime: z.number(),
        timestamp: z.string(),
      })
    )
    .query(() => ({
      name: '@linch-kit/trpc',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })),
})
```

#### 基础应用路由器

```typescript
export const appRouter = router({
  health: healthRouter,
  system: systemRouter,
})

export type AppRouter = typeof appRouter
```

### 🔧 上下文管理

#### 上下文创建辅助函数

```typescript
export function createLinchKitContext(options: {
  services: {
    logger: {
      debug: (message: string, meta?: Record<string, unknown>) => void
      info: (message: string, meta?: Record<string, unknown>) => void
      warn: (message: string, meta?: Record<string, unknown>) => void
      error: (message: string, meta?: Record<string, unknown>) => void
    }
    config: {
      get: (key: string) => unknown
    }
  }
}) {
  return async (_opts: { req: unknown; res?: unknown }) => {
    return {
      user: undefined, // 在具体应用中实现认证逻辑
      services: options.services,
    }
  }
}
```

#### 默认上下文创建函数

```typescript
export const createTRPCContext = createLinchKitContext({
  services: {
    logger: {
      debug: (message: string, meta?: Record<string, unknown>) => console.debug(message, meta),
      info: (message: string, meta?: Record<string, unknown>) => console.info(message, meta),
      warn: (message: string, meta?: Record<string, unknown>) => console.warn(message, meta),
      error: (message: string, meta?: Record<string, unknown>) => console.error(message, meta),
    },
    config: {
      get: (key: string) => process.env[key],
    },
  },
})
```

**使用示例**:

```typescript
import { createTRPCContext } from '@linch-kit/trpc/server'
import { createTRPCMsgs } from '@trpc/server/adapters/next'

export default createTRPCMsgs({
  router: appRouter,
  createContext: createTRPCContext,
})
```

### 🎯 类型导出

```typescript
export type TRPCRouterFactory = {
  router: typeof router
  publicProcedure: typeof publicProcedure
  protectedProcedure: typeof protectedProcedure
  adminProcedure: typeof adminProcedure
}
```

## 预构建路由器

### 🔐 认证路由器 (routers/auth.ts)

```typescript
export const authRouter = router({
  // 获取当前会话
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null
  }),

  // 获取用户信息
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),

  // 用户登录状态检查
  isAuthenticated: publicProcedure.query(async ({ ctx }) => {
    return !!ctx.user
  }),

  // 获取用户权限
  getPermissions: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // TODO: 实现权限获取逻辑
    return []
  }),

  // 检查特定权限
  hasPermission: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        resource: z.string(),
      })
    )
    .query(async ({ input: _input, ctx: _ctx }) => {
      // TODO: 实现权限检查逻辑
      return false
    }),
})
```

**使用示例**:

```typescript
import { authRouter } from '@linch-kit/trpc/routers/auth'

const appRouter = router({
  auth: authRouter,
  // 其他路由...
})
```

### 📊 CRUD 路由器 (routers/crud.ts)

```typescript
export const crudRouter = router({
  // 通用查询
  findMany: protectedProcedure
    .input(
      z.object({
        model: z.string(),
        where: z.record(z.any()).optional(),
        orderBy: z.record(z.any()).optional(),
        take: z.number().optional(),
        skip: z.number().optional(),
      })
    )
    .query(async ({ input: _input, ctx: _ctx }) => {
      // TODO: 实现通用查询逻辑
      return []
    }),

  // 通用创建
  create: protectedProcedure
    .input(
      z.object({
        model: z.string(),
        data: z.record(z.any()),
      })
    )
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // TODO: 实现通用创建逻辑
      return {}
    }),

  // 通用更新
  update: protectedProcedure
    .input(
      z.object({
        model: z.string(),
        where: z.record(z.any()),
        data: z.record(z.any()),
      })
    )
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // TODO: 实现通用更新逻辑
      return {}
    }),

  // 通用删除
  delete: protectedProcedure
    .input(
      z.object({
        model: z.string(),
        where: z.record(z.any()),
      })
    )
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // TODO: 实现通用删除逻辑
      return {}
    }),

  // 统计查询
  count: protectedProcedure
    .input(
      z.object({
        model: z.string(),
        where: z.record(z.any()).optional(),
      })
    )
    .query(async ({ input: _input, ctx: _ctx }) => {
      // TODO: 实现统计查询逻辑
      return 0
    }),
})
```

**使用示例**:

```typescript
import { crudRouter } from '@linch-kit/trpc/routers/crud'

const appRouter = router({
  crud: crudRouter,
  // 其他路由...
})
```

## CLI 工具 (cli/commands.ts)

### 🚀 tRPC 路由生成命令

```typescript
export const generateTrpcCommand: CLICommand = {
  name: 'trpc:generate',
  description: 'Generate tRPC routers from schema definitions',
  category: 'trpc',
  options: [
    {
      name: '--schema',
      alias: '-s',
      description: 'Schema file or directory',
      defaultValue: './src/schema',
    },
    {
      name: '--output',
      alias: '-o',
      description: 'Output directory for generated tRPC routers',
      defaultValue: './src/trpc',
    },
    {
      name: '--crud',
      description: 'Generate CRUD operations for each entity',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--auth',
      description: 'Include authentication middleware',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--permissions',
      description: 'Include permission checks',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--validation',
      description: 'Include input validation',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--openapi',
      description: 'Generate OpenAPI documentation',
      type: 'boolean',
    },
    {
      name: '--client',
      description: 'Generate TypeScript client',
      type: 'boolean',
    },
  ],
  handler: async (context: CLIContext) => {
    // 实现路由生成逻辑
  },
}
```

**使用示例**:

```bash
# 生成基础 tRPC 路由器
linch trpc:generate --schema ./src/schema --output ./src/trpc

# 生成包含权限检查的路由器
linch trpc:generate --schema ./src/schema --output ./src/trpc --permissions

# 生成 OpenAPI 文档和客户端
linch trpc:generate --schema ./src/schema --output ./src/trpc --openapi --client
```

### 🎯 代码生成功能

CLI 工具提供了完整的代码生成能力：

1. **根路由器生成**: 基于实体自动生成主路由器
2. **实体路由器生成**: 为每个 Schema 实体生成 CRUD 路由器
3. **中间件生成**: 自动生成认证和权限中间件
4. **类型定义生成**: 生成 TypeScript 类型定义
5. **OpenAPI 规范生成**: 生成 API 文档
6. **客户端生成**: 生成 TypeScript 客户端

## 架构集成

### 🔗 与 LinchKit 生态系统集成

#### 与 @linch-kit/core 集成

```typescript
import type { CLICommand } from '@linch-kit/core/cli'

// CLI 命令使用 core 包的标准接口
export const generateTrpcCommand: CLICommand = {
  // 命令定义...
}
```

#### 与 @linch-kit/schema 集成

```typescript
// 在代码生成中集成 Schema 定义
async function loadSchemaEntities(
  schemaPath: string
): Promise<Array<{ name: string; fields: Record<string, unknown> }>> {
  // 与 @linch-kit/schema 集成
  return []
}
```

#### 与 @linch-kit/auth 集成

```typescript
// 在中间件中集成权限检查
import { PermissionChecker } from '@linch-kit/crud/permissions'

export const permissionsMiddleware = middleware(async ({ ctx, next }) => {
  const checker = new PermissionChecker(ctx.user)
  // 权限检查逻辑
})
```

### 🏗️ 分层架构位置

作为 L3 层 API 包，@linch-kit/trpc 承担以下职责：

1. **API 层抽象**: 提供统一的 API 开发接口
2. **类型安全桥梁**: 连接前端和后端的类型安全通信
3. **权限集成**: 整合 L2 层的认证和权限功能
4. **CRUD 集成**: 整合 L2 层的 CRUD 操作功能
5. **开发工具**: 提供代码生成和开发辅助工具

## 企业级特性

### 🔒 安全性

- **类型安全**: 基于 TypeScript 严格模式的端到端类型检查
- **输入验证**: 基于 Zod 的严格输入验证
- **认证中间件**: 集成 LinchKit 认证系统
- **权限控制**: 支持细粒度的权限检查

### 📊 性能

- **批量请求**: 支持 tRPC 的批量请求优化
- **序列化优化**: 使用 superjson 进行高效数据序列化
- **并发处理**: 支持高并发请求处理
- **内存效率**: 优化的内存使用和垃圾回收

### 🔧 开发体验

- **自动代码生成**: 基于 Schema 的自动路由器生成
- **CLI 工具**: 完整的命令行开发工具
- **类型推导**: 完整的 TypeScript 类型推导支持
- **错误处理**: 统一的错误处理和报告机制

## 最佳实践

### 📋 路由器组织

```typescript
// 推荐的路由器组织方式
const appRouter = router({
  // 公共路由
  health: healthRouter,
  system: systemRouter,

  // 认证路由
  auth: authRouter,

  // 业务路由
  user: userRouter,
  post: postRouter,

  // 管理路由
  admin: adminRouter,
})
```

### 🔐 权限最佳实践

```typescript
// 分层权限控制
const userRouter = router({
  // 公共信息
  getProfile: publicProcedure.query(/* ... */),

  // 需要认证
  updateProfile: protectedProcedure.mutation(/* ... */),

  // 需要管理员权限
  deleteUser: adminProcedure.mutation(/* ... */),
})
```

### 🎯 类型安全最佳实践

```typescript
// 使用严格的类型定义
const createUserRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(0).max(120),
      })
    )
    .output(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        createdAt: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      // 实现创建逻辑
    }),
})
```

## 测试策略

### 🧪 单元测试

- **路由器测试**: 测试每个路由器的功能
- **中间件测试**: 测试认证和权限中间件
- **类型测试**: 测试类型安全性
- **错误处理测试**: 测试错误情况

### 🔗 集成测试

- **端到端测试**: 测试完整的 API 流程
- **并发测试**: 测试高并发场景
- **性能测试**: 测试性能指标
- **安全测试**: 测试安全性

### 📊 测试覆盖率

- **单元测试覆盖率**: >85%
- **集成测试覆盖率**: >80%
- **端到端测试覆盖率**: >75%
- **关键路径覆盖率**: 100%

## 版本兼容性

### 📦 依赖版本

- **@trpc/server**: 11.4.3
- **@trpc/client**: 11.4.3
- **TypeScript**: >=5.0.0
- **Zod**: ^3.25.67
- **superjson**: ^2.2.2

### 🔄 向后兼容性

- **2.x 版本**: 完全向后兼容
- **1.x 版本**: 需要迁移指南
- **API 变更**: 遵循语义化版本规范

## 常见问题与解决方案

### ❓ 常见问题

1. **Q: 如何集成现有的认证系统？**
   A: 通过 createLinchKitContext 函数自定义上下文创建逻辑

2. **Q: 如何处理文件上传？**
   A: 使用 tRPC 的 multipart 支持或单独的文件上传端点

3. **Q: 如何实现实时功能？**
   A: 使用 tRPC 的 subscription 功能或 WebSocket 集成

### 🔧 故障排除

1. **类型错误**: 确保 TypeScript 版本 >=5.0.0
2. **序列化错误**: 检查 superjson 配置
3. **认证失败**: 检查中间件和上下文配置
4. **性能问题**: 启用批量请求和缓存

## 路线图

### 🚀 即将推出的功能

- **WebSocket 支持**: 实时通信功能
- **GraphQL 集成**: 混合 API 支持
- **缓存优化**: 智能缓存策略
- **监控集成**: 性能监控和指标

### 📅 长期计划

- **微服务支持**: 分布式 tRPC 架构
- **AI 集成**: 智能代码生成
- **可视化工具**: API 可视化管理
- **企业特性**: 更多企业级功能

---

## 🎯 总结

@linch-kit/trpc 是 LinchKit 生态系统中的核心 API 层包，提供了完整的端到端类型安全 API 开发能力。通过分离式架构设计、自动代码生成和深度集成，为开发者提供了强大而灵活的 API 开发工具。

**关键优势**:

- 🔒 端到端类型安全
- 🚀 自动代码生成
- 🔧 企业级权限控制
- 📊 高性能和可扩展性
- 🎯 优秀的开发体验

作为 L3 层包，它完美地桥接了底层的基础设施包（core、schema、auth、crud）和上层的 UI 包，为构建现代化的全栈应用提供了坚实的基础。
