/**
 * 钩子管理器 - 管理和执行各种细粒度的钩子
 * 
 * 支持的钩子类型：
 * - 全局钩子：所有实体和操作
 * - 实体级钩子：特定实体的操作  
 * - 字段级钩子：特定字段的变更
 * - 条件钩子：基于业务条件触发
 */

import type { Logger } from '@linch-kit/core'

import type { 
  CrudPlugin, 
  CrudPluginHooks, 
  HookContext, 
  FieldChange,
  CreateInput,
  UpdateInput,
  CrudOptions,
  FindOptions
} from './types'

/**
 * 钩子执行结果
 */
interface HookExecutionResult<T = unknown> {
  success: boolean
  result?: T
  error?: Error
  plugin?: string
  executionTime: number
}

/**
 * 钩子管理器
 */
export class HookManager {
  private plugins: Map<string, CrudPlugin> = new Map()
  private hookCache: Map<string, CrudPlugin[]> = new Map()

  constructor(private readonly logger: Logger) {}

  /**
   * 注册插件
   */
  registerPlugin(plugin: CrudPlugin): void {
    if (this.plugins.has(plugin.name)) {
      this.logger.warn(`Plugin ${plugin.name} is already registered, skipping`)
      return
    }

    this.plugins.set(plugin.name, plugin)
    this.clearHookCache()
    this.logger.info(`Plugin ${plugin.name} registered successfully`)
  }

  /**
   * 注销插件
   */
  unregisterPlugin(pluginName: string): void {
    if (this.plugins.delete(pluginName)) {
      this.clearHookCache()
      this.logger.info(`Plugin ${pluginName} unregistered successfully`)
    }
  }

  /**
   * 获取所有插件
   */
  getPlugins(): CrudPlugin[] {
    return Array.from(this.plugins.values())
  }

  // 全局钩子执行方法

  /**
   * 执行创建前钩子
   */
  async executeBeforeCreateHooks<T>(
    entityName: string,
    data: CreateInput<T>,
    context: HookContext
  ): Promise<CreateInput<T>> {
    let processedData = data

    // 执行全局钩子
    const globalPlugins = this.getPluginsWithHook('beforeCreate')
    for (const plugin of globalPlugins) {
      if (await this.shouldExecuteHook(plugin, 'beforeCreate', entityName, context)) {
        try {
          const result = await plugin.hooks!.beforeCreate!(entityName, processedData, context)
          processedData = result
        } catch (error) {
          this.handleHookError(plugin.name, 'beforeCreate', error as Error)
        }
      }
    }

    // 执行实体级钩子
    const entityPlugins = this.getPluginsWithHook('beforeEntityCreate', entityName)
    for (const plugin of entityPlugins) {
      if (await this.shouldExecuteHook(plugin, 'beforeEntityCreate', entityName, context)) {
        try {
          const result = await plugin.hooks!.beforeEntityCreate!(processedData, context)
          processedData = result
        } catch (error) {
          this.handleHookError(plugin.name, 'beforeEntityCreate', error as Error)
        }
      }
    }

    return processedData
  }

  /**
   * 执行创建后钩子
   */
  async executeAfterCreateHooks<T>(
    entityName: string,
    result: T,
    context: HookContext
  ): Promise<void> {
    // 执行全局钩子
    const globalPlugins = this.getPluginsWithHook('afterCreate')
    for (const plugin of globalPlugins) {
      if (await this.shouldExecuteHook(plugin, 'afterCreate', entityName, context)) {
        try {
          await plugin.hooks!.afterCreate!(entityName, result, context)
        } catch (error) {
          this.handleHookError(plugin.name, 'afterCreate', error as Error)
        }
      }
    }

    // 执行实体级钩子
    const entityPlugins = this.getPluginsWithHook('afterEntityCreate', entityName)
    for (const plugin of entityPlugins) {
      if (await this.shouldExecuteHook(plugin, 'afterEntityCreate', entityName, context)) {
        try {
          await plugin.hooks!.afterEntityCreate!(result, context)
        } catch (error) {
          this.handleHookError(plugin.name, 'afterEntityCreate', error as Error)
        }
      }
    }
  }

