/**
 * 插件注册表实现
 * @module plugin/registry
 */

import { EventEmitter } from 'eventemitter3'

import type { 
  Plugin, 
  PluginRegistration, 
  PluginManager, 
  PluginConfig, 
  PluginStatus,
  OperationResult 
} from '../types'

/**
 * 插件注册表
 */
export class PluginRegistry extends EventEmitter implements PluginManager {
  private plugins = new Map<string, PluginRegistration>()

  async register(plugin: Plugin, config: PluginConfig = {}): Promise<OperationResult> {
    try {
      const { id } = plugin.metadata

      if (this.plugins.has(id)) {
        return { success: false, error: { code: 'PLUGIN_ALREADY_REGISTERED', message: `Plugin ${id} already registered` } }
      }

      // 检查依赖
      const missingDeps = await this.checkDependencies(plugin.metadata.dependencies || [])
      if (missingDeps.length > 0) {
        return { 
          success: false, 
          error: { code: 'MISSING_DEPENDENCIES', message: `Missing dependencies: ${missingDeps.join(', ')}` } 
        }
      }

      // 合并配置
      const finalConfig = { ...plugin.defaultConfig, ...config, enabled: config.enabled ?? true }

      const registration: PluginRegistration = {
        plugin,
        config: finalConfig,
        status: 'registered',
        registeredAt: Date.now()
      }

      this.plugins.set(id, registration)

      // 执行初始化
      if (plugin.init) {
        await plugin.init(finalConfig)
        registration.status = 'initialized'
      }

      this.emit('plugin:registered', { pluginId: id, plugin, config: finalConfig })

      return { success: true, data: registration }
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'OPERATION_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } 
      }
    }
  }

  async unregister(pluginId: string): Promise<OperationResult> {
    try {
      const registration = this.plugins.get(pluginId)
      if (!registration) {
        return { success: false, error: { code: 'PLUGIN_NOT_FOUND', message: `Plugin ${pluginId} not found` } }
      }

      // 检查依赖关系
      const dependents = this.getDependents(pluginId)
      if (dependents.length > 0) {
        return { 
          success: false, 
          error: { code: 'PLUGIN_HAS_DEPENDENTS', message: `Cannot unregister ${pluginId}: required by ${dependents.join(', ')}` } 
        }
      }

      // 停止插件
      if (registration.status === 'started') {
        await this.stop(pluginId)
      }

      // 执行销毁
      if (registration.plugin.destroy) {
        await registration.plugin.destroy(registration.config)
      }

      this.plugins.delete(pluginId)
      this.emit('plugin:unregistered', { pluginId })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'OPERATION_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } 
      }
    }
  }

  async start(pluginId: string): Promise<OperationResult> {
    try {
      const registration = this.plugins.get(pluginId)
      if (!registration) {
        return { success: false, error: { code: 'PLUGIN_NOT_FOUND', message: `Plugin ${pluginId} not found` } }
      }

      if (registration.status === 'started') {
        return { success: true, message: `Plugin ${pluginId} already started` }
      }

      if (!registration.config.enabled) {
        return { success: false, error: { code: 'PLUGIN_DISABLED', message: `Plugin ${pluginId} is disabled` } }
      }

      // 启动依赖插件
      for (const depId of registration.plugin.metadata.dependencies || []) {
        const depResult = await this.start(depId)
        if (!depResult.success) {
          return { 
            success: false, 
            error: { 
              code: 'DEPENDENCY_START_FAILED', 
              message: `Failed to start dependency ${depId}`,
              details: { dependencyId: depId, originalError: depResult.error }
            } 
          }
        }
      }

      // 执行设置
      if (registration.plugin.setup) {
        await registration.plugin.setup(registration.config)
      }

      // 执行启动
      if (registration.plugin.start) {
        await registration.plugin.start(registration.config)
      }

      registration.status = 'started'

      // 执行就绪回调
      if (registration.plugin.ready) {
        await registration.plugin.ready(registration.config)
      }

      this.emit('plugin:started', { pluginId, plugin: registration.plugin })

      return { success: true }
    } catch (error) {
      const registration = this.plugins.get(pluginId)
      if (registration) {
        registration.status = 'error'
      }
      return { 
        success: false, 
        error: { 
          code: 'OPERATION_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } 
      }
    }
  }

  async stop(pluginId: string): Promise<OperationResult> {
    try {
      const registration = this.plugins.get(pluginId)
      if (!registration) {
        return { success: false, error: { code: 'PLUGIN_NOT_FOUND', message: `Plugin ${pluginId} not found` } }
      }

      if (registration.status !== 'started') {
        return { success: true, message: `Plugin ${pluginId} not started` }
      }

      // 检查依赖关系
      const dependents = this.getDependents(pluginId)
      for (const depId of dependents) {
        const depResult = await this.stop(depId)
        if (!depResult.success) {
          return { 
            success: false, 
            error: { 
              code: 'DEPENDENT_STOP_FAILED', 
              message: `Failed to stop dependent ${depId}`,
              details: { dependentId: depId, originalError: depResult.error }
            } 
          }
        }
      }

      // 执行停止
      if (registration.plugin.stop) {
        await registration.plugin.stop(registration.config)
      }

      registration.status = 'stopped'
      this.emit('plugin:stopped', { pluginId, plugin: registration.plugin })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'OPERATION_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } 
      }
    }
  }

  get(pluginId: string): PluginRegistration | undefined {
    return this.plugins.get(pluginId)
  }

  getAll(): PluginRegistration[] {
    return Array.from(this.plugins.values())
  }

  has(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  getStatus(pluginId: string): PluginStatus | undefined {
    return this.plugins.get(pluginId)?.status
  }

  async startAll(): Promise<OperationResult[]> {
    const results: OperationResult[] = []
    
    // 按优先级和依赖顺序启动
    const sorted = this.sortByPriorityAndDependencies()
    
    for (const registration of sorted) {
      if (registration.config.enabled) {
        const result = await this.start(registration.plugin.metadata.id)
        results.push(result)
      }
    }
    
    return results
  }

  async stopAll(): Promise<OperationResult[]> {
    const results: OperationResult[] = []
    
    // 反向停止
    const sorted = this.sortByPriorityAndDependencies().reverse()
    
    for (const registration of sorted) {
      if (registration.status === 'started') {
        const result = await this.stop(registration.plugin.metadata.id)
        results.push(result)
      }
    }
    
    return results
  }

  private async checkDependencies(dependencies: string[]): Promise<string[]> {
    const missing: string[] = []
    
    for (const depId of dependencies) {
      if (!this.plugins.has(depId)) {
        missing.push(depId)
      }
    }
    
    return missing
  }

  private getDependents(pluginId: string): string[] {
    const dependents: string[] = []
    
    for (const [id, registration] of this.plugins) {
      const deps = registration.plugin.metadata.dependencies || []
      if (deps.includes(pluginId)) {
        dependents.push(id)
      }
    }
    
    return dependents
  }

  private sortByPriorityAndDependencies(): PluginRegistration[] {
    const sorted: PluginRegistration[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const visit = (pluginId: string): void => {
      if (visited.has(pluginId)) return
      if (visiting.has(pluginId)) {
        throw new Error(`Circular dependency detected: ${pluginId}`)
      }
      
      visiting.add(pluginId)
      
      const registration = this.plugins.get(pluginId)
      if (!registration) return
      
      // 先处理依赖
      for (const depId of registration.plugin.metadata.dependencies || []) {
        visit(depId)
      }
      
      visiting.delete(pluginId)
      visited.add(pluginId)
      sorted.push(registration)
    }
    
    // 按优先级排序
    const byPriority = Array.from(this.plugins.values()).sort((a, b) => {
      const priorityA = a.config.priority ?? 0
      const priorityB = b.config.priority ?? 0
      return priorityB - priorityA // 高优先级在前
    })
    
    for (const registration of byPriority) {
      visit(registration.plugin.metadata.id)
    }
    
    return sorted
  }
}

/**
 * 默认插件注册表实例
 */
export const pluginRegistry = new PluginRegistry()