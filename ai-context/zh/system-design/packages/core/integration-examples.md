# @linch-kit/core 集成示例

> **文档类型**: 集成示例  
> **适用场景**: 快速上手集成，了解最佳实践

## 🎯 概览

本文档提供 @linch-kit/core 与其他包的集成示例，以及在实际项目中的使用模式。通过这些示例，您可以快速理解如何在项目中集成和使用 LinchKit 的核心功能。

## 🔌 基础插件开发

### 创建简单插件
```typescript
import { Plugin, PluginSystem } from '@linch-kit/core'

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  
  async setup(config) {
    console.log('Plugin initialized with config:', config)
    
    // 注册事件监听器
    PluginSystem.on('user.created', (data) => {
      console.log('New user created:', data.userId)
    })
    
    // 注册CLI命令
    CommandRegistry.registerCommand({
      name: 'my-plugin:hello',
      description: 'Say hello',
      async handler(args, options) {
        return `Hello from ${this.name}!`
      }
    })
  }
}

// 注册插件
await PluginSystem.register(myPlugin)
```

### 插件间通信
```typescript
// 插件A - 发布事件
const pluginA: Plugin = {
  id: 'plugin-a',
  async setup() {
    // 发布事件
    PluginSystem.emit('data.processed', {
      processedAt: new Date(),
      data: { /* ... */ }
    })
  }
}

// 插件B - 监听事件
const pluginB: Plugin = {
  id: 'plugin-b',
  async setup() {
    // 监听事件
    PluginSystem.on('data.processed', (payload) => {
      console.log('Data processed:', payload)
    })
  }
}
```

## ⚙️ 配置管理集成

### 基础配置加载
```typescript
import { ConfigManager } from '@linch-kit/core'
import { z } from 'zod'

// 定义配置Schema
const AppConfigSchema = z.object({
  port: z.number().default(3000),
  database: z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string()
  }),
  features: z.object({
    enableAuth: z.boolean().default(true),
    enableMetrics: z.boolean().default(false)
  })
})

// 加载和验证配置
const config = await ConfigManager.loadConfig('./config.json', AppConfigSchema)

// 使用配置
console.log(`Server will run on port ${config.port}`)
```

### 多租户配置
```typescript
// 获取租户特定配置
const tenantConfig = await ConfigManager.getTenantConfig('tenant-123', 'database')

// 设置运行时配置
ConfigManager.setRuntimeConfig('tenant-123', 'feature.newUI', true)

// 监听配置变化
ConfigManager.onConfigChange('tenant-123', 'feature.newUI', (value) => {
  console.log('UI feature toggle changed:', value)
})
```

## 📊 可观测性集成

### 指标收集
```typescript
import { MetricsCollector } from '@linch-kit/core'

// 注册业务指标
MetricsCollector.registerMetric('user.requests.total', 'counter')
MetricsCollector.registerMetric('user.request.duration', 'histogram')

// 在业务逻辑中记录指标
export async function handleUserRequest(req: Request) {
  const startTime = Date.now()
  
  try {
    // 处理请求
    const result = await processRequest(req)
    
    // 记录成功指标
    MetricsCollector.recordMetric('user.requests.total', 1, {
      method: req.method,
      status: 'success'
    })
    
    return result
  } catch (error) {
    // 记录失败指标
    MetricsCollector.recordMetric('user.requests.total', 1, {
      method: req.method,
      status: 'error'
    })
    throw error
  } finally {
    // 记录响应时间
    const duration = Date.now() - startTime
    MetricsCollector.recordMetric('user.request.duration', duration)
  }
}
```

### 分布式追踪
```typescript
import { TracingManager } from '@linch-kit/core'

export async function complexOperation(data: any) {
  return await TracingManager.withSpan('complex-operation', async () => {
    // 子操作1
    const step1 = await TracingManager.withSpan('step-1', async () => {
      return await processStep1(data)
    })
    
    // 子操作2
    const step2 = await TracingManager.withSpan('step-2', async () => {
      return await processStep2(step1)
    })
    
    return { step1, step2 }
  })
}
```

