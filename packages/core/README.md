# @linch-kit/core

🚀 **Linch Kit 核心包** - AI-First 设计的统一 CLI 系统、配置管理和基础工具库。

## ✨ 核心特性

- 🛠️ **统一 CLI 系统** - 可扩展的命令行工具，支持插件化命令注册
- ⚙️ **配置管理** - 多层次配置系统，支持文件、环境变量、CLI 参数
- 🔧 **工具函数库** - 文件系统、网络、进程、字符串等常用工具
- 🔌 **插件系统** - 动态插件发现、加载和生命周期管理
- 🌐 **国际化支持** - 统一的 i18n 系统
- 🤖 **AI-First 设计** - 为 AI 辅助开发优化的接口和元数据

## 📦 安装

```bash
pnpm add @linch-kit/core
# 或
npm install @linch-kit/core
```

## 🚀 快速开始

### CLI 工具使用

```bash
# 查看所有可用命令
npx linch --help

# 查看插件状态
npx linch plugin:list

# 查看配置信息
npx linch config:info

# 生成配置文件
npx linch config:init --type ts
```

### 作为库使用

```typescript
import { LinchCLI, ConfigManager, fs, logger } from '@linch-kit/core'

// 创建 CLI 应用
const cli = new LinchCLI()
await cli.initialize()
await cli.run()

// 配置管理
const configManager = ConfigManager.getInstance()
const config = await configManager.loadConfig()

// 文件系统工具
await fs.ensureDir('./dist')
await fs.writeFile('./output.txt', 'Hello World')

// 创建 CLI 应用
const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  commands: [
    {
      name: 'hello',
      description: 'Say hello',
      action: () => console.log('Hello!')
    }
  ]
})
```

### 插件开发

```typescript
import { createPlugin } from '@linch-kit/core'

export default createPlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  install(context) {
    // 注册钩子
    context.hooks.on('config:loaded', (config) => {
      console.log('Config loaded:', config)
    })
    
    // 注册命令
    context.cli.addCommand({
      name: 'my-command',
      description: 'My custom command',
      action: () => {
        console.log('Running my command')
      }
    })
  }
})
```

## 📚 API 文档

### 配置系统

```typescript
// 加载配置
const config = await loadConfig(options?)

// 验证配置
const isValid = validateConfig(config, schema)

// 合并配置
const merged = mergeConfig(config1, config2)
```

### 工具函数

```typescript
// 文件系统
import { fs } from '@linch-kit/core'
await fs.exists(path)
await fs.readFile(path)
await fs.writeFile(path, content)
await fs.copyFile(src, dest)
await fs.ensureDir(path)
const files = await fs.glob(pattern)

// 路径工具
import { path } from '@linch-kit/core'
const joined = path.join('a', 'b', 'c')
const resolved = path.resolve('./relative')
const relative = path.relative(from, to)

// 字符串工具
import { string } from '@linch-kit/core'
const camelCase = string.toCamelCase('hello-world')
const kebabCase = string.toKebabCase('HelloWorld')
const pascalCase = string.toPascalCase('hello_world')
```

### CLI 系统

```typescript
// 创建 CLI 应用
const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI application',
  commands: [...],
  globalOptions: [...]
})

// 运行 CLI
await cli.run(process.argv)
```

## 🔧 配置

支持多种配置源，按优先级排序：

1. 命令行参数
2. 环境变量
3. 配置文件 (`linch.config.js`, `package.json`)
4. 默认配置

### 配置文件示例

```javascript
// linch.config.js
export default {
  // 项目配置
  project: {
    name: 'my-project',
    version: '1.0.0'
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  // 插件配置
  plugins: [
    '@linch-kit/plugin-typescript',
    ['@linch-kit/plugin-react', { jsx: 'automatic' }]
  ]
}
```

## 🔌 插件系统

支持通过插件扩展功能：

```typescript
// 插件接口
interface Plugin {
  id: string
  name: string
  version: string
  dependencies?: string[]
  install(context: PluginContext): void | Promise<void>
  uninstall?(context: PluginContext): void | Promise<void>
}

// 插件上下文
interface PluginContext {
  config: Config
  utils: UtilityFunctions
  hooks: HookSystem
  cli: CLISystem
  logger: Logger
}
```

## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm check-types

# 代码检查
pnpm lint
```

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/linch-tech/linch-kit)
- [AI 上下文文档](../../ai-context/packages/core.md)
- [示例项目](../../apps/starter)
