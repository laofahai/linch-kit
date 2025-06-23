# @linch-kit/trpc

🚀 **Linch Kit tRPC 包** - 类型安全的 tRPC 工具和集成，支持认证、权限控制和多租户。

## ✨ 核心特性

- 🔒 **端到端类型安全** - 完整的 TypeScript 类型推导和验证
- 🔐 **认证集成** - 内置 @linch-kit/auth 中间件支持
- 🛡️ **权限系统** - 细粒度权限控制和资源保护
- 🏢 **多租户支持** - 内置租户隔离和上下文管理
- ⚛️ **React 集成** - 无缝 React Query 集成和 Hooks
- 🔧 **中间件生态** - 丰富的中间件支持常见用例
- 🚨 **错误处理** - 标准化错误响应和追踪
- 🛠️ **开发体验** - 零配置设置和热重载支持
- 🔄 **CRUD 集成** - 自动生成 CRUD 路由和操作
- 📊 **Schema 集成** - 与 @linch-kit/schema 深度集成

## 📦 安装

```bash
pnpm add @linch-kit/trpc
# 或
npm install @linch-kit/trpc
```

### 对等依赖

```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
```

## 🚀 快速开始

### 1. 服务端设置

```typescript
import { z } from 'zod'
import {
  createTRPCRouter,
  router,
  procedure,
  protectedProcedure,
  adminProcedure,
  createContext
} from '@linch-kit/trpc'

// 创建路由
const appRouter = router({
  // 公开端点
  health: procedure
    .query(() => ({ status: 'ok', timestamp: new Date() })),

  hello: procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hello ${input.name}!`),

  // 需要认证的端点
  me: protectedProcedure
    .query(({ ctx }) => ({
      id: ctx.user!.id,
      name: ctx.user!.name,
      email: ctx.user!.email
    })),

  // 管理员端点
  users: adminProcedure
    .query(({ ctx }) => {
      // 只有管理员可以访问
      return ctx.db.user.findMany()
    })
})

export type AppRouter = typeof appRouter
```

### 2. 客户端设置 (React)

```typescript
import { createTrpcClient, trpc } from '@linch-kit/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 创建客户端
const trpcClient = createTrpcClient({
  url: '/api/trpc',
  headers: async () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      retry: 1
    }
  }
})

// App 组件
function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

// 在组件中使用
function MyComponent() {
  const { data, isLoading, error } = trpc.hello.useQuery({ name: 'World' })
  const { data: user } = trpc.me.useQuery()

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      // 刷新用户列表
      trpc.users.list.invalidate()
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <p>{data}</p>
      <p>Current user: {user?.name}</p>
    </div>
  )
}
```

### 3. Next.js API 路由

```typescript
// pages/api/trpc/[trpc].ts 或 app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../server/router'
import { createContext } from '@linch-kit/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext
  })

export { handler as GET, handler as POST }
```

## 🔐 Authentication & Permissions

### Basic Authentication

```typescript
import { protectedProcedure, createPermissionProcedure } from '@linch-kit/trpc'

const userRouter = router({
  // Requires authentication
  profile: protectedProcedure
    .query(({ ctx }) => ctx.user),

  // Requires specific permission
  create: createPermissionProcedure('user', 'create')
    .input(userCreateSchema)
    .mutation(({ input }) => createUser(input)),

  // Admin only
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => deleteUser(input.id))
})
```

### Custom Middleware

```typescript
import { middleware } from '@linch-kit/trpc'

const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  // Rate limiting logic
  await checkRateLimit(ctx.user?.id)
  return next()
})

const customProcedure = procedure.use(rateLimitMiddleware)
```

## 🏢 Multi-tenant Support

```typescript
import { tenantProcedure } from '@linch-kit/trpc'

const tenantRouter = router({
  data: tenantProcedure
    .query(({ ctx }) => {
      // ctx.tenant is guaranteed to exist
      return getTenantData(ctx.tenant)
    })
})
```

## 🛠️ Available Middleware

### Authentication Middleware
- `authMiddleware` - Basic authentication check
- `optionalAuthMiddleware` - Optional authentication
- `sessionMiddleware` - Session validation
- `adminAuthMiddleware` - Admin role required

### Permission Middleware
- `permissionMiddleware(resource, action)` - Permission check
- `roleMiddleware(roles)` - Role-based access
- `ownershipMiddleware(getOwnerId)` - Resource ownership
- `tenantPermissionMiddleware` - Tenant-scoped permissions

### Utility Middleware
- `rateLimitMiddleware` - Rate limiting
- `validationMiddleware(schema)` - Input validation
- `loggingMiddleware` - Request logging
- `inputSizeMiddleware(maxSize)` - Input size validation

## 📝 Error Handling

```typescript
import { TRPCError } from '@trpc/server'

const userRouter = router({
  get: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await findUser(input.id)
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }
      
      return user
    })
})
```

## 🔧 Configuration

### Context Configuration

```typescript
import { createContext } from '@linch-kit/trpc'

