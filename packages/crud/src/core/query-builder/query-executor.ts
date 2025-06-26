/**
 * 查询执行器 - 专门处理查询执行
 * 
 * 使用命令模式封装查询执行逻辑
 */

import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@linch-kit/core'
import type { PerformanceMetrics } from '../../types'

/**
 * 查询命令接口
 */
interface QueryCommand {
  execute(): Promise<unknown>
  getMetrics(): PerformanceMetrics
}

/**
 * 基础查询命令
 */
abstract class BaseQueryCommand implements QueryCommand {
  protected startTime: number = Date.now()

  constructor(
    protected readonly entityName: string,
    protected readonly model: unknown,
    protected readonly query: Record<string, unknown>,
    protected readonly logger: Logger
  ) {}

  abstract execute(): Promise<unknown>

  getMetrics(): PerformanceMetrics {
    return {
      operation: this.getOperationName(),
      entityName: this.entityName,
      duration: Date.now() - this.startTime,
      queryComplexity: this.calculateComplexity(),
      timestamp: new Date()
    }
  }

  protected abstract getOperationName(): string

  protected calculateComplexity(): number {
    let complexity = 1

    if (this.query.where) {
      complexity += this.countConditions(this.query.where as Record<string, unknown>)
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

  private countConditions(where: Record<string, unknown>): number {
    let count = 0
    
    for (const [key, value] of Object.entries(where)) {
      if (key === 'AND' || key === 'OR') {
        if (Array.isArray(value)) {
          count += value.reduce((acc, condition) => 
            acc + this.countConditions(condition as Record<string, unknown>), 0)
        }
      } else {
        count += 1
      }
    }

    return count
  }
}

/**
 * 查找多条记录命令
 */
class FindManyCommand extends BaseQueryCommand {
  protected getOperationName(): string {
    return 'findMany'
  }

  async execute(): Promise<unknown[]> {
    try {
      const result = await (this.model as { findMany: (query: unknown) => Promise<unknown[]> })
        .findMany(this.query)
      
      this.getMetrics().recordsAffected = result.length
      return result
    } catch (error) {
      this.logger.error('FindMany execution failed', {
        entityName: this.entityName,
        query: this.query,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

/**
 * 查找第一条记录命令
 */
class FindFirstCommand extends BaseQueryCommand {
  protected getOperationName(): string {
    return 'findFirst'
  }

  async execute(): Promise<unknown> {
    try {
      const result = await (this.model as { findFirst: (query: unknown) => Promise<unknown> })
        .findFirst(this.query)
      
      this.getMetrics().recordsAffected = result ? 1 : 0
      return result
    } catch (error) {
      this.logger.error('FindFirst execution failed', {
        entityName: this.entityName,
        query: this.query,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

/**
 * 计数命令
 */
class CountCommand extends BaseQueryCommand {
  protected getOperationName(): string {
    return 'count'
  }

  async execute(): Promise<number> {
    try {
      const countQuery = { where: this.query.where }
      const result = await (this.model as { count: (query: unknown) => Promise<number> })
        .count(countQuery)
      
      return result
    } catch (error) {
      this.logger.error('Count execution failed', {
        entityName: this.entityName,
        query: countQuery,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

/**
 * 聚合命令
 */
class AggregateCommand extends BaseQueryCommand {
  constructor(
    entityName: string,
    model: unknown,
    query: Record<string, unknown>,
    logger: Logger,
    private readonly operation: 'sum' | 'avg' | 'min' | 'max',
    private readonly field: string
  ) {
    super(entityName, model, query, logger)
  }

  protected getOperationName(): string {
    return this.operation
  }

  async execute(): Promise<number> {
    try {
      const aggregateQuery = {
        where: this.query.where,
        [`_${this.operation}`]: { [this.field]: true }
      }

      const result = await (this.model as { aggregate: (query: unknown) => Promise<Record<string, Record<string, number>>> })
        .aggregate(aggregateQuery)
      
      return result[`_${this.operation}`][this.field] || 0
    } catch (error) {
      this.logger.error(`${this.operation} execution failed`, {
        entityName: this.entityName,
        field: this.field,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

/**
 * 查询执行器
 */
export class QueryExecutor<T = unknown> {
  constructor(
    private readonly entityName: string,
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {}

  /**
   * 执行查找多条记录
   */
  async findMany(query: Record<string, unknown>): Promise<{ data: T[]; metrics: PerformanceMetrics }> {
    const model = this.getPrismaModel()
    const command = new FindManyCommand(this.entityName, model, query, this.logger)
    
    const data = await command.execute() as T[]
    const metrics = command.getMetrics()
    
    return { data, metrics }
  }

  /**
   * 执行查找第一条记录
   */
  async findFirst(query: Record<string, unknown>): Promise<{ data: T | null; metrics: PerformanceMetrics }> {
    const model = this.getPrismaModel()
    const command = new FindFirstCommand(this.entityName, model, query, this.logger)
    
    const data = await command.execute() as T | null
    const metrics = command.getMetrics()
    
    return { data, metrics }
  }

  /**
   * 执行计数
   */
  async count(query: Record<string, unknown>): Promise<{ data: number; metrics: PerformanceMetrics }> {
    const model = this.getPrismaModel()
    const command = new CountCommand(this.entityName, model, query, this.logger)
    
    const data = await command.execute() as number
    const metrics = command.getMetrics()
    
    return { data, metrics }
  }

  /**
   * 执行聚合查询
   */
  async aggregate(
    query: Record<string, unknown>,
    operation: 'sum' | 'avg' | 'min' | 'max',
    field: string
  ): Promise<{ data: number; metrics: PerformanceMetrics }> {
    const model = this.getPrismaModel()
    const command = new AggregateCommand(this.entityName, model, query, this.logger, operation, field)
    
    const data = await command.execute() as number
    const metrics = command.getMetrics()
    
    return { data, metrics }
  }

  /**
   * 检查是否存在
   */
  async exists(query: Record<string, unknown>): Promise<{ data: boolean; metrics: PerformanceMetrics }> {
    const { data: count, metrics } = await this.count(query)
    return { 
      data: count > 0, 
      metrics: {
        ...metrics,
        operation: 'exists'
      }
    }
  }

  /**
   * 获取 Prisma 模型
   */
  private getPrismaModel(): unknown {
    const modelName = this.entityName.toLowerCase()
    const model = (this.prisma as unknown as Record<string, unknown>)[modelName]

    if (!model) {
      throw new Error(`Prisma model for entity ${this.entityName} not found`)
    }

    return model
  }
}

/**
 * 查询执行器工厂
 */
export class QueryExecutorFactory {
  static create<T>(
    entityName: string,
    prisma: PrismaClient,
    logger: Logger
  ): QueryExecutor<T> {
    return new QueryExecutor<T>(entityName, prisma, logger)
  }
}