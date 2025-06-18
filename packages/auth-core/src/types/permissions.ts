/**
 * 权限系统相关类型定义
 */

/**
 * 权限动作
 */
export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage' 
  | string

/**
 * 权限资源
 */
export type PermissionResource = string

/**
 * 权限定义
 */
export interface Permission {
  id: string
  resource: PermissionResource
  action: PermissionAction
  description?: string
  conditions?: PermissionCondition[]
}

/**
 * 权限条件（用于 ABAC）
 */
export interface PermissionCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains'
  value: any
}

/**
 * 角色定义
 */
export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  inherits?: string[]  // 继承其他角色
}

/**
 * RBAC 权限检查上下文
 */
export interface RBACContext {
  user: {
    id: string
    roles: string[]
    permissions?: string[]
  }
  resource: PermissionResource
  action: PermissionAction
  tenantId?: string
}

/**
 * ABAC 权限检查上下文
 */
export interface ABACContext {
  subject: {
    id: string
    attributes: Record<string, any>
  }
  resource: {
    type: PermissionResource
    attributes: Record<string, any>
  }
  action: PermissionAction
  environment: Record<string, any>
}

/**
 * 权限检查结果
 */
export interface PermissionResult {
  allowed: boolean
  reason?: string
  conditions?: PermissionCondition[]
}

/**
 * 权限策略
 */
export interface PermissionPolicy {
  id: string
  name: string
  description?: string
  rules: PermissionRule[]
  priority: number
  enabled: boolean
}

/**
 * 权限规则
 */
export interface PermissionRule {
  id: string
  effect: 'allow' | 'deny'
  subjects: string[]  // 角色或用户 ID
  resources: string[]
  actions: string[]
  conditions?: PermissionCondition[]
}

/**
 * 资源权限映射
 */
export interface ResourcePermissions {
  [resource: string]: {
    [action: string]: boolean
  }
}

/**
 * 用户权限摘要
 */
export interface UserPermissionSummary {
  userId: string
  roles: string[]
  permissions: ResourcePermissions
  tenantId?: string
  lastUpdated: Date
}

/**
 * 权限检查器接口
 */
export interface PermissionChecker {
  /**
   * 检查用户是否有特定权限
   */
  hasPermission(
    userId: string,
    resource: PermissionResource,
    action: PermissionAction,
    context?: any
  ): Promise<boolean>

  /**
   * 检查用户是否有特定角色
   */
  hasRole(
    userId: string,
    role: string | string[],
    context?: any
  ): Promise<boolean>

  /**
   * 获取用户的所有权限
   */
  getUserPermissions(userId: string, tenantId?: string): Promise<ResourcePermissions>

  /**
   * 获取用户的所有角色
   */
  getUserRoles(userId: string, tenantId?: string): Promise<string[]>
}

/**
 * 权限管理器接口
 */
export interface PermissionManager {
  /**
   * 创建角色
   */
  createRole(role: Omit<Role, 'id'>): Promise<Role>

  /**
   * 更新角色
   */
  updateRole(id: string, updates: Partial<Role>): Promise<Role>

  /**
   * 删除角色
   */
  deleteRole(id: string): Promise<void>

  /**
   * 给用户分配角色
   */
  assignRole(userId: string, roleId: string, tenantId?: string): Promise<void>

  /**
   * 移除用户角色
   */
  removeRole(userId: string, roleId: string, tenantId?: string): Promise<void>

  /**
   * 给用户分配权限
   */
  grantPermission(
    userId: string,
    resource: PermissionResource,
    action: PermissionAction,
    tenantId?: string
  ): Promise<void>

  /**
   * 移除用户权限
   */
  revokePermission(
    userId: string,
    resource: PermissionResource,
    action: PermissionAction,
    tenantId?: string
  ): Promise<void>
}

/**
 * 多租户权限上下文
 */
export interface TenantPermissionContext {
  tenantId: string
  userId: string
  roles: string[]
  permissions: string[]
  inheritGlobalRoles?: boolean
}

/**
 * 部门信息
 */
export interface Department {
  id: string
  name: string
  parentId?: string  // 上级部门
  path: string       // 部门路径，如 "/company/tech/backend"
  level: number      // 部门层级
  managerId?: string // 部门负责人
  metadata?: Record<string, any>
}

/**
 * 层级权限配置
 */
export interface HierarchicalPermissionConfig {
  /** 是否启用层级权限 */
  enabled: boolean
  /** 上级可以查看下级数据 */
  superiorCanViewSubordinate?: boolean
  /** 上级可以管理下级数据 */
  superiorCanManageSubordinate?: boolean
  /** 部门负责人权限 */
  departmentManagerPermissions?: string[]
  /** 跨部门权限检查函数 */
  crossDepartmentCheck?: (
    user: AuthUser,
    targetUser: AuthUser,
    action: string
  ) => boolean | Promise<boolean>
}

/**
 * 用户部门关系
 */
export interface UserDepartment {
  userId: string
  departmentId: string
  position?: string      // 职位
  isManager?: boolean    // 是否为部门负责人
  level?: number         // 在部门中的层级
  reportTo?: string      // 直接上级用户ID
  joinedAt: Date
  leftAt?: Date
}

/**
 * 层级权限检查上下文
 */
export interface HierarchicalPermissionContext {
  user: {
    id: string
    departments: UserDepartment[]
    roles: string[]
  }
  target: {
    id: string
    departments: UserDepartment[]
  }
  action: string
  resource: string
}

/**
 * 层级权限检查器
 */
export interface HierarchicalPermissionChecker {
  /**
   * 检查用户是否可以访问目标用户的数据
   */
  canAccessUser(
    userId: string,
    targetUserId: string,
    action: string
  ): Promise<boolean>

  /**
   * 检查用户是否可以访问部门数据
   */
  canAccessDepartment(
    userId: string,
    departmentId: string,
    action: string
  ): Promise<boolean>

  /**
   * 获取用户可以访问的下级用户列表
   */
  getAccessibleSubordinates(userId: string): Promise<string[]>

  /**
   * 获取用户可以访问的部门列表
   */
  getAccessibleDepartments(userId: string): Promise<string[]>

  /**
   * 检查用户是否为另一用户的上级
   */
  isSuperior(userId: string, targetUserId: string): Promise<boolean>
}