// Customize context creation
export async function createCustomContext(opts: CreateContextOptions) {
  const baseContext = await createContext(opts)
  
  return {
    ...baseContext,
    db: prisma, // Add database
    redis: redisClient // Add cache
  }
}
```

### Client Configuration

```typescript
const trpcClient = createTrpcClient({
  url: process.env.NEXT_PUBLIC_TRPC_URL,
  headers: async () => {
    const token = await getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
  fetch: customFetch
})
```

## 📚 Examples

See the [examples](./examples) directory for complete usage examples:

- [Basic Usage](./examples/basic-usage.ts) - Server setup and basic procedures
- [React Client](./examples/react-client.tsx) - React integration examples

## 🔗 Integration with Other Packages

### With @linch-kit/auth

```typescript
import { createAuthIntegration } from '@linch-kit/trpc'
import { authConfig } from './auth-config'

const auth = createAuthIntegration(authConfig)
// Automatic permission checking and session management
```

### With @linch-kit/schema

```typescript
import { createSchemaRouter } from '@linch-kit/trpc'
import { UserEntity } from './schema'

const userRouter = createSchemaRouter(UserEntity, {
  permissions: {
    create: 'user:create',
    read: 'user:read'
  }
})
```

## 📚 API 文档

### 核心函数

#### createTRPCRouter()

创建 tRPC 路由器：

```typescript
import { createTRPCRouter } from '@linch-kit/trpc'

const router = createTRPCRouter({
  // 路由定义
})
```

#### createContext(opts)

创建 tRPC 上下文：

```typescript
import { createContext } from '@linch-kit/trpc'

export const createTRPCContext = async (opts: CreateContextOptions) => {
  const context = await createContext(opts)
  return {
    ...context,
    // 自定义上下文
  }
}
```

#### createTrpcClient(options)

创建 tRPC 客户端：

```typescript
import { createTrpcClient } from '@linch-kit/trpc'

const client = createTrpcClient({
  url: string                    // API 端点 URL
  headers?: () => Record<string, string> | Promise<Record<string, string>>  // 请求头
  fetch?: typeof fetch           // 自定义 fetch 函数
  transformer?: any              // 数据转换器（默认 superjson）
})
```

### 预定义过程

#### procedure

基础过程，无认证要求：

```typescript
const publicEndpoint = procedure
  .input(z.object({ name: z.string() }))
  .query(({ input }) => `Hello ${input.name}`)
```

#### protectedProcedure

需要认证的过程：

```typescript
const protectedEndpoint = protectedProcedure
  .query(({ ctx }) => {
    // ctx.user 保证存在
    return { userId: ctx.user.id }
  })
```

#### adminProcedure

管理员专用过程：

```typescript
const adminEndpoint = adminProcedure
  .mutation(({ ctx }) => {
    // 只有管理员可以访问
    return performAdminAction()
  })
```

#### tenantProcedure

多租户过程：

```typescript
const tenantEndpoint = tenantProcedure
  .query(({ ctx }) => {
    // ctx.tenant 保证存在
    return getTenantData(ctx.tenant.id)
  })
```

### 中间件函数

#### authMiddleware

认证中间件：

```typescript
import { authMiddleware } from '@linch-kit/trpc'

const customProcedure = procedure.use(authMiddleware)
```

#### permissionMiddleware

权限检查中间件：

```typescript
import { permissionMiddleware } from '@linch-kit/trpc'

const permissionProcedure = procedure.use(
  permissionMiddleware('users', 'read')
)
```

#### createPermissionMiddleware

创建权限中间件：

```typescript
import { createPermissionMiddleware } from '@linch-kit/trpc'

const customPermissionMiddleware = createPermissionMiddleware({
  resource: 'posts',
  action: 'create',
  roles: ['admin', 'editor'],
  permissions: ['posts:create']
})
```

### 类型工具

#### RouterInputs<T>

推导路由输入类型：

```typescript
import type { RouterInputs } from '@linch-kit/trpc'

type HelloInput = RouterInputs['hello']
// { name: string }
```

#### RouterOutputs<T>

推导路由输出类型：

```typescript
import type { RouterOutputs } from '@linch-kit/trpc'

type HelloOutput = RouterOutputs['hello']
// string
```

#### BaseContext

基础上下文接口：

```typescript
interface BaseContext {
  user?: User                    // 当前用户
  session?: Session              // 用户会话
  tenant?: Tenant                // 当前租户
  permissionChecker?: PermissionChecker  // 权限检查器
  req: Request                   // HTTP 请求
  res: Response                  // HTTP 响应
}
```

## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 测试
pnpm test
```

## 📋 变更日志

### v0.1.0 (2024-06-21)

**新增功能**
- ✨ 完整的 tRPC 服务端和客户端工具
- ✨ 认证和权限中间件系统
- ✨ 多租户支持和上下文管理
- ✨ React Query 集成和 Hooks
- ✨ 标准化错误处理和追踪
- ✨ CRUD 操作自动生成
- ✨ Schema 集成和类型安全

**中间件支持**
- 🔐 认证中间件（基础、可选、管理员）
- 🛡️ 权限中间件（资源、角色、所有权）
- 🏢 多租户中间件
- 🔧 工具中间件（限流、验证、日志）

**技术特性**
- 🔒 端到端类型安全
- 🚀 零配置设置
- 📦 最小化依赖
- 🛠️ 丰富的开发工具

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/laofahai/linch-kit)
- [AI 上下文文档](../../ai-context/packages/trpc.md)
- [@linch-kit/auth](../auth/README.md)
- [@linch-kit/crud](../crud/README.md)
- [@linch-kit/schema](../schema/README.md)
- [tRPC 官方文档](https://trpc.io/docs)
- [示例项目](../../apps/starter)
