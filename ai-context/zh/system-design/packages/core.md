# @linch-kit/core 包详细规划

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**开发优先级**: P0 - 最高
**预估工期**: 5-7天
**依赖**: 无 (顶层基础设施)

---

## 📋 模块概览

### 功能定位
@linch-kit/core 是 LinchKit 生态系统的核心基础设施包，作为零依赖的顶层包，为整个系统提供插件化架构、通用类型定义、CLI工具、配置管理等基础功能。它是所有其他包的依赖基础，确保系统的模块化、可扩展性和一致性。

### 在 LinchKit 生态系统中的角色定位
- **基础设施层**: 提供插件系统、事件总线、钩子机制等核心架构
- **类型定义中心**: 定义所有包共用的基础类型和接口
- **工具函数库**: 提供文件系统、日志、网络等通用工具
- **CLI 框架**: 支持插件化的命令行工具系统
- **配置管理中心**: 统一的配置加载、验证和管理机制
- **国际化支持**: 包级 i18n 系统，支持多语言

### 职责边界
- ✅ **插件系统**: 通用、可插拔、模块化的插件运行时框架
  - 生命周期钩子（Hooks）系统
  - 事件系统（Event Bus）
  - 插件注册与依赖管理
  - 插件配置机制（Zod Schema）
  - 权限控制与资源隔离
  - 跨插件事务协调器
- ✅ **通用类型**: 所有包共用的基础类型定义
- ✅ **CLI系统**: 命令行工具和插件化命令
- ✅ **配置管理**: 多层次配置加载和验证
- ✅ **工具函数**: 文件系统、日志、网络等工具
- ✅ **国际化**: 包级i18n支持
- ✅ **AI 集成基础架构**: 为 AI 插件提供钩子和扩展点，具体 AI 功能由 @linch-kit/ai 插件实现
- ❌ **业务逻辑**: 不包含具体业务功能
- ❌ **数据操作**: 不直接操作数据库

### 技术特色
- **零依赖设计**: 不依赖任何其他 LinchKit 包，确保基础设施的独立性
- **插件化架构**: 支持功能的动态扩展和热插拔
- **类型安全**: 完整的 TypeScript 类型定义，确保编译时安全
- **高性能**: 优化的构建和运行时性能，支持大规模应用
- **扩展友好**: 为 AI 等高级功能提供插件基础和集成点
- **AI-First 设计**: 所有接口和数据结构都便于 AI 理解和处理

---

## 🔌 API 设计

### 公共接口

#### 插件系统核心 API
```typescript
/**
 * 插件系统主控制器
 * @description 管理插件的注册、加载、生命周期和依赖关系
 * @since v1.0.0
 */
export class PluginSystem {
  /**
   * 注册插件
   * @param plugin - 插件实例
   * @returns Promise<void>
   * @throws {PluginRegistrationError} 当插件注册失败时
   * @example
   * ```typescript
   * const plugin: Plugin = {
   *   id: 'my-plugin',
   *   name: 'My Plugin',
   *   version: '1.0.0',
   *   async setup(ctx) { /* 初始化逻辑 */ }
   * }
   * await pluginSystem.registerPlugin(plugin)
   * ```
   */
  async registerPlugin(plugin: Plugin): Promise<void>

  /**
   * 加载插件
   * @param pluginId - 插件ID
   * @returns Promise<PluginContext> 插件上下文
   * @throws {PluginLoadError} 当插件加载失败时
   */
  async loadPlugin(pluginId: string): Promise<PluginContext>

  /**
   * 执行钩子
   * @param hookName - 钩子名称
   * @param context - 钩子上下文
   * @returns Promise<any> 钩子执行结果
   */
  async executeHook(hookName: string, context: HookContext): Promise<any>

  /**
   * 发布事件
   * @param eventName - 事件名称
   * @param payload - 事件载荷
   * @param options - 发布选项
   */
  emit(eventName: string, payload: any, options?: EmitOptions): void
}
```

#### 配置管理 API
```typescript
/**
 * 配置管理器
 * @description 统一的配置加载、验证和管理
 * @since v1.0.0
 */
export class ConfigManager {
  /**
   * 加载配置
   * @param configPath - 配置文件路径
   * @param schema - 验证Schema
   * @returns Promise<T> 验证后的配置对象
   * @throws {ConfigValidationError} 当配置验证失败时
   */
  async loadConfig<T>(configPath: string, schema?: ZodSchema<T>): Promise<T>

  /**
   * 设置配置值
   * @param key - 配置键
   * @param value - 配置值
   * @param options - 设置选项
   */
  setConfig<T>(key: string, value: T, options?: SetConfigOptions): void

  /**
   * 获取配置值
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns T | undefined 配置值
   */
  getConfig<T>(key: string, defaultValue?: T): T | undefined
}
```

#### CLI 系统 API
```typescript
/**
 * CLI 命令注册器
 * @description 支持插件化的命令行工具系统
 * @since v1.0.0
 */
export class CommandRegistry {
  /**
   * 注册命令
   * @param command - 命令定义
   * @throws {CommandRegistrationError} 当命令注册失败时
   * @example
   * ```typescript
   * registry.registerCommand({
   *   name: 'schema:generate',
   *   description: '生成 Schema 代码',
   *   options: [
   *     { name: 'output', type: 'string', description: '输出目录' }
   *   ],
   *   async handler(args, options) {
   *     // 命令执行逻辑
   *   }
   * })
   * ```
   */
  registerCommand(command: CommandDefinition): void

  /**
   * 执行命令
   * @param commandName - 命令名称
   * @param args - 命令参数
   * @param options - 命令选项
   * @returns Promise<CommandResult> 命令执行结果
   */
  async executeCommand(commandName: string, args: string[], options: Record<string, any>): Promise<CommandResult>
}
```

### TypeScript 类型定义

#### 核心类型
```typescript
/**
 * 插件定义接口
 * @description 定义插件的基本结构和生命周期
 */
export interface Plugin {
  /** 插件唯一标识符 */
  id: string
  /** 插件显示名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description?: string
  /** 插件作者 */
  author?: string
  /** 插件依赖 */
  dependencies?: PluginDependency[]
  /** 插件权限声明 */
  permissions?: string[]
  /** 配置Schema */
  configSchema?: ZodSchema
  /** 生命周期钩子 */
  setup?(context: PluginContext): Promise<void>
  activate?(context: PluginContext): Promise<void>
  deactivate?(context: PluginContext): Promise<void>
  teardown?(context: PluginContext): Promise<void>
  /** 钩子注册 */
  hooks?: Record<string, HookHandler>
  /** 事件监听 */
  events?: Record<string, EventListener>
  /** UI注册 */
  ui?: PluginUIManifest
}

/**
 * 插件上下文接口
 * @description 提供插件运行时的服务和资源访问
 */
export interface PluginContext {
  /** 插件基本信息 */
  plugin: Plugin
  /** 钩子系统 */
  hooks: HookSystem
  /** 事件总线 */
  events: EventBus
  /** 配置管理 */
  config: PluginConfigManager
  /** 权限管理 */
  permissions: PluginPermissionManager
  /** 事务管理 */
  transactions: PluginTransactionManager
  /** UI注册 */
  ui: PluginUIRegistry
  /** 依赖注入 */
  use<T>(dependencyId: string): T
  /** 资源管理 */
  addResource(resource: PluginResource): void
  removeResource(resourceId: string): void
  /** 日志记录 */
  logger: PluginLogger
}

/**
 * 钩子上下文接口
 * @description 钩子执行时的上下文信息
 */
export interface HookContext {
  /** 插件ID */
  pluginId: string
  /** 钩子名称 */
  hookName: string
  /** 钩子数据 */
  data: any
  /** 元数据 */
  metadata?: Record<string, any>
  /** 追踪ID */
  traceId?: string
}

/**
 * 事件接口
 * @description 插件系统中的事件结构
 */
export interface PluginEvent {
  /** 事件名称 */
  name: string
  /** 事件载荷 */
  payload: any
  /** 时间戳 */
  timestamp: number
  /** 追踪ID */
  traceId: string
  /** 事件源 */
  source?: string
}
```

### 契约规范

#### 插件生命周期契约
1. **注册阶段**: 插件必须提供有效的 `id`、`name`、`version`
2. **加载阶段**: 依赖的插件必须已经加载完成
3. **设置阶段**: `setup` 钩子用于初始化资源，不应执行业务逻辑
4. **激活阶段**: `activate` 钩子用于启动服务，可以执行业务逻辑
5. **停用阶段**: `deactivate` 钩子必须清理业务逻辑，保留资源
6. **卸载阶段**: `teardown` 钩子必须完全清理所有资源

#### 钩子执行契约
1. **优先级**: 数字越小优先级越高，默认优先级为 0
2. **异常处理**: 钩子抛出异常不应影响其他钩子执行
3. **返回值**: 钩子可以修改传入的数据并返回
4. **超时**: 钩子执行超时时间默认为 5 秒

#### 事件发布契约
1. **事件名称**: 使用 `namespace:event` 格式，如 `user:created`
2. **载荷结构**: 事件载荷应该是可序列化的对象
3. **追踪**: 所有事件都会自动添加追踪ID
4. **异步**: 事件监听器异步执行，不阻塞发布者

### 版本兼容性策略

#### 语义化版本控制
- **主版本号**: 不兼容的 API 变更
- **次版本号**: 向后兼容的功能新增
- **修订版本号**: 向后兼容的问题修正

#### 插件 API 兼容性
- **插件接口**: 保持向后兼容，新增字段使用可选属性
- **钩子系统**: 新增钩子不影响现有插件，移除钩子需要主版本升级
- **事件系统**: 事件名称和载荷结构保持稳定
- **配置系统**: 配置Schema变更需要提供迁移工具

#### 废弃策略
1. **标记废弃**: 在文档和代码中标记废弃的 API
2. **提供替代**: 为废弃的 API 提供替代方案
3. **过渡期**: 至少保留一个主版本的过渡期
4. **移除通知**: 在移除前至少提前一个版本通知

---

## 🏗️ 架构设计

### 目录结构
```
packages/core/
├── src/
│   ├── plugins/                      # 插件系统
│   │   ├── core/                     # 插件核心
│   │   │   ├── plugin-system.ts      # 插件系统主控制器
│   │   │   ├── plugin-registry.ts    # 插件注册表
│   │   │   ├── plugin-loader.ts      # 插件加载器
│   │   │   ├── plugin-context.ts     # 插件上下文
│   │   │   └── dependency-resolver.ts # 依赖解析器
│   │   ├── hooks/                    # 钩子系统
│   │   │   ├── hook-system.ts        # 钩子系统核心
│   │   │   ├── hook-registry.ts      # 钩子注册表
│   │   │   ├── hook-executor.ts      # 钩子执行器
│   │   │   └── hook-types.ts         # 钩子类型定义
│   │   ├── events/                   # 事件系统
│   │   │   ├── event-bus.ts          # 事件总线
│   │   │   ├── event-emitter.ts      # 事件发射器
│   │   │   ├── event-listener.ts     # 事件监听器
│   │   │   └── event-types.ts        # 事件类型定义
│   │   ├── config/                   # 插件配置
│   │   │   ├── config-manager.ts     # 配置管理器
│   │   │   ├── config-validator.ts   # 配置验证器
│   │   │   ├── config-schema.ts      # 配置Schema
│   │   │   └── config-ui.ts          # 配置UI生成
│   │   ├── permissions/              # 权限控制
│   │   │   ├── permission-manager.ts # 权限管理器
│   │   │   ├── resource-isolator.ts  # 资源隔离器
│   │   │   ├── access-controller.ts  # 访问控制器
│   │   │   └── permission-types.ts   # 权限类型定义
│   │   ├── transactions/             # 事务协调
│   │   │   ├── transaction-manager.ts # 事务管理器
│   │   │   ├── transaction-coordinator.ts # 事务协调器
│   │   │   ├── saga-manager.ts       # Saga模式管理器
│   │   │   └── transaction-types.ts  # 事务类型定义
│   │   ├── ui/                       # UI注册机制
│   │   │   ├── ui-registry.ts        # UI注册表
│   │   │   ├── route-manager.ts      # 路由管理器
│   │   │   ├── component-loader.ts   # 组件加载器
│   │   │   └── ui-types.ts           # UI类型定义
│   │   ├── sandbox/                  # 沙箱机制(预留)
│   │   │   ├── sandbox-manager.ts    # 沙箱管理器
│   │   │   ├── vm-isolator.ts        # VM隔离器
│   │   │   └── sandbox-types.ts      # 沙箱类型定义
│   │   ├── types.ts                  # 插件系统类型
│   │   └── index.ts                  # 插件系统导出

│   ├── types/                        # 通用类型定义
│   │   ├── common.ts                 # 基础实体类型
│   │   ├── api.ts                    # API响应类型
│   │   ├── utils.ts                  # 工具类型
│   │   ├── globals.ts                # 全局类型声明
│   │   └── index.ts                  # 类型导出
│   ├── cli/                          # CLI系统
│   │   ├── commands/                 # 内置命令
│   │   │   ├── init.ts               # 初始化命令
│   │   │   ├── dev.ts                # 开发命令
│   │   │   ├── build.ts              # 构建命令
│   │   │   └── plugin.ts             # 插件管理命令
│   │   ├── core/                     # CLI核心
│   │   │   ├── command-registry.ts   # 命令注册器
│   │   │   ├── config-manager.ts     # 配置管理器
│   │   │   ├── plugin-loader.ts      # 插件加载器
│   │   │   └── help-system.ts        # 帮助系统
│   │   ├── linch-cli.ts              # CLI主入口
│   │   └── index.ts                  # CLI导出
│   ├── config/                       # 配置管理
│   │   ├── loader.ts                 # 配置加载器
│   │   ├── validator.ts              # 配置验证器
│   │   ├── templates.ts              # 配置模板
│   │   ├── types.ts                  # 配置类型
│   │   └── index.ts                  # 配置导出
│   ├── utils/                        # 工具函数库
│   │   ├── fs.ts                     # 文件系统操作
│   │   ├── logger.ts                 # 日志系统
│   │   ├── network.ts                # 网络工具
│   │   ├── process.ts                # 进程管理
│   │   ├── string.ts                 # 字符串处理
│   │   ├── validation.ts             # 验证工具
│   │   └── index.ts                  # 工具导出
│   ├── i18n/                         # 国际化系统
│   │   ├── package-i18n.ts           # 包级i18n
│   │   ├── types.ts                  # i18n类型
│   │   ├── utils.ts                  # i18n工具
│   │   └── index.ts                  # i18n导出
│   └── index.ts                      # 包主入口
├── tests/                            # 测试文件
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 核心类设计

#### 插件系统核心类
```typescript
export class PluginSystem {
  private registry: PluginRegistry
  private loader: PluginLoader
  private hooks: HookSystem
  private events: EventBus
  private config: PluginConfigManager
  private permissions: PluginPermissionManager
  private transactions: PluginTransactionManager
  private ui: PluginUIRegistry

  constructor(options: PluginSystemOptions) {
    this.registry = new PluginRegistry()
    this.loader = new PluginLoader(options.loader)
    this.hooks = new HookSystem()
    this.events = new EventBus()
    this.config = new PluginConfigManager()
    this.permissions = new PluginPermissionManager()
    this.transactions = new PluginTransactionManager()
    this.ui = new PluginUIRegistry()
  }

  // 插件生命周期管理
  async registerPlugin(plugin: Plugin): Promise<void>
  async loadPlugin(pluginId: string): Promise<PluginContext>
  async unloadPlugin(pluginId: string): Promise<void>
  async reloadPlugin(pluginId: string): Promise<void>

  // 钩子系统
  async executeHook(hookName: string, context: HookContext): Promise<any>
  registerHook(hookName: string, handler: HookHandler): void

  // 事件系统
  emit(eventName: string, payload: any): void
  on(eventName: string, listener: EventListener): void
  off(eventName: string, listener: EventListener): void

  // 配置管理
  getPluginConfig<T>(pluginId: string): T
  setPluginConfig<T>(pluginId: string, config: T): void

  // 权限控制
  checkPermission(pluginId: string, permission: string): boolean
  grantPermission(pluginId: string, permission: string): void

  // 事务协调
  beginTransaction(): string
  commitTransaction(txId: string): Promise<void>
  rollbackTransaction(txId: string): Promise<void>
}

export interface Plugin {
  // 基本信息
  id: string
  name: string
  version: string
  description?: string
  author?: string

  // 依赖管理
  dependencies?: PluginDependency[]
  peerDependencies?: PluginDependency[]

  // 权限声明
  permissions?: string[]

  // 配置Schema
  configSchema?: ZodSchema

  // 生命周期钩子
  setup?(context: PluginContext): Promise<void>
  activate?(context: PluginContext): Promise<void>
  deactivate?(context: PluginContext): Promise<void>
  teardown?(context: PluginContext): Promise<void>

  // 钩子注册
  hooks?: Record<string, HookHandler>

  // 事件监听
  events?: Record<string, EventListener>

  // UI注册
  ui?: PluginUIManifest
}

export interface PluginContext {
  // 插件基本信息
  plugin: Plugin

  // 核心服务
  hooks: HookSystem
  events: EventBus
  config: PluginConfigManager
  permissions: PluginPermissionManager
  transactions: PluginTransactionManager
  ui: PluginUIRegistry

  // 依赖注入
  use<T>(dependencyId: string): T

  // 资源管理
  addResource(resource: PluginResource): void
  removeResource(resourceId: string): void

  // 日志记录
  logger: PluginLogger
}
```



---

## 🔧 实现细节

### 核心算法

#### 插件依赖解析算法
```typescript
/**
 * 拓扑排序算法解析插件依赖关系
 * @description 使用 Kahn 算法进行拓扑排序，确保插件按正确顺序加载
 * @complexity O(V + E) 其中 V 是插件数量，E 是依赖关系数量
 */
export class DependencyResolver {
  /**
   * 解析插件加载顺序
   * @param plugins - 插件列表
   * @returns 按依赖顺序排列的插件ID数组
   * @throws {CircularDependencyError} 当存在循环依赖时
   */
  resolve(plugins: Plugin[]): string[] {
    const graph = this.buildDependencyGraph(plugins)
    const inDegree = this.calculateInDegree(graph)
    const queue: string[] = []
    const result: string[] = []

    // 找到所有入度为0的节点
    for (const [pluginId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(pluginId)
      }
    }

    // Kahn算法
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      // 减少相邻节点的入度
      for (const neighbor of graph.get(current) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1)
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor)
        }
      }
    }

    // 检查是否存在循环依赖
    if (result.length !== plugins.length) {
      throw new CircularDependencyError('Circular dependency detected')
    }

    return result
  }

  private buildDependencyGraph(plugins: Plugin[]): Map<string, string[]> {
    const graph = new Map<string, string[]>()

    for (const plugin of plugins) {
      graph.set(plugin.id, [])

      for (const dep of plugin.dependencies || []) {
        const dependencies = graph.get(dep.id) || []
        dependencies.push(plugin.id)
        graph.set(dep.id, dependencies)
      }
    }

    return graph
  }
}
```

#### 钩子执行策略
```typescript
/**
 * 钩子执行器 - 支持多种执行模式
 * @description 实现不同的钩子执行策略，满足不同场景需求
 */
export class HookExecutor {
  /**
   * 同步执行钩子（串行）
   * @param handlers - 钩子处理器列表
   * @param context - 执行上下文
   * @returns 最后一个钩子的返回值
   */
  async executeSync(handlers: HookHandler[], context: HookContext): Promise<any> {
    let result = context.data

    for (const handler of handlers) {
      if (this.shouldExecute(handler, context)) {
        result = await this.executeWithTimeout(handler, { ...context, data: result })
      }
    }

    return result
  }

  /**
   * 异步执行钩子（并行）
   * @param handlers - 钩子处理器列表
   * @param context - 执行上下文
   * @returns 所有钩子的返回值数组
   */
  async executeAsync(handlers: HookHandler[], context: HookContext): Promise<any[]> {
    const promises = handlers
      .filter(handler => this.shouldExecute(handler, context))
      .map(handler => this.executeWithTimeout(handler, context))

    return await Promise.allSettled(promises)
  }

  /**
   * 瀑布式执行钩子
   * @param handlers - 钩子处理器列表
   * @param context - 执行上下文
   * @returns 经过所有钩子处理的最终数据
   */
  async executeWaterfall(handlers: HookHandler[], context: HookContext): Promise<any> {
    let data = context.data

    for (const handler of handlers) {
      if (this.shouldExecute(handler, context)) {
        const result = await this.executeWithTimeout(handler, { ...context, data })
        if (result !== undefined) {
          data = result
        }
      }
    }

    return data
  }

  /**
   * 保险丝执行钩子（遇到返回值就停止）
   * @param handlers - 钩子处理器列表
   * @param context - 执行上下文
   * @returns 第一个非undefined返回值
   */
  async executeBail(handlers: HookHandler[], context: HookContext): Promise<any> {
    for (const handler of handlers) {
      if (this.shouldExecute(handler, context)) {
        const result = await this.executeWithTimeout(handler, context)
        if (result !== undefined) {
          return result
        }
      }
    }

    return undefined
  }

