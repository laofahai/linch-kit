# TypeScript 开发约定

> **适用范围**: 所有 @linch-kit/* 包  
> **更新**: 2025-01-25

## 🎯 核心配置

### 基础 tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

### 代码质量标准
- **类型覆盖率**: 100% (无 any 类型)
- **导出规范**: 统一使用 named exports
- **错误处理**: 使用 Result<T, E> 类型模式
- **性能要求**: 构建时间 < 10秒/包

## 🔧 通用类型定义

### 基础工具类型
```typescript
// 所有包共用的基础类型
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

export interface BaseConfig {
  readonly id: string
  readonly version: string
  readonly enabled: boolean
}
```

### 错误处理模式
```typescript
// 统一错误基类
export abstract class LinchKitError extends Error {
  abstract readonly code: string
  abstract readonly category: 'validation' | 'runtime' | 'config'
}
```

## 📦 包间集成模式

### 插件接口标准
```typescript
export interface Plugin<TConfig = unknown> {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly dependencies?: string[]
  setup(config: TConfig): Promise<void>
}
```

### 事件系统类型
```typescript
export interface EventBus {
  emit<T>(event: string, data: T): void
  on<T>(event: string, handler: (data: T) => void): void
}
```