## 🖥️ CLI命令开发

### 注册自定义命令
```typescript
import { CommandRegistry } from '@linch-kit/core'

CommandRegistry.registerCommand({
  name: 'schema:generate',
  description: 'Generate schema-based code',
  options: [
    {
      name: 'output',
      type: 'string',
      description: 'Output directory',
      required: true
    },
    {
      name: 'watch',
      type: 'boolean',
      description: 'Watch for changes',
      default: false
    }
  ],
  async handler(args, options) {
    console.log(`Generating to ${options.output}`)
    
    if (options.watch) {
      console.log('Watching for changes...')
      // 启动文件监听
    }
    
    return { success: true, message: 'Generation completed' }
  }
})
```

### 命令组合
```typescript
// 组合多个命令
CommandRegistry.registerCommand({
  name: 'deploy',
  description: 'Deploy the application',
  async handler(args, options) {
    // 1. 构建
    await CommandRegistry.executeCommand('build', [])
    
    // 2. 测试
    await CommandRegistry.executeCommand('test', ['--coverage'])
    
    // 3. 部署
    await CommandRegistry.executeCommand('docker:push', [])
    
    return { success: true, message: 'Deployment completed' }
  }
})
```

## 🌐 国际化集成

### 基础国际化设置
```typescript
import { I18nManager } from '@linch-kit/core'

// 加载语言包
await I18nManager.loadMessages('zh-CN', 'common')
await I18nManager.loadMessages('zh-CN', 'errors')

// 设置当前语言
I18nManager.setLocale('zh-CN')

// 使用翻译
const welcomeMessage = I18nManager.t('common.welcome', { name: 'User' })
const errorMessage = I18nManager.t('errors.validation.required', { field: 'email' })
```

### 动态语言切换
```typescript
// 监听语言变化
I18nManager.onLocaleChange((newLocale) => {
  console.log(`Language changed to: ${newLocale}`)
  // 重新渲染UI或更新内容
})

// 运行时切换语言
I18nManager.setLocale('en-US')
```

## 🔧 工具函数使用

### 文件系统操作
```typescript
import { FileSystem } from '@linch-kit/core'

// 检查文件是否存在
if (await FileSystem.exists('./config.json')) {
  const content = await FileSystem.readFile('./config.json')
  const config = JSON.parse(content)
}

// 创建目录和文件
await FileSystem.createDir('./output')
await FileSystem.writeFile('./output/result.json', JSON.stringify(data))
```

### 网络工具
```typescript
import { NetworkUtils } from '@linch-kit/core'

// 检查端口可用性
const port = 3000
if (await NetworkUtils.isPortAvailable(port)) {
  console.log(`Port ${port} is available`)
} else {
  console.log(`Port ${port} is in use`)
}

// 健康检查
const isHealthy = await NetworkUtils.healthCheck('http://localhost:3000/health')
```

## 🚨 错误处理

### 统一错误处理
```typescript
import { Result, LinchKitError } from '@linch-kit/core'

export async function safeOperation(data: any): Promise<Result<any, LinchKitError>> {
  try {
    const result = await riskyOperation(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof LinchKitError) {
      return { success: false, error }
    }
    
    return { 
      success: false, 
      error: new LinchKitError('UNKNOWN_ERROR', error.message) 
    }
  }
}

// 使用
const result = await safeOperation(inputData)
if (result.success) {
  console.log('Success:', result.data)
} else {
  console.error('Error:', result.error.message)
}
```

## 🚀 完整应用示例

### 企业级应用启动