  private shouldExecute(handler: HookHandler, context: HookContext): boolean {
    return !handler.options?.condition || handler.options.condition(context)
  }

  private async executeWithTimeout(handler: HookHandler, context: HookContext): Promise<any> {
    const timeout = handler.options?.timeout || 5000

    return Promise.race([
      handler.handler(context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Hook execution timeout')), timeout)
      )
    ])
  }
}
```

### 数据结构

#### 插件注册表
```typescript
/**
 * 插件注册表 - 高效的插件管理数据结构
 * @description 使用多重索引提供快速查找和状态管理
 */
export class PluginRegistry {
  private plugins = new Map<string, Plugin>()
  private pluginsByName = new Map<string, Plugin>()
  private pluginsByStatus = new Map<PluginStatus, Set<string>>()
  private dependencyGraph = new Map<string, Set<string>>()
  private reverseDependencyGraph = new Map<string, Set<string>>()

  /**
   * 注册插件
   * @param plugin - 插件实例
   * @throws {PluginAlreadyExistsError} 当插件ID已存在时
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new PluginAlreadyExistsError(`Plugin ${plugin.id} already exists`)
    }

    this.plugins.set(plugin.id, plugin)
    this.pluginsByName.set(plugin.name, plugin)
    this.updateStatus(plugin.id, PluginStatus.REGISTERED)
    this.buildDependencyMaps(plugin)
  }

  /**
   * 获取插件
   * @param id - 插件ID
   * @returns 插件实例或undefined
   */
  get(id: string): Plugin | undefined {
    return this.plugins.get(id)
  }

  /**
   * 按状态获取插件
   * @param status - 插件状态
   * @returns 插件ID集合
   */
  getByStatus(status: PluginStatus): Set<string> {
    return this.pluginsByStatus.get(status) || new Set()
  }

  /**
   * 获取插件依赖
   * @param id - 插件ID
   * @returns 依赖的插件ID集合
   */
  getDependencies(id: string): Set<string> {
    return this.dependencyGraph.get(id) || new Set()
  }

  /**
   * 获取依赖此插件的其他插件
   * @param id - 插件ID
   * @returns 依赖此插件的插件ID集合
   */
  getDependents(id: string): Set<string> {
    return this.reverseDependencyGraph.get(id) || new Set()
  }

  /**
   * 更新插件状态
   * @param id - 插件ID
   * @param status - 新状态
   */
  updateStatus(id: string, status: PluginStatus): void {
    // 从旧状态集合中移除
    for (const [oldStatus, pluginSet] of this.pluginsByStatus) {
      pluginSet.delete(id)
    }

    // 添加到新状态集合
    if (!this.pluginsByStatus.has(status)) {
      this.pluginsByStatus.set(status, new Set())
    }
    this.pluginsByStatus.get(status)!.add(id)
  }

  private buildDependencyMaps(plugin: Plugin): void {
    const dependencies = new Set<string>()

    for (const dep of plugin.dependencies || []) {
      dependencies.add(dep.id)

      // 构建反向依赖图
      if (!this.reverseDependencyGraph.has(dep.id)) {
        this.reverseDependencyGraph.set(dep.id, new Set())
      }
      this.reverseDependencyGraph.get(dep.id)!.add(plugin.id)
    }

    this.dependencyGraph.set(plugin.id, dependencies)
  }
}

export enum PluginStatus {
  REGISTERED = 'registered',
  LOADING = 'loading',
  LOADED = 'loaded',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  INACTIVE = 'inactive',
  ERROR = 'error'
}
```

### 设计模式

#### 观察者模式 - 事件系统
```typescript
/**
 * 事件追踪管理器 - 实现观察者模式
 * @description 提供事件的生命周期追踪和调试支持
 */
export class EventTraceManager {
  private traces = new Map<string, EventTrace>()
  private observers = new Set<EventTraceObserver>()

  /**
   * 生成追踪ID
   * @returns 唯一的追踪ID
   */
  generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 记录事件追踪
   * @param event - 事件对象
   */
  trace(event: PluginEvent): void {
    const trace: EventTrace = {
      id: event.traceId,
      event,
      timestamp: Date.now(),
      status: 'emitted'
    }

    this.traces.set(event.traceId, trace)
    this.notifyObservers('trace:created', trace)
  }

  /**
   * 更新追踪状态
   * @param traceId - 追踪ID
   * @param status - 新状态
   * @param metadata - 额外元数据
   */
  updateTrace(traceId: string, status: string, metadata?: any): void {
    const trace = this.traces.get(traceId)
    if (trace) {
      trace.status = status
      trace.metadata = { ...trace.metadata, ...metadata }
      this.notifyObservers('trace:updated', trace)
    }
  }

  /**
   * 添加观察者
   * @param observer - 事件追踪观察者
   */
  addObserver(observer: EventTraceObserver): void {
    this.observers.add(observer)
  }

  /**
   * 移除观察者
   * @param observer - 事件追踪观察者
   */
  removeObserver(observer: EventTraceObserver): void {
    this.observers.delete(observer)
  }

  private notifyObservers(type: string, trace: EventTrace): void {
    for (const observer of this.observers) {
      try {
        observer.onTraceEvent(type, trace)
      } catch (error) {
        console.error('Observer error:', error)
      }
    }
  }
}

export interface EventTrace {
  id: string
  event: PluginEvent
  timestamp: number
  status: string
  metadata?: any
}

export interface EventTraceObserver {
  onTraceEvent(type: string, trace: EventTrace): void
}
```

#### 策略模式 - 配置加载
```typescript
/**
 * 配置加载策略 - 实现策略模式
 * @description 支持多种配置源和格式的加载策略
 */
export abstract class ConfigLoadStrategy {
  abstract canHandle(source: string): boolean
  abstract load<T>(source: string, schema?: ZodSchema<T>): Promise<T>
}

export class FileConfigStrategy extends ConfigLoadStrategy {
  canHandle(source: string): boolean {
    return source.endsWith('.json') || source.endsWith('.yaml') || source.endsWith('.yml')
  }

  async load<T>(source: string, schema?: ZodSchema<T>): Promise<T> {
    const content = await fs.readFile(source, 'utf-8')
    let data: any

    if (source.endsWith('.json')) {
      data = JSON.parse(content)
    } else {
      data = yaml.parse(content)
    }

    return schema ? schema.parse(data) : data
  }
}

export class EnvironmentConfigStrategy extends ConfigLoadStrategy {
  canHandle(source: string): boolean {
    return source.startsWith('env:')
  }

  async load<T>(source: string, schema?: ZodSchema<T>): Promise<T> {
    const prefix = source.replace('env:', '')
    const data: any = {}

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const configKey = key.replace(prefix, '').toLowerCase()
        data[configKey] = value
      }
    }

    return schema ? schema.parse(data) : data
  }
}

export class ConfigLoader {
  private strategies: ConfigLoadStrategy[] = [
    new FileConfigStrategy(),
    new EnvironmentConfigStrategy(),
    new RemoteConfigStrategy(),
    new DatabaseConfigStrategy()
  ]

  async load<T>(source: string, schema?: ZodSchema<T>): Promise<T> {
    const strategy = this.strategies.find(s => s.canHandle(source))

    if (!strategy) {
      throw new Error(`No strategy found for config source: ${source}`)
    }

    return await strategy.load(source, schema)
  }

  addStrategy(strategy: ConfigLoadStrategy): void {
    this.strategies.unshift(strategy) // 新策略优先
  }
}
```

### 架构决策

#### 插件隔离机制
- **内存隔离**: 每个插件拥有独立的上下文对象，避免内存泄漏
- **权限隔离**: 基于声明式权限系统，限制插件访问范围
- **资源隔离**: 插件资源自动管理，卸载时自动清理
- **错误隔离**: 插件错误不影响系统核心和其他插件

#### 性能优化策略
- **懒加载**: 插件按需加载，减少启动时间
- **缓存机制**: 配置、钩子结果等关键数据缓存
- **批量处理**: 事件和钩子支持批量执行
- **内存池**: 复用对象实例，减少GC压力

#### 扩展性设计
- **插件化CLI**: 命令可通过插件动态注册
- **可插拔事件系统**: 支持自定义事件处理器
- **配置驱动**: 通过配置控制系统行为
- **钩子扩展点**: 在关键流程提供钩子扩展点

---

## 🔧 技术实现

### 插件系统设计

#### 生命周期钩子系统
```typescript
export class HookSystem {
  private hooks: Map<string, HookHandler[]> = new Map()
  private executor: HookExecutor

  constructor() {
    this.executor = new HookExecutor()
  }

  // 注册钩子
  register(hookName: string, handler: HookHandler, options?: HookOptions): void {
    const handlers = this.hooks.get(hookName) || []
    handlers.push({ handler, options })
    handlers.sort((a, b) => (a.options?.priority || 0) - (b.options?.priority || 0))
    this.hooks.set(hookName, handlers)
  }

  // 执行钩子
  async execute(hookName: string, context: HookContext): Promise<any> {
    const handlers = this.hooks.get(hookName) || []
    return await this.executor.execute(handlers, context)
  }

  // 支持的钩子类型
  async executeSync(hookName: string, context: HookContext): Promise<any>
  async executeAsync(hookName: string, context: HookContext): Promise<any>
  async executeWaterfall(hookName: string, context: HookContext): Promise<any>
  async executeBail(hookName: string, context: HookContext): Promise<any>
}

// 标准钩子定义
export const StandardHooks = {
  // 插件生命周期
  'plugin:before-setup': '插件设置前',
  'plugin:after-setup': '插件设置后',
  'plugin:before-activate': '插件激活前',
  'plugin:after-activate': '插件激活后',
  'plugin:before-deactivate': '插件停用前',
  'plugin:after-deactivate': '插件停用后',

  // 业务流程钩子
  'model:before-create': '模型创建前',
  'model:after-create': '模型创建后',
  'model:before-update': '模型更新前',
  'model:after-update': '模型更新后',
  'model:before-delete': '模型删除前',
  'model:after-delete': '模型删除后',

  // API 钩子
  'api:before-request': 'API请求前',
  'api:after-response': 'API响应后',
  'api:on-error': 'API错误时',

  // UI 钩子
  'ui:before-render': 'UI渲染前',
  'ui:after-render': 'UI渲染后',
  'ui:on-route-change': '路由变化时',
} as const

export interface HookContext {
  pluginId: string
  hookName: string
  data: any
  metadata?: Record<string, any>
  traceId?: string
}

export interface HookHandler {
  handler: (context: HookContext) => Promise<any> | any
  options?: HookOptions
}

export interface HookOptions {
  priority?: number // 执行优先级，数字越小越先执行
  once?: boolean    // 是否只执行一次
  condition?: (context: HookContext) => boolean // 执行条件
}
```

#### 事件系统设计
```typescript
export class EventBus {
  private emitter: EventEmitter
  private listeners: Map<string, EventListener[]> = new Map()
  private traceManager: EventTraceManager

  constructor() {
    this.emitter = new EventEmitter()
    this.traceManager = new EventTraceManager()
  }

  // 发布事件
  emit(eventName: string, payload: any, options?: EmitOptions): void {
    const traceId = options?.traceId || this.traceManager.generateTraceId()
    const event: PluginEvent = {
      name: eventName,
      payload,
      timestamp: Date.now(),
      traceId,
      source: options?.source
    }

    this.traceManager.trace(event)
    this.emitter.emit(eventName, event)
  }

  // 订阅事件
  on(eventName: string, listener: EventListener, options?: ListenerOptions): void {
    const wrappedListener = this.wrapListener(listener, options)
    this.emitter.on(eventName, wrappedListener)

    const listeners = this.listeners.get(eventName) || []
    listeners.push(listener)
    this.listeners.set(eventName, listeners)
  }

  // 一次性订阅
  once(eventName: string, listener: EventListener): void {
    this.emitter.once(eventName, this.wrapListener(listener))
  }

  // 取消订阅
  off(eventName: string, listener: EventListener): void {
    this.emitter.off(eventName, listener)

    const listeners = this.listeners.get(eventName) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
      this.listeners.set(eventName, listeners)
    }
  }

  // 广播事件（所有插件）
  broadcast(eventName: string, payload: any): void {
    this.emit(`global:${eventName}`, payload, { source: 'system' })
  }

  private wrapListener(listener: EventListener, options?: ListenerOptions): Function {
    return async (event: PluginEvent) => {
      try {
        // 权限检查
        if (options?.permissions && !this.checkEventPermission(event, options.permissions)) {
          return
        }

        // 条件检查
        if (options?.condition && !options.condition(event)) {
          return
        }

        await listener(event)
      } catch (error) {
        this.emit('system:event-error', { event, error, listener })
      }
    }
  }
}

export interface PluginEvent {
  name: string
  payload: any
  timestamp: number
  traceId: string
  source?: string
}

export interface EventListener {
  (event: PluginEvent): Promise<void> | void
}

export interface EmitOptions {
  traceId?: string
  source?: string
  async?: boolean
}

export interface ListenerOptions {
  permissions?: string[]
  condition?: (event: PluginEvent) => boolean
  priority?: number
}

// 标准事件定义
export const StandardEvents = {
  // 系统事件
  'system:startup': '系统启动',
  'system:shutdown': '系统关闭',
  'system:error': '系统错误',

  // 插件事件
  'plugin:registered': '插件注册',
  'plugin:loaded': '插件加载',
  'plugin:activated': '插件激活',
  'plugin:deactivated': '插件停用',
  'plugin:unloaded': '插件卸载',

  // 用户事件
  'user:created': '用户创建',
  'user:updated': '用户更新',
  'user:deleted': '用户删除',
  'user:login': '用户登录',
  'user:logout': '用户登出',

  // 数据事件
  'data:created': '数据创建',
  'data:updated': '数据更新',
  'data:deleted': '数据删除',
} as const
```



#### 跨插件事务协调器
```typescript
export class PluginTransactionManager {
  private transactions: Map<string, PluginTransaction> = new Map()
  private coordinator: TransactionCoordinator
  private sagaManager: SagaManager

  constructor() {
    this.coordinator = new TransactionCoordinator()
    this.sagaManager = new SagaManager()
  }

  // 开始事务
  begin(options?: TransactionOptions): string {
    const txId = this.generateTransactionId()
    const transaction = new PluginTransaction(txId, options)
    this.transactions.set(txId, transaction)
    return txId
  }

  // 注册事务参与者
  register(txId: string, participant: PluginTransactionParticipant): void {
    const transaction = this.transactions.get(txId)
    if (!transaction) {
      throw new Error(`Transaction ${txId} not found`)
    }
    transaction.addParticipant(participant)
  }

  // 提交事务
  async commit(txId: string): Promise<void> {
    const transaction = this.transactions.get(txId)
    if (!transaction) {
      throw new Error(`Transaction ${txId} not found`)
    }

    try {
      // 两阶段提交
      await this.coordinator.prepare(transaction)
      await this.coordinator.commit(transaction)
      this.transactions.delete(txId)
    } catch (error) {
      await this.rollback(txId)
      throw error
    }
  }

  // 回滚事务
  async rollback(txId: string): Promise<void> {
    const transaction = this.transactions.get(txId)
    if (!transaction) {
      return
    }

    await this.coordinator.rollback(transaction)
    this.transactions.delete(txId)
  }

  // Saga 模式支持
  async executeSaga(saga: PluginSaga): Promise<void> {
    return await this.sagaManager.execute(saga)
  }
}

export interface PluginTransactionParticipant {
  id: string
  pluginId: string

  // 两阶段提交接口
  prepare(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>

  // 资源管理
  getResources(): PluginResource[]
  lockResources(): Promise<void>
  unlockResources(): Promise<void>
}

export interface PluginTransaction {
  id: string
  status: 'pending' | 'preparing' | 'prepared' | 'committing' | 'committed' | 'rolling-back' | 'rolled-back'
  participants: PluginTransactionParticipant[]
  startTime: number
  timeout?: number

  addParticipant(participant: PluginTransactionParticipant): void
  getParticipants(): PluginTransactionParticipant[]
  setStatus(status: string): void
}

export interface PluginSaga {
  id: string
  steps: SagaStep[]
  compensations: Map<string, CompensationAction>

  execute(): Promise<void>
  compensate(fromStep: number): Promise<void>
}

export interface SagaStep {
  id: string
  action: () => Promise<any>
  compensation: () => Promise<void>
}

// 使用示例
export class WorkflowPlugin implements PluginTransactionParticipant {
  id = 'workflow-participant'
  pluginId = 'workflow'

  private pendingOperations: any[] = []

  async prepare(): Promise<void> {
    // 准备阶段：验证操作可行性，锁定资源
    await this.validateOperations()
    await this.lockResources()
  }

  async commit(): Promise<void> {
    // 提交阶段：执行实际操作
    for (const operation of this.pendingOperations) {
      await this.executeOperation(operation)
    }
    this.pendingOperations = []
  }

  async rollback(): Promise<void> {
    // 回滚阶段：撤销已执行的操作
    for (const operation of this.pendingOperations.reverse()) {
      await this.compensateOperation(operation)
    }
    this.pendingOperations = []
    await this.unlockResources()
  }

  getResources(): PluginResource[] {
    return this.pendingOperations.map(op => op.resource)
  }

  async lockResources(): Promise<void> {
    // 锁定相关资源
  }

  async unlockResources(): Promise<void> {
    // 释放相关资源
  }
}
```

#### 插件配置机制
```typescript
export class PluginConfigManager {
  private configs: Map<string, any> = new Map()
  private schemas: Map<string, ZodSchema> = new Map()
  private validators: Map<string, ConfigValidator> = new Map()

  // 注册配置Schema
  registerSchema<T>(pluginId: string, schema: ZodSchema<T>): void {
    this.schemas.set(pluginId, schema)
    this.validators.set(pluginId, new ConfigValidator(schema))
  }

  // 设置配置
  setConfig<T>(pluginId: string, config: T): void {
    const validator = this.validators.get(pluginId)
    if (validator) {
      const validatedConfig = validator.validate(config)
      this.configs.set(pluginId, validatedConfig)
    } else {
      this.configs.set(pluginId, config)
    }

    // 触发配置变更事件
    this.emit('config:changed', { pluginId, config })
  }

  // 获取配置
  getConfig<T>(pluginId: string): T | undefined {
    return this.configs.get(pluginId)
  }

  // 生成配置UI
  generateConfigUI(pluginId: string): ConfigUISchema {
    const schema = this.schemas.get(pluginId)
    if (!schema) {
      throw new Error(`No schema found for plugin ${pluginId}`)
    }

    return this.generateUIFromSchema(schema)
  }

  // 热更新配置
  async hotReload(pluginId: string, config: any): Promise<void> {
    this.setConfig(pluginId, config)

    // 通知插件配置已更新
    await this.hooks.execute('plugin:config-updated', {
      pluginId,
      config,
      timestamp: Date.now()
    })
  }
}

// 配置Schema示例
export const workflowPluginConfig = z.object({
  enabled: z.boolean().default(true),
  maxConcurrentWorkflows: z.number().min(1).max(100).default(10),
  retryLimit: z.number().min(0).max(10).default(3),
  timeout: z.number().min(1000).max(300000).default(30000),
  notifications: z.object({
    email: z.boolean().default(true),
    slack: z.boolean().default(false),
    webhook: z.string().url().optional()
  }).default({}),
  features: z.object({
    aiAssistant: z.boolean().default(false),
    advancedScheduling: z.boolean().default(false),
    customActions: z.boolean().default(true)
  }).default({})
})

type WorkflowPluginConfig = z.infer<typeof workflowPluginConfig>
```

---

## 🔗 集成接口

### 与其他 LinchKit 包的交互方式

#### Schema 包集成
```typescript
/**
 * Schema 包集成接口
 * @description 为 Schema 包提供插件化的代码生成和验证支持
 */
export interface SchemaIntegration {
  /**
   * 注册 Schema 生成器插件
   * @param generator - Schema 生成器插件
   */
  registerSchemaGenerator(generator: SchemaGeneratorPlugin): void

  /**
   * 注册验证器插件
   * @param validator - 验证器插件
   */
  registerValidator(validator: ValidatorPlugin): void

  /**
   * 获取 Schema 配置
   * @param entityName - 实体名称
   * @returns Schema 配置对象
   */
  getSchemaConfig(entityName: string): SchemaConfig
}

// Schema 包使用示例
export class SchemaPackageIntegration {
  constructor(private core: PluginSystem) {
    this.setupSchemaHooks()
  }

