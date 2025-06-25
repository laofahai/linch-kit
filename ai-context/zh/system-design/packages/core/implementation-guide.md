# @linch-kit/core 实现指南

> **文档类型**: 实现细节  
> **适用场景**: 深度定制和扩展

## 🏗️ 架构设计

### 模块组织
```
src/
├── plugin/           # 插件系统
│   ├── registry.ts   # 插件注册表
│   ├── lifecycle.ts  # 生命周期管理
│   └── hooks.ts      # 钩子系统
├── config/           # 配置管理
│   ├── manager.ts    # 配置管理器
│   ├── loader.ts     # 配置加载器
│   └── validator.ts  # 配置验证
├── observability/    # 可观测性
│   ├── metrics.ts    # 指标收集
│   ├── tracing.ts    # 分布式追踪
│   └── health.ts     # 健康检查
├── cli/             # CLI系统
│   ├── registry.ts   # 命令注册
│   └── executor.ts   # 命令执行
├── utils/           # 工具函数
└── types/           # 类型定义
```

## 🔌 插件系统实现

### 插件注册机制
```typescript
class PluginRegistry {
  private plugins = new Map<string, Plugin>()
  private dependencyGraph = new Map<string, string[]>()
  
  async register(plugin: Plugin): Promise<void> {
    // 1. 验证插件格式
    this.validatePlugin(plugin)
    
    // 2. 检查依赖关系
    await this.resolveDependencies(plugin)
    
    // 3. 注册到插件表
    this.plugins.set(plugin.id, plugin)
    
    // 4. 执行插件初始化
    await plugin.setup(this.getPluginConfig(plugin.id))
  }
}
```

### 事件系统实现
```typescript
class EventBus {
  private listeners = new Map<string, Function[]>()
  
  emit(event: string, payload: any): void {
    const handlers = this.listeners.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(payload)
      } catch (error) {
        Logger.error(`Event handler error: ${event}`, error)
      }
    })
  }
  
  on(event: string, handler: Function): void {
    const handlers = this.listeners.get(event) || []
    handlers.push(handler)
    this.listeners.set(event, handlers)
  }
}
```

## ⚙️ 配置管理实现

### 多租户配置架构 (基于成熟配置库)
```typescript
import { LRUCache } from 'lru-cache' // 使用成熟的 LRU 缓存库
import convict from 'convict' // 使用 convict 进行配置管理

interface TenantConfig {
  tenantId: string
  staticConfig: Record<string, unknown>    // 文件配置
  dynamicConfig: Record<string, unknown>   // 数据库配置
  runtimeConfig: Record<string, unknown>   // 运行时配置
}

/**
 * MultiTenantConfigManager - 基于 convict + lru-cache 的配置管理
 * 
 * 设计原则：
 * - 使用 convict 进行配置验证和类型检查
 * - 使用 lru-cache 进行高效缓存
 * - 避免重新实现配置管理逻辑
 */
class MultiTenantConfigManager {
  private tenantConfigs = new Map<string, TenantConfig>()
  // 使用成熟的 LRU 缓存库，而不是自己实现
  private configCache = new LRUCache<string, unknown>({ 
    max: 1000,
    ttl: 1000 * 60 * 15 // 15分钟过期
  })
  
  async getConfig(tenantId: string, key: string): Promise<unknown> {
    const cacheKey = `${tenantId}:${key}`
    
    // 1. 检查缓存 - 使用 lru-cache 的 API
    const cached = this.configCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }
    
    // 2. 从配置源获取
    const config = await this.loadTenantConfig(tenantId)
    const value = this.resolveConfigValue(config, key)
    
    // 3. 使用 convict 进行配置验证
    const validated = this.validateConfig(value)
    
    // 4. 更新缓存
    this.configCache.set(cacheKey, validated)
    
    return validated
  }
  
  private validateConfig(config: unknown): unknown {
    // 使用 convict 进行配置验证，而不是自己实现验证逻辑
    const schema = convict({
      // 定义配置schema
    })
    return schema.validate(config)
  }
}
```

