/**
 * CRUD 权限管理器
 */

import type {
  CRUDPermissions,
  CRUDPermissionManager as ICRUDPermissionManager,
  PermissionCheckResult,
  CRUDContext
} from '../types'
import { CRUDOperation } from '../types/crud-operations'

/**
 * CRUD 权限管理器实现
 */
export class CRUDPermissionManager implements ICRUDPermissionManager {
  constructor(private permissions: CRUDPermissions) {}

  /**
   * 检查操作权限
   */
  async checkOperation(
    operation: CRUDOperation,
    context?: CRUDContext
  ): Promise<PermissionCheckResult> {
    const operationPermission = this.permissions.operations[operation as keyof typeof this.permissions.operations]
    
    if (operationPermission === undefined) {
      return { allowed: false, reason: 'Operation not configured' }
    }
    
    if (typeof operationPermission === 'boolean') {
      return { allowed: operationPermission }
    }
    
    if (typeof operationPermission === 'string') {
      // 这里应该集成实际的权限检查逻辑
      // 临时实现：假设有权限
      return { allowed: true, requiredPermissions: [operationPermission] }
    }
    
    if (typeof operationPermission === 'function') {
      const allowed = await operationPermission(context)
      return { allowed }
    }
    
    return { allowed: false, reason: 'Invalid permission configuration' }
  }

  /**
   * 检查字段权限
   */
  async checkField(
    field: string,
    operation: 'read' | 'write' | 'filter' | 'sort',
    context?: CRUDContext
  ): Promise<PermissionCheckResult> {
    const fieldPermission = this.permissions.fields?.[field]
    
    if (!fieldPermission) {
      return { allowed: true } // 默认允许
    }
    
    const permission = fieldPermission[operation]
    
    if (permission === undefined) {
      return { allowed: true }
    }
    
    if (typeof permission === 'boolean') {
      return { allowed: permission }
    }
    
    if (typeof permission === 'string') {
      return { allowed: true, requiredPermissions: [permission] }
    }
    
    if (typeof permission === 'function') {
      const allowed = await permission(context)
      return { allowed }
    }
    
    return { allowed: false, reason: 'Invalid field permission configuration' }
  }

  /**
   * 检查行级权限
   */
  async checkRow(
    operation: CRUDOperation,
    data: any,
    context?: CRUDContext
  ): Promise<PermissionCheckResult> {
    if (!this.permissions.rowLevel) {
      return { allowed: true }
    }
    
    const allowed = await this.permissions.rowLevel(operation, data, context)
    return { allowed }
  }

  /**
   * 获取用户可访问的字段
   */
  async getAccessibleFields(
    operation: 'read' | 'write' | 'filter' | 'sort',
    context?: CRUDContext
  ): Promise<string[]> {
    if (!this.permissions.fields) {
      return [] // 返回空数组表示所有字段都可访问
    }
    
    const accessibleFields: string[] = []
    
    for (const [field] of Object.entries(this.permissions.fields)) {
      const result = await this.checkField(field, operation, context)
      if (result.allowed) {
        accessibleFields.push(field)
      }
    }
    
    return accessibleFields
  }

  /**
   * 获取用户可执行的操作
   */
  async getAccessibleOperations(context?: CRUDContext): Promise<CRUDOperation[]> {
    const accessibleOperations: CRUDOperation[] = []
    
    for (const operation of Object.values(CRUDOperation)) {
      const result = await this.checkOperation(operation, context)
      if (result.allowed) {
        accessibleOperations.push(operation)
      }
    }
    
    return accessibleOperations
  }

  /**
   * 过滤数据中用户无权限访问的字段
   */
  async filterFields<T extends Record<string, any>>(
    data: T | T[],
    operation: 'read' | 'write',
    context?: CRUDContext
  ): Promise<Partial<T> | Partial<T>[]> {
    const accessibleFields = await this.getAccessibleFields(operation, context)
    
    if (accessibleFields.length === 0) {
      // 如果没有配置字段权限，返回原数据
      return data
    }
    
    const filterObject = (obj: T): Partial<T> => {
      const filtered: Partial<T> = {}
      
      for (const field of accessibleFields) {
        if (field in obj) {
          (filtered as any)[field] = (obj as any)[field]
        }
      }
      
      return filtered
    }
    
    if (Array.isArray(data)) {
      return data.map(filterObject)
    } else {
      return filterObject(data)
    }
  }
}
