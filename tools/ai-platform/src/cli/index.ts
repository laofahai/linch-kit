/**
 * CLI模块导出
 * LinchKit AI工作流引擎 - Phase 2 CLI集成
 * 
 * @version 1.0.0 - 完整集成版本
 */

// 核心处理器
export { 
  StartCommandHandler, 
  handleStartCommand, 
  quickStart,
  type StartCommandOptions,
  type StartCommandResult,
  type ProjectInfo
} from './start-command-handler'

// 增强集成
export {
  EnhancedStartIntegration,
  processEnhancedStart,
  claudeCodeStart,
  type EnhancedStartRequest,
  type EnhancedStartResponse
} from './enhanced-start-integration'

// 便捷导出：Claude Code 主要接口
export { claudeCodeStart as startCommand } from './enhanced-start-integration'
export { quickStart as quickStartCommand } from './start-command-handler'