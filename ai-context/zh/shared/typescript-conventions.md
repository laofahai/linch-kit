# TypeScript 开发约定

> **适用范围**: 所有 @linch-kit/* 包  
> **更新**: 2025-06-26

## 🎯 核心配置

请参考 [LinchKit AI 开发助手核心指导](../../MASTER_GUIDELINES.md) 中的“TypeScript 强制要求”部分，了解完整的 TypeScript 配置和代码质量标准。

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