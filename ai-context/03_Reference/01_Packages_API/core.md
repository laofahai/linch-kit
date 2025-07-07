# @linch-kit/core API 参考文档

---
package: "@linch-kit/core"
version: "2.0.2"
layer: "L0"
dependencies: []
completeness: 95%
test_coverage: 85%
status: "production_ready"
document_type: "api_reference"
purpose: "Graph RAG knowledge base - Core package API definitions"
api_exports:
  - name: "createPluginRegistry"
    type: "function"
    status: "complete"
  - name: "ConfigManager"
    type: "class"
    status: "complete"
    server_only: true
  - name: "Logger"
    type: "class"
    status: "complete"
  - name: "AuditLogger"
    type: "class"
    status: "complete"
  - name: "I18nManager"
    type: "class"
    status: "complete"
relationships:
  - type: "provides_infrastructure"
    targets: ["@linch-kit/schema", "@linch-kit/auth", "@linch-kit/crud", "@linch-kit/trpc", "@linch-kit/ui"]
last_verified: "2025-07-07"
---

**状态**: 生产就绪（部分功能需要增强）  
**AI-Assisted**: true  
**目标**: 为 @linch-kit/core 包提供完整的 API 参考文档，涵盖所有公共接口、使用示例和最佳实践

## 📦 包概述

@linch-kit/core 是 LinchKit 生态系统的基础设施包，提供核心功能支持：
- 插件系统
- 配置管理
- 日志系统
- 审计系统
- CLI 框架
- 国际化
- 可观测性（部分实现）

## 🔌 插件系统

### createPluginRegistry()
创建插件注册表实例。

```typescript
import { createPluginRegistry } from '@linch-kit/core'

const registry = createPluginRegistry()
```

### PluginRegistry API

#### register(plugin: Plugin): Promise<void>
注册插件到系统。

```typescript
await registry.register({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  dependencies: ['config-plugin'], // 可选依赖
  setup: async (context) => {
    // 插件初始化逻辑
  },
  start: async (context) => {
    // 插件启动逻辑
    return { success: true }
  },
  stop: async (context) => {
    // 插件停止逻辑
    return { success: true }
  }
})
```

#### startAll(): Promise<void>
按依赖顺序启动所有插件。

```typescript
await registry.startAll()
```

#### stopAll(): Promise<void>
按依赖顺序停止所有插件。

```typescript
await registry.stopAll()
```

#### 事件监听
```typescript
registry.on('pluginRegistered', ({ plugin }) => {
  console.log(`插件 ${plugin.name} 已注册`)
})

registry.on('pluginStarted', ({ plugin, result }) => {
  console.log(`插件 ${plugin.name} 启动完成`)
})

registry.on('pluginStopped', ({ plugin, result }) => {
  console.log(`插件 ${plugin.name} 已停止`)
})

registry.on('pluginError', ({ plugin, error, phase }) => {
  console.error(`插件 ${plugin.name} 在 ${phase} 阶段出错:`, error)
})
```

## ⚙️ 配置管理

### ConfigManager (服务端)
需要从 `@linch-kit/core/server` 导入。

```typescript
import { ConfigManager } from '@linch-kit/core/server'

const configManager = new ConfigManager()

// 设置配置
configManager.set('api.url', 'https://api.example.com')

// 获取配置
const apiUrl = configManager.get('api.url', 'default-url')

// 监听配置变化
configManager.watch('api.*', (event) => {
  console.log('API配置已变更:', event)
})

// 从文件加载配置
await configManager.load({
  type: 'file',
  path: './config.json'
})
```

### SimpleTenantConfigManager (客户端安全)
多租户配置管理器。

```typescript
import { createSimpleTenantConfigManager } from '@linch-kit/core'

const configManager = createSimpleTenantConfigManager({
  cacheOptions: {
    max: 1000,
    ttl: 1000 * 60 * 60 // 1小时
  }
})

// 创建租户
await configManager.createTenant({
  tenantId: 'tenant-001',
  initialConfig: {
    apiUrl: 'https://api.tenant001.com',
    features: ['premium', 'analytics']
  }
})

// 获取租户配置
const apiUrl = configManager.get('apiUrl', '', { tenantId: 'tenant-001' })

// 更新租户配置
configManager.set('features', ['premium', 'analytics', 'export'], { 
  tenantId: 'tenant-001' 
})
```

### NextjsEnvProvider
Next.js 环境变量支持。

```typescript
import { createNextjsEnvProvider } from '@linch-kit/core/server'

const envProvider = createNextjsEnvProvider()
const configSource = envProvider.createConfigSource()

// 在 next.config.js 中使用
const nextjsConfig = await envProvider.getNextjsConfig()
```

## 📝 日志系统

### createLogger(options?)
创建日志器实例。

