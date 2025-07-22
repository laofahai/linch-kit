# @linch-kit/starter

LinchKit Starter Package - Next.js应用模板和集成工具

## 📋 概述

`@linch-kit/starter` 提供了一套完整的工具和模板，用于快速创建和管理LinchKit驱动的Next.js应用。该包包含：

- 🔧 **配置管理** - 声明式的应用配置和扩展集成
- 📦 **扩展系统** - 动态扩展加载和管理
- 🎨 **模板生成** - 自动生成Next.js、tRPC、认证等配置文件
- ⚛️ **React组件** - 开箱即用的Provider和初始化组件
- 🛠️ **CLI工具** - 命令行接口用于应用管理

## 🚀 快速开始

### 安装

```bash
bun add @linch-kit/starter
```

### 基本使用

#### 1. 客户端集成

```tsx
import { StarterProvider, ExtensionInitializer } from '@linch-kit/starter/client'
import { useStarterConfig } from '@linch-kit/starter/client'

// 应用配置
const config = {
  appName: 'My LinchKit App',
  version: '1.0.0',
  extensions: ['console', 'platform'],
  auth: { enabled: true, provider: 'supabase' },
  database: { enabled: true, provider: 'prisma' },
  trpc: { enabled: true },
  ui: { theme: 'system' }
}

function App() {
  return (
    <StarterProvider config={config}>
      <ExtensionInitializer />
      <MyAppContent />
    </StarterProvider>
  )
}

function MyAppContent() {
  const { config, updateConfig } = useStarterConfig()
  
  return (
    <div>
      <h1>{config.appName}</h1>
      <p>Version: {config.version}</p>
      <p>Extensions: {config.extensions.length}</p>
    </div>
  )
}
```

#### 2. 服务端集成

```typescript
import { 
  StarterIntegrationManager, 
  TemplateGenerator,
  StarterCLI 
} from '@linch-kit/starter/server'

// 创建集成管理器
const manager = new StarterIntegrationManager(config)
await manager.initialize(config)

// 添加扩展
await manager.addExtension({
  name: 'analytics',
  version: '1.0.0',
  enabled: true,
  config: { apiKey: 'your-api-key' }
})

// 生成配置文件
const generator = new TemplateGenerator()
const nextConfig = generator.generateNextConfig(config)
const trpcRouter = generator.generateTrpcRouter(config)
```

#### 3. 模板生成

```typescript
import { TemplateGenerator } from '@linch-kit/starter/templates'

const generator = new TemplateGenerator()

// 生成完整配置
const templates = generator.generateCompleteConfig(config, extensions)

console.log(templates.nextConfig)     // Next.js 配置
console.log(templates.trpcRouter)     // tRPC 路由
console.log(templates.authMiddleware) // 认证中间件
console.log(templates.extensionConfig) // 扩展配置
```

## 📚 API 参考

### 类型定义

#### StarterConfig

```typescript
interface StarterConfig {
  appName: string
  version?: string
  extensions?: string[]
  auth?: {
    enabled?: boolean
    provider?: 'supabase' | 'nextauth' | 'custom'
  }
  database?: {
    enabled?: boolean
    provider?: 'prisma' | 'drizzle'
  }
  trpc?: {
    enabled?: boolean
  }
  ui?: {
    theme?: 'light' | 'dark' | 'system'
    components?: string[]
  }
}
```

#### ExtensionIntegration

```typescript
interface ExtensionIntegration {
  name: string
  version: string
  enabled?: boolean
  config?: Record<string, unknown>
}
```

### 客户端API

#### StarterProvider

```tsx
<StarterProvider 
  config={starterConfig}
  onConfigUpdate={(config) => console.log('Config updated:', config)}
>
  {children}
</StarterProvider>
```

#### useStarterConfig

```typescript
const {
  config,
  updateConfig,
  addExtension,
  removeExtension,
  validateConfig,
  resetConfig
} = useStarterConfig(initialConfig)
```

#### ExtensionInitializer

```tsx
<ExtensionInitializer
  onExtensionsLoaded={(extensions) => console.log('Loaded:', extensions)}
  onError={(error) => console.error('Extension error:', error)}
/>
```

### 服务端API

#### StarterIntegrationManager

```typescript
const manager = new StarterIntegrationManager(config)

await manager.initialize(config)
await manager.addExtension(extension)
await manager.removeExtension('extension-name')
await manager.updateConfig(newConfig)

const extensions = manager.getInstalledExtensions()
const isInstalled = manager.isExtensionInstalled('extension-name')
```

#### TemplateGenerator

```typescript
const generator = new TemplateGenerator()

const nextConfig = generator.generateNextConfig(config)
const trpcRouter = generator.generateTrpcRouter(config)
const authMiddleware = generator.generateAuthMiddleware(config)
const extensionConfig = generator.generateExtensionConfig(extensions)
```

#### StarterCLI

```typescript
const cli = new StarterCLI(config)

await cli.init(config, { outputDir: './generated' })
await cli.addExtension('new-extension', '1.0.0', { setting: 'value' })
await cli.removeExtension('old-extension')
await cli.generateFiles('./output', true)

cli.status()
const isValid = cli.validate()
```

## 🎯 使用场景

### 1. 新项目初始化

```typescript
import { StarterCLI } from '@linch-kit/starter/server'

const config = {
  appName: 'New Project',
  version: '1.0.0',
  extensions: ['console', 'auth', 'platform'],
  auth: { enabled: true, provider: 'supabase' },
  database: { enabled: true, provider: 'prisma' }
}

const cli = new StarterCLI(config)
await cli.init(config, { 
  outputDir: './my-project',
  generateTests: true 
})
```

### 2. 动态扩展管理

```typescript
// 运行时添加扩展
await manager.addExtension({
  name: 'payments',
  version: '2.1.0',
  enabled: true,
  config: {
    provider: 'stripe',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
})

// 更新扩展配置
await manager.updateExtensionConfig('payments', {
  currency: 'USD',
  features: ['subscriptions', 'one-time-payments']
})
```

### 3. 配置驱动的应用

```tsx
function ConfigurableApp() {
  const { config, updateConfig } = useStarterConfig({
    appName: 'Configurable App',
    ui: { theme: 'dark' }
  })

  const toggleTheme = () => {
    updateConfig({
      ui: {
        ...config.ui,
        theme: config.ui.theme === 'dark' ? 'light' : 'dark'
      }
    })
  }

  return (
    <div className={`app theme-${config.ui.theme}`}>
      <button onClick={toggleTheme}>
        Switch to {config.ui.theme === 'dark' ? 'light' : 'dark'} theme
      </button>
    </div>
  )
}
```

## 🔧 开发

### 构建

```bash
bun run build
```

### 测试

```bash
bun run test
```

### 类型检查

```bash
bun run type-check
```

### Lint

```bash
bun run lint
```

## 📄 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](../../CONTRIBUTING.md) 了解详情。

## 📞 支持

- 📧 邮箱: support@linchkit.com
- 📖 文档: https://docs.linchkit.com
- 🐛 问题报告: https://github.com/linchkit/linchkit/issues