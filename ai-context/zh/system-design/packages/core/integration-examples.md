# @linch-kit/core 集成示例

> **文档类型**: 集成示例  
> **适用场景**: 快速上手集成

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