/**
 * 租户管理服务
 * 
 * 基于 Prisma 的租户管理业务逻辑
 * 集成权限控制和配额管理
 */


// 注意：这里不能直接导入 PrismaClient，因为它是运行时依赖
// 在实际使用时需要从外部注入
export interface DatabaseClient {
  tenant: {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    findUnique: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
    findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
    findMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>
    delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    count: (args?: Record<string, unknown>) => Promise<number>
  }
  tenantQuotas: {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    upsert: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
}

/**
 * 租户查询参数
 */
export interface TenantQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: 'active' | 'suspended' | 'deleted' | 'pending'
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  tenantId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 租户创建参数
 */
export interface TenantCreateParams {
  name: string
  domain?: string
  slug: string
  description?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  billingCycle?: 'monthly' | 'yearly'
  maxUsers?: number
  maxStorage?: bigint
  settings?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * 租户更新参数
 */
export interface TenantUpdateParams {
  name?: string
  domain?: string
  slug?: string
  description?: string
  status?: 'active' | 'suspended' | 'deleted' | 'pending'
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  billingCycle?: 'monthly' | 'yearly'
  maxUsers?: number
  maxStorage?: bigint
  settings?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * 租户管理服务类
 */
export class TenantService {
  private db: DatabaseClient | null = null

  constructor(db?: DatabaseClient) {
    this.db = db || null
  }

  /**
   * 设置数据库客户端
   */
  setDatabase(db: DatabaseClient) {
    this.db = db
  }

  /**
   * 确保数据库客户端已设置
   */
  private ensureDb(): DatabaseClient {
    if (!this.db) {
      throw new Error('Database client not set. Call setDatabase() first.')
    }
    return this.db
  }

  /**
   * 创建租户
   */
  async create(input: TenantCreateParams): Promise<Record<string, unknown>> {
    const db = this.ensureDb()
    
    // 创建租户
    const tenant = await db.tenant.create({
      data: {
        name: input.name,
        domain: input.domain,
        slug: input.slug,
        description: input.description,
        plan: input.plan || 'free',
        billingCycle: input.billingCycle,
        maxUsers: input.maxUsers || 10,
        maxStorage: input.maxStorage || BigInt(1073741824), // 1GB
        settings: input.settings ? JSON.stringify(input.settings) : null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        status: 'active',
      },
      include: {
        quotas: true,
        users: true,
      }
    })

    // 创建配额记录
    await db.tenantQuotas.create({
      data: {
        tenantId: tenant.id,
        maxUsers: tenant.maxUsers,
        maxStorage: tenant.maxStorage,
        maxApiCalls: 10000,
        maxPlugins: 5,
        maxSchemas: 10,
      }
    })

    return tenant
  }

  /**
   * 更新租户信息
   */
  async update(tenantId: string, input: TenantUpdateParams): Promise<Record<string, unknown>> {
    const db = this.ensureDb()
    
    const updateData: Record<string, unknown> = {}
    
    if (input.name !== undefined) updateData.name = input.name
    if (input.domain !== undefined) updateData.domain = input.domain
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.description !== undefined) updateData.description = input.description
    if (input.status !== undefined) updateData.status = input.status
    if (input.plan !== undefined) updateData.plan = input.plan
    if (input.billingCycle !== undefined) updateData.billingCycle = input.billingCycle
    if (input.maxUsers !== undefined) updateData.maxUsers = input.maxUsers
    if (input.maxStorage !== undefined) updateData.maxStorage = input.maxStorage
    if (input.settings !== undefined) updateData.settings = JSON.stringify(input.settings)
    if (input.metadata !== undefined) updateData.metadata = JSON.stringify(input.metadata)

    const tenant = await db.tenant.update({
      where: { id: tenantId },
      data: updateData,
      include: {
        quotas: true,
        users: true,
      }
    })

    // 如果更新了用户或存储限制，同步更新配额
    if (input.maxUsers !== undefined || input.maxStorage !== undefined) {
      await db.tenantQuotas.upsert({
        where: { tenantId },
        update: {
          maxUsers: input.maxUsers || tenant.maxUsers,
          maxStorage: input.maxStorage || tenant.maxStorage,
        },
        create: {
          tenantId,
          maxUsers: input.maxUsers || tenant.maxUsers,
          maxStorage: input.maxStorage || tenant.maxStorage,
          maxApiCalls: 10000,
          maxPlugins: 5,
          maxSchemas: 10,
        }
      })
    }

    return tenant
  }

  /**
   * 获取租户详情
   */
  async getById(tenantId: string): Promise<Record<string, unknown> | null> {
    const db = this.ensureDb()
    
    return await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        quotas: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
          }
        },
        plugins: {
          include: {
            plugin: true,
          }
        }
      }
    })
  }

  /**
   * 查询租户列表
   */
  async list(params: TenantQueryParams = {}): Promise<{
    data: Record<string, unknown>[]
    total: number
    page: number
    pageSize: number
  }> {
    const db = this.ensureDb()
    
    const {
      page = 1,
      pageSize = 10,
      search,
      status,
      plan,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    // 构建查询条件
    const where: Record<string, unknown> = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (plan) {
      where.plan = plan
    }

    // 软删除过滤
    where.deletedAt = null

    // 计算偏移量
    const offset = (page - 1) * pageSize

    // 查询数据
    const [data, total] = await Promise.all([
      db.tenant.findMany({
        where,
        include: {
          quotas: true,
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            }
          },
          _count: {
            select: {
              users: true,
              plugins: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: pageSize,
      }),
      db.tenant.count({ where })
    ])

    return {
      data,
      total,
      page,
      pageSize,
    }
  }

  /**
   * 软删除租户
   */
  async delete(tenantId: string): Promise<Record<string, unknown>> {
    const db = this.ensureDb()
    
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      }
    })
  }

  /**
   * 获取租户数量
   */
  async count(filters: { status?: string } = {}): Promise<number> {
    const db = this.ensureDb()
    
    const where: Record<string, unknown> = { deletedAt: null }
    
    if (filters.status) {
      where.status = filters.status
    }
    
    return await db.tenant.count({ where })
  }

  /**
   * 检查租户 slug 是否可用
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const db = this.ensureDb()
    
    const where: Record<string, unknown> = { slug, deletedAt: null }
    
    if (excludeId) {
      where.id = { not: excludeId }
    }
    
    const existing = await db.tenant.findFirst({ where })
    return !existing
  }

  /**
   * 检查域名是否可用
   */
  async isDomainAvailable(domain: string, excludeId?: string): Promise<boolean> {
    const db = this.ensureDb()
    
    const where: Record<string, unknown> = { domain, deletedAt: null }
    
    if (excludeId) {
      where.id = { not: excludeId }
    }
    
    const existing = await db.tenant.findFirst({ where })
    return !existing
  }
}

/**
 * 导出租户服务实例（不包含数据库连接）
 * 需要在运行时注入数据库客户端
 */
export const tenantService = new TenantService()

// 注意：接口已经通过 export interface 导出，不需要重复导出