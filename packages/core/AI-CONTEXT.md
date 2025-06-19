# Core 包 AI 上下文

## 概述

`@linch-kit/core` 是 Linch Kit 的核心包，提供基础工具、配置系统、CLI 工具和插件架构。作为基础包，它被所有其他功能包依赖。

## 包信息

```typescript
interface CorePackageInfo {
  name: '@linch-kit/core'
  version: string
  description: '核心工具和配置系统'
  type: 'module'
  main: './dist/index.js'
  module: './dist/index.mjs'
  types: './dist/index.d.ts'
  bin: {
    'linch-kit': './dist/cli.js'
  }
}
```

## 目录结构

```
packages/core/
├── src/
│   ├── index.ts              # 主入口
│   ├── cli.ts                # CLI 入口
│   ├── config/               # 配置系统
│   │   ├── index.ts         # 配置导出
│   │   ├── schema.ts        # 配置模式
│   │   ├── loader.ts        # 配置加载器
│   │   └── validator.ts     # 配置验证
│   ├── utils/               # 工具函数
│   │   ├── index.ts         # 工具导出
│   │   ├── fs.ts            # 文件系统工具
│   │   ├── path.ts          # 路径工具
│   │   ├── string.ts        # 字符串工具
│   │   └── object.ts        # 对象工具
│   ├── cli/                 # CLI 工具
│   │   ├── index.ts         # CLI 导出
│   │   ├── commands/        # 命令实现
│   │   ├── utils.ts         # CLI 工具
│   │   └── types.ts         # CLI 类型
│   ├── plugins/             # 插件系统
│   │   ├── index.ts         # 插件导出
│   │   ├── manager.ts       # 插件管理器
│   │   ├── registry.ts      # 插件注册表
│   │   └── types.ts         # 插件类型
│   └── generators/          # 代码生成器
│       ├── index.ts         # 生成器导出
│       ├── package.ts       # 包生成器
│       └── template.ts      # 模板系统
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts
└── README.md
```

## 核心模块

### 1. 配置系统

```typescript
// src/config/index.ts
export interface ConfigSystem {
  load: ConfigLoader
  validate: ConfigValidator
  merge: ConfigMerger
  watch: ConfigWatcher
}

// 配置加载器
interface ConfigLoader {
  loadFromFile(path: string): Promise<Config>
  loadFromEnv(): Config
  loadFromCLI(args: string[]): Config
  loadDefault(): Config
}

// 配置模式
interface ConfigSchema {
  type: 'object'
  properties: {
    [key: string]: ConfigProperty
  }
  required?: string[]
  additionalProperties?: boolean
}

// 使用示例
const config = await loadConfig({
  sources: ['file', 'env', 'cli'],
  schema: configSchema,
  validate: true
})
```

### 2. 工具函数

```typescript
// src/utils/index.ts
export interface UtilityFunctions {
  fs: FileSystemUtils
  path: PathUtils
  string: StringUtils
  object: ObjectUtils
  async: AsyncUtils
}

// 文件系统工具
interface FileSystemUtils {
  exists(path: string): Promise<boolean>
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  copyFile(src: string, dest: string): Promise<void>
  ensureDir(path: string): Promise<void>
  glob(pattern: string): Promise<string[]>
}

// 使用示例
import { fs, path } from '@linch-kit/core'

await fs.ensureDir(path.join(process.cwd(), 'dist'))
const files = await fs.glob('src/**/*.ts')
```

### 3. CLI 系统

```typescript
// src/cli/index.ts
export interface CLISystem {
  program: CLIProgram
  commands: CLICommand[]
  utils: CLIUtils
}

// CLI 命令
interface CLICommand {
  name: string
  description: string
  options: CLIOption[]
  action: CommandAction
}

// CLI 程序
interface CLIProgram {
  name: string
  version: string
  description: string
  commands: CLICommand[]
  globalOptions: CLIOption[]
}

// 使用示例
import { createCLI } from '@linch-kit/core'

const cli = createCLI({
  name: 'linch-kit',
  version: '1.0.0',
  commands: [
    {
      name: 'generate',
      description: 'Generate code',
      action: async (options) => {
        // 生成逻辑
      }
    }
  ]
})
```

### 4. 插件系统

```typescript
// src/plugins/index.ts
export interface PluginSystem {
  manager: PluginManager
  registry: PluginRegistry
  loader: PluginLoader
  hooks: HookSystem
}

// 插件接口
interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  dependencies?: string[]
  hooks: PluginHook[]
  install(context: PluginContext): void | Promise<void>
  uninstall?(context: PluginContext): void | Promise<void>
}

// 插件上下文
interface PluginContext {
  config: Config
  utils: UtilityFunctions
  hooks: HookSystem
  logger: Logger
}

// 使用示例
import { createPlugin } from '@linch-kit/core'

const myPlugin = createPlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  hooks: [
    {
      name: 'config:loaded',
      handler: (config) => {
        // 处理配置加载
      }
    }
  ]
})
```

