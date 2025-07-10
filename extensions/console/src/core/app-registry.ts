/**
 * Console专用应用注册器 - 基于Core.AppRegistry，添加Console特定功能
 * @module core/app-registry
 * @deprecated 大部分功能已迁移至 @linch-kit/core/registry/app-registry
 */

import { AppRegistry as CoreAppRegistry } from '@linch-kit/core/client'

// 重新导出Core包中的类型以保持兼容性
export type {
  ModelExtension,
  RouteRegistration,
  ComponentRegistration,
  PageRouteRegistration,
  MenuItemDefinition,
  MenuRegistration,
} from '@linch-kit/core/client'

/**
 * Console专用应用注册器
 *
 * @deprecated 使用 @linch-kit/core 的 AppRegistry 代替
 * 保留仅为兼容性，建议直接使用 CoreAppRegistry
 */
export class AppRegistry extends CoreAppRegistry {
  // Console特定功能可以在这里添加
  // 所有基础功能已在 @linch-kit/core 中实现
}

/**
 * 默认应用注册器实例
 */
export const appRegistry = new AppRegistry()
