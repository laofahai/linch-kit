// UI Components
export * from './components/ui'

// CRUD Components
export * from './components/crud'

// UI Blocks
export * from './components/blocks'

// Providers
export * from './providers/theme-provider'

// Theme Toggle
export * from './components/theme-toggle'

// Toast System
export * from './components/ui/sonner'
export * from './lib/toast'

// Utilities
export * from './lib/utils'

// i18n Support
export * from './i18n'
export * from './i18n/hooks'

// Schema Integration
// 选择性导出 schema 模块，避免命名冲突
export {
  generateTableColumns,
  generateFormFields,
  generateSearchConfig,
  getFieldDisplayValue,
  createTableColumnBuilder,
  createFormFieldBuilder,
  integrateSchemaUI,
  createSchemaUIIntegrator,
  batchIntegrateSchemaUI,
  UIConfigPresets,
  type SearchConfig,
  type ExtendedFormFieldConfig as UIFormFieldConfig,
  type UIIntegrationOptions,
  type UIIntegrationResult,
} from './schema'

// Schema 包模块扩展 - 必须导入以激活类型扩展
import './schema/field-config-extensions'

