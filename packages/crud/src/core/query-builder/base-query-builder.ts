/**
 * 基础查询构建器 - 使用策略模式和插件系统
 * 
 * 设计模式：
 * - 策略模式：不同查询类型使用不同策略
 * - 建造者模式：链式API构建查询
 * - 插件模式：支持扩展查询功能
 */

import type { PrismaClient } from '@prisma/client'
import type { Entity, SchemaRegistry } from '@linch-kit/schema'
import type { Logger, PluginManager } from '@linch-kit/core'
import type {
  IQueryBuilder,
  Operator,
  PerformanceMetrics
} from '../../types'
import { QueryConditionBuilder } from './condition-builder'
import { QueryExecutor } from './query-executor'
import { QueryOptimizer } from './query-optimizer'
import { QueryValidator } from './query-validator'

/**
 * 基础查询构建器
 */
export abstract class BaseQueryBuilder<T = unknown> implements IQueryBuilder<T> {
  protected query: Record<string, unknown> = {}
  protected readonly entity: Entity
  protected readonly conditionBuilder: QueryConditionBuilder
  protected readonly executor: QueryExecutor<T>
  protected readonly optimizer: QueryOptimizer
  protected readonly validator: QueryValidator

  constructor(
    protected readonly entityName: string,
    protected readonly prisma: PrismaClient,
    protected readonly schemaRegistry: SchemaRegistry,
    protected readonly logger: Logger,
    protected readonly pluginManager?: PluginManager
  ) {
    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`)
    }
    this.entity = entity

    // 初始化组件
    this.conditionBuilder = new QueryConditionBuilder(entity, logger)
    this.executor = new QueryExecutor<T>(entityName, prisma, logger)
    this.optimizer = new QueryOptimizer(entity, logger)
    this.validator = new QueryValidator(entity, logger)
  }

  /**
   * WHERE 条件 - 委托给条件构建器
   */
  where(field: keyof T, operator: Operator, value: unknown): this {
    this.conditionBuilder.addCondition(field as string, operator, value)
    this.query = this.conditionBuilder.build(this.query)
    return this
  }

  /**
   * WHERE IN 条件
   */
  whereIn(field: keyof T, values: unknown[]): this {
    return this.where(field, 'in', values)
  }

  /**
   * WHERE NULL 条件
   */
  whereNull(field: keyof T): this {
    return this.where(field, 'is_null', null)
  }

  /**
   * WHERE NOT NULL 条件
   */
  whereNotNull(field: keyof T): this {
    return this.where(field, 'is_not_null', null)
  }

  /**
   * WHERE BETWEEN 条件
   */
  whereBetween(field: keyof T, min: unknown, max: unknown): this {
    return this.where(field, 'between', [min, max])
  }

  /**
   * 关联查询
   */
  include(relation: string): this {
    if (!this.query.include) {
      this.query.include = {}
    }

    const include = this.query.include as Record<string, unknown>
    include[relation] = true

    return this
  }

  /**
   * 排序
   */
  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.query.orderBy) {
      this.query.orderBy = []
    }

    const orderBy = this.query.orderBy as Array<Record<string, string>>
    orderBy.push({
      [field as string]: direction
    })

    return this
  }

  /**
   * 限制数量
   */
  limit(count: number): this {
    if (count < 0) {
      throw new Error('Limit must be non-negative')
    }
    this.query.take = count
    return this
  }

  /**
   * 偏移量
   */
  offset(count: number): this {
    if (count < 0) {
      throw new Error('Offset must be non-negative')
    }
    this.query.skip = count
    return this
  }

  /**
   * 分页
   */
  paginate(page: number, pageSize: number): this {
    if (page < 1) {
      throw new Error('Page must be >= 1')
    }
    if (pageSize < 1) {
      throw new Error('Page size must be >= 1')
    }

    this.query.skip = (page - 1) * pageSize
    this.query.take = pageSize
    return this
  }

  /**
   * 去重
   */
  distinct(fields: (keyof T)[]): this {
    this.query.distinct = fields.map(field => field as string)
    return this
  }

  // 抽象方法 - 由具体实现类实现

  abstract execute(): Promise<T[]>
  abstract first(): Promise<T | null>
  abstract count(): Promise<number>
  abstract exists(): Promise<boolean>
  abstract sum(field: keyof T): Promise<number>
  abstract avg(field: keyof T): Promise<number>
  abstract min(field: keyof T): Promise<number>
  abstract max(field: keyof T): Promise<number>

  /**
   * 构建最终查询
   */
  protected async buildFinalQuery(): Promise<Record<string, unknown>> {
    // 1. 验证查询
    await this.validator.validate(this.query)

    // 2. 优化查询
    const optimizedQuery = await this.optimizer.optimize(this.query)

    // 3. 应用插件
    return await this.applyPlugins(optimizedQuery)
  }

  /**
   * 应用插件扩展
   */
  protected async applyPlugins(query: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.pluginManager) {
      return query
    }

    // 应用查询插件
    const plugins = this.pluginManager.getPlugins('query-builder')
    let processedQuery = query

    for (const plugin of plugins) {
      if (plugin.hooks?.beforeExecute) {
        processedQuery = await plugin.hooks.beforeExecute(processedQuery, this.entity)
      }
    }

    return processedQuery
  }

  /**
   * 记录性能指标
   */
  protected async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      this.logger.debug('Query performance metrics', metrics)
      
      // 应用指标插件
      if (this.pluginManager) {
        const plugins = this.pluginManager.getPlugins('metrics')
        for (const plugin of plugins) {
          if (plugin.hooks?.recordMetrics) {
            await plugin.hooks.recordMetrics(metrics)
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to record query metrics', { error })
    }
  }

  /**
   * 构建查询对象
   */
  build(): Record<string, unknown> {
    return { ...this.query }
  }

  /**
   * 重置查询
   */
  reset(): this {
    this.query = {}
    this.conditionBuilder.reset()
    return this
  }

  /**
   * 克隆查询构建器
   */
  abstract clone(): BaseQueryBuilder<T>
}