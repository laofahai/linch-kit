/**
 * @linch-kit/auth-core/cli
 *
 * CLI 插件导出 - 仅用于 Node.js 环境
 * 
 * 这个文件包含需要 Node.js 模块的 CLI 功能，
 * 不应该在前端环境中导入
 */

// CLI 插件导出
export { authCoreCliPlugin, registerAuthCoreCliPlugin } from './plugins/cli-plugin'

// 自动注册 CLI 插件
import { registerAuthCoreCliPlugin } from './plugins/cli-plugin'

// 在 CLI 环境中自动注册
registerAuthCoreCliPlugin()
