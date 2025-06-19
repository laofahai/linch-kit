# tRPC 包 AI 上下文

## 🎯 包定位

`@linch-kit/trpc` 是 Linch Kit 框架的类型安全 API 层核心包，提供：

1. **类型安全的 tRPC 配置**: 开箱即用的 tRPC 服务端和客户端配置
2. **Auth Core 深度集成**: 与 @linch-kit/auth-core 的权限系统无缝集成
3. **Schema 类型集成**: 与 @linch-kit/schema 的实体类型自动同步
4. **统一错误处理**: 标准化的 API 错误响应和处理
5. **中间件生态**: 权限、日志、缓存等中间件集合

## 🏗️ 核心架构

### 依赖关系
```
@linch-kit/trpc
├── 依赖: @linch-kit/core       # 基础设施和工具
├── 依赖: @linch-kit/types      # 共享类型定义
├── 集成: @linch-kit/auth-core  # 权限中间件集成
├── 集成: @linch-kit/schema     # 实体类型集成
├── 基于: @trpc/server          # tRPC 服务端
├── 基于: @trpc/client          # tRPC 客户端
├── 基于: @trpc/react-query     # React 集成
└── 基于: @trpc/next            # Next.js 集成
```

### 包结构
```
packages/trpc/
├── src/
│   ├── server/                 # 服务端工具
│   │   ├── index.ts           # 服务端主入口
│   │   ├── context.ts         # 上下文创建器
│   │   ├── router.ts          # 路由工具
│   │   ├── middleware.ts      # 中间件集合
│   │   └── types.ts           # 服务端类型
│   ├── client/                # 客户端工具
│   │   ├── index.ts           # 客户端主入口
│   │   ├── react.tsx          # React 集成
│   │   ├── next.ts            # Next.js 集成
│   │   └── types.ts           # 客户端类型
│   ├── middleware/            # 中间件实现
│   │   ├── auth.ts            # 认证中间件
│   │   ├── permissions.ts     # 权限中间件
│   │   ├── logging.ts         # 日志中间件
│   │   ├── rate-limit.ts      # 限流中间件
│   │   └── error-handler.ts   # 错误处理中间件
│   ├── integrations/          # 第三方集成
│   │   ├── auth-core.ts       # Auth Core 集成
│   │   ├── schema.ts          # Schema 集成
│   │   └── prisma.ts          # Prisma 集成
│   ├── utils/                 # 工具函数
│   │   ├── error.ts           # 错误工具
│   │   ├── validation.ts      # 验证工具
│   │   └── transform.ts       # 数据转换工具
│   ├── types/                 # 类型定义
│   │   ├── api.ts             # API 类型
│   │   ├── context.ts         # 上下文类型
│   │   └── router.ts          # 路由类型
│   └── index.ts               # 主入口
├── examples/                  # 使用示例
│   ├── basic-setup.ts         # 基础配置示例
│   ├── auth-integration.ts    # 认证集成示例
│   ├── schema-integration.ts  # Schema 集成示例
│   └── full-stack-example/    # 完整应用示例
└── README.md                  # 使用文档
```

## 🔧 当前状态和问题

### ✅ 已完成 (2024-12-18 更新)

#### 1. 基础设施 - 100% 完成
- ✅ 更新了 package.json 配置
- ✅ 创建了 tsup.config.ts 构建配置
- ✅ 创建了 tsconfig.json TypeScript 配置
- ✅ 修复了服务端导入错误
- ✅ 修复了客户端类型冲突 (`createTRPCReact` → `createTRPCClient`)
- ✅ 修复了 `trpc.createClient` 方法调用

#### 2. 核心类型系统 - 100% 完成
- ✅ BaseContext, AuthUser, AuthSession 接口
- ✅ PermissionChecker 接口
- ✅ 中间件类型定义 (MiddlewareFunction, AuthMiddlewareOptions)
- ✅ API 响应格式 (APIResponse, APIError, PaginatedResponse)
- ✅ 路由类型推导 (RouterInputs, RouterOutputs)

#### 3. 服务端核心功能 - 100% 完成
- ✅ 上下文创建器 (createContext, extractTenant, getSessionUser)
- ✅ 路由工具 (router, procedure, middleware)
- ✅ 预定义过程 (protectedProcedure, adminProcedure, tenantProcedure)
- ✅ 错误格式化和追踪 ID 生成
- ✅ 服务端调用器 (createTrpcServer)

