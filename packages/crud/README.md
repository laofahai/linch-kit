# @linch-kit/crud

🚀 **Linch Kit CRUD 包** - 类型安全的 CRUD 操作和状态管理，支持权限控制、查询构建和数据源抽象。

## ✨ 核心特性

- 🔒 **类型安全** - 基于 Schema 的完整类型推导和验证
- 🚀 **自动生成** - 自动生成标准 CRUD 操作和 tRPC 路由
- 🔐 **权限控制** - 内置角色权限检查和数据过滤
- 🔄 **生命周期钩子** - 支持操作前后的自定义逻辑和事件
- 📊 **查询构建器** - 强大的查询构建和优化功能
- 🗄️ **数据源抽象** - 支持多种数据源（数据库、API、内存等）
- 📱 **状态管理** - 内置 React 状态管理和缓存
- 🔍 **搜索过滤** - 智能搜索、分页、排序和过滤
- 🤖 **AI-First** - 为 AI 辅助开发优化的接口设计

## 📦 安装

```bash
pnpm add @linch-kit/crud
# 或
npm install @linch-kit/crud
```

## 🚀 快速开始

### 基础 CRUD 操作

```typescript
import { CRUDManager, createCRUDFromSchema } from '@linch-kit/crud'
import { userEntity } from './schemas/user'
import { databaseDataSource } from './data-sources/database'

// 从 Schema 创建 CRUD 管理器
const userCRUD = createCRUDFromSchema(userEntity, {
  dataSource: databaseDataSource,
  permissions: {
    create: ['admin', 'user'],
    read: ['admin', 'user', 'guest'],
    update: ['admin', 'owner'],
    delete: ['admin', 'owner']
  }
})

// 基础操作
const users = await userCRUD.list({ page: 1, limit: 10 })
const user = await userCRUD.get('user-id')
const newUser = await userCRUD.create({ name: 'John', email: 'john@example.com' })
const updated = await userCRUD.update('user-id', { name: 'Jane' })
await userCRUD.delete('user-id')
```

### 查询构建器

```typescript
import { QueryBuilder } from '@linch-kit/crud'

// 复杂查询
const results = await userCRUD.query()
  .where('status', '=', 'active')
  .where('age', '>=', 18)
  .search('john', ['name', 'email'])
  .sort('createdAt', 'desc')
  .include(['profile', 'posts'])
  .paginate(1, 20)
```

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

### CRUDManager 核心类

```typescript
class CRUDManager<T> {
  // 基础 CRUD 操作
  async list(options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  async get(id: string, context?: CRUDContext): Promise<T | null>
  async create(data: CreateInput<T>, context?: CRUDContext): Promise<OperationResult<T>>
  async update(id: string, data: UpdateInput<T>, context?: CRUDContext): Promise<OperationResult<T>>
  async delete(id: string, context?: CRUDContext): Promise<OperationResult<void>>

  // 批量操作
  async bulkCreate(items: CreateInput<T>[], context?: CRUDContext): Promise<BulkOperationResult>
  async bulkUpdate(updates: BulkUpdateInput<T>[], context?: CRUDContext): Promise<BulkOperationResult>
  async bulkDelete(ids: string[], context?: CRUDContext): Promise<BulkOperationResult>

  // 搜索和查询
  async search(options: SearchOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  query(): QueryBuilder<T>

  // 关联操作
  async getRelated<R>(id: string, relation: string, options?: ListOptions): Promise<PaginatedResponse<R>>
  async addRelation(id: string, relation: string, relatedId: string): Promise<OperationResult<void>>
  async removeRelation(id: string, relation: string, relatedId: string): Promise<OperationResult<void>>

  // 状态管理
  getState(): CRUDState<T>
  subscribe(listener: (state: CRUDState<T>) => void): () => void
}
```

### 配置接口

