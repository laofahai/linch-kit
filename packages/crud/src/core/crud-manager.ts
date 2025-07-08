/**
 * CRUD 管理器 - 简化版本，平衡封装和灵活性
 *
 * 设计原则：
 * - 提供便捷的高层API
 * - 保留Prisma原生访问
 * - 可选的增强功能（权限、验证、缓存）
 * - 插件扩展支持
 */

import type { Entity as _Entity } from '@linch-kit/schema'
import type { LinchKitUser, IPermissionChecker as AuthPermissionChecker } from '@linch-kit/auth'
import type { PluginManager as CorePluginManager } from '@linch-kit/core'

// 定义类型，避免运行时依赖
interface PrismaClient {
  [key: string]: unknown
  $transaction: <T>(
    callback: (tx: PrismaClient) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ) => Promise<T>
  $queryRaw: <T = unknown>(query: TemplateStringsArray | string, ...values: unknown[]) => Promise<T>
}

interface PluginRegistration {
  plugin: Plugin
  config: Record<string, unknown>
  status: string
  registeredAt: number
}

interface Plugin {
  metadata: {
    id: string
    name: string
    version: string
  }
  init?: (config: Record<string, unknown>) => Promise<void> | void
  hooks?: CrudPluginHooks
}

interface CrudPluginHooks {
  beforeCreate?: (
    entityName: string,
    data: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>
  afterCreate?: (
    entityName: string,
    result: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<void> | void
  beforeUpdate?: (
    entityName: string,
    id: string | number,
    data: Record<string, unknown>,
    existing: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>
  afterUpdate?: (
    entityName: string,
    result: Record<string, unknown>,
    existing: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<void> | void
  beforeDelete?: (
    entityName: string,
    id: string | number,
    existing: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<void> | void
  afterDelete?: (
    entityName: string,
    existing: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<void> | void
  beforeQuery?: (
    entityName: string,
    query: Record<string, unknown>,
    options: Record<string, unknown>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>
}

interface PluginManager {
  getAll(): PluginRegistration[]
}

import type {
  CreateInput,
  UpdateInput,
  QueryInput,
  SchemaRegistry,
  Logger,
  CrudOptions,
  FindOptions,
  PaginatedResult,
  IValidationManager,
  IPermissionChecker,
  ICacheManager,
} from '../types'
import { ValidationManager } from '../validation/validation-manager'
import { PermissionChecker } from '../permissions/permission-checker'
import { CacheManager } from '../cache/cache-manager'

/**
 * CRUD 管理器配置
 */
export interface CrudManagerOptions {
  enablePermissions?: boolean
  enableValidation?: boolean
  enableCache?: boolean
  enableAudit?: boolean
  enableMetrics?: boolean
  authPermissionChecker?: AuthPermissionChecker
  pluginManager?: CorePluginManager
}

/**
 * CRUD 管理器
 */
export class CrudManager {
  private readonly options: Required<
    Omit<CrudManagerOptions, 'authPermissionChecker' | 'pluginManager'>
  > &
    Pick<CrudManagerOptions, 'authPermissionChecker' | 'pluginManager'>
  private readonly validationManager: IValidationManager
  private readonly permissionChecker: IPermissionChecker
  private readonly cacheManager: ICacheManager

  constructor(
    private readonly prisma: PrismaClient,
    private readonly schemaRegistry: SchemaRegistry,
    private readonly logger: Logger,
    private readonly pluginManager?: PluginManager,
    options: CrudManagerOptions = {}
  ) {
    this.options = {
      enablePermissions: options.enablePermissions ?? true,
      enableValidation: options.enableValidation ?? true,
      enableCache: options.enableCache ?? true,
      enableAudit: options.enableAudit ?? true,
      enableMetrics: options.enableMetrics ?? true,
      authPermissionChecker: options.authPermissionChecker,
      pluginManager: options.pluginManager,
    }

    // 初始化管理器组件
    this.validationManager = new ValidationManager(this.schemaRegistry, this.logger)
    this.permissionChecker = new PermissionChecker(
      this.schemaRegistry,
      this.logger,
      options.authPermissionChecker,
      options.pluginManager
    )
    this.cacheManager = new CacheManager(this.logger)
  }

  /**
   * 获取 Prisma 客户端 - 原生访问
   */
  get client(): PrismaClient {
    return this.prisma
  }

  /**
   * 获取实体模型 - 原生 Prisma 模型访问
   */
  model<T = unknown>(entityName: string): T {
    const modelName = entityName.toLowerCase()
    const model = (this.prisma as unknown as Record<string, T>)[modelName]

    if (!model) {
      throw new Error(`Prisma model for entity ${entityName} not found`)
    }

    return model
  }

  /**
   * 便捷创建 - 带可选增强功能
   */
  async create<T>(entityName: string, data: CreateInput<T>, options?: CrudOptions): Promise<T> {
    const model = this.model(entityName)

    // 应用前置插件
    let processedData = data
    if (this.pluginManager) {
      processedData = await this.applyBeforeCreatePlugins(entityName, data, options)
    }

    // 验证
    if (this.options.enableValidation && !options?.skipValidation) {
      await this.validateCreate(entityName, processedData)
    }

    // 权限检查
    if (this.options.enablePermissions && !options?.skipPermissions && options?.user) {
      await this.checkCreatePermission(entityName, options.user, processedData)
    }

    // 执行创建
    const result = await (model as { create: (args: { data: unknown }) => Promise<T> }).create({
      data: processedData,
    })

    // 应用后置插件
    if (this.pluginManager) {
      await this.applyAfterCreatePlugins(entityName, result, options)
    }

    return result
  }

  /**
   * 便捷查询 - 支持简化查询语法
   */
  async findMany<T>(entityName: string, query?: QueryInput, options?: FindOptions): Promise<T[]> {
    const model = this.model(entityName)

    // 构建 Prisma 查询
    let prismaQuery = this.buildPrismaQuery(query)

    // 权限过滤
    if (this.options.enablePermissions && !options?.skipPermissions && options?.user) {
      prismaQuery = await this.applyPermissionFilter(entityName, prismaQuery, options.user, 'read')
    }

    // 应用查询插件
    if (this.pluginManager) {
      prismaQuery = await this.applyQueryPlugins(entityName, prismaQuery, options)
    }

    const results = await (model as { findMany: (query: unknown) => Promise<T[]> }).findMany(
      prismaQuery
    )

    // 字段级权限过滤
    if (this.options.enablePermissions && !options?.skipPermissions && options?.user) {
      return await this.applyFieldPermissions(entityName, results, options.user, 'read')
    }

    return results
  }

  /**
   * 便捷单条查询
   */
  async findFirst<T>(
    entityName: string,
    query?: QueryInput,
    options?: FindOptions
  ): Promise<T | null> {
    const results = await this.findMany<T>(
      entityName,
      {
        ...query,
        limit: 1,
      },
      options
    )

    return results.length > 0 ? results[0] : null
  }

  /**
   * 根据ID查询
   */
  async findById<T>(entityName: string, id: string, options?: FindOptions): Promise<T | null> {
    return await this.findFirst<T>(
      entityName,
      {
        where: [{ field: 'id', operator: '=', value: id }],
      },
      options
    )
  }

  /**
   * 便捷更新
   */
  async update<T>(
    entityName: string,
    id: string,
    data: UpdateInput<T>,
    options?: CrudOptions
  ): Promise<T> {
    const model = this.model(entityName)

    // 检查记录是否存在
    const existing = await this.findById(entityName, id, { skipPermissions: true })
    if (!existing) {
      throw new Error(`Record with ID ${id} not found`)
    }

    // 权限检查
    if (this.options.enablePermissions && !options?.skipPermissions && options?.user) {
      await this.checkUpdatePermission(entityName, options.user, existing, data)
    }

    // 验证
    if (this.options.enableValidation && !options?.skipValidation) {
      await this.validateUpdate(entityName, id, data)
    }

    // 应用前置插件
    let processedData = data
    if (this.pluginManager) {
      processedData = await this.applyBeforeUpdatePlugins(entityName, id, data, existing, options)
    }

    // 执行更新
    const result = await (
      model as { update: (args: { where: { id: string }; data: unknown }) => Promise<T> }
    ).update({
      where: { id },
      data: processedData,
    })

    // 应用后置插件
    if (this.pluginManager) {
      await this.applyAfterUpdatePlugins(entityName, result, existing, options)
    }

    return result
  }

  /**
   * 便捷删除
   */
  async delete(entityName: string, id: string, options?: CrudOptions): Promise<boolean> {
    const model = this.model(entityName)

    const existing = await this.findById(entityName, id, { skipPermissions: true })
    if (!existing) {
      return false
    }

    // 权限检查
    if (this.options.enablePermissions && !options?.skipPermissions && options?.user) {
      await this.checkDeletePermission(entityName, options.user, existing)
    }

    // 应用前置插件
    if (this.pluginManager) {
      await this.applyBeforeDeletePlugins(entityName, id, existing, options)
    }

    // 软删除检查
    const entity = this.schemaRegistry.getEntity(entityName)
    if (entity?.options?.softDelete) {
      await (
        model as { update: (args: { where: { id: string }; data: unknown }) => Promise<unknown> }
      ).update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: options?.user?.id,
        },
      })
    } else {
      await (model as { delete: (args: { where: { id: string } }) => Promise<unknown> }).delete({
        where: { id },
      })
    }

    // 应用后置插件
    if (this.pluginManager) {
      await this.applyAfterDeletePlugins(entityName, existing, options)
    }

    return true
  }

  /**
   * 计数
   */
  async count(entityName: string, query?: QueryInput, options?: FindOptions): Promise<number> {
    const model = this.model(entityName)
    let prismaQuery = this.buildPrismaQuery(query)

    // 权限过滤
    if (this.options.enablePermissions && !options?.skipPermissions && options?.user) {
      prismaQuery = await this.applyPermissionFilter(entityName, prismaQuery, options.user, 'read')
    }

    const countQuery = { where: prismaQuery.where }
    return await (model as { count: (query: { where: unknown }) => Promise<number> }).count(
      countQuery
    )
  }

  /**
   * 分页查询
   */
  async paginate<T>(
    entityName: string,
    query?: QueryInput,
    page: number = 1,
    pageSize: number = 20,
    options?: FindOptions
  ): Promise<PaginatedResult<T>> {
    const total = await this.count(entityName, query, options)

    const data = await this.findMany<T>(
      entityName,
      {
        ...query,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
      options
    )

    const totalPages = Math.ceil(total / pageSize)

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }
  }

  /**
   * 批量创建 - 使用 Prisma 原生批量操作
   */
  async createMany<T>(
    entityName: string,
    data: CreateInput<T>[],
    options?: { skipDuplicates?: boolean }
  ): Promise<{ count: number }> {
    const model = this.model(entityName)

    return await (
      model as {
        createMany: (args: {
          data: unknown[]
          skipDuplicates?: boolean
        }) => Promise<{ count: number }>
      }
    ).createMany({
      data,
      skipDuplicates: options?.skipDuplicates,
    })
  }

  /**
   * 事务支持 - 直接暴露 Prisma 事务
   */
  async transaction<T>(
    callback: (tx: PrismaClient) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T> {
    return await this.prisma.$transaction<T>(callback, options)
  }

  /**
   * 原生查询支持
   */
  async queryRaw<T = unknown>(sql: string, ..._params: unknown[]): Promise<T[]> {
    return (await this.prisma.$queryRaw<T[]>(`${sql}`)) as T[]
  }

  // 私有辅助方法

  private buildPrismaQuery(query?: QueryInput): Record<string, unknown> {
    if (!query) return {}

    const prismaQuery: Record<string, unknown> = {}

    if (query.where) {
      prismaQuery.where = this.buildWhereClause(query.where)
    }

    if (query.orderBy && Array.isArray(query.orderBy)) {
      prismaQuery.orderBy = query.orderBy.map(order => ({
        [order.field]: order.direction,
      }))
    }

    if (query.include && Array.isArray(query.include)) {
      prismaQuery.include = query.include.reduce(
        (acc, field) => {
          acc[field] = true
          return acc
        },
        {} as Record<string, boolean>
      )
    }

    if (query.limit) {
      prismaQuery.take = query.limit
    }

    if (query.offset) {
      prismaQuery.skip = query.offset
    }

    if (query.distinct) {
      prismaQuery.distinct = query.distinct
    }

    return prismaQuery
  }

  private buildWhereClause(
    whereConditions: Array<{ field: string; operator: string; value: unknown }>
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {}

    if (!Array.isArray(whereConditions)) {
      return where
    }

    whereConditions.forEach(condition => {
      const { field, operator, value } = condition

      switch (operator) {
        case '=':
          where[field] = value
          break
        case '!=':
          where[field] = { not: value }
          break
        case '>':
          where[field] = { gt: value }
          break
        case '>=':
          where[field] = { gte: value }
          break
        case '<':
          where[field] = { lt: value }
          break
        case '<=':
          where[field] = { lte: value }
          break
        case 'like':
          where[field] = { contains: value, mode: 'insensitive' }
          break
        case 'in':
          where[field] = { in: value }
          break
        case 'not_in':
          where[field] = { notIn: value }
          break
        case 'is_null':
          where[field] = null
          break
        case 'is_not_null':
          where[field] = { not: null }
          break
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            where[field] = { gte: value[0], lte: value[1] }
          }
          break
      }
    })

    return where
  }

  // 插件钩子方法（简化版）

  private async applyBeforeCreatePlugins<T>(
    entityName: string,
    data: CreateInput<T>,
    options?: CrudOptions
  ): Promise<CreateInput<T>> {
    let processed = data

    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.beforeCreate) {
        processed = (await plugin.plugin.hooks.beforeCreate(
          entityName,
          processed as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )) as CreateInput<T>
      }
    }

    return processed
  }

  private async applyAfterCreatePlugins<T>(
    entityName: string,
    result: T,
    options?: CrudOptions
  ): Promise<void> {
    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.afterCreate) {
        await plugin.plugin.hooks.afterCreate(
          entityName,
          result as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )
      }
    }
  }