  private setupSchemaHooks(): void {
    // 注册 Schema 生成钩子
    this.core.hooks.register('schema:before-generate', async (context) => {
      // 允许插件修改生成配置
      return await this.core.executeHook('schema:modify-config', context)
    })

    // 注册 Schema 验证钩子
    this.core.hooks.register('schema:validate', async (context) => {
      // 执行自定义验证逻辑
      return await this.core.executeHook('schema:custom-validate', context)
    })
  }
}
```

#### Auth 包集成
```typescript
/**
 * Auth 包集成接口
 * @description 为认证包提供插件化的认证策略和权限管理
 */
export interface AuthIntegration {
  /**
   * 注册认证策略插件
   * @param strategy - 认证策略插件
   */
  registerAuthStrategy(strategy: AuthStrategyPlugin): void

  /**
   * 注册权限提供者插件
   * @param provider - 权限提供者插件
   */
  registerPermissionProvider(provider: PermissionProviderPlugin): void

  /**
   * 获取用户权限
   * @param userId - 用户ID
   * @returns 用户权限列表
   */
  getUserPermissions(userId: string): Promise<string[]>
}

// Auth 包使用示例
export class AuthPackageIntegration {
  constructor(private core: PluginSystem) {
    this.setupAuthHooks()
  }

  private setupAuthHooks(): void {
    // 用户认证钩子
    this.core.hooks.register('auth:before-login', async (context) => {
      // 执行登录前的预处理
      await this.core.executeHook('auth:pre-login', context)
    })

    // 权限检查钩子
    this.core.hooks.register('auth:check-permission', async (context) => {
      // 执行自定义权限检查
      return await this.core.executeHook('auth:custom-permission-check', context)
    })
  }
}
```

#### CRUD 包集成
```typescript
/**
 * CRUD 包集成接口
 * @description 为 CRUD 包提供插件化的数据操作和业务逻辑扩展
 */
export interface CrudIntegration {
  /**
   * 注册数据操作插件
   * @param operation - 数据操作插件
   */
  registerDataOperation(operation: DataOperationPlugin): void

  /**
   * 注册业务规则插件
   * @param rule - 业务规则插件
   */
  registerBusinessRule(rule: BusinessRulePlugin): void

  /**
   * 执行数据操作
   * @param operation - 操作类型
   * @param data - 操作数据
   * @returns 操作结果
   */
  executeDataOperation(operation: string, data: any): Promise<any>
}

// CRUD 包使用示例
export class CrudPackageIntegration {
  constructor(private core: PluginSystem) {
    this.setupCrudHooks()
  }

  private setupCrudHooks(): void {
    // 数据创建钩子
    this.core.hooks.register('crud:before-create', async (context) => {
      // 执行创建前的验证和处理
      await this.core.executeHook('crud:validate-create', context)
      await this.core.executeHook('crud:transform-create-data', context)
    })

    // 数据更新钩子
    this.core.hooks.register('crud:before-update', async (context) => {
      // 执行更新前的验证和处理
      await this.core.executeHook('crud:validate-update', context)
      await this.core.executeHook('crud:transform-update-data', context)
    })

    // 数据删除钩子
    this.core.hooks.register('crud:before-delete', async (context) => {
      // 执行删除前的检查
      await this.core.executeHook('crud:validate-delete', context)
    })
  }
}
```

#### tRPC 包集成
```typescript
/**
 * tRPC 包集成接口
 * @description 为 tRPC 包提供插件化的 API 路由和中间件支持
 */
export interface TrpcIntegration {
  /**
   * 注册 API 路由插件
   * @param router - API 路由插件
   */
  registerApiRouter(router: ApiRouterPlugin): void

  /**
   * 注册中间件插件
   * @param middleware - 中间件插件
   */
  registerMiddleware(middleware: MiddlewarePlugin): void

  /**
   * 获取 API 配置
   * @param routeName - 路由名称
   * @returns API 配置对象
   */
  getApiConfig(routeName: string): ApiConfig
}

// tRPC 包使用示例
export class TrpcPackageIntegration {
  constructor(private core: PluginSystem) {
    this.setupTrpcHooks()
  }

  private setupTrpcHooks(): void {
    // API 请求钩子
    this.core.hooks.register('api:before-request', async (context) => {
      // 执行请求前的处理
      await this.core.executeHook('api:validate-request', context)
      await this.core.executeHook('api:transform-request', context)
    })

    // API 响应钩子
    this.core.hooks.register('api:before-response', async (context) => {
      // 执行响应前的处理
      await this.core.executeHook('api:transform-response', context)
      await this.core.executeHook('api:log-response', context)
    })
  }
}
```

#### UI 包集成
```typescript
/**
 * UI 包集成接口
 * @description 为 UI 包提供插件化的组件注册和主题管理
 */
export interface UiIntegration {
  /**
   * 注册 UI 组件插件
   * @param component - UI 组件插件
   */
  registerUiComponent(component: UiComponentPlugin): void

  /**
   * 注册主题插件
   * @param theme - 主题插件
   */
  registerTheme(theme: ThemePlugin): void

  /**
   * 获取组件配置
   * @param componentName - 组件名称
   * @returns 组件配置对象
   */
  getComponentConfig(componentName: string): ComponentConfig
}

// UI 包使用示例
export class UiPackageIntegration {
  constructor(private core: PluginSystem) {
    this.setupUiHooks()
  }

  private setupUiHooks(): void {
    // 组件渲染钩子
    this.core.hooks.register('ui:before-render', async (context) => {
      // 执行渲染前的处理
      await this.core.executeHook('ui:prepare-props', context)
      await this.core.executeHook('ui:apply-theme', context)
    })

    // 路由变化钩子
    this.core.hooks.register('ui:route-change', async (context) => {
      // 执行路由变化时的处理
      await this.core.executeHook('ui:update-navigation', context)
      await this.core.executeHook('ui:track-page-view', context)
    })
  }
}
```

### 依赖关系

#### 依赖注入机制
```typescript
/**
 * 依赖注入容器
 * @description 管理包间依赖关系和服务注册
 */
export class DependencyContainer {
  private services = new Map<string, any>()
  private factories = new Map<string, () => any>()
  private singletons = new Map<string, any>()

  /**
   * 注册服务
   * @param name - 服务名称
   * @param service - 服务实例或工厂函数
   * @param options - 注册选项
   */
  register<T>(name: string, service: T | (() => T), options?: RegisterOptions): void {
    if (typeof service === 'function') {
      this.factories.set(name, service as () => T)
    } else {
      this.services.set(name, service)
    }

    if (options?.singleton) {
      this.singletons.set(name, null) // 标记为单例
    }
  }

  /**
   * 解析服务
   * @param name - 服务名称
   * @returns 服务实例
   */
  resolve<T>(name: string): T {
    // 检查单例缓存
    if (this.singletons.has(name)) {
      const cached = this.singletons.get(name)
      if (cached) return cached
    }

    // 检查直接注册的服务
    if (this.services.has(name)) {
      const service = this.services.get(name)
      if (this.singletons.has(name)) {
        this.singletons.set(name, service)
      }
      return service
    }

    // 检查工厂函数
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!
      const service = factory()
      if (this.singletons.has(name)) {
        this.singletons.set(name, service)
      }
      return service
    }

    throw new Error(`Service ${name} not found`)
  }

  /**
   * 检查服务是否存在
   * @param name - 服务名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name)
  }
}

interface RegisterOptions {
  singleton?: boolean
  lazy?: boolean
}
```

### 数据流

#### 包间数据流管理
```typescript
/**
 * 数据流管理器
 * @description 管理包间的数据传递和状态同步
 */
export class DataFlowManager {
  private streams = new Map<string, DataStream>()
  private subscribers = new Map<string, Set<DataStreamSubscriber>>()

  /**
   * 创建数据流
   * @param name - 数据流名称
   * @param config - 数据流配置
   */
  createStream(name: string, config: DataStreamConfig): DataStream {
    const stream = new DataStream(name, config)
    this.streams.set(name, stream)
    this.subscribers.set(name, new Set())
    return stream
  }

  /**
   * 订阅数据流
   * @param streamName - 数据流名称
   * @param subscriber - 订阅者
   */
  subscribe(streamName: string, subscriber: DataStreamSubscriber): void {
    const subscribers = this.subscribers.get(streamName)
    if (subscribers) {
      subscribers.add(subscriber)
    }
  }

  /**
   * 发布数据到流
   * @param streamName - 数据流名称
   * @param data - 数据
   */
  publish(streamName: string, data: any): void {
    const stream = this.streams.get(streamName)
    const subscribers = this.subscribers.get(streamName)

    if (stream && subscribers) {
      // 应用数据转换
      const transformedData = stream.transform(data)

      // 通知所有订阅者
      for (const subscriber of subscribers) {
        try {
          subscriber.onData(transformedData)
        } catch (error) {
          console.error('Subscriber error:', error)
        }
      }
    }
  }
}

export interface DataStream {
  name: string
  config: DataStreamConfig
  transform(data: any): any
}

export interface DataStreamConfig {
  bufferSize?: number
  transform?: (data: any) => any
  filter?: (data: any) => boolean
}

export interface DataStreamSubscriber {
  onData(data: any): void
  onError?(error: Error): void
}
```

---

## 🎯 最佳实践

### 推荐使用模式

#### 插件开发最佳实践
```typescript
/**
 * 标准插件模板
 * @description 推荐的插件开发模式和结构
 */
export class StandardPluginTemplate implements Plugin {
  id = 'my-plugin'
  name = 'My Plugin'
  version = '1.0.0'
  description = 'A well-structured plugin example'

  // 1. 声明依赖
  dependencies = [
    { id: '@linch-kit/schema', version: '^1.0.0' }
  ]

  // 2. 声明权限
  permissions = [
    'read:users',
    'write:logs'
  ]

  // 3. 配置Schema
  configSchema = z.object({
    enabled: z.boolean().default(true),
    apiKey: z.string().optional(),
    retryLimit: z.number().min(0).max(10).default(3)
  })

  // 4. 生命周期钩子
  async setup(context: PluginContext): Promise<void> {
    // 初始化资源，不执行业务逻辑
    this.logger = context.logger
    this.config = context.config.getConfig(this.id)

    // 注册钩子
    context.hooks.register('user:created', this.onUserCreated.bind(this))

    // 注册事件监听
    context.events.on('system:startup', this.onSystemStartup.bind(this))
  }

  async activate(context: PluginContext): Promise<void> {
    // 启动服务，执行业务逻辑
    if (this.config.enabled) {
      await this.startService()
    }
  }

  async deactivate(context: PluginContext): Promise<void> {
    // 停止服务，保留资源
    await this.stopService()
  }

  async teardown(context: PluginContext): Promise<void> {
    // 清理所有资源
    await this.cleanup()
  }

  // 5. 钩子处理器
  private async onUserCreated(context: HookContext): Promise<void> {
    // 处理用户创建事件
    const user = context.data
    this.logger.info(`User created: ${user.id}`)
  }

  // 6. 事件监听器
  private async onSystemStartup(event: PluginEvent): Promise<void> {
    // 处理系统启动事件
    this.logger.info('System started, plugin is ready')
  }

  // 7. 私有方法
  private async startService(): Promise<void> {
    // 启动插件服务
  }

  private async stopService(): Promise<void> {
    // 停止插件服务
  }

  private async cleanup(): Promise<void> {
    // 清理资源
  }
}
```

#### 钩子使用最佳实践
```typescript
/**
 * 钩子使用最佳实践
 * @description 展示如何正确使用钩子系统
 */
export class HookBestPractices {
  constructor(private hooks: HookSystem) {}

  // 1. 使用优先级控制执行顺序
  registerPriorityHooks(): void {
    // 高优先级：验证
    this.hooks.register('user:before-create', this.validateUser, { priority: 1 })

    // 中优先级：转换
    this.hooks.register('user:before-create', this.transformUser, { priority: 5 })

    // 低优先级：日志
    this.hooks.register('user:before-create', this.logUserCreation, { priority: 10 })
  }

  // 2. 使用条件钩子
  registerConditionalHooks(): void {
    this.hooks.register('user:before-create', this.sendWelcomeEmail, {
      condition: (context) => context.data.emailEnabled === true
    })
  }

  // 3. 使用一次性钩子
  registerOneTimeHooks(): void {
    this.hooks.register('system:startup', this.initializePlugin, { once: true })
  }

  // 4. 错误处理
  private async validateUser(context: HookContext): Promise<any> {
    try {
      const user = context.data
      if (!user.email) {
        throw new Error('Email is required')
      }
      return user
    } catch (error) {
      // 记录错误但不阻止其他钩子执行
      console.error('User validation failed:', error)
      throw error // 重新抛出以阻止后续处理
    }
  }

  // 5. 数据转换
  private async transformUser(context: HookContext): Promise<any> {
    const user = context.data
    return {
      ...user,
      email: user.email.toLowerCase(),
      createdAt: new Date().toISOString()
    }
  }

  // 6. 日志记录
  private async logUserCreation(context: HookContext): Promise<void> {
    const user = context.data
    console.log(`Creating user: ${user.email}`)
  }
}
```

### 反模式警告

#### 常见错误模式
```typescript
/**
 * 反模式警告
 * @description 列出常见的错误使用模式和解决方案
 */
export class AntiPatterns {
  // ❌ 反模式 1: 在 setup 中执行业务逻辑
  async badSetup(context: PluginContext): Promise<void> {
    // 错误：在 setup 中启动服务
    await this.startExpensiveService()

    // 错误：在 setup 中执行网络请求
    await this.fetchRemoteConfig()
  }

  // ✅ 正确模式：将业务逻辑放在 activate 中
  async goodSetup(context: PluginContext): Promise<void> {
    // 正确：只初始化资源
    this.logger = context.logger
    this.config = context.config.getConfig(this.id)
  }

  async goodActivate(context: PluginContext): Promise<void> {
    // 正确：在 activate 中执行业务逻辑
    await this.startExpensiveService()
    await this.fetchRemoteConfig()
  }

  // ❌ 反模式 2: 钩子中执行长时间操作
  async badHook(context: HookContext): Promise<void> {
    // 错误：执行耗时操作
    await this.processLargeFile()

    // 错误：同步网络请求
    await this.uploadToRemoteServer(context.data)
  }

  // ✅ 正确模式：异步处理或队列
  async goodHook(context: HookContext): Promise<void> {
    // 正确：放入队列异步处理
    this.taskQueue.add('process-file', context.data)

    // 正确：快速验证和转换
    return this.validateAndTransform(context.data)
  }

  // ❌ 反模式 3: 直接修改共享状态
  async badStateManagement(context: HookContext): Promise<void> {
    // 错误：直接修改全局状态
    globalState.users.push(context.data)

    // 错误：修改其他插件的数据
    otherPlugin.data = context.data
  }

  // ✅ 正确模式：通过事件通信
  async goodStateManagement(context: HookContext): Promise<void> {
    // 正确：通过事件通知状态变化
    context.events.emit('user:state-changed', context.data)

    // 正确：使用依赖注入获取服务
    const userService = context.use<UserService>('user-service')
    await userService.updateUser(context.data)
  }

  // ❌ 反模式 4: 忽略错误处理
  async badErrorHandling(context: HookContext): Promise<void> {
    // 错误：忽略可能的错误
    const result = await this.riskyOperation()

    // 错误：吞掉异常
    try {
      await this.anotherRiskyOperation()
    } catch (error) {
      // 静默忽略错误
    }
  }

  // ✅ 正确模式：适当的错误处理
  async goodErrorHandling(context: HookContext): Promise<void> {
    try {
      const result = await this.riskyOperation()
      return result
    } catch (error) {
      // 正确：记录错误
      context.logger.error('Operation failed:', error)

      // 正确：决定是否重新抛出
      if (error.code === 'CRITICAL') {
        throw error // 阻止后续处理
      }

      // 正确：提供回退方案
      return this.fallbackOperation()
    }
  }
}
```

### 性能优化建议

#### 插件性能优化
```typescript
/**
 * 性能优化建议
 * @description 提供插件性能优化的具体建议
 */
export class PerformanceOptimization {
  // 1. 懒加载重资源
  private heavyResource: HeavyResource | null = null

  private async getHeavyResource(): Promise<HeavyResource> {
    if (!this.heavyResource) {
      this.heavyResource = await this.loadHeavyResource()
    }
    return this.heavyResource
  }

  // 2. 缓存计算结果
  private cache = new Map<string, any>()

  private async getExpensiveData(key: string): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }

