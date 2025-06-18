# tRPC 包实现计划

## 🎯 总体目标

创建一个类型安全、功能完整、易于使用的 tRPC 集成包，与 Linch Kit 生态系统深度集成。

## 📋 详细实施步骤

### 阶段 1: 基础设施修复 ✅ 已完成 (2024-12-18)

#### 1.1 修复 package.json 配置 ✅
- ✅ 更新了完整的 package.json 配置
- ✅ 添加了正确的依赖和 peerDependencies
- ✅ 配置了构建脚本和导出

#### 1.2 创建构建配置 ✅
- ✅ 创建了 tsup.config.ts 构建配置
- ✅ 创建了 tsconfig.json TypeScript 配置
- ✅ 配置了开发脚本

#### 1.3 修复导入错误 ✅
- ✅ 移除了 `@linch-kit/auth` 引用
- ✅ 创建了临时类型定义
- ✅ 修复了服务端导入问题

#### 1.4 遗留问题 🚨
- 🚨 客户端 `createTRPCReact` 函数名冲突
- 🚨 `trpc.createClient` 方法不存在错误

### 阶段 2: 核心类型系统 (今天 1-2小时)

#### 2.1 重新设计类型架构
```typescript
// src/types/context.ts
export interface BaseContext {
  user?: AuthUser | null
  session?: AuthSession | null
  permissions?: PermissionChecker
  tenant?: string | null
}

// src/types/router.ts  
export type AppRouter = Router<BaseContext>

// src/types/api.ts
export interface APIResponse<T = any> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}
```

#### 2.2 中间件类型定义
```typescript
// src/types/middleware.ts
export type MiddlewareFunction<TContext, TInput = any, TOutput = any> = (opts: {
  ctx: TContext
  input: TInput
  next: () => Promise<TOutput>
}) => Promise<TOutput>

export interface AuthMiddlewareOptions {
  required?: boolean
  roles?: string[]
  permissions?: string[]
}
```

### 阶段 3: 服务端核心功能 (明天 3-4小时)

#### 3.1 上下文创建器
```typescript
// src/server/context.ts
export async function createContext(opts: CreateContextOptions): Promise<BaseContext> {
  const session = await getSession(opts.req)
  const user = session?.user || null
  const tenant = extractTenant(opts.req)
  
  return {
    user,
    session,
    tenant,
    permissions: user ? await getPermissionChecker(user.id) : null
  }
}
```

#### 3.2 路由工具
```typescript
// src/server/router.ts
export function createTRPCRouter() {
  return initTRPC.context<BaseContext>().create({
    transformer: superjson,
    errorFormatter: formatError
  })
}

export const { router, procedure } = createTRPCRouter()
export const protectedProcedure = procedure.use(authMiddleware)
```

#### 3.3 中间件系统
```typescript
// src/middleware/auth.ts
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// src/middleware/permissions.ts
export const permissionMiddleware = (resource: string, action: string) =>
  middleware(async ({ ctx, next }) => {
    const hasPermission = await ctx.permissions?.hasPermission(
      ctx.user!.id, resource, action
    )
    if (!hasPermission) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next()
  })
```

### 阶段 4: 客户端核心功能 (明天 2-3小时)

