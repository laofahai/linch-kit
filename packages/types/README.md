# @linch-kit/types

TypeScript 类型定义包，为 Linch Kit 生态系统提供统一的类型定义。

## 📦 安装

```bash
npm install @linch-kit/types
# 或
pnpm add @linch-kit/types
# 或
yarn add @linch-kit/types
```

## 🚀 特性

- 🔒 **类型安全** - 完整的 TypeScript 类型定义
- 🌐 **通用类型** - 跨包共享的通用类型
- 🛠️ **工具类型** - 实用的类型工具函数
- 🔧 **扩展性** - 支持类型扩展和自定义
- 🤖 **AI-First** - 为 AI 辅助开发优化的类型设计

## 📖 使用方式

### 基础类型

```typescript
import type {
  // 通用类型
  ID,
  Timestamp,
  Named,
  Versioned,
  
  // 分页类型
  PaginationParams,
  PaginatedResult,
  
  // 异步类型
  AsyncResult,
  
  // 环境类型
  Environment,
  LogLevel
} from '@linch-kit/types'

// 使用示例
interface User extends Named, Versioned {
  id: ID
  email: string
  createdAt: Timestamp
}

interface UserListResponse extends PaginatedResult<User> {
  // 自动包含 data, total, page, pageSize 等字段
}
```

### 工具类型

```typescript
import type {
  // 深度操作
  DeepPartial,
  DeepRequired,
  
  // 函数类型
  ExtractArgs,
  ExtractReturn,
  ExtractPromise,
  
  // 构造函数类型
  Constructor,
  AbstractConstructor,
  Mixin
} from '@linch-kit/types'

// 使用示例
type PartialUser = DeepPartial<User>
type RequiredUser = DeepRequired<Partial<User>>

// 函数类型提取
type CreateUserArgs = ExtractArgs<typeof createUser>
type CreateUserReturn = ExtractReturn<typeof createUser>
```

### 配置类型

```typescript
import type {
  Config,
  ConfigSchema,
  DatabaseConfig,
  AuthConfig,
  ServerConfig
} from '@linch-kit/types'

// 应用配置
interface AppConfig extends Config {
  database: DatabaseConfig
  auth: AuthConfig
  server: ServerConfig
}
```

### 插件类型

```typescript
import type {
  Plugin,
  PluginContext,
  PluginHook,
  PluginMetadata
} from '@linch-kit/types'

// 自定义插件
interface MyPlugin extends Plugin {
  id: 'my-plugin'
  config: {
    enabled: boolean
    options: Record<string, any>
  }
}
```

## 📚 类型分类

### 1. 基础类型

```typescript
// 标识符
type ID = string | number

// 时间戳
type Timestamp = Date | string | number

// 环境
type Environment = 'development' | 'production' | 'test'

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
```

### 2. 通用接口

```typescript
// 命名接口
interface Named {
  name: string
}

// 版本接口
interface Versioned {
  version: string
}

// 时间戳接口
interface Timestamped {
  createdAt: Timestamp
  updatedAt?: Timestamp
}
```

### 3. 分页类型

```typescript
// 分页参数
interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页结果
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

### 4. 异步类型

```typescript
// 异步结果
type AsyncResult<T, E = Error> = Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>

// 可选配置
type OptionalConfig<T> = {
  [K in keyof T]?: T[K]
}
```

### 5. 工具类型

```typescript
// 深度可选
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 深度必需
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// 函数参数提取
type ExtractArgs<T> = T extends (...args: infer P) => any ? P : never

// 函数返回值提取
type ExtractReturn<T> = T extends (...args: any[]) => infer R ? R : never

// Promise 值提取
type ExtractPromise<T> = T extends Promise<infer U> ? U : T
```

## 🔧 类型扩展

### 模块扩展

```typescript
// 扩展现有类型
declare module '@linch-kit/types' {
  interface Config {
    myCustomField?: string
  }
  
  interface User {
    customProperty?: any
  }
}
```

### 自定义类型

```typescript
// 基于现有类型创建新类型
import type { Named, Timestamped } from '@linch-kit/types'

interface Article extends Named, Timestamped {
  id: string
  content: string
  author: string
  published: boolean
}
```

## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm check-types

# 代码检查
pnpm lint
```

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/linch-tech/linch-kit)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [类型工具参考](https://www.typescriptlang.org/docs/handbook/utility-types.html)