  /**
   * 执行更新前钩子
   */
  async executeBeforeUpdateHooks<T>(
    entityName: string,
    id: string,
    data: UpdateInput<T>,
    existing: unknown,
    context: HookContext
  ): Promise<UpdateInput<T>> {
    let processedData = data

    // 执行全局钩子
    const globalPlugins = this.getPluginsWithHook('beforeUpdate')
    for (const plugin of globalPlugins) {
      if (await this.shouldExecuteHook(plugin, 'beforeUpdate', entityName, context)) {
        try {
          const result = await plugin.hooks!.beforeUpdate!(entityName, id, processedData, existing, context)
          processedData = result
        } catch (error) {
          this.handleHookError(plugin.name, 'beforeUpdate', error as Error)
        }
      }
    }

    // 执行实体级钩子
    const entityPlugins = this.getPluginsWithHook('beforeEntityUpdate', entityName)
    for (const plugin of entityPlugins) {
      if (await this.shouldExecuteHook(plugin, 'beforeEntityUpdate', entityName, context)) {
        try {
          const result = await plugin.hooks!.beforeEntityUpdate!(id, processedData, existing, context)
          processedData = result
        } catch (error) {
          this.handleHookError(plugin.name, 'beforeEntityUpdate', error as Error)
        }
      }
    }

    return processedData
  }

  /**
   * 执行更新后钩子
   */
  async executeAfterUpdateHooks<T>(
    entityName: string,
    result: T,
    existing: unknown,
    changes: FieldChange[],
    context: HookContext
  ): Promise<void> {
    // 执行全局钩子
    const globalPlugins = this.getPluginsWithHook('afterUpdate')
    for (const plugin of globalPlugins) {
      if (await this.shouldExecuteHook(plugin, 'afterUpdate', entityName, context)) {
        try {
          await plugin.hooks!.afterUpdate!(entityName, result, existing, changes, context)
        } catch (error) {
          this.handleHookError(plugin.name, 'afterUpdate', error as Error)
        }
      }
    }

    // 执行实体级钩子
    const entityPlugins = this.getPluginsWithHook('afterEntityUpdate', entityName)
    for (const plugin of entityPlugins) {
      if (await this.shouldExecuteHook(plugin, 'afterEntityUpdate', entityName, context)) {
        try {
          await plugin.hooks!.afterEntityUpdate!(result, existing, changes, context)
        } catch (error) {
          this.handleHookError(plugin.name, 'afterEntityUpdate', error as Error)
        }
      }
    }

    // 执行字段级钩子
    await this.executeFieldUpdateHooks(entityName, changes, 'update', context)
  }

  // 字段级钩子执行方法

