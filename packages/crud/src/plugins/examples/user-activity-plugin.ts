/**
 * 用户活动插件示例 - 展示实体级和条件钩子的使用
 * 
 * 功能：
 * - 专门监控 User 实体的操作
 * - 记录用户登录、注册、状态变更
 * - 自动更新用户活动统计
 * - 处理用户关联关系变更
 */

import type { Logger } from '@linch-kit/core'
import type { 
  CrudPluginHooks, 
  HookContext, 
  FieldChange,
  CreateInput,
  UpdateInput
} from '../types'
import { BaseCrudPlugin } from '../base-plugin'

/**
 * 用户活动记录
 */
interface UserActivity {
  id: string
  userId: string
  action: string
  timestamp: Date
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * 用户统计
 */
interface UserStats {
  userId: string
  loginCount: number
  lastLoginAt?: Date
  profileUpdateCount: number
  lastProfileUpdateAt?: Date
  statusChangeCount: number
  relationChangeCount: number
}

/**
 * 用户活动插件
 */
export class UserActivityPlugin extends BaseCrudPlugin {
  private userActivities: UserActivity[] = []
  private userStats = new Map<string, UserStats>()

  constructor() {
    super({
      name: 'user-activity-plugin',
      version: '1.0.0',
      description: '用户活动插件 - 专门监控用户实体的操作和活动'
    })
  }

  get hooks(): CrudPluginHooks {
    return {
      // 实体级钩子 - 仅处理 User 实体
      afterEntityCreate: async <T>(result: T, context: HookContext): Promise<void> => {
        if (context.entityName === 'User') {
          await this.handleUserRegistration(result, context)
        }
      },

      afterEntityUpdate: async <T>(
        result: T,
        existing: unknown,
        changes: FieldChange[],
        context: HookContext
      ): Promise<void> => {
        if (context.entityName === 'User') {
          await this.handleUserProfileUpdate(result, existing, changes, context)
        }
      },

      afterEntityDelete: async (existing: unknown, context: HookContext): Promise<void> => {
        if (context.entityName === 'User') {
          await this.handleUserDeletion(existing, context)
        }
      },

      // 字段级钩子 - 监控特定字段变更
      afterFieldSet: async (
        entityName: string,
        fieldName: string,
        oldValue: unknown,
        newValue: unknown,
        operation: 'create' | 'update',
        context: HookContext
      ): Promise<void> => {
        if (entityName === 'User') {
          await this.handleUserFieldChange(fieldName, oldValue, newValue, operation, context)
        }
      },

      // 条件钩子 - 用户状态变更
      onStatusChange: async <T>(
        entityName: string,
        id: string,
        oldStatus: string,
        newStatus: string,
        entity: T,
        context: HookContext
      ): Promise<void> => {
        if (entityName === 'User') {
          await this.handleUserStatusChange(id, oldStatus, newStatus, entity, context)
        }
      },

      // 关联变更钩子 - 用户关系变更
      onRelationChange: async <T>(
        entityName: string,
        id: string,
        relationName: string,
        changeType: 'connect' | 'disconnect' | 'set',
        relatedIds: string[],
        entity: T,
        context: HookContext
      ): Promise<void> => {
        if (entityName === 'User') {
          await this.handleUserRelationChange(id, relationName, changeType, relatedIds, entity, context)
        }
      },

      // 钩子选择器 - 仅处理 User 实体
      shouldExecuteHook: async (
        hookName: string,
        entityName: string,
        context: HookContext
      ): Promise<boolean> => {
        // 仅处理 User 实体相关的钩子
        return entityName === 'User'
      },

      // 钩子优先级 - 用户活动插件优先级较高
      getHookPriority: (hookName: string, entityName: string): number => {
        return entityName === 'User' ? 10 : 100
      }
    }
  }

  /**
   * 处理用户注册
   */
  private async handleUserRegistration<T>(user: T, context: HookContext): Promise<void> {
    const userId = this.extractUserId(user)
    if (!userId) return

    // 记录注册活动
    await this.recordUserActivity(userId, 'USER_REGISTERED', context, {
      registrationMethod: context.metadata?.registrationMethod,
      referrer: context.metadata?.referrer
    })

    // 初始化用户统计
    this.userStats.set(userId, {
      userId,
      loginCount: 0,
      profileUpdateCount: 0,
      statusChangeCount: 0,
      relationChangeCount: 0
    })

    this.log('info', `User registered: ${userId}`, {
      userId,
      registrationMethod: context.metadata?.registrationMethod
    })
  }

