# @linch-kit/trpc 实现指南

## 概述

@linch-kit/trpc 是 LinchKit 的 API 层包，提供端到端类型安全的 API 开发体验。基于 tRPC 11 构建，集成认证、权限、CRUD 操作和实时通信。

## 核心实现

### 1. 核心导出

```typescript
// src/index.ts
export * from './server';
export * from './client';
export * from './context';
export * from './middleware';
export * from './types';
export * from './utils';

// 主要导出
export { 
  // 服务端
  createLinchKitRouter,
  createLinchKitContext,
  
  // 客户端
  createLinchKitClient,
  createLinchKitUtils,
  
  // 中间件
  authMiddleware,
  permissionMiddleware,
  rateLimitMiddleware,
  metricsMiddleware,
  
  // 类型
  LinchKitRouter,
  LinchKitContext,
  LinchKitMeta
} from './main';
```

### 2. 上下文创建

```typescript
// src/context.ts
import { CreateContextOptions } from '@trpc/server';
import { auth } from '@linch-kit/auth';
import { core } from '@linch-kit/core';

export interface LinchKitContext {
  // 用户认证
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  
  // 租户信息
  tenant?: {
    id: string;
    name: string;
    plan: string;
  };
  
  // 请求信息
  request: {
    id: string;
    ip: string;
    userAgent: string;
    startTime: number;
  };
  
  // 数据库连接
  db: any;
  
  // 服务实例
  services: {
    auth: typeof auth;
    core: typeof core;
  };
}

export const createLinchKitContext = async (
  opts: CreateContextOptions
): Promise<LinchKitContext> => {
  const { req, res } = opts;
  
  // 生成请求ID
  const requestId = core.utils.generateId();
  
  // 解析认证信息
  const authResult = await auth.parseRequest(req);
  
  // 创建上下文
  const context: LinchKitContext = {
    user: authResult.user,
    tenant: authResult.tenant,
    request: {
      id: requestId,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
      startTime: Date.now()
    },
    db: core.database.getConnection(),
    services: {
      auth,
      core
    }
  };
  
  // 设置响应头
  res.setHeader('X-Request-ID', requestId);
  
  return context;
};
```

### 3. 中间件系统

```typescript
// src/middleware/auth.ts
import { TRPCError } from '@trpc/server';
import { middleware } from '../base';

export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '需要登录'
    });
  }
  
  return next();
});

// src/middleware/permission.ts
export const permissionMiddleware = (permission: string) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user?.permissions.includes(permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `缺少权限: ${permission}`
      });
    }
    
    return next();
  });

// src/middleware/rate-limit.ts
export const rateLimitMiddleware = (options: {
  windowMs: number;
  maxRequests: number;
}) =>
  middleware(async ({ ctx, next }) => {
    const key = `rate_limit:${ctx.user?.id || ctx.request.ip}`;
    
    const current = await ctx.services.core.cache.get(key);
    if (current && current >= options.maxRequests) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: '请求过于频繁'
      });
    }
    
    await ctx.services.core.cache.increment(key, {
      ttl: options.windowMs
    });
    
    return next();
  });

// src/middleware/metrics.ts
export const metricsMiddleware = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    
    // 记录成功指标
    ctx.services.core.metrics.increment('trpc_requests_total', {
      path,
      type,
      status: 'success'
    });
    
    ctx.services.core.metrics.histogram('trpc_request_duration', 
      Date.now() - start, { path, type }
    );
    
    return result;
  } catch (error) {
    // 记录错误指标
    ctx.services.core.metrics.increment('trpc_requests_total', {
      path,
      type,
      status: 'error'
    });
    
    throw error;
  }
});
```

### 4. 路由创建

```typescript
// src/server.ts
import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import { LinchKitContext } from './context';

const t = initTRPC.context<LinchKitContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError 
          ? error.cause.flatten() 
          : null,
        requestId: error.cause?.requestId
      }
    };
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;

// 认证过程
export const protectedProcedure = t.procedure
  .use(authMiddleware);

// 权限过程
export const permissionProcedure = (permission: string) =>
  protectedProcedure.use(permissionMiddleware(permission));

// 创建 LinchKit 路由器
export const createLinchKitRouter = () => {
  return router({
    // 健康检查
    health: publicProcedure
      .query(() => ({ status: 'ok', timestamp: Date.now() })),
    
    // 用户路由
    user: router({
      me: protectedProcedure
        .query(({ ctx }) => ctx.user),
      
      update: protectedProcedure
        .input(z.object({
          name: z.string().optional(),
          email: z.string().email().optional()
        }))
        .mutation(async ({ ctx, input }) => {
          return await ctx.services.auth.updateUser(ctx.user.id, input);
        })
    }),
    
    // CRUD 路由
    crud: router({
      create: permissionProcedure('create')
        .input(z.object({
          table: z.string(),
          data: z.record(z.unknown())
        }))
        .mutation(async ({ ctx, input }) => {
          return await ctx.services.core.crud.create(
            input.table, 
            input.data,
            ctx.user
          );
        }),
      
      read: permissionProcedure('read')
        .input(z.object({
          table: z.string(),
          id: z.string()
        }))
        .query(async ({ ctx, input }) => {
          return await ctx.services.core.crud.findById(
            input.table,
            input.id,
            ctx.user
          );
        })
    })
  });
};
```

