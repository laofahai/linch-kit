/**
 * 用户相关类型定义
 */

/**
 * 基础用户信息
 */
export interface BaseUser {
  id: string
  email?: string
  name?: string
  image?: string
}

/**
 * 用户角色
 */
export interface UserRole {
  id: string
  name: string
  description?: string
  permissions: string[]
}

/**
 * 用户权限
 */
export interface UserPermission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

/**
 * 用户会话信息
 */
export interface UserSession {
  id: string
  userId: string
  sessionToken: string
  expires: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户账户信息（OAuth）
 */
export interface UserAccount {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
  session_state?: string
}

/**
 * 多租户用户信息
 */
export interface TenantUser extends BaseUser {
  tenantId: string
  tenantRole?: string
  tenantPermissions?: string[]
}

/**
 * 用户配置文件
 */
export interface UserProfile {
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  phone?: string
  timezone?: string
  locale?: string
  preferences?: Record<string, any>
}

/**
 * 企业用户扩展
 */
export interface EnterpriseUser extends BaseUser {
  employeeId?: string
  department?: string
  manager?: string
  jobTitle?: string
  startDate?: Date
  status: 'active' | 'inactive' | 'suspended'
}

/**
 * 用户创建输入
 */
export interface CreateUserInput {
  email: string
  name?: string
  password?: string
  roles?: string[]
  profile?: Partial<UserProfile>
  tenantId?: string
}

/**
 * 用户更新输入
 */
export interface UpdateUserInput {
  name?: string
  email?: string
  roles?: string[]
  profile?: Partial<UserProfile>
  status?: string
}

/**
 * 用户查询过滤器
 */
export interface UserFilter {
  email?: string
  name?: string
  roles?: string[]
  tenantId?: string
  status?: string
  createdAfter?: Date
  createdBefore?: Date
}

/**
 * 用户排序选项
 */
export interface UserSort {
  field: 'name' | 'email' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

/**
 * 分页用户结果
 */
export interface PaginatedUsers {
  users: BaseUser[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}
