/**
 * Console 模块客户端专用导出
 *
 * 仅包含客户端安全的功能，不包含服务端代码
 */

'use client'

// Provider和上下文 (客户端组件)
export {
  ConsoleProvider,
  useConsoleContext,
  useConsolePermission,
  useConsolePermissions,
  useConsoleTheme,
  useConsoleConfiguration,
  useConsoleTenant,
  PermissionGuard,
  FeatureGuard,
} from './providers/ConsoleProvider'

export type {
  ConsoleProviderProps,
  PermissionGuardProps,
  FeatureGuardProps,
} from './providers/ConsoleProvider'

// 暂时不导出其他功能，避免依赖问题
