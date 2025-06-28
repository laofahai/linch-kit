/**
 * @linch-kit/auth CLI命令导出
 * 
 * 集成到@linch-kit/core的CLI系统，提供Auth相关的命令行工具
 * 
 * @module cli
 */

// ==================== CLI命令集合 ====================
/**
 * Auth包的完整CLI命令集合
 */
export { authCommands } from './commands'

// ==================== 单个命令导出 ====================
/**
 * 单个命令导出，供按需使用或自定义CLI集成
 */
export { 
  initAuthCommand,
  createUserCommand,
  listUsersCommand,
  resetPasswordCommand,
  setupMFACommand,
  auditCommand
} from './commands'