#### 4.1 React 集成
```typescript
// src/client/react.tsx
export const trpc = createTRPCReact<AppRouter>()

export function TRPCProvider({ children, client }: TRPCProviderProps) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

#### 4.2 客户端配置
```typescript
// src/client/config.ts
export function createTRPCClient(options: TRPCClientOptions) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: options.url || '/api/trpc',
        transformer: superjson,
        headers: async () => {
          const token = await getAuthToken()
          return token ? { Authorization: `Bearer ${token}` } : {}
        }
      })
    ]
  })
}
```

#### 4.3 Next.js 集成
```typescript
// src/client/next.ts
export function withTRPC<TRouter extends AppRouter>(
  AppOrPage: NextComponentType<any, any, any>
) {
  return trpc.withTRPC({
    config: () => ({
      links: [
        httpBatchLink({
          url: getBaseUrl() + '/api/trpc'
        })
      ]
    }),
    ssr: true
  })(AppOrPage)
}
```

### 阶段 5: Auth Core 集成 (后天 2-3小时)

#### 5.1 权限中间件集成
```typescript
// src/integrations/auth-core.ts
export function createAuthIntegration(authConfig: AuthCoreConfig) {
  return {
    middleware: {
      auth: createAuthMiddleware(authConfig),
      permission: createPermissionMiddleware(authConfig.permissionChecker),
      tenant: createTenantMiddleware(authConfig.multiTenant)
    },
    context: createAuthContext(authConfig)
  }
}
```

#### 5.2 会话管理集成
```typescript
// 自动会话验证
export const sessionMiddleware = middleware(async ({ ctx, next }) => {
  const session = await validateSession(ctx.req)
  return next({ ctx: { ...ctx, session } })
})
```

### 阶段 6: Schema 集成 (后天 2-3小时)

#### 6.1 自动 CRUD 生成
```typescript
// src/integrations/schema.ts
export function createSchemaRouter<T extends Entity>(
  entity: T,
  options: SchemaRouterOptions = {}
) {
  return router({
    create: protectedProcedure
      .input(entity.createSchema)
      .output(entity.responseSchema)
      .mutation(async ({ input, ctx }) => {
        return await ctx.db[entity.tableName].create({ data: input })
      }),
    
    findMany: procedure
      .input(entity.querySchema)
      .output(z.array(entity.responseSchema))
      .query(async ({ input, ctx }) => {
        return await ctx.db[entity.tableName].findMany(input)
      })
  })
}
```

#### 6.2 类型自动生成
```typescript
// 从 Schema 实体自动推导 tRPC 类型
export type EntityRouter<T extends Entity> = {
  create: Procedure<T['createSchema'], T['responseSchema']>
  findMany: Procedure<T['querySchema'], T['responseSchema'][]>
  findById: Procedure<{ id: string }, T['responseSchema'] | null>
  update: Procedure<T['updateSchema'], T['responseSchema']>
  delete: Procedure<{ id: string }, { success: boolean }>
}
```

### 阶段 7: 错误处理和工具 (第4天 2小时)

#### 7.1 统一错误处理
```typescript
// src/utils/error.ts
export const formatError = ({ shape, error }: ErrorFormatterOptions) => ({
  ...shape,
  data: {
    ...shape.data,
    code: mapErrorCode(error.code),
    timestamp: new Date().toISOString(),
    traceId: generateTraceId(),
    details: error.cause
  }
})
```

#### 7.2 验证工具
```typescript
// src/utils/validation.ts
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return middleware(async ({ input, next }) => {
    const result = schema.safeParse(input)
    if (!result.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        cause: result.error
      })
    }
    return next({ input: result.data })
  })
}
```

### 阶段 8: 示例和文档 (第4天 2小时)

#### 8.1 基础使用示例
```typescript
// examples/basic-setup.ts
import { createTRPCRouter, createContext } from '@linch-kit/trpc'

const { router, procedure } = createTRPCRouter()

export const appRouter = router({
  hello: procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hello ${input.name}!`)
})
```

#### 8.2 完整集成示例
```typescript
// examples/full-integration.ts
import { createAuthIntegration } from '@linch-kit/trpc'
import { authConfig } from './auth-config'
import { UserEntity } from './schema'

const auth = createAuthIntegration(authConfig)
const userRouter = createSchemaRouter(UserEntity, {
  permissions: {
    create: 'user:create',
    read: 'user:read'
  }
})
```

## 🎯 验收标准

### 功能完整性
- ✅ 基础 tRPC 配置工作正常
- ✅ 与 auth-core 集成正常
- ✅ 与 schema 集成正常
- ✅ 中间件系统工作正常
- ✅ 错误处理统一

### 类型安全
- ✅ 100% TypeScript 覆盖
- ✅ 无 any 类型使用
- ✅ 端到端类型推导
- ✅ 编译时错误检查

### 开发体验
- ✅ 零配置启动
- ✅ 热重载支持
- ✅ 清晰的错误信息
- ✅ 完整的 IDE 支持

### 性能指标
- ✅ 包大小 < 50KB
- ✅ API 响应 < 100ms
- ✅ 树摇优化支持
- ✅ 懒加载支持

## 📅 时间安排

- **今天**: 阶段 1-2 (基础设施 + 类型系统)
- **明天**: 阶段 3-4 (服务端 + 客户端核心)
- **后天**: 阶段 5-6 (Auth Core + Schema 集成)
- **第4天**: 阶段 7-8 (错误处理 + 示例文档)

## 🚀 开始执行

现在开始执行阶段 1，修复基础设施问题！