  /**
   * 执行字段级更新钩子
   */
  async executeFieldUpdateHooks(
    entityName: string,
    changes: FieldChange[],
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<void> {
    const fieldPlugins = this.getPluginsWithHook('afterFieldSet')

    for (const change of changes) {
      for (const plugin of fieldPlugins) {
        if (await this.shouldExecuteHook(plugin, 'afterFieldSet', entityName, context)) {
          try {
            await plugin.hooks!.afterFieldSet!(
              entityName,
              change.fieldName,
              change.oldValue,
              change.newValue,
              operation,
              context
            )
          } catch (error) {
            this.handleHookError(plugin.name, 'afterFieldSet', error as Error)
          }
        }
      }
    }
  }

  /**
   * 执行字段读取钩子
   */
  async executeFieldReadHooks(
    entityName: string,
    fieldName: string,
    value: unknown,
    context: HookContext
  ): Promise<unknown> {
    let processedValue = value

    const fieldPlugins = this.getPluginsWithHook('beforeFieldRead')
    for (const plugin of fieldPlugins) {
      if (await this.shouldExecuteHook(plugin, 'beforeFieldRead', entityName, context)) {
        try {
          processedValue = await plugin.hooks!.beforeFieldRead!(
            entityName,
            fieldName,
            processedValue,
            context
          )
        } catch (error) {
          this.handleHookError(plugin.name, 'beforeFieldRead', error as Error)
        }
      }
    }

    return processedValue
  }

  // 条件钩子执行方法

  /**
   * 执行状态变更钩子
   */
  async executeStatusChangeHooks<T>(
    entityName: string,
    id: string,
    oldStatus: string,
    newStatus: string,
    entity: T,
    context: HookContext
  ): Promise<void> {
    const statusPlugins = this.getPluginsWithHook('onStatusChange')
    
    for (const plugin of statusPlugins) {
      if (await this.shouldExecuteHook(plugin, 'onStatusChange', entityName, context)) {
        try {
          await plugin.hooks!.onStatusChange!(
            entityName,
            id,
            oldStatus,
            newStatus,
            entity,
            context
          )
        } catch (error) {
          this.handleHookError(plugin.name, 'onStatusChange', error as Error)
        }
      }
    }
  }

  /**
   * 执行关联变更钩子
   */
  async executeRelationChangeHooks<T>(
    entityName: string,
    id: string,
    relationName: string,
    changeType: 'connect' | 'disconnect' | 'set',
    relatedIds: string[],
    entity: T,
    context: HookContext
  ): Promise<void> {
    const relationPlugins = this.getPluginsWithHook('onRelationChange')
    
    for (const plugin of relationPlugins) {
      if (await this.shouldExecuteHook(plugin, 'onRelationChange', entityName, context)) {
        try {
          await plugin.hooks!.onRelationChange!(
            entityName,
            id,
            relationName,
            changeType,
            relatedIds,
            entity,
            context
          )
        } catch (error) {
          this.handleHookError(plugin.name, 'onRelationChange', error as Error)
        }
      }
    }
  }

  // 辅助方法

  /**
   * 获取具有特定钩子的插件
   */
  private getPluginsWithHook(hookName: keyof CrudPluginHooks, entityName?: string): CrudPlugin[] {
    const cacheKey = `${hookName}:${entityName || 'global'}`
    
    if (this.hookCache.has(cacheKey)) {
      return this.hookCache.get(cacheKey)!
    }

    const plugins = Array.from(this.plugins.values())
      .filter(plugin => plugin.hooks && plugin.hooks[hookName])
      .sort((a, b) => {
        // 按优先级排序
        const priorityA = a.hooks?.getHookPriority?.(hookName, entityName || '') || 100
        const priorityB = b.hooks?.getHookPriority?.(hookName, entityName || '') || 100
        return priorityA - priorityB
      })

    this.hookCache.set(cacheKey, plugins)
    return plugins
  }

  /**
   * 检查是否应该执行钩子
   */
  private async shouldExecuteHook(
    plugin: CrudPlugin,
    hookName: string,
    entityName: string,
    context: HookContext
  ): Promise<boolean> {
    if (!plugin.hooks?.shouldExecuteHook) {
      return true
    }

    try {
      return await plugin.hooks.shouldExecuteHook(hookName, entityName, context)
    } catch (error) {
      this.logger.error(`Error checking hook execution condition for ${plugin.name}.${hookName}`, { error })
      return false
    }
  }

  /**
   * 处理钩子执行错误
   */
  private handleHookError(pluginName: string, hookName: string, error: Error): void {
    this.logger.error(`Hook execution failed`, {
      plugin: pluginName,
      hook: hookName,
      error: error.message,
      stack: error.stack
    })

    // 可以选择是否抛出错误或继续执行
    // 这里选择记录日志但不中断流程
  }

  /**
   * 清除钩子缓存
   */
  private clearHookCache(): void {
    this.hookCache.clear()
  }

  /**
   * 计算字段变更
   */
  static calculateFieldChanges(
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>
  ): FieldChange[] {
    const changes: FieldChange[] = []
    const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)])

    for (const field of allFields) {
      const oldValue = oldData[field]
      const newValue = newData[field]

      if (!(field in oldData)) {
        changes.push({
          fieldName: field,
          oldValue: undefined,
          newValue,
          action: 'added'
        })
      } else if (!(field in newData)) {
        changes.push({
          fieldName: field,
          oldValue,
          newValue: undefined,
          action: 'removed'
        })
      } else if (oldValue !== newValue) {
        changes.push({
          fieldName: field,
          oldValue,
          newValue,
          action: 'modified'
        })
      }
    }

    return changes
  }

  /**
   * 创建钩子上下文
   */
  static createContext(
    entityName: string,
    operation: 'create' | 'read' | 'update' | 'delete' | 'query',
    user?: unknown,
    requestId?: string,
    metadata?: Record<string, unknown>
  ): HookContext {
    return {
      entityName,
      operation,
      user,
      timestamp: new Date(),
      requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata
    }
  }
}