  private async applyBeforeUpdatePlugins<T>(
    entityName: string,
    id: string,
    data: UpdateInput<T>,
    existing: unknown,
    options?: CrudOptions
  ): Promise<UpdateInput<T>> {
    let processed = data

    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.beforeUpdate) {
        processed = (await plugin.plugin.hooks.beforeUpdate(
          entityName,
          id as string | number,
          processed as Record<string, unknown>,
          existing as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )) as UpdateInput<T>
      }
    }

    return processed
  }

  private async applyAfterUpdatePlugins<T>(
    entityName: string,
    result: T,
    existing: unknown,
    options?: CrudOptions
  ): Promise<void> {
    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.afterUpdate) {
        await plugin.plugin.hooks.afterUpdate(
          entityName,
          result as Record<string, unknown>,
          existing as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )
      }
    }
  }

  private async applyBeforeDeletePlugins(
    entityName: string,
    id: string,
    existing: unknown,
    options?: CrudOptions
  ): Promise<void> {
    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.beforeDelete) {
        await plugin.plugin.hooks.beforeDelete(
          entityName,
          id as string | number,
          existing as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )
      }
    }
  }

  private async applyAfterDeletePlugins(
    entityName: string,
    existing: unknown,
    options?: CrudOptions
  ): Promise<void> {
    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.afterDelete) {
        await plugin.plugin.hooks.afterDelete(
          entityName,
          existing as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )
      }
    }
  }

  private async applyQueryPlugins(
    entityName: string,
    query: Record<string, unknown>,
    options?: FindOptions
  ): Promise<Record<string, unknown>> {
    let processed = query

    const plugins = this.pluginManager?.getAll() || []
    for (const plugin of plugins) {
      if (plugin.plugin.hooks?.beforeQuery) {
        processed = (await plugin.plugin.hooks.beforeQuery(
          entityName,
          processed as Record<string, unknown>,
          (options || {}) as Record<string, unknown>
        )) as Record<string, unknown>
      }
    }

    return processed
  }

  // 占位符方法 - 具体实现将由专门的类处理

  private async validateCreate<T>(entityName: string, data: CreateInput<T>): Promise<void> {
    if (!this.options.enableValidation) return

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    const errors = await this.validationManager.validateCreate(entity, data)
    if (errors.length > 0) {
      const message = errors.map(e => `${e.field}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${message}`)
    }
  }

  private async validateUpdate<T>(
    entityName: string,
    id: string,
    data: UpdateInput<T>
  ): Promise<void> {
    if (!this.options.enableValidation) return

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    const errors = await this.validationManager.validateUpdate(entity, id, data)
    if (errors.length > 0) {
      const message = errors.map(e => `${e.field}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${message}`)
    }
  }

  private async checkCreatePermission<T>(
    entityName: string,
    user: LinchKitUser,
    data: CreateInput<T>
  ): Promise<void> {
    if (!this.options.enablePermissions) return

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    await this.permissionChecker.checkCreate(entity, user, data)
  }

  private async checkUpdatePermission<T>(
    entityName: string,
    user: LinchKitUser,
    existing: unknown,
    data: UpdateInput<T>
  ): Promise<void> {
    if (!this.options.enablePermissions) return

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    await this.permissionChecker.checkUpdate(entity, user, existing, data)
  }

  private async checkDeletePermission(
    entityName: string,
    user: LinchKitUser,
    existing: unknown
  ): Promise<void> {
    if (!this.options.enablePermissions) return

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    await this.permissionChecker.checkDelete(entity, user, existing)
  }

  private async applyPermissionFilter(
    entityName: string,
    query: Record<string, unknown>,
    user: LinchKitUser,
    operation: string
  ): Promise<Record<string, unknown>> {
    if (!this.options.enablePermissions) return query

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    const rowFilter = await this.permissionChecker.buildRowFilter(
      entity,
      user,
      operation as 'read' | 'write' | 'delete'
    )
    return { ...query, ...rowFilter }
  }

  private async applyFieldPermissions<T>(
    entityName: string,
    data: T[],
    user: LinchKitUser,
    operation: string
  ): Promise<T[]> {
    if (!this.options.enablePermissions) return data

    const entity = this.schemaRegistry.getEntity(entityName)
    if (!entity) {
      throw new Error(`Entity '${entityName}' not found`)
    }

    const filteredData = await this.permissionChecker.filterFields(
      entity,
      user,
      data,
      operation as 'read' | 'write'
    )
    return filteredData as T[]
  }
}
