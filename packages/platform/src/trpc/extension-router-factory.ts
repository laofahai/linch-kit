/**
 * Extension-based tRPC Router Factory
 * @module platform/trpc/extension-router-factory
 *
 * 基于LinchKit Extension系统创建tRPC路由，而不是重复实现CRUD
 */

import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'

import { CRUDExtension } from '../extensions/crud-extension'

import type { TRPCContext } from './types'

/**
 * Extension Router配置选项
 */
export interface ExtensionRouterOptions<T = unknown> {
  /** 实体名称 */
  entityName: string
  /** Zod Schema定义 */
  schema: z.ZodSchema<T>
  /** Extension上下文 */
  extensionContext: ExtensionContext
  /** 权限配置 */
  permissions?: {
    create?: string[]
    read?: string[]
    update?: string[]
    delete?: string[]
  }
}

/**
 * 基于Extension系统创建tRPC Router
 *
 * 这是platform包的正确实现方式：
 * - 使用Extension系统而不是重复实现
 * - 集成Extension的事件和日志系统
 * - 保持与LinchKit架构的一致性
 */
export function createExtensionRouter<T = unknown>(options: ExtensionRouterOptions<T>) {
  const t = initTRPC.context<TRPCContext>().create()
  const { entityName, schema, extensionContext, permissions = {} } = options

  // 创建CRUD Extension适配器
  const crudExtension = new CRUDExtension({ extensionContext })
  const operations = crudExtension.createEntityOperations(entityName, schema)

  // 权限检查中间件
  const checkPermission = (operation: 'create' | 'read' | 'update' | 'delete') =>
    t.middleware(({ ctx, next }) => {
      const requiredPermissions = permissions[operation] || []

      if (requiredPermissions.length > 0) {
        // 使用Extension的权限系统
        const hasPermission =
          ctx.user?.permissions?.some(p => requiredPermissions.includes(p)) || false

        if (!hasPermission) {
          throw new Error(`Insufficient permissions for ${operation} operation on ${entityName}`)
        }
      }

      return next()
    })

  return t.router({
    /**
     * 创建实体
     */
    create: t.procedure
      .use(checkPermission('create'))
      .input(
        (schema as unknown as z.ZodObject<Record<string, unknown>>).omit({
          id: true,
          createdAt: true,
          updatedAt: true,
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await operations.create(input as Partial<T>)
          return { success: true, data: result }
        } catch (error) {
          extensionContext.logger.error(`Failed to create ${entityName}`, { error })
          return { success: false, error: (error as Error).message }
        }
      }),

    /**
     * 根据ID获取实体
     */
    findById: t.procedure
      .use(checkPermission('read'))
      .input(z.object({ id: z.union([z.string(), z.number()]) }))
      .query(async ({ input }) => {
        try {
          const result = await operations.findById(String(input.id))
          return { success: true, data: result }
        } catch (error) {
          extensionContext.logger.error(`Failed to find ${entityName} by id`, { error })
          return { success: false, error: (error as Error).message }
        }
      }),

    /**
     * 查询实体列表
     */
    findMany: t.procedure
      .use(checkPermission('read'))
      .input(
        z.object({
          where: z.record(z.unknown()).optional(),
          orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
          take: z.number().min(1).max(100).default(20),
          skip: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        try {
          const result = await operations.find(input.where || {})
          // 简单的分页实现（实际应由数据层处理）
          const paginatedResult = result.slice(input.skip, input.skip + input.take)
          return {
            success: true,
            data: paginatedResult,
            total: result.length,
            hasMore: result.length > input.skip + input.take,
          }
        } catch (error) {
          extensionContext.logger.error(`Failed to find ${entityName} entities`, { error })
          return { success: false, error: (error as Error).message }
        }
      }),

    /**
     * 更新实体
     */
    update: t.procedure
      .use(checkPermission('update'))
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
          data: (schema as unknown as z.ZodObject<Record<string, unknown>>)
            .partial()
            .omit({ id: true, createdAt: true, updatedAt: true }),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await operations.update(String(input.id), input.data as Partial<T>)
          return { success: true, data: result }
        } catch (error) {
          extensionContext.logger.error(`Failed to update ${entityName}`, { error })
          return { success: false, error: (error as Error).message }
        }
      }),

    /**
     * 删除实体
     */
    delete: t.procedure
      .use(checkPermission('delete'))
      .input(z.object({ id: z.union([z.string(), z.number()]) }))
      .mutation(async ({ input }) => {
        try {
          const success = await operations.delete(String(input.id))
          return { success, data: null }
        } catch (error) {
          extensionContext.logger.error(`Failed to delete ${entityName}`, { error })
          return { success: false, error: (error as Error).message }
        }
      }),
  })
}

/**
 * 创建简化的Extension Router（无权限检查）
 */
export function createBasicExtensionRouter<T = unknown>(
  entityName: string,
  schema: z.ZodSchema<T>,
  extensionContext: ExtensionContext
) {
  return createExtensionRouter({
    entityName,
    schema,
    extensionContext,
    permissions: {},
  })
}

/**
 * 创建带权限的Extension Router
 */
export function createSecuredExtensionRouter<T = unknown>(
  entityName: string,
  schema: z.ZodSchema<T>,
  permissions: ExtensionRouterOptions<T>['permissions'],
  extensionContext: ExtensionContext
) {
  return createExtensionRouter({
    entityName,
    schema,
    extensionContext,
    permissions,
  })
}
