/**
 * 查询条件构建器 - 专门处理 WHERE 条件
 * 
 * 使用策略模式处理不同类型的查询操作符
 */

import type { Entity } from '@linch-kit/schema'

import type { Logger } from '../../types'
import type { Operator } from '../../types'

/**
 * 条件策略接口
 */
interface ConditionStrategy {
  build(field: string, value: unknown): Record<string, unknown>
  validate(field: string, value: unknown, entity: Entity): void
}

/**
 * 相等条件策略
 */
class EqualityStrategy implements ConditionStrategy {
  constructor(private readonly isNegated: boolean = false) {}

  build(field: string, value: unknown): Record<string, unknown> {
    return this.isNegated 
      ? { [field]: { not: value } }
      : { [field]: value }
  }

  validate(field: string, value: unknown, _entity: Entity): void {
    // 基础验证
    if (value === undefined) {
      throw new Error(`Value for field '${field}' cannot be undefined`)
    }
  }
}

/**
 * 比较条件策略
 */
class ComparisonStrategy implements ConditionStrategy {
  constructor(private readonly operator: 'gt' | 'gte' | 'lt' | 'lte') {}

  build(field: string, value: unknown): Record<string, unknown> {
    return { [field]: { [this.operator]: value } }
  }

  validate(field: string, _value: unknown, _entity: Entity): void {
    const fieldDef = _entity.fields[field]
    if (fieldDef && !['number', 'integer', 'float', 'date', 'datetime'].includes(fieldDef.type)) {
      throw new Error(`Comparison operator ${this.operator} not compatible with field type ${fieldDef.type}`)
    }
  }
}

/**
 * 模糊匹配策略
 */
class LikeStrategy implements ConditionStrategy {
  build(field: string, value: unknown): Record<string, unknown> {
    return { 
      [field]: { 
        contains: value, 
        mode: 'insensitive' 
      } 
    }
  }

  validate(field: string, value: unknown, _entity: Entity): void {
    if (typeof value !== 'string') {
      throw new Error(`Like operator requires string value for field '${field}'`)
    }
  }
}

/**
 * 数组条件策略
 */
class ArrayStrategy implements ConditionStrategy {
  constructor(private readonly isNegated: boolean = false) {}

  build(field: string, value: unknown): Record<string, unknown> {
    const operator = this.isNegated ? 'notIn' : 'in'
    return { [field]: { [operator]: value } }
  }

  validate(field: string, value: unknown, _entity: Entity): void {
    if (!Array.isArray(value)) {
      throw new Error(`Array operator requires array value for field '${field}'`)
    }
  }
}

/**
 * NULL 条件策略
 */
class NullStrategy implements ConditionStrategy {
  constructor(private readonly isNegated: boolean = false) {}

  build(field: string, _value: unknown): Record<string, unknown> {
    return this.isNegated 
      ? { [field]: { not: null } }
      : { [field]: null }
  }

  validate(_field: string, _value: unknown, _entity: Entity): void {
    // NULL 操作不需要值验证
  }
}

/**
 * BETWEEN 条件策略
 */
class BetweenStrategy implements ConditionStrategy {
  build(field: string, value: unknown): Record<string, unknown> {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new Error('Between operator requires array with exactly 2 values')
    }
    return { [field]: { gte: value[0], lte: value[1] } }
  }

  validate(field: string, value: unknown, entity: Entity): void {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new Error(`Between operator requires array with exactly 2 values for field '${field}'`)
    }
    
    const fieldDef = entity.fields[field]
    if (fieldDef && !['number', 'integer', 'float', 'date', 'datetime'].includes(fieldDef.type)) {
      throw new Error(`Between operator not compatible with field type ${fieldDef.type}`)
    }
  }
}

/**
 * 查询条件构建器
 */
export class QueryConditionBuilder {
  private conditions: Array<{ field: string; strategy: ConditionStrategy; value: unknown }> = []
  private strategies: Map<Operator, ConditionStrategy> = new Map()

