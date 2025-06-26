/**
 * CRUD 工厂函数 - 提供便捷的创建方法
 */

import type { PrismaClient } from '@prisma/client'
import type { SchemaRegistry } from '@linch-kit/schema'
import type { Logger, PluginManager } from '@linch-kit/core'
import { CrudManager, type CrudManagerOptions } from './core/crud-manager'
import { PrismaQueryBuilder } from './core/query-builder/prisma-query-builder'

/**
 * 创建 CRUD 管理器
 */
export function createCrudManager(
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger,
  options?: CrudManagerOptions & {
    pluginManager?: PluginManager
  }
): CrudManager {
  const { pluginManager, ...crudOptions } = options || {}
  
  return new CrudManager(
    prisma,
    schemaRegistry,
    logger,
    pluginManager,
    crudOptions
  )
}

/**
 * 创建查询构建器
 */
export function createQueryBuilder<T = unknown>(
  entityName: string,
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger,
  pluginManager?: PluginManager
): PrismaQueryBuilder<T> {
  return PrismaQueryBuilder.create<T>(
    entityName,
    prisma,
    schemaRegistry,
    logger,
    pluginManager
  )
}

/**
 * 创建带默认配置的 CRUD 管理器
 */
export function createDefaultCrudManager(
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger,
  pluginManager?: PluginManager
): CrudManager {
  return createCrudManager(prisma, schemaRegistry, logger, {
    enablePermissions: true,
    enableValidation: true,
    enableCache: true,
    enableAudit: true,
    enableMetrics: true,
    pluginManager
  })
}

/**
 * 创建最小化 CRUD 管理器（仅提供基础功能）
 */
export function createMinimalCrudManager(
  prisma: PrismaClient,
  schemaRegistry: SchemaRegistry,
  logger: Logger
): CrudManager {
  return createCrudManager(prisma, schemaRegistry, logger, {
    enablePermissions: false,
    enableValidation: false,
    enableCache: false,
    enableAudit: false,
    enableMetrics: false
  })
}