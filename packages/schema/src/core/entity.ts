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
export class Entity<T extends Record<string, any> = any> {
  constructor(
    public readonly name: string,
    public readonly schema: EntitySchema<T>,
    public readonly config?: ModelConfig
  ) {
    // 注册实体到全局注册表
    const registry = getEntityRegistry()
    registry.set(name, {
      name,
      schema: schema as EntitySchema,
      meta: schema._meta
    })
  }

  /**
   * 获取实体类型
   */
  get type(): T {
    return {} as T
  }

  /**
   * 创建输入 schema (排除自动生成字段)
   */
  get createSchema() {
    const shape = this.schema.shape as Record<string, z.ZodSchema>
    const filteredShape: Record<string, z.ZodSchema> = {}

    Object.entries(shape).forEach(([key, fieldSchema]) => {
      // 从 schema 元数据中获取字段信息
      const meta = this.schema._meta?.fields?.[key]
      // 排除主键、创建时间、更新时间、软删除字段
      if (!meta?.id && !meta?.createdAt && !meta?.updatedAt && !meta?.softDelete) {
        // 如果字段有默认值，使其可选
        if (meta?.default !== undefined) {
          filteredShape[key] = fieldSchema.optional()
        } else {
          filteredShape[key] = fieldSchema
        }
      }
    })

    return z.object(filteredShape)
  }

  /**
   * 更新输入 schema (排除主键和时间戳，所有字段可选)
   */
  get updateSchema() {
    const shape = this.schema.shape as Record<string, z.ZodSchema>
    const filteredShape: Record<string, z.ZodSchema> = {}

    Object.entries(shape).forEach(([key, fieldSchema]) => {
      // 从 schema 元数据中获取字段信息
      const meta = this.schema._meta?.fields?.[key]
      // 排除主键、创建时间、更新时间、软删除字段
      if (!meta?.id && !meta?.createdAt && !meta?.updatedAt && !meta?.softDelete) {
        filteredShape[key] = fieldSchema.optional()
      }
    })

    return z.object(filteredShape)
  }

  /**
   * 响应 schema (排除敏感字段)
   */
  get responseSchema() {
    // 直接返回 schema，因为它已经是 ZodObject 类型
    return this.schema
  }

  /**
   * 查询参数 schema
   */
  get querySchema() {
    return z.object({
      where: this.updateSchema.partial().optional(),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      take: z.number().int().positive().max(100).optional(),
      skip: z.number().int().nonnegative().optional(),
    })
  }
}

/**
 * 定义实体的工厂函数
 */
export function defineEntity<T extends Record<string, z.ZodSchema>>(
  name: string,
  fields: T,
  config?: {
    tableName?: string
    indexes?: Array<{
      fields: (keyof T)[]
      unique?: boolean
      name?: string
    }>
    compositePrimaryKey?: (keyof T)[]
    ui?: EntityUIConfig
  }
): Entity<z.infer<z.ZodObject<T>>> {
  const baseSchema = z.object(fields)
  const schema = baseSchema as EntitySchema<z.infer<z.ZodObject<T>>>
  
  // 收集字段元数据
  const fieldsMetadata: Record<string, FieldAttributes> = {}
  const relationsMetadata: Record<string, RelationAttributes> = {}

  Object.entries(fields).forEach(([fieldName, fieldSchema]) => {
    const meta = getFieldMeta(fieldSchema)
    if (meta) {
      if (meta.relation) {
        relationsMetadata[fieldName] = meta.relation
      } else {
        fieldsMetadata[fieldName] = meta
      }
    }
  })

  // 添加元数据到 schema
  schema._meta = {
    model: {
      tableName: config?.tableName || name.toLowerCase(),
      indexes: config?.indexes?.map(idx => ({
        ...idx,
        fields: idx.fields as string[]
      })),
      compositePrimaryKey: config?.compositePrimaryKey as string[],
      ui: config?.ui
    },
    fields: fieldsMetadata,
    relations: relationsMetadata
  }

  return new Entity(name, schema, schema._meta.model)
}

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