    const data = await this.computeExpensiveData(key)
    this.cache.set(key, data)
    return data
  }

  // 3. 批量处理
  private batchQueue: any[] = []
  private batchTimer: NodeJS.Timeout | null = null

  private addToBatch(item: any): void {
    this.batchQueue.push(item)

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
        this.batchQueue = []
        this.batchTimer = null
      }, 100) // 100ms 批量间隔
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length > 0) {
      await this.processBatchItems(this.batchQueue)
    }
  }

  // 4. 内存管理
  async teardown(context: PluginContext): Promise<void> {
    // 清理缓存
    this.cache.clear()

    // 清理定时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    // 清理重资源
    if (this.heavyResource) {
      await this.heavyResource.dispose()
      this.heavyResource = null
    }
  }

  // 5. 异步优化
  private async optimizedAsyncOperation(): Promise<void> {
    // 使用 Promise.all 并行执行
    const [result1, result2, result3] = await Promise.all([
      this.operation1(),
      this.operation2(),
      this.operation3()
    ])

    // 使用 Promise.allSettled 处理可能失败的操作
    const results = await Promise.allSettled([
      this.riskyOperation1(),
      this.riskyOperation2()
    ])

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Operation ${index} failed:`, result.reason)
      }
    })
  }
}
```

---

## 📊 性能考量

### 构建性能
- **DTS 构建时间**: < 45秒 (包含插件系统)
- **包大小**: < 2MB (压缩后，包含完整插件系统)
- **启动时间**: < 200ms (CLI启动 + 插件系统初始化)

### 运行时性能
- **插件加载**: < 100ms (单个插件，包含依赖解析)
- **钩子执行**: < 10ms (单个钩子，包含权限检查)
- **事件发布**: < 5ms (单个事件，包含追踪)
- **配置加载**: < 20ms (包含Schema验证)
- **事务协调**: < 50ms (两阶段提交准备)

### 内存使用
- **基础内存**: < 50MB (核心功能 + 插件系统)
- **插件内存**: < 30MB (单个插件，包含上下文)
- **事件缓存**: < 20MB (事件追踪数据)
- **配置缓存**: < 10MB (配置数据)
- **事务状态**: < 15MB (活跃事务数据)

### 插件系统性能
- **插件注册**: < 20ms (包含依赖检查)
- **依赖解析**: < 30ms (复杂依赖图)
- **权限检查**: < 5ms (单次权限验证)
- **UI注册**: < 15ms (路由和组件注册)
- **沙箱创建**: < 100ms (VM隔离环境)

---

## 🧪 测试策略

### 测试覆盖率要求
- **总体覆盖率**: > 90% (基础设施包的高标准)
- **插件系统核心**: > 95% (生命周期、注册、加载)
- **钩子系统**: > 95% (钩子注册、执行、优先级)
- **事件系统**: > 90% (事件发布、订阅、追踪)
- **事务协调**: > 90% (两阶段提交、回滚、Saga)
- **权限控制**: > 95% (权限检查、资源隔离)
- **配置管理**: > 85% (Schema验证、UI生成)
- **工具函数**: > 85%
- **CLI命令**: > 80%

### 测试金字塔策略

#### 单元测试 (70%)
- **插件系统组件**: 每个类和方法的独立测试
- **钩子执行器**: 各种执行模式的测试
- **事件总线**: 发布订阅机制的测试
- **配置管理**: Schema验证和加载的测试
- **工具函数**: 纯函数的输入输出测试

#### 集成测试 (20%)
- **插件生命周期**: 完整的插件加载和卸载流程
- **跨组件交互**: 钩子、事件、配置的协同工作
- **依赖解析**: 复杂依赖关系的解析测试
- **事务协调**: 多参与者的事务处理测试

#### 端到端测试 (10%)
- **CLI工作流**: 完整的命令行操作流程
- **插件开发流程**: 从开发到部署的完整流程
- **性能基准**: 关键性能指标的验证
- **错误恢复**: 异常情况下的系统恢复能力

### 测试工具和方法

#### 测试框架选择
- **单元测试**: Jest + TypeScript
- **集成测试**: Jest + Supertest
- **端到端测试**: Playwright
- **性能测试**: Benchmark.js
- **覆盖率**: Istanbul/NYC

#### 测试辅助工具
```typescript
/**
 * 插件测试工具类
 * @description 提供插件开发和测试的辅助工具
 */
export class PluginTestUtils {
  /**
   * 创建测试插件系统
   * @param options - 测试选项
   * @returns 配置好的插件系统实例
   */
  static createTestPluginSystem(options?: TestPluginSystemOptions): PluginSystem {
    return new PluginSystem({
      loader: { timeout: 1000 }, // 测试环境使用较短超时
      permissions: { strict: false }, // 测试环境放宽权限检查
      events: { maxListeners: 100 },
      ...options
    })
  }

  /**
   * 创建模拟插件
   * @param overrides - 插件属性覆盖
   * @returns 模拟插件实例
   */
  static createMockPlugin(overrides?: Partial<Plugin>): Plugin {
    return {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      async setup(ctx) { /* mock setup */ },
      async activate(ctx) { /* mock activate */ },
      async deactivate(ctx) { /* mock deactivate */ },
      async teardown(ctx) { /* mock teardown */ },
      ...overrides
    }
  }

  /**
   * 等待钩子执行完成
   * @param hookSystem - 钩子系统
   * @param hookName - 钩子名称
   * @param timeout - 超时时间
   */
  static async waitForHook(
    hookSystem: HookSystem,
    hookName: string,
    timeout = 1000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Hook timeout')), timeout)

      hookSystem.register(hookName, async () => {
        clearTimeout(timer)
        resolve()
      }, { once: true })
    })
  }

  /**
   * 模拟事件监听
   * @param eventBus - 事件总线
   * @param eventName - 事件名称
   * @returns 事件收集器
   */
  static createEventCollector(eventBus: EventBus, eventName: string): EventCollector {
    const events: PluginEvent[] = []

    eventBus.on(eventName, (event) => {
      events.push(event)
    })

    return {
      getEvents: () => [...events],
      getLastEvent: () => events[events.length - 1],
      getEventCount: () => events.length,
      clear: () => events.length = 0
    }
  }
}

export interface EventCollector {
  getEvents(): PluginEvent[]
  getLastEvent(): PluginEvent | undefined
  getEventCount(): number
  clear(): void
}
```

#### 测试模式和策略
```typescript
/**
 * 测试模式定义
 * @description 定义不同的测试模式和策略
 */
export enum TestMode {
  UNIT = 'unit',           // 单元测试模式
  INTEGRATION = 'integration', // 集成测试模式
  E2E = 'e2e',            // 端到端测试模式
  PERFORMANCE = 'performance' // 性能测试模式
}

/**
 * 测试策略配置
 * @description 根据测试模式配置不同的测试策略
 */
export class TestStrategy {
  static getConfig(mode: TestMode): TestConfig {
    switch (mode) {
      case TestMode.UNIT:
        return {
          timeout: 5000,
          retries: 0,
          parallel: true,
          mocking: true,
          coverage: true
        }

      case TestMode.INTEGRATION:
        return {
          timeout: 30000,
          retries: 2,
          parallel: false,
          mocking: false,
          coverage: true
        }

      case TestMode.E2E:
        return {
          timeout: 60000,
          retries: 3,
          parallel: false,
          mocking: false,
          coverage: false
        }

      case TestMode.PERFORMANCE:
        return {
          timeout: 120000,
          retries: 0,
          parallel: false,
          mocking: false,
          coverage: false,
          warmup: true,
          iterations: 1000
        }
    }
  }
}

export interface TestConfig {
  timeout: number
  retries: number
  parallel: boolean
  mocking: boolean
  coverage: boolean
  warmup?: boolean
  iterations?: number
}
```

### 具体测试用例
```typescript
// 插件系统单元测试
describe('PluginSystem', () => {
  let pluginSystem: PluginSystem

  beforeEach(() => {
    pluginSystem = new PluginSystem({
      loader: { timeout: 5000 },
      permissions: { strict: true }
    })
  })

  test('should register plugin with dependencies', async () => {
    const basePlugin: Plugin = {
      id: 'base-plugin',
      name: 'Base Plugin',
      version: '1.0.0',
      async setup(ctx) { /* setup logic */ }
    }

    const dependentPlugin: Plugin = {
      id: 'dependent-plugin',
      name: 'Dependent Plugin',
      version: '1.0.0',
      dependencies: [{ id: 'base-plugin', version: '^1.0.0' }],
      async setup(ctx) {
        const base = ctx.use('base-plugin')
        expect(base).toBeDefined()
      }
    }

    await pluginSystem.registerPlugin(basePlugin)
    await pluginSystem.registerPlugin(dependentPlugin)

    const context = await pluginSystem.loadPlugin('dependent-plugin')
    expect(context).toBeDefined()
  })

  test('should handle plugin permissions', async () => {
    const plugin: Plugin = {
      id: 'restricted-plugin',
      name: 'Restricted Plugin',
      version: '1.0.0',
      permissions: ['read:users', 'write:logs']
    }

    await pluginSystem.registerPlugin(plugin)

    expect(pluginSystem.checkPermission('restricted-plugin', 'read:users')).toBe(true)
    expect(pluginSystem.checkPermission('restricted-plugin', 'delete:users')).toBe(false)
  })
})

// 钩子系统测试
describe('HookSystem', () => {
  test('should execute hooks in priority order', async () => {
    const hookSystem = new HookSystem()
    const executionOrder: number[] = []

    hookSystem.register('test:hook', async () => {
      executionOrder.push(2)
    }, { priority: 2 })

    hookSystem.register('test:hook', async () => {
      executionOrder.push(1)
    }, { priority: 1 })

    await hookSystem.execute('test:hook', { data: 'test' })

    expect(executionOrder).toEqual([1, 2])
  })

  test('should support conditional hooks', async () => {
    const hookSystem = new HookSystem()
    let executed = false

    hookSystem.register('test:conditional', async () => {
      executed = true
    }, {
      condition: (ctx) => ctx.data.shouldExecute === true
    })

    await hookSystem.execute('test:conditional', { data: { shouldExecute: false } })
    expect(executed).toBe(false)

    await hookSystem.execute('test:conditional', { data: { shouldExecute: true } })
    expect(executed).toBe(true)
  })
})

// 事件系统测试
describe('EventBus', () => {
  test('should emit and receive events with tracing', async () => {
    const eventBus = new EventBus()
    let receivedEvent: PluginEvent | null = null

    eventBus.on('test:event', (event) => {
      receivedEvent = event
    })

    eventBus.emit('test:event', { message: 'hello' })

    await new Promise(resolve => setTimeout(resolve, 10)) // 等待异步处理

    expect(receivedEvent).toBeDefined()
    expect(receivedEvent?.payload.message).toBe('hello')
    expect(receivedEvent?.traceId).toBeDefined()
  })
})

// 事务协调器测试
describe('PluginTransactionManager', () => {
  test('should coordinate two-phase commit', async () => {
    const txManager = new PluginTransactionManager()
    const participant = new MockTransactionParticipant()

    const txId = txManager.begin()
    txManager.register(txId, participant)

    await txManager.commit(txId)

    expect(participant.prepared).toBe(true)
    expect(participant.committed).toBe(true)
    expect(participant.rolledBack).toBe(false)
  })

  test('should rollback on failure', async () => {
    const txManager = new PluginTransactionManager()
    const failingParticipant = new FailingTransactionParticipant()

    const txId = txManager.begin()
    txManager.register(txId, failingParticipant)

    await expect(txManager.commit(txId)).rejects.toThrow()
    expect(failingParticipant.rolledBack).toBe(true)
  })
})

// Mock 类
class MockTransactionParticipant implements PluginTransactionParticipant {
  id = 'mock-participant'
  pluginId = 'mock-plugin'
  prepared = false
  committed = false
  rolledBack = false

  async prepare(): Promise<void> {
    this.prepared = true
  }

  async commit(): Promise<void> {
    this.committed = true
  }

  async rollback(): Promise<void> {
    this.rolledBack = true
  }

  getResources(): PluginResource[] {
    return []
  }

  async lockResources(): Promise<void> {}
  async unlockResources(): Promise<void> {}
}
```
```

---

## 🚀 开发指南

### 开发优先级
1. **P0**: 通用类型定义和工具函数
2. **P0**: 插件系统基础架构
   - 插件注册表和加载器
   - 基础生命周期管理
   - 简单钩子系统
3. **P0**: 钩子系统完整实现
   - 优先级支持
   - 条件执行
   - 异步钩子
4. **P1**: 事件系统实现
   - 事件发布订阅
   - 事件追踪
   - 权限控制
5. **P1**: 配置管理和CLI系统
   - Zod Schema集成
   - 配置UI生成
   - CLI命令插件化
6. **P2**: 高级功能
   - 跨插件事务协调
   - UI注册机制
   - 权限和资源隔离
7. **P2**: 沙箱机制(预留)
8. **P3**: 测试和文档完善
9. **P3**: 性能优化和监控

### 验收标准
- [ ] 所有模块构建成功
- [ ] 插件系统核心功能完整
  - [ ] 插件注册和加载
  - [ ] 依赖解析和管理
  - [ ] 生命周期钩子
  - [ ] 事件发布订阅
  - [ ] 配置管理
- [ ] 钩子系统功能完整
  - [ ] 优先级执行
  - [ ] 条件钩子
  - [ ] 异步支持
- [ ] 事件系统功能完整
  - [ ] 事件追踪
  - [ ] 权限控制
  - [ ] 错误处理
- [ ] 事务协调功能完整
  - [ ] 两阶段提交
  - [ ] 回滚机制
  - [ ] Saga模式支持
- [ ] CLI命令正常工作
- [ ] 配置管理正常工作
- [ ] 测试覆盖率 > 90%
- [ ] 性能指标达标
- [ ] 文档完整准确

---

## 🤖 AI 集成支持

### AI-First 开发方法论的具体应用

#### 结构化数据设计
```typescript
/**
 * AI 友好的数据结构设计
 * @description 所有接口和数据结构都便于 AI 理解和处理
 */
export interface AIFriendlyPlugin extends Plugin {
  // 1. 明确的元数据
  metadata: {
    category: 'core' | 'business' | 'ui' | 'integration'
    tags: string[]
    complexity: 'low' | 'medium' | 'high'
    aiCompatible: boolean
  }

  // 2. 结构化的配置
  configSchema: ZodSchema & {
    _aiHints?: {
      description: string
      examples: any[]
      constraints: string[]
    }
  }

  // 3. 标准化的钩子声明
  hooks?: Record<string, {
    handler: HookHandler
    description: string
    inputSchema?: ZodSchema
    outputSchema?: ZodSchema
  }>

  // 4. 文档化的事件
  events?: Record<string, {
    listener: EventListener
    description: string
    payloadSchema?: ZodSchema
  }>
}
```

#### AI 工具集成点
```typescript
/**
 * AI 工具集成接口
 * @description 为 AI 工具提供标准化的集成点
 */
export interface AIToolIntegration {
  /**
   * 获取插件的 AI 描述
   * @param pluginId - 插件ID
   * @returns AI 可理解的插件描述
   */
  getPluginAIDescription(pluginId: string): AIPluginDescription

  /**
   * 生成插件代码
   * @param specification - AI 生成的规格说明
   * @returns 生成的插件代码
   */
  generatePluginCode(specification: AIPluginSpecification): Promise<string>

  /**
   * 验证 AI 生成的代码
   * @param code - 生成的代码
   * @returns 验证结果
   */
  validateAIGeneratedCode(code: string): Promise<AICodeValidationResult>

  /**
   * 优化插件性能
   * @param pluginId - 插件ID
   * @returns 优化建议
   */
  getPerformanceOptimizationSuggestions(pluginId: string): Promise<AIOptimizationSuggestion[]>
}

export interface AIPluginDescription {
  id: string
  name: string
  purpose: string
  capabilities: string[]
  dependencies: string[]
  configurationOptions: Record<string, any>
  hooks: Record<string, string>
  events: Record<string, string>
  examples: {
    usage: string
    configuration: any
  }[]
}

export interface AIPluginSpecification {
  name: string
  description: string
  requirements: string[]
  constraints: string[]
  dependencies: string[]
  hooks: string[]
  events: string[]
  configuration: Record<string, any>
}

export interface AICodeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  score: number // 0-100
}

export interface AIOptimizationSuggestion {
  type: 'performance' | 'memory' | 'security' | 'maintainability'
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  codeExample?: string
}
```

#### AI 辅助开发工具
```typescript
/**
 * AI 辅助开发工具
 * @description 提供 AI 辅助的插件开发和调试工具
 */
export class AIAssistantTools {
  /**
   * 分析插件依赖关系
   * @param plugins - 插件列表
   * @returns AI 分析结果
   */
  static async analyzeDependencies(plugins: Plugin[]): Promise<AIDependencyAnalysis> {
    const analysis: AIDependencyAnalysis = {
      circularDependencies: [],
      optimizationOpportunities: [],
      riskAssessment: {
        level: 'low',
        factors: []
      },
      recommendations: []
    }

    // AI 分析逻辑
    const dependencyGraph = this.buildDependencyGraph(plugins)
    analysis.circularDependencies = this.detectCircularDependencies(dependencyGraph)
    analysis.optimizationOpportunities = this.findOptimizationOpportunities(dependencyGraph)
    analysis.riskAssessment = this.assessRisks(dependencyGraph)
    analysis.recommendations = this.generateRecommendations(analysis)

    return analysis
  }

  /**
   * 生成插件文档
   * @param plugin - 插件实例
   * @returns 生成的文档
   */
  static async generatePluginDocumentation(plugin: Plugin): Promise<string> {
    const template = `
# ${plugin.name}

## 概述
${plugin.description || '待补充描述'}

## 安装
\`\`\`bash
npm install ${plugin.id}
\`\`\`

## 配置
${this.generateConfigDocumentation(plugin.configSchema)}

## 钩子
${this.generateHooksDocumentation(plugin.hooks)}

## 事件
${this.generateEventsDocumentation(plugin.events)}

## 示例
${this.generateUsageExamples(plugin)}
`
    return template
  }

  /**
   * 智能错误诊断
   * @param error - 错误信息
   * @param context - 错误上下文
   * @returns 诊断结果和建议
   */
  static async diagnoseError(error: Error, context: any): Promise<AIErrorDiagnosis> {
    return {
      errorType: this.classifyError(error),
      rootCause: this.analyzeRootCause(error, context),
      solutions: this.generateSolutions(error, context),
      preventionTips: this.getPreventionTips(error),
      relatedDocumentation: this.findRelatedDocs(error)
    }
  }

  private static buildDependencyGraph(plugins: Plugin[]): Map<string, Set<string>> {
    // 构建依赖图的实现
    const graph = new Map<string, Set<string>>()
    // ... 实现细节
    return graph
  }

  private static detectCircularDependencies(graph: Map<string, Set<string>>): string[][] {
    // 检测循环依赖的实现
    return []
  }

  private static generateConfigDocumentation(schema?: ZodSchema): string {
    // 生成配置文档的实现
    return '配置文档待生成'
  }
}

export interface AIDependencyAnalysis {
  circularDependencies: string[][]
  optimizationOpportunities: string[]
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
  }
  recommendations: string[]
}

export interface AIErrorDiagnosis {
  errorType: string
  rootCause: string
  solutions: string[]
  preventionTips: string[]
  relatedDocumentation: string[]
}
```

### 扩展机制

#### 插件注册和发现
Core 包提供了完整的插件注册和发现机制：

```typescript
// 插件自动发现
export class PluginDiscovery {
  async discoverPlugins(searchPaths: string[]): Promise<PluginMetadata[]> {
    const plugins: PluginMetadata[] = []

    for (const path of searchPaths) {
      const packageJson = await this.readPackageJson(path)
      if (this.isLinchKitPlugin(packageJson)) {
        plugins.push(this.extractPluginMetadata(packageJson))
      }
    }

    return plugins
  }

  private isLinchKitPlugin(packageJson: any): boolean {
    return packageJson.keywords?.includes('linch-kit-plugin') ||
           packageJson.name?.startsWith('@linch-kit/plugin-')
  }
}
```

#### 第三方集成支持
Core 包设计为与第三方工具和服务无缝集成：

```typescript
// 第三方服务集成接口
export interface ThirdPartyIntegration {
  name: string
  version: string
  initialize(config: IntegrationConfig): Promise<void>
  getCapabilities(): IntegrationCapability[]
}

// 注册第三方集成
export class IntegrationRegistry {
  private integrations = new Map<string, ThirdPartyIntegration>()

  register(integration: ThirdPartyIntegration): void {
    this.integrations.set(integration.name, integration)
  }

  get(name: string): ThirdPartyIntegration | undefined {
    return this.integrations.get(name)
  }
}
```

#### AI 友好的错误处理
```typescript
/**
 * AI 友好的错误处理
 * @description 提供结构化的错误信息，便于 AI 分析和处理
 */
export class AIFriendlyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, any>,
    public readonly suggestions: string[] = [],
    public readonly relatedDocs: string[] = []
  ) {
    super(message)
    this.name = 'AIFriendlyError'
  }

  /**
   * 转换为 AI 可处理的格式
   * @returns AI 友好的错误描述
   */
  toAIFormat(): AIErrorFormat {
    return {
      type: 'error',
      code: this.code,
      message: this.message,
      context: this.context,
      suggestions: this.suggestions,
      relatedDocs: this.relatedDocs,
      timestamp: new Date().toISOString(),
      stackTrace: this.stack
    }
  }
}

export interface AIErrorFormat {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  context: Record<string, any>
  suggestions: string[]
  relatedDocs: string[]
  timestamp: string
  stackTrace?: string
}
```

---

## 🚨 统一错误管理系统

### 错误分类和层次结构

#### LinchKit 统一错误基类
```typescript
/**
 * LinchKit 统一错误基类
 * @description 所有 LinchKit 错误的基类，提供统一的错误处理接口
 */
export abstract class LinchKitError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number
  abstract readonly category: ErrorCategory

  public readonly timestamp: Date
  public readonly traceId?: string
  public readonly correlationId?: string

  constructor(
    message: string,
    public readonly context?: ErrorContext,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.traceId = context?.traceId
    this.correlationId = context?.correlationId

    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 序列化错误信息
   */
  toJSON(): ErrorSerialized {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      traceId: this.traceId,
      correlationId: this.correlationId,
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    }
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserMessage(): string {
    return this.context?.userMessage || this.message
  }

  /**
   * 检查是否为可重试错误
   */
  isRetryable(): boolean {
    return this.context?.retryable ?? false
  }

  /**
   * 获取错误严重级别
   */
  getSeverity(): ErrorSeverity {
    return this.context?.severity ?? 'error'
  }
}

/**
 * 错误分类枚举
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  NETWORK = 'network',
  CONFIGURATION = 'configuration',
  BUSINESS_LOGIC = 'business_logic',
  PLUGIN = 'plugin',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * 错误严重级别
 */
export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * 错误上下文接口
 */
export interface ErrorContext {
  /** 用户友好的错误信息 */
  userMessage?: string
  /** 错误是否可重试 */
  retryable?: boolean
  /** 错误严重级别 */
  severity?: ErrorSeverity
  /** 追踪ID */
  traceId?: string
  /** 关联ID */
  correlationId?: string
  /** 操作名称 */
  operation?: string
  /** 用户ID */
  userId?: string
  /** 租户ID */
  tenantId?: string
  /** 请求ID */
  requestId?: string
  /** 插件ID */
  pluginId?: string
  /** 额外的上下文数据 */
  metadata?: Record<string, any>
}

/**
 * 序列化后的错误信息
 */
export interface ErrorSerialized {
  name: string
  code: string
  message: string
  statusCode: number
  category: ErrorCategory
  timestamp: string
  traceId?: string
  correlationId?: string
  context?: ErrorContext
  stack?: string
  cause?: {
    name: string
    message: string
    stack?: string
  }
}
```

## 📊 统一日志管理系统

### 日志系统架构

#### 统一日志接口
```typescript
/**
 * LinchKit 统一日志接口
 * @description 提供结构化、可扩展的日志记录能力
 */
export interface Logger {
  debug(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string, meta?: LogMeta): void
  fatal(message: string, meta?: LogMeta): void

  // 结构化日志方法
  log(level: LogLevel, message: string, meta?: LogMeta): void

  // 性能日志
  performance(operation: string, duration: number, meta?: LogMeta): void

  // 审计日志
  audit(action: string, resource: string, meta?: LogMeta): void

  // 创建子日志器
  child(context: LogContext): Logger

  // 设置日志级别
  setLevel(level: LogLevel): void

  // 添加传输器
  addTransport(transport: LogTransport): void
}

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * 日志元数据
 */
export interface LogMeta {
  /** 追踪ID */
  traceId?: string
  /** 关联ID */
  correlationId?: string
  /** 用户ID */
  userId?: string
  /** 租户ID */
  tenantId?: string
  /** 请求ID */
  requestId?: string
  /** 插件ID */
  pluginId?: string
  /** 操作名称 */
  operation?: string
  /** 持续时间（毫秒） */
  duration?: number
  /** 错误信息 */
  error?: Error
  /** 额外数据 */
  data?: Record<string, any>
  /** 标签 */
  tags?: string[]
}

/**
 * 日志上下文
 */
export interface LogContext {
  /** 日志器名称 */
  name?: string
  /** 默认元数据 */
  defaultMeta?: LogMeta
  /** 日志级别 */
  level?: LogLevel
}

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: Date
  /** 日志级别 */
  level: LogLevel
  /** 消息 */
  message: string
  /** 元数据 */
  meta?: LogMeta
  /** 日志器名称 */
  logger?: string
}

/**
 * 日志传输器接口
 */
export interface LogTransport {
  /** 传输器名称 */
  name: string
  /** 最小日志级别 */
  level: LogLevel
  /** 写入日志 */
  write(entry: LogEntry): Promise<void>
  /** 关闭传输器 */
  close(): Promise<void>
}

