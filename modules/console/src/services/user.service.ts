/**
 * 用户管理服务
 * 
 * 基于 @linch-kit/crud 和 @linch-kit/auth 的用户管理业务逻辑
 * 扩展标准用户功能，添加企业级管理特性
 */

import { 
  createCrudService, 
  type CrudOptions,
  type CrudContext,
  type CrudResult 
} from '@linch-kit/crud'
import { 
  authService,
  type LinchKitUser,
  requireAuth,
  requirePermission,
  hashPassword,
  generateTemporaryPassword
} from '@linch-kit/auth'
import { z } from 'zod'
import { ConsoleUserEntity, UserActivityEntity } from '../entities/user-extensions'
import { logger } from '@linch-kit/core'
import { tenantService } from './tenant.service'

/**
 * 用户创建输入验证
 */
export const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  tenantId: z.string(),
  employeeId: z.string().max(50).optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  managerId: z.string().optional(),
  roles: z.array(z.string()).default([]),
  locale: z.string().max(10).default('zh-CN'),
  timezone: z.string().max(50).default('Asia/Shanghai'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  sendWelcomeEmail: z.boolean().default(true),
  temporaryPassword: z.boolean().default(true)
})

/**
 * 用户更新输入验证
 */
export const UpdateUserInput = z.object({
  name: z.string().min(1).max(100).optional(),
  employeeId: z.string().max(50).optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  managerId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notificationSettings: z.record(z.any()).optional()
})

/**
 * 用户查询过滤器
 */
export const UserFilters = z.object({
  tenantId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'DELETED']).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  role: z.string().optional(),
  search: z.string().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  lastLoginAfter: z.date().optional(),
  lastLoginBefore: z.date().optional()
})

/**
 * 用户活动记录输入
 */
export const CreateUserActivityInput = z.object({
  userId: z.string(),
  tenantId: z.string(),
  action: z.string().max(100),
  resource: z.string().max(100).optional(),
  resourceId: z.string().optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
  success: z.boolean(),
  details: z.record(z.any()).optional()
})

export type CreateUserInput = z.infer<typeof CreateUserInput>
export type UpdateUserInput = z.infer<typeof UpdateUserInput>
export type UserFilters = z.infer<typeof UserFilters>
export type CreateUserActivityInput = z.infer<typeof CreateUserActivityInput>

/**
 * 用户管理服务类
 */
export class UserService {
  private crudService = createCrudService(ConsoleUserEntity, {
    permissions: {
      create: ['user:create'],
      read: ['user:read'],
      update: ['user:update'],
      delete: ['user:delete']
    },
    hooks: {
      beforeCreate: this.beforeCreateUser.bind(this),
      afterCreate: this.afterCreateUser.bind(this),
      beforeUpdate: this.beforeUpdateUser.bind(this),
      beforeDelete: this.beforeDeleteUser.bind(this)
    }
  })

  private activityCrudService = createCrudService(UserActivityEntity, {
    permissions: {
      create: ['user:activity:create'],
      read: ['user:activity:read']
    }
  })

