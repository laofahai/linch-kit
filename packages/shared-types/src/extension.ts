/**
 * Extension 系统共享类型
 * @module shared-types/extension
 */

import type { BaseConfig, OperationResult, Logger } from './common'

/**
 * Extension 权限类型
 */
export type ExtensionPermission = 
  | 'database:read' 
  | 'database:write'
  | 'api:read'
  | 'api:write'
  | 'ui:render'
  | 'system:hooks'
  | string

/**
 * Extension 能力配置
 */
export interface ExtensionCapabilities {
  /** 包含用户界面 */
  hasUI?: boolean
  /** 提供API端点 */
  hasAPI?: boolean  
  /** 定义数据模型 */
  hasSchema?: boolean
  /** 监听系统钩子 */
  hasHooks?: boolean
  /** 是否可独立运行 */
  standalone?: boolean
}

/**
 * Extension 元数据
 */
export interface ExtensionMetadata {
  /** 扩展ID (唯一标识) */
  id: string
  /** 扩展名称 */
  name: string
  /** 版本号 */
  version: string
  /** 描述 */
  description?: string
  /** 作者 */
  author?: string
  /** 依赖的其他扩展 */
  dependencies?: string[]
  /** 显示名称 */
  displayName: string
  /** 扩展能力 */
  capabilities: ExtensionCapabilities
  /** 扩展分类 */
  category?: string
  /** 标签 */
  tags?: string[]
  /** 权限要求 */
  permissions: ExtensionPermission[]
  /** 配置模式 */
  configuration?: Record<string, unknown>
  /** 入口点配置 */
  entries?: {
    api?: string
    schema?: string  
    components?: string
    hooks?: string
  }
}

/**
 * Extension 配置
 */
export interface ExtensionConfig extends BaseConfig {
  /** 是否启用 */
  enabled?: boolean
  /** 优先级 */
  priority?: number
  /** 扩展特定配置 */
  [key: string]: unknown
}

/**
 * Extension 执行上下文
 */
export interface ExtensionContext {
  /** Extension名称 */
  name: string
  /** 权限列表 */
  permissions: ExtensionPermission[]
  /** 配置 */
  config: ExtensionConfig
  /** 命名空间日志器 */
  logger: Logger
  /** 事件总线 */
  events: {
    emit: (event: string, data?: unknown) => void
    on: (event: string, handler: (data: unknown) => void) => void
    off: (event: string, handler: (data: unknown) => void) => void
  }
  /** 隔离存储 */
  storage: {
    get: <T>(key: string) => Promise<T | null>
    set: <T>(key: string, value: T) => Promise<void>
    delete: (key: string) => Promise<void>
    clear: () => Promise<void>
  }
}

/**
 * Extension 生命周期钩子
 */
export interface ExtensionLifecycleHooks {
  init?: (config: ExtensionConfig) => Promise<void> | void
  setup?: (config: ExtensionConfig) => Promise<void> | void
  start?: (config: ExtensionConfig) => Promise<void> | void
  ready?: (config: ExtensionConfig) => Promise<void> | void
  stop?: (config: ExtensionConfig) => Promise<void> | void
  destroy?: (config: ExtensionConfig) => Promise<void> | void
}

/**
 * Extension 定义
 */
export interface Extension extends ExtensionLifecycleHooks {
  /** Extension元数据 */
  metadata: ExtensionMetadata
  /** 默认配置 */
  defaultConfig?: ExtensionConfig
}

/**
 * Extension 实例接口
 */
export interface ExtensionInstance {
  /** Extension名称 */
  name: string
  /** 元数据 */
  metadata: ExtensionMetadata
  /** 执行上下文 */
  context: ExtensionContext
  /** 是否已初始化 */
  initialized: boolean
  /** 是否正在运行 */
  running: boolean
  /** 初始化Extension */
  initialize(): Promise<void>
  /** 启动Extension */
  start(): Promise<void>
  /** 停止Extension */
  stop(): Promise<void>
  /** 销毁Extension */
  destroy(): Promise<void>
}

/**
 * Extension 注册信息
 */
export interface ExtensionRegistration {
  /** Extension定义 */
  extension: Extension
  /** 配置 */
  config: ExtensionConfig
  /** 实例 */
  instance?: ExtensionInstance
  /** 状态 */
  status: 'registered' | 'loading' | 'loaded' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
  /** 注册时间 */
  registeredAt: number
  /** 最后更新时间 */
  lastUpdated: number
  /** 错误信息 */
  error?: Error
}

/**
 * Extension 加载结果
 */
export interface ExtensionLoadResult {
  /** 是否成功 */
  success: boolean
  /** Extension实例 */
  instance?: ExtensionInstance
  /** 错误信息 */
  error?: {
    code: string
    message: string
    stack?: string
  }
}

/**
 * Extension 管理器接口
 */
export interface ExtensionManager {
  /** 注册Extension */
  register(extension: Extension, config?: ExtensionConfig): Promise<OperationResult>
  /** 注销Extension */
  unregister(extensionId: string): Promise<OperationResult>
  /** 启动Extension */
  start(extensionId: string): Promise<OperationResult>
  /** 停止Extension */
  stop(extensionId: string): Promise<OperationResult>
  /** 获取Extension */
  get(extensionId: string): ExtensionRegistration | undefined
  /** 获取所有Extension */
  getAll(): ExtensionRegistration[]
  /** 检查Extension是否存在 */
  has(extensionId: string): boolean
  /** 获取Extension状态 */
  getStatus(extensionId: string): string | undefined
  /** 启动所有Extension */
  startAll(): Promise<OperationResult[]>
  /** 停止所有Extension */
  stopAll(): Promise<OperationResult[]>
  /** 加载Extension (动态加载) */
  loadExtension(extensionName: string): Promise<ExtensionLoadResult>
  /** 卸载Extension (动态卸载) */  
  unloadExtension(extensionName: string): Promise<boolean>
  /** 热重载Extension */
  reloadExtension(extensionName: string): Promise<ExtensionLoadResult>
  /** 获取Extension实例 */
  getExtension(extensionName: string): ExtensionInstance | undefined
  /** 获取所有Extension实例 */
  getAllExtensions(): ExtensionInstance[]
  /** 检查Extension是否存在 */
  hasExtension(extensionName: string): boolean
  /** 获取Extension状态 */
  getExtensionStatus(extensionName: string): string | undefined
}