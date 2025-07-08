# @linch-kit/trpc

类型安全的 API 层封装，基于 tRPC v11 构建，提供端到端类型安全、自动错误处理、中间件系统等功能。

## ✨ 特性

- 🎯 **端到端类型安全** - 从后端到前端的完整类型推导
- 🔐 **认证集成** - 内置 NextAuth.js 集成
- 🛡️ **权限中间件** - 自动权限验证
- 📊 **监控支持** - OpenTelemetry 集成
- ⚡ **性能优化** - 请求批处理和缓存
- 🔄 **实时通信** - WebSocket 支持

## 📦 安装

```bash
bun add @linch-kit/trpc
```

## 🚀 快速开始

### 服务端设置

```typescript
// server/trpc.ts
import { createTRPC } from '@linch-kit/trpc'
import { auth } from './auth'

// 创建 tRPC 实例
export const { router, procedure, middleware } = createTRPC({
  auth,
  errorHandler: (error, ctx) => {
    console.error('tRPC Error:', error)
  },
})

// 创建路由
export const appRouter = router({
  // 公开过程
  hello: procedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return `Hello ${input.name}`
  }),

  // 需要认证的过程
  user: router({
    profile: procedure
      .auth() // 要求认证
      .query(({ ctx }) => {
        return ctx.session.user
      }),

    update: procedure
      .auth()
      .permission('user:update') // 要求权限
      .input(UpdateUserSchema)
      .mutation(async ({ input, ctx }) => {
        return await updateUser(ctx.session.user.id, input)
      }),
  }),
})

export type AppRouter = typeof appRouter
```

### 客户端使用

```typescript
// client/trpc.ts
import { createTRPCClient } from '@linch-kit/trpc/client'
import type { AppRouter } from '../server/trpc'

export const trpc = createTRPCClient<AppRouter>({
  url: '/api/trpc',
})

// 在组件中使用
const { data, isLoading } = trpc.hello.useQuery({ name: 'World' })
const updateUser = trpc.user.update.useMutation()

// 调用 mutation
await updateUser.mutateAsync({
  name: 'New Name',
})
```

## 🔧 高级功能

### 自定义中间件

```typescript
import { middleware } from '@linch-kit/trpc'

// 速率限制中间件
const rateLimitMiddleware = middleware(async ({ ctx, next, path }) => {
  const key = `rate-limit:${ctx.session?.user.id || ctx.ip}:${path}`
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, 60) // 1分钟窗口
  }

  if (count > 100) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    })
  }

  return next()
})

// 使用中间件
const protectedProcedure = procedure.use(rateLimitMiddleware).auth()
```

### 批量查询

```typescript
// 自动批处理多个查询
const [user, posts, comments] = await Promise.all([
  trpc.user.get.query({ id: userId }),
  trpc.post.list.query({ authorId: userId }),
  trpc.comment.list.query({ userId }),
])

// 或使用 useQueries
const results = trpc.useQueries(t => [
  t.user.get({ id: userId }),
  t.post.list({ authorId: userId }),
])
```

### WebSocket 订阅

```typescript
// 服务端
const appRouter = router({
  onMessage: procedure.subscription(({ ctx }) => {
    return observable<Message>(emit => {
      const unsubscribe = messageEmitter.on('message', data => {
        if (canViewMessage(ctx.session.user, data)) {
          emit.next(data)
        }
      })

      return unsubscribe
    })
  }),
})

// 客户端
const { data } = trpc.onMessage.useSubscription(undefined, {
  onData: message => {
    console.log('New message:', message)
  },
})
```

### 错误处理

```typescript
import { TRPCError } from '@linch-kit/trpc'

// 自定义错误
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'User not found',
  cause: { userId },
})

// 全局错误处理
export const { router } = createTRPC({
  errorFormatter: ({ shape, error }) => {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.code === 'BAD_REQUEST' ? error.cause?.zodError : null,
      },
    }
  },
})
```

### 上下文扩展

```typescript
// 扩展上下文
export const createContext = async ({ req, res }) => {
  const session = await auth()
  const tenant = await getTenant(req)

  return {
    req,
    res,
    session,
    tenant,
    prisma,
    redis,
  }
}

// 在过程中使用
const tenantProcedure = procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Tenant context required',
    })
  }
  return next()
})
```

## 📚 API 参考

### 核心函数

- `createTRPC()` - 创建 tRPC 实例
- `router()` - 创建路由
- `procedure` - 创建过程
- `middleware()` - 创建中间件

### 内置中间件

- `.auth()` - 要求认证
- `.permission()` - 检查权限
- `.rateLimit()` - 速率限制
- `.validate()` - 输入验证
- `.cache()` - 响应缓存

### 客户端

- `createTRPCClient()` - 创建客户端
- `useQuery()` - 查询钩子
- `useMutation()` - 变更钩子
- `useSubscription()` - 订阅钩子
- `useInfiniteQuery()` - 无限查询

## 🤝 集成

- **tRPC v11** - 核心框架
- **@linch-kit/auth** - 认证集成
- **React Query** - 数据获取
- **Zod** - Schema 验证
- **OpenTelemetry** - 监控追踪

## 📄 许可证

MIT
