import type {
  PermissionChecker,
  HierarchicalPermissionChecker,
  HierarchicalPermissionConfig,
} from '../types/permissions'

/**
 * 基础权限检查器实现
 */
export class BasePermissionChecker implements PermissionChecker {
  async hasPermission(
    _userId: string,
    _resource: string,
    _action: string,
    _context?: any
  ): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }

  async hasRole(_userId: string, _role: string | string[], _context?: any): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }

  async getUserPermissions(_userId: string, _tenantId?: string) {
    // 基础实现，用户可以覆盖
    return {}
  }

  async getUserRoles(_userId: string, _tenantId?: string): Promise<string[]> {
    // 基础实现，用户可以覆盖
    return []
  }
}

/**
 * 层级权限检查器实现
 */
export class BaseHierarchicalPermissionChecker implements HierarchicalPermissionChecker {
  constructor(private config: HierarchicalPermissionConfig) {}

  async canAccessUser(userId: string, targetUserId: string, action: string): Promise<boolean> {
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
    _userId: string,
    _departmentId: string,
    _action: string
  ): Promise<boolean> {
    // 基础实现，用户可以覆盖
    return false
  }

  async getAccessibleSubordinates(_userId: string): Promise<string[]> {
    // 基础实现，用户可以覆盖
    return []
  }

  async getAccessibleDepartments(_userId: string): Promise<string[]> {
    // 基础实现，用户可以覆盖
    return []
  }

  async isSuperior(_userId: string, _targetUserId: string): Promise<boolean> {
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
      hasPermission: customChecker.hasPermission || baseChecker.hasPermission.bind(baseChecker),
      hasRole: customChecker.hasRole || baseChecker.hasRole.bind(baseChecker),
      getUserPermissions:
        customChecker.getUserPermissions || baseChecker.getUserPermissions.bind(baseChecker),
      getUserRoles: customChecker.getUserRoles || baseChecker.getUserRoles.bind(baseChecker),
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
      canAccessUser: customChecker.canAccessUser || baseChecker.canAccessUser.bind(baseChecker),
      canAccessDepartment:
        customChecker.canAccessDepartment || baseChecker.canAccessDepartment.bind(baseChecker),
      getAccessibleSubordinates:
        customChecker.getAccessibleSubordinates ||
        baseChecker.getAccessibleSubordinates.bind(baseChecker),
      getAccessibleDepartments:
        customChecker.getAccessibleDepartments ||
        baseChecker.getAccessibleDepartments.bind(baseChecker),
      isSuperior: customChecker.isSuperior || baseChecker.isSuperior.bind(baseChecker),
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
  },
}
