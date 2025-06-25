# @linch-kit/trpc 集成示例

## 基础集成

### 1. Next.js 集成

```typescript
// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { createLinchKitContext, createLinchKitRouter } from '@linch-kit/trpc';

const appRouter = createLinchKitRouter();

export default createNextApiHandler({
  router: appRouter,
  createContext: createLinchKitContext,
  onError: ({ error, path, input }) => {
    console.error(`tRPC Error on ${path}:`, error);
  }
});

export type AppRouter = typeof appRouter;
```

```typescript
// lib/trpc.ts
import { createTRPCNext } from '@trpc/next';
import { AppRouter } from '../pages/api/trpc/[trpc]';

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              authorization: getAuthToken()
            };
          }
        })
      ]
    };
  },
  ssr: true
});
```

```typescript
// pages/_app.tsx
import { trpc } from '../lib/trpc';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default trpc.withTRPC(MyApp);
```

### 2. Express 集成

```typescript
// server.ts
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createLinchKitContext, createLinchKitRouter } from '@linch-kit/trpc';

const app = express();
const router = createLinchKitRouter();

app.use('/api/trpc', 
  createExpressMiddleware({
    router,
    createContext: createLinchKitContext
  })
);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### 3. React 客户端集成

```typescript
// hooks/useLinchKit.ts
import { createTRPCReact } from '@trpc/react-query';
import { AppRouter } from '../server/router';

export const trpc = createTRPCReact<AppRouter>();

// providers/TrpcProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../hooks/useLinchKit';

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers() {
        return {
          authorization: `Bearer ${localStorage.getItem('token')}`
        };
      }
    })
  ]
});

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## 认证集成

### 1. JWT 认证

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

export const jwtAuthMiddleware = middleware(async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '缺少认证令牌'
    });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // 获取用户信息
    const user = await ctx.services.auth.getUserById(payload.sub);
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '用户不存在'
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        user
      }
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '无效的认证令牌'
    });
  }
});
```

### 2. Session 认证

```typescript
// middleware/session.ts
import session from 'express-session';