### 5. 客户端创建

```typescript
// src/client.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { LinchKitRouter } from './server';

export interface LinchKitClientOptions {
  url: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export const createLinchKitClient = (options: LinchKitClientOptions) => {
  return createTRPCProxyClient<LinchKitRouter>({
    links: [
      httpBatchLink({
        url: options.url,
        headers: options.headers,
        fetch: options.fetch
      })
    ]
  });
};

// React 客户端
export const createLinchKitReactClient = (options: LinchKitClientOptions) => {
  return createTRPCReact<LinchKitRouter>();
};
```

### 6. 实时通信

```typescript
// src/subscription.ts
import { EventEmitter } from 'events';
import { observable } from '@trpc/server/observable';

export class LinchKitSubscription extends EventEmitter {
  private rooms = new Map<string, Set<string>>();
  
  // 加入房间
  joinRoom(userId: string, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(userId);
    
    this.emit('user-joined', { userId, room });
  }
  
  // 离开房间
  leaveRoom(userId: string, room: string) {
    const roomUsers = this.rooms.get(room);
    if (roomUsers) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.rooms.delete(room);
      }
    }
    
    this.emit('user-left', { userId, room });
  }
  
  // 广播消息
  broadcast(room: string, data: any) {
    this.emit(`room:${room}`, data);
  }
}

// 订阅路由
export const subscriptionRouter = router({
  onUserJoined: protectedProcedure
    .input(z.object({ room: z.string() }))
    .subscription(({ ctx, input }) => {
      return observable<{ userId: string; room: string }>((emit) => {
        const handler = (data: { userId: string; room: string }) => {
          if (data.room === input.room) {
            emit.next(data);
          }
        };
        
        ctx.services.core.subscription.on('user-joined', handler);
        
        return () => {
          ctx.services.core.subscription.off('user-joined', handler);
        };
      });
    }),
  
  onMessage: protectedProcedure
    .input(z.object({ room: z.string() }))
    .subscription(({ ctx, input }) => {
      return observable<any>((emit) => {
        const handler = (data: any) => {
          emit.next(data);
        };
        
        ctx.services.core.subscription.on(`room:${input.room}`, handler);
        
        return () => {
          ctx.services.core.subscription.off(`room:${input.room}`, handler);
        };
      });
    })
});
```

### 7. 类型定义

```typescript
// src/types.ts
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { LinchKitRouter } from './server';

export type LinchKitRouterInputs = inferRouterInputs<LinchKitRouter>;
export type LinchKitRouterOutputs = inferRouterOutputs<LinchKitRouter>;

export interface LinchKitMeta {
  // 权限要求
  permissions?: string[];
  
  // 速率限制
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  
  // 缓存设置
  cache?: {
    ttl: number;
    key?: string;
  };
  
  // 日志级别
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// 过程构建器
export interface LinchKitProcedureBuilder {
  input<T>(schema: z.ZodType<T>): LinchKitProcedureBuilder;
  output<T>(schema: z.ZodType<T>): LinchKitProcedureBuilder;
  meta(meta: LinchKitMeta): LinchKitProcedureBuilder;
  query<T>(handler: (opts: { ctx: LinchKitContext; input: T }) => Promise<any>): any;
  mutation<T>(handler: (opts: { ctx: LinchKitContext; input: T }) => Promise<any>): any;
  subscription<T>(handler: (opts: { ctx: LinchKitContext; input: T }) => any): any;
}
```

### 8. 工具函数