### 5. 代码生成器

```typescript
// src/generators/index.ts
export interface GeneratorSystem {
  templates: TemplateEngine
  generators: CodeGenerator[]
  utils: GeneratorUtils
}

// 代码生成器
interface CodeGenerator {
  name: string
  description: string
  templates: Template[]
  generate(options: GenerateOptions): Promise<GeneratedFile[]>
}

// 模板引擎
interface TemplateEngine {
  render(template: string, data: any): string
  registerHelper(name: string, helper: Function): void
  registerPartial(name: string, partial: string): void
}

// 使用示例
import { generatePackage } from '@linch-kit/core'

await generatePackage({
  name: 'my-package',
  type: 'library',
  template: 'default',
  outputDir: 'packages/my-package'
})
```

## API 接口

### 1. 主要导出

```typescript
// src/index.ts
export {
  // 配置系统
  loadConfig,
  validateConfig,
  mergeConfig,
  type Config,
  type ConfigSchema,
  
  // 工具函数
  fs,
  path,
  string,
  object,
  async,
  
  // CLI 系统
  createCLI,
  type CLICommand,
  type CLIProgram,
  
  // 插件系统
  createPlugin,
  PluginManager,
  type Plugin,
  type PluginContext,
  
  // 代码生成器
  generatePackage,
  generateComponent,
  type Generator,
  type Template
} from './modules'
```

### 2. 类型定义

```typescript
// 核心类型
export interface CoreTypes {
  Config: Config
  Plugin: Plugin
  Generator: Generator
  CLICommand: CLICommand
  Template: Template
}

// 配置类型
export interface Config {
  [key: string]: any
}

// 插件类型
export interface Plugin {
  id: string
  name: string
  version: string
  install(context: PluginContext): void | Promise<void>
}
```

## 依赖关系

### 1. 外部依赖

```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "cosmiconfig": "^8.0.0",
    "glob": "^10.0.0",
    "handlebars": "^4.7.0",
    "joi": "^17.0.0",
    "lodash": "^4.17.0"
  }
}
```

### 2. 内部依赖

```typescript
// 无内部依赖 - 作为基础包
interface InternalDependencies {
  // 无依赖
}
```

## 使用模式

### 1. 基础使用

```typescript
import { loadConfig, fs, createCLI } from '@linch-kit/core'

// 加载配置
const config = await loadConfig()

// 文件操作
await fs.writeFile('output.txt', 'Hello World')

// 创建 CLI
const cli = createCLI({
  name: 'my-cli',
  commands: [...]
})
```

### 2. 插件开发

```typescript
import { createPlugin } from '@linch-kit/core'

export default createPlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  install(context) {
    context.hooks.on('config:loaded', (config) => {
      // 处理配置
    })
  }
})
```

### 3. 代码生成

```typescript
import { generatePackage } from '@linch-kit/core'

await generatePackage({
  name: '@my-org/my-package',
  type: 'library',
  features: ['typescript', 'testing'],
  outputDir: './packages/my-package'
})
```

## 扩展点

### 1. 配置扩展

```typescript
// 扩展配置模式
export const myConfigSchema = {
  type: 'object',
  properties: {
    myFeature: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        options: { type: 'object' }
      }
    }
  }
}
```

### 2. 工具扩展

```typescript
// 扩展工具函数
export const myUtils = {
  formatDate: (date: Date) => date.toISOString(),
  parseJSON: (str: string) => JSON.parse(str)
}
```

### 3. 命令扩展

```typescript
// 扩展 CLI 命令
export const myCommands = [
  {
    name: 'my-command',
    description: 'My custom command',
    action: async (options) => {
      // 命令逻辑
    }
  }
]
```

## 测试策略

### 1. 单元测试

```typescript
// 测试配置加载
describe('Config System', () => {
  test('should load config from file', async () => {
    const config = await loadConfig({ source: 'file' })
    expect(config).toBeDefined()
  })
})
```

### 2. 集成测试

```typescript
// 测试插件系统
describe('Plugin System', () => {
  test('should load and execute plugin', async () => {
    const manager = new PluginManager()
    await manager.load(testPlugin)
    expect(manager.isLoaded(testPlugin.id)).toBe(true)
  })
})
```

这个核心包为整个 Linch Kit 生态系统提供了坚实的基础设施支持。
