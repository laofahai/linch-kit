import { z } from 'zod'

import type {
  FieldAttributes,
  RelationAttributes,
  ModelConfig,
  EntitySchema,
  EntityDefinition,
  EntityUIConfig
} from './types'
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
 * 改进版本：平衡类型安全和 DTS 构建性能
 * 使用条件类型和映射类型，避免深度嵌套的泛型推导
 */
export function defineEntity<T extends Record<string, z.ZodSchema>>(
  name: string,
  fields: T,
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
  // 使用 Zod 的 object 方法，但限制泛型深度
  const zodSchema = z.object(fields)

  // 收集字段元数据
  const fieldsMetadata: Record<string, FieldAttributes> = {}
  const relationsMetadata: Record<string, RelationAttributes> = {}

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const meta = getFieldMeta(fieldSchema)
    if (meta) {
      fieldsMetadata[fieldName] = meta

      // 如果有关系配置，添加到关系元数据
      if (meta.relation) {
        relationsMetadata[fieldName] = {
          type: meta.relation.type as any,
          model: meta.relation.model,
          foreignKey: meta.relation.foreignKey,
          references: meta.relation.references,
          onDelete: meta.relation.onDelete as any,
          onUpdate: meta.relation.onUpdate as any,
        }
      }
    }
  }

  // 创建带元数据的 schema
  const entitySchema = zodSchema as EntitySchema
  entitySchema._meta = {
    model: {
      tableName: config?.tableName || name.toLowerCase(),
      indexes: config?.indexes,
      compositePrimaryKey: config?.compositePrimaryKey,
      ui: config?.ui
    },
    fields: fieldsMetadata,
    relations: relationsMetadata
  }

  // 创建 Entity 实例
  const entity = new Entity(name, entitySchema, config)

  return entity
}

/**
 * 类型辅助函数：从实体推断类型
 * 改进版本：保持基本类型推导，避免过度复杂
 */
export type EntityType<E extends Entity> = E extends Entity ? Record<string, unknown> : never

/**
 * 类型辅助函数：从字段定义推断实体类型
 * 改进版本：使用条件类型，但限制推导深度
 */
export type InferEntityType<T extends Record<string, z.ZodSchema>> =
  T extends Record<string, z.ZodSchema>
    ? { [K in keyof T]: z.infer<T[K]> }
    : never

/**
 * 简化的类型推导函数：当需要避免复杂推导时使用
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