```typescript
// src/utils.ts
import { TRPCError } from '@trpc/server';

export const createLinchKitUtils = () => {
  return {
    // 错误处理
    handleError(error: unknown): TRPCError {
      if (error instanceof TRPCError) {
        return error;
      }
      
      if (error instanceof Error) {
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error
        });
      }
      
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '未知错误'
      });
    },
    
    // 输入验证
    validateInput<T>(schema: z.ZodType<T>, input: unknown): T {
      try {
        return schema.parse(input);
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '输入验证失败',
          cause: error
        });
      }
    },
    
    // 权限检查
    checkPermission(userPermissions: string[], required: string[]): boolean {
      return required.every(permission => 
        userPermissions.includes(permission)
      );
    },
    
    // 分页处理
    paginate<T>(items: T[], page: number, limit: number) {
      const offset = (page - 1) * limit;
      return {
        items: items.slice(offset, offset + limit),
        pagination: {
          page,
          limit,
          total: items.length,
          pages: Math.ceil(items.length / limit)
        }
      };
    }
  };
};
```

## 集成说明

### 1. 依赖层次

```
@linch-kit/trpc 依赖:
├── @linch-kit/core (基础设施)
├── @linch-kit/auth (认证权限)
└── @linch-kit/crud (CRUD操作)
```

### 2. 关键集成点

- **认证集成**: 使用 `@linch-kit/auth` 解析和验证用户身份
- **权限集成**: 集成 RBAC/ABAC 权限检查
- **CRUD集成**: 提供类型安全的 CRUD API
- **指标集成**: 使用 `@linch-kit/core` 的指标系统

### 3. 性能优化

- **批量请求**: 支持 HTTP 批量请求
- **响应缓存**: 集成缓存中间件
- **连接池**: 数据库连接池管理
- **压缩**: HTTP 响应压缩

## 测试要求

### 1. 单元测试

```typescript
// tests/unit/middleware.test.ts
describe('authMiddleware', () => {
  it('应该允许已认证用户通过', async () => {
    const ctx = { user: { id: '1', permissions: [] } };
    const next = jest.fn().mockResolvedValue('success');
    
    const result = await authMiddleware({ ctx, next });
    
    expect(result).toBe('success');
    expect(next).toHaveBeenCalled();
  });
  
  it('应该拒绝未认证用户', async () => {
    const ctx = { user: null };
    const next = jest.fn();
    
    await expect(authMiddleware({ ctx, next }))
      .rejects.toThrow('UNAUTHORIZED');
  });
});
```

### 2. 集成测试

```typescript
// tests/integration/router.test.ts
describe('LinchKit Router', () => {
  let client: ReturnType<typeof createLinchKitClient>;
  
  beforeEach(() => {
    client = createLinchKitClient({
      url: 'http://localhost:3000/trpc'
    });
  });
  
  it('应该返回健康检查', async () => {
    const result = await client.health.query();
    expect(result.status).toBe('ok');
  });
  
  it('应该要求认证访问用户信息', async () => {
    await expect(client.user.me.query())
      .rejects.toThrow('UNAUTHORIZED');
  });
});
```

### 3. E2E 测试

```typescript
// tests/e2e/api.test.ts
describe('API End-to-End', () => {
  it('应该完成完整的 CRUD 流程', async () => {
    // 1. 创建用户
    const user = await client.auth.register.mutate({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // 2. 创建数据
    const item = await client.crud.create.mutate({
      table: 'items',
      data: { name: 'Test Item' }
    });
    
    // 3. 读取数据
    const retrieved = await client.crud.read.query({
      table: 'items',
      id: item.id
    });
    
    expect(retrieved.name).toBe('Test Item');
  });
});
```

## 部署配置

### 1. 环境变量

```bash
# tRPC 配置
TRPC_ENDPOINT=/trpc
TRPC_BATCH_ENABLED=true
TRPC_COMPRESSION=true

# 限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 缓存配置
CACHE_TTL=300
CACHE_ENABLED=true
```

### 2. 监控指标

- `trpc_requests_total`: 请求总数
- `trpc_request_duration`: 请求耗时
- `trpc_errors_total`: 错误总数
- `trpc_active_connections`: 活跃连接数

### 3. 日志格式

```json
{
  "level": "info",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123",
  "userId": "user_456",
  "procedure": "user.me",
  "duration": 123,
  "status": "success"
}
```

## 最佳实践

1. **类型安全**: 始终使用 Zod 进行输入验证
2. **错误处理**: 提供清晰的错误信息和状态码
3. **性能优化**: 使用批量请求和缓存
4. **安全性**: 实施认证、权限和速率限制
5. **可观测性**: 记录指标、日志和追踪
6. **文档**: 为所有 API 提供完整文档

这个实现指南提供了构建 @linch-kit/trpc 包的完整框架，确保端到端类型安全和企业级功能。