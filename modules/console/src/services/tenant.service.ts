/**
 * 租户管理服务
 * 
 * 基于 @linch-kit/crud 的租户管理业务逻辑
 * 集成权限控制和配额管理
 */

import { 
  createCrudService, 
  type CrudOptions,
  type CrudContext,
  type CrudResult 
} from '@linch-kit/crud'
import { z } from 'zod'
import { TenantEntity, TenantQuotasEntity } from '../entities'
import { tenantValidators, tenantQuotasValidators } from '../validation'
import { logger } from '@linch-kit/core'
import { requireAuth, requirePermission } from '@linch-kit/auth'

/**
 * 租户创建输入验证
 */
export const CreateTenantInput = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().optional(),
  slug: z.string().min(1).max(50),
  description: z.string().optional(),
  planType: z.string().default('free'),
  maxUsers: z.number().int().min(1).default(10),
  maxStorage: z.number().min(0).default(1073741824),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
})

/**
 * 租户更新输入验证
 */
export const UpdateTenantInput = CreateTenantInput.partial()

/**
 * 租户查询过滤器
 */
export const TenantFilters = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING']).optional(),
  planType: z.string().optional(),
  search: z.string().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional()
})

export type CreateTenantInput = z.infer<typeof CreateTenantInput>
export type UpdateTenantInput = z.infer<typeof UpdateTenantInput>
export type TenantFilters = z.infer<typeof TenantFilters>

/**
 * 租户管理服务类
 */
export class TenantService {
  private crudService = createCrudService(TenantEntity, {
    permissions: {
      create: ['tenant:create'],
      read: ['tenant:read'],
      update: ['tenant:update'],
      delete: ['tenant:delete']
    },
    hooks: {
      beforeCreate: this.beforeCreateTenant.bind(this),
      afterCreate: this.afterCreateTenant.bind(this),
      beforeUpdate: this.beforeUpdateTenant.bind(this),
      beforeDelete: this.beforeDeleteTenant.bind(this)
    }
  })

  private quotasCrudService = createCrudService(TenantQuotasEntity, {
    permissions: {
      create: ['tenant:quota:manage'],
      read: ['tenant:quota:read'],
      update: ['tenant:quota:manage'],
      delete: ['tenant:quota:manage']
    }
  })

