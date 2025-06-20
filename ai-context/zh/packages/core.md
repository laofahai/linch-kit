# Core 包文档

## 📦 包概述

`@linch-kit/core` 是 Linch Kit 的核心基础设施包，提供 CLI 系统、配置管理、插件加载等基础功能。

## 🎯 主要功能

### 1. CLI 系统
- 统一的命令行工具
- 插件化命令扩展
- 自动命令发现和注册
- 帮助系统和错误处理

### 2. 配置管理
- 统一的配置文件系统
- 环境变量集成
- 配置验证和类型安全
- 动态配置加载

### 3. 插件系统
- 插件发现和加载
- 依赖解析
- 生命周期管理
- 扩展点注册

### 4. 工具函数
- 常用工具函数库
- 类型工具
- 验证工具
- 日志系统

## 🏗️ 架构设计

### CLI 系统架构
```
CLI Entry Point
├── Command Registry
├── Plugin Loader
├── Config Manager
└── Help System
```

### 配置系统架构
```
Config Manager
├── File Loader (linch-kit.config.ts)
├── Environment Variables
├── Schema Validator
└── Type Generator
```

## 📋 API 参考

### CLI 相关

#### createCLI
```typescript
import { createCLI } from '@linch-kit/core'

const cli = createCLI({
  name: 'linch-kit',
  version: '1.0.0',
  description: 'Linch Kit CLI'
})

// 注册命令
cli.command('build', 'Build packages', async () => {
  // 构建逻辑
})

// 启动 CLI
await cli.run(process.argv)
```

#### 命令注册
```typescript
import { defineCommand } from '@linch-kit/core'

export const buildCommand = defineCommand({
  name: 'build',
  description: 'Build all packages',
  options: {
    watch: {
      type: 'boolean',
      description: 'Watch for changes'
    }
  },
  async handler(options) {
    // 命令处理逻辑
  }
})
```

### 配置相关

#### defineConfig
```typescript
import { defineConfig } from '@linch-kit/core'

export default defineConfig({
  project: {
    name: 'my-app',
    version: '1.0.0'
  },
  database: {
    url: process.env.DATABASE_URL
  },
  auth: {
    providers: ['credentials']
  }
})
```

#### 配置加载
```typescript
import { loadConfig } from '@linch-kit/core'

const config = await loadConfig()
console.log(config.project.name)
```

### 插件相关

#### 插件定义
```typescript
import { definePlugin } from '@linch-kit/core'

export const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  
  async install(context) {
    // 插件安装逻辑
  },
  
  async activate(context) {
    // 插件激活逻辑
    context.registerCommand('my-command', myCommand)
  }
})
```

#### 插件加载
```typescript
import { PluginManager } from '@linch-kit/core'

const pluginManager = new PluginManager()
await pluginManager.loadPlugin('@linch-kit/plugin-example')
```

## 🔧 使用示例

### 创建自定义 CLI 工具

```typescript
// cli.ts
import { createCLI, defineCommand } from '@linch-kit/core'

const deployCommand = defineCommand({
  name: 'deploy',
  description: 'Deploy application',
  options: {
    env: {
      type: 'string',
      choices: ['dev', 'staging', 'prod'],
      required: true
    }
  },
  async handler({ env }) {
    console.log(`Deploying to ${env}...`)
    // 部署逻辑
  }
})

const cli = createCLI({
  name: 'my-app-cli',
  version: '1.0.0'
})

cli.addCommand(deployCommand)

if (require.main === module) {
  cli.run(process.argv)
}
```

### 扩展配置系统

```typescript
// config/custom.ts
import { defineConfigExtension } from '@linch-kit/core'
import { z } from 'zod'

export const customConfigExtension = defineConfigExtension({
  name: 'custom',
  schema: z.object({
    apiKey: z.string(),
    timeout: z.number().default(5000)
  }),
  defaults: {
    timeout: 5000
  }
})

// linch-kit.config.ts
import { defineConfig } from '@linch-kit/core'
import { customConfigExtension } from './config/custom'

export default defineConfig({
  // 其他配置...
  
  custom: {
    apiKey: process.env.API_KEY,
    timeout: 10000
  }
}, {
  extensions: [customConfigExtension]
})
```

## 🧪 测试

### 单元测试
```bash
cd packages/core
pnpm test
```

### 集成测试
```bash
cd packages/core
pnpm test:integration
```

### CLI 测试
```bash
cd packages/core
pnpm test:cli
```

## 📝 开发指南

### 添加新命令

1. 在 `src/commands/` 下创建命令文件
2. 使用 `defineCommand` 定义命令
3. 在 `src/commands/index.ts` 中导出
4. 添加测试用例

### 扩展配置系统

1. 在 `src/config/` 下创建配置扩展
2. 定义配置 Schema
3. 实现配置加载逻辑
4. 添加类型定义

### 开发插件

1. 实现 `Plugin` 接口
2. 定义插件元数据
3. 实现生命周期钩子
4. 注册扩展点

## 🔗 相关包

- `@linch-kit/types` - 类型定义
- `@linch-kit/schema` - Schema 系统
- `@linch-kit/auth-core` - 认证系统

## 📚 更多资源

- [CLI 开发指南](../workflows/development.md#cli-开发)
- [配置系统设计](../architecture/system-architecture.md#配置系统)
- [插件系统设计](../architecture/plugin-system-design.md)

---

**包状态**: ✅ 核心功能完成  
**最后更新**: 2025-06-20  
**维护者**: Linch Kit 团队