/**
 * 安全审计日志接口
 */
export interface SecurityAuditLogger {
  /** 记录认证事件 */
  logAuthentication(event: AuthenticationEvent): void
  /** 记录授权事件 */
  logAuthorization(event: AuthorizationEvent): void
  /** 记录数据访问事件 */
  logDataAccess(event: DataAccessEvent): void
  /** 记录配置变更事件 */
  logConfigurationChange(event: ConfigurationChangeEvent): void
  /** 记录安全事件 */
  logSecurityEvent(event: SecurityEvent): void
  /** 记录权限变更事件 */
  logPermissionChange(event: PermissionChangeEvent): void
}

/**
 * 安全事件基础接口
 */
export interface BaseSecurityEvent {
  /** 事件ID */
  eventId: string
  /** 事件类型 */
  eventType: SecurityEventType
  /** 时间戳 */
  timestamp: Date
  /** 用户ID */
  userId?: string
  /** 会话ID */
  sessionId?: string
  /** IP地址 */
  ipAddress?: string
  /** 用户代理 */
  userAgent?: string
  /** 请求ID */
  requestId?: string
  /** 租户ID */
  tenantId?: string
  /** 事件严重级别 */
  severity: SecurityEventSeverity
  /** 事件结果 */
  result: SecurityEventResult
  /** 额外元数据 */
  metadata?: Record<string, any>
}

/**
 * 认证事件
 */
export interface AuthenticationEvent extends BaseSecurityEvent {
  eventType: SecurityEventType.AUTHENTICATION
  /** 认证方法 */
  authMethod: string
  /** 认证提供者 */
  authProvider?: string
  /** 失败原因 */
  failureReason?: string
  /** 尝试次数 */
  attemptCount?: number
}

/**
 * 授权事件
 */
export interface AuthorizationEvent extends BaseSecurityEvent {
  eventType: SecurityEventType.AUTHORIZATION
  /** 请求的资源 */
  resource: string
  /** 请求的操作 */
  action: string
  /** 权限检查结果 */
  permissions: string[]
  /** 拒绝原因 */
  denialReason?: string
}

/**
 * 数据访问事件
 */
export interface DataAccessEvent extends BaseSecurityEvent {
  eventType: SecurityEventType.DATA_ACCESS
  /** 数据类型 */
  dataType: string
  /** 数据ID */
  dataId?: string
  /** 访问操作 */
  operation: DataOperation
  /** 访问的字段 */
  fields?: string[]
  /** 数据敏感级别 */
  sensitivityLevel: DataSensitivityLevel
}

/**
 * 配置变更事件
 */
export interface ConfigurationChangeEvent extends BaseSecurityEvent {
  eventType: SecurityEventType.CONFIGURATION_CHANGE
  /** 配置键 */
  configKey: string
  /** 旧值（脱敏后） */
  oldValue?: string
  /** 新值（脱敏后） */
  newValue?: string
  /** 变更类型 */
  changeType: ConfigurationChangeType
}

/**
 * 权限变更事件
 */
export interface PermissionChangeEvent extends BaseSecurityEvent {
  eventType: SecurityEventType.PERMISSION_CHANGE
  /** 目标用户ID */
  targetUserId?: string
  /** 目标角色 */
  targetRole?: string
  /** 权限变更类型 */
  changeType: PermissionChangeType
  /** 变更的权限 */
  permissions: string[]
  /** 变更前的权限 */
  previousPermissions?: string[]
}

/**
 * 通用安全事件
 */
export interface SecurityEvent extends BaseSecurityEvent {
  eventType: SecurityEventType.SECURITY_INCIDENT
  /** 事件描述 */
  description: string
  /** 威胁类型 */
  threatType?: string
  /** 检测规则 */
  detectionRule?: string
  /** 影响评估 */
  impact?: SecurityImpact
}

/**
 * 安全事件类型
 */
export enum SecurityEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  CONFIGURATION_CHANGE = 'configuration_change',
  PERMISSION_CHANGE = 'permission_change',
  SECURITY_INCIDENT = 'security_incident',
  SESSION_MANAGEMENT = 'session_management',
  API_ACCESS = 'api_access',
  ADMIN_ACTION = 'admin_action'
}

/**
 * 安全事件严重级别
 */
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 安全事件结果
 */
export enum SecurityEventResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  BLOCKED = 'blocked',
  SUSPICIOUS = 'suspicious'
}

/**
 * 数据操作类型
 */
export enum DataOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import'
}

/**
 * 数据敏感级别
 */
export enum DataSensitivityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

/**
 * 配置变更类型
 */
export enum ConfigurationChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESET = 'reset'
}

/**
 * 权限变更类型
 */
export enum PermissionChangeType {
  GRANT = 'grant',
  REVOKE = 'revoke',
  MODIFY = 'modify',
  INHERIT = 'inherit'
}

/**
 * 安全影响评估
 */
export interface SecurityImpact {
  /** 影响范围 */
  scope: SecurityImpactScope
  /** 影响级别 */
  level: SecurityImpactLevel
  /** 受影响的用户数 */
  affectedUsers?: number
  /** 受影响的数据量 */
  affectedDataVolume?: number
  /** 潜在损失评估 */
  potentialLoss?: string
}

/**
 * 安全影响范围
 */
export enum SecurityImpactScope {
  USER = 'user',
  TENANT = 'tenant',
  SYSTEM = 'system',
  GLOBAL = 'global'
}

/**
 * 安全影响级别
 */
export enum SecurityImpactLevel {
  MINIMAL = 'minimal',
  MODERATE = 'moderate',
  SIGNIFICANT = 'significant',
  SEVERE = 'severe'
}
```

#### 日志管理器实现
```typescript
/**
 * LinchKit 日志管理器
 * @description 统一的日志管理实现
 */
export class LogManager implements Logger {
  private transports: LogTransport[] = []
  private level: LogLevel = LogLevel.INFO
  private context: LogContext = {}

  constructor(config: LogManagerConfig = {}) {
    this.level = config.level ?? LogLevel.INFO
    this.context = config.context ?? {}

    // 添加默认传输器
    if (config.transports) {
      config.transports.forEach(transport => this.addTransport(transport))
    } else {
      this.addTransport(new ConsoleTransport())
    }
  }

  debug(message: string, meta?: LogMeta): void {
    this.log(LogLevel.DEBUG, message, meta)
  }

  info(message: string, meta?: LogMeta): void {
    this.log(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: LogMeta): void {
    this.log(LogLevel.WARN, message, meta)
  }

  error(message: string, meta?: LogMeta): void {
    this.log(LogLevel.ERROR, message, meta)
  }

  fatal(message: string, meta?: LogMeta): void {
    this.log(LogLevel.FATAL, message, meta)
  }

  log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (level < this.level) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      meta: this.mergeMeta(meta),
      logger: this.context.name
    }

    // 异步写入所有传输器
    this.writeToTransports(entry)
  }

  performance(operation: string, duration: number, meta?: LogMeta): void {
    this.info(`Performance: ${operation}`, {
      ...meta,
      operation,
      duration,
      tags: ['performance', ...(meta?.tags || [])]
    })
  }

  audit(action: string, resource: string, meta?: LogMeta): void {
    this.info(`Audit: ${action} on ${resource}`, {
      ...meta,
      operation: action,
      data: { resource, ...meta?.data },
      tags: ['audit', ...(meta?.tags || [])]
    })
  }

  child(context: LogContext): Logger {
    return new LogManager({
      level: this.level,
      context: {
        ...this.context,
        ...context,
        defaultMeta: {
          ...this.context.defaultMeta,
          ...context.defaultMeta
        }
      },
      transports: this.transports
    })
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  private mergeMeta(meta?: LogMeta): LogMeta {
    return {
      ...this.context.defaultMeta,
      ...meta
    }
  }

  private async writeToTransports(entry: LogEntry): Promise<void> {
    const promises = this.transports
      .filter(transport => entry.level >= transport.level)
      .map(transport => transport.write(entry).catch(error => {
        console.error(`Transport ${transport.name} failed:`, error)
      }))

    await Promise.allSettled(promises)
  }
}

export interface LogManagerConfig {
  level?: LogLevel
  context?: LogContext
  transports?: LogTransport[]
  /** 数据脱敏配置 */
  dataMasking?: DataMaskingConfig
}

/**
 * 数据脱敏系统
 */
export interface DataMaskingService {
  /** 脱敏字符串数据 */
  maskString(value: string, type: SensitiveDataType): string
  /** 脱敏对象数据 */
  maskObject(obj: any, rules?: MaskingRule[]): any
  /** 脱敏日志条目 */
  maskLogEntry(entry: LogEntry): LogEntry
  /** 脱敏错误信息 */
  maskError(error: Error): Error
  /** 检测敏感数据 */
  detectSensitiveData(text: string): SensitiveDataDetection[]
}

/**
 * 数据脱敏配置
 */
export interface DataMaskingConfig {
  /** 是否启用脱敏 */
  enabled: boolean
  /** 默认脱敏规则 */
  defaultRules: MaskingRule[]
  /** 自定义脱敏规则 */
  customRules?: MaskingRule[]
  /** 脱敏字符 */
  maskChar: string
  /** 保留字符数 */
  preserveLength: boolean
  /** 部分显示配置 */
  partialDisplay?: PartialDisplayConfig
}

/**
 * 脱敏规则
 */
export interface MaskingRule {
  /** 规则名称 */
  name: string
  /** 数据类型 */
  dataType: SensitiveDataType
  /** 匹配模式 */
  pattern: RegExp | string
  /** 脱敏策略 */
  strategy: MaskingStrategy
  /** 字段路径（用于对象脱敏） */
  fieldPaths?: string[]
  /** 优先级 */
  priority: number
  /** 是否启用 */
  enabled: boolean
}

/**
 * 敏感数据类型
 */
export enum SensitiveDataType {
  PASSWORD = 'password',
  EMAIL = 'email',
  PHONE = 'phone',
  ID_CARD = 'id_card',
  CREDIT_CARD = 'credit_card',
  BANK_ACCOUNT = 'bank_account',
  API_KEY = 'api_key',
  TOKEN = 'token',
  IP_ADDRESS = 'ip_address',
  URL = 'url',
  PERSONAL_NAME = 'personal_name',
  ADDRESS = 'address',
  CUSTOM = 'custom'
}

/**
 * 脱敏策略
 */
export enum MaskingStrategy {
  /** 完全遮蔽 */
  FULL_MASK = 'full_mask',
  /** 部分遮蔽 */
  PARTIAL_MASK = 'partial_mask',
  /** 哈希替换 */
  HASH_REPLACE = 'hash_replace',
  /** 格式保持 */
  FORMAT_PRESERVE = 'format_preserve',
  /** 完全移除 */
  REMOVE = 'remove',
  /** 替换为占位符 */
  PLACEHOLDER = 'placeholder'
}

/**
 * 部分显示配置
 */
export interface PartialDisplayConfig {
  /** 前缀保留字符数 */
  prefixLength: number
  /** 后缀保留字符数 */
  suffixLength: number
  /** 中间脱敏字符数 */
  middleMaskLength?: number
}

/**
 * 敏感数据检测结果
 */
export interface SensitiveDataDetection {
  /** 数据类型 */
  type: SensitiveDataType
  /** 匹配的文本 */
  match: string
  /** 开始位置 */
  startIndex: number
  /** 结束位置 */
  endIndex: number
  /** 置信度 */
  confidence: number
  /** 建议的脱敏策略 */
  suggestedStrategy: MaskingStrategy
}

/**
 * 数据脱敏服务实现
 */
export class DefaultDataMaskingService implements DataMaskingService {
  private config: DataMaskingConfig
  private rules: MaskingRule[]

  constructor(config: DataMaskingConfig) {
    this.config = config
    this.rules = [...config.defaultRules, ...(config.customRules || [])]
      .sort((a, b) => b.priority - a.priority)
  }

  maskString(value: string, type: SensitiveDataType): string {
    if (!this.config.enabled || !value) {
      return value
    }

    const rule = this.rules.find(r => r.dataType === type && r.enabled)
    if (!rule) {
      return this.applyDefaultMasking(value)
    }

    return this.applyMaskingStrategy(value, rule.strategy)
  }

  maskObject(obj: any, rules?: MaskingRule[]): any {
    if (!this.config.enabled || !obj) {
      return obj
    }

    const activeRules = rules || this.rules
    const masked = JSON.parse(JSON.stringify(obj))

    for (const rule of activeRules) {
      if (!rule.enabled || !rule.fieldPaths) continue

      for (const fieldPath of rule.fieldPaths) {
        this.maskFieldByPath(masked, fieldPath, rule)
      }
    }

    return masked
  }

  maskLogEntry(entry: LogEntry): LogEntry {
    if (!this.config.enabled) {
      return entry
    }

    const maskedEntry = { ...entry }

    // 脱敏消息
    maskedEntry.message = this.maskStringContent(entry.message)

    // 脱敏元数据
    if (entry.meta) {
      maskedEntry.meta = this.maskObject(entry.meta)
    }

    return maskedEntry
  }

  maskError(error: Error): Error {
    if (!this.config.enabled) {
      return error
    }

    const maskedError = new Error(this.maskStringContent(error.message))
    maskedError.name = error.name
    maskedError.stack = error.stack ? this.maskStringContent(error.stack) : undefined

    return maskedError
  }

  detectSensitiveData(text: string): SensitiveDataDetection[] {
    const detections: SensitiveDataDetection[] = []

    for (const rule of this.rules) {
      if (!rule.enabled) continue

      const pattern = typeof rule.pattern === 'string'
        ? new RegExp(rule.pattern, 'gi')
        : rule.pattern

      let match
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          type: rule.dataType,
          match: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: this.calculateConfidence(match[0], rule.dataType),
          suggestedStrategy: rule.strategy
        })
      }
    }

    return detections
  }

  private applyDefaultMasking(value: string): string {
    const { maskChar, preserveLength } = this.config
    return preserveLength
      ? maskChar.repeat(value.length)
      : maskChar.repeat(8)
  }

  private applyMaskingStrategy(value: string, strategy: MaskingStrategy): string {
    switch (strategy) {
      case MaskingStrategy.FULL_MASK:
        return this.applyDefaultMasking(value)

      case MaskingStrategy.PARTIAL_MASK:
        return this.applyPartialMasking(value)

      case MaskingStrategy.HASH_REPLACE:
        return this.hashValue(value)

      case MaskingStrategy.FORMAT_PRESERVE:
        return this.preserveFormat(value)

      case MaskingStrategy.REMOVE:
        return ''

      case MaskingStrategy.PLACEHOLDER:
        return '[REDACTED]'

      default:
        return this.applyDefaultMasking(value)
    }
  }

  private applyPartialMasking(value: string): string {
    const { partialDisplay, maskChar } = this.config
    if (!partialDisplay || value.length <= partialDisplay.prefixLength + partialDisplay.suffixLength) {
      return this.applyDefaultMasking(value)
    }

    const prefix = value.substring(0, partialDisplay.prefixLength)
    const suffix = value.substring(value.length - partialDisplay.suffixLength)
    const middleLength = partialDisplay.middleMaskLength ||
      (value.length - partialDisplay.prefixLength - partialDisplay.suffixLength)

    return prefix + maskChar.repeat(middleLength) + suffix
  }

  private hashValue(value: string): string {
    // 简单哈希实现，实际应用中应使用更安全的哈希算法
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return `[HASH:${Math.abs(hash).toString(16)}]`
  }

  private preserveFormat(value: string): string {
    return value.replace(/[a-zA-Z0-9]/g, this.config.maskChar)
  }

  private maskFieldByPath(obj: any, path: string, rule: MaskingRule): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) return
      current = current[keys[i]]
    }

    const finalKey = keys[keys.length - 1]
    if (current[finalKey] !== undefined) {
      current[finalKey] = this.applyMaskingStrategy(
        String(current[finalKey]),
        rule.strategy
      )
    }
  }

  private maskStringContent(text: string): string {
    let maskedText = text
    const detections = this.detectSensitiveData(text)

    // 从后往前替换，避免索引偏移
    detections
      .sort((a, b) => b.startIndex - a.startIndex)
      .forEach(detection => {
        const masked = this.applyMaskingStrategy(detection.match, detection.suggestedStrategy)
        maskedText = maskedText.substring(0, detection.startIndex) +
                   masked +
                   maskedText.substring(detection.endIndex)
      })

    return maskedText
  }

  private calculateConfidence(match: string, type: SensitiveDataType): number {
    // 简单的置信度计算，实际应用中可以更复杂
    const baseConfidence = 0.7
    const lengthBonus = Math.min(match.length / 10, 0.3)
    return Math.min(baseConfidence + lengthBonus, 1.0)
  }
}

/**
 * 安全配置验证系统
 */
export interface SecurityConfigValidator {
  /** 验证配置安全性 */
  validateConfig(config: any): SecurityValidationResult
  /** 验证密码策略 */
  validatePasswordPolicy(policy: PasswordPolicy): ValidationResult
  /** 验证加密配置 */
  validateEncryptionConfig(config: EncryptionConfig): ValidationResult
  /** 验证会话配置 */
  validateSessionConfig(config: SessionConfig): ValidationResult
  /** 验证CORS配置 */
  validateCorsConfig(config: CorsConfig): ValidationResult
  /** 验证API安全配置 */
  validateApiSecurityConfig(config: ApiSecurityConfig): ValidationResult
}

/**
 * 安全验证结果
 */
export interface SecurityValidationResult {
  /** 是否通过验证 */
  isValid: boolean
  /** 安全等级 */
  securityLevel: SecurityLevel
  /** 验证结果详情 */
  results: ValidationResult[]
  /** 安全建议 */
  recommendations: SecurityRecommendation[]
  /** 风险评估 */
  riskAssessment: RiskAssessment
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 验证项名称 */
  name: string
  /** 验证类型 */
  type: ValidationType
  /** 是否通过 */
  passed: boolean
  /** 严重级别 */
  severity: ValidationSeverity
  /** 错误信息 */
  message?: string
  /** 建议修复方案 */
  suggestion?: string
  /** 相关文档 */
  documentation?: string
}

/**
 * 安全建议
 */
export interface SecurityRecommendation {
  /** 建议类型 */
  type: RecommendationType
  /** 优先级 */
  priority: RecommendationPriority
  /** 建议内容 */
  description: string
  /** 实施步骤 */
  implementation: string[]
  /** 预期效果 */
  expectedBenefit: string
}

/**
 * 风险评估
 */
export interface RiskAssessment {
  /** 总体风险等级 */
  overallRisk: RiskLevel
  /** 风险分类 */
  riskCategories: RiskCategory[]
  /** 风险因子 */
  riskFactors: RiskFactor[]
  /** 缓解措施 */
  mitigationStrategies: string[]
}

/**
 * 密码策略配置
 */
export interface PasswordPolicy {
  /** 最小长度 */
  minLength: number
  /** 最大长度 */
  maxLength?: number
  /** 需要大写字母 */
  requireUppercase: boolean
  /** 需要小写字母 */
  requireLowercase: boolean
  /** 需要数字 */
  requireNumbers: boolean
  /** 需要特殊字符 */
  requireSpecialChars: boolean
  /** 禁止常见密码 */
  forbidCommonPasswords: boolean
  /** 密码历史检查 */
  passwordHistory?: number
  /** 密码过期时间（天） */
  expirationDays?: number
  /** 最大失败尝试次数 */
  maxFailedAttempts: number
  /** 锁定时间（分钟） */
  lockoutDuration: number
}

/**
 * 加密配置
 */
export interface EncryptionConfig {
  /** 加密算法 */
  algorithm: string
  /** 密钥长度 */
  keyLength: number
  /** 密钥轮换周期（天） */
  keyRotationDays: number
  /** 是否启用传输加密 */
  encryptInTransit: boolean
  /** 是否启用静态加密 */
  encryptAtRest: boolean
  /** 哈希算法 */
  hashAlgorithm: string
  /** 盐值长度 */
  saltLength: number
  /** 迭代次数 */
  iterations: number
}

/**
 * 会话配置
 */
export interface SessionConfig {
  /** 会话超时时间（分钟） */
  timeoutMinutes: number
  /** 是否启用安全Cookie */
  secureCookies: boolean
  /** 是否启用HttpOnly */
  httpOnly: boolean
  /** SameSite策略 */
  sameSite: 'strict' | 'lax' | 'none'
  /** 会话存储类型 */
  storage: 'memory' | 'redis' | 'database'
  /** 最大并发会话数 */
  maxConcurrentSessions?: number
  /** 是否启用会话固定保护 */
  sessionFixationProtection: boolean
}

/**
 * CORS配置
 */
export interface CorsConfig {
  /** 允许的源 */
  allowedOrigins: string[]
  /** 允许的方法 */
  allowedMethods: string[]
  /** 允许的头部 */
  allowedHeaders: string[]
  /** 是否允许凭证 */
  allowCredentials: boolean
  /** 预检请求缓存时间 */
  maxAge: number
  /** 暴露的头部 */
  exposedHeaders?: string[]
}