  /**
   * 创建用户
   */
  @requireAuth()
  @requirePermission('user:create')
  async createUser(
    input: CreateUserInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('创建用户', { 
      email: input.email, 
      tenantId: input.tenantId,
      operatorId: context.user?.id 
    })

    try {
      // 验证输入数据
      const validatedInput = CreateUserInput.parse(input)
      
      // 检查租户配额
      const quotaCheck = await tenantService.checkQuotaLimits(
        validatedInput.tenantId,
        'users',
        1,
        context
      )
      
      if (!quotaCheck.allowed) {
        logger.warn('租户用户配额已满', { 
          tenantId: validatedInput.tenantId,
          current: quotaCheck.current,
          limit: quotaCheck.limit
        })
        return {
          success: false,
          error: new Error(`租户用户配额已满 (${quotaCheck.current}/${quotaCheck.limit})`)
        }
      }

      // 生成用户ID和密码
      const userId = crypto.randomUUID()
      const tempPassword = validatedInput.temporaryPassword 
        ? generateTemporaryPassword() 
        : undefined

      // 创建基础用户数据
      const userData = {
        id: userId,
        email: validatedInput.email,
        name: validatedInput.name,
        tenantId: validatedInput.tenantId,
        employeeId: validatedInput.employeeId,
        department: validatedInput.department,
        position: validatedInput.position,
        managerId: validatedInput.managerId,
        status: 'ACTIVE' as const,
        mfaEnabled: false,
        loginAttempts: 0,
        locale: validatedInput.locale,
        timezone: validatedInput.timezone,
        theme: validatedInput.theme,
        notificationSettings: {
          email: true,
          push: true,
          security: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 使用 CRUD 服务创建扩展用户记录
      const result = await this.crudService.create(userData, context)
      
      if (result.success) {
        // 使用 authService 创建认证用户
        await authService.createUser({
          id: userId,
          email: validatedInput.email,
          name: validatedInput.name,
          password: tempPassword ? await hashPassword(tempPassword) : undefined,
          roles: validatedInput.roles,
          tenantId: validatedInput.tenantId
        })

        // 记录用户创建活动
        await this.recordUserActivity({
          userId,
          tenantId: validatedInput.tenantId,
          action: 'USER_CREATED',
          resource: 'USER',
          resourceId: userId,
          success: true,
          details: {
            createdBy: context.user?.id,
            hasTemporaryPassword: !!tempPassword,
            roles: validatedInput.roles
          }
        }, context)

        // TODO: 发送欢迎邮件
        if (validatedInput.sendWelcomeEmail && tempPassword) {
          logger.info('应发送欢迎邮件', { 
            userId, 
            email: validatedInput.email, 
            tempPassword 
          })
        }

        logger.info('用户创建成功', { userId, email: validatedInput.email })
        
        return {
          ...result,
          data: {
            ...result.data,
            temporaryPassword: tempPassword
          }
        }
      }
      
      return result
    } catch (error) {
      logger.error('用户创建失败', { error, input })
      throw error
    }
  }

  /**
   * 更新用户信息
   */
  @requireAuth()
  @requirePermission('user:update')
  async updateUser(
    userId: string,
    input: UpdateUserInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('更新用户', { userId, operatorId: context.user?.id })

    try {
      const validatedInput = UpdateUserInput.parse(input)
      
      const updateData = {
        ...validatedInput,
        updatedAt: new Date()
      }

      const result = await this.crudService.update(userId, updateData, context)
      
      if (result.success) {
        // 记录用户更新活动
        await this.recordUserActivity({
          userId,
          tenantId: context.user?.tenantId || '',
          action: 'USER_UPDATED',
          resource: 'USER',
          resourceId: userId,
          success: true,
          details: {
            updatedBy: context.user?.id,
            changes: Object.keys(validatedInput)
          }
        }, context)
      }

      return result
    } catch (error) {
      logger.error('用户更新失败', { error, userId, input })
      throw error
    }
  }

  /**
   * 获取用户详情
   */
  @requireAuth()
  @requirePermission('user:read')
  async getUser(
    userId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    return await this.crudService.findById(userId, context)
  }

  /**
   * 查询用户列表
   */
  @requireAuth()
  @requirePermission('user:read')
  async listUsers(
    filters: UserFilters = {},
    context: CrudContext
  ): Promise<CrudResult<any[]>> {
    const validatedFilters = UserFilters.parse(filters)
    
    // 构建查询条件
    const where: any = {}
    
    if (validatedFilters.tenantId) {
      where.tenantId = validatedFilters.tenantId
    }
    
    if (validatedFilters.status) {
      where.status = validatedFilters.status
    }
    
    if (validatedFilters.department) {
      where.department = validatedFilters.department
    }
    
    if (validatedFilters.position) {
      where.position = validatedFilters.position
    }
    
    if (validatedFilters.search) {
      where.OR = [
        { name: { contains: validatedFilters.search, mode: 'insensitive' } },
        { email: { contains: validatedFilters.search, mode: 'insensitive' } },
        { employeeId: { contains: validatedFilters.search, mode: 'insensitive' } }
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
    
    if (validatedFilters.lastLoginAfter || validatedFilters.lastLoginBefore) {
      where.lastLoginAt = {}
      if (validatedFilters.lastLoginAfter) {
        where.lastLoginAt.gte = validatedFilters.lastLoginAfter
      }
      if (validatedFilters.lastLoginBefore) {
        where.lastLoginAt.lte = validatedFilters.lastLoginBefore
      }
    }

    return await this.crudService.findMany({ where }, context)
  }

  /**
   * 停用用户
   */
  @requireAuth()
  @requirePermission('user:suspend')
  async suspendUser(
    userId: string,
    reason: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.warn('停用用户', { userId, reason, operatorId: context.user?.id })
    
    const result = await this.crudService.update(
      userId,
      { 
        status: 'SUSPENDED',
        updatedAt: new Date()
      },
      context
    )

    if (result.success) {
      // 记录停用活动
      await this.recordUserActivity({
        userId,
        tenantId: context.user?.tenantId || '',
        action: 'USER_SUSPENDED',
        resource: 'USER',
        resourceId: userId,
        success: true,
        details: {
          suspendedBy: context.user?.id,
          reason
        }
      }, context)

      // TODO: 撤销所有活跃会话
      logger.info('应撤销用户所有活跃会话', { userId })
    }

    return result
  }

  /**
   * 激活用户
   */
  @requireAuth()
  @requirePermission('user:activate')
  async activateUser(
    userId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('激活用户', { userId, operatorId: context.user?.id })
    
    const result = await this.crudService.update(
      userId,
      { 
        status: 'ACTIVE',
        loginAttempts: 0, // 重置登录尝试次数
        lockedUntil: null, // 清除锁定时间
        updatedAt: new Date()
      },
      context
    )

    if (result.success) {
      // 记录激活活动
      await this.recordUserActivity({
        userId,
        tenantId: context.user?.tenantId || '',
        action: 'USER_ACTIVATED',
        resource: 'USER',
        resourceId: userId,
        success: true,
        details: {
          activatedBy: context.user?.id
        }
      }, context)
    }

    return result
  }

  /**
   * 软删除用户
   */
  @requireAuth()
  @requirePermission('user:delete')
  async deleteUser(
    userId: string,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.warn('删除用户', { userId, operatorId: context.user?.id })
    
    const result = await this.crudService.update(
      userId,
      {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      context
    )

    if (result.success) {
      // 记录删除活动
      await this.recordUserActivity({
        userId,
        tenantId: context.user?.tenantId || '',
        action: 'USER_DELETED',
        resource: 'USER',
        resourceId: userId,
        success: true,
        details: {
          deletedBy: context.user?.id
        }
      }, context)

      // TODO: 清理用户相关数据
      logger.info('应清理用户相关数据', { userId })
    }

    return result
  }

  /**
   * 重置用户密码
   */
  @requireAuth()
  @requirePermission('user:password:reset')
  async resetUserPassword(
    userId: string,
    sendEmail: boolean = true,
    context: CrudContext
  ): Promise<CrudResult<{ temporaryPassword: string }>> {
    logger.info('重置用户密码', { userId, operatorId: context.user?.id })

    try {
      // 生成临时密码
      const tempPassword = generateTemporaryPassword()
      const hashedPassword = await hashPassword(tempPassword)

      // 更新认证系统中的密码
      await authService.updateUserPassword(userId, hashedPassword, true)

      // 记录密码重置活动
      await this.recordUserActivity({
        userId,
        tenantId: context.user?.tenantId || '',
        action: 'PASSWORD_RESET',
        resource: 'USER',
        resourceId: userId,
        success: true,
        details: {
          resetBy: context.user?.id,
          sendEmail
        }
      }, context)

      // TODO: 发送密码重置邮件
      if (sendEmail) {
        logger.info('应发送密码重置邮件', { userId, tempPassword })
      }

      logger.info('用户密码重置成功', { userId })

      return {
        success: true,
        data: { temporaryPassword: tempPassword }
      }
    } catch (error) {
      logger.error('用户密码重置失败', { error, userId })
      throw error
    }
  }

  /**
   * 启用/禁用用户MFA
   */
  @requireAuth()
  @requirePermission('user:mfa:manage')
  async toggleUserMFA(
    userId: string,
    enabled: boolean,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    logger.info('切换用户MFA状态', { userId, enabled, operatorId: context.user?.id })

    const updateData: any = {
      mfaEnabled: enabled,
      updatedAt: new Date()
    }

    // 如果禁用MFA，清除相关密钥
    if (!enabled) {
      updateData.mfaSecret = null
      updateData.backupCodes = null
    }

    const result = await this.crudService.update(userId, updateData, context)

    if (result.success) {
      // 记录MFA状态变更
      await this.recordUserActivity({
        userId,
        tenantId: context.user?.tenantId || '',
        action: enabled ? 'MFA_ENABLED' : 'MFA_DISABLED',
        resource: 'USER',
        resourceId: userId,
        success: true,
        details: {
          changedBy: context.user?.id
        }
      }, context)
    }

    return result
  }

  /**
   * 获取用户活动记录
   */
  @requireAuth()
  @requirePermission('user:activity:read')
  async getUserActivities(
    userId: string,
    filters: {
      action?: string
      success?: boolean
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {},
    context: CrudContext
  ): Promise<CrudResult<any[]>> {
    const where: any = { userId }

    if (filters.action) {
      where.action = filters.action
    }

    if (typeof filters.success === 'boolean') {
      where.success = filters.success
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    return await this.activityCrudService.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100
    }, context)
  }

  /**
   * 记录用户活动
   */
  async recordUserActivity(
    input: CreateUserActivityInput,
    context: CrudContext
  ): Promise<CrudResult<any>> {
    const validatedInput = CreateUserActivityInput.parse(input)
    
    const activityData = {
      id: crypto.randomUUID(),
      ...validatedInput,
      createdAt: new Date()
    }

    return await this.activityCrudService.create(activityData, context)
  }

  /**
   * 更新用户最后活跃时间
   */
  async updateLastActive(
    userId: string,
    ipAddress?: string,
    context: CrudContext
  ): Promise<void> {
    try {
      const updateData: any = {
        lastActiveAt: new Date(),
        updatedAt: new Date()
      }

      if (ipAddress) {
        updateData.lastLoginIp = ipAddress
      }

      await this.crudService.update(userId, updateData, context)
    } catch (error) {
      // 静默处理错误，不影响主流程
      logger.warn('更新用户活跃时间失败', { error, userId })
    }
  }

  /**
   * 用户创建前的钩子
   */
  private async beforeCreateUser(data: any, context: CrudContext): Promise<any> {
    // 检查邮箱是否已存在
    const existing = await this.crudService.findFirst(
      { where: { email: data.email } },
      context
    )
    
    if (existing.success && existing.data) {
      throw new Error(`邮箱 '${data.email}' 已被使用`)
    }

    // 检查员工编号是否已存在
    if (data.employeeId) {
      const existingEmployee = await this.crudService.findFirst(
        { where: { 
          employeeId: data.employeeId,
          tenantId: data.tenantId
        }},
        context
      )
      
      if (existingEmployee.success && existingEmployee.data) {
        throw new Error(`员工编号 '${data.employeeId}' 在当前租户中已存在`)
      }
    }

    return data
  }

  /**
   * 用户创建后的钩子
   */
  private async afterCreateUser(data: any, context: CrudContext): Promise<void> {
    // 更新租户用户配额
    const quotas = await tenantService.getTenantQuotas(data.tenantId, context)
    if (quotas.success && quotas.data) {
      await tenantService.updateTenantQuotas(
        data.tenantId,
        {
          currentUsers: quotas.data.currentUsers + 1
        },
        context
      )
    }

    logger.info('用户创建后处理完成', { userId: data.id, tenantId: data.tenantId })
  }

  /**
   * 用户更新前的钩子
   */
  private async beforeUpdateUser(id: string, data: any, context: CrudContext): Promise<any> {
    // 如果更新员工编号，检查是否冲突
    if (data.employeeId) {
      const user = await this.crudService.findById(id, context)
      if (user.success && user.data) {
        const existing = await this.crudService.findFirst(
          { 
            where: { 
              employeeId: data.employeeId,
              tenantId: user.data.tenantId,
              id: { not: id }
            } 
          },
          context
        )
        
        if (existing.success && existing.data) {
          throw new Error(`员工编号 '${data.employeeId}' 在当前租户中已存在`)
        }
      }
    }

    return data
  }

  /**
   * 用户删除前的钩子
   */
  private async beforeDeleteUser(id: string, context: CrudContext): Promise<void> {
    // 检查是否有其他用户的直属主管
    const subordinates = await this.crudService.findMany(
      { where: { managerId: id } },
      context
    )
    
    if (subordinates.success && subordinates.data && subordinates.data.length > 0) {
      logger.warn('用户还有下属，建议先重新分配主管', { 
        userId: id,
        subordinateCount: subordinates.data.length
      })
    }
  }
}

/**
 * 导出用户服务实例
 */
export const userService = new UserService()