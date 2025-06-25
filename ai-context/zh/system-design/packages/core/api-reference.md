# @linch-kit/core API 参考

> **文档类型**: API参考  
> **适用场景**: 开发集成时查阅

## 🔌 插件系统

### PluginSystem
```typescript
export class PluginSystem {
  // 注册插件
  static async register(plugin: Plugin): Promise<void>
  
  // 加载插件
  static async load(pluginId: string): Promise<PluginContext>
  
  // 执行钩子
  static async executeHook(hookName: string, context: any): Promise<any>
  
  // 发布事件
  static emit(eventName: string, payload: any): void
  
  // 监听事件
  static on(eventName: string, handler: Function): void
}
```

### Plugin接口
```typescript
export interface Plugin {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly dependencies?: string[]
  setup(config: any): Promise<void>
  teardown?(): Promise<void>
}
```

## ⚙️ 配置管理

### ConfigManager
```typescript
export class ConfigManager {
  // 加载配置
  static async loadConfig<T>(path: string, schema?: ZodSchema<T>): Promise<T>
  
  // 设置配置
  static setConfig<T>(key: string, value: T): void
  
  // 获取配置
  static getConfig<T>(key: string, defaultValue?: T): T | undefined
  
  // 监听配置变化
  static onConfigChange(key: string, handler: (value: any) => void): void
}
```

## 📊 可观测性

### MetricsCollector
```typescript
export class MetricsCollector {
  // 注册指标
  static registerMetric(name: string, type: MetricType): void
  
  // 记录指标
  static recordMetric(name: string, value: number, labels?: Record<string, string>): void
  
  // 获取指标
  static getMetrics(): Promise<string>
}
```

### Logger
```typescript
export class Logger {
  static info(message: string, meta?: any): void
  static warn(message: string, meta?: any): void
  static error(message: string, error?: Error): void
  static debug(message: string, meta?: any): void
}
```

## 🖥️ CLI系统

### CommandRegistry
```typescript
export class CommandRegistry {
  // 注册命令
  static registerCommand(command: CommandDefinition): void
  
  // 执行命令
  static async executeCommand(name: string, args: string[]): Promise<any>
}

export interface CommandDefinition {
  name: string
  description: string
  options?: CommandOption[]
  handler: (args: string[], options: any) => Promise<any>
}
```

## 🔧 工具函数

### FileSystem
```typescript
export class FileSystem {
  static async readFile(path: string): Promise<string>
  static async writeFile(path: string, content: string): Promise<void>
  static async exists(path: string): Promise<boolean>
  static async createDir(path: string): Promise<void>
}
```

### NetworkUtils
```typescript
export class NetworkUtils {
  static async isPortAvailable(port: number): Promise<boolean>
  static async getLocalIP(): Promise<string>
  static async healthCheck(url: string): Promise<boolean>
}
```

## 🌐 国际化

### I18nManager
```typescript
export class I18nManager {
  static async loadMessages(locale: string, namespace: string): Promise<void>
  static t(key: string, params?: any): string
  static setLocale(locale: string): void
  static getLocale(): string
}
```

## 📝 基础类型

### 通用类型
```typescript
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

### 错误类型
```typescript
export abstract class LinchKitError extends Error {
  abstract readonly code: string
  abstract readonly category: 'validation' | 'runtime' | 'config'
}

export class PluginError extends LinchKitError {
  readonly code = 'PLUGIN_ERROR'
  readonly category = 'runtime' as const
}

export class ConfigError extends LinchKitError {
  readonly code = 'CONFIG_ERROR'
  readonly category = 'config' as const
}
```