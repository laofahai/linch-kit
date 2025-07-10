/**
 * Query Builder for platform package
 * @module platform/crud/query-builder
 */

import { EventEmitter } from 'eventemitter3'
import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * 查询条件接口
 */
export interface QueryCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike'
  value: unknown
}

/**
 * 查询选项接口
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>
  include?: string[]
  select?: string[]
}

/**
 * 查询构建器
 */
export class QueryBuilder<T = unknown> extends EventEmitter {
  private conditions: QueryCondition[] = []
  private options: QueryOptions = {}
  private entityName: string
  private extensionContext?: ExtensionContext

  constructor(entityName: string, extensionContext?: ExtensionContext) {
    super()
    this.entityName = entityName
    this.extensionContext = extensionContext
  }

  /**
   * 添加where条件
   */
  where(field: string, operator: QueryCondition['operator'], value: unknown): this {
    this.conditions.push({ field, operator, value })
    this.emit('conditionAdded', { field, operator, value })
    return this
  }

  /**
   * 简化的where条件（等于）
   */
  whereEqual(field: string, value: unknown): this {
    return this.where(field, 'eq', value)
  }

  /**
   * 设置查询限制
   */
  limit(count: number): this {
    this.options.limit = count
    return this
  }

  /**
   * 设置查询偏移
   */
  offset(count: number): this {
    this.options.offset = count
    return this
  }

  /**
   * 设置排序
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.options.orderBy) {
      this.options.orderBy = []
    }
    this.options.orderBy.push({ field, direction })
    return this
  }

  /**
   * 设置包含关联数据
   */
  include(relations: string[]): this {
    this.options.include = relations
    return this
  }

  /**
   * 设置选择字段
   */
  select(fields: string[]): this {
    this.options.select = fields
    return this
  }

  /**
   * 构建最终查询对象
   */
  build(): { conditions: QueryCondition[]; options: QueryOptions } {
    this.extensionContext?.logger.info(`Building query for ${this.entityName}`, {
      conditions: this.conditions.length,
      options: this.options,
    })

    return {
      conditions: [...this.conditions],
      options: { ...this.options },
    }
  }

  /**
   * 执行查询（模拟实现）
   */
  async execute(): Promise<T[]> {
    const query = this.build()

    this.extensionContext?.events.emit('query:before:execute', {
      entityName: this.entityName,
      query,
    })

    // TODO: 实际的数据库查询实现
    const result: T[] = []

    this.extensionContext?.events.emit('query:after:execute', {
      entityName: this.entityName,
      query,
      result,
    })

    this.emit('executed', { entityName: this.entityName, result })
    return result
  }

  /**
   * 重置查询构建器
   */
  reset(): this {
    this.conditions = []
    this.options = {}
    this.emit('reset')
    return this
  }

  /**
   * 克隆查询构建器
   */
  clone(): QueryBuilder<T> {
    const cloned = new QueryBuilder<T>(this.entityName, this.extensionContext)
    cloned.conditions = [...this.conditions]
    cloned.options = { ...this.options }
    return cloned
  }
}

/**
 * 创建查询构建器的便捷函数
 */
export function createQueryBuilder<T = unknown>(
  entityName: string,
  extensionContext?: ExtensionContext
): QueryBuilder<T> {
  return new QueryBuilder<T>(entityName, extensionContext)
}