```typescript
// app.ts
import { 
  PluginSystem, 
  ConfigManager, 
  Logger,
  MetricsCollector,
  I18nManager 
} from '@linch-kit/core'

export class LinchKitApplication {
  private static instance: LinchKitApplication
  
  private constructor() {}
  
  static getInstance(): LinchKitApplication {
    if (!LinchKitApplication.instance) {
      LinchKitApplication.instance = new LinchKitApplication()
    }
    return LinchKitApplication.instance
  }
  
  async start() {
    const startTime = Date.now()
    
    try {
      Logger.info('Starting LinchKit application...')
      
      // 1. 初始化配置
      await this.initializeConfig()
      
      // 2. 初始化国际化
      await this.initializeI18n()
      
      // 3. 初始化监控
      await this.initializeMetrics()
      
      // 4. 加载核心插件
      await this.loadCorePlugins()
      
      // 5. 启动业务服务
      await this.startServices()
      
      const duration = Date.now() - startTime
      MetricsCollector.recordMetric('app_startup_duration_ms', duration)
      Logger.info(`Application started successfully in ${duration}ms`)
      
      // 发布启动完成事件
      PluginSystem.emit('app:started', {
        startTime: new Date(),
        duration
      })
      
    } catch (error) {
      Logger.error('Failed to start application', error)
      throw error
    }
  }
  
  private async initializeConfig() {
    const config = await ConfigManager.loadConfig('./config/app.json')
    Logger.info('Configuration loaded', { 
      environment: config.environment,
      features: Object.keys(config.features || {})
    })
  }
  
  private async initializeI18n() {
    await I18nManager.loadMessages('zh-CN', 'common')
    await I18nManager.loadMessages('en-US', 'common')
    I18nManager.setLocale('zh-CN')
    Logger.info('Internationalization initialized')
  }
  
  private async initializeMetrics() {
    // 注册核心指标
    MetricsCollector.registerMetric('app_startup_duration_ms', 'gauge')
    MetricsCollector.registerMetric('plugin_count', 'gauge')
    MetricsCollector.registerMetric('active_connections', 'gauge')
    Logger.info('Metrics system initialized')
  }
  
  private async loadCorePlugins() {
    const corePlugins = [
      '@linch-kit/auth',
      '@linch-kit/schema', 
      '@linch-kit/crud',
      '@linch-kit/trpc'
    ]
    
    for (const pluginName of corePlugins) {
      try {
        const plugin = await import(`./plugins/${pluginName}`)
        await PluginSystem.register(plugin.default)
        Logger.info(`Plugin loaded: ${pluginName}`)
      } catch (error) {
        Logger.warn(`Failed to load plugin: ${pluginName}`, error)
      }
    }
    
    MetricsCollector.recordMetric('plugin_count', corePlugins.length)
  }
  
  private async startServices() {
    // 启动服务的逻辑
    PluginSystem.emit('services:start')
  }
  
  async shutdown() {
    Logger.info('Shutting down application...')
    
    // 发布关闭事件
    PluginSystem.emit('app:shutdown')
    
    // 等待插件清理
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    Logger.info('Application shutdown completed')
  }
}

// 启动应用
const app = LinchKitApplication.getInstance()
await app.start()

// 优雅关闭处理
process.on('SIGTERM', async () => {
  await app.shutdown()
  process.exit(0)
})
```

### 跨包集成示例

```typescript
// integration/cross-package-example.ts
import { PluginSystem, ConfigManager, Logger, MetricsCollector } from '@linch-kit/core'

// 模拟其他包的集成
export class CrossPackageIntegration {
  static async setupSchemaIntegration() {
    // 与 @linch-kit/schema 的集成
    PluginSystem.on('schema:generated', async (schema) => {
      Logger.info('Schema generated, triggering CRUD generation')
      PluginSystem.emit('crud:generate', { schema })
    })
    
    PluginSystem.on('crud:generated', async (crudConfig) => {
      Logger.info('CRUD generated, setting up tRPC routes')
      PluginSystem.emit('trpc:setup', { crudConfig })
    })
  }
  
  static async setupAuthIntegration() {
    // 与 @linch-kit/auth 的集成
    PluginSystem.on('user:authenticated', async (user) => {
      Logger.info(`User authenticated: ${user.id}`)
      
      // 记录用户活动指标
      MetricsCollector.recordMetric('user_logins_total', 1, {
        provider: user.provider,
        role: user.role
      })
    })
    
    PluginSystem.on('user:unauthorized', async (attempt) => {
      Logger.warn('Unauthorized access attempt', attempt)
      
      // 记录安全指标
      MetricsCollector.recordMetric('unauthorized_attempts_total', 1, {
        ip: attempt.ip,
        path: attempt.path
      })
    })
  }
  
  static async setupUIIntegration() {
    // 与 @linch-kit/ui 的集成
    PluginSystem.on('ui:component:generated', async (component) => {
      Logger.info(`UI component generated: ${component.name}`)
      
      // 自动注册到控制台
      PluginSystem.emit('console:register:component', component)
    })
  }
}

// 初始化跨包集成
await CrossPackageIntegration.setupSchemaIntegration()
await CrossPackageIntegration.setupAuthIntegration()
await CrossPackageIntegration.setupUIIntegration()
```

