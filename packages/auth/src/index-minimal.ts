/**
 * @linch-kit/auth - 最小化版本
 *
 * 临时简化版本，用于解决 DTS 构建超时问题
 */

// 只导出最基本的功能
export { UltraMinimalUserTemplate, UltraMinimalAuthKit } from './schemas/user-ultra-minimal'

// 基础类型导出
export type {
  AuthUser,
  AuthSession,
  AuthProvider,
  AuthCoreConfig,
} from './types/auth'

// 基础配置导出
export {
  createAuthConfig,
  createSimpleAuthConfig,
  defaultAuthConfig
} from './core/auth'

// 配置插件导出
export { authConfigPlugin, registerAuthCoreConfigPlugin } from './plugins/config-plugin'

// 自动注册配置插件
import { registerAuthCoreConfigPlugin } from './plugins/config-plugin'
registerAuthCoreConfigPlugin()
