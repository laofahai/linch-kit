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
  private pluginStatuses = new Map<string, PluginStatus>()

  /**
   * Register a plugin with the registry (synchronous version for tests)
   */
  registerSync(plugin: Plugin, config: PluginConfig = {}): void {
    // Validate plugin metadata
    this.validatePluginMetadata(plugin)
    
    // Validate plugin lifecycle methods
    this.validatePluginMethods(plugin)

    const { id } = plugin.metadata

    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already registered`)
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
    this.pluginStatuses.set(id, 'registered')

    this.safeEmit('pluginRegistered', { type: 'pluginRegistered', plugin })
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.plugin
  }

  /**
   * Get all plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).map(reg => reg.plugin)
  }

  /**
   * Check if plugin exists
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginId: string): PluginStatus | undefined {
    return this.pluginStatuses.get(pluginId)
  }

  /**
   * Set plugin status
   */
  setPluginStatus(pluginId: string, status: PluginStatus): void {
    this.pluginStatuses.set(pluginId, status)
    const registration = this.plugins.get(pluginId)
    if (registration) {
      registration.status = status
    }
  }

  /**
   * Start a plugin
   */
  async startPlugin(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (this.pluginStatuses.get(pluginId) === 'started') {
      return // Already started
    }

    if (!registration.config.enabled) {
      throw new Error(`Plugin ${pluginId} is disabled`)
    }

    try {
      // Check and start dependencies first
      await this.startDependencies(registration.plugin.metadata.dependencies || [])

      // Execute lifecycle hooks
      if (registration.plugin.init) {
        await registration.plugin.init(registration.config)
      }

      if (registration.plugin.setup) {
        await registration.plugin.setup(registration.config)
      }

      if (registration.plugin.start) {
        await registration.plugin.start(registration.config)
      }

      if (registration.plugin.ready) {
        await registration.plugin.ready(registration.config)
      }

      this.setPluginStatus(pluginId, 'started')
      this.safeEmit('pluginStarted', { type: 'pluginStarted', pluginId, plugin: registration.plugin })
    } catch (error) {
      this.setPluginStatus(pluginId, 'error')
      throw error
    }
  }

  /**
   * Stop a plugin
   */
  async stopPlugin(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (this.pluginStatuses.get(pluginId) !== 'started') {
      return // Not started
    }

    try {
      // Stop dependents first
      await this.stopDependents(pluginId)

      // Execute stop hook
      if (registration.plugin.stop) {
        await registration.plugin.stop(registration.config)
      }

      this.setPluginStatus(pluginId, 'stopped')
      this.safeEmit('pluginStopped', { type: 'pluginStopped', pluginId, plugin: registration.plugin })
    } catch (error) {
      this.setPluginStatus(pluginId, 'error')
      throw error
    }
  }

  /**
   * Start all plugins
   */
  async startAll(): Promise<OperationResult[]> {
    const results: OperationResult[] = []
    
    for (const [pluginId, registration] of this.plugins) {
      if (registration.config.enabled) {
        try {
          await this.startPlugin(pluginId)
          results.push({ success: true })
        } catch (error) {
          results.push({ 
            success: false, 
            error: { 
              code: 'START_FAILED', 
              message: error instanceof Error ? error.message : 'Unknown error' 
            } 
          })
        }
      }
    }
    
    return results
  }

  /**
   * Stop all plugins
   */
  async stopAll(): Promise<OperationResult[]> {
    const results: OperationResult[] = []
    
    for (const [pluginId] of this.plugins) {
      if (this.pluginStatuses.get(pluginId) === 'started') {
        try {
          await this.stopPlugin(pluginId)
          results.push({ success: true })
        } catch (error) {
          results.push({ 
            success: false, 
            error: { 
              code: 'STOP_FAILED', 
              message: error instanceof Error ? error.message : 'Unknown error' 
            } 
          })
        }
      }
    }
    
    return results
  }

  /**
   * Validate plugin metadata
   */
  private validatePluginMetadata(plugin: Plugin): void {
    if (!plugin.metadata?.id) {
      throw new Error('Plugin ID is required')
    }
    if (!plugin.metadata?.name) {
      throw new Error('Plugin name is required')
    }
    if (!plugin.metadata?.version) {
      throw new Error('Plugin version is required')
    }
    if (plugin.metadata?.dependencies && !Array.isArray(plugin.metadata.dependencies)) {
      throw new Error('Dependencies must be an array')
    }
  }

  /**
   * Validate plugin methods
   */
  private validatePluginMethods(plugin: Plugin): void {
    if (!plugin.init || typeof plugin.init !== 'function') {
      throw new Error('Plugin must implement required lifecycle methods')
    }
  }

  /**
   * Start plugin dependencies
   */
  private async startDependencies(dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Dependency ${depId} not found`)
      }
      
      // Check for circular dependencies
      if (this.hasCircularDependency(depId, dependencies)) {
        throw new Error('Circular dependency detected')
      }
      
      await this.startPlugin(depId)
    }
  }

  /**
   * Stop plugin dependents
   */
  private async stopDependents(pluginId: string): Promise<void> {
    for (const [id, registration] of this.plugins) {
      const deps = registration.plugin.metadata.dependencies || []
      if (deps.includes(pluginId) && this.pluginStatuses.get(id) === 'started') {
        await this.stopPlugin(id)
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(pluginId: string, dependencies: string[]): boolean {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const visit = (id: string): boolean => {
      if (visited.has(id)) return false
      if (visiting.has(id)) return true
      
      visiting.add(id)
      
      const plugin = this.plugins.get(id)
      if (plugin) {
        const deps = plugin.plugin.metadata.dependencies || []
        for (const depId of deps) {
          if (visit(depId)) return true
        }
      }
      
      visiting.delete(id)
      visited.add(id)
      return false
    }
    
    return visit(pluginId)
  }

  // PluginManager interface methods (async versions)
  async register(plugin: Plugin, config: PluginConfig = {}): Promise<OperationResult> {
    try {
      this.registerSync(plugin, config)
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

  async unregister(pluginId: string): Promise<OperationResult> {
    try {
      const registration = this.plugins.get(pluginId)
      if (!registration) {
        return { success: false, error: { code: 'PLUGIN_NOT_FOUND', message: `Plugin ${pluginId} not found` } }
      }

      // Check for dependents
      const dependents = this.getDependents(pluginId)
      if (dependents.length > 0) {
        return { 
          success: false, 
          error: { code: 'PLUGIN_HAS_DEPENDENTS', message: `Cannot unregister ${pluginId}: required by ${dependents.join(', ')}` } 
        }
      }

      // Stop plugin if running
      if (this.pluginStatuses.get(pluginId) === 'started') {
        await this.stopPlugin(pluginId)
      }

      // Execute destroy hook
      if (registration.plugin.destroy) {
        await registration.plugin.destroy(registration.config)
      }

      this.plugins.delete(pluginId)
      this.pluginStatuses.delete(pluginId)
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
      await this.startPlugin(pluginId)
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

  async stop(pluginId: string): Promise<OperationResult> {
    try {
      await this.stopPlugin(pluginId)
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
    return this.pluginStatuses.get(pluginId)
  }

  /**
   * Get all started plugins
   */
  getStartedPlugins(): Plugin[] {
    const started: Plugin[] = []
    for (const [pluginId, registration] of this.plugins) {
      if (this.pluginStatuses.get(pluginId) === 'started') {
        started.push(registration.plugin)
      }
    }
    return started
  }

  /**
   * Get all failed plugins
   */
  getFailedPlugins(): Plugin[] {
    const failed: Plugin[] = []
    for (const [pluginId, registration] of this.plugins) {
      if (this.pluginStatuses.get(pluginId) === 'error') {
        failed.push(registration.plugin)
      }
    }
    return failed
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

  /**
   * Safely emit events, catching any listener errors
   */
  private safeEmit(event: string, ...args: any[]): void {
    try {
      this.emit(event, ...args)
    } catch (error) {
      // Log error but don't let it break plugin operations
      console.error(`Error in event listener for ${event}:`, error)
    }
  }
}

/**
 * 默认插件注册表实例
 */
export const pluginRegistry = new PluginRegistry()