/**
 * API安全配置
 */
export interface ApiSecurityConfig {
  /** 是否启用API密钥认证 */
  apiKeyAuth: boolean
  /** 是否启用JWT认证 */
  jwtAuth: boolean
  /** 是否启用OAuth2 */
  oauth2: boolean
  /** 速率限制配置 */
  rateLimit: RateLimitConfig
  /** 是否启用请求签名 */
  requestSigning: boolean
  /** 是否启用IP白名单 */
  ipWhitelist: boolean
  /** 允许的IP地址 */
  allowedIPs?: string[]
}

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /** 是否启用 */
  enabled: boolean
  /** 时间窗口（秒） */
  windowSeconds: number
  /** 最大请求数 */
  maxRequests: number
  /** 限制策略 */
  strategy: 'fixed' | 'sliding' | 'token_bucket'
  /** 是否按用户限制 */
  perUser: boolean
  /** 是否按IP限制 */
  perIP: boolean
}

/**
 * 安全等级
 */
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 验证类型
 */
export enum ValidationType {
  PASSWORD_POLICY = 'password_policy',
  ENCRYPTION = 'encryption',
  SESSION = 'session',
  CORS = 'cors',
  API_SECURITY = 'api_security',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization'
}

/**
 * 验证严重级别
 */
export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 建议类型
 */
export enum RecommendationType {
  SECURITY_ENHANCEMENT = 'security_enhancement',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  COMPLIANCE = 'compliance',
  BEST_PRACTICE = 'best_practice'
}

/**
 * 建议优先级
 */
export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 风险等级
 */
export enum RiskLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 风险分类
 */
export interface RiskCategory {
  /** 分类名称 */
  name: string
  /** 风险等级 */
  level: RiskLevel
  /** 描述 */
  description: string
  /** 影响范围 */
  impact: string[]
}

/**
 * 风险因子
 */
export interface RiskFactor {
  /** 因子名称 */
  name: string
  /** 权重 */
  weight: number
  /** 当前值 */
  currentValue: number
  /** 阈值 */
  threshold: number
  /** 是否超过阈值 */
  exceeded: boolean
}

/**
 * 安全事件监控系统
 */
export interface SecurityMonitor {
  /** 启动监控 */
  start(): Promise<void>
  /** 停止监控 */
  stop(): Promise<void>
  /** 添加监控规则 */
  addRule(rule: MonitoringRule): void
  /** 移除监控规则 */
  removeRule(ruleId: string): void
  /** 处理安全事件 */
  processEvent(event: BaseSecurityEvent): Promise<void>
  /** 获取监控状态 */
  getStatus(): MonitoringStatus
  /** 获取事件统计 */
  getEventStats(timeRange: TimeRange): EventStatistics
}

/**
 * 监控规则
 */
export interface MonitoringRule {
  /** 规则ID */
  id: string
  /** 规则名称 */
  name: string
  /** 规则描述 */
  description: string
  /** 事件类型过滤 */
  eventTypes: SecurityEventType[]
  /** 条件表达式 */
  conditions: MonitoringCondition[]
  /** 时间窗口（秒） */
  timeWindow: number
  /** 触发阈值 */
  threshold: number
  /** 严重级别 */
  severity: SecurityEventSeverity
  /** 是否启用 */
  enabled: boolean
  /** 告警配置 */
  alertConfig: AlertConfig
  /** 响应动作 */
  actions: SecurityAction[]
}

/**
 * 监控条件
 */
export interface MonitoringCondition {
  /** 字段名 */
  field: string
  /** 操作符 */
  operator: ConditionOperator
  /** 期望值 */
  value: any
  /** 逻辑连接符 */
  logic?: LogicOperator
}

/**
 * 告警配置
 */
export interface AlertConfig {
  /** 告警类型 */
  type: AlertType
  /** 告警渠道 */
  channels: AlertChannel[]
  /** 告警模板 */
  template?: string
  /** 静默时间（分钟） */
  silenceDuration?: number
  /** 升级规则 */
  escalationRules?: EscalationRule[]
}

/**
 * 告警渠道
 */
export interface AlertChannel {
  /** 渠道类型 */
  type: AlertChannelType
  /** 渠道配置 */
  config: AlertChannelConfig
  /** 是否启用 */
  enabled: boolean
}

/**
 * 安全响应动作
 */
export interface SecurityAction {
  /** 动作类型 */
  type: SecurityActionType
  /** 动作参数 */
  parameters: Record<string, any>
  /** 执行条件 */
  condition?: string
  /** 是否自动执行 */
  autoExecute: boolean
}

/**
 * 监控状态
 */
export interface MonitoringStatus {
  /** 是否运行中 */
  isRunning: boolean
  /** 启动时间 */
  startTime?: Date
  /** 活跃规则数 */
  activeRules: number
  /** 处理的事件数 */
  processedEvents: number
  /** 触发的告警数 */
  triggeredAlerts: number
  /** 最后处理时间 */
  lastProcessTime?: Date
}

/**
 * 事件统计
 */
export interface EventStatistics {
  /** 时间范围 */
  timeRange: TimeRange
  /** 总事件数 */
  totalEvents: number
  /** 按类型分组的事件数 */
  eventsByType: Record<SecurityEventType, number>
  /** 按严重级别分组的事件数 */
  eventsBySeverity: Record<SecurityEventSeverity, number>
  /** 按结果分组的事件数 */
  eventsByResult: Record<SecurityEventResult, number>
  /** 趋势数据 */
  trends: TrendData[]
}

/**
 * 时间范围
 */
export interface TimeRange {
  /** 开始时间 */
  start: Date
  /** 结束时间 */
  end: Date
}

/**
 * 趋势数据
 */
export interface TrendData {
  /** 时间点 */
  timestamp: Date
  /** 事件数量 */
  count: number
  /** 事件类型 */
  eventType?: SecurityEventType
}

/**
 * 升级规则
 */
export interface EscalationRule {
  /** 升级条件 */
  condition: string
  /** 升级延迟（分钟） */
  delay: number
  /** 升级目标 */
  target: string[]
  /** 升级消息 */
  message?: string
}

/**
 * 条件操作符
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX_MATCH = 'regex_match',
  IN = 'in',
  NOT_IN = 'not_in'
}

/**
 * 逻辑操作符
 */
export enum LogicOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

/**
 * 告警类型
 */
export enum AlertType {
  IMMEDIATE = 'immediate',
  BATCH = 'batch',
  DIGEST = 'digest',
  THRESHOLD = 'threshold'
}

/**
 * 告警渠道类型
 */
export enum AlertChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  TEAMS = 'teams',
  PAGERDUTY = 'pagerduty',
  CONSOLE = 'console'
}

/**
 * 告警渠道配置
 */
export interface AlertChannelConfig {
  /** 目标地址 */
  target: string
  /** 认证信息 */
  credentials?: Record<string, string>
  /** 额外配置 */
  options?: Record<string, any>
}

/**
 * 安全动作类型
 */
export enum SecurityActionType {
  BLOCK_USER = 'block_user',
  BLOCK_IP = 'block_ip',
  REVOKE_SESSION = 'revoke_session',
  REQUIRE_MFA = 'require_mfa',
  LOG_EVENT = 'log_event',
  SEND_ALERT = 'send_alert',
  QUARANTINE_DATA = 'quarantine_data',
  BACKUP_DATA = 'backup_data',
  NOTIFY_ADMIN = 'notify_admin',
  CUSTOM = 'custom'
}

---

## 📊 可观测性系统

### 指标收集和上报系统

#### 指标收集器接口
```typescript
/**
 * LinchKit 指标收集系统
 * @description 基于 Prometheus 客户端的统一指标收集抽象层
 * @recommendation 使用 prom-client 库作为底层实现，避免重复造轮子
 */
export interface MetricsCollector {
  /** 记录计数器指标 */
  counter(name: string, value?: number, tags?: MetricTags): void
  /** 记录计量器指标 */
  gauge(name: string, value: number, tags?: MetricTags): void
  /** 记录直方图指标 */
  histogram(name: string, value: number, tags?: MetricTags): void
  /** 记录计时器指标 */
  timer(name: string, value: number, tags?: MetricTags): void
  /** 记录分布指标 */
  distribution(name: string, value: number, tags?: MetricTags): void
  /** 创建计时器 */
  createTimer(name: string, tags?: MetricTags): MetricTimer
  /** 增加计数器 */
  increment(name: string, tags?: MetricTags): void
  /** 减少计数器 */
  decrement(name: string, tags?: MetricTags): void
  /** 设置标签 */
  setTags(tags: MetricTags): MetricsCollector
  /** 获取指标快照 */
  getSnapshot(): MetricsSnapshot
  /** 重置指标 */
  reset(): void
  /** 获取 Prometheus 格式指标 */
  getPrometheusMetrics(): Promise<string>
}

/**
 * 推荐的实现方案
 * @description 使用成熟的开源库，避免重复造轮子
 */
export interface RecommendedImplementation {
  /** 指标收集 - 使用 prom-client */
  metricsLibrary: 'prom-client'
  /** 分布式追踪 - 使用 @opentelemetry/sdk-node */
  tracingLibrary: '@opentelemetry/sdk-node'
  /** 健康检查 - 使用 @godaddy/terminus */
  healthCheckLibrary: '@godaddy/terminus'
  /** 告警系统 - 集成 Prometheus Alertmanager */
  alertingSystem: 'prometheus-alertmanager'
  /** 基准测试 - 使用 benchmark.js 或 tinybench */
  benchmarkLibrary: 'tinybench'
  /** 日志管理 - 使用 winston 或 pino */
  loggingLibrary: 'pino'
}

/**
 * 指标标签
 */
export interface MetricTags {
  [key: string]: string | number | boolean
}

/**
 * 指标计时器
 */
export interface MetricTimer {
  /** 开始计时 */
  start(): void
  /** 结束计时并记录 */
  end(): number
  /** 获取经过时间 */
  elapsed(): number
}

/**
 * 指标快照
 */
export interface MetricsSnapshot {
  /** 快照时间 */
  timestamp: Date
  /** 计数器指标 */
  counters: Record<string, CounterMetric>
  /** 计量器指标 */
  gauges: Record<string, GaugeMetric>
  /** 直方图指标 */
  histograms: Record<string, HistogramMetric>
  /** 计时器指标 */
  timers: Record<string, TimerMetric>
  /** 分布指标 */
  distributions: Record<string, DistributionMetric>
}

/**
 * 计数器指标
 */
export interface CounterMetric {
  /** 指标名称 */
  name: string
  /** 当前值 */
  value: number
  /** 标签 */
  tags: MetricTags
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 计量器指标
 */
export interface GaugeMetric {
  /** 指标名称 */
  name: string
  /** 当前值 */
  value: number
  /** 标签 */
  tags: MetricTags
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 直方图指标
 */
export interface HistogramMetric {
  /** 指标名称 */
  name: string
  /** 样本数量 */
  count: number
  /** 总和 */
  sum: number
  /** 最小值 */
  min: number
  /** 最大值 */
  max: number
  /** 平均值 */
  mean: number
  /** 分位数 */
  percentiles: Record<string, number>
  /** 标签 */
  tags: MetricTags
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 计时器指标
 */
export interface TimerMetric extends HistogramMetric {
  /** 速率（每秒） */
  rate: number
  /** 1分钟速率 */
  rate1m: number
  /** 5分钟速率 */
  rate5m: number
  /** 15分钟速率 */
  rate15m: number
}

/**
 * 分布指标
 */
export interface DistributionMetric {
  /** 指标名称 */
  name: string
  /** 样本数量 */
  count: number
  /** 总和 */
  sum: number
  /** 桶分布 */
  buckets: Record<string, number>
  /** 标签 */
  tags: MetricTags
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 指标上报器
 */
export interface MetricsReporter {
  /** 上报指标 */
  report(snapshot: MetricsSnapshot): Promise<void>
  /** 启动定期上报 */
  start(interval: number): void
  /** 停止上报 */
  stop(): void
  /** 获取上报状态 */
  getStatus(): ReporterStatus
}

/**
 * 上报器状态
 */
export interface ReporterStatus {
  /** 是否运行中 */
  isRunning: boolean
  /** 上报间隔 */
  interval: number
  /** 最后上报时间 */
  lastReportTime?: Date
  /** 上报次数 */
  reportCount: number
  /** 失败次数 */
  failureCount: number
  /** 最后错误 */
  lastError?: string
}

/**
 * 系统指标收集器
 */
export interface SystemMetricsCollector {
  /** 收集CPU指标 */
  collectCpuMetrics(): Promise<CpuMetrics>
  /** 收集内存指标 */
  collectMemoryMetrics(): Promise<MemoryMetrics>
  /** 收集磁盘指标 */
  collectDiskMetrics(): Promise<DiskMetrics>
  /** 收集网络指标 */
  collectNetworkMetrics(): Promise<NetworkMetrics>
  /** 收集进程指标 */
  collectProcessMetrics(): Promise<ProcessMetrics>
  /** 收集所有系统指标 */
  collectAllMetrics(): Promise<SystemMetrics>
}

/**
 * CPU指标
 */
export interface CpuMetrics {
  /** CPU使用率（百分比） */
  usage: number
  /** 用户态CPU时间 */
  userTime: number
  /** 系统态CPU时间 */
  systemTime: number
  /** 空闲时间 */
  idleTime: number
  /** 负载平均值 */
  loadAverage: {
    '1m': number
    '5m': number
    '15m': number
  }
}

/**
 * 内存指标
 */
export interface MemoryMetrics {
  /** 总内存（字节） */
  total: number
  /** 已使用内存（字节） */
  used: number
  /** 可用内存（字节） */
  available: number
  /** 内存使用率（百分比） */
  usage: number
  /** 堆内存使用 */
  heap: {
    used: number
    total: number
    limit: number
  }
}

/**
 * 磁盘指标
 */
export interface DiskMetrics {
  /** 总空间（字节） */
  total: number
  /** 已使用空间（字节） */
  used: number
  /** 可用空间（字节） */
  available: number
  /** 使用率（百分比） */
  usage: number
  /** 读取速率（字节/秒） */
  readRate: number
  /** 写入速率（字节/秒） */
  writeRate: number
}

/**
 * 网络指标
 */
export interface NetworkMetrics {
  /** 接收字节数 */
  bytesReceived: number
  /** 发送字节数 */
  bytesSent: number
  /** 接收包数 */
  packetsReceived: number
  /** 发送包数 */
  packetsSent: number
  /** 接收速率（字节/秒） */
  receiveRate: number
  /** 发送速率（字节/秒） */
  sendRate: number
  /** 连接数 */
  connections: number
}

/**
 * 进程指标
 */
export interface ProcessMetrics {
  /** 进程ID */
  pid: number
  /** CPU使用率 */
  cpuUsage: number
  /** 内存使用量 */
  memoryUsage: number
  /** 文件描述符数量 */
  fileDescriptors: number
  /** 线程数 */
  threads: number
  /** 运行时间（秒） */
  uptime: number
}

/**
 * 系统指标汇总
 */
export interface SystemMetrics {
  /** 收集时间 */
  timestamp: Date
  /** CPU指标 */
  cpu: CpuMetrics
  /** 内存指标 */
  memory: MemoryMetrics
  /** 磁盘指标 */
  disk: DiskMetrics
  /** 网络指标 */
  network: NetworkMetrics
  /** 进程指标 */
  process: ProcessMetrics
}

### 分布式追踪系统

#### 追踪接口定义
```typescript
/**
 * LinchKit 分布式追踪系统
 * @description 基于 OpenTelemetry SDK 的分布式追踪抽象层
 * @recommendation 直接使用 @opentelemetry/sdk-node 和相关包，避免重复实现
 * @implementation
 * - 核心: @opentelemetry/sdk-node
 * - 导出器: @opentelemetry/exporter-jaeger, @opentelemetry/exporter-zipkin
 * - 自动仪表化: @opentelemetry/auto-instrumentations-node
 */
export interface TracingService {
  /** 创建新的追踪 */
  createTrace(name: string, options?: TraceOptions): Trace
  /** 获取当前活跃的追踪 */
  getActiveTrace(): Trace | null
  /** 设置当前追踪 */
  setActiveTrace(trace: Trace): void
  /** 创建子Span */
  createSpan(name: string, options?: SpanOptions): Span
  /** 结束追踪 */
  endTrace(trace: Trace): void
  /** 获取追踪器 */
  getTracer(name: string, version?: string): Tracer
  /** 配置追踪 */
  configure(config: TracingConfig): void
  /** 获取原生 OpenTelemetry 追踪器 */
  getNativeTracer(): import('@opentelemetry/api').Tracer
}

/**
 * 追踪对象
 */
export interface Trace {
  /** 追踪ID */
  traceId: string
  /** 根Span */
  rootSpan: Span
  /** 所有Span */
  spans: Span[]
  /** 追踪状态 */
  status: TraceStatus
  /** 开始时间 */
  startTime: Date
  /** 结束时间 */
  endTime?: Date
  /** 持续时间（毫秒） */
  duration?: number
  /** 追踪属性 */
  attributes: Record<string, any>
  /** 添加Span */
  addSpan(span: Span): void
  /** 结束追踪 */
  end(): void
}

/**
 * Span对象
 */
export interface Span {
  /** Span ID */
  spanId: string
  /** 追踪ID */
  traceId: string
  /** 父Span ID */
  parentSpanId?: string
  /** Span名称 */
  name: string
  /** 操作名称 */
  operationName: string
  /** 开始时间 */
  startTime: Date
  /** 结束时间 */
  endTime?: Date
  /** 持续时间（毫秒） */
  duration?: number
  /** Span状态 */
  status: SpanStatus
  /** Span类型 */
  kind: SpanKind
  /** 属性 */
  attributes: Record<string, any>
  /** 事件 */
  events: SpanEvent[]
  /** 链接 */
  links: SpanLink[]
  /** 设置属性 */
  setAttribute(key: string, value: any): void
  /** 设置多个属性 */
  setAttributes(attributes: Record<string, any>): void
  /** 添加事件 */
  addEvent(name: string, attributes?: Record<string, any>): void
  /** 设置状态 */
  setStatus(status: SpanStatus): void
  /** 记录异常 */
  recordException(exception: Error): void
  /** 结束Span */
  end(): void
}

/**
 * 追踪器
 */
export interface Tracer {
  /** 追踪器名称 */
  name: string
  /** 版本 */
  version?: string
  /** 开始Span */
  startSpan(name: string, options?: SpanOptions): Span
  /** 在Span上下文中执行 */
  withSpan<T>(span: Span, fn: () => T): T
  /** 在Span上下文中执行异步操作 */
  withSpanAsync<T>(span: Span, fn: () => Promise<T>): Promise<T>
}

/**
 * 追踪配置
 */
export interface TracingConfig {
  /** 是否启用追踪 */
  enabled: boolean
  /** 采样率 */
  samplingRate: number
  /** 导出器配置 */
  exporters: TracingExporter[]
  /** 资源属性 */
  resource: ResourceAttributes
  /** 批处理配置 */
  batchConfig?: BatchConfig
  /** 过滤器 */
  filters?: TracingFilter[]
}

/**
 * 追踪导出器
 */
export interface TracingExporter {
  /** 导出器类型 */
  type: ExporterType
  /** 导出器配置 */
  config: ExporterConfig
  /** 是否启用 */
  enabled: boolean
}

/**
 * 资源属性
 */
export interface ResourceAttributes {
  /** 服务名称 */
  serviceName: string
  /** 服务版本 */
  serviceVersion?: string
  /** 服务实例ID */
  serviceInstanceId?: string
  /** 部署环境 */
  deploymentEnvironment?: string
  /** 额外属性 */
  [key: string]: any
}

/**
 * 批处理配置
 */
export interface BatchConfig {
  /** 最大批次大小 */
  maxBatchSize: number
  /** 最大等待时间（毫秒） */
  maxWaitTime: number
  /** 最大队列大小 */
  maxQueueSize: number
}

/**
 * 追踪过滤器
 */
export interface TracingFilter {
  /** 过滤器名称 */
  name: string
  /** 过滤条件 */
  condition: (span: Span) => boolean
  /** 过滤动作 */
  action: FilterAction
}

/**
 * Span事件
 */
export interface SpanEvent {
  /** 事件名称 */
  name: string
  /** 事件时间 */
  timestamp: Date
  /** 事件属性 */
  attributes?: Record<string, any>
}

/**
 * Span链接
 */
export interface SpanLink {
  /** 链接的追踪ID */
  traceId: string
  /** 链接的Span ID */
  spanId: string
  /** 链接属性 */
  attributes?: Record<string, any>
}

/**
 * 追踪选项
 */
export interface TraceOptions {
  /** 追踪属性 */
  attributes?: Record<string, any>
  /** 采样决策 */
  samplingDecision?: SamplingDecision
  /** 父追踪上下文 */
  parentContext?: TraceContext
}

