/**
 * @linch-kit/schema CLI命令导出
 * 集成到@linch-kit/core的CLI系统
 */

export { schemaCommands } from './commands'

// 导出单个命令供按需使用
export { 
  generateSchemaCommand,
  validateSchemaCommand, 
  initSchemaCommand,
  infoSchemaCommand
} from './commands'