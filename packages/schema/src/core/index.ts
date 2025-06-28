/**
 * @linch-kit/schema 核心功能导出
 *
 * 导出Schema包的核心业务逻辑，包括字段定义、实体定义和Schema构建器
 *
 * @module core
 */

// ==================== 字段定义功能 ====================
/**
 * 字段定义和操作相关功能
 */
export { defineField } from './field'

// ==================== 实体定义功能 ====================
/**
 * 实体定义和操作相关功能
 */
export {
    defineEntities, defineEntity, entityToTypeString,
    isEntity
} from './entity'

// ==================== Schema构建器 ====================
/**
 * Schema构建器核心逻辑
 */
export {
    SchemaBuilder,
    compose,
    conditional,
    fromEntity,
    group,
    mixin,
    schema,
    template,
    variants
} from './schema'

// ==================== 核心类型重导出 ====================
/**
 * 核心类型定义（为了便于使用）
 */
export type {
    Entity,
    EntityDefinition, FieldDefinition
} from '../types'

