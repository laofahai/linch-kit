/**
 * CRUD管理器 - 基于 Prisma ORM
 * 
 * 设计原则：
 * - 使用 Prisma 而不是自己实现 ORM 功能
 * - 利用 Prisma 的类型安全和代码生成
 * - 集成 Prisma 的事务和连接池管理
 * - 保持与 LinchKit Schema 系统的兼容性
 */

import type { PrismaClient } from '@prisma/client'
import type { Entity, SchemaRegistry } from '@linch-kit/schema'
import type { User } from '@linch-kit/auth'
import type { Logger } from '@linch-kit/core'
import type {
  ICrudManager,
  CreateInput,
  UpdateInput,
  QueryInput,
  CrudOptions,
  FindOptions,
  PaginatedResult,
  WhereClause,
  ValidationError,
  PermissionError,
  AuditLogEntry,
  PerformanceMetrics
} from '../types'
import { PermissionChecker } from '../permissions/permission-checker'
import { ValidationManager } from '../validation/validation-manager'
import { CacheManager } from '../cache/cache-manager'

/**
 * Prisma CRUD 管理器
 */
export class PrismaCrudManager implements ICrudManager {
  private readonly permissionChecker: PermissionChecker
  private readonly validationManager: ValidationManager
  private readonly cacheManager: CacheManager

  constructor(
    private readonly prisma: PrismaClient,
    private readonly schemaRegistry: SchemaRegistry,
    private readonly logger: Logger,
    options?: {
      enableCache?: boolean
      enableAudit?: boolean
      enableMetrics?: boolean
    }
  ) {
    this.permissionChecker = new PermissionChecker(schemaRegistry)
    this.validationManager = new ValidationManager(schemaRegistry)
    this.cacheManager = new CacheManager({
      enabled: options?.enableCache ?? true,
      defaultTTL: 300,
      maxSize: 1000
    })
  }