export const sessionAuthMiddleware = middleware(async ({ ctx, next }) => {
  const sessionId = ctx.req.session?.userId;
  
  if (!sessionId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '未登录'
    });
  }
  
  const user = await ctx.services.auth.getUserById(sessionId);
  
  return next({
    ctx: {
      ...ctx,
      user
    }
  });
});
```

### 3. OAuth 集成

```typescript
// routes/auth.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const authRouter = router({
  // OAuth 登录
  oauth: publicProcedure
    .input(z.object({
      provider: z.enum(['google', 'github', 'microsoft']),
      code: z.string(),
      state: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.auth.oauth.exchange({
        provider: input.provider,
        code: input.code,
        state: input.state
      });
      
      return {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      };
    }),
  
  // 刷新令牌
  refresh: publicProcedure
    .input(z.object({
      refreshToken: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.auth.refreshToken(input.refreshToken);
    }),
  
  // 登出
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.services.auth.logout(ctx.user.id);
      return { success: true };
    })
});
```

## CRUD 集成

### 1. 通用 CRUD 路由

```typescript
// routes/crud.ts
export const crudRouter = router({
  // 创建记录
  create: protectedProcedure
    .input(z.object({
      table: z.string(),
      data: z.record(z.unknown()),
      options: z.object({
        validate: z.boolean().default(true),
        skipHooks: z.boolean().default(false)
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // 权限检查
      await ctx.services.auth.checkPermission(
        ctx.user,
        `${input.table}:create`
      );
      
      // 数据验证
      if (input.options?.validate !== false) {
        const schema = await ctx.services.core.schema.getSchema(input.table);
        await schema.validate(input.data);
      }
      
      // 创建记录
      const result = await ctx.services.crud.create(
        input.table,
        input.data,
        {
          user: ctx.user,
          skipHooks: input.options?.skipHooks
        }
      );
      
      return result;
    }),
  
  // 查询记录
  find: protectedProcedure
    .input(z.object({
      table: z.string(),
      where: z.record(z.unknown()).optional(),
      select: z.array(z.string()).optional(),
      include: z.record(z.boolean()).optional(),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      skip: z.number().optional(),
      take: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      await ctx.services.auth.checkPermission(
        ctx.user,
        `${input.table}:read`
      );
      
      return await ctx.services.crud.find(input.table, {
        ...input,
        user: ctx.user
      });
    }),
  
  // 批量操作
  batch: protectedProcedure
    .input(z.object({
      operations: z.array(z.object({
        type: z.enum(['create', 'update', 'delete']),
        table: z.string(),
        data: z.record(z.unknown()).optional(),
        where: z.record(z.unknown()).optional()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const op of input.operations) {
        await ctx.services.auth.checkPermission(
          ctx.user,
          `${op.table}:${op.type}`
        );
        
        const result = await ctx.services.crud[op.type](
          op.table,
          op.data || op.where,
          { user: ctx.user }
        );
        
        results.push(result);
      }
      
      return results;
    })
});
```

### 2. Schema 驱动的 CRUD

```typescript
// routes/schema-crud.ts
export const schemaCrudRouter = router({
  // 根据 Schema 生成 CRUD
  generate: protectedProcedure
    .input(z.object({
      schemaId: z.string(),
      operations: z.array(z.enum(['create', 'read', 'update', 'delete'])).optional()
    }))
    .query(async ({ ctx, input }) => {
      const schema = await ctx.services.core.schema.getById(input.schemaId);
      
      return ctx.services.crud.generateRoutes(schema, {
        operations: input.operations,
        user: ctx.user
      });
    }),
  
  // 动态执行 CRUD
  execute: protectedProcedure
    .input(z.object({
      schemaId: z.string(),
      operation: z.enum(['create', 'read', 'update', 'delete']),
      data: z.record(z.unknown()).optional(),
      where: z.record(z.unknown()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const schema = await ctx.services.core.schema.getById(input.schemaId);
      
      return await ctx.services.crud.executeSchemaOperation(
        schema,
        input.operation,
        {
          data: input.data,
          where: input.where,
          user: ctx.user
        }
      );
    })
});
```

## 实时通信集成

### 1. WebSocket 订阅

```typescript
// routes/realtime.ts
export const realtimeRouter = router({
  // 订阅表变化
  onTableChange: protectedProcedure
    .input(z.object({
      table: z.string(),
      operations: z.array(z.enum(['insert', 'update', 'delete'])).optional()
    }))
    .subscription(async ({ ctx, input }) => {
      await ctx.services.auth.checkPermission(
        ctx.user,
        `${input.table}:subscribe`
      );
      
      return observable<any>((emit) => {
        const handler = (data: any) => {
          if (!input.operations || input.operations.includes(data.operation)) {
            emit.next(data);
          }
        };
        
        ctx.services.core.events.on(`table:${input.table}`, handler);
        
        return () => {
          ctx.services.core.events.off(`table:${input.table}`, handler);
        };
      });
    }),
  
  // 聊天室
  chatRoom: protectedProcedure
    .input(z.object({
      roomId: z.string()
    }))
    .subscription(async ({ ctx, input }) => {
      // 加入房间
      await ctx.services.core.rooms.join(ctx.user.id, input.roomId);
      
      return observable<{
        type: 'message' | 'user_joined' | 'user_left';
        data: any;
      }>((emit) => {
        const messageHandler = (data: any) => {
          emit.next({ type: 'message', data });
        };
        
        const userJoinedHandler = (data: any) => {
          emit.next({ type: 'user_joined', data });
        };
        
        const userLeftHandler = (data: any) => {
          emit.next({ type: 'user_left', data });
        };
        
        ctx.services.core.events.on(`room:${input.roomId}:message`, messageHandler);
        ctx.services.core.events.on(`room:${input.roomId}:join`, userJoinedHandler);
        ctx.services.core.events.on(`room:${input.roomId}:leave`, userLeftHandler);
        
        return () => {
          ctx.services.core.rooms.leave(ctx.user.id, input.roomId);
          ctx.services.core.events.off(`room:${input.roomId}:message`, messageHandler);
          ctx.services.core.events.off(`room:${input.roomId}:join`, userJoinedHandler);
          ctx.services.core.events.off(`room:${input.roomId}:leave`, userLeftHandler);
        };
      });
    })
});
```

### 2. React 实时组件

```typescript
// components/RealtimeTable.tsx
import { trpc } from '../lib/trpc';
import { useEffect, useState } from 'react';

interface RealtimeTableProps {
  table: string;
  initialData?: any[];
}

export function RealtimeTable({ table, initialData = [] }: RealtimeTableProps) {
  const [data, setData] = useState(initialData);
  
  // 订阅表变化
  trpc.realtime.onTableChange.useSubscription(
    { table },
    {
      onData: (change) => {
        setData(prev => {
          switch (change.operation) {
            case 'insert':
              return [...prev, change.record];
            case 'update':
              return prev.map(item => 
                item.id === change.record.id ? change.record : item
              );
            case 'delete':
              return prev.filter(item => item.id !== change.record.id);
            default:
              return prev;
          }
        });
      },
      onError: (error) => {
        console.error('Subscription error:', error);
      }
    }
  );
  
  return (
    <div>
      <h2>{table} 数据</h2>
      <div>
        {data.map(item => (
          <div key={item.id}>
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 缓存集成

### 1. Redis 缓存

```typescript
// middleware/cache.ts
export const cacheMiddleware = (options: {
  ttl: number;
  keyGenerator?: (input: any) => string;
}) => {
  return middleware(async ({ ctx, next, path, input }) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(input)
      : `trpc:${path}:${JSON.stringify(input)}`;
    
    // 尝试从缓存获取
    const cached = await ctx.services.core.cache.get(key);
    if (cached) {
      return cached;
    }
    
    // 执行查询
    const result = await next();
    
    // 缓存结果
    await ctx.services.core.cache.set(key, result, options.ttl);
    
    return result;
  });
};

// 使用缓存
export const cachedProcedure = protectedProcedure
  .use(cacheMiddleware({ ttl: 300 })); // 5分钟缓存
```

### 2. 智能缓存失效

```typescript
// middleware/smart-cache.ts
export const smartCacheMiddleware = middleware(async ({ ctx, next, path, input }) => {
  // 分析查询依赖的表
  const tables = await ctx.services.core.analyzer.getQueryTables(path, input);
  
  const cacheKey = `trpc:${path}:${JSON.stringify(input)}`;
  const versionKey = `version:${tables.join(':')}`;
  
  // 检查版本
  const cached = await ctx.services.core.cache.get(cacheKey);
  const version = await ctx.services.core.cache.get(versionKey);
  
  if (cached && cached.version === version) {
    return cached.data;
  }
  
  // 执行查询
  const result = await next();
  
  // 缓存结果
  await ctx.services.core.cache.set(cacheKey, {
    data: result,
    version,
    timestamp: Date.now()
  });
  
  return result;
});
```

## 错误处理集成

### 1. 全局错误处理

```typescript
// middleware/error-handler.ts
export const errorHandlerMiddleware = middleware(async ({ ctx, next, path }) => {
  try {
    return await next();
  } catch (error) {
    // 记录错误
    ctx.services.core.logger.error('tRPC Error', {
      path,
      error: error.message,
      stack: error.stack,
      user: ctx.user?.id,
      requestId: ctx.request.id
    });
    
    // 发送错误通知
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      await ctx.services.core.notifications.sendError({
        error,
        context: { path, user: ctx.user }
      });
    }
    
    throw error;
  }
});
```

### 2. 客户端错误处理

```typescript
// hooks/useErrorHandler.ts
export function useErrorHandler() {
  return {
    onError: (error: TRPCClientError<any>) => {
      switch (error.data?.code) {
        case 'UNAUTHORIZED':
          // 重定向到登录页
          window.location.href = '/login';
          break;
        case 'FORBIDDEN':
          // 显示权限错误
          toast.error('没有权限执行此操作');
          break;
        case 'TOO_MANY_REQUESTS':
          // 显示限流错误
          toast.error('请求过于频繁,请稍后再试');
          break;
        default:
          // 显示通用错误
          toast.error(error.message || '操作失败');
      }
    }
  };
}
```

## 性能优化集成

### 1. 数据加载优化

```typescript
// hooks/useOptimizedQuery.ts
export function useOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      
      try {
        const result = await queryFn();
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Query error:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, deps);
  
  return { data, loading };
}
```

### 2. 批量加载

```typescript
// utils/batch-loader.ts
export class BatchLoader {
  private batches = new Map<string, Promise<any>>();
  
  async load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.batches.has(key)) {
      return this.batches.get(key);
    }
    
    const promise = loader();
    this.batches.set(key, promise);
    
    // 清理已完成的批次
    promise.finally(() => {
      setTimeout(() => {
        this.batches.delete(key);
      }, 1000);
    });
    
    return promise;
  }
  
  async loadMany<T>(
    keys: string[],
    loader: (keys: string[]) => Promise<T[]>
  ): Promise<T[]> {
    const batchKey = keys.sort().join(',');
    
    return this.load(batchKey, () => loader(keys));
  }
}
```

这些集成示例展示了如何在实际项目中使用 @linch-kit/trpc，涵盖了认证、CRUD、实时通信、缓存、错误处理和性能优化等关键场景。