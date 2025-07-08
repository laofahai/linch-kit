# @linch-kit/crud

类型安全的通用 CRUD 操作包，基于 Schema 自动生成数据操作接口，内置权限控制和缓存优化。

## ✨ 特性

- 🎯 **Schema 驱动** - 基于 Zod Schema 自动生成 CRUD 操作
- 🔒 **类型安全** - 完整的 TypeScript 类型推导
- 🛡️ **权限集成** - 自动应用行级和字段级权限
- ⚡ **性能优化** - 智能查询缓存和批量操作
- 🔍 **高级查询** - 支持复杂过滤、排序、分页
- 🎨 **可扩展** - 灵活的钩子和中间件系统

## 📦 安装

```bash
bun add @linch-kit/crud
```

## 🚀 快速开始

### 基础使用

```typescript
import { createCRUD } from '@linch-kit/crud'
import { UserEntity } from './entities'

// 创建 CRUD 实例
const userCRUD = createCRUD('User', UserEntity, {
  permissions: true,
  validation: true,
  cache: true,
})

// 基础操作
const user = await userCRUD.create({
  name: 'John Doe',
  email: 'john@example.com',
})

const users = await userCRUD.findMany({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  take: 10,
})

await userCRUD.update(userId, {
  name: 'Jane Doe',
})

await userCRUD.delete(userId)
```

### 高级查询

```typescript
// 复杂查询
const results = await userCRUD.findMany({
  where: {
    AND: [
      { status: 'active' },
      {
        OR: [{ role: 'admin' }, { permissions: { some: { name: 'manage_users' } } }],
      },
    ],
  },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
  orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  skip: 0,
  take: 20,
})

// 聚合查询
const stats = await userCRUD.aggregate({
  _count: true,
  _avg: { age: true },
  groupBy: ['role', 'status'],
})
```

### 批量操作

```typescript
// 批量创建
const users = await userCRUD.createMany([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
])

// 批量更新
await userCRUD.updateMany({
  where: { status: 'pending' },
  data: { status: 'active' },
})

// 批量删除
await userCRUD.deleteMany({
  where: {
    lastLoginAt: { lt: new Date('2023-01-01') },
  },
})
```

## 🔧 高级功能

### 权限控制

```typescript
const postCRUD = createCRUD('Post', PostEntity, {
  permissions: {
    create: async (user, data) => {
      return user.role === 'author' || user.role === 'admin'
    },
    read: async (user, post) => {
      return post.published || post.authorId === user.id
    },
    update: async (user, post, data) => {
      return post.authorId === user.id || user.role === 'admin'
    },
    delete: async (user, post) => {
      return user.role === 'admin'
    },
  },
})

// 使用时自动应用权限
const posts = await postCRUD.findMany({
  user: currentUser, // 自动过滤用户无权访问的数据
})
```

### 钩子系统

```typescript
const userCRUD = createCRUD('User', UserEntity, {
  hooks: {
    beforeCreate: async data => {
      // 数据预处理
      data.email = data.email.toLowerCase()
      return data
    },
    afterCreate: async user => {
      // 发送欢迎邮件
      await sendWelcomeEmail(user.email)
    },
    beforeUpdate: async (id, data) => {
      // 记录变更历史
      await auditLog.record('user.update', { id, changes: data })
    },
  },
})
```

### 缓存策略

```typescript
const productCRUD = createCRUD('Product', ProductEntity, {
  cache: {
    ttl: 3600, // 1小时
    invalidate: ['create', 'update', 'delete'],
    warmup: async () => {
      // 预热缓存
      return await prisma.product.findMany({
        where: { featured: true },
      })
    },
  },
})
```

### 事务支持

```typescript
import { transaction } from '@linch-kit/crud'

// 事务操作
const result = await transaction(async tx => {
  const user = await userCRUD.create(userData, { tx })
  const profile = await profileCRUD.create(
    {
      ...profileData,
      userId: user.id,
    },
    { tx }
  )

  return { user, profile }
})
```

## 📚 API 参考

### CRUD 工厂

- `createCRUD()` - 创建 CRUD 实例
- `transaction()` - 事务包装器

### CRUD 方法

- `create()` - 创建单条记录
- `createMany()` - 批量创建
- `findUnique()` - 查找单条记录
- `findFirst()` - 查找第一条匹配记录
- `findMany()` - 查找多条记录
- `update()` - 更新单条记录
- `updateMany()` - 批量更新
- `upsert()` - 创建或更新
- `delete()` - 删除单条记录
- `deleteMany()` - 批量删除
- `count()` - 统计记录数
- `aggregate()` - 聚合查询

### 查询选项

- `where` - 过滤条件
- `orderBy` - 排序
- `take/skip` - 分页
- `include/select` - 关联查询
- `distinct` - 去重

## 🤝 集成

- **@linch-kit/schema** - Schema 定义
- **@linch-kit/auth** - 权限控制
- **Prisma** - 数据库操作
- **Redis** - 缓存支持

## 📄 许可证

MIT
