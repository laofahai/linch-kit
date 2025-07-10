/**
 * Schema注册器 - 运行时Schema定义扩展和管理
 * @module core/schema-registry
 */

import { EventEmitter } from 'eventemitter3'
import { z } from 'zod'

import type { EntityDefinition } from '../types'

/**
 * Schema扩展定义
 */
export interface SchemaExtension {
  targetEntity: string
  fields?: Record<string, unknown>
  relations?: Record<string, unknown>
  validators?: Record<string, z.ZodType>
  hooks?: Record<string, Function>
}

/**
 * Schema注册信息
 */
export interface SchemaRegistration {
  entity: EntityDefinition
  extensions: SchemaExtension[]
  registeredBy: string
  registeredAt: number
  lastModified: number
}

/**
 * 字段扩展定义
 */
export interface FieldExtension {
  name: string
  type: z.ZodType
  required?: boolean
  default?: unknown
  description?: string
  validation?: z.ZodType
}

/**
 * Schema注册器 - 支持运行时Schema扩展和验证
 *
 * 核心功能：
 * - 动态Schema注册
 * - Schema扩展机制（类似Django模型扩展）
 * - 运行时字段添加
 * - 关系定义扩展
 */
export class SchemaRegistry extends EventEmitter {
  private schemas = new Map<string, SchemaRegistration>()
  private globalExtensions = new Map<string, SchemaExtension[]>()

  /**
   * 注册Schema实体
   */
  registerEntity(entity: EntityDefinition, registeredBy = 'unknown'): void {
    if (this.schemas.has(entity.name)) {
      throw new Error(`Entity ${entity.name} is already registered`)
    }

    // 应用全局扩展
    const globalExts = this.globalExtensions.get(entity.name) || []
    const extendedEntity = this.applyExtensions(entity, globalExts)

    const registration: SchemaRegistration = {
      entity: extendedEntity,
      extensions: [...globalExts],
      registeredBy,
      registeredAt: Date.now(),
      lastModified: Date.now(),
    }

    this.schemas.set(entity.name, registration)
    this.emit('entityRegistered', { name: entity.name, entity: extendedEntity, registeredBy })
  }

  /**
   * 扩展现有实体
   */
  extendEntity(entityName: string, extension: SchemaExtension): void {
    const registration = this.schemas.get(entityName)

    if (registration) {
      // 实体已注册，立即应用扩展
      registration.extensions.push(extension)
      registration.entity = this.applyExtensions(registration.entity, [extension])
      registration.lastModified = Date.now()

      this.emit('entityExtended', {
        name: entityName,
        extension,
        entity: registration.entity,
      })
    } else {
      // 实体未注册，保存为全局扩展
      const existing = this.globalExtensions.get(entityName) || []
      existing.push(extension)
      this.globalExtensions.set(entityName, existing)

      this.emit('globalExtensionAdded', { entityName, extension })
    }
  }

  /**
   * 添加字段到实体
   */
  addField(entityName: string, fieldName: string, fieldDef: FieldExtension): void {
    const registration = this.schemas.get(entityName)
    if (!registration) {
      throw new Error(`Entity ${entityName} not found`)
    }

    const extension: SchemaExtension = {
      targetEntity: entityName,
      fields: {
        [fieldName]: fieldDef,
      },
    }

    this.extendEntity(entityName, extension)
  }

  /**
   * 获取实体定义
   */
  getEntity(name: string): EntityDefinition | undefined {
    return this.schemas.get(name)?.entity
  }

  /**
   * 获取所有实体
   */
  getAllEntities(): Map<string, EntityDefinition> {
    const entities = new Map<string, EntityDefinition>()
    for (const [name, registration] of this.schemas) {
      entities.set(name, registration.entity)
    }
    return entities
  }

  /**
   * 获取实体的扩展信息
   */
  getExtensions(entityName: string): SchemaExtension[] {
    return this.schemas.get(entityName)?.extensions || []
  }

  /**
   * 检查实体是否存在
   */
  hasEntity(name: string): boolean {
    return this.schemas.has(name)
  }

  /**
   * 获取实体注册信息
   */
  getRegistration(name: string): SchemaRegistration | undefined {
    return this.schemas.get(name)
  }

  /**
   * 获取实体统计信息
   */
  getStats(): {
    totalEntities: number
    totalExtensions: number
    entitiesWithExtensions: number
  } {
    const totalEntities = this.schemas.size
    const totalExtensions = Array.from(this.schemas.values()).reduce(
      (sum, reg) => sum + reg.extensions.length,
      0
    )
    const entitiesWithExtensions = Array.from(this.schemas.values()).filter(
      reg => reg.extensions.length > 0
    ).length

    return {
      totalEntities,
      totalExtensions,
      entitiesWithExtensions,
    }
  }

  /**
   * 清除所有注册信息
   */
  clear(): void {
    this.schemas.clear()
    this.globalExtensions.clear()
    this.emit('registryCleared')
  }

  /**
   * 移除实体
   */
  unregisterEntity(name: string): void {
    const registration = this.schemas.get(name)
    if (!registration) {
      return
    }

    this.schemas.delete(name)
    this.emit('entityUnregistered', { name, entity: registration.entity })
  }

  /**
   * 应用扩展到实体
   */
  private applyExtensions(
    entity: EntityDefinition,
    extensions: SchemaExtension[]
  ): EntityDefinition {
    let extendedEntity = { ...entity }

    for (const ext of extensions) {
      // 扩展字段
      if (ext.fields) {
        extendedEntity.fields = {
          ...extendedEntity.fields,
          ...ext.fields,
        } as typeof extendedEntity.fields
      }

      // 扩展钩子通过options
      if (ext.hooks && extendedEntity.options) {
        extendedEntity.options = {
          ...extendedEntity.options,
          hooks: {
            ...extendedEntity.options.hooks,
            ...ext.hooks,
          },
        }
      }
    }

    return extendedEntity
  }
}

/**
 * 默认Schema注册器实例
 */
export const schemaRegistry = new SchemaRegistry()