/**
 * Span选项
 */
export interface SpanOptions {
  /** Span类型 */
  kind?: SpanKind
  /** 父Span */
  parent?: Span
  /** Span属性 */
  attributes?: Record<string, any>
  /** 开始时间 */
  startTime?: Date
  /** Span链接 */
  links?: SpanLink[]
}

/**
 * 追踪上下文
 */
export interface TraceContext {
  /** 追踪ID */
  traceId: string
  /** Span ID */
  spanId: string
  /** 追踪标志 */
  traceFlags: number
  /** 追踪状态 */
  traceState?: string
}

/**
 * 追踪状态
 */
export enum TraceStatus {
  UNSET = 'unset',
  OK = 'ok',
  ERROR = 'error'
}

/**
 * Span状态
 */
export enum SpanStatus {
  UNSET = 'unset',
  OK = 'ok',
  ERROR = 'error'
}

/**
 * Span类型
 */
export enum SpanKind {
  INTERNAL = 'internal',
  SERVER = 'server',
  CLIENT = 'client',
  PRODUCER = 'producer',
  CONSUMER = 'consumer'
}

/**
 * 导出器类型
 */
export enum ExporterType {
  CONSOLE = 'console',
  JAEGER = 'jaeger',
  ZIPKIN = 'zipkin',
  OTLP = 'otlp',
  CUSTOM = 'custom'
}

/**
 * 导出器配置
 */
export interface ExporterConfig {
  /** 端点URL */
  endpoint?: string
  /** 认证头 */
  headers?: Record<string, string>
  /** 超时时间 */
  timeout?: number
  /** 额外配置 */
  [key: string]: any
}

/**
 * 采样决策
 */
export enum SamplingDecision {
  NOT_RECORD = 'not_record',
  RECORD = 'record',
  RECORD_AND_SAMPLE = 'record_and_sample'
}

/**
 * 过滤动作
 */
export enum FilterAction {
  INCLUDE = 'include',
  EXCLUDE = 'exclude',
  MODIFY = 'modify'
}

### 健康检查和服务发现系统

#### 健康检查接口
```typescript
/**
 * LinchKit 健康检查系统
 * @description 基于成熟健康检查库的抽象层
 * @recommendation 使用 @godaddy/terminus 或 @nestjs/terminus 作为底层实现
 * @implementation
 * - 核心: @godaddy/terminus (Express/Fastify)
 * - 或者: @nestjs/terminus (NestJS)
 * - 数据库检查: 使用各 ORM 的内置健康检查
 * - Redis检查: 使用 ioredis 的 ping 方法
 */
export interface HealthCheckService {
  /** 注册健康检查 */
  registerCheck(check: HealthCheck): void
  /** 注销健康检查 */
  unregisterCheck(name: string): void
  /** 执行所有健康检查 */
  checkHealth(): Promise<HealthStatus>
  /** 执行特定健康检查 */
  checkSpecific(name: string): Promise<HealthCheckResult>
  /** 获取健康状态 */
  getHealthStatus(): HealthStatus
  /** 启动定期检查 */
  startPeriodicChecks(interval: number): void
  /** 停止定期检查 */
  stopPeriodicChecks(): void
  /** 获取 Terminus 兼容的健康检查 */
  getTerminusHealthChecks(): Record<string, () => Promise<any>>
}

/**
 * 健康检查定义
 */
export interface HealthCheck {
  /** 检查名称 */
  name: string
  /** 检查描述 */
  description?: string
  /** 检查类型 */
  type: HealthCheckType
  /** 检查函数 */
  check: () => Promise<HealthCheckResult>
  /** 检查间隔（毫秒） */
  interval?: number
  /** 超时时间（毫秒） */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 是否关键检查 */
  critical?: boolean
  /** 标签 */
  tags?: string[]
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  /** 检查名称 */
  name: string
  /** 检查状态 */
  status: HealthStatus
  /** 检查时间 */
  timestamp: Date
  /** 响应时间（毫秒） */
  responseTime: number
  /** 状态消息 */
  message?: string
  /** 详细信息 */
  details?: Record<string, any>
  /** 错误信息 */
  error?: string
}

/**
 * 整体健康状态
 */
export interface HealthStatus {
  /** 整体状态 */
  status: HealthState
  /** 检查时间 */
  timestamp: Date
  /** 检查结果 */
  checks: Record<string, HealthCheckResult>
  /** 运行时间（秒） */
  uptime: number
  /** 版本信息 */
  version?: string
  /** 额外信息 */
  info?: Record<string, any>
}

/**
 * 健康状态枚举
 */
export enum HealthState {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

/**
 * 健康检查类型
 */
export enum HealthCheckType {
  DATABASE = 'database',
  CACHE = 'cache',
  EXTERNAL_API = 'external_api',
  FILE_SYSTEM = 'file_system',
  MEMORY = 'memory',
  CPU = 'cpu',
  DISK = 'disk',
  NETWORK = 'network',
  CUSTOM = 'custom'
}

/**
 * 服务发现系统
 */
export interface ServiceDiscovery {
  /** 注册服务 */
  registerService(service: ServiceRegistration): Promise<void>
  /** 注销服务 */
  unregisterService(serviceId: string): Promise<void>
  /** 发现服务 */
  discoverServices(serviceName: string): Promise<ServiceInstance[]>
  /** 获取服务实例 */
  getServiceInstance(serviceId: string): Promise<ServiceInstance | null>
  /** 监听服务变化 */
  watchServices(serviceName: string, callback: ServiceWatchCallback): void
  /** 停止监听 */
  unwatchServices(serviceName: string): void
  /** 更新服务健康状态 */
  updateHealthStatus(serviceId: string, status: HealthState): Promise<void>
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration {
  /** 服务ID */
  id: string
  /** 服务名称 */
  name: string
  /** 服务版本 */
  version: string
  /** 服务地址 */
  address: string
  /** 服务端口 */
  port: number
  /** 服务协议 */
  protocol: string
  /** 服务标签 */
  tags: string[]
  /** 元数据 */
  metadata: Record<string, any>
  /** 健康检查配置 */
  healthCheck?: ServiceHealthCheck
  /** TTL（秒） */
  ttl?: number
}

/**
 * 服务实例
 */
export interface ServiceInstance {
  /** 服务ID */
  id: string
  /** 服务名称 */
  name: string
  /** 服务版本 */
  version: string
  /** 服务地址 */
  address: string
  /** 服务端口 */
  port: number
  /** 服务协议 */
  protocol: string
  /** 服务标签 */
  tags: string[]
  /** 元数据 */
  metadata: Record<string, any>
  /** 健康状态 */
  healthStatus: HealthState
  /** 注册时间 */
  registeredAt: Date
  /** 最后心跳时间 */
  lastHeartbeat: Date
  /** 权重 */
  weight?: number
}

/**
 * 服务健康检查配置
 */
export interface ServiceHealthCheck {
  /** 检查类型 */
  type: 'http' | 'tcp' | 'grpc' | 'script'
  /** 检查URL或地址 */
  url?: string
  /** 检查间隔（秒） */
  interval: number
  /** 超时时间（秒） */
  timeout: number
  /** 健康阈值 */
  healthyThreshold: number
  /** 不健康阈值 */
  unhealthyThreshold: number
  /** HTTP方法 */
  method?: string
  /** HTTP头 */
  headers?: Record<string, string>
  /** 期望状态码 */
  expectedStatus?: number
  /** 期望响应体 */
  expectedBody?: string
}

/**
 * 服务监听回调
 */
export type ServiceWatchCallback = (event: ServiceEvent) => void

/**
 * 服务事件
 */
export interface ServiceEvent {
  /** 事件类型 */
  type: ServiceEventType
  /** 服务实例 */
  service: ServiceInstance
  /** 事件时间 */
  timestamp: Date
}

/**
 * 服务事件类型
 */
export enum ServiceEventType {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
  HEALTH_CHANGED = 'health_changed',
  METADATA_UPDATED = 'metadata_updated'
}

/**
 * 负载均衡器
 */
export interface LoadBalancer {
  /** 选择服务实例 */
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null
  /** 设置负载均衡策略 */
  setStrategy(strategy: LoadBalancingStrategy): void
  /** 记录请求结果 */
  recordResult(instance: ServiceInstance, success: boolean, responseTime: number): void
}

/**
 * 负载均衡策略
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
  WEIGHTED_RANDOM = 'weighted_random',
  LEAST_CONNECTIONS = 'least_connections',
  LEAST_RESPONSE_TIME = 'least_response_time',
  CONSISTENT_HASH = 'consistent_hash'
}

/**
 * 断路器
 */
export interface CircuitBreaker {
  /** 执行请求 */
  execute<T>(fn: () => Promise<T>): Promise<T>
  /** 获取断路器状态 */
  getState(): CircuitBreakerState
  /** 获取统计信息 */
  getStats(): CircuitBreakerStats
  /** 重置断路器 */
  reset(): void
}

/**
 * 断路器状态
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * 断路器统计
 */
export interface CircuitBreakerStats {
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successfulRequests: number
  /** 失败请求数 */
  failedRequests: number
  /** 失败率 */
  failureRate: number
  /** 平均响应时间 */
  averageResponseTime: number
  /** 最后失败时间 */
  lastFailureTime?: Date
  /** 状态变更时间 */
  stateChangedAt: Date
}

### 告警和通知系统

#### 告警管理器
```typescript
/**
 * LinchKit 告警管理系统
 * @description 集成现有告警平台的抽象层，避免重复实现告警引擎
 * @recommendation 集成现有成熟的告警系统，而非自建
 * @implementation
 * - Prometheus + Alertmanager (推荐)
 * - Grafana Alerting
 * - PagerDuty API
 * - Slack/Teams Webhooks
 * - 邮件: nodemailer
 * - 短信: Twilio/阿里云短信
 */
export interface AlertManager {
  /** 添加告警规则 */
  addRule(rule: AlertRule): void
  /** 移除告警规则 */
  removeRule(ruleId: string): void
  /** 更新告警规则 */
  updateRule(ruleId: string, rule: Partial<AlertRule>): void
  /** 获取告警规则 */
  getRule(ruleId: string): AlertRule | null
  /** 获取所有规则 */
  getAllRules(): AlertRule[]
  /** 评估告警规则 */
  evaluateRules(metrics: MetricsSnapshot): Promise<AlertEvaluation[]>
  /** 触发告警 */
  triggerAlert(alert: Alert): Promise<void>
  /** 解决告警 */
  resolveAlert(alertId: string, resolution: AlertResolution): Promise<void>
  /** 获取活跃告警 */
  getActiveAlerts(): Alert[]
  /** 获取告警历史 */
  getAlertHistory(filter?: AlertHistoryFilter): Promise<Alert[]>
  /** 生成 Prometheus 告警规则 */
  generatePrometheusRules(): string
  /** 集成外部告警平台 */
  integrateExternalPlatform(platform: ExternalAlertPlatform): void
}

/**
 * 告警规则
 */
export interface AlertRule {
  /** 规则ID */
  id: string
  /** 规则名称 */
  name: string
  /** 规则描述 */
  description?: string
  /** 查询表达式 */
  query: string
  /** 条件表达式 */
  condition: AlertCondition
  /** 评估间隔（秒） */
  evaluationInterval: number
  /** 持续时间（秒） */
  duration: number
  /** 严重级别 */
  severity: AlertSeverity
  /** 标签 */
  labels: Record<string, string>
  /** 注解 */
  annotations: Record<string, string>
  /** 通知配置 */
  notifications: NotificationConfig[]
  /** 是否启用 */
  enabled: boolean
  /** 静默配置 */
  silenceConfig?: SilenceConfig
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 告警条件
 */
export interface AlertCondition {
  /** 操作符 */
  operator: AlertOperator
  /** 阈值 */
  threshold: number
  /** 比较函数 */
  compareFn?: (value: number, threshold: number) => boolean
}

/**
 * 告警评估结果
 */
export interface AlertEvaluation {
  /** 规则ID */
  ruleId: string
  /** 是否触发 */
  triggered: boolean
  /** 当前值 */
  value: number
  /** 阈值 */
  threshold: number
  /** 评估时间 */
  evaluatedAt: Date
  /** 触发时间 */
  triggeredAt?: Date
  /** 持续时间 */
  duration?: number
}

/**
 * 告警对象
 */
export interface Alert {
  /** 告警ID */
  id: string
  /** 规则ID */
  ruleId: string
  /** 告警名称 */
  name: string
  /** 告警描述 */
  description?: string
  /** 严重级别 */
  severity: AlertSeverity
  /** 告警状态 */
  status: AlertStatus
  /** 标签 */
  labels: Record<string, string>
  /** 注解 */
  annotations: Record<string, string>
  /** 触发值 */
  value: number
  /** 阈值 */
  threshold: number
  /** 开始时间 */
  startsAt: Date
  /** 结束时间 */
  endsAt?: Date
  /** 更新时间 */
  updatedAt: Date
  /** 指纹 */
  fingerprint: string
  /** 生成器URL */
  generatorURL?: string
}

/**
 * 告警解决信息
 */
export interface AlertResolution {
  /** 解决者 */
  resolvedBy: string
  /** 解决时间 */
  resolvedAt: Date
  /** 解决原因 */
  reason: string
  /** 解决备注 */
  notes?: string
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  /** 通知渠道 */
  channel: NotificationChannel
  /** 通知模板 */
  template?: string
  /** 通知条件 */
  condition?: NotificationCondition
  /** 重试配置 */
  retryConfig?: RetryConfig
}

/**
 * 通知渠道
 */
export interface NotificationChannel {
  /** 渠道ID */
  id: string
  /** 渠道类型 */
  type: NotificationChannelType
  /** 渠道名称 */
  name: string
  /** 渠道配置 */
  config: NotificationChannelConfig
  /** 是否启用 */
  enabled: boolean
}

/**
 * 通知条件
 */
export interface NotificationCondition {
  /** 严重级别过滤 */
  severities?: AlertSeverity[]
  /** 标签过滤 */
  labelFilters?: LabelFilter[]
  /** 时间过滤 */
  timeFilter?: TimeFilter
}

/**
 * 静默配置
 */
export interface SilenceConfig {
  /** 静默时间（分钟） */
  duration: number
  /** 静默条件 */
  condition?: string
  /** 静默标签 */
  labels?: Record<string, string>
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number
  /** 重试间隔（秒） */
  retryInterval: number
  /** 退避策略 */
  backoffStrategy: BackoffStrategy
}

/**
 * 标签过滤器
 */
export interface LabelFilter {
  /** 标签键 */
  key: string
  /** 操作符 */
  operator: LabelOperator
  /** 标签值 */
  value: string
}

/**
 * 时间过滤器
 */
export interface TimeFilter {
  /** 开始时间 */
  start?: string
  /** 结束时间 */
  end?: string
  /** 星期几 */
  weekdays?: number[]
  /** 时区 */
  timezone?: string
}

/**
 * 告警历史过滤器
 */
export interface AlertHistoryFilter {
  /** 规则ID */
  ruleId?: string
  /** 严重级别 */
  severity?: AlertSeverity
  /** 状态 */
  status?: AlertStatus
  /** 开始时间 */
  startTime?: Date
  /** 结束时间 */
  endTime?: Date
  /** 标签过滤 */
  labels?: Record<string, string>
  /** 分页 */
  pagination?: {
    page: number
    size: number
  }
}

/**
 * 告警操作符
 */
export enum AlertOperator {
  GREATER_THAN = 'gt',
  GREATER_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_EQUAL = 'lte',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne'
}

/**
 * 告警严重级别
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 告警状态
 */
export enum AlertStatus {
  PENDING = 'pending',
  FIRING = 'firing',
  RESOLVED = 'resolved',
  SILENCED = 'silenced'
}

/**
 * 通知渠道类型
 */
export enum NotificationChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  TEAMS = 'teams',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  PAGERDUTY = 'pagerduty',
  OPSGENIE = 'opsgenie'
}

/**
 * 通知渠道配置
 */
export interface NotificationChannelConfig {
  /** 目标地址 */
  target: string
  /** 认证信息 */
  credentials?: Record<string, string>
  /** 模板配置 */
  templates?: Record<string, string>
  /** 额外选项 */
  options?: Record<string, any>
}

/**
 * 标签操作符
 */
export enum LabelOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  REGEX_MATCH = 'regex',
  NOT_REGEX_MATCH = 'not_regex'
}

/**
 * 退避策略
 */
export enum BackoffStrategy {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed'
}

---

## 🚀 性能基准测试框架

### 基准测试系统

