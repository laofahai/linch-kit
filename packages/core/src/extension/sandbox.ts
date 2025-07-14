/**
 * Extension沙箱执行环境
 * @module extension/sandbox
 */

import { EventEmitter } from 'eventemitter3'

import type { ExtensionPermission, ExtensionContext } from './types'
import type { ExtensionPermissionManager } from './permission-manager'

// 可选的isolated-vm依赖
let ivm: typeof import('isolated-vm') | undefined
try {
  ivm = require('isolated-vm')
} catch {
  console.warn('isolated-vm not available, sandbox will run in unsafe mode')
}

export interface SandboxConfig {
  /** 是否启用沙箱 */
  enabled: boolean
  /** 超时时间(ms) */
  timeout: number
  /** 最大内存限制(bytes) */
  memoryLimit: number
  /** 允许的Node.js内置模块 */
  allowedModules: string[]
  /** 禁止的全局变量 */
  blockedGlobals: string[]
  /** 是否允许网络访问 */
  allowNetworkAccess: boolean
  /** 是否允许文件系统访问 */
  allowFileSystemAccess: boolean
}

export interface SandboxedFunction {
  /** 函数名称 */
  name: string
  /** 执行函数 */
  execute: (...args: unknown[]) => Promise<unknown>
  /** 权限要求 */
  permissions: ExtensionPermission[]
}

export interface SandboxExecution {
  /** 执行ID */
  id: string
  /** Extension名称 */
  extensionName: string
  /** 函数名称 */
  functionName: string
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 执行状态 */
  status: 'running' | 'completed' | 'failed' | 'timeout'
  /** 结果 */
  result?: unknown
  /** 错误信息 */
  error?: Error
  /** 资源使用情况 */
  resourceUsage: {
    memory: number
    cpu: number
    duration: number
  }
}

/**
 * Extension沙箱管理器
 * 提供安全的代码执行环境
 */
export class ExtensionSandbox extends EventEmitter {
  private isolate?: import('isolated-vm').Isolate
  private context?: import('isolated-vm').Context
  private executions = new Map<string, SandboxExecution>()
  private activeExecutions = new Set<string>()
  private config: SandboxConfig

  constructor(
    private extensionContext: ExtensionContext,
    private permissionManager: ExtensionPermissionManager,
    config?: Partial<SandboxConfig>
  ) {
    super()

    // 合并默认配置
    this.config = {
      enabled: true,
      timeout: 30000, // 30秒
      memoryLimit: 100 * 1024 * 1024, // 100MB
      allowedModules: ['util', 'crypto', 'path'],
      blockedGlobals: ['process', 'require', 'global', '__dirname', '__filename'],
      allowNetworkAccess: false,
      allowFileSystemAccess: false,
      ...config,
    }

    if (this.config.enabled) {
      // 异步初始化，但不等待完成
      this.initializeIsolate().catch(error => {
        console.error(`Failed to initialize sandbox for ${this.extensionContext.name}:`, error)
      })
    }
  }

  /**
   * 初始化isolated-vm沙箱
   */
  private async initializeIsolate(): Promise<void> {
    if (!ivm) {
      console.warn(
        `[Sandbox] isolated-vm not available for extension: ${this.extensionContext.name}, running in unsafe mode`
      )
      return
    }

    try {
      // 创建隔离实例
      this.isolate = new ivm.Isolate({ 
        memoryLimit: Math.floor(this.config.memoryLimit / 1024 / 1024), // MB
        inspector: false 
      })
      
      // 创建上下文
      this.context = await this.isolate.createContext()
      
      // 设置全局对象
      await this.setupSandboxGlobals()

      console.info(`[Sandbox] isolated-vm initialized for extension: ${this.extensionContext.name}`)
    } catch (error) {
      console.error(`[Sandbox] Failed to initialize isolated-vm for ${this.extensionContext.name}:`, error)
      throw error
    }
  }

  /**
   * 设置沙箱全局对象
   */
  private async setupSandboxGlobals(): Promise<void> {
    if (!this.context || !ivm) return

    const global = this.context.global
    
    // 设置基础全局对象
    await global.set('console', this.createSandboxedConsole(), { reference: true })
    await global.set('setTimeout', this.createSandboxedTimeout(), { reference: true })
    await global.set('setInterval', this.createSandboxedInterval(), { reference: true })
    
    // 设置Extension API
    await global.set('extension', this.createExtensionAPI(), { reference: true })
    
    // 设置安全的工具对象
    await global.set('JSON', new ivm.Reference(JSON))
    await global.set('Math', new ivm.Reference(Math))
    await global.set('Date', new ivm.Reference(Date))
    await global.set('Array', new ivm.Reference(Array))
    await global.set('Object', new ivm.Reference(Object))
    await global.set('String', new ivm.Reference(String))
    await global.set('Number', new ivm.Reference(Number))
    await global.set('Boolean', new ivm.Reference(Boolean))
    await global.set('RegExp', new ivm.Reference(RegExp))
    await global.set('Error', new ivm.Reference(Error))
    await global.set('Promise', new ivm.Reference(Promise))
  }

