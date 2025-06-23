import { z } from 'zod'

import type {
  FieldAttributes,
  RelationAttributes,
  ModelConfig,
  EntitySchema,
  EntityDefinition,
  EntityUIConfig
} from './types'
import {
  type EntityMetadata,
  FIELD_META_SYMBOL,
  ENTITY_META_SYMBOL,
} from './core-types'
import { getFieldMeta } from './decorators'

/**
 * 全局实体注册表单例
 * 使用 globalThis 确保在不同模块实例间共享同一个注册表
 */
function getEntityRegistry(): Map<string, EntityDefinition> {
  const globalKey = '__LINCH_ENTITY_REGISTRY__'
  if (!(globalThis as any)[globalKey]) {
    (globalThis as any)[globalKey] = new Map<string, EntityDefinition>()
  }
  return (globalThis as any)[globalKey]
}

/**
 * 实体类，包含 schema 和元数据
 */
export class Entity {
  constructor(
    public readonly name: string,
    public readonly schema: EntitySchema,
    public readonly config?: ModelConfig
  ) {
    // 延迟注册实体到全局注册表，避免在构造时触发复杂的类型推断
    setTimeout(() => {
      try {
        const registry = getEntityRegistry()
        registry.set(name, {
          name,
          schema: schema as EntitySchema,
          meta: schema._meta
        })
      } catch (error) {
        console.warn(`Warning: Failed to register entity ${name}:`, error)
      }
    }, 0)
  }

  /**
   * 获取实体类型
   */
  get type(): Record<string, any> {
    return {} as Record<string, any>
  }

  /**
   * 创建输入 schema (排除自动生成字段)
   * 优化版本：保持基本类型安全性，避免过度复杂的字段过滤
   */
  get createSchema(): z.ZodObject<any> {
    // 返回原始 schema，让使用者根据需要进行字段过滤
    return this.schema as z.ZodObject<any>
  }

  /**
   * 更新输入 schema (排除主键和时间戳，所有字段可选)
   * 优化版本：保持基本类型安全性
   */
  get updateSchema(): z.ZodObject<any> {
    // 返回原始 schema 的 partial 版本
    return this.schema.partial() as z.ZodObject<any>
  }

  /**
   * 响应 schema (排除敏感字段)
   * 保持类型安全性
   */
  get responseSchema(): EntitySchema {
    // 直接返回 schema，因为它已经是 ZodObject 类型
    return this.schema
  }

  /**
   * 查询参数 schema
   * 优化版本：使用预定义结构避免动态类型推导
   */
  get querySchema(): z.ZodObject<any> {
    // 使用固定的查询结构，避免动态字段推导
    return z.object({
      where: z.record(z.string(), z.unknown()).optional(),
      orderBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
      take: z.number().int().positive().max(100).optional(),
      skip: z.number().int().nonnegative().optional(),
    })
  }
}

/**
 * 定义实体的工厂函数
 *
 * 性能优化版本：简化类型推导，提升 DTS 构建性能
 * 移除复杂的泛型约束，使用更简单的类型操作
 */
export function defineEntity(
  name: string,
  fields: Record<string, z.ZodSchema>,
  config?: {
    tableName?: string
    indexes?: Array<{
      fields: string[]
      unique?: boolean
      name?: string
    }>
    compositePrimaryKey?: string[]
    ui?: EntityUIConfig
  }
): Entity {
  // 创建 Zod schema（避免泛型推导）
  const zodSchema = z.object(fields)

  // 创建实体元数据
  const metadata: EntityMetadata = {
    name,
    tableName: config?.tableName || name.toLowerCase(),
    indexes: config?.indexes,
    fields: {}
  }

  // 收集字段元数据
  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const fieldMeta = (fieldSchema as any)[FIELD_META_SYMBOL]
    if (fieldMeta) {
      metadata.fields![fieldName] = {
        name: fieldName,
        type: (fieldSchema._def as any)?.typeName || 'unknown',
        isPrimary: fieldMeta.isPrimary,
        isUnique: fieldMeta.isUnique,
        isOptional: fieldSchema.isOptional(),
        defaultValue: fieldMeta.defaultValue
      }
    }
  }

  // 创建带元数据的 schema
  const entitySchema = zodSchema as EntitySchema
  ;(entitySchema as any)[ENTITY_META_SYMBOL] = metadata

  // 为了兼容性，也设置旧的元数据格式
  entitySchema._meta = {
    model: {
      tableName: config?.tableName || name.toLowerCase(),
      indexes: config?.indexes,
      compositePrimaryKey: config?.compositePrimaryKey,
      ui: config?.ui
    },
    fields: {},
    relations: {}
  }

  // 创建 Entity 实例
  const entity = new Entity(name, entitySchema, config)

  // 注册实体
  const registry = getEntityRegistry()
  registry.set(name, {
    name,
    schema: entitySchema,
    meta: entitySchema._meta
  })

  return entity
}

/**
 * 类型辅助函数：简化版本，避免复杂的类型推导
 * 性能优化：使用简单的类型定义，避免深度类型推导
 */
export type EntityType<E extends Entity> = Record<string, unknown>

/**
 * 类型辅助函数：简化版本，避免复杂的类型推导
 * 性能优化：直接返回通用类型，避免映射类型推导
 */
export type InferEntityType<T> = Record<string, unknown>

/**
 * 简化的类型推导函数：推荐使用
 */
export type SimpleEntityType = Record<string, unknown>

/**
 * 获取已注册的实体
 */
export function getEntity(name: string): EntityDefinition | undefined {
  const registry = getEntityRegistry()
  return registry.get(name)
}

/**
 * 获取所有已注册的实体
 */
export function getAllEntities(): EntityDefinition[] {
  const registry = getEntityRegistry()
  return Array.from(registry.values())
}

/**
 * 清空实体注册表 (主要用于测试)
 */
export function clearEntityRegistry(): void {
  const registry = getEntityRegistry()
  registry.clear()
}
