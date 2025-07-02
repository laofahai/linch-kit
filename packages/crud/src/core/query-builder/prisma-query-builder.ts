/**
 * Prisma 查询构建器 - 具体实现
 * 
 * 继承基础查询构建器，实现具体的查询执行逻辑
 */

import type { Entity } from '@linch-kit/schema'
import type { PluginManager } from '@linch-kit/core'

import type { PaginatedResult, SchemaRegistry, Logger } from '../../types'

import { BaseQueryBuilder } from './base-query-builder'
import { QueryExecutorFactory as _QueryExecutorFactory } from './query-executor'

// 简化的 PrismaClient 类型定义
interface PrismaClient {
  [key: string]: unknown
}

/**
 * Prisma 查询构建器实现
 */
export class PrismaQueryBuilder<T = unknown> extends BaseQueryBuilder<T> {
  constructor(
    entityName: string,
    prisma: PrismaClient,
    schemaRegistry: SchemaRegistry,
    logger: Logger,
    pluginManager?: PluginManager
  ) {
    super(entityName, prisma, schemaRegistry, logger, pluginManager)
  }

  /**
   * 创建查询构建器实例
   */
  static create<T>(
    entityName: string,
    prisma: PrismaClient,
    schemaRegistry: SchemaRegistry,
    logger: Logger,
    pluginManager?: PluginManager
  ): PrismaQueryBuilder<T> {
    return new PrismaQueryBuilder<T>(entityName, prisma, schemaRegistry, logger, pluginManager)
  }

  /**
   * 执行查询
   */
  async execute(): Promise<T[]> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.findMany(finalQuery)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 查询第一条记录
   */
  async first(): Promise<T | null> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.findFirst(finalQuery)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 检查是否存在
   */
  async exists(): Promise<boolean> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.exists(finalQuery)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 计数查询
   */
  async count(): Promise<number> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.count(finalQuery)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 求和
   */
  async sum(field: keyof T): Promise<number> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.aggregate(finalQuery, 'sum', field as string)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 平均值
   */
  async avg(field: keyof T): Promise<number> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.aggregate(finalQuery, 'avg', field as string)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 最小值
   */
  async min(field: keyof T): Promise<number> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.aggregate(finalQuery, 'min', field as string)
    
    await this.recordMetrics(metrics)
    return data
  }

  /**
   * 最大值
   */
  async max(field: keyof T): Promise<number> {
    const finalQuery = await this.buildFinalQuery()
    const { data, metrics } = await this.executor.aggregate(finalQuery, 'max', field as string)
    
    await this.recordMetrics(metrics)
    return data
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
   * 高级关联查询
   */
  includeWith(relation: string, callback: (qb: PrismaQueryBuilder) => void): this {
    if (!this.query.include) {
      this.query.include = {}
    }

    const include = this.query.include as Record<string, unknown>
    const relationEntity = this.getRelationEntity(relation)
    
    if (relationEntity) {
      const subQuery = new PrismaQueryBuilder(
        relationEntity.name,
        this.prisma,
        this.schemaRegistry,
        this.logger,
        this.pluginManager
      )
      callback(subQuery)
      include[relation] = subQuery.build()
    } else {
      this.logger.warn(`Relation entity not found for ${relation}`)
      include[relation] = true
    }

    return this
  }

  /**
   * 原始查询支持
   */
  raw(sql: string, params: unknown[] = []): this {
    // 注意：这是为了支持复杂查询的扩展点
    // 在实际使用中需要谨慎处理 SQL 注入风险
    this.query._raw = { sql, params }
    this.logger.warn('Using raw SQL query', { sql, params })
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
      this.pluginManager
    )
    cloned.query = JSON.parse(JSON.stringify(this.query))
    return cloned
  }

  // 私有辅助方法

  private getRelationEntity(relationName: string): Entity | null {
    const field = Object.values(this.entity.fields).find(
      field => field.type === 'relation' && (field as Record<string, unknown>).target === relationName
    )

    if ((field as Record<string, unknown>)?.target) {
      // 简化实现，返回 null
      return null
    }

    return null
  }
}

/**
 * 查询构建器工厂
 */
export class QueryBuilderFactory {
  /**
   * 创建查询构建器
   */
  static create<T>(
    entityName: string,
    prisma: PrismaClient,
    schemaRegistry: SchemaRegistry,
    logger: Logger,
    pluginManager?: PluginManager
  ): PrismaQueryBuilder<T> {
    return PrismaQueryBuilder.create<T>(
      entityName,
      prisma,
      schemaRegistry,
      logger,
      pluginManager
    )
  }

  /**
   * 创建带插件的查询构建器
   */
  static createWithPlugins<T>(
    entityName: string,
    prisma: PrismaClient,
    schemaRegistry: SchemaRegistry,
    logger: Logger,
    pluginManager: PluginManager
  ): PrismaQueryBuilder<T> {
    const builder = new PrismaQueryBuilder<T>(
      entityName,
      prisma,
      schemaRegistry,
      logger,
      pluginManager
    )

    // 应用查询构建器插件
    // const plugins = pluginManager.getPlugins('query-builder')
    // for (const plugin of plugins) {
    //   if (plugin.hooks?.enhanceBuilder) {
    //     plugin.hooks.enhanceBuilder(builder)
    //   }
    // }

    return builder
  }
}