/**
 * Extension客户端入口 - 只包含客户端安全的extension功能
 * @module extension-client
 */

// 导出客户端安全的Extension类型
export type {
  Extension,
  ExtensionMetadata,
  ExtensionConfig,
  ExtensionPermission,
} from './extension/types'

// 导出客户端Extension管理器相关类型
export type {
  ExtensionStatus,
  ClientExtensionRegistration,
  ClientExtensionEvents,
} from './extension/unified-manager-client'

// 导出客户端安全的Extension管理器
export { 
  ClientUnifiedExtensionManager,
  clientExtensionManager as unifiedExtensionManager 
} from './extension/unified-manager-client'