```typescript
interface CRUDConfig<T> {
  name: string                        // CRUD 实例名称
  resource: string                    // 资源名称
  dataSource: DataSource<T>          // 数据源
  permissions?: CRUDPermissions       // 权限配置
  validation?: ValidationConfig       // 验证配置
  schema?: SchemaConfig              // Schema 配置
  debug?: boolean                    // 调试模式
}

interface CRUDPermissions {
  create?: PermissionRule
  read?: PermissionRule
  update?: PermissionRule
  delete?: PermissionRule
  custom?: Record<string, PermissionRule>
}

type PermissionRule =
  | string[]                          // 角色列表
  | ((context: CRUDContext, data?: any) => boolean | Promise<boolean>)  // 自定义函数
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

### 数据源接口

```typescript
interface DataSource<T> {
  // 基础查询操作
  list(options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  get(id: string, context?: CRUDContext): Promise<T | null>
  search(options: SearchOptions, context?: CRUDContext): Promise<PaginatedResponse<T>>
  count(options?: Omit<ListOptions, 'pagination'>, context?: CRUDContext): Promise<number>

  // 基础变更操作
  create(data: CreateInput<T>, context?: CRUDContext): Promise<T>
  update(id: string, data: UpdateInput<T>, context?: CRUDContext): Promise<T>
  delete(id: string, context?: CRUDContext): Promise<void>

  // 批量操作
  bulkCreate?(items: CreateInput<T>[], context?: CRUDContext): Promise<T[]>
  bulkUpdate?(updates: BulkUpdateInput<T>[], context?: CRUDContext): Promise<T[]>
  bulkDelete?(ids: string[], context?: CRUDContext): Promise<void>

  // 事务支持
  transaction?<R>(callback: (tx: DataSourceTransaction<T>) => Promise<R>): Promise<R>
}
```

### 查询构建器

```typescript
interface QueryBuilder<T> {
  // 过滤方法
  where(field: keyof T, operator: FilterOperator, value: any): QueryBuilder<T>
  whereIn(field: keyof T, values: any[]): QueryBuilder<T>
  whereNotIn(field: keyof T, values: any[]): QueryBuilder<T>
  whereBetween(field: keyof T, min: any, max: any): QueryBuilder<T>
  whereNull(field: keyof T): QueryBuilder<T>
  whereNotNull(field: keyof T): QueryBuilder<T>

  // 排序方法
  sort(field: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): QueryBuilder<T>

  // 分页方法
  limit(count: number): QueryBuilder<T>
  offset(count: number): QueryBuilder<T>
  paginate(page: number, pageSize: number): Promise<PaginatedResponse<T>>

  // 字段选择
  select(fields: (keyof T)[]): QueryBuilder<T>
  include(relations: string[]): QueryBuilder<T>

  // 搜索方法
  search(query: string, fields?: (keyof T)[]): QueryBuilder<T>
  fullTextSearch(query: string): QueryBuilder<T>

  // 执行方法
  execute(): Promise<T[]>
  first(): Promise<T | null>
  count(): Promise<number>
}
```

## 🔧 高级功能

### 权限控制

```typescript
// 基于角色的权限
const userCRUD = createCRUDFromSchema(userEntity, {
  dataSource,
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'user'],
    update: (context, data) => {
      // 自定义权限逻辑
      return context.user.role === 'admin' || context.user.id === data.id
    },
    delete: ['admin']
  }
})

// 数据过滤
const posts = await postCRUD.list({
  filters: {
    authorId: context.user.id  // 只显示用户自己的文章
  }
})
```

### 生命周期钩子

```typescript
const userCRUD = new CRUDManager({
  // ... 其他配置
})

// 监听事件
userCRUD.on('before:create', async ({ data, context }) => {
  // 创建前的处理
  data.createdBy = context.user.id
  data.createdAt = new Date()
})

userCRUD.on('after:update', async ({ result, context }) => {
  // 更新后的处理
  await auditLog.create({
    action: 'update',
    resourceId: result.id,
    userId: context.user.id
  })
})
```

### 状态管理集成

```typescript
import { useCRUDState } from '@linch-kit/crud'

// React Hook 使用
function UserList() {
  const {
    items,
    loading,
    error,
    pagination,
    actions
  } = useCRUDState(userCRUD)

  useEffect(() => {
    actions.loadList({ page: 1, limit: 10 })
  }, [])

  return (
    <div>
      {loading.list && <div>Loading...</div>}
      {error.list && <div>Error: {error.list.message}</div>}
      {items.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### tRPC 集成

```typescript
import { createTRPCRouter } from '@linch-kit/crud'

// 自动生成 tRPC 路由
const userRouter = createTRPCRouter(userCRUD, {
  basePath: 'users',
  middleware: [authMiddleware],
  customProcedures: {
    getProfile: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return userCRUD.get(input, { includeProfile: true })
      })
  }
})

// 在主路由中使用
export const appRouter = router({
  users: userRouter,
  // ... 其他路由
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

## 📋 变更日志

### v0.1.0 (2024-06-21)

**新增功能**
- ✨ 核心 CRUD 操作管理器
- ✨ 类型安全的数据源抽象
- ✨ 强大的查询构建器
- ✨ 权限控制系统
- ✨ 生命周期钩子和事件系统
- ✨ React 状态管理集成
- ✨ tRPC 路由自动生成
- ✨ 批量操作支持
- ✨ 搜索和过滤功能
- ✨ 事务处理支持

**技术特性**
- 🔒 完整的 TypeScript 类型支持
- 🚀 AI-First 设计理念
- 📱 框架无关的核心实现
- 🔌 可扩展的插件架构

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/laofahai/linch-kit)
- [AI 上下文文档](../../ai-context/packages/crud.md)
- [@linch-kit/schema](../schema/README.md)
- [@linch-kit/trpc](../trpc/README.md)
- [@linch-kit/auth](../auth/README.md)
- [示例项目](../../apps/starter)
