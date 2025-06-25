# 包间集成模式

> **适用范围**: 所有 @linch-kit/* 包  
> **更新**: 2025-01-25

## 🔗 依赖关系

### 标准依赖链
```
@linch-kit/core (L0 - 基础设施)
├── @linch-kit/schema (L1 - 数据层)
├── @linch-kit/auth (L2 - 业务层)
├── @linch-kit/crud (L2 - 业务层)
├── @linch-kit/trpc (L3 - API层)
├── @linch-kit/ui (L3 - 表现层)
├── @linch-kit/console (L4 - 应用层)
└── @linch-kit/ai (L4 - 应用层)
```

## 🔌 插件集成模式

### 插件注册
```typescript
// 标准插件注册流程
import { PluginSystem } from '@linch-kit/core'

const plugin = {
  id: 'my-plugin',
  setup: async (config) => {
    // 插件初始化逻辑
  }
}

await PluginSystem.register(plugin)
```

### 事件通信
```typescript
// 跨包事件通信
import { EventBus } from '@linch-kit/core'

// 发布事件
EventBus.emit('user.created', { userId: '123' })

// 监听事件
EventBus.on('user.created', (data) => {
  // 处理用户创建事件
})
```

## 📡 API 集成模式

### tRPC路由集成
```typescript
// 标准路由注册
import { createTRPCRouter } from '@linch-kit/trpc'
import { authRouter } from '@linch-kit/auth'
import { crudRouter } from '@linch-kit/crud'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  crud: crudRouter,
})
```

### 权限检查集成
```typescript
// 统一权限检查模式
import { checkPermission } from '@linch-kit/auth'

const protectedProcedure = publicProcedure
  .use(async ({ ctx, next }) => {
    await checkPermission(ctx.user, 'resource:action')
    return next()
  })
```