  constructor(
    private readonly entity: Entity,
    private readonly logger: Logger
  ) {
    this.initializeStrategies()
  }

  /**
   * 初始化策略映射
   */
  private initializeStrategies(): void {
    this.strategies.set('=', new EqualityStrategy(false))
    this.strategies.set('!=', new EqualityStrategy(true))
    this.strategies.set('>', new ComparisonStrategy('gt'))
    this.strategies.set('>=', new ComparisonStrategy('gte'))
    this.strategies.set('<', new ComparisonStrategy('lt'))
    this.strategies.set('<=', new ComparisonStrategy('lte'))
    this.strategies.set('like', new LikeStrategy())
    this.strategies.set('in', new ArrayStrategy(false))
    this.strategies.set('not_in', new ArrayStrategy(true))
    this.strategies.set('is_null', new NullStrategy(false))
    this.strategies.set('is_not_null', new NullStrategy(true))
    this.strategies.set('between', new BetweenStrategy())
  }

  /**
   * 添加条件
   */
  addCondition(field: string, operator: Operator, value: unknown): this {
    const strategy = this.strategies.get(operator)
    if (!strategy) {
      throw new Error(`Unsupported operator: ${operator}`)
    }

    // 验证条件
    try {
      strategy.validate(field, value, this.entity)
    } catch (error) {
      this.logger.error('Condition validation failed', error instanceof Error ? error : new Error('Unknown error'), {
        field,
        operator,
        value
      })
      throw error
    }

    this.conditions.push({ field, strategy, value })
    return this
  }

  /**
   * 构建 WHERE 条件
   */
  build(existingQuery: Record<string, unknown> = {}): Record<string, unknown> {
    if (this.conditions.length === 0) {
      return existingQuery
    }

    const whereClause: Record<string, unknown> = {}

    // 应用所有条件
    for (const condition of this.conditions) {
      try {
        const conditionClause = condition.strategy.build(condition.field, condition.value)
        this.mergeConditions(whereClause, conditionClause)
      } catch (error) {
        this.logger.error('Failed to build condition', error instanceof Error ? error : new Error('Unknown error'), {
          field: condition.field,
          value: condition.value
        })
        throw error
      }
    }

    return {
      ...existingQuery,
      where: this.mergeWithExistingWhere(existingQuery.where as Record<string, unknown>, whereClause)
    }
  }

  /**
   * 合并条件
   */
  private mergeConditions(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [field, condition] of Object.entries(source)) {
      if (field in target) {
        // 字段已存在，需要合并条件
        if (typeof target[field] === 'object' && typeof condition === 'object') {
          target[field] = { ...target[field] as Record<string, unknown>, ...condition as Record<string, unknown> }
        } else {
          // 冲突处理：转换为 AND 条件
          target.AND = [
            { [field]: target[field] },
            { [field]: condition }
          ]
          delete target[field]
        }
      } else {
        target[field] = condition
      }
    }
  }

  /**
   * 与现有 WHERE 条件合并
   */
  private mergeWithExistingWhere(
    existing: Record<string, unknown> | undefined,
    newConditions: Record<string, unknown>
  ): Record<string, unknown> {
    if (!existing) {
      return newConditions
    }

    // 如果现有条件已经是 AND 结构
    if (existing.AND && Array.isArray(existing.AND)) {
      return {
        AND: [...existing.AND, newConditions]
      }
    }

    // 合并条件
    const merged: Record<string, unknown> = {}
    for (const [field, condition] of Object.entries(existing)) {
      merged[field] = condition
    }

    this.mergeConditions(merged, newConditions)
    return merged
  }

  /**
   * 重置条件
   */
  reset(): this {
    this.conditions = []
    return this
  }

  /**
   * 获取当前条件数量
   */
  getConditionCount(): number {
    return this.conditions.length
  }

  /**
   * 注册自定义策略
   */
  registerStrategy(operator: string, strategy: ConditionStrategy): this {
    this.strategies.set(operator as Operator, strategy)
    return this
  }
}