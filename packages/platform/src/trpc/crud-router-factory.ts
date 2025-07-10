/**
 * CRUD tRPC Router Factory - 核心功能实现
 * @module platform/trpc/crud-router-factory
 */

import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core/extension/types'

import { CRUDManager } from '../crud/crud-manager'
import { QueryBuilder } from '../crud/query-builder'
import { PermissionChecker } from '../crud/permission-checker'
import { ValidationManager } from '../crud/validation-manager'
import { CacheManager } from '../crud/cache-manager'
import type {
  CRUDOptions,
  QueryOptions,
  CreateInput,
  UpdateInput,
  CRUDResult,
  CRUDEntity,
} from '../crud/types'

import type { TRPCContext } from './types'

/**
 * CRUD Router 配置选项
 */
export interface CRUDRouterOptions<T extends CRUDEntity = CRUDEntity> {
  /** 实体名称 */
  entityName: string
  /** Zod Schema 定义 */
  schema: z.ZodSchema<T>
  /** Extension 上下文 */
  extensionContext?: ExtensionContext
  /** CRUD 管理器配置 */
  crudOptions?: Partial<CRUDOptions<T>>
  /** 权限配置 */
  permissions?: {
    create?: string[]
    read?: string[]
    update?: string[]
    delete?: string[]
  }
  /** 缓存配置 */
  cache?: {
    enabled: boolean
    ttl?: number
  }
  /** 自定义钩子 */
  hooks?: {
    beforeCreate?: (input: CreateInput<T>, ctx: TRPCContext) => Promise<CreateInput<T>>
    afterCreate?: (result: CRUDResult<T>, ctx: TRPCContext) => Promise<CRUDResult<T>>
    beforeUpdate?: (input: UpdateInput<T>, ctx: TRPCContext) => Promise<UpdateInput<T>>
    afterUpdate?: (result: CRUDResult<T>, ctx: TRPCContext) => Promise<CRUDResult<T>>
    beforeDelete?: (id: string, ctx: TRPCContext) => Promise<void>
    afterDelete?: (result: CRUDResult<boolean>, ctx: TRPCContext) => Promise<void>
  }
}

/**
 * 创建完整的 CRUD tRPC Router
 */
