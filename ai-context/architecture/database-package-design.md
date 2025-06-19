# Database Package 设计方案

## 概述

`@linch-kit/database` 包负责数据库操作的统一封装，与 `@linch-kit/schema` 包深度集成，提供类型安全的数据库操作接口。

## 包结构

```
packages/database/
├── src/
│   ├── core/
│   │   ├── client.ts          # Prisma客户端封装
│   │   ├── connection.ts      # 连接管理
│   │   ├── transaction.ts     # 事务处理
│   │   └── query-builder.ts   # 查询构建器
│   ├── generators/
│   │   ├── repository.ts      # Repository生成器
│   │   ├── service.ts         # Service生成器
│   │   └── types.ts           # 类型生成器
│   ├── plugins/
│   │   └── cli-plugin.ts      # CLI插件
│   ├── utils/
│   │   ├── migration.ts       # 迁移工具
│   │   ├── seeding.ts         # 数据填充
│   │   └── backup.ts          # 备份恢复
│   └── index.ts
├── package.json
└── README.md
```

## 核心功能

### 1. Prisma客户端封装

```typescript
// src/core/client.ts
export class DatabaseClient {
  private prisma: PrismaClient
  
  constructor(config: DatabaseConfig) {
    this.prisma = new PrismaClient(config.prisma)
  }
  
  // 自动生成的Repository方法
  get users() {
    return new UserRepository(this.prisma)
  }
  
  // 事务支持
  async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>
  
  // 连接管理
  async connect(): Promise<void>
  async disconnect(): Promise<void>
}
```

### 2. Repository模式

```typescript
// 自动生成的Repository
export class UserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string): Promise<User | null>
  async findMany(where?: UserWhereInput): Promise<User[]>
  async create(data: UserCreateInput): Promise<User>
  async update(id: string, data: UserUpdateInput): Promise<User>
  async delete(id: string): Promise<User>
  
  // 基于schema定义的自定义查询
  async findByEmail(email: string): Promise<User | null>
  async findActiveUsers(): Promise<User[]>
}
```

### 3. CLI集成

```bash
# 数据库相关命令
linch db:generate     # 生成Prisma schema和Repository
linch db:migrate      # 运行数据库迁移
linch db:seed         # 数据填充
linch db:reset        # 重置数据库
linch db:studio       # 启动Prisma Studio
```

## 与Schema包集成

### 1. 自动生成

```typescript
// 基于schema定义自动生成Repository
const UserEntity = defineEntity('User', {
  id: defineField(z.string().uuid(), { primary: true }),
  email: defineField(z.string().email(), { unique: true }),
  status: defineField(z.enum(['active', 'inactive']), { default: 'active' })
})

// 自动生成的方法：
// - findByEmail (基于unique字段)
// - findActiveUsers (基于enum默认值)
// - 标准CRUD操作
```

### 2. 类型安全

```typescript
// 完全类型安全的操作
const user = await db.users.create({
  data: {
    email: "user@example.com", // 类型检查
    status: "active"           // 枚举值检查
  }
})
```

## 配置集成

```typescript
// linch.config.ts
export default {
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
    prisma: {
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      dir: './prisma/migrations',
      autoRun: false
    }
  }
}
```

## 依赖关系

```json
{
  "dependencies": {
    "@linch-kit/schema": "workspace:*",
    "@linch-kit/core": "workspace:*",
    "@prisma/client": "^6.0.0",
    "prisma": "^6.0.0"
  }
}
```

## 开发优先级

1. **Phase 1**: 基础客户端封装和Repository生成
2. **Phase 2**: CLI命令集成和迁移工具
3. **Phase 3**: 高级功能（连接池、缓存、监控）

## 使用示例

```typescript
// 在应用中使用
import { createDatabaseClient } from '@linch-kit/database'
import { loadConfig } from '@linch-kit/core'

const config = await loadConfig()
const db = createDatabaseClient(config.database)

// 类型安全的操作
const users = await db.users.findMany({
  where: { status: 'active' }
})

// 事务操作
await db.transaction(async (tx) => {
  const user = await tx.users.create({ data: userData })
  await tx.profiles.create({ data: { userId: user.id, ...profileData } })
})
```

## 注意事项

1. **性能**: 考虑查询优化和连接池管理
2. **安全**: 防止SQL注入，参数验证
3. **监控**: 查询日志和性能监控
4. **测试**: 提供测试工具和Mock支持
5. **迁移**: 平滑的数据库版本管理