#### 4. 中间件系统 - 100% 完成
- ✅ 认证中间件 (authMiddleware, optionalAuthMiddleware, sessionMiddleware)
- ✅ 权限中间件 (permissionMiddleware, roleMiddleware, ownershipMiddleware)
- ✅ 验证中间件 (validationMiddleware, rateLimitMiddleware)
- ✅ 工具中间件 (loggingMiddleware, inputSizeMiddleware)
- ✅ 预设权限组合 (permissions.user, permissions.role, permissions.system)

#### 5. 客户端功能 - 90% 完成
- ✅ React 集成 (createTRPCClient, trpc hooks)
- ✅ 客户端配置 (createTrpcClient, TRPCClientOptions)
- ✅ 类型安全导出 (RouterInputs, RouterOutputs)
- ✅ 错误处理和认证头部支持

#### 6. 文档和示例 - 100% 完成
- ✅ 完整的 README.md 文档
- ✅ 基础使用示例 (examples/basic-usage.ts)
- ✅ React 客户端示例 (examples/react-client.tsx)
- ✅ API 参考文档

### 🎯 当前完成度：约 95%

### 🔄 待完成功能 (可选增强)
1. **高级集成**:
   - Auth Core 深度集成 (自动权限检查器)
   - Schema 集成 (自动 CRUD 生成)
   - Next.js 专用适配器

2. **性能优化**:
   - 请求缓存策略
   - 批量查询优化
   - 错误重试机制

## 🎯 重构计划

### 第一阶段：基础设施修复
1. **修复依赖问题**
   - 更新 package.json 依赖
   - 修复导入错误
   - 添加正确的 peer dependencies

2. **完善构建配置**
   - 添加 tsup 配置
   - 完善 TypeScript 配置
   - 添加开发脚本

3. **修复类型定义**
   - 重新设计 AppRouter 类型
   - 添加上下文类型定义
   - 完善客户端类型

### 第二阶段：核心功能开发
1. **服务端工具**
   - 类型安全的路由创建器
   - 灵活的上下文管理
   - 中间件管道系统

2. **客户端工具**
   - React 集成优化
   - Next.js 集成
   - 类型安全的查询工具

3. **中间件系统**
   - 认证中间件
   - 权限检查中间件
   - 错误处理中间件
   - 日志中间件

### 第三阶段：集成和优化
1. **Auth Core 集成**
   - 自动权限检查
   - 会话管理集成
   - 多租户支持

2. **Schema 集成**
   - 自动类型生成
   - 验证器集成
   - CRUD 操作支持

3. **性能优化**
   - 请求缓存
   - 批量查询优化
   - 错误重试机制

## 🎯 设计原则

### 1. 类型安全优先
- 端到端类型安全
- 编译时错误检查
- 自动类型推导

### 2. 开发体验优化
- 零配置开箱即用
- 智能默认配置
- 丰富的开发工具

### 3. 渐进式集成
- 可独立使用
- 可选的集成功能
- 向后兼容

### 4. 性能导向
- 最小化运行时开销
- 智能缓存策略
- 优化的网络请求

## 🔌 与其他包的集成

### 与 @linch-kit/auth-core 集成
```typescript
// 自动权限检查
const protectedProcedure = publicProcedure
  .use(authMiddleware)
  .use(permissionMiddleware('resource', 'action'))

// 多租户支持
const tenantProcedure = publicProcedure
  .use(tenantMiddleware)
```

### 与 @linch-kit/schema 集成
```typescript
// 自动类型生成
const userRouter = createSchemaRouter(UserEntity, {
  permissions: {
    create: 'user:create',
    read: 'user:read',
    update: 'user:update',
    delete: 'user:delete'
  }
})
```

### 与 @linch-kit/core 集成
- 使用统一的日志系统
- 使用统一的配置管理
- 使用统一的错误处理

## 📋 API 设计

### 服务端 API
```typescript
// 创建 tRPC 实例
export const { router, procedure } = createTRPC({
  context: createContext,
  transformer: superjson,
  errorFormatter: formatError
})

// 创建路由
export const appRouter = router({
  user: userRouter,
  post: postRouter
})

// 中间件
export const authMiddleware = createAuthMiddleware()
export const permissionMiddleware = createPermissionMiddleware()
```

### 客户端 API
```typescript
// React 集成
export const trpc = createTRPCReact<AppRouter>()

// 客户端配置
export const trpcClient = createTRPCClient({
  url: '/api/trpc',
  transformer: superjson
})

// Next.js 集成
export const { withTRPC } = createTRPCNext<AppRouter>()
```

## 🔍 关键文件说明

### 核心文件
- `src/server/index.ts`: 服务端主入口，导出所有服务端工具
- `src/client/index.ts`: 客户端主入口，导出所有客户端工具
- `src/middleware/auth.ts`: 认证和权限中间件