```typescript
import { createLogger } from '@linch-kit/core'

const logger = createLogger({
  name: 'my-service',
  level: 'info', // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  prettyPrint: process.env.NODE_ENV === 'development'
})

// 日志方法
logger.debug('调试信息', { userId: 123 })
logger.info('普通信息', { action: 'user_login' })
logger.warn('警告信息', { memory: '90%' })
logger.error('错误信息', new Error('Something wrong'))
logger.fatal('致命错误', new Error('System crash'))

// 创建子日志器
const childLogger = logger.child({ module: 'auth' })
childLogger.info('认证模块日志')
```

## 🔍 审计系统

### createAuditManager(config)
创建审计管理器。

```typescript
import { createAuditManager, createDataMasker } from '@linch-kit/core'

const auditManager = createAuditManager({
  policy: {
    enabled: true,
    async: true,
    batchSize: 100,
    flushInterval: 5000,
    filters: {
      categories: ['security', 'data-access'],
      severities: ['high', 'critical']
    },
    masking: {
      enabled: true,
      masker: createDataMasker()
    }
  }
})

// 记录审计事件
await auditManager.log({
  action: 'user.login',
  actor: {
    id: 'user-123',
    type: 'user',
    name: 'John Doe'
  },
  resource: {
    type: 'system',
    id: 'auth-service'
  },
  result: 'success',
  category: 'security',
  severity: 'info',
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
})

// 查询审计日志
const events = await auditManager.query({
  filters: {
    action: 'user.login',
    startTime: new Date('2025-01-01'),
    endTime: new Date()
  },
  pagination: {
    page: 1,
    pageSize: 20
  }
})
```

### DataMasker
数据脱敏工具。

```typescript
import { createDataMasker } from '@linch-kit/core'

const masker = createDataMasker()

// 自动识别并脱敏敏感字段
const maskedData = masker.mask({
  password: 'secret123',      // -> '******'
  email: 'user@example.com',  // -> 'u***@example.com'
  phone: '13812345678',       // -> '138****5678'
  creditCard: '1234567890123456', // -> '1234********3456'
  apiKey: 'sk-abcdef123456'   // -> '******'
})

// 添加自定义敏感字段模式
masker.addSensitivePattern(/custom_secret_\w+/)
```

## 🛠️ CLI 框架

### createCLIManager()
创建 CLI 管理器（仅服务端）。

```typescript
import { createCLIManager } from '@linch-kit/core/server'

const cli = createCLIManager()

// 注册命令
cli.registerCommand({
  name: 'generate',
  description: '代码生成工具',
  category: 'dev',
  options: [
    {
      name: 'type',
      description: '生成类型',
      required: true,
      type: 'string',
      choices: ['component', 'api', 'page']
    },
    {
      name: 'name',
      description: '名称',
      required: true,
      type: 'string'
    }
  ],
  handler: async ({ args, options, t }) => {
    const { type, name } = options
    
    console.log(t('generate.starting', { type, name }))
    
    // 生成逻辑
    
    return { 
      success: true, 
      data: { path: `./src/${type}s/${name}` }
    }
  }
})

// 执行命令
await cli.executeCommand('generate', ['--type', 'component', '--name', 'Button'])
```

## 🌍 国际化

### createPackageI18n(config)
创建包级 i18n 实例。

```typescript
import { createPackageI18n, useTranslation } from '@linch-kit/core'

// 创建包级 i18n
const packageI18n = createPackageI18n({
  packageName: 'my-package',
  defaultLocale: 'en',
  defaultMessages: {
    en: {
      'greeting': 'Hello {name}!',
      'error.notFound': 'Resource not found'
    },
    'zh-CN': {
      'greeting': '你好 {name}！',
      'error.notFound': '资源未找到'
    }
  }
})

// 获取翻译函数
const t = packageI18n.getTranslation()

console.log(t('greeting', { name: 'World' })) // "Hello World!"

// 支持用户传入自定义翻译
export const useMyPackageTranslation = (userT?: TranslationFunction) =>
  packageI18n.getTranslation(userT)
```

## 📊 可观测性

### 健康检查
```typescript
import { createHealthChecker } from '@linch-kit/core'

const health = createHealthChecker({
  gracefulShutdownTimeout: 10000
})

// 添加检查器
health.addChecker('database', async () => {
  try {
    await db.ping()
    return { status: 'healthy' }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message 
    }
  }
})

// 执行健康检查
const status = await health.check()
// { status: 'healthy', checks: { database: { status: 'healthy' } } }

// 获取特定检查器状态
const dbStatus = await health.checkOne('database')
```

### 指标收集（服务端）
⚠️ **注意**: 指标系统目前测试覆盖不足，使用时需谨慎。

