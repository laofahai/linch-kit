# Types 包 AI 上下文

## 概述

`@linch-kit/types` 是 Linch Kit 的类型定义包，提供统一的 TypeScript 类型定义，确保整个生态系统的类型安全和一致性。

## 包信息

```typescript
interface TypesPackageInfo {
  name: '@linch-kit/types'
  version: string
  description: 'TypeScript 类型定义包'
  type: 'module'
  main: './dist/index.js'
  module: './dist/index.mjs'
  types: './dist/index.d.ts'
}
```

## 目录结构

```
packages/types/
├── src/
│   ├── index.ts              # 主入口
│   ├── common/               # 通用类型
│   │   ├── index.ts         # 通用类型导出
│   │   ├── base.ts          # 基础类型
│   │   ├── utility.ts       # 工具类型
│   │   └── pagination.ts    # 分页类型
│   ├── config/              # 配置类型
│   │   ├── index.ts         # 配置类型导出
│   │   ├── app.ts           # 应用配置
│   │   ├── database.ts      # 数据库配置
│   │   └── auth.ts          # 认证配置
│   ├── api/                 # API 类型
│   │   ├── index.ts         # API 类型导出
│   │   ├── request.ts       # 请求类型
│   │   ├── response.ts      # 响应类型
│   │   └── error.ts         # 错误类型
│   ├── schema/              # Schema 类型
│   │   ├── index.ts         # Schema 类型导出
│   │   ├── field.ts         # 字段类型
│   │   ├── validation.ts    # 验证类型
│   │   └── metadata.ts      # 元数据类型
│   ├── auth/                # 认证类型
│   │   ├── index.ts         # 认证类型导出
│   │   ├── user.ts          # 用户类型
│   │   ├── session.ts       # 会话类型
│   │   └── permission.ts    # 权限类型
│   └── ui/                  # UI 类型
│       ├── index.ts         # UI 类型导出
│       ├── component.ts     # 组件类型
│       ├── theme.ts         # 主题类型
│       └── event.ts         # 事件类型
├── globals.d.ts             # 全局类型声明
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── tsup.config.ts
```

## 核心类型定义

### 1. 基础类型

```typescript
// src/common/base.ts
export type ID = string | number

export type Timestamp = Date | string | number

export type Environment = 'development' | 'production' | 'test'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Named {
  name: string
}

export interface Versioned {
  version: string
}

export interface Timestamped {
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface OptionalConfig<T> {
  [K in keyof T]?: T[K]
}
```

### 2. 工具类型

```typescript
// src/common/utility.ts
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type ExtractArgs<T> = T extends (...args: infer P) => any ? P : never

export type ExtractReturn<T> = T extends (...args: any[]) => infer R ? R : never

export type ExtractPromise<T> = T extends Promise<infer U> ? U : T

export type UnionToArray<T> = T extends any ? T[] : never

export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Serializable[] 
  | { [key: string]: Serializable }

export type Constructor<T = {}> = new (...args: any[]) => T

export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T

export type Mixin<T extends Constructor> = T & Constructor
```

### 3. 分页类型

```typescript
// src/common/pagination.ts
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SearchParams extends PaginationParams {
  query?: string
  filters?: Record<string, any>
}
```

### 4. 异步类型

```typescript
// src/api/response.ts
export type AsyncResult<T, E = Error> = Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Timestamp
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
  stack?: string
}
```

### 5. 配置类型

```typescript
// src/config/app.ts
export interface Config {
  [key: string]: any
}

export interface DatabaseConfig {
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'
  url: string
  ssl?: boolean
  pool?: {
    min: number
    max: number
  }
}

export interface AuthConfig {
  providers: AuthProvider[]
  session: SessionConfig
  jwt: JWTConfig
}

export interface ServerConfig {
  port: number
  host: string
  cors: CORSConfig
  rateLimit: RateLimitConfig
}
```

### 6. Schema 类型

```typescript
// src/schema/field.ts
export interface FieldDefinition {
  type: FieldType
  required?: boolean
  default?: any
  validation?: ValidationRule[]
  metadata?: FieldMetadata
}

export type FieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'enum'

export interface ValidationRule {
  type: string
  value?: any
  message?: string
}

export interface FieldMetadata {
  label?: string
  description?: string
  placeholder?: string
  group?: string
  order?: number
}
```

### 7. 认证类型

```typescript
// src/auth/user.ts
export interface AuthUser {
  id: ID
  name?: string
  email?: string
  role?: string
  permissions?: string[]
  metadata?: Record<string, any>
}

export interface Session {
  id: string
  userId: ID
  expiresAt: Timestamp
  data?: Record<string, any>
}

export interface AuthProvider {
  id: string
  name: string
  type: 'oauth' | 'saml' | 'ldap' | 'local'
  config: Record<string, any>
}
```

### 8. UI 类型

```typescript
// src/ui/component.ts
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  [key: string]: any
}

export interface ThemeConfig {
  colors: ColorPalette
  fonts: FontConfig
  spacing: SpacingConfig
  breakpoints: BreakpointConfig
}

export interface ColorPalette {
  primary: ColorScale
  secondary: ColorScale
  success: ColorScale
  warning: ColorScale
  error: ColorScale
  neutral: ColorScale
}

export type ColorScale = {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}
```

## 全局类型声明

```typescript
// globals.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      DATABASE_URL: string
      JWT_SECRET: string
      [key: string]: string | undefined
    }
  }
  
  interface Window {
    __LINCH_KIT_CONFIG__?: any
  }
}

// 模块扩展
declare module '*.json' {
  const value: any
  export default value
}

declare module '*.md' {
  const content: string
  export default content
}
```

## 类型扩展模式

### 1. 模块扩展

```typescript
// 扩展现有类型
declare module '@linch-kit/types' {
  interface Config {
    customField?: string
  }
  
  interface AuthUser {
    customProperty?: any
  }
}
```

### 2. 条件类型

```typescript
// 条件类型示例
export type APIEndpoint<T> = T extends 'GET' 
  ? { method: 'GET'; params?: Record<string, string> }
  : T extends 'POST'
  ? { method: 'POST'; body: any }
  : never

export type InferSchemaType<T> = T extends Schema<infer U> ? U : never
```

### 3. 映射类型

```typescript
// 映射类型示例
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

export type Required<T> = {
  [P in keyof T]-?: T[P]
}

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
```

## 使用模式

### 1. 基础使用

```typescript
import type { ID, Timestamp, PaginatedResult } from '@linch-kit/types'

interface User {
  id: ID
  name: string
  createdAt: Timestamp
}

interface UserListResponse extends PaginatedResult<User> {
  // 自动包含分页字段
}
```

### 2. 泛型使用

```typescript
import type { AsyncResult, APIResponse } from '@linch-kit/types'

async function fetchUser(id: string): AsyncResult<User> {
  try {
    const response = await api.get(`/users/${id}`)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error }
  }
}
```

### 3. 工具类型使用

```typescript
import type { DeepPartial, ExtractReturn } from '@linch-kit/types'

type PartialUser = DeepPartial<User>
type CreateUserReturn = ExtractReturn<typeof createUser>
```

## 依赖关系

### 1. 外部依赖

```json
{
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

### 2. 内部依赖

```typescript
// 无内部依赖 - 作为基础类型包
interface InternalDependencies {
  // 无依赖
}
```

这个类型包为整个 Linch Kit 生态系统提供了统一、类型安全的类型定义基础。
