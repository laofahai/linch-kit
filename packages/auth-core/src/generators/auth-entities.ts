/**
 * Auth Core Schema 生成器集成
 * 
 * 与 @linch-kit/schema 的命令生成器集成
 */

import type { Entity } from '@linch-kit/schema'
import {
  BasicAuthKit,
  StandardAuthKit,
  EnterpriseAuthKit,
  MultiTenantAuthKit
} from '../schemas'

/**
 * 认证实体生成选项
 */
export interface AuthEntityGeneratorOptions {
  /** 认证套件类型 */
  kit: 'basic' | 'standard' | 'enterprise' | 'multi-tenant'
  /** 是否包含用户字段自定义 */
  includeUserFields?: string[]
  /** 是否包含角色权限 */
  includeRoles?: boolean
  /** 是否包含部门权限 */
  includeDepartments?: boolean
  /** 是否包含多租户 */
  includeTenants?: boolean
  /** 输出目录 */
  outputDir?: string
}

/**
 * 权限系统生成选项
 */
export interface PermissionSystemGeneratorOptions {
  /** 权限策略 */
  strategy: 'rbac' | 'abac' | 'hybrid'
  /** 是否包含层级权限 */
  includeHierarchical?: boolean
  /** 是否包含多租户权限 */
  includeMultiTenant?: boolean
  /** 预设角色 */
  defaultRoles?: Array<{
    name: string
    permissions: string[]
  }>
  /** 输出目录 */
  outputDir?: string
}

/**
 * 生成认证实体
 */
export function generateAuthEntities(options: AuthEntityGeneratorOptions): Entity[] {
  const { kit, includeUserFields, includeRoles, includeDepartments, includeTenants } = options

  let entities: Entity[] = []

  // 根据套件类型选择基础实体
  switch (kit) {
    case 'basic':
      entities = Object.values(BasicAuthKit)
      break
    case 'standard':
      entities = Object.values(StandardAuthKit)
      break
    case 'enterprise':
      entities = Object.values(EnterpriseAuthKit)
      break
    case 'multi-tenant':
      entities = Object.values(MultiTenantAuthKit)
      break
  }

  // 根据选项过滤实体
  if (!includeRoles) {
    entities = entities.filter(entity => 
      !['Role', 'Permission', 'UserRole'].includes(entity.name)
    )
  }

  if (!includeDepartments) {
    entities = entities.filter(entity => 
      !['Department', 'UserDepartment'].includes(entity.name)
    )
  }

  if (!includeTenants) {
    entities = entities.filter(entity => 
      entity.name !== 'Tenant'
    )
  }

  return entities
}

/**
 * 生成权限系统
 */
export function generatePermissionSystem(options: PermissionSystemGeneratorOptions): {
  entities: Entity[]
  config: Record<string, any>
} {
  const { strategy, includeHierarchical, includeMultiTenant, defaultRoles } = options

  const entities: Entity[] = []
  const config: Record<string, any> = {
    strategy,
    includeHierarchical,
    includeMultiTenant
  }

  // 基础权限实体
  if (strategy === 'rbac' || strategy === 'hybrid') {
    // 添加角色和权限实体
    entities.push(
      // 这里应该从 schemas 中获取，但为了避免循环依赖，先用占位符
    )
  }

  // 层级权限
  if (includeHierarchical) {
    // 添加部门相关实体
  }

  // 多租户权限
  if (includeMultiTenant) {
    // 添加租户相关实体
  }

  // 默认角色配置
  if (defaultRoles) {
    config.defaultRoles = defaultRoles
  }

  return { entities, config }
}

/**
 * 生成多租户支持
 */
export function generateMultiTenant(): {
  entities: Entity[]
  config: Record<string, any>
} {
  return {
    entities: [], // 租户相关实体
    config: {
      multiTenant: {
        enabled: true,
        tenantResolver: 'subdomain', // 或 'domain', 'header', 'custom'
        tenantField: 'tenantId'
      }
    }
  }
}

/**
 * CLI 命令生成器
 */
export const authGenerators = {
  /**
   * 生成基础认证
   * npx linch-schema generate:auth --kit=basic
   */
  'generate:auth': generateAuthEntities,

  /**
   * 生成权限系统
   * npx linch-schema generate:permissions --strategy=rbac --hierarchical
   */
  'generate:permissions': generatePermissionSystem,

  /**
   * 生成多租户支持
   * npx linch-schema generate:multi-tenant
   */
  'generate:multi-tenant': generateMultiTenant
}

/**
 * 预设配置
 */
export const authPresets = {
  /** 简单博客系统 */
  blog: {
    kit: 'standard' as const,
    includeRoles: true,
    includeDepartments: false,
    includeTenants: false
  },

  /** 企业管理系统 */
  enterprise: {
    kit: 'enterprise' as const,
    includeRoles: true,
    includeDepartments: true,
    includeTenants: false
  },

  /** SaaS 平台 */
  saas: {
    kit: 'multi-tenant' as const,
    includeRoles: true,
    includeDepartments: true,
    includeTenants: true
  }
}
