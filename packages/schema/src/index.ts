// Core exports
export * from './core/types'
export * from './core/decorators'  // 这里导出 defineField
export * from './core/entity'      // 这里导出 defineEntity
export * from './core/ui-types'

// 显式导出主要函数，确保它们可用
export { defineField } from './core/decorators'
export { defineEntity } from './core/entity'

// Core types and utilities (避免重复导出)
export {
  type MinimalFieldConfig,
  type BasicFieldConfig,
  type DatabaseConfig,
  type DatabaseFieldType,
  type RelationType,
  type FieldMetadata,
  type EntityMetadata,
  type CoreSchema,
  type CoreEntityDefinition,
  FIELD_META_SYMBOL,
  ENTITY_META_SYMBOL,
  validateFieldConfig,
  validateEntityConfig,
  getFieldMeta,
  setFieldMeta,
  getEntityMeta,
  setEntityMeta,
} from './core/core-types'

// I18n exports
export * from './i18n'

// Generator exports (only types and non-Node.js functions)
export type {
  PrismaGeneratorOptions,
  ValidatorGeneratorOptions,
  MockGeneratorOptions,
  OpenAPIGeneratorOptions
} from './generators/types'

// CLI plugin exports (safe for frontend)
export { schemaCliPlugin, registerSchemaCliPlugin } from './plugins/cli-plugin'

// 为插件加载器提供默认导出
import { schemaCliPlugin } from './plugins/cli-plugin'

// 当作为插件加载时，导出 CLI 插件
export default schemaCliPlugin

// Note: File generation functions moved to ./generators entry point
// to avoid importing Node.js modules in frontend environments
