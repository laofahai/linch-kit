/**
 * CRUD Router Factory - 兼容层
 * @module platform/trpc/crud-router-factory
 *
 * 注意：这是一个向后兼容的包装器
 * 新代码应该使用 extension-router-factory.ts
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

import {
  createExtensionRouter,
  createBasicExtensionRouter,
  createSecuredExtensionRouter,
  type ExtensionRouterOptions,
} from './extension-router-factory'

/**
 * @deprecated 使用 ExtensionRouterOptions 代替
 */
export interface CRUDRouterOptions<T = unknown> extends ExtensionRouterOptions<T> {
  /** @deprecated 不再支持，使用extensionContext代替 */
  crudOptions?: unknown
  /** @deprecated 不再支持缓存配置 */
  cache?: {
    enabled: boolean
    ttl?: number
  }
  /** @deprecated 不再支持钩子，使用Extension事件系统代替 */
  hooks?: unknown
}

/**
 * @deprecated 使用 createExtensionRouter 代替
 *
 * 创建CRUD Router的向后兼容函数
 */
export function createCRUD<T = unknown>(options: CRUDRouterOptions<T>) {
  console.warn(
    'createCRUD is deprecated. Please use createExtensionRouter from extension-router-factory.ts'
  )

  const { entityName, schema, extensionContext, permissions } = options

  if (!extensionContext) {
    throw new Error('extensionContext is required for createCRUD')
  }

  // 委托给新的实现
  return createExtensionRouter({
    entityName,
    schema,
    extensionContext,
    permissions,
  })
}

/**
 * @deprecated 使用 createBasicExtensionRouter 代替
 */
export function createBasicCRUD<T = unknown>(
  entityName: string,
  schema: z.ZodSchema<T>,
  extensionContext?: ExtensionContext
) {
  console.warn(
    'createBasicCRUD is deprecated. Please use createBasicExtensionRouter from extension-router-factory.ts'
  )

  if (!extensionContext) {
    throw new Error('extensionContext is required for createBasicCRUD')
  }

  return createBasicExtensionRouter(entityName, schema, extensionContext)
}

/**
 * @deprecated 使用 createSecuredExtensionRouter 代替
 */
export function createSecuredCRUD<T = unknown>(
  entityName: string,
  schema: z.ZodSchema<T>,
  permissions: ExtensionRouterOptions<T>['permissions'],
  extensionContext?: ExtensionContext
) {
  console.warn(
    'createSecuredCRUD is deprecated. Please use createSecuredExtensionRouter from extension-router-factory.ts'
  )

  if (!extensionContext) {
    throw new Error('extensionContext is required for createSecuredCRUD')
  }

  return createSecuredExtensionRouter(entityName, schema, permissions, extensionContext)
}

/**
 * @deprecated 缓存功能已移除，使用 createExtensionRouter 代替
 */
export function createCachedCRUD<T = unknown>(
  entityName: string,
  schema: z.ZodSchema<T>,
  _cacheOptions: { ttl?: number } = {},
  extensionContext?: ExtensionContext
) {
  console.warn(
    'createCachedCRUD is deprecated and cache support has been removed. Please use createExtensionRouter from extension-router-factory.ts'
  )

  if (!extensionContext) {
    throw new Error('extensionContext is required')
  }

  return createExtensionRouter({
    entityName,
    schema,
    extensionContext,
  })
}

// 导出新的类型和接口以便迁移
export type { ExtensionRouterOptions }
export {
  createExtensionRouter,
  createBasicExtensionRouter,
  createSecuredExtensionRouter,
} from './extension-router-factory'
