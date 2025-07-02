/**
 * 查询构建器 - 基于 Prisma 查询语法
 * 
 * 设计原则：
 * - 提供链式 API，最终转换为 Prisma 查询
 * - 利用 Prisma 的类型推导和查询优化
 * - 支持复杂关联查询和聚合操作
 */

import type { PrismaClient } from '@prisma/client'
import type { Entity, SchemaRegistry } from '@linch-kit/schema'
import type { Logger } from '@linch-kit/core'

import type {
  IQueryBuilder,
  Operator,
  PaginatedResult,
  FindOptions as _FindOptions,
  PerformanceMetrics
} from '../types'
import { PermissionChecker } from '../permissions/permission-checker'

/**
 * Prisma 查询构建器
 */
export class PrismaQueryBuilder<T = unknown> implements IQueryBuilder<T> {
  private query: Record<string, unknown> = {}
  private readonly entity: Entity

  constructor(
    private readonly entityName: string,
    private readonly prisma: PrismaClient,
    private readonly schemaRegistry: SchemaRegistry,
    private readonly logger: Logger,
    private readonly permissionChecker?: PermissionChecker
  ) {
    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`)
    }
    this.entity = entity
  }

  /**
   * 创建查询构建器实例
   */
  static create<T>(
    entityName: string,
    prisma: PrismaClient,
    schemaRegistry: SchemaRegistry,
    logger: Logger
  ): PrismaQueryBuilder<T> {
    return new PrismaQueryBuilder<T>(entityName, prisma, schemaRegistry, logger)
  }

  /**
   * WHERE 条件
   */
  where(field: keyof T, operator: Operator, value: unknown): this {
    if (!this.query.where) {
      this.query.where = {}
    }

    const where = this.query.where as Record<string, unknown>

    // 转换为 Prisma 查询语法
    switch (operator) {
      case '=':
        where[field as string] = value
        break
      case '!=':
        where[field as string] = { not: value }
        break
      case '>':
        where[field as string] = { gt: value }
        break
      case '>=':
        where[field as string] = { gte: value }
        break
      case '<':
        where[field as string] = { lt: value }
        break
      case '<=':
        where[field as string] = { lte: value }
        break
      case 'like':
        where[field as string] = {
          contains: value,
          mode: 'insensitive'
        }
        break
      case 'in':
        where[field as string] = { in: value }
        break
      case 'not_in':
        where[field as string] = { notIn: value }
        break
      case 'is_null':
        where[field as string] = null
        break
      case 'is_not_null':
        where[field as string] = { not: null }
        break
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          where[field as string] = { gte: value[0], lte: value[1] }
        } else {
          throw new Error('Between operator requires array with exactly 2 values')
        }
        break
      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }

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
  include(relation: string, callback?: (qb: PrismaQueryBuilder) => void): this {
    if (!this.query.include) {
      this.query.include = {}
    }

    const include = this.query.include as Record<string, unknown>

    if (callback) {
      // 支持嵌套查询构建
      const relationEntity = this.getRelationEntity(relation)
      if (relationEntity) {
        const subQuery = new PrismaQueryBuilder(
          relationEntity.name,
          this.prisma,
          this.schemaRegistry,
          this.logger,
          this.permissionChecker
        )
        callback(subQuery)
        include[relation] = subQuery.build()
      } else {
        this.logger.warn(`Relation entity not found for ${relation}`)
        include[relation] = true
      }
    } else {
      include[relation] = true
    }

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

  /**
   * 执行查询
   */
  async execute(): Promise<T[]> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const results = await model.findMany(this.query)

      await this.recordMetrics({
        operation: 'findMany',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        recordsAffected: results.length,
        queryComplexity: this.calculateQueryComplexity(),
        timestamp: new Date()
      })

      return results as T[]
    } catch (error) {
      this.logger.error('Query execution failed', {
        entityName: this.entityName,
        query: this.query,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 查询第一条记录
   */
  async first(): Promise<T | null> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const result = await model.findFirst(this.query)

      await this.recordMetrics({
        operation: 'findFirst',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        recordsAffected: result ? 1 : 0,
        queryComplexity: this.calculateQueryComplexity(),
        timestamp: new Date()
      })

      return result as T | null
    } catch (error) {
      this.logger.error('FindFirst execution failed', {
        entityName: this.entityName,
        query: this.query,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 检查是否存在
   */
  async exists(): Promise<boolean> {
    const count = await this.count()
    return count > 0
  }

  /**
   * 计数查询
   */
  async count(): Promise<number> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const countQuery = {
        where: this.query.where
      }
      const count = await model.count(countQuery)

      await this.recordMetrics({
        operation: 'count',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        timestamp: new Date()
      })

      return count
    } catch (error) {
      this.logger.error('Count execution failed', {
        entityName: this.entityName,
        query: countQuery,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  // 聚合操作 - 使用 Prisma 的聚合 API

  /**
   * 求和
   */
  async sum(field: keyof T): Promise<number> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const result = await model.aggregate({
        where: this.query.where,
        _sum: { [field as string]: true }
      })

      await this.recordMetrics({
        operation: 'sum',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        timestamp: new Date()
      })

      return result._sum[field as string] || 0
    } catch (error) {
      this.logger.error('Sum execution failed', {
        entityName: this.entityName,
        field: field as string,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 平均值
   */
  async avg(field: keyof T): Promise<number> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const result = await model.aggregate({
        where: this.query.where,
        _avg: { [field as string]: true }
      })

      await this.recordMetrics({
        operation: 'avg',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        timestamp: new Date()
      })

      return result._avg[field as string] || 0
    } catch (error) {
      this.logger.error('Avg execution failed', {
        entityName: this.entityName,
        field: field as string,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 最小值
   */
  async min(field: keyof T): Promise<number> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const result = await model.aggregate({
        where: this.query.where,
        _min: { [field as string]: true }
      })

      await this.recordMetrics({
        operation: 'min',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        timestamp: new Date()
      })

      return result._min[field as string] || 0
    } catch (error) {
      this.logger.error('Min execution failed', {
        entityName: this.entityName,
        field: field as string,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 最大值
   */
  async max(field: keyof T): Promise<number> {
    const startTime = Date.now()

    try {
      const model = this.getPrismaModel()
      const result = await model.aggregate({
        where: this.query.where,
        _max: { [field as string]: true }
      })

      await this.recordMetrics({
        operation: 'max',
        entityName: this.entityName,
        duration: Date.now() - startTime,
        timestamp: new Date()
      })

      return result._max[field as string] || 0
    } catch (error) {
      this.logger.error('Max execution failed', {
        entityName: this.entityName,
        field: field as string,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 分页查询
   */
  async paginateExecute(page: number = 1, pageSize: number = 20): Promise<PaginatedResult<T>> {
    // 获取总数
    const total = await this.count()

    // 应用分页并查询数据
    const data = await this.paginate(page, pageSize).execute()

    // 计算分页信息
    const totalPages = Math.ceil(total / pageSize)

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    }
  }

  /**
   * 构建查询对象
   */
  build(): Record<string, unknown> {
    return { ...this.query }
  }

  /**
   * 清除查询条件
   */
  reset(): this {
    this.query = {}
    return this
  }

  /**
   * 克隆查询构建器
   */
  clone(): PrismaQueryBuilder<T> {
    const cloned = new PrismaQueryBuilder<T>(
      this.entityName,
      this.prisma,
      this.schemaRegistry,
      this.logger,
      this.permissionChecker
    )
    cloned.query = JSON.parse(JSON.stringify(this.query))
    return cloned
  }

  // 私有辅助方法

  private getPrismaModel() {
    const modelName = this.entityName.toLowerCase()
    const model = (this.prisma as unknown as Record<string, unknown>)[modelName]

    if (!model) {
      throw new Error(`Prisma model for entity ${this.entityName} not found`)
    }

    return model
  }

  private getRelationEntity(relationName: string): Entity | null {
    const field = Object.values(this.entity.fields).find(
      field => field.type === 'relation' && field.relation?.name === relationName
    )

    if (field?.relation?.entity) {
      return this.schemaRegistry.getEntity(field.relation.entity)
    }

    return null
  }

  private calculateQueryComplexity(): number {
    let complexity = 1

    if (this.query.where) {
      const whereClause = this.query.where as Record<string, unknown>
      complexity += Object.keys(whereClause).length
    }

    if (this.query.include) {
      const include = this.query.include as Record<string, unknown>
      complexity += Object.keys(include).length * 2
    }

    if (this.query.orderBy) {
      const orderBy = this.query.orderBy as unknown[]
      complexity += orderBy.length
    }

    return complexity
  }

  private async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // 这里可以集成到指标收集系统
      this.logger.debug('Query performance metrics', metrics)
    } catch (error) {
      this.logger.error('Failed to record query metrics', { error })
    }
  }
}