export function createCRUD<T extends CRUDEntity = CRUDEntity>(options: CRUDRouterOptions<T>) {
  const t = initTRPC.context<TRPCContext>().create()
  const {
    entityName,
    schema,
    extensionContext,
    crudOptions = {},
    permissions = {},
    cache = { enabled: false },
    hooks = {},
  } = options

  // 初始化管理器
  const crudManager = new CRUDManager<T>({
    entityName,
    schema,
    extensionContext,
    ...crudOptions,
  })

  const _queryBuilder = new QueryBuilder<T>(schema, extensionContext)
  const permissionChecker = new PermissionChecker(extensionContext)
  const validationManager = new ValidationManager<T>(schema, extensionContext)
  const cacheManager = cache.enabled ? new CacheManager(extensionContext, cache.ttl) : null

  // 权限检查中间件
  const checkPermission = (operation: 'create' | 'read' | 'update' | 'delete') =>
    t.middleware(({ ctx, next }) => {
      const requiredPermissions = permissions[operation] || []

      if (requiredPermissions.length > 0) {
        const hasPermission = permissionChecker.checkPermissions(
          ctx.user?.permissions || [],
          requiredPermissions
        )

        if (!hasPermission) {
          throw new Error(`Insufficient permissions for ${operation} operation on ${entityName}`)
        }
      }

      return next()
    })

  // 缓存中间件
  const cacheMiddleware = t.middleware(({ ctx, next }) => {
    // 在实际中间件中处理缓存逻辑
    ctx.cache = cacheManager
    return next()
  })

  // 基础procedure
  const baseProcedure = t.procedure.use(cacheMiddleware)

  return t.router({
    /**
     * 创建实体
     */
    create: baseProcedure
      .use(checkPermission('create'))
      .input(schema.omit({ id: true, createdAt: true, updatedAt: true }))
      .mutation(async ({ input }) => {
        // 前置钩子
        const processedInput = hooks.beforeCreate
          ? await hooks.beforeCreate(input as CreateInput<T>, ctx)
          : (input as CreateInput<T>)

        // 验证输入
        const validationResult = await validationManager.validateInput(processedInput, 'create')
        if (!validationResult.success) {
          throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`)
        }

        // 执行创建
        const result = await crudManager.create(processedInput)

        // 后置钩子
        const finalResult = hooks.afterCreate ? await hooks.afterCreate(result, ctx) : result

        // 清除相关缓存
        if (cacheManager) {
          await cacheManager.invalidatePattern(`${entityName}:*`)
        }

        extensionContext?.logger.info(`Created ${entityName}`, { id: finalResult.data?.id })
        return finalResult
      }),

    /**
     * 根据ID获取实体
     */
    findById: baseProcedure
      .use(checkPermission('read'))
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const cacheKey = `${entityName}:${input.id}`

        // 尝试从缓存获取
        if (cacheManager) {
          const cached = await cacheManager.get<T>(cacheKey)
          if (cached) {
            extensionContext?.logger.debug(`Cache hit for ${entityName}:${input.id}`)
            return { success: true, data: cached, fromCache: true }
          }
        }

        const result = await crudManager.findById(input.id)

        // 缓存结果
        if (cacheManager && result.success && result.data) {
          await cacheManager.set(cacheKey, result.data)
        }

        return result
      }),

    /**
     * 查询实体列表
     */
    findMany: baseProcedure
      .use(checkPermission('read'))
      .input(
        z.object({
          where: z.record(z.unknown()).optional(),
          orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
          take: z.number().min(1).max(100).default(20),
          skip: z.number().min(0).default(0),
          include: z.record(z.boolean()).optional(),
        })
      )
      .query(async ({ input }) => {
        const queryOptions: QueryOptions<T> = {
          where: input.where,
          orderBy: input.orderBy,
          pagination: {
            take: input.take,
            skip: input.skip,
          },
          include: input.include,
        }

        const cacheKey = `${entityName}:query:${JSON.stringify(queryOptions)}`

        // 尝试从缓存获取
        if (cacheManager) {
          const cached = await cacheManager.get<T[]>(cacheKey)
          if (cached) {
            extensionContext?.logger.debug(`Cache hit for ${entityName} query`)
            return { success: true, data: cached, fromCache: true }
          }
        }

        const result = await crudManager.findMany(queryOptions)

        // 缓存结果
        if (cacheManager && result.success && result.data) {
          await cacheManager.set(cacheKey, result.data)
        }

        return result
      }),

    /**
     * 更新实体
     */
    update: baseProcedure
      .use(checkPermission('update'))
      .input(
        z.object({
          id: z.string(),
          data: schema.partial().omit({ id: true, createdAt: true, updatedAt: true }),
        })
      )
      .mutation(async ({ input }) => {
        // 前置钩子
        const processedInput = hooks.beforeUpdate
          ? await hooks.beforeUpdate(input.data as UpdateInput<T>, ctx)
          : (input.data as UpdateInput<T>)

        // 验证输入
        const validationResult = await validationManager.validateInput(processedInput, 'update')
        if (!validationResult.success) {
          throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`)
        }

        // 执行更新
        const result = await crudManager.update(input.id, processedInput)

        // 后置钩子
        const finalResult = hooks.afterUpdate ? await hooks.afterUpdate(result, ctx) : result

        // 清除相关缓存
        if (cacheManager) {
          await cacheManager.invalidate(`${entityName}:${input.id}`)
          await cacheManager.invalidatePattern(`${entityName}:query:*`)
        }

        extensionContext?.logger.info(`Updated ${entityName}`, { id: input.id })
        return finalResult
      }),

    /**
     * 删除实体
     */
    delete: baseProcedure
      .use(checkPermission('delete'))
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        // 前置钩子
        if (hooks.beforeDelete) {
          await hooks.beforeDelete(input.id, ctx)
        }

        // 执行删除
        const result = await crudManager.delete(input.id)

        // 后置钩子
        if (hooks.afterDelete) {
          await hooks.afterDelete(result, ctx)
        }

        // 清除相关缓存
        if (cacheManager) {
          await cacheManager.invalidate(`${entityName}:${input.id}`)
          await cacheManager.invalidatePattern(`${entityName}:query:*`)
        }

        extensionContext?.logger.info(`Deleted ${entityName}`, { id: input.id })
        return result
      }),

    /**
     * 批量创建
     */
    createMany: baseProcedure
      .use(checkPermission('create'))
      .input(z.array(schema.omit({ id: true, createdAt: true, updatedAt: true })).max(50))
      .mutation(async ({ input }) => {
        const results = []

        for (const item of input) {
          // 前置钩子
          const processedInput = hooks.beforeCreate
            ? await hooks.beforeCreate(item as CreateInput<T>, ctx)
            : (item as CreateInput<T>)

          // 验证输入
          const validationResult = await validationManager.validateInput(processedInput, 'create')
          if (!validationResult.success) {
            throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`)
          }

          const result = await crudManager.create(processedInput)
          results.push(result)
        }

        // 清除相关缓存
        if (cacheManager) {
          await cacheManager.invalidatePattern(`${entityName}:*`)
        }

        extensionContext?.logger.info(`Created ${results.length} ${entityName} entities`)
        return { success: true, data: results }
      }),

    /**
     * 获取实体总数
     */
    count: baseProcedure
      .use(checkPermission('read'))
      .input(
        z.object({
          where: z.record(z.unknown()).optional(),
        })
      )
      .query(async ({ input }) => {
        const cacheKey = `${entityName}:count:${JSON.stringify(input.where || {})}`

        // 尝试从缓存获取
        if (cacheManager) {
          const cached = await cacheManager.get<number>(cacheKey)
          if (cached !== null) {
            extensionContext?.logger.debug(`Cache hit for ${entityName} count`)
            return { success: true, data: cached, fromCache: true }
          }
        }

        const result = await crudManager.count(input.where)

        // 缓存结果
        if (cacheManager && result.success) {
          await cacheManager.set(cacheKey, result.data)
        }

        return result
      }),

    /**
     * 检查实体是否存在
     */
    exists: baseProcedure
      .use(checkPermission('read'))
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const result = await crudManager.findById(input.id)
        return {
          success: true,
          data: result.success && !!result.data,
        }
      }),
  })
}

/**
 * 创建简化的 CRUD Router（只包含基本操作）
 */
export function createBasicCRUD<T extends CRUDEntity = CRUDEntity>(
  entityName: string,
  schema: z.ZodSchema<T>,
  extensionContext?: ExtensionContext
) {
  return createCRUD({
    entityName,
    schema,
    extensionContext,
    permissions: {}, // 无权限检查
    cache: { enabled: false }, // 无缓存
  })
}

/**
 * 创建带权限的 CRUD Router
 */
export function createSecuredCRUD<T extends CRUDEntity = CRUDEntity>(
  entityName: string,
  schema: z.ZodSchema<T>,
  permissions: CRUDRouterOptions<T>['permissions'],
  extensionContext?: ExtensionContext
) {
  return createCRUD({
    entityName,
    schema,
    extensionContext,
    permissions,
    cache: { enabled: true, ttl: 300 }, // 5分钟缓存
  })
}

/**
 * 创建高性能 CRUD Router（带缓存优化）
 */
export function createCachedCRUD<T extends CRUDEntity = CRUDEntity>(
  entityName: string,
  schema: z.ZodSchema<T>,
  cacheOptions: { ttl?: number } = {},
  extensionContext?: ExtensionContext
) {
  return createCRUD({
    entityName,
    schema,
    extensionContext,
    permissions: {},
    cache: {
      enabled: true,
      ttl: cacheOptions.ttl || 600, // 默认10分钟缓存
    },
  })
}
