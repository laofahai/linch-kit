# @linch-kit/crud

基于 tRPC 和 Schema 的 CRUD 操作包，提供类型安全的数据操作接口。

## 📦 安装

```bash
npm install @linch-kit/crud
# 或
pnpm add @linch-kit/crud
# 或
yarn add @linch-kit/crud
```

## 🚀 特性

- 🔒 **类型安全** - 基于 Schema 的完整类型推导
- 🚀 **自动生成** - 自动生成 CRUD 操作
- 🔐 **权限控制** - 内置权限检查和数据过滤
- 🔄 **生命周期钩子** - 支持操作前后的自定义逻辑
- 📊 **查询优化** - 智能查询优化和缓存
- 🤖 **AI-First** - 为 AI 辅助开发优化

## 📖 使用方式

### 基础 CRUD 操作

```typescript
import { createCRUD } from '@linch-kit/crud'
import { userSchema } from './schemas/user'

// 创建 CRUD 操作
const userCRUD = createCRUD({
  schema: userSchema,
  table: 'users',
  permissions: {
    create: ['admin', 'user'],
    read: ['admin', 'user', 'guest'],
    update: ['admin', 'owner'],
    delete: ['admin', 'owner']
  }
})

// 在 tRPC 路由中使用
export const userRouter = router({
  // 自动生成的 CRUD 操作
  ...userCRUD.routes,
  
  // 自定义操作
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return userCRUD.findOne({
        where: { id: ctx.user.id }
      })
    })
})
```

### 高级配置

```typescript
import { createCRUD } from '@linch-kit/crud'

const postCRUD = createCRUD({
  schema: postSchema,
  table: 'posts',
  
  // 权限配置
  permissions: {
    create: async (ctx, data) => {
      return ctx.user?.role === 'admin' || ctx.user?.id === data.authorId
    },
    read: async (ctx, data) => {
      return data.published || ctx.user?.id === data.authorId
    },
    update: ['admin', 'owner'],
    delete: ['admin', 'owner']
  },
  
  // 生命周期钩子
  hooks: {
    beforeCreate: async (data, ctx) => {
      data.authorId = ctx.user.id
      data.createdAt = new Date()
      return data
    },
    
    afterCreate: async (result, ctx) => {
      // 发送通知
      await notificationService.send({
        type: 'post_created',
        userId: result.authorId,
        data: result
      })
      return result
    },
    
    beforeUpdate: async (data, ctx) => {
      data.updatedAt = new Date()
      return data
    }
  },
  
  // 查询配置
  query: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSort: { createdAt: 'desc' },
    includes: ['author', 'tags'],
    searchFields: ['title', 'content']
  }
})
```

### 自定义操作

```typescript
// 扩展 CRUD 操作
const extendedUserCRUD = createCRUD({
  schema: userSchema,
  table: 'users',
  
  // 自定义操作
  customOperations: {
    // 批量操作
    batchUpdate: async (ids: string[], data: Partial<User>, ctx) => {
      return db.user.updateMany({
        where: { id: { in: ids } },
        data
      })
    },
    
    // 统计操作
    getStats: async (ctx) => {
      return {
        total: await db.user.count(),
        active: await db.user.count({ where: { active: true } }),
        newThisMonth: await db.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      }
    }
  }
})
```

## 📚 API 文档

### createCRUD 配置

```typescript
interface CRUDConfig<T> {
  schema: Schema<T>                    // 数据模式
  table: string                       // 数据表名
  permissions?: PermissionConfig      // 权限配置
  hooks?: LifecycleHooks<T>          // 生命周期钩子
  query?: QueryConfig                 // 查询配置
  customOperations?: CustomOps<T>     // 自定义操作
}
```

### 权限配置

```typescript
interface PermissionConfig {
  create?: Permission
  read?: Permission
  update?: Permission
  delete?: Permission
}

type Permission = 
  | string[]                          // 角色列表
  | ((ctx: Context, data?: any) => boolean | Promise<boolean>)  // 自定义函数
```

### 生命周期钩子

```typescript
interface LifecycleHooks<T> {
  beforeCreate?: (data: T, ctx: Context) => T | Promise<T>
  afterCreate?: (result: T, ctx: Context) => T | Promise<T>
  beforeUpdate?: (data: Partial<T>, ctx: Context) => Partial<T> | Promise<Partial<T>>
  afterUpdate?: (result: T, ctx: Context) => T | Promise<T>
  beforeDelete?: (id: string, ctx: Context) => void | Promise<void>
  afterDelete?: (id: string, ctx: Context) => void | Promise<void>
}
```

### 查询配置

```typescript
interface QueryConfig {
  defaultLimit?: number               // 默认分页大小
  maxLimit?: number                   // 最大分页大小
  defaultSort?: Record<string, 'asc' | 'desc'>  // 默认排序
  includes?: string[]                 // 默认包含的关联数据
  searchFields?: string[]             // 可搜索字段
}
```

## 🔧 高级功能

### 数据验证

```typescript
// 自动基于 Schema 进行数据验证
const result = await userCRUD.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
})
// 如果数据不符合 Schema，会自动抛出验证错误
```

### 关联查询

```typescript
// 自动处理关联数据
const posts = await postCRUD.findMany({
  include: {
    author: true,
    tags: true,
    comments: {
      include: {
        author: true
      }
    }
  }
})
```

### 搜索和过滤

```typescript
// 智能搜索
const results = await postCRUD.search({
  query: 'TypeScript',
  filters: {
    published: true,
    createdAt: {
      gte: new Date('2024-01-01')
    }
  },
  sort: { createdAt: 'desc' },
  page: 1,
  pageSize: 20
})
```

## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm check-types

# 代码检查
pnpm lint
```

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/linch-tech/linch-kit)
- [@linch-kit/schema](../schema/README.md)
- [@linch-kit/trpc](../trpc/README.md)
- [tRPC 文档](https://trpc.io/docs)