  /**
   * 处理用户资料更新
   */
  private async handleUserProfileUpdate<T>(
    user: T,
    existing: unknown,
    changes: FieldChange[],
    context: HookContext
  ): Promise<void> {
    const userId = this.extractUserId(user)
    if (!userId) return

    // 分析字段变更
    const importantChanges = changes.filter(change => 
      ['email', 'phone', 'avatar', 'displayName', 'bio'].includes(change.fieldName)
    )

    if (importantChanges.length > 0) {
      // 记录资料更新活动
      await this.recordUserActivity(userId, 'PROFILE_UPDATED', context, {
        changedFields: importantChanges.map(c => c.fieldName),
        changeCount: importantChanges.length
      })

      // 更新统计
      const stats = this.getUserStats(userId)
      stats.profileUpdateCount++
      stats.lastProfileUpdateAt = context.timestamp
    }

    this.log('info', `User profile updated: ${userId}`, {
      userId,
      changedFields: importantChanges.map(c => c.fieldName)
    })
  }

  /**
   * 处理用户删除
   */
  private async handleUserDeletion(user: unknown, context: HookContext): Promise<void> => {
    const userId = this.extractUserId(user)
    if (!userId) return

    // 记录用户删除活动
    await this.recordUserActivity(userId, 'USER_DELETED', context, {
      deletionReason: context.metadata?.deletionReason,
      softDelete: context.metadata?.softDelete
    })

    // 清理用户统计（如果是硬删除）
    if (!context.metadata?.softDelete) {
      this.userStats.delete(userId)
    }

    this.log('warn', `User deleted: ${userId}`, {
      userId,
      softDelete: context.metadata?.softDelete
    })
  }