```typescript
import { createMetricCollector } from '@linch-kit/core/server'

const metrics = createMetricCollector({
  enableDefaultMetrics: true,
  defaultMetricsPrefix: 'linchkit_'
})

// 创建指标
const httpRequests = metrics.createCounter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labels: ['method', 'status']
})

// 记录指标
httpRequests.inc(1, { method: 'GET', status: '200' })

// 导出 Prometheus 格式
const metricsText = await metrics.getMetrics()
```

### 分布式追踪
⚠️ **注意**: 追踪系统目前测试覆盖不足，使用时需谨慎。

```typescript
import { createTracer } from '@linch-kit/core'

const tracer = createTracer('my-service', '1.0.0')

// 创建 span
const span = tracer.startSpan('process-request')
span.setAttribute('user.id', '123')
span.setAttribute('request.method', 'GET')

try {
  // 业务逻辑
  span.setStatus({ code: 0 }) // OK
} catch (error) {
  span.recordException(error)
  span.setStatus({ code: 2, message: error.message }) // ERROR
} finally {
  span.end()
}

// 使用 withSpan 简化
await tracer.withSpan('database-query', async (span) => {
  span.setAttribute('db.table', 'users')
  return await db.query('SELECT * FROM users')
})
```

## 🚨 已知问题和限制

### 1. 事件系统分散
- **问题**: 各模块独立实现事件系统，缺少统一的事件总线
- **影响**: 跨模块通信困难
- **建议**: 等待统一事件总线实现

### 2. 可观测性模块不完整
- **问题**: 指标和追踪系统测试覆盖率低，可能存在 bug
- **影响**: 生产环境使用风险
- **建议**: 谨慎使用，等待改进

### 3. 缺少错误处理框架
- **问题**: 没有统一的错误类型和处理机制
- **影响**: 错误处理不一致
- **建议**: 自行实现错误处理逻辑

### 4. WebSocket 支持缺失
- **问题**: 文档中提到的实时通信功能未实现
- **影响**: 无法支持实时功能
- **建议**: 使用第三方 WebSocket 库

### 5. 缓存抽象缺失
- **问题**: 只有配置管理使用了 LRU-Cache，没有通用缓存抽象
- **影响**: 其他模块需要自行实现缓存
- **建议**: 使用第三方缓存库

## 🔧 最佳实践

### 插件开发
```typescript
// 良好的插件结构
export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  dependencies: ['core-plugin'], // 声明依赖
  
  async setup(context) {
    // 只做初始化，不启动服务
    context.logger.info('插件初始化')
  },
  
  async start(context) {
    try {
      // 启动服务
      await startService()
      return { success: true }
    } catch (error) {
      context.logger.error('启动失败', error)
      return { success: false, error }
    }
  },
  
  async stop(context) {
    try {
      // 优雅停止
      await stopService()
      return { success: true }
    } catch (error) {
      // 确保清理资源
      await forceCleanup()
      return { success: false, error }
    }
  }
}
```

### 配置管理
```typescript
// 使用环境变量 + 文件配置的最佳实践
const configManager = new ConfigManager()

// 1. 加载默认配置
await configManager.load({
  type: 'file',
  path: './config/default.json'
})

// 2. 加载环境特定配置
if (process.env.NODE_ENV) {
  await configManager.load({
    type: 'file',
    path: `./config/${process.env.NODE_ENV}.json`
  })
}

// 3. 加载环境变量（最高优先级）
await configManager.load({
  type: 'env',
  prefix: 'APP_'
})
```

### 审计日志
```typescript
// 审计关键操作的最佳实践
async function deleteUser(userId: string, actor: User) {
  const user = await getUser(userId)
  
  // 记录审计日志
  await auditManager.log({
    action: 'user.delete',
    actor: {
      id: actor.id,
      type: 'user',
      name: actor.name
    },
    resource: {
      type: 'user',
      id: userId,
      name: user.name
    },
    result: 'pending',
    category: 'security',
    severity: 'high',
    metadata: {
      reason: 'Account closure request',
      deletedData: masker.mask(user) // 脱敏敏感数据
    }
  })
  
  try {
    await performDelete(userId)
    
    // 更新审计结果
    await auditManager.log({
      action: 'user.delete',
      result: 'success',
      // ... 其他字段
    })
  } catch (error) {
    await auditManager.log({
      action: 'user.delete',
      result: 'failure',
      metadata: { error: error.message },
      // ... 其他字段
    })
    throw error
  }
}
```

## 📚 相关资源

- [LinchKit 核心包设计文档](../../01_strategy_and_architecture/core_packages.md)
- [包 API 快速参考](../packages_api.md)
- [GitHub 仓库](https://github.com/linch-kit/linch-kit)
- [问题反馈](https://github.com/linch-kit/linch-kit/issues)

---

🤖 **Generated with [Claude Code](https://claude.ai/code)**  
**Co-Authored-By**: Claude <noreply@anthropic.com>