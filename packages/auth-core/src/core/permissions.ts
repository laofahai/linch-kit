import type { AuthUser } from '../types/auth'
import type {
  PermissionChecker,
  HierarchicalPermissionChecker,
  HierarchicalPermissionConfig
} from '../types/permissions'

/**
 * 基础权限检查器实现
 */
export class BasePermissionChecker implements PermissionChecker {
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }

  async hasRole(
    userId: string,
    role: string | string[],
    context?: any
  ): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }

  async getUserPermissions(userId: string, tenantId?: string) {
    // 基础实现，用户可以覆盖
    return {}
  }

  async getUserRoles(userId: string, tenantId?: string): Promise<string[]> {
    // 基础实现，用户可以覆盖
    return []
  }
}

/**
 * 层级权限检查器实现
 */
export class BaseHierarchicalPermissionChecker implements HierarchicalPermissionChecker {
  constructor(private config: HierarchicalPermissionConfig) {}

  async canAccessUser(
    userId: string,
    targetUserId: string,
    action: string
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false
    }

    // 自己总是可以访问自己的数据
    if (userId === targetUserId) {
      return true
    }

    // 检查是否为上级
    if (this.config.superiorCanViewSubordinate && action === 'read') {
      return await this.isSuperior(userId, targetUserId)
    }

    if (this.config.superiorCanManageSubordinate && action === 'update') {
      return await this.isSuperior(userId, targetUserId)
    }

    return false
  }

  async canAccessDepartment(
    userId: string,
    departmentId: string,
    action: string
  ): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }

  async getAccessibleSubordinates(userId: string): Promise<string[]> {
    // 基础实现，用户可以覆盖
    return []
  }

  async getAccessibleDepartments(userId: string): Promise<string[]> {
    // 基础实现，用户可以覆盖
    return []
  }

  async isSuperior(userId: string, targetUserId: string): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }
}

/**
 * 创建权限检查器
 */
export function createPermissionChecker(
  customChecker?: Partial<PermissionChecker>
): PermissionChecker {
  const baseChecker = new BasePermissionChecker()
  
  if (customChecker) {
    return {
      ...baseChecker,
      ...customChecker
    }
  }
  
  return baseChecker
}

/**
 * 创建层级权限检查器
 */
export function createHierarchicalPermissionChecker(
  config: HierarchicalPermissionConfig,
  customChecker?: Partial<HierarchicalPermissionChecker>
): HierarchicalPermissionChecker {
  const baseChecker = new BaseHierarchicalPermissionChecker(config)
  
  if (customChecker) {
    return {
      ...baseChecker,
      ...customChecker
    }
  }
  
  return baseChecker
}

/**
 * 权限工具函数
 */
export const permissionUtils = {
  /**
   * 检查用户是否有任一权限
   */
  hasAnyPermission: async (
    checker: PermissionChecker,
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
    context?: any
  ): Promise<boolean> => {
    for (const permission of permissions) {
      if (await checker.hasPermission(userId, permission.resource, permission.action, context)) {
        return true
      }
    }
    return false
  },

  /**
   * 检查用户是否有所有权限
   */
  hasAllPermissions: async (
    checker: PermissionChecker,
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
    context?: any
  ): Promise<boolean> => {
    for (const permission of permissions) {
      if (!(await checker.hasPermission(userId, permission.resource, permission.action, context))) {
        return false
      }
    }
    return true
  },

  /**
   * 检查用户是否有任一角色
   */
  hasAnyRole: async (
    checker: PermissionChecker,
    userId: string,
    roles: string[],
    context?: any
  ): Promise<boolean> => {
    for (const role of roles) {
      if (await checker.hasRole(userId, role, context)) {
        return true
      }
    }
    return false
  }
}
