/**
 * 审计日志插件示例 - 展示细粒度钩子的使用
 * 
 * 功能：
 * - 记录所有 CRUD 操作的详细日志
 * - 特别关注敏感实体（User、Payment）的变更
 * - 记录敏感字段（password、email、balance）的访问
 * - 记录状态变更（如订单状态变化）
 */

import type { Logger as _Logger } from '@linch-kit/core'

import type { 
  CrudPluginHooks, 
  HookContext, 
  FieldChange,
  CreateInput as _CreateInput,
  UpdateInput as _UpdateInput
} from '../types'
import { BaseCrudPlugin } from '../base-plugin'

/**
 * 审计日志条目
 */
interface AuditLogEntry {
  id: string
  timestamp: Date
  operation: string
  entityName: string
  entityId?: string
  userId?: string
  userAgent?: string
  ipAddress?: string
  changes?: FieldChange[]
  metadata?: Record<string, unknown>
  sensitiveFields?: string[]
}

/**
 * 审计日志插件
 */
export class AuditLogPlugin extends BaseCrudPlugin {
  private auditLogs: AuditLogEntry[] = []
  private sensitiveEntities = new Set(['User', 'Payment', 'Order', 'Account'])
  private sensitiveFields = new Set(['password', 'email', 'phone', 'balance', 'creditCard', 'ssn'])

  constructor() {
    super({
      name: 'audit-log-plugin',
      version: '1.0.0',
      description: '审计日志插件 - 记录所有CRUD操作的详细日志'
    })
  }

  get hooks(): CrudPluginHooks {
    return {
      // 全局钩子 - 记录所有实体的操作
      afterCreate: async <T>(entityName: string, result: T, context: HookContext): Promise<void> => {
        await this.logOperation('CREATE', entityName, result, context)
      },

      afterUpdate: async <T>(
        entityName: string, 
        result: T, 
        existing: unknown, 
        changes: FieldChange[], 
        context: HookContext
      ): Promise<void> => {
        await this.logOperation('UPDATE', entityName, result, context, changes)
      },

      afterDelete: async (entityName: string, existing: unknown, context: HookContext): Promise<void> => {
        await this.logOperation('DELETE', entityName, existing, context)
      },

      // 字段级钩子 - 记录敏感字段的访问
      beforeSensitiveFieldAccess: async (
        entityName: string,
        fieldName: string,
        value: unknown,
        user: unknown,
        context: HookContext
      ): Promise<unknown> => {
        if (this.isSensitiveField(fieldName)) {
          await this.logSensitiveFieldAccess(entityName, fieldName, user, context)
        }
        return value
      },

      afterFieldSet: async (
        entityName: string,
        fieldName: string,
        oldValue: unknown,
        newValue: unknown,
        operation: 'create' | 'update',
        context: HookContext
      ): Promise<void> => {
        if (this.isSensitiveField(fieldName)) {
          await this.logSensitiveFieldChange(
            entityName, 
            fieldName, 
            oldValue, 
            newValue, 
            operation, 
            context
          )
        }
      },

      // 条件钩子 - 记录状态变更
      onStatusChange: async <T>(
        entityName: string,
        id: string,
        oldStatus: string,
        newStatus: string,
        entity: T,
        context: HookContext
      ): Promise<void> => {
        await this.logStatusChange(entityName, id, oldStatus, newStatus, entity, context)
      },

      // 钩子选择器 - 决定是否执行钩子
      shouldExecuteHook: async (
        hookName: string,
        entityName: string,
        context: HookContext
      ): Promise<boolean> => {
        // 对敏感实体始终记录日志
        if (this.sensitiveEntities.has(entityName)) {
          return true
        }

        // 对特定操作记录日志
        if (['CREATE', 'UPDATE', 'DELETE'].includes(context.operation.toUpperCase())) {
          return true
        }

        // 字段级钩子根据字段敏感性决定
        if (hookName.includes('Field')) {
          return true // 在具体钩子中再判断
        }

        return false
      },

      // 钩子优先级 - 审计日志应该最后执行
      getHookPriority: (_hookName: string, _entityName: string): number => {
        return 1000 // 低优先级，最后执行
      }
    }
  }

  /**
   * 记录操作日志
   */
  private async logOperation(
    operation: string,
    entityName: string,
    entity: unknown,
    context: HookContext,
    changes?: FieldChange[]
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: context.timestamp,
      operation,
      entityName,
      entityId: this.extractEntityId(entity),
      userId: this.extractUserId(context.user),
      userAgent: context.metadata?.userAgent as string,
      ipAddress: context.metadata?.ipAddress as string,
      changes,
      metadata: context.metadata,
      sensitiveFields: changes?.filter(c => this.isSensitiveField(c.fieldName)).map(c => c.fieldName)
    }

    this.auditLogs.push(logEntry)

    // 对敏感操作立即持久化
    if (this.isSensitiveOperation(entityName, operation, changes)) {
      await this.persistAuditLog(logEntry)
    }

