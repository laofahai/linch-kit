# @linch-kit/types

🔒 **Linch Kit Types 包** - 为 Linch Kit 生态系统提供统一的 TypeScript 类型定义和工具类型。

## ✨ 核心特性

- 🔒 **类型安全** - 完整的 TypeScript 类型定义和验证
- 🌐 **通用类型** - 跨包共享的基础类型和接口
- 🛠️ **工具类型** - 实用的类型工具函数和辅助类型
- 🔧 **扩展性** - 支持类型扩展和模块声明
- 🏗️ **基础模型** - 提供 BaseModel 类和通用实体接口
- 📊 **API 类型** - 标准化的 API 响应和分页类型
- 🌍 **全局类型** - 环境变量和全局声明
- 🤖 **AI-First** - 为 AI 辅助开发优化的类型设计

## 📦 安装

```bash
pnpm add @linch-kit/types
# 或
npm install @linch-kit/types
```

## 🚀 快速开始

### 基础类型和接口

```typescript
import type {
  // 基础实体类型
  BaseEntity,
  BaseModel,

  // 通用接口
  Named,
  Versioned,
  Timestamped,

  // 分页类型
  PaginationParams,
  PaginationResult,

  // API 响应类型
  ApiResponse,

  // 工具类型
  DeepPartial,
  RequiredFields,
  OptionalFields
} from '@linch-kit/types'

// 使用示例
interface User extends BaseEntity, Named {
  email: string
  role: 'admin' | 'user'
  profile?: UserProfile
}

interface UserProfile extends Named, Timestamped {
  avatar?: string
  bio?: string
}

// API 响应示例
type UserListResponse = ApiResponse<PaginationResult<User>>
type CreateUserResponse = ApiResponse<User>
```

### BaseModel 类使用

```typescript
import { BaseModel } from '@linch-kit/types'

class User extends BaseModel {
  email!: string
  name!: string
  role: 'admin' | 'user' = 'user'

  // 自定义方法
  isAdmin(): boolean {
    return this.role === 'admin'
  }

  getDisplayName(): string {
    return this.name || this.email
  }
}

// 使用示例
const user = new User()
user.id = 'user-123'
user.email = 'john@example.com'
user.name = 'John Doe'
user.createdAt = new Date()
user.updatedAt = new Date()

// 内置方法
console.log(user.toString()) // User(id=user-123)
console.log(user.isDeleted()) // false

// 软删除
user.softDelete()
console.log(user.isDeleted()) // true

// 恢复
user.restore()
console.log(user.isDeleted()) // false

// 序列化
const json = user.toJSON()
const cloned = User.fromJSON(json)
```

### 工具类型

```typescript
import type {
  // 深度操作类型
  DeepPartial,
  RequiredFields,
  OptionalFields,

  // 构造函数类型
  Constructor,
  AbstractConstructor,

  // 环境和配置类型
  Environment,
  LogLevel
} from '@linch-kit/types'

// 深度可选类型
interface UserConfig {
  database: {
    host: string
    port: number
    credentials: {
      username: string
      password: string
    }
  }
  cache: {
    enabled: boolean
    ttl: number
  }
}

type PartialUserConfig = DeepPartial<UserConfig>
// 所有属性都变为可选，包括嵌套对象

// 必需字段类型
type UserWithRequiredEmail = RequiredFields<Partial<User>, 'email'>
// User 的所有字段可选，但 email 必需

// 可选字段类型
type UserWithOptionalProfile = OptionalFields<User, 'profile'>
// User 的 profile 字段变为可选

// 构造函数类型
class MyService {
  constructor(public config: UserConfig) {}
}

type MyServiceConstructor = Constructor<MyService>
// new (...args: any[]) => MyService

// 环境类型
const env: Environment = process.env.NODE_ENV || 'development'
const logLevel: LogLevel = 'info'
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

## 📚 API 文档

### 基础实体类型

#### BaseEntity

基础实体接口，定义所有实体的通用字段：

```typescript
interface BaseEntity {
  id: string                     // 唯一标识符
  createdAt: Date               // 创建时间
  updatedAt: Date               // 更新时间
  deletedAt?: Date | null       // 软删除时间
}
```

#### BaseModel

基础模型类，提供通用方法：

```typescript
abstract class BaseModel implements BaseEntity {
  // 基础字段
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  // 实例方法
  isDeleted(): boolean                              // 检查是否被软删除
  softDelete(): void                                // 软删除
  restore(): void                                   // 恢复
  toJSON(): Record<string, any>                     // 序列化为 JSON
  clone<T extends BaseModel>(this: T): T            // 克隆实例
  equals(other: BaseEntity): boolean                // 比较实例
  toString(): string                                // 字符串表示