  /**
   * 创建沙箱环境（保留用于向后兼容）
   */
  private createSandboxEnvironment(): Record<string, unknown> {
    const sandbox: Record<string, unknown> = {
      // 基础全局对象
      console: this.createSandboxedConsole(),
      setTimeout: this.createSandboxedTimeout(),
      setInterval: this.createSandboxedInterval(),
      clearTimeout: globalThis.clearTimeout,
      clearInterval: globalThis.clearInterval,

      // Extension API
      extension: this.createExtensionAPI(),

      // 安全的工具函数
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,

      // 异步支持
      Promise: Promise,
    }

    // 移除被禁止的全局变量
    this.config.blockedGlobals.forEach(global => {
      delete sandbox[global]
    })

    return sandbox
  }

  /**
   * 创建受限的console对象
   */
  private createSandboxedConsole(): Console {
    const prefix = `[Extension:${this.extensionContext.name}]`

    return {
      log: (...args: unknown[]) => this.extensionContext.logger.info(prefix, ...args),
      info: (...args: unknown[]) => this.extensionContext.logger.info(prefix, ...args),
      warn: (...args: unknown[]) => this.extensionContext.logger.warn(prefix, ...args),
      error: (...args: unknown[]) => this.extensionContext.logger.error(prefix, ...args),
      debug: (...args: unknown[]) => this.extensionContext.logger.debug(prefix, ...args),
    } as Console
  }

