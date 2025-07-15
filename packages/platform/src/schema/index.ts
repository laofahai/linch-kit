/**
 * Schema module - runtime entity definitions and validation
 * @module platform/schema
 */

// 重新导出@linch-kit/schema的核心功能，避免重复实现
export type { EntityDefinition, FieldDefinition, FieldType } from '@linch-kit/schema'

// 运行时Schema功能 (保持现有API兼容性)
export { defineEntity, Entity } from './entity'
export { FieldBuilder } from './field'
export { Validator, createValidator } from './validator'
