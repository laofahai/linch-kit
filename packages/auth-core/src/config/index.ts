/**
 * Auth Core 配置模块
 */

export {
  findConfigFile,
  loadAuthConfig,
  generateConfigTemplate
} from './loader'

export type {
  ConfigFileType,
  ConfigLoaderOptions
} from './loader'