  /**
   * 处理用户字段变更
   */
  private async handleUserFieldChange(
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<void> => {
    const userId = this.extractUserId(context.user) || this.extractUserIdFromContext(context)
    if (!userId) return

    // 处理特殊字段变更
    switch (fieldName) {
      case 'lastLoginAt':
        await this.handleUserLogin(userId, newValue as Date, context)
        break
      
      case 'email':
        await this.handleEmailChange(userId, oldValue as string, newValue as string, context)
        break
      
      case 'avatar':
        await this.handleAvatarChange(userId, oldValue as string, newValue as string, context)
        break
      
      case 'preferences':
        await this.handlePreferencesChange(userId, oldValue, newValue, context)
        break
    }
  }

  /**
   * 处理用户状态变更
   */
  private async handleUserStatusChange<T>(
    userId: string,
    oldStatus: string,
    newStatus: string,
    user: T,
    context: HookContext
  ): Promise<void> => {
    // 记录状态变更活动
    await this.recordUserActivity(userId, 'STATUS_CHANGED', context, {
      oldStatus,
      newStatus,
      statusChangeReason: context.metadata?.statusChangeReason
    })

    // 更新统计
    const stats = this.getUserStats(userId)
    stats.statusChangeCount++

    // 处理特殊状态变更
    if (newStatus === 'suspended') {
      await this.handleUserSuspension(userId, context)
    } else if (newStatus === 'active' && oldStatus === 'suspended') {
      await this.handleUserReactivation(userId, context)
    }

    this.log('info', `User status changed: ${userId} ${oldStatus} → ${newStatus}`, {
      userId,
      oldStatus,
      newStatus
    })
  }

  /**
   * 处理用户关联变更
   */
  private async handleUserRelationChange<T>(
    userId: string,
    relationName: string,
    changeType: 'connect' | 'disconnect' | 'set',
    relatedIds: string[],
    user: T,
    context: HookContext
  ): Promise<void> => {
    // 记录关联变更活动
    await this.recordUserActivity(userId, 'RELATION_CHANGED', context, {
      relationName,
      changeType,
      relatedIds,
      relatedCount: relatedIds.length
    })

    // 更新统计
    const stats = this.getUserStats(userId)
    stats.relationChangeCount++

    // 处理特殊关联变更
    switch (relationName) {
      case 'roles':
        await this.handleUserRoleChange(userId, changeType, relatedIds, context)
        break
      
      case 'teams':
        await this.handleUserTeamChange(userId, changeType, relatedIds, context)
        break
      
      case 'permissions':
        await this.handleUserPermissionChange(userId, changeType, relatedIds, context)
        break
    }

    this.log('info', `User relation changed: ${userId} ${relationName} ${changeType}`, {
      userId,
      relationName,
      changeType,
      relatedCount: relatedIds.length
    })
  }

  // 特殊事件处理方法

  /**
   * 处理用户登录
   */
  private async handleUserLogin(userId: string, loginTime: Date, context: HookContext): Promise<void> {
    await this.recordUserActivity(userId, 'USER_LOGIN', context, {
      loginTime,
      loginMethod: context.metadata?.loginMethod
    })

    const stats = this.getUserStats(userId)
    stats.loginCount++
    stats.lastLoginAt = loginTime
  }

  /**
   * 处理邮箱变更
   */
  private async handleEmailChange(
    userId: string,
    oldEmail: string,
    newEmail: string,
    context: HookContext
  ): Promise<void> => {
    await this.recordUserActivity(userId, 'EMAIL_CHANGED', context, {
      oldEmail: this.maskEmail(oldEmail),
      newEmail: this.maskEmail(newEmail)
    })
  }

  /**
   * 处理头像变更
   */
  private async handleAvatarChange(
    userId: string,
    oldAvatar: string,
    newAvatar: string,
    context: HookContext
  ): Promise<void> => {
    await this.recordUserActivity(userId, 'AVATAR_CHANGED', context, {
      hasOldAvatar: !!oldAvatar,
      hasNewAvatar: !!newAvatar
    })
  }

  /**
   * 处理偏好设置变更
   */
  private async handlePreferencesChange(
    userId: string,
    oldPreferences: unknown,
    newPreferences: unknown,
    context: HookContext
  ): Promise<void> => {
    await this.recordUserActivity(userId, 'PREFERENCES_CHANGED', context, {
      preferencesCount: Object.keys(newPreferences as Record<string, unknown> || {}).length
    })
  }

  /**
   * 处理用户暂停
   */
  private async handleUserSuspension(userId: string, context: HookContext): Promise<void> => {
    await this.recordUserActivity(userId, 'USER_SUSPENDED', context, {
      suspensionReason: context.metadata?.suspensionReason,
      suspendedBy: context.user
    })
  }

  /**
   * 处理用户重新激活
   */
  private async handleUserReactivation(userId: string, context: HookContext): Promise<void> => {
    await this.recordUserActivity(userId, 'USER_REACTIVATED', context, {
      reactivatedBy: context.user
    })
  }

  /**
   * 处理用户角色变更
   */
  private async handleUserRoleChange(
    userId: string,
    changeType: 'connect' | 'disconnect' | 'set',
    roleIds: string[],
    context: HookContext
  ): Promise<void> => {
    await this.recordUserActivity(userId, 'ROLES_CHANGED', context, {
      changeType,
      roleIds,
      roleCount: roleIds.length
    })
  }

  /**
   * 处理用户团队变更
   */
  private async handleUserTeamChange(
    userId: string,
    changeType: 'connect' | 'disconnect' | 'set',
    teamIds: string[],
    context: HookContext
  ): Promise<void> => {
    await this.recordUserActivity(userId, 'TEAMS_CHANGED', context, {
      changeType,
      teamIds,
      teamCount: teamIds.length
    })
  }

  /**
   * 处理用户权限变更
   */
  private async handleUserPermissionChange(
    userId: string,
    changeType: 'connect' | 'disconnect' | 'set',
    permissionIds: string[],
    context: HookContext
  ): Promise<void> => {
    await this.recordUserActivity(userId, 'PERMISSIONS_CHANGED', context, {
      changeType,
      permissionIds,
      permissionCount: permissionIds.length
    })
  }

  // 工具方法

  /**
   * 记录用户活动
   */
  private async recordUserActivity(
    userId: string,
    action: string,
    context: HookContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const activity: UserActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      timestamp: context.timestamp,
      metadata: {
        ...context.metadata,
        ...metadata
      },
      ipAddress: context.metadata?.ipAddress as string,
      userAgent: context.metadata?.userAgent as string
    }

    this.userActivities.push(activity)
  }

  /**
   * 获取用户统计
   */
  private getUserStats(userId: string): UserStats {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, {
        userId,
        loginCount: 0,
        profileUpdateCount: 0,
        statusChangeCount: 0,
        relationChangeCount: 0
      })
    }
    return this.userStats.get(userId)!
  }

  /**
   * 提取用户ID
   */
  private extractUserId(user: unknown): string | undefined {
    if (user && typeof user === 'object' && 'id' in user) {
      return (user as { id: string }).id
    }
    return undefined
  }

  /**
   * 从上下文提取用户ID
   */
  private extractUserIdFromContext(context: HookContext): string | undefined {
    return context.metadata?.targetUserId as string || this.extractUserId(context.user)
  }

  /**
   * 脱敏邮箱
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***'
    
    const [localPart, domain] = email.split('@')
    const maskedLocal = localPart.length > 2 
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : '***'
    
    return `${maskedLocal}@${domain}`
  }

  /**
   * 获取用户活动记录
   */
  getUserActivities(userId: string, limit: number = 100): UserActivity[] {
    return this.userActivities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * 获取用户统计信息
   */
  getUserStatsInfo(userId: string): UserStats | undefined {
    return this.userStats.get(userId)
  }
}