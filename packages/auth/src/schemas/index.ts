/**
 * Auth Core 实体模板
 * 
 * 提供可选的实体模板，用户可以选择使用或完全自定义
 */

// 导入所有模板
import {
  MinimalUserTemplate,
  BasicUserTemplate,
  EnterpriseUserTemplate,
  MultiTenantUserTemplate
} from './user'

import {
  SessionTemplate,
  ExtendedSessionTemplate,
  AccountTemplate
} from './session'

import {
  RoleTemplate,
  PermissionTemplate,
  UserRoleTemplate,
  DepartmentTemplate,
  UserDepartmentTemplate,
  TenantTemplate
} from './permissions'

import {
  SimplifiedUserTemplate,
  SimplifiedRoleTemplate,
  SimplifiedDepartmentTemplate
} from './simplified'

import {
  ProductTemplate,
  ProductCategoryTemplate
} from './product'

// 重新导出所有模板
export {
  // 用户模板
  MinimalUserTemplate,
  BasicUserTemplate,
  EnterpriseUserTemplate,
  MultiTenantUserTemplate,
  // 会话模板
  SessionTemplate,
  ExtendedSessionTemplate,
  AccountTemplate,
  // 权限模板
  RoleTemplate,
  PermissionTemplate,
  UserRoleTemplate,
  DepartmentTemplate,
  UserDepartmentTemplate,
  TenantTemplate,
  // 简化模板（JSON 优先架构）
  SimplifiedUserTemplate,
  SimplifiedRoleTemplate,
  SimplifiedDepartmentTemplate,
  // 产品模板
  ProductTemplate,
  ProductCategoryTemplate
}

/**
 * 预设的实体组合
 */

// 基础认证套件（最小化）
export const BasicAuthKit = {
  User: MinimalUserTemplate,
  Session: SessionTemplate
}

// 标准认证套件
export const StandardAuthKit = {
  User: BasicUserTemplate,
  Session: SessionTemplate,
  Account: AccountTemplate
}

// 企业认证套件（包含部门权限）
export const EnterpriseAuthKit = {
  User: EnterpriseUserTemplate,
  Session: ExtendedSessionTemplate,
  Account: AccountTemplate,
  Role: RoleTemplate,
  Permission: PermissionTemplate,
  UserRole: UserRoleTemplate,
  Department: DepartmentTemplate,
  UserDepartment: UserDepartmentTemplate
}

// 多租户认证套件
export const MultiTenantAuthKit = {
  User: MultiTenantUserTemplate,
  Session: ExtendedSessionTemplate,
  Account: AccountTemplate,
  Role: RoleTemplate,
  Permission: PermissionTemplate,
  UserRole: UserRoleTemplate,
  Department: DepartmentTemplate,
  UserDepartment: UserDepartmentTemplate,
  Tenant: TenantTemplate
}

// 简化认证套件（JSON 优先，减少关联表）
export const SimplifiedAuthKit = {
  User: SimplifiedUserTemplate,
  Session: ExtendedSessionTemplate,
  Account: AccountTemplate,
  Role: SimplifiedRoleTemplate,
  Permission: PermissionTemplate,
  Department: SimplifiedDepartmentTemplate,
  Tenant: TenantTemplate
}

/**
 * 实体模板类型
 */
export type AuthEntityTemplate = 
  | typeof MinimalUserTemplate
  | typeof BasicUserTemplate
  | typeof EnterpriseUserTemplate
  | typeof MultiTenantUserTemplate
  | typeof SessionTemplate
  | typeof ExtendedSessionTemplate
  | typeof AccountTemplate
  | typeof RoleTemplate
  | typeof PermissionTemplate
  | typeof UserRoleTemplate
  | typeof TenantTemplate

/**
 * 认证套件类型
 */
export type AuthKit = 
  | typeof BasicAuthKit
  | typeof StandardAuthKit
  | typeof EnterpriseAuthKit
  | typeof MultiTenantAuthKit