  /**
   * 创建记录
   */
  async create<T>(
    entityName: string,
    data: CreateInput<T>,
    options?: CrudOptions
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      // 1. 获取实体 Schema 定义
      const entity = this.schemaRegistry.getEntity(entityName)
      if (!entity) {
        throw new Error(`Entity ${entityName} not found`)
      }

      // 2. 验证输入数据
      if (!options?.skipValidation) {
        const validationErrors = await this.validationManager.validateCreate(entity, data)
        if (validationErrors.length > 0) {
          throw new ValidationException('Validation failed', validationErrors)
        }
      }

      // 3. 权限检查
      if (!options?.skipPermissions && options?.user) {
        await this.permissionChecker.checkCreate(entity, options.user, data)
      }

      // 4. 数据预处理
      const processedData = await this.preprocessCreateData(entity, data, options)

      // 5. 使用 Prisma 执行创建
      const model = this.getPrismaModel(entityName)
      const result = await model.create({
        data: processedData,
        include: this.buildInclude(entity)
      })

      // 6. 后处理和审计
      await this.postProcessCreate(entity, result, options)

      // 7. 记录性能指标
      await this.recordMetrics({
        operation: 'create',
        entityName,
        duration: Date.now() - startTime,
        recordsAffected: 1,
        timestamp: new Date()
      })

      return result as T
    } catch (error) {
      this.logger.error('Create operation failed', {
        entityName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 根据ID查找记录
   */
  async findById<T>(
    entityName: string,
    id: string,
    options?: FindOptions
  ): Promise<T | null> {
    const startTime = Date.now()

    try {
      const entity = this.schemaRegistry.getEntity(entityName)
      if (!entity) {
        throw new Error(`Entity ${entityName} not found`)
      }

      // 检查缓存
      if (options?.useCache !== false) {
        const cacheKey = this.cacheManager.generateKey(entityName, 'findById', { id })
        const cached = await this.cacheManager.get<T>(cacheKey)
        if (cached) {
          await this.recordMetrics({
            operation: 'findById',
            entityName,
            duration: Date.now() - startTime,
            cacheHit: true,
            timestamp: new Date()
          })
          return cached
        }
      }

      // 构建查询条件
      const whereClause: Record<string, unknown> = { id }
      
      // 软删除过滤
      if (!options?.includeSoftDeleted && entity.options?.softDelete) {
        whereClause.deletedAt = null
      }

      // 权限过滤
      if (options?.user && !options?.skipPermissions) {
        const permissionFilter = await this.permissionChecker.buildRowFilter(
          entity,
          options.user,
          'read'
        )
        Object.assign(whereClause, permissionFilter)
      }

      const model = this.getPrismaModel(entityName)
      const result = await model.findFirst({
        where: whereClause,
        include: this.buildInclude(entity)
      })

      if (!result) {
        await this.recordMetrics({
          operation: 'findById',
          entityName,
          duration: Date.now() - startTime,
          recordsAffected: 0,
          timestamp: new Date()
        })
        return null
      }

      // 字段级权限过滤
      let filteredResult = result
      if (options?.user && !options?.skipPermissions) {
        const filtered = await this.permissionChecker.filterFields(
          entity,
          options.user,
          [result],
          'read'
        )
        filteredResult = filtered[0] || result
      }

      // 缓存结果
      if (options?.useCache !== false) {
        const cacheKey = this.cacheManager.generateKey(entityName, 'findById', { id })
        await this.cacheManager.set(cacheKey, filteredResult, options?.cacheTTL)
      }

      await this.recordMetrics({
        operation: 'findById',
        entityName,
        duration: Date.now() - startTime,
        recordsAffected: 1,
        cacheHit: false,
        timestamp: new Date()
      })

      return filteredResult as T
    } catch (error) {
      this.logger.error('FindById operation failed', {
        entityName,
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 查找多条记录
   */
  async findMany<T>(
    entityName: string,
    query?: QueryInput,
    options?: FindOptions
  ): Promise<T[]> {
    const startTime = Date.now()

    try {
      const entity = this.schemaRegistry.getEntity(entityName)
      if (!entity) {
        throw new Error(`Entity ${entityName} not found`)
      }

      // 验证查询
      if (query && !options?.skipValidation) {
        const validationErrors = await this.validationManager.validateQuery(entity, query)
        if (validationErrors.length > 0) {
          throw new ValidationException('Query validation failed', validationErrors)
        }
      }

      // 检查缓存
      if (options?.useCache !== false && query) {
        const cacheKey = this.cacheManager.generateKey(entityName, 'findMany', query)
        const cached = await this.cacheManager.get<T[]>(cacheKey)
        if (cached) {
          await this.recordMetrics({
            operation: 'findMany',
            entityName,
            duration: Date.now() - startTime,
            cacheHit: true,
            recordsAffected: cached.length,
            timestamp: new Date()
          })
          return cached
        }
      }

      // 构建 Prisma 查询条件
      const prismaQuery = await this.buildPrismaQuery(entity, query, options)

      // 应用权限过滤
      if (options?.user && !options?.skipPermissions) {
        const permissionFilter = await this.permissionChecker.buildRowFilter(
          entity,
          options.user,
          'read'
        )
        prismaQuery.where = {
          ...prismaQuery.where,
          ...permissionFilter
        }
      }

      // 执行查询
      const model = this.getPrismaModel(entityName)
      const results = await model.findMany(prismaQuery)

      // 字段级权限过滤
      let filteredResults = results
      if (options?.user && !options?.skipPermissions) {
        filteredResults = await this.permissionChecker.filterFields(
          entity,
          options.user,
          results,
          'read'
        )
      }

      // 缓存结果
      if (options?.useCache !== false && query) {
        const cacheKey = this.cacheManager.generateKey(entityName, 'findMany', query)
        await this.cacheManager.set(cacheKey, filteredResults, options?.cacheTTL)
      }

      await this.recordMetrics({
        operation: 'findMany',
        entityName,
        duration: Date.now() - startTime,
        recordsAffected: filteredResults.length,
        cacheHit: false,
        timestamp: new Date()
      })

      return filteredResults as T[]
    } catch (error) {
      this.logger.error('FindMany operation failed', {
        entityName,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 查找单条记录
   */
  async findOne<T>(
    entityName: string,
    query?: QueryInput,
    options?: FindOptions
  ): Promise<T | null> {
    const results = await this.findMany<T>(entityName, {
      ...query,
      limit: 1
    }, options)

    return results.length > 0 ? results[0] : null
  }

  /**
   * 更新记录
   */
  async update<T>(
    entityName: string,
    id: string,
    data: UpdateInput<T>,
    options?: CrudOptions
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const entity = this.schemaRegistry.getEntity(entityName)
      if (!entity) {
        throw new Error(`Entity ${entityName} not found`)
      }

      // 检查记录是否存在
      const existing = await this.findById(entityName, id, { skipPermissions: true })
      if (!existing) {
        throw new Error(`Record with ID ${id} not found`)
      }

      // 权限检查
      if (!options?.skipPermissions && options?.user) {
        await this.permissionChecker.checkUpdate(entity, options.user, existing, data)
      }

      // 验证更新数据
      if (!options?.skipValidation) {
        const validationErrors = await this.validationManager.validateUpdate(entity, id, data)
        if (validationErrors.length > 0) {
          throw new ValidationException('Validation failed', validationErrors)
        }
      }

      // 数据预处理
      const processedData = await this.preprocessUpdateData(entity, data, existing, options)

      // 使用 Prisma 执行更新
      const model = this.getPrismaModel(entityName)
      const result = await model.update({
        where: { id },
        data: processedData,
        include: this.buildInclude(entity)
      })

      // 后处理和审计
      await this.postProcessUpdate(entity, result, existing, options)

      // 清除相关缓存
      await this.invalidateCache(entityName, id)

      await this.recordMetrics({
        operation: 'update',
        entityName,
        duration: Date.now() - startTime,
        recordsAffected: 1,
        timestamp: new Date()
      })

      return result as T
    } catch (error) {
      this.logger.error('Update operation failed', {
        entityName,
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 删除记录
   */
  async delete(
    entityName: string,
    id: string,
    options?: CrudOptions
  ): Promise<boolean> {
    const startTime = Date.now()

    try {
      const entity = this.schemaRegistry.getEntity(entityName)
      if (!entity) {
        throw new Error(`Entity ${entityName} not found`)
      }

      const existing = await this.findById(entityName, id, { skipPermissions: true })
      if (!existing) {
        return false
      }

      // 权限检查
      if (!options?.skipPermissions && options?.user) {
        await this.permissionChecker.checkDelete(entity, options.user, existing)
      }

      const model = this.getPrismaModel(entityName)

      // 软删除 vs 硬删除
      if (entity.options?.softDelete) {
        await model.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: options?.user?.id
          }
        })
      } else {
        await model.delete({
          where: { id }
        })
      }

      // 后处理和审计
      await this.postProcessDelete(entity, existing, options)

      // 清除相关缓存
      await this.invalidateCache(entityName, id)

      await this.recordMetrics({
        operation: 'delete',
        entityName,
        duration: Date.now() - startTime,
        recordsAffected: 1,
        timestamp: new Date()
      })

      return true
    } catch (error) {
      this.logger.error('Delete operation failed', {
        entityName,
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 计数
   */
  async count(
    entityName: string,
    query?: QueryInput,
    options?: FindOptions
  ): Promise<number> {
    const startTime = Date.now()

    try {
      const entity = this.schemaRegistry.getEntity(entityName)
      if (!entity) {
        throw new Error(`Entity ${entityName} not found`)
      }

      const whereClause = this.buildWhereClause(query?.where || [])

      // 软删除过滤
      if (!options?.includeSoftDeleted && entity.options?.softDelete) {
        whereClause.deletedAt = null
      }

      // 权限过滤
      if (options?.user && !options?.skipPermissions) {
        const permissionFilter = await this.permissionChecker.buildRowFilter(
          entity,
          options.user,
          'read'
        )
        Object.assign(whereClause, permissionFilter)
      }

      const model = this.getPrismaModel(entityName)
      const count = await model.count({ where: whereClause })

      await this.recordMetrics({
        operation: 'count',
        entityName,
        duration: Date.now() - startTime,
        timestamp: new Date()
      })

      return count
    } catch (error) {
      this.logger.error('Count operation failed', {
        entityName,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  /**
   * 检查是否存在
   */
  async exists(
    entityName: string,
    query?: QueryInput,
    options?: FindOptions
  ): Promise<boolean> {
    const count = await this.count(entityName, query, options)
    return count > 0
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
    // 获取总数
    const total = options?.includeCount !== false 
      ? await this.count(entityName, query, options)
      : 0

    // 计算偏移量
    const offset = (page - 1) * pageSize

    // 查询数据
    const data = await this.findMany<T>(entityName, {
      ...query,
      limit: pageSize,
      offset
    }, options)

    // 计算分页信息
    const totalPages = Math.ceil(total / pageSize)

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    }
  }

  // 私有辅助方法

  private getPrismaModel(entityName: string) {
    const modelName = entityName.toLowerCase()
    const model = (this.prisma as unknown as Record<string, unknown>)[modelName]

    if (!model) {
      throw new Error(`Prisma model for entity ${entityName} not found`)
    }

    return model
  }

  private async buildPrismaQuery(
    entity: Entity,
    query?: QueryInput,
    options?: FindOptions
  ): Promise<Record<string, unknown>> {
    const prismaQuery: Record<string, unknown> = {}

    if (query?.where) {
      prismaQuery.where = this.buildWhereClause(query.where)
    }

    // 软删除过滤
    if (!options?.includeSoftDeleted && entity.options?.softDelete) {
      prismaQuery.where = {
        ...prismaQuery.where,
        deletedAt: null
      }
    }

    if (query?.orderBy) {
      prismaQuery.orderBy = query.orderBy.map(order => ({
        [order.field]: order.direction
      }))
    }

    if (query?.include) {
      prismaQuery.include = this.buildIncludeFromQuery(query.include)
    } else {
      prismaQuery.include = this.buildInclude(entity)
    }

    if (query?.limit) {
      prismaQuery.take = query.limit
    }

    if (query?.offset) {
      prismaQuery.skip = query.offset
    }

    if (query?.distinct) {
      prismaQuery.distinct = query.distinct
    }

    return prismaQuery
  }

  private buildWhereClause(whereConditions: WhereClause[]): Record<string, unknown> {
    const where: Record<string, unknown> = {}

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
        default:
          throw new Error(`Unsupported operator: ${operator}`)
      }
    })

    return where
  }

  private buildInclude(entity: Entity): Record<string, boolean> {
    const include: Record<string, boolean> = {}

    // 自动包含关联字段
    Object.values(entity.fields).forEach(field => {
      if (field.type === 'relation' && field.relation) {
        include[field.relation.name] = true
      }
    })

    return include
  }

  private buildIncludeFromQuery(includeFields: string[]): Record<string, boolean> {
    const include: Record<string, boolean> = {}
    includeFields.forEach(field => {
      include[field] = true
    })
    return include
  }

  private async preprocessCreateData(
    entity: Entity,
    data: CreateInput<unknown>,
    options?: CrudOptions
  ): Promise<Record<string, unknown>> {
    const processed = { ...data } as Record<string, unknown>

    // 添加审计字段
    if (options?.user) {
      processed.createdBy = options.user.id
      processed.updatedBy = options.user.id
    }

    if (options?.tenantId) {
      processed.tenantId = options.tenantId
    }

    return processed
  }

  private async preprocessUpdateData(
    entity: Entity,
    data: UpdateInput<unknown>,
    existing: unknown,
    options?: CrudOptions
  ): Promise<Record<string, unknown>> {
    const processed = { ...data } as Record<string, unknown>

    // 添加审计字段
    if (options?.user) {
      processed.updatedBy = options.user.id
    }

    processed.updatedAt = new Date()

    return processed
  }

  private async postProcessCreate(
    entity: Entity,
    result: unknown,
    options?: CrudOptions
  ): Promise<void> {
    // 记录审计日志
    if (options?.user) {
      await this.recordAuditLog({
        id: `audit-${Date.now()}`,
        operation: 'create',
        entityName: entity.name,
        entityId: (result as { id: string }).id,
        userId: options.user.id,
        tenantId: options.tenantId,
        changes: { after: result },
        timestamp: new Date(),
        source: options.source
      })
    }
  }

  private async postProcessUpdate(
    entity: Entity,
    result: unknown,
    existing: unknown,
    options?: CrudOptions
  ): Promise<void> {
    // 记录审计日志
    if (options?.user) {
      await this.recordAuditLog({
        id: `audit-${Date.now()}`,
        operation: 'update',
        entityName: entity.name,
        entityId: (result as { id: string }).id,
        userId: options.user.id,
        tenantId: options.tenantId,
        changes: { before: existing, after: result },
        timestamp: new Date(),
        source: options.source
      })
    }
  }

  private async postProcessDelete(
    entity: Entity,
    existing: unknown,
    options?: CrudOptions
  ): Promise<void> {
    // 记录审计日志
    if (options?.user) {
      await this.recordAuditLog({
        id: `audit-${Date.now()}`,
        operation: 'delete',
        entityName: entity.name,
        entityId: (existing as { id: string }).id,
        userId: options.user.id,
        tenantId: options.tenantId,
        changes: { before: existing },
        timestamp: new Date(),
        source: options.source
      })
    }
  }

  private async invalidateCache(entityName: string, id?: string): Promise<void> {
    const patterns = [
      `${entityName}:*`,
      id ? `${entityName}:findById:*${id}*` : null
    ].filter(Boolean) as string[]

    for (const pattern of patterns) {
      await this.cacheManager.invalidate(pattern)
    }
  }

  private async recordAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      // 这里可以集成到审计日志系统
      this.logger.info('Audit log', entry)
    } catch (error) {
      this.logger.error('Failed to record audit log', { error })
    }
  }

  private async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // 这里可以集成到指标收集系统
      this.logger.debug('Performance metrics', metrics)
    } catch (error) {
      this.logger.error('Failed to record metrics', { error })
    }
  }
}

/**
 * 验证异常类
 */
class ValidationException extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationError[]
  ) {
    super(message)
    this.name = 'ValidationException'
  }
}