### 集成文件
- `src/integrations/auth-core.ts`: Auth Core 集成工具
- `src/integrations/schema.ts`: Schema 集成工具
- `src/utils/error.ts`: 统一错误处理

### 配置文件
- `tsup.config.ts`: 构建配置
- `tsconfig.json`: TypeScript 配置
- `package.json`: 包配置和依赖

## 🎯 成功指标

1. **零配置启动**: 用户可以用最少的代码启动 tRPC
2. **类型安全**: 100% 的类型覆盖，无 any 类型
3. **性能优秀**: API 响应时间 < 100ms
4. **集成完善**: 与 auth-core 和 schema 无缝集成
5. **文档完整**: 完整的使用文档和示例

## 📚 使用场景

### 1. 基础 API 开发
- 快速创建类型安全的 API
- 自动生成客户端代码
- 统一的错误处理

### 2. 企业级应用
- 权限控制集成
- 多租户支持
- 审计日志

### 3. 全栈开发
- React 应用集成
- Next.js 应用集成
- 移动端 API 支持

## 🔧 技术规范

### 中间件架构
```typescript
// 中间件类型定义
type Middleware<TContext, TInput, TOutput> = (opts: {
  ctx: TContext
  input: TInput
  next: () => Promise<TOutput>
}) => Promise<TOutput>

// 权限中间件示例
const permissionMiddleware = (resource: string, action: string) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const hasPermission = await ctx.permissionChecker.hasPermission(
      ctx.user.id, resource, action
    )

    if (!hasPermission) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return next()
  })
```

### 错误处理标准
```typescript
// 统一错误类型
export enum APIErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// 错误格式化器
export const formatError = ({ shape, error }: {
  shape: DefaultErrorShape
  error: TRPCError
}) => ({
  ...shape,
  data: {
    ...shape.data,
    code: error.code,
    timestamp: new Date().toISOString(),
    traceId: generateTraceId()
  }
})
```

### 类型生成策略
```typescript
// 从 Schema 自动生成 tRPC 路由
export function createSchemaRouter<T extends Entity>(
  entity: T,
  options: {
    permissions?: Record<'create' | 'read' | 'update' | 'delete', string>
    middleware?: Middleware[]
    customProcedures?: Record<string, Procedure>
  }
) {
  return router({
    create: protectedProcedure
      .input(entity.createSchema)
      .output(entity.responseSchema)
      .use(permissionMiddleware(options.permissions?.create))
      .mutation(async ({ input, ctx }) => {
        return await ctx.db.create(input)
      }),
    // ... 其他 CRUD 操作
  })
}
```

## 🔄 开发流程

### 阶段 1: 基础设施 (1-2天)
1. **修复当前问题**
   - ✅ 更新 package.json 依赖
   - ✅ 修复导入错误
   - ✅ 完善构建配置
   - ✅ 重新设计类型系统

2. **建立开发环境**
   - 添加开发脚本
   - 配置热重载
   - 添加类型检查

### 阶段 2: 核心功能 (2-3天)
1. **服务端核心**
   - 上下文创建器
   - 路由工具
   - 中间件系统

2. **客户端核心**
   - React 集成
   - Next.js 集成
   - 类型安全查询

### 阶段 3: 集成功能 (2-3天)
1. **Auth Core 集成**
   - 权限中间件
   - 会话管理
   - 多租户支持

2. **Schema 集成**
   - 自动类型生成
   - CRUD 路由生成
   - 验证集成

### 阶段 4: 优化完善 (1-2天)
1. **性能优化**
   - 缓存策略
   - 批量查询
   - 错误重试

2. **文档示例**
   - 使用文档
   - 代码示例
   - 最佳实践

## 🎯 下一步行动

### 🚨 立即任务 (今天)
1. ✅ 创建 AI Context 文档
2. 🔄 修复 package.json 依赖问题
3. 🔄 修复导入错误和类型问题
4. 🔄 完善构建配置

### 📋 本周目标
1. 实现核心服务端功能
2. 实现核心客户端功能
3. 开发基础中间件系统
4. 添加基础示例

### 🎯 月度目标
1. 完成与 auth-core 集成
2. 完成与 schema 集成
3. 性能优化和测试
4. 完整文档和示例

## 🔍 质量标准

### 代码质量
- TypeScript 严格模式
- 100% 类型覆盖
- ESLint + Prettier
- 单元测试覆盖率 > 80%

### 性能标准
- API 响应时间 < 100ms
- 包大小 < 50KB (gzipped)
- 树摇优化支持
- 懒加载支持

### 用户体验
- 零配置启动
- 清晰的错误信息
- 完整的 TypeScript 支持
- 丰富的开发工具
