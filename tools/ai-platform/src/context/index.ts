/**
 * Context Module - 统一的上下文管理
 * 合并了原来的 context-query-tool 和 enhanced-context-tool
 * @version v2.0.3
 */

export { ContextManager } from './context-manager.js'

export type {
  ContextInfo,
  EntityInfo,
  RelationshipInfo,
  DocReference,
  Example,
  ImplementationSuggestion,
  ContextQueryResult
} from './context-manager.js'

export { DetectedAction } from './context-manager.js'

// 导出类型定义
export * from './types.js'