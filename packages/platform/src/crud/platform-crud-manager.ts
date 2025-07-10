/**
 * 平台CRUD管理器 - 扩展基础CRUD功能
 * @module platform/crud/platform-crud-manager
 */

import type { ExtensionContext } from '@linch-kit/core/extension/types'

import { CrudManager } from './crud-manager'

/**
 * 平台CRUD管理器
 * 为Extension系统提供增强的CRUD能力
 */
export class PlatformCrudManager extends CrudManager {
  private extensionContext?: ExtensionContext

  /**
   * 设置Extension上下文
   */
  setExtensionContext(context: ExtensionContext): void {
    this.extensionContext = context
  }

  /**
   * 获取Extension上下文
   */
  getExtensionContext(): ExtensionContext | undefined {
    return this.extensionContext
  }

  /**
   * Extension感知的CRUD操作
   */
  async extensionAwareCreate<T>(entityName: string, data: Partial<T>): Promise<T> {
    // 记录Extension操作日志
    this.extensionContext?.logger.info(`CRUD create operation on ${entityName}`)

    // 触发Extension事件
    this.extensionContext?.events.emit('crud:before:create', { entityName, data })

    const result = await this.create(entityName, data)

    this.extensionContext?.events.emit('crud:after:create', { entityName, data, result })

    return result
  }

  /**
   * Extension感知的查询操作
   */
  async extensionAwareFind<T>(entityName: string, query: Record<string, unknown>): Promise<T[]> {
    this.extensionContext?.logger.info(`CRUD find operation on ${entityName}`)

    this.extensionContext?.events.emit('crud:before:find', { entityName, query })

    const result = await this.find(entityName, query)

    this.extensionContext?.events.emit('crud:after:find', { entityName, query, result })

    return result
  }
}
