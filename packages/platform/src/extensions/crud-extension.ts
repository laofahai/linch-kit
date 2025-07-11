/**
 * CRUD Extension适配器 - 基于LinchKit Extension系统提供CRUD能力
 * @module platform/extensions/crud-extension
 *
 * 注意：这不是CRUD的重复实现，而是Extension系统的适配器
 */

import type { ExtensionContext } from '@linch-kit/core'
import { z } from 'zod'

/**
 * CRUD操作接口 - 由Extension系统提供
 */
export interface CRUDOperations<T = unknown> {
  create(data: Partial<T>): Promise<T>
  findById(id: string | number): Promise<T | null>
  find(query: Record<string, unknown>): Promise<T[]>
  update(id: string | number, data: Partial<T>): Promise<T>
  delete(id: string | number): Promise<boolean>
}

/**
 * CRUD Extension配置
 */
export interface CRUDExtensionConfig {
  /** Extension上下文 */
  extensionContext: ExtensionContext
  /** 是否启用审计日志 */
  enableAudit?: boolean
  /** 是否启用事件 */
  enableEvents?: boolean
}

/**
 * CRUD Extension适配器
 *
 * 使用LinchKit的Extension系统提供CRUD能力，而不是重复实现
 * 这是platform包正确的实现方式
 */
export class CRUDExtension {
  private config: Required<CRUDExtensionConfig>

  constructor(config: CRUDExtensionConfig) {
    this.config = {
      enableAudit: true,
      enableEvents: true,
      ...config,
    }
  }

  /**
   * 创建实体的CRUD操作
   *
   * 注意：这里不实现具体的CRUD逻辑，而是：
   * 1. 利用Extension的事件系统
   * 2. 集成Extension的权限检查
   * 3. 使用Extension的日志功能
   */
  createEntityOperations<T>(entityName: string, schema: z.ZodSchema<T>): CRUDOperations<T> {
    const { extensionContext } = this.config

    return {
      create: async (data: Partial<T>): Promise<T> => {
        // 验证数据
        const validated = schema.parse(data)

        // 触发Extension事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:before:create', {
            entity: entityName,
            data: validated,
          })
        }

        // 审计日志
        if (this.config.enableAudit) {
          extensionContext.logger.info(`Creating ${entityName}`, { data: validated })
        }

        // 注意：实际的数据存储应该由应用层或其他服务处理
        // platform包只提供Extension集成
        const result = { id: Date.now(), ...validated } as T

        // 触发完成事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:after:create', {
            entity: entityName,
            result,
          })
        }

        return result
      },

      findById: async (id: string | number): Promise<T | null> => {
        // 触发查询事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:before:find', {
            entity: entityName,
            id,
          })
        }

        // 审计日志
        extensionContext.logger.debug(`Finding ${entityName} by id: ${id}`)

        // 实际查询应由应用层处理
        return null
      },

      find: async (query: Record<string, unknown>): Promise<T[]> => {
        // 触发查询事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:before:find', {
            entity: entityName,
            query,
          })
        }

        // 审计日志
        extensionContext.logger.debug(`Finding ${entityName}`, { query })

        // 实际查询应由应用层处理
        return []
      },

      update: async (id: string | number, data: Partial<T>): Promise<T> => {
        // 验证更新数据
        const validated = (schema as unknown as z.ZodObject<Record<string, z.ZodTypeAny>>)
          .partial()
          .parse(data)

        // 触发更新事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:before:update', {
            entity: entityName,
            id,
            data: validated,
          })
        }

        // 审计日志
        if (this.config.enableAudit) {
          extensionContext.logger.info(`Updating ${entityName} #${id}`, { data: validated })
        }

        // 实际更新应由应用层处理
        const result = { id, ...validated } as T

        // 触发完成事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:after:update', {
            entity: entityName,
            id,
            result,
          })
        }

        return result
      },

      delete: async (id: string | number): Promise<boolean> => {
        // 触发删除事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:before:delete', {
            entity: entityName,
            id,
          })
        }

        // 审计日志
        if (this.config.enableAudit) {
          extensionContext.logger.info(`Deleting ${entityName} #${id}`)
        }

        // 实际删除应由应用层处理
        const success = true

        // 触发完成事件
        if (this.config.enableEvents) {
          await extensionContext.events.emit('crud:after:delete', {
            entity: entityName,
            id,
            success,
          })
        }

        return success
      },
    }
  }

  /**
   * 注册CRUD事件处理器
   */
  registerEventHandlers(handlers: {
    beforeCreate?: (data: unknown) => Promise<void>
    afterCreate?: (result: unknown) => Promise<void>
    beforeUpdate?: (data: unknown) => Promise<void>
    afterUpdate?: (result: unknown) => Promise<void>
    beforeDelete?: (id: unknown) => Promise<void>
    afterDelete?: (success: boolean) => Promise<void>
  }): void {
    const { extensionContext } = this.config

    if (handlers.beforeCreate) {
      extensionContext.events.on('crud:before:create', handlers.beforeCreate)
    }
    if (handlers.afterCreate) {
      extensionContext.events.on('crud:after:create', handlers.afterCreate)
    }
    if (handlers.beforeUpdate) {
      extensionContext.events.on('crud:before:update', handlers.beforeUpdate)
    }
    if (handlers.afterUpdate) {
      extensionContext.events.on('crud:after:update', handlers.afterUpdate)
    }
    if (handlers.beforeDelete) {
      extensionContext.events.on('crud:before:delete', handlers.beforeDelete)
    }
    if (handlers.afterDelete) {
      extensionContext.events.on('crud:after:delete', (data: unknown) => {
        const deleteData = data as { success?: boolean }
        handlers.afterDelete!(deleteData.success || false)
      })
    }
  }
}

/**
 * 创建CRUD Extension实例的便捷函数
 */
export function createCRUDExtension(extensionContext: ExtensionContext): CRUDExtension {
  return new CRUDExtension({ extensionContext })
}