    this.log('info', `Audit log recorded: ${operation} ${entityName}`, {
      entityId: logEntry.entityId,
      userId: logEntry.userId,
      changesCount: changes?.length || 0
    })
  }

  /**
   * 记录敏感字段访问
   */
  private async logSensitiveFieldAccess(
    entityName: string,
    fieldName: string,
    user: unknown,
    context: HookContext
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `field_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: context.timestamp,
      operation: 'FIELD_ACCESS',
      entityName,
      userId: this.extractUserId(user),
      metadata: {
        fieldName,
        ...context.metadata
      }
    }

    this.auditLogs.push(logEntry)
    await this.persistAuditLog(logEntry) // 敏感字段访问立即持久化

    this.log('warn', `Sensitive field accessed: ${entityName}.${fieldName}`, {
      userId: logEntry.userId,
      fieldName
    })
  }

  /**
   * 记录敏感字段变更
   */
  private async logSensitiveFieldChange(
    entityName: string,
    fieldName: string,
    oldValue: unknown,
    newValue: unknown,
    operation: 'create' | 'update',
    context: HookContext
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `field_change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: context.timestamp,
      operation: 'FIELD_CHANGE',
      entityName,
      userId: this.extractUserId(context.user),
      changes: [{
        fieldName,
        oldValue: this.maskSensitiveValue(oldValue),
        newValue: this.maskSensitiveValue(newValue),
        action: operation === 'create' ? 'added' : 'modified'
      }],
      metadata: context.metadata
    }

    this.auditLogs.push(logEntry)
    await this.persistAuditLog(logEntry)

    this.log('warn', `Sensitive field changed: ${entityName}.${fieldName}`, {
      userId: logEntry.userId,
      operation
    })
  }

  /**
   * 记录状态变更
   */
  private async logStatusChange<T>(
    entityName: string,
    id: string,
    oldStatus: string,
    newStatus: string,
    entity: T,
    context: HookContext
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `status_change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: context.timestamp,
      operation: 'STATUS_CHANGE',
      entityName,
      entityId: id,
      userId: this.extractUserId(context.user),
      changes: [{
        fieldName: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
        action: 'modified'
      }],
      metadata: {
        ...context.metadata,
        entitySnapshot: this.createEntitySnapshot(entity)
      }
    }

    this.auditLogs.push(logEntry)
    await this.persistAuditLog(logEntry)

    this.log('info', `Status changed: ${entityName}[${id}] ${oldStatus} → ${newStatus}`, {
      userId: logEntry.userId
    })
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(filters?: {
    entityName?: string
    userId?: string
    operation?: string
    startDate?: Date
    endDate?: Date
  }): AuditLogEntry[] {
    let logs = this.auditLogs

    if (filters) {
      logs = logs.filter(log => {
        if (filters.entityName && log.entityName !== filters.entityName) return false
        if (filters.userId && log.userId !== filters.userId) return false
        if (filters.operation && log.operation !== filters.operation) return false
        if (filters.startDate && log.timestamp < filters.startDate) return false
        if (filters.endDate && log.timestamp > filters.endDate) return false
        return true
      })
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // 辅助方法

  private extractEntityId(entity: unknown): string | undefined {
    if (entity && typeof entity === 'object' && 'id' in entity) {
      return (entity as { id: string }).id
    }
    return undefined
  }

  private extractUserId(user: unknown): string | undefined {
    if (user && typeof user === 'object' && 'id' in user) {
      return (user as { id: string }).id
    }
    return undefined
  }

  private isSensitiveField(fieldName: string): boolean {
    return this.sensitiveFields.has(fieldName) || 
           fieldName.toLowerCase().includes('password') ||
           fieldName.toLowerCase().includes('secret') ||
           fieldName.toLowerCase().includes('token')
  }

  private isSensitiveOperation(
    entityName: string, 
    operation: string, 
    changes?: FieldChange[]
  ): boolean {
    // 敏感实体的所有操作
    if (this.sensitiveEntities.has(entityName)) {
      return true
    }

    // 包含敏感字段变更的操作
    if (changes && changes.some(c => this.isSensitiveField(c.fieldName))) {
      return true
    }

    return false
  }

  private maskSensitiveValue(value: unknown): unknown {
    if (typeof value === 'string' && value.length > 4) {
      return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
    }
    return '***'
  }

  private createEntitySnapshot(entity: unknown): Record<string, unknown> {
    if (!entity || typeof entity !== 'object') {
      return {}
    }

    const snapshot: Record<string, unknown> = {}
    const entityObj = entity as Record<string, unknown>

    for (const [key, value] of Object.entries(entityObj)) {
      if (this.isSensitiveField(key)) {
        snapshot[key] = this.maskSensitiveValue(value)
      } else {
        snapshot[key] = value
      }
    }

    return snapshot
  }

  private async persistAuditLog(logEntry: AuditLogEntry): Promise<void> {
    try {
      // 这里可以集成到持久化存储
      // 例如：数据库、消息队列、文件系统等
      this.log('debug', 'Audit log persisted', { id: logEntry.id })
    } catch (error) {
      this.log('error', 'Failed to persist audit log', { 
        id: logEntry.id, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}