#### 基准测试接口
```typescript
/**
 * LinchKit 性能基准测试系统
 * @description 基于成熟基准测试库的抽象层
 * @recommendation 使用现有成熟的基准测试库，避免重复实现
 * @implementation
 * - 核心: tinybench (现代、轻量级)
 * - 或者: benchmark.js (经典、功能丰富)
 * - 负载测试: autocannon, k6
 * - 内存分析: clinic.js, 0x
 * - 性能监控: perf_hooks (Node.js 内置)
 * - 报告生成: 集成 CI/CD 平台的性能报告功能
 */
export interface BenchmarkService {
  /** 注册基准测试 */
  registerBenchmark(benchmark: Benchmark): void
  /** 运行单个基准测试 */
  runBenchmark(name: string, options?: BenchmarkOptions): Promise<BenchmarkResult>
  /** 运行所有基准测试 */
  runAllBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>
  /** 运行基准测试套件 */
  runSuite(suiteName: string, options?: BenchmarkOptions): Promise<BenchmarkSuite>
  /** 比较基准测试结果 */
  compareBenchmarks(baseline: BenchmarkResult, current: BenchmarkResult): BenchmarkComparison
  /** 检测性能回归 */
  detectRegression(results: BenchmarkResult[], threshold?: number): RegressionAnalysis
  /** 生成性能报告 */
  generateReport(results: BenchmarkSuite): PerformanceReport
  /** 保存基准测试结果 */
  saveResults(results: BenchmarkSuite): Promise<void>
  /** 加载历史结果 */
  loadHistoricalResults(filter?: ResultFilter): Promise<BenchmarkSuite[]>
  /** 获取原生 tinybench 实例 */
  getNativeBenchmark(): import('tinybench').Bench
  /** 集成 CI/CD 性能监控 */
  integrateCIPlatform(platform: CIPlatform): void
}

/**
 * 基准测试定义
 */
export interface Benchmark {
  /** 测试名称 */
  name: string
  /** 测试描述 */
  description?: string
  /** 测试分类 */
  category: BenchmarkCategory
  /** 测试函数 */
  fn: BenchmarkFunction
  /** 设置函数 */
  setup?: () => Promise<void> | void
  /** 清理函数 */
  teardown?: () => Promise<void> | void
  /** 测试选项 */
  options?: BenchmarkTestOptions
  /** 标签 */
  tags?: string[]
  /** 预期性能指标 */
  expectedMetrics?: ExpectedMetrics
}

/**
 * 基准测试函数
 */
export type BenchmarkFunction = () => Promise<void> | void

/**
 * 基准测试选项
 */
export interface BenchmarkOptions {
  /** 运行次数 */
  iterations?: number
  /** 预热次数 */
  warmupIterations?: number
  /** 最小运行时间（毫秒） */
  minTime?: number
  /** 最大运行时间（毫秒） */
  maxTime?: number
  /** 并发数 */
  concurrency?: number
  /** 是否收集内存指标 */
  collectMemory?: boolean
  /** 是否收集CPU指标 */
  collectCpu?: boolean
  /** 自定义指标收集器 */
  customCollectors?: MetricCollector[]
}

/**
 * 基准测试测试选项
 */
export interface BenchmarkTestOptions {
  /** 默认迭代次数 */
  defaultIterations: number
  /** 超时时间（毫秒） */
  timeout: number
  /** 是否跳过 */
  skip?: boolean
  /** 跳过原因 */
  skipReason?: string
}

/**
 * 基准测试结果
 */
export interface BenchmarkResult {
  /** 测试名称 */
  name: string
  /** 测试分类 */
  category: BenchmarkCategory
  /** 运行时间戳 */
  timestamp: Date
  /** 运行次数 */
  iterations: number
  /** 总运行时间（毫秒） */
  totalTime: number
  /** 平均运行时间（毫秒） */
  averageTime: number
  /** 最小运行时间（毫秒） */
  minTime: number
  /** 最大运行时间（毫秒） */
  maxTime: number
  /** 标准差 */
  standardDeviation: number
  /** 每秒操作数 */
  operationsPerSecond: number
  /** 内存使用情况 */
  memoryUsage?: MemoryUsage
  /** CPU使用情况 */
  cpuUsage?: CpuUsage
  /** 自定义指标 */
  customMetrics?: Record<string, number>
  /** 错误信息 */
  error?: string
  /** 状态 */
  status: BenchmarkStatus
  /** 环境信息 */
  environment: EnvironmentInfo
}

/**
 * 基准测试套件结果
 */
export interface BenchmarkSuite {
  /** 套件名称 */
  name: string
  /** 运行时间戳 */
  timestamp: Date
  /** 总运行时间（毫秒） */
  totalTime: number
  /** 测试结果 */
  results: BenchmarkResult[]
  /** 汇总统计 */
  summary: BenchmarkSummary
  /** 环境信息 */
  environment: EnvironmentInfo
  /** 配置信息 */
  config: BenchmarkOptions
}

/**
 * 基准测试比较
 */
export interface BenchmarkComparison {
  /** 基线结果 */
  baseline: BenchmarkResult
  /** 当前结果 */
  current: BenchmarkResult
  /** 性能变化 */
  changes: PerformanceChange[]
  /** 整体评估 */
  assessment: PerformanceAssessment
  /** 建议 */
  recommendations: string[]
}

/**
 * 性能变化
 */
export interface PerformanceChange {
  /** 指标名称 */
  metric: string
  /** 基线值 */
  baselineValue: number
  /** 当前值 */
  currentValue: number
  /** 变化百分比 */
  changePercent: number
  /** 变化类型 */
  changeType: ChangeType
  /** 是否显著 */
  significant: boolean
}

/**
 * 回归分析
 */
export interface RegressionAnalysis {
  /** 是否检测到回归 */
  hasRegression: boolean
  /** 回归测试 */
  regressions: RegressionDetection[]
  /** 改进测试 */
  improvements: ImprovementDetection[]
  /** 分析时间 */
  analyzedAt: Date
  /** 分析配置 */
  config: RegressionConfig
}

/**
 * 回归检测
 */
export interface RegressionDetection {
  /** 测试名称 */
  benchmarkName: string
  /** 指标名称 */
  metric: string
  /** 回归程度 */
  severity: RegressionSeverity
  /** 性能下降百分比 */
  degradationPercent: number
  /** 当前值 */
  currentValue: number
  /** 历史平均值 */
  historicalAverage: number
  /** 置信度 */
  confidence: number
}

/**
 * 改进检测
 */
export interface ImprovementDetection {
  /** 测试名称 */
  benchmarkName: string
  /** 指标名称 */
  metric: string
  /** 改进程度 */
  improvementPercent: number
  /** 当前值 */
  currentValue: number
  /** 历史平均值 */
  historicalAverage: number
}

/**
 * 性能报告
 */
export interface PerformanceReport {
  /** 报告ID */
  id: string
  /** 生成时间 */
  generatedAt: Date
  /** 报告类型 */
  type: ReportType
  /** 测试套件 */
  suite: BenchmarkSuite
  /** 执行摘要 */
  executiveSummary: ExecutiveSummary
  /** 详细分析 */
  detailedAnalysis: DetailedAnalysis
  /** 趋势分析 */
  trendAnalysis?: TrendAnalysis
  /** 建议 */
  recommendations: Recommendation[]
  /** 附件 */
  attachments?: ReportAttachment[]
}

/**
 * 内存使用情况
 */
export interface MemoryUsage {
  /** 堆内存使用（字节） */
  heapUsed: number
  /** 堆内存总量（字节） */
  heapTotal: number
  /** 外部内存（字节） */
  external: number
  /** RSS内存（字节） */
  rss: number
  /** 数组缓冲区（字节） */
  arrayBuffers: number
}

/**
 * CPU使用情况
 */
export interface CpuUsage {
  /** 用户CPU时间（微秒） */
  user: number
  /** 系统CPU时间（微秒） */
  system: number
  /** CPU使用率（百分比） */
  percent: number
}

/**
 * 环境信息
 */
export interface EnvironmentInfo {
  /** Node.js版本 */
  nodeVersion: string
  /** 操作系统 */
  platform: string
  /** CPU架构 */
  arch: string
  /** CPU信息 */
  cpuInfo: {
    model: string
    cores: number
    speed: number
  }
  /** 内存信息 */
  memoryInfo: {
    total: number
    free: number
  }
  /** 包版本 */
  packageVersions: Record<string, string>
}

/**
 * 基准测试分类
 */
export enum BenchmarkCategory {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  LOAD = 'load',
  STRESS = 'stress',
  MEMORY = 'memory',
  CPU = 'cpu',
  IO = 'io',
  DATABASE = 'database',
  NETWORK = 'network',
  CUSTOM = 'custom'
}

/**
 * 基准测试状态
 */
export enum BenchmarkStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout'
}

/**
 * 变化类型
 */
export enum ChangeType {
  IMPROVEMENT = 'improvement',
  REGRESSION = 'regression',
  NO_CHANGE = 'no_change'
}

/**
 * 回归严重程度
 */
export enum RegressionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 性能评估
 */
export enum PerformanceAssessment {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor',
  CRITICAL = 'critical'
}

/**
 * 报告类型
 */
export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  COMPARISON = 'comparison',
  TREND = 'trend',
  REGRESSION = 'regression'
}

/**
 * 基准测试汇总
 */
export interface BenchmarkSummary {
  /** 总测试数 */
  totalTests: number
  /** 通过测试数 */
  passedTests: number
  /** 失败测试数 */
  failedTests: number
  /** 跳过测试数 */
  skippedTests: number
  /** 平均执行时间 */
  averageExecutionTime: number
  /** 最快测试 */
  fastestTest: string
  /** 最慢测试 */
  slowestTest: string
  /** 整体性能评级 */
  overallRating: PerformanceAssessment
}

/**
 * 执行摘要
 */
export interface ExecutiveSummary {
  /** 整体性能状态 */
  overallStatus: PerformanceAssessment
  /** 关键发现 */
  keyFindings: string[]
  /** 性能亮点 */
  performanceHighlights: string[]
  /** 关注点 */
  areasOfConcern: string[]
  /** 建议优先级 */
  recommendationPriorities: string[]
}

/**
 * 详细分析
 */
export interface DetailedAnalysis {
  /** 按分类的性能分析 */
  categoryAnalysis: Record<BenchmarkCategory, CategoryAnalysis>
  /** 性能瓶颈分析 */
  bottleneckAnalysis: BottleneckAnalysis[]
  /** 资源使用分析 */
  resourceUsageAnalysis: ResourceUsageAnalysis
  /** 统计分析 */
  statisticalAnalysis: StatisticalAnalysis
}

/**
 * 分类分析
 */
export interface CategoryAnalysis {
  /** 分类名称 */
  category: BenchmarkCategory
  /** 测试数量 */
  testCount: number
  /** 平均性能 */
  averagePerformance: number
  /** 性能分布 */
  performanceDistribution: PerformanceDistribution
  /** 趋势 */
  trend: TrendDirection
  /** 建议 */
  recommendations: string[]
}

/**
 * 瓶颈分析
 */
export interface BottleneckAnalysis {
  /** 瓶颈类型 */
  type: BottleneckType
  /** 影响的测试 */
  affectedTests: string[]
  /** 严重程度 */
  severity: BottleneckSeverity
  /** 描述 */
  description: string
  /** 建议解决方案 */
  suggestedSolutions: string[]
}

/**
 * 资源使用分析
 */
export interface ResourceUsageAnalysis {
  /** 内存使用分析 */
  memoryAnalysis: {
    averageUsage: number
    peakUsage: number
    memoryLeaks: boolean
    recommendations: string[]
  }
  /** CPU使用分析 */
  cpuAnalysis: {
    averageUsage: number
    peakUsage: number
    cpuIntensive: string[]
    recommendations: string[]
  }
}

/**
 * 统计分析
 */
export interface StatisticalAnalysis {
  /** 性能分布 */
  performanceDistribution: PerformanceDistribution
  /** 相关性分析 */
  correlationAnalysis: CorrelationAnalysis[]
  /** 异常值检测 */
  outlierDetection: OutlierDetection[]
  /** 置信区间 */
  confidenceIntervals: ConfidenceInterval[]
}

/**
 * 趋势分析
 */
export interface TrendAnalysis {
  /** 历史数据点 */
  historicalDataPoints: HistoricalDataPoint[]
  /** 趋势方向 */
  trendDirection: TrendDirection
  /** 趋势强度 */
  trendStrength: number
  /** 预测 */
  predictions: PerformancePrediction[]
  /** 季节性模式 */
  seasonalPatterns?: SeasonalPattern[]
}

/**
 * 建议
 */
export interface Recommendation {
  /** 建议ID */
  id: string
  /** 建议类型 */
  type: RecommendationType
  /** 优先级 */
  priority: RecommendationPriority
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 实施步骤 */
  implementationSteps: string[]
  /** 预期收益 */
  expectedBenefit: string
  /** 实施难度 */
  implementationDifficulty: ImplementationDifficulty
  /** 相关测试 */
  relatedTests: string[]
}

/**
 * 报告附件
 */
export interface ReportAttachment {
  /** 附件名称 */
  name: string
  /** 附件类型 */
  type: AttachmentType
  /** 附件内容 */
  content: string | Buffer
  /** 描述 */
  description?: string
}

/**
 * 性能分布
 */
export interface PerformanceDistribution {
  /** 分位数 */
  percentiles: Record<string, number>
  /** 直方图 */
  histogram: HistogramBucket[]
  /** 平均值 */
  mean: number
  /** 中位数 */
  median: number
  /** 标准差 */
  standardDeviation: number
}

/**
 * 直方图桶
 */
export interface HistogramBucket {
  /** 下界 */
  lowerBound: number
  /** 上界 */
  upperBound: number
  /** 计数 */
  count: number
}

/**
 * 相关性分析
 */
export interface CorrelationAnalysis {
  /** 变量1 */
  variable1: string
  /** 变量2 */
  variable2: string
  /** 相关系数 */
  correlationCoefficient: number
  /** 相关性强度 */
  strength: CorrelationStrength
  /** 显著性 */
  significance: number
}

/**
 * 异常值检测
 */
export interface OutlierDetection {
  /** 测试名称 */
  testName: string
  /** 指标名称 */
  metric: string
  /** 异常值 */
  outlierValue: number
  /** 正常范围 */
  normalRange: {
    min: number
    max: number
  }
  /** 异常程度 */
  severity: OutlierSeverity
}

/**
 * 置信区间
 */
export interface ConfidenceInterval {
  /** 指标名称 */
  metric: string
  /** 置信水平 */
  confidenceLevel: number
  /** 下界 */
  lowerBound: number
  /** 上界 */
  upperBound: number
  /** 平均值 */
  mean: number
}

/**
 * 历史数据点
 */
export interface HistoricalDataPoint {
  /** 时间戳 */
  timestamp: Date
  /** 值 */
  value: number
  /** 版本 */
  version?: string
  /** 构建ID */
  buildId?: string
}

/**
 * 性能预测
 */
export interface PerformancePrediction {
  /** 预测时间 */
  timestamp: Date
  /** 预测值 */
  predictedValue: number
  /** 置信区间 */
  confidenceInterval: {
    lower: number
    upper: number
  }
  /** 预测模型 */
  model: string
}

/**
 * 季节性模式
 */
export interface SeasonalPattern {
  /** 模式类型 */
  type: SeasonalPatternType
  /** 周期长度 */
  periodLength: number
  /** 强度 */
  strength: number
  /** 描述 */
  description: string
}

/**
 * 回归配置
 */
export interface RegressionConfig {
  /** 回归阈值（百分比） */
  regressionThreshold: number
  /** 最小样本数 */
  minSampleSize: number
  /** 置信水平 */
  confidenceLevel: number
  /** 检测窗口（天） */
  detectionWindow: number
}

/**
 * 结果过滤器
 */
export interface ResultFilter {
  /** 开始时间 */
  startTime?: Date
  /** 结束时间 */
  endTime?: Date
  /** 测试名称 */
  testNames?: string[]
  /** 分类 */
  categories?: BenchmarkCategory[]
  /** 标签 */
  tags?: string[]
  /** 版本 */
  version?: string
}

/**
 * 指标收集器
 */
export interface MetricCollector {
  /** 收集器名称 */
  name: string
  /** 收集函数 */
  collect: () => Promise<Record<string, number>>
}

/**
 * 预期指标
 */
export interface ExpectedMetrics {
  /** 最大执行时间（毫秒） */
  maxExecutionTime?: number
  /** 最大内存使用（字节） */
  maxMemoryUsage?: number
  /** 最小操作数/秒 */
  minOperationsPerSecond?: number
  /** 自定义指标期望 */
  customMetrics?: Record<string, {
    min?: number
    max?: number
    target?: number
  }>
}

/**
 * 瓶颈类型
 */
export enum BottleneckType {
  CPU = 'cpu',
  MEMORY = 'memory',
  IO = 'io',
  NETWORK = 'network',
  DATABASE = 'database',
  ALGORITHM = 'algorithm'
}

/**
 * 瓶颈严重程度
 */
export enum BottleneckSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 趋势方向
 */
export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DEGRADING = 'degrading',
  VOLATILE = 'volatile'
}

/**
 * 相关性强度
 */
export enum CorrelationStrength {
  VERY_WEAK = 'very_weak',
  WEAK = 'weak',
  MODERATE = 'moderate',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong'
}

/**
 * 异常值严重程度
 */
export enum OutlierSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  EXTREME = 'extreme'
}

/**
 * 实施难度
 */
export enum ImplementationDifficulty {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * 附件类型
 */
export enum AttachmentType {
  CHART = 'chart',
  TABLE = 'table',
  RAW_DATA = 'raw_data',
  LOG = 'log'
}

/**
 * 季节性模式类型
 */
export enum SeasonalPatternType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

/**
 * 外部告警平台
 */
export interface ExternalAlertPlatform {
  /** 平台类型 */
  type: ExternalPlatformType
  /** 平台配置 */
  config: ExternalPlatformConfig
  /** API 客户端 */
  client?: any
}

/**
 * 外部平台类型
 */
export enum ExternalPlatformType {
  PROMETHEUS_ALERTMANAGER = 'prometheus-alertmanager',
  GRAFANA = 'grafana',
  PAGERDUTY = 'pagerduty',
  OPSGENIE = 'opsgenie',
  DATADOG = 'datadog',
  NEW_RELIC = 'new-relic'
}

/**
 * 外部平台配置
 */
export interface ExternalPlatformConfig {
  /** API 端点 */
  endpoint: string
  /** API 密钥 */
  apiKey?: string
  /** 认证令牌 */
  token?: string
  /** 额外配置 */
  options?: Record<string, any>
}

/**
 * CI/CD 平台集成
 */
export interface CIPlatform {
  /** 平台类型 */
  type: CIPlatformType
  /** 配置 */
  config: CIPlatformConfig
}

/**
 * CI/CD 平台类型
 */
export enum CIPlatformType {
  GITHUB_ACTIONS = 'github-actions',
  GITLAB_CI = 'gitlab-ci',
  JENKINS = 'jenkins',
  AZURE_DEVOPS = 'azure-devops',
  CIRCLECI = 'circleci'
}

/**
 * CI/CD 平台配置
 */
export interface CIPlatformConfig {
  /** 仓库信息 */
  repository: string
  /** 分支 */
  branch?: string
  /** 工作流文件路径 */
  workflowPath?: string
  /** 环境变量 */
  environment?: Record<string, string>
}

/**
 * 推荐的第三方库集成配置
 */
export interface ThirdPartyLibraryConfig {
  /** Prometheus 客户端配置 */
  prometheus?: {
    /** 注册表 */
    register?: import('prom-client').Registry
    /** 默认标签 */
    defaultLabels?: Record<string, string>
    /** 收集默认指标 */
    collectDefaultMetrics?: boolean
  }

  /** OpenTelemetry 配置 */
  opentelemetry?: {
    /** 服务名称 */
    serviceName: string
    /** 服务版本 */
    serviceVersion?: string
    /** 导出器配置 */
    exporters?: {
      jaeger?: { endpoint: string }
      zipkin?: { endpoint: string }
      otlp?: { endpoint: string }
    }
  }

  /** Terminus 健康检查配置 */
  terminus?: {
    /** 健康检查端点 */
    healthChecks?: Record<string, () => Promise<any>>
    /** 优雅关闭超时 */
    timeout?: number
    /** 信号处理 */
    signals?: string[]
  }

  /** Tinybench 配置 */
  tinybench?: {
    /** 预热次数 */
    warmupIterations?: number
    /** 运行时间 */
    time?: number
    /** 迭代次数 */
    iterations?: number
  }

  /** Pino 日志配置 */
  pino?: {
    /** 日志级别 */
    level?: string
    /** 格式化器 */
    formatters?: any
    /** 传输器 */
    transport?: any
  }
}
```
```

#### 内置传输器
```typescript
/**
 * 控制台传输器
 */
export class ConsoleTransport implements LogTransport {
  name = 'console'
  level: LogLevel

  constructor(config: ConsoleTransportConfig = {}) {
    this.level = config.level ?? LogLevel.DEBUG
  }

  async write(entry: LogEntry): Promise<void> {
    const levelName = LogLevel[entry.level]
    const timestamp = entry.timestamp.toISOString()
    const logger = entry.logger ? `[${entry.logger}]` : ''

    let output = `${timestamp} ${levelName} ${logger} ${entry.message}`

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      output += ` ${JSON.stringify(entry.meta)}`
    }

    const consoleMethod = this.getConsoleMethod(entry.level)
    consoleMethod(output)
  }

  async close(): Promise<void> {
    // 控制台传输器无需关闭
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error
      default:
        return console.log
    }
  }
}

/**
 * 文件传输器
 */
export class FileTransport implements LogTransport {
  name = 'file'
  level: LogLevel
  private filePath: string
  private maxSize: number
  private maxFiles: number
  private currentSize = 0

  constructor(config: FileTransportConfig) {
    this.level = config.level ?? LogLevel.INFO
    this.filePath = config.filePath
    this.maxSize = config.maxSize ?? 10 * 1024 * 1024 // 10MB
    this.maxFiles = config.maxFiles ?? 5
  }

  async write(entry: LogEntry): Promise<void> {
    const logLine = this.formatLogEntry(entry)

    // 检查文件大小
    if (this.currentSize + logLine.length > this.maxSize) {
      await this.rotateFile()
    }

    // 写入文件
    await this.appendToFile(logLine)
    this.currentSize += logLine.length
  }

  async close(): Promise<void> {
    // 文件传输器关闭时的清理工作
  }

  private formatLogEntry(entry: LogEntry): string {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      logger: entry.logger,
      message: entry.message,
      ...entry.meta
    }

    return JSON.stringify(logObject) + '\n'
  }

  private async rotateFile(): Promise<void> {
    // 实现文件轮转逻辑
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = `${this.filePath}.${i}`
      const newFile = `${this.filePath}.${i + 1}`

      try {
        await this.moveFile(oldFile, newFile)
      } catch (error) {
        // 忽略文件不存在的错误
      }
    }

    // 移动当前文件
    await this.moveFile(this.filePath, `${this.filePath}.1`)
    this.currentSize = 0
  }

  private async appendToFile(content: string): Promise<void> {
    // 实现文件写入逻辑
    // 这里应该使用实际的文件系统 API
  }

  private async moveFile(from: string, to: string): Promise<void> {
    // 实现文件移动逻辑
    // 这里应该使用实际的文件系统 API
  }
}

/**
 * 结构化传输器（用于发送到日志聚合服务）
 */
export class StructuredTransport implements LogTransport {
  name = 'structured'
  level: LogLevel
  private endpoint: string
  private apiKey?: string
  private batchSize: number
  private flushInterval: number
  private buffer: LogEntry[] = []
  private timer?: NodeJS.Timeout

  constructor(config: StructuredTransportConfig) {
    this.level = config.level ?? LogLevel.INFO
    this.endpoint = config.endpoint
    this.apiKey = config.apiKey
    this.batchSize = config.batchSize ?? 100
    this.flushInterval = config.flushInterval ?? 5000 // 5秒

    this.startFlushTimer()
  }

  async write(entry: LogEntry): Promise<void> {
    this.buffer.push(entry)

    if (this.buffer.length >= this.batchSize) {
      await this.flush()
    }
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
    }
    await this.flush()
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(error => {
        console.error('Failed to flush logs:', error)
      })
    }, this.flushInterval)
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return
    }

    const logs = [...this.buffer]
    this.buffer = []

    try {
      await this.sendLogs(logs)
    } catch (error) {
      // 发送失败，重新加入缓冲区
      this.buffer.unshift(...logs)
      throw error
    }
  }

  private async sendLogs(logs: LogEntry[]): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ logs })
    })

    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`)
    }
  }
}

export interface ConsoleTransportConfig {
  level?: LogLevel
}

export interface FileTransportConfig {
  level?: LogLevel
  filePath: string
  maxSize?: number
  maxFiles?: number
}

export interface StructuredTransportConfig {
  level?: LogLevel
  endpoint: string 
  apiKey?: string
  batchSize?: number
  flushInterval?: number
}
```

---

**重要提醒**: @linch-kit/core 是整个系统的基础，其稳定性和性能直接影响所有其他包。开发时必须特别注意代码质量和向后兼容性。所有设计都应该遵循 AI-First 原则，确保 AI 工具能够有效理解和处理代码结构。统一错误管理和日志管理系统为整个生态系统提供了一致的监控和诊断能力。