### 配置热更新 (基于 chokidar)
```typescript
import chokidar from 'chokidar' // 使用成熟的文件监听库

/**
 * ConfigWatcher - 基于 chokidar 的配置文件监听
 * 
 * 设计原则：
 * - 使用 chokidar 替代原生 fs.watch，更稳定可靠
 * - 支持跨平台文件监听
 * - 提供防抖和错误恢复机制
 */
class ConfigWatcher {
  private watchers = new Map<string, chokidar.FSWatcher>()
  
  watchConfig(path: string, callback: (config: unknown) => void): void {
    // 使用 chokidar 而不是原生 fs.watch，更稳定
    const watcher = chokidar.watch(path, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100, // 防抖：文件停止变化100ms后再触发
        pollInterval: 100
      }
    })
    
    watcher.on('change', async () => {
      try {
        const newConfig = await this.loadConfigFile(path)
        callback(newConfig)
      } catch (error) {
        Logger.error('Config reload failed', error)
        // chokidar 自带错误恢复机制
      }
    })
    
    this.watchers.set(path, watcher)
  }
  
  private async loadConfigFile(path: string): Promise<unknown> {
    // 使用适当的配置文件解析器
    if (path.endsWith('.json')) {
      return JSON.parse(await fs.readFile(path, 'utf-8'))
    } else if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      const yaml = await import('yaml') // 动态导入，减少依赖
      return yaml.parse(await fs.readFile(path, 'utf-8'))
    }
    throw new Error(`Unsupported config file format: ${path}`)
  }
}
```

## 📊 可观测性实现

### Prometheus指标收集 (基于 prom-client)
```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client'

/**
 * MetricsRegistry - 基于 prom-client 的指标管理器
 * 
 * 设计原则：
 * - 不重复造轮子，直接使用 prom-client 的成熟功能
 * - 提供 LinchKit 风格的适配器接口
 * - 支持插件化的指标扩展
 */
class MetricsRegistry {
  private metrics = new Map<string, any>()
  
  constructor() {
    // 使用 prom-client 的默认注册表
    // 避免重新实现指标收集逻辑
  }
  
  createCounter(name: string, help: string, labels?: string[]): Counter {
    const counter = new Counter({ 
      name: this.addPrefix(name), 
      help, 
      labelNames: labels,
      registers: [register] // 使用 prom-client 注册表
    })
    this.metrics.set(name, counter)
    return counter
  }
  
  createHistogram(name: string, help: string, buckets?: number[]): Histogram {
    const histogram = new Histogram({ 
      name: this.addPrefix(name), 
      help, 
      buckets: buckets || [0.1, 0.5, 1, 2, 5], // 使用标准桶
      registers: [register]
    })
    this.metrics.set(name, histogram)
    return histogram
  }
  
  private addPrefix(name: string): string {
    return `linchkit_${name}`
  }
  
  // 直接暴露 prom-client 的 register 功能
  getMetrics(): Promise<string> {
    return register.metrics()
  }
}
```

### OpenTelemetry集成
```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api'

class TracingManager {
  private tracer = trace.getTracer('@linch-kit/core')
  
  async withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(name)
    
    try {
      const result = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      })
      throw error
    } finally {
      span.end()
    }
  }
}
```

## 🖥️ CLI系统实现

### 命令注册和执行
```typescript
class CLIManager {
  private commands = new Map<string, CommandDefinition>()
  
  registerCommand(command: CommandDefinition): void {
    this.validateCommand(command)
    this.commands.set(command.name, command)
  }
  
  async executeCommand(name: string, args: string[]): Promise<any> {
    const command = this.commands.get(name)
    if (!command) {
      throw new Error(`Unknown command: ${name}`)
    }
    
    const options = this.parseOptions(command.options, args)
    
    return await MetricsCollector.withMetrics(
      `cli.command.${name}`,
      () => command.handler(args, options)
    )
  }
}
```

## 🔧 性能优化

### 懒加载模式
```typescript
class LazyLoader<T> {
  private loader: () => Promise<T>
  private cached?: T
  private loading?: Promise<T>
  
  constructor(loader: () => Promise<T>) {
    this.loader = loader
  }
  
  async get(): Promise<T> {
    if (this.cached) {
      return this.cached
    }
    
    if (this.loading) {
      return this.loading
    }
    
    this.loading = this.loader()
    this.cached = await this.loading
    this.loading = undefined
    
    return this.cached
  }
}
```

### 内存管理
```typescript
class MemoryManager {
  private static readonly MAX_CACHE_SIZE = 1000
  private static readonly CLEANUP_INTERVAL = 60000 // 1分钟
  
  static startCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries()
      this.reportMemoryUsage()
    }, this.CLEANUP_INTERVAL)
  }
  
  private static cleanupExpiredEntries(): void {
    // 清理过期缓存条目
  }
  
  private static reportMemoryUsage(): void {
    const usage = process.memoryUsage()
    MetricsCollector.recordMetric('memory.heap.used', usage.heapUsed)
    MetricsCollector.recordMetric('memory.heap.total', usage.heapTotal)
  }
}
```