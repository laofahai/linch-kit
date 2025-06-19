// Core exports
export * from './core/types'
export * from './core/decorators'
export * from './core/entity'

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
