/**
 * 平台相关共享类型
 * @module shared-types/platform
 */

import type { ExtensionContext } from './extension'

/**
 * 平台管理器接口
 */
export interface PlatformManager {
  /** 获取上下文 */
  getContext(): ExtensionContext
  /** 初始化平台 */
  initialize(): Promise<void>
  /** 关闭平台 */
  shutdown(): Promise<void>
}

/**
 * 实体定义接口
 */
export interface EntityDefinition {
  name: string
  fields: Record<string, FieldDefinition>
  relationships?: Record<string, RelationshipDefinition>
}

/**
 * 字段定义接口
 */
export interface FieldDefinition {
  type: string
  required?: boolean
  default?: unknown
  validation?: unknown
  description?: string
}

/**
 * 关系定义接口
 */
export interface RelationshipDefinition {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany'
  target: string
  foreignKey?: string
  mappedBy?: string
}

/**
 * Schema 验证结果
 */
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

/**
 * 验证错误
 */
export interface ValidationError {
  field?: string
  message: string
  code: string
  value?: unknown
}