## 📝 最佳实践总结

### 1. 插件开发规范

```typescript
// ✅ 推荐的插件结构
export const recommendedPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  dependencies: ['@linch-kit/core'],
  
  async setup(config: any) {
    try {
      Logger.info(`Initializing plugin: ${this.name}`)
      
      // 验证配置
      await this.validateConfig(config)
      
      // 注册事件监听器
      this.registerEventListeners()
      
      // 注册CLI命令
      this.registerCommands()
      
      Logger.info(`Plugin initialized successfully: ${this.name}`)
    } catch (error) {
      Logger.error(`Plugin initialization failed: ${this.name}`, error)
      throw error
    }
  },
  
  async teardown() {
    Logger.info(`Cleaning up plugin: ${this.name}`)
    // 清理资源
    await this.cleanup()
  },
  
  private async validateConfig(config: any) {
    // 配置验证逻辑
  },
  
  private registerEventListeners() {
    // 事件监听器注册
  },
  
  private registerCommands() {
    // CLI命令注册
  },
  
  private async cleanup() {
    // 资源清理逻辑
  }
}
```

### 2. 监控集成规范

```typescript
// ✅ 统一的监控模式
export class MonitoringBestPractices {
  static setupBusinessMetrics() {
    // 业务指标命名规范：业务域.操作.单位
    MetricsCollector.registerMetric('user.registrations.total', 'counter')
    MetricsCollector.registerMetric('order.processing.duration_ms', 'histogram')
    MetricsCollector.registerMetric('inventory.items.count', 'gauge')
  }
  
  static recordOperationMetrics(operation: string, duration: number, success: boolean) {
    // 记录操作指标
    MetricsCollector.recordMetric(`operation.${operation}.duration_ms`, duration)
    MetricsCollector.recordMetric(`operation.${operation}.total`, 1, {
      status: success ? 'success' : 'error'
    })
  }
  
  static logStructuredEvent(event: string, data: any) {
    // 结构化日志记录
    Logger.info(`Event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...data
    })
  }
}
```

### 3. 错误处理规范

```typescript
// ✅ 统一的错误处理模式
export class ErrorHandlingBestPractices {
  static async withErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<Result<T, LinchKitError>> {
    const startTime = Date.now()
    
    try {
      Logger.debug(`Starting operation: ${operation}`)
      const result = await fn()
      
      const duration = Date.now() - startTime
      Logger.debug(`Operation completed: ${operation}`, { duration })
      
      return { success: true, data: result }
    } catch (error) {
      const duration = Date.now() - startTime
      Logger.error(`Operation failed: ${operation}`, error, { duration })
      
      // 记录错误指标
      MetricsCollector.recordMetric('operation.errors.total', 1, {
        operation,
        error_type: error.constructor.name
      })
      
      if (error instanceof LinchKitError) {
        return { success: false, error }
      }
      
      return { 
        success: false, 
        error: new LinchKitError('OPERATION_ERROR', `${operation} failed: ${error.message}`)
      }
    }
  }
}
```

## 🔗 相关链接

- [API参考](./api-reference.md) - 完整API文档
- [实现指南](./implementation-guide.md) - 内部实现细节
- [高级特性](./advanced-features.md) - 企业级特性说明
- [集成模式](../../../shared/integration-patterns.md) - 通用集成模式
- [TypeScript约定](../../../shared/typescript-conventions.md) - 开发约定
```