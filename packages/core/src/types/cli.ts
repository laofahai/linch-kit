/**
 * @ai-context CLI 系统类型定义
 * @ai-purpose 为整个 CLI 系统提供类型安全和 AI 理解支持
 * @ai-design-principle 所有接口都包含 AI 标注，便于自动化处理
 */

/**
 * @ai-interface 命令选项定义
 * @ai-purpose 定义 CLI 命令的可选参数
 * @ai-usage 用于 Commander.js 选项配置
 */
export interface CommandOption {
  /** @ai-field 选项标志，如 '-f, --force' */
  flags: string
  
  /** @ai-field 选项描述，显示在帮助信息中 */
  description: string
  
  /** @ai-field 默认值，可选 */
  defaultValue?: any
  
  /** @ai-field 选项类型，用于验证 */
  type?: 'string' | 'number' | 'boolean' | 'array'
  
  /** @ai-field 是否必需，默认 false */
  required?: boolean
}

/**
 * @ai-interface 命令参数定义
 * @ai-purpose 定义 CLI 命令的位置参数
 * @ai-usage 用于 Commander.js 参数配置
 */
export interface CommandArgument {
  /** @ai-field 参数名称 */
  name: string
  
  /** @ai-field 参数描述 */
  description: string
  
  /** @ai-field 是否必需 */
  required: boolean
  
  /** @ai-field 默认值，仅对可选参数有效 */
  defaultValue?: any
  
  /** @ai-field 参数类型 */
  type?: 'string' | 'number' | 'array'
}

/**
 * @ai-interface CLI 执行上下文
 * @ai-purpose 为命令处理器提供执行环境和工具
 * @ai-lifecycle 在每次命令执行时创建
 */
export interface CLIContext {
  /** @ai-field 当前执行的命令名称 */
  commandName?: string
  
  /** @ai-field 命令参数数组 */
  args?: any[]
  
  /** @ai-field 命令注册表引用 */
  registry?: any

  /** @ai-field 配置管理器引用 */
  config?: any

  /** @ai-field 日志记录器 */
  logger?: Console
  
  /** @ai-field 当前工作目录 */
  cwd?: string
  
  /** @ai-field 是否为详细模式 */
  verbose?: boolean
  
  /** @ai-field 是否为静默模式 */
  silent?: boolean
}

/**
 * @ai-interface 命令处理器函数类型
 * @ai-purpose 定义命令执行逻辑的标准接口
 * @ai-async 所有命令处理器都是异步的
 * @ai-error-handling 应该抛出错误而不是直接退出进程
 */
export type CommandHandler = (context: CLIContext) => Promise<void>

/**
 * @ai-interface 命令元数据
 * @ai-purpose 完整描述一个 CLI 命令的所有信息
 * @ai-usage 用于命令注册和文档生成
 */
export interface CommandMetadata {
  /** @ai-field 命令描述，显示在帮助信息中 */
  description: string
  
  /** @ai-field 命令处理器函数 */
  handler: CommandHandler
  
  /** @ai-field 命令选项列表 */
  options?: CommandOption[]
  
  /** @ai-field 命令参数列表 */
  arguments?: CommandArgument[]
  
  /** @ai-field 命令示例，用于帮助文档 */
  examples?: string[]
  
  /** @ai-field 命令别名 */
  aliases?: string[]
  
  /** @ai-field 是否为隐藏命令 */
  hidden?: boolean
  
  /** @ai-field 命令分类，用于组织帮助信息 */
  category?: string
  
  /** @ai-field AI 标签，用于智能推荐 */
  aiTags?: string[]
}

/**
 * @ai-interface 命令插件接口
 * @ai-purpose 允许第三方包扩展 CLI 功能
 * @ai-lifecycle init -> register -> [execute commands] -> cleanup
 * @ai-plugin-pattern 标准插件接口，支持依赖管理
 */
export interface CommandPlugin {
  /** @ai-field 插件唯一标识符，建议使用包名 */
  name: string
  
  /** @ai-field 插件版本，用于兼容性检查 */
  version: string
  
  /** @ai-field 插件描述 */
  description?: string
  
  /** @ai-field 依赖的其他插件列表 */
  dependencies?: string[]
  
  /** @ai-field 支持的 CLI 版本范围 */
  cliVersionRange?: string
  
  /** @ai-field AI 标签，用于插件发现和分类 */
  aiTags?: string[]
  
  /**
   * @ai-method 插件初始化钩子
   * @ai-purpose 在插件注册前执行初始化逻辑
   * @ai-parameter context: CLIContext - 插件上下文
   * @ai-optional 可选实现
   */
  init?(context: CLIContext): Promise<void>
  
  /**
   * @ai-method 注册命令到 CLI 系统
   * @ai-purpose 插件的核心方法，注册所有提供的命令
   * @ai-parameter registry: CommandRegistry - 命令注册表实例
   * @ai-required 必须实现
   */
  register(registry: any): Promise<void>
  
  /**
   * @ai-method 插件清理钩子
   * @ai-purpose 在插件卸载时执行清理逻辑
   * @ai-optional 可选实现
   */
  cleanup?(): Promise<void>
}

/**
 * @ai-interface 插件发现结果
 * @ai-purpose 描述插件发现过程的结果
 * @ai-usage 用于插件加载器的返回值
 */
export interface PluginDiscoveryResult {
  /** @ai-field 发现的插件列表 */
  plugins: CommandPlugin[]
  
  /** @ai-field 发现过程中的错误 */
  errors: Array<{
    pluginPath: string
    error: string
  }>
  
  /** @ai-field 发现耗时（毫秒） */
  discoveryTime: number
  
  /** @ai-field 扫描的路径列表 */
  scannedPaths: string[]
}

/**
 * @ai-interface CLI 配置接口
 * @ai-purpose 定义 CLI 系统的配置结构
 * @ai-extensible 支持插件扩展配置字段
 */
export interface CLIConfig {
  /** @ai-field 项目根目录 */
  rootDir?: string
  
  /** @ai-field 配置文件路径 */
  configFile?: string
  
  /** @ai-field 插件目录列表 */
  pluginDirs?: string[]
  
  /** @ai-field 启用的插件列表 */
  enabledPlugins?: string[]
  
  /** @ai-field 禁用的插件列表 */
  disabledPlugins?: string[]
  
  /** @ai-field 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  
  /** @ai-field 是否启用 AI 功能 */
  aiEnabled?: boolean
  
  /** @ai-field AI 配置 */
  ai?: {
    /** @ai-field 是否启用智能补全 */
    autoComplete?: boolean
    
    /** @ai-field 是否启用命令推荐 */
    commandSuggestion?: boolean
    
    /** @ai-field 是否启用错误诊断 */
    errorDiagnosis?: boolean
  }
  
  /** @ai-field 插件特定配置 */
  plugins?: Record<string, any>
}

/**
 * @ai-interface 命令执行结果
 * @ai-purpose 标准化命令执行的返回值
 * @ai-usage 用于命令处理器的返回值和错误处理
 */
export interface CommandResult {
  /** @ai-field 是否执行成功 */
  success: boolean
  
  /** @ai-field 执行消息 */
  message?: string
  
  /** @ai-field 返回数据 */
  data?: any
  
  /** @ai-field 错误信息 */
  error?: string
  
  /** @ai-field 执行耗时（毫秒） */
  executionTime?: number
  
  /** @ai-field 退出码 */
  exitCode?: number
}

/**
 * @ai-interface 进度报告接口
 * @ai-purpose 为长时间运行的命令提供进度反馈
 * @ai-usage 用于文件操作、网络请求等耗时操作
 */
export interface ProgressReporter {
  /** @ai-method 开始进度报告 */
  start(message: string): void
  
  /** @ai-method 更新进度 */
  update(progress: number, message?: string): void
  
  /** @ai-method 完成进度报告 */
  succeed(message?: string): void
  
  /** @ai-method 失败进度报告 */
  fail(message?: string): void
  
  /** @ai-method 停止进度报告 */
  stop(): void
}

/**
 * @ai-type 命令分类枚举
 * @ai-purpose 用于组织和分类 CLI 命令
 * @ai-usage 在帮助信息中按分类显示命令
 */
export type CommandCategory = 
  | 'project'      // 项目管理相关
  | 'schema'       // Schema 相关
  | 'auth'         // 认证相关
  | 'database'     // 数据库相关
  | 'plugin'       // 插件相关
  | 'config'       // 配置相关
  | 'dev'          // 开发相关
  | 'build'        // 构建相关
  | 'deploy'       // 部署相关
  | 'utility'      // 工具类
  | 'ai'           // AI 相关

/**
 * @ai-type 日志级别类型
 * @ai-purpose 定义日志输出的详细程度
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * @ai-type AI 标签类型
 * @ai-purpose 用于 AI 系统理解和分类命令/插件
 */
export type AITag = 
  | 'generation'   // 代码生成
  | 'validation'   // 验证相关
  | 'migration'    // 迁移相关
  | 'testing'      // 测试相关
  | 'deployment'   // 部署相关
  | 'monitoring'   // 监控相关
  | 'security'     // 安全相关
  | 'performance'  // 性能相关
  | 'ui'           // 用户界面
  | 'api'          // API 相关
  | 'database'     // 数据库相关
  | 'auth'         // 认证相关
