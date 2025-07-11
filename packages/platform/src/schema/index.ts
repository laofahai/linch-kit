/**
 * Schema module - runtime entity definitions and validation
 * @module platform/schema
 */

// 重新导出Schema运行时功能 (从tools/schema移植核心功能)
export { defineEntity, Entity, type EntityDefinition } from './entity'
export { FieldBuilder, type FieldDefinition, type FieldType } from './field'
export { Validator, createValidator } from './validator'