  // 静态方法
  static fromJSON<T extends BaseModel>(
    this: new () => T,
    data: Record<string, any>
  ): T                                              // 从 JSON 创建实例
}
```

### 通用接口

#### Named

为对象添加名称标识：

```typescript
interface Named {
  name: string                   // 名称
  description?: string           // 描述（可选）
}
```

#### Versioned

为对象添加版本信息：

```typescript
interface Versioned {
  version: string                // 版本号
}
```

#### Timestamped

为对象添加时间戳信息：

```typescript
interface Timestamped {
  createdAt: Date               // 创建时间
  updatedAt: Date               // 更新时间
}
```

### 分页类型

#### PaginationParams

分页参数接口：

```typescript
interface PaginationParams {
  page?: number                  // 页码（从1开始）
  limit?: number                 // 每页数量
  offset?: number                // 偏移量
}
```

#### PaginationResult

分页结果接口：

```typescript
interface PaginationResult<T> {
  data: T[]                      // 数据列表
  total: number                  // 总数量
  page: number                   // 当前页码
  limit: number                  // 每页数量
  hasNext: boolean               // 是否有下一页
  hasPrev: boolean               // 是否有上一页
}
```

### API 响应类型

#### ApiResponse

标准化 API 响应接口：

```typescript
interface ApiResponse<T = any> {
  success: boolean               // 是否成功
  data?: T                       // 响应数据
  error?: string                 // 错误信息
  message?: string               // 提示信息
}

// 使用示例
type UserResponse = ApiResponse<User>
type UserListResponse = ApiResponse<PaginationResult<User>>
type CreateUserResponse = ApiResponse<{ id: string }>
```

### 工具类型

#### DeepPartial

深度可选类型：

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 使用示例
interface Config {
  database: {
    host: string
    port: number
  }
  cache: {
    enabled: boolean
  }
}

type PartialConfig = DeepPartial<Config>
// 所有属性都变为可选，包括嵌套对象
```

#### RequiredFields

指定字段必需类型：

```typescript
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 使用示例
type UserWithRequiredEmail = RequiredFields<Partial<User>, 'email'>
// User 的所有字段可选，但 email 必需
```

#### OptionalFields

指定字段可选类型：

```typescript
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 使用示例
type UserWithOptionalProfile = OptionalFields<User, 'profile'>
// User 的 profile 字段变为可选
```

### 构造函数类型

#### Constructor

类构造函数类型：

```typescript
type Constructor<T = {}> = new (...args: any[]) => T

// 使用示例
function createInstance<T>(ctor: Constructor<T>, ...args: any[]): T {
  return new ctor(...args)
}
```

#### AbstractConstructor

抽象类构造函数类型：

```typescript
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T

// 使用示例
function mixinFactory<T extends AbstractConstructor>(Base: T) {
  return class extends Base {
    // 混入逻辑
  }
}
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
pnpm build:watch

# 构建
pnpm build

# 类型检查
pnpm check-types

# 代码检查
pnpm lint

# 测试
pnpm test
```

## 📋 变更日志

### v1.0.0 (2024-06-21)

**新增功能**
- ✨ 完整的 TypeScript 类型定义系统
- ✨ BaseModel 类和基础实体接口
- ✨ 标准化 API 响应和分页类型
- ✨ 丰富的工具类型和辅助类型
- ✨ 全局类型声明和环境变量类型
- ✨ 构造函数和混入类型支持

**核心类型**
- 🔒 BaseEntity 和 BaseModel 基础实体
- 📊 PaginationParams 和 PaginationResult 分页类型
- 🌐 ApiResponse 标准化响应类型
- 🛠️ DeepPartial、RequiredFields、OptionalFields 工具类型
- 🏗️ Constructor 和 AbstractConstructor 构造函数类型

**技术特性**
- 🔒 完整的类型安全保障
- 🚀 AI-First 设计理念
- 📦 零依赖纯类型包
- 🔧 模块扩展支持

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/laofahai/linch-kit)
- [AI 上下文文档](../../ai-context/packages/types.md)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs)
- [TypeScript 工具类型参考](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [示例项目](../../apps/starter)