  /**
   * 创建受限的setTimeout
   */
  private createSandboxedTimeout(): (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => NodeJS.Timeout {
    return (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => {
      // 限制最大延迟时间
      const maxDelay = 60000 // 1分钟
      const safeDelay = Math.min(delay, maxDelay)

      return setTimeout(() => {
        try {
          callback(...args)
        } catch (error) {
          this.extensionContext.logger.error(`Timeout callback error:`, error)
        }
      }, safeDelay)
    }
  }

  /**
   * 创建受限的setInterval
   */
  private createSandboxedInterval(): (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => NodeJS.Timeout {
    return (callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => {
      // 限制最小间隔时间
      const minInterval = 100 // 100ms
      const safeInterval = Math.max(delay, minInterval)

      return setInterval(() => {
        try {
          callback(...args)
        } catch (error) {
          this.extensionContext.logger.error(`Interval callback error:`, error)
        }
      }, safeInterval)
    }
  }

  /**
   * 创建Extension API
   */
  private createExtensionAPI(): Record<string, unknown> {
    return {
      // 配置访问
      config: this.extensionContext.config,

      // 事件系统
      events: {
        emit: (event: string, data?: unknown) => {
          this.extensionContext.events.emit(event, data)
        },
        on: (event: string, handler: (data: unknown) => void) => {
          this.extensionContext.events.on(event, handler)
        },
        off: (event: string, handler: (data: unknown) => void) => {
          this.extensionContext.events.off(event, handler)
        },
      },

      // 存储访问
      storage: {
        get: async (key: string) => {
          await this.requirePermission('database:read')
          return this.extensionContext.storage.get(key)
        },
        set: async (key: string, value: unknown) => {
          await this.requirePermission('database:write')
          return this.extensionContext.storage.set(key, value)
        },
        delete: async (key: string) => {
          await this.requirePermission('database:write')
          return this.extensionContext.storage.delete(key)
        },
        clear: async () => {
          await this.requirePermission('database:write')
          return this.extensionContext.storage.clear()
        },
      },

      // 网络访问（如果允许）
      ...(this.config.allowNetworkAccess && {
        fetch: async (url: string, options?: RequestInit) => {
          await this.requirePermission('api:read')
          return fetch(url, options)
        },
      }),

      // 权限检查
      hasPermission: async (permission: ExtensionPermission) => {
        return this.permissionManager.checkPermission(this.extensionContext.name, permission)
      },

      // 日志记录
      logger: this.extensionContext.logger,
    }
  }

  /**
   * 要求权限
   */
  private async requirePermission(permission: ExtensionPermission): Promise<void> {
    const hasPermission = await this.permissionManager.checkPermission(
      this.extensionContext.name,
      permission
    )

    if (!hasPermission) {
      throw new Error(`Extension ${this.extensionContext.name} does not have permission: ${permission}`)
    }
  }

  /**
   * 执行代码
   */
  async executeCode(
    code: string,
    functionName: string = 'anonymous',
    args: unknown[] = []
  ): Promise<unknown> {
    if (!this.config.enabled) {
      // 如果沙箱未启用，直接执行
      return this.executeUnsafe(code, args)
    }

    if (!this.isolate || !this.context) {
      throw new Error('Isolate not initialized')
    }

    const executionId = this.generateExecutionId()
    const execution: SandboxExecution = {
      id: executionId,
      extensionName: this.extensionContext.name,
      functionName,
      startTime: Date.now(),
      status: 'running',
      resourceUsage: {
        memory: 0,
        cpu: 0,
        duration: 0,
      },
    }

    this.executions.set(executionId, execution)
    this.activeExecutions.add(executionId)

    try {
      this.emit('executionStart', execution)

      // 编译代码
      const script = await this.isolate.compileScript(code, { filename: 'extension.js' })
      
      // 执行代码
      const result = await script.run(this.context, { timeout: this.config.timeout })

      execution.endTime = Date.now()
      execution.status = 'completed'
      execution.result = result
      execution.resourceUsage.duration = execution.endTime - execution.startTime

      this.emit('executionComplete', execution)
      return result
    } catch (error) {
      execution.endTime = Date.now()
      execution.status = (error instanceof Error && error.message?.includes('timeout')) ? 'timeout' : 'failed'
      execution.error = error instanceof Error ? error : new Error(String(error))
      execution.resourceUsage.duration = execution.endTime - execution.startTime

      this.emit('executionError', execution)
      throw error
    } finally {
      this.activeExecutions.delete(executionId)
    }
  }

  /**
   * 执行函数（不安全模式）
   */
  private async executeUnsafe(code: string, args: unknown[]): Promise<unknown> {
    const func = new Function(...args.map((_, i) => `arg${i}`), code)
    return func(...args)
  }

  /**
   * 执行沙箱化的函数
   */
  async executeSandboxedFunction(
    sandboxedFunction: SandboxedFunction,
    args: unknown[] = []
  ): Promise<unknown> {
    // 检查权限
    for (const permission of sandboxedFunction.permissions) {
      await this.requirePermission(permission)
    }

    // 执行函数
    return sandboxedFunction.execute(...args)
  }

  /**
   * 停止所有正在执行的代码
   */
  stopAllExecutions(): void {
    this.activeExecutions.forEach(executionId => {
      const execution = this.executions.get(executionId)
      if (execution && execution.status === 'running') {
        execution.status = 'failed'
        execution.error = new Error('Execution stopped by sandbox')
        execution.endTime = Date.now()
        execution.resourceUsage.duration = execution.endTime - execution.startTime
      }
    })

    this.activeExecutions.clear()

    // 重新初始化Isolate
    if (this.config.enabled) {
      this.initializeIsolate().catch(error => {
        console.error(`Failed to reinitialize sandbox for ${this.extensionContext.name}:`, error)
      })
    }
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(): SandboxExecution[] {
    return Array.from(this.executions.values())
  }

  /**
   * 获取活跃执行
   */
  getActiveExecutions(): SandboxExecution[] {
    return Array.from(this.activeExecutions)
      .map(id => this.executions.get(id)!)
      .filter(Boolean)
  }

  /**
   * 清理执行历史
   */
  clearExecutionHistory(): void {
    this.executions.clear()
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (this.config.enabled && !this.isolate) {
      this.initializeIsolate().catch(error => {
        console.error(`Failed to reinitialize sandbox for ${this.extensionContext.name}:`, error)
      })
    } else if (!this.config.enabled && this.isolate) {
      this.isolate.dispose()
      this.isolate = undefined
      this.context = undefined
    }
  }

  /**
   * 获取沙箱状态
   */
  getStatus(): {
    enabled: boolean
    activeExecutions: number
    totalExecutions: number
    memoryUsage: number
    config: SandboxConfig
  } {
    return {
      enabled: this.config.enabled,
      activeExecutions: this.activeExecutions.size,
      totalExecutions: this.executions.size,
      memoryUsage: this.calculateMemoryUsage(),
      config: this.config,
    }
  }

  /**
   * 计算内存使用量
   */
  private calculateMemoryUsage(): number {
    // 简化实现，实际应用中需要更精确的内存监控
    return this.executions.size * 1024 // 假设每个执行记录占用1KB
  }

  /**
   * 生成执行ID
   */
  private generateExecutionId(): string {
    return `${this.extensionContext.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 销毁沙箱
   */
  destroy(): void {
    this.stopAllExecutions()
    if (this.isolate) {
      this.isolate.dispose()
      this.isolate = undefined
      this.context = undefined
    }
    this.executions.clear()
    this.removeAllListeners()
  }
}

/**
 * 创建沙箱实例
 */
export function createSandbox(
  context: ExtensionContext,
  permissionManager: ExtensionPermissionManager,
  config?: Partial<SandboxConfig>
): ExtensionSandbox {
  return new ExtensionSandbox(context, permissionManager, config)
}
