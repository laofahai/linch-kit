/**
 * Auth Core Schema 生成器集成
 *
 * 临时简化版本：避免导入 Schema 包，解决 DTS 构建超时问题
 * TODO: 在 Schema 包 DTS 构建性能优化完成后，恢复完整功能
 */

// 临时类型定义，替代 Schema 包的 Entity 类型
interface SimpleEntity {
  name: string
  schema: any
  config?: any
}

import {
  UltraMinimalAuthKit,
} from '../schemas/user-ultra-minimal'

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
 * 生成认证实体（临时简化版本）
 */
export function generateAuthEntities(options: AuthEntityGeneratorOptions): SimpleEntity[] {
  const { kit } = options

  let entities: SimpleEntity[] = []

  // 临时简化：只支持基础套件
  switch (kit) {
    case 'basic':
    case 'standard':
    case 'enterprise':
    case 'multi-tenant':
      entities = Object.values(UltraMinimalAuthKit)
      break
  }

  return entities
}

/**
 * 生成权限系统（临时简化版本）
 */
export function generatePermissionSystem(options: PermissionSystemGeneratorOptions): {
  entities: SimpleEntity[]
  config: Record<string, any>
} {
  const { strategy, includeHierarchical, includeMultiTenant, defaultRoles } = options

  const entities: SimpleEntity[] = []
  const config: Record<string, any> = {
    strategy,
    includeHierarchical,
    includeMultiTenant
  }

  // 临时简化：只返回基础配置
  if (defaultRoles) {
    config.defaultRoles = defaultRoles
  }

  return { entities, config }
}

/**
 * 生成多租户支持（临时简化版本）
 */
export function generateMultiTenant(): {
  entities: SimpleEntity[]
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