  /**
   * 创建租户
   */
  @requireAuth()
  @requirePermission('tenant:create')
  async createTenant(
    input: CreateTenantInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('创建租户', { tenantName: input.name, operatorId: context.user?.id })

    try {
      // 使用运行时验证器验证输入数据
      const validatedInput = tenantValidators.assertCreate(input)
      
      // 生成唯一ID
      const tenantId = crypto.randomUUID()
      
      // 创建租户数据
      const tenantData = {
        id: tenantId,
        ...validatedInput,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 使用 CRUD 服务创建租户
      const result = await this.crudService.create(tenantData, context)
      
      if (result.success) {
        logger.info('租户创建成功', { tenantId, tenantName: input.name })
      }
      
      return result
    } catch (error) {
      logger.error('租户创建失败', { error, input })
      throw error
    }
  }

  /**
   * 更新租户信息
   */
  @requireAuth()
  @requirePermission('tenant:update')
  async updateTenant(
    tenantId: string,
    input: UpdateTenantInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('更新租户', { tenantId, operatorId: context.user?.id })

    try {
      const validatedInput = UpdateTenantInput.parse(input)
      
      const updateData = {
        ...validatedInput,
        updatedAt: new Date()
      }

      return await this.crudService.update(tenantId, updateData, context)
    } catch (error) {
      logger.error('租户更新失败', { error, tenantId, input })
      throw error
    }
  }

  /**
   * 获取租户详情
   */
  @requireAuth()
  @requirePermission('tenant:read')
  async getTenant(
    tenantId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    return await this.crudService.findById(tenantId, context)
  }

  /**
   * 查询租户列表
   */
  @requireAuth()
  @requirePermission('tenant:read')
  async listTenants(
    filters: TenantFilters = {},
    context: CrudContext
  ): Promise<CrudResult<any[]>> {
    const validatedFilters = TenantFilters.parse(filters)
    
    // 构建查询条件
    const where: any = {}
    
    if (validatedFilters.status) {
      where.status = validatedFilters.status
    }
    
    if (validatedFilters.planType) {
      where.planType = validatedFilters.planType
    }
    
    if (validatedFilters.search) {
      where.OR = [
        { name: { contains: validatedFilters.search, mode: 'insensitive' } },
        { slug: { contains: validatedFilters.search, mode: 'insensitive' } },
        { domain: { contains: validatedFilters.search, mode: 'insensitive' } }
      ]
    }
    
    if (validatedFilters.createdAfter || validatedFilters.createdBefore) {
      where.createdAt = {}
      if (validatedFilters.createdAfter) {
        where.createdAt.gte = validatedFilters.createdAfter
      }
      if (validatedFilters.createdBefore) {
        where.createdAt.lte = validatedFilters.createdBefore
      }
    }

    return await this.crudService.findMany({ where }, context)
  }

  /**
   * 停用租户
   */
  @requireAuth()
  @requirePermission('tenant:suspend')
  async suspendTenant(
    tenantId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.warn('停用租户', { tenantId, operatorId: context.user?.id })
    
    return await this.crudService.update(
      tenantId,
      { 
        status: 'SUSPENDED',
        updatedAt: new Date()
      },
      context
    )
  }

  /**
   * 激活租户
   */
  @requireAuth()
  @requirePermission('tenant:activate')
  async activateTenant(
    tenantId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('激活租户', { tenantId, operatorId: context.user?.id })
    
    return await this.crudService.update(
      tenantId,
      { 
        status: 'ACTIVE',
        updatedAt: new Date()
      },
      context
    )
  }

  /**
   * 软删除租户
   */
  @requireAuth()
  @requirePermission('tenant:delete')
  async deleteTenant(
    tenantId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.warn('删除租户', { tenantId, operatorId: context.user?.id })
    
    return await this.crudService.update(
      tenantId,
      {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      context
    )
  }

  /**
   * 获取租户配额信息
   */
  @requireAuth()
  @requirePermission('tenant:quota:read')
  async getTenantQuotas(
    tenantId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    return await this.quotasCrudService.findFirst(
      { where: { tenantId } },
      context
    )
  }

  /**
   * 更新租户配额
   */
  @requireAuth()
  @requirePermission('tenant:quota:manage')
  async updateTenantQuotas(
    tenantId: string,
    quotaUpdates: Partial<{
      maxUsers: number
      maxStorage: number
      maxApiCalls: number
      maxPlugins: number
      maxSchemas: number
    }>,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('更新租户配额', { tenantId, quotaUpdates, operatorId: context.user?.id })

    // 首先检查配额记录是否存在
    const existingQuotas = await this.quotasCrudService.findFirst(
      { where: { tenantId } },
      context
    )

    if (existingQuotas.success && existingQuotas.data) {
      // 更新现有配额
      return await this.quotasCrudService.update(
        existingQuotas.data.id,
        {
          ...quotaUpdates,
          updatedAt: new Date()
        },
        context
      )
    } else {
      // 创建新的配额记录
      return await this.quotasCrudService.create(
        {
          id: crypto.randomUUID(),
          tenantId,
          maxUsers: 10,
          currentUsers: 0,
          maxStorage: 1073741824,
          currentStorage: 0,
          maxApiCalls: 10000,
          currentApiCalls: 0,
          maxPlugins: 5,
          currentPlugins: 0,
          maxSchemas: 10,
          currentSchemas: 0,
          ...quotaUpdates,
          updatedAt: new Date()
        },
        context
      )
    }
  }

  /**
   * 检查租户配额是否超限
   */
  @requireAuth()
  async checkQuotaLimits(
    tenantId: string,
    quotaType: 'users' | 'storage' | 'apiCalls' | 'plugins' | 'schemas',
    requestedAmount: number = 1,
    context: CrudContext
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const quotasResult = await this.getTenantQuotas(tenantId, context)
    
    if (!quotasResult.success || !quotasResult.data) {
      return { allowed: false, current: 0, limit: 0, remaining: 0 }
    }

    const quotas = quotasResult.data
    let current: number, limit: number

    switch (quotaType) {
      case 'users':
        current = quotas.currentUsers
        limit = quotas.maxUsers
        break
      case 'storage':
        current = quotas.currentStorage
        limit = quotas.maxStorage
        break
      case 'apiCalls':
        current = quotas.currentApiCalls
        limit = quotas.maxApiCalls
        break
      case 'plugins':
        current = quotas.currentPlugins
        limit = quotas.maxPlugins
        break
      case 'schemas':
        current = quotas.currentSchemas
        limit = quotas.maxSchemas
        break
      default:
        return { allowed: false, current: 0, limit: 0, remaining: 0 }
    }

    const remaining = limit - current
    const allowed = current + requestedAmount <= limit

    return { allowed, current, limit, remaining }
  }

  /**
   * 租户创建前的钩子
   */
  private async beforeCreateTenant(data: any, context: CrudContext): Promise<any> {
    // 检查 slug 是否已存在
    const existing = await this.crudService.findFirst(
      { where: { slug: data.slug } },
      context
    )
    
    if (existing.success && existing.data) {
      throw new Error(`租户标识符 '${data.slug}' 已存在`)
    }

    // 检查域名是否已存在
    if (data.domain) {
      const existingDomain = await this.crudService.findFirst(
        { where: { domain: data.domain } },
        context
      )
      
      if (existingDomain.success && existingDomain.data) {
        throw new Error(`域名 '${data.domain}' 已被使用`)
      }
    }

    return data
  }

  /**
   * 租户创建后的钩子
   */
  private async afterCreateTenant(data: any, context: CrudContext): Promise<void> {
    // 自动创建租户配额记录
    await this.updateTenantQuotas(
      data.id,
      {
        maxUsers: data.maxUsers || 10,
        maxStorage: data.maxStorage || 1073741824,
        maxApiCalls: 10000,
        maxPlugins: 5,
        maxSchemas: 10
      },
      context
    )

    logger.info('租户配额初始化完成', { tenantId: data.id })
  }

  /**
   * 租户更新前的钩子
   */
  private async beforeUpdateTenant(id: string, data: any, context: CrudContext): Promise<any> {
    // 如果更新 slug，检查是否冲突
    if (data.slug) {
      const existing = await this.crudService.findFirst(
        { 
          where: { 
            slug: data.slug,
            id: { not: id }
          } 
        },
        context
      )
      
      if (existing.success && existing.data) {
        throw new Error(`租户标识符 '${data.slug}' 已存在`)
      }
    }

    // 如果更新域名，检查是否冲突
    if (data.domain) {
      const existing = await this.crudService.findFirst(
        { 
          where: { 
            domain: data.domain,
            id: { not: id }
          } 
        },
        context
      )
      
      if (existing.success && existing.data) {
        throw new Error(`域名 '${data.domain}' 已被使用`)
      }
    }

    return data
  }

  /**
   * 租户删除前的钩子
   */
  private async beforeDeleteTenant(id: string, context: CrudContext): Promise<void> {
    // 检查是否有关联的用户
    // 这里需要集成用户服务，暂时跳过具体实现
    logger.warn('准备删除租户，建议先检查关联数据', { tenantId: id })
  }
}

/**
 * 导出租户服务实例
 */
export const tenantService = new TenantService()