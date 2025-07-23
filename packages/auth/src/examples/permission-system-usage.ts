/**
 * @linch-kit/auth 权限系统使用示例
 * 演示如何使用完整的权限管理功能
 */

import { PrismaClient } from '@prisma/client'

import { createDatabasePermissionAdapter } from '../adapters/database-permission-adapter'
import { createEnhancedPermissionEngineV2 } from '../permissions/enhanced-permission-engine-v2'
import { createPermissionService } from '../services/permission.service'
import type { LinchKitUser } from '../types'

// ============================================================================
// 1. 系统初始化
// ============================================================================

/**
 * 初始化权限系统
 */
export async function initializePermissionSystem() {
  // 1. 创建数据库客户端
  const prisma = new PrismaClient()

  // 2. 创建数据库适配器
  const databaseAdapter = createDatabasePermissionAdapter(prisma)

  // 3. 创建增强权限引擎
  const permissionEngine = createEnhancedPermissionEngineV2(databaseAdapter, {
    enableCache: true,
    cacheTTL: 5 * 60 * 1000, // 5分钟缓存
    roleHierarchyEnabled: true,
  })

  // 4. 创建权限服务
  const permissionService = createPermissionService(prisma)

  return {
    prisma,
    permissionEngine,
    permissionService,
  }
}

// ============================================================================
// 2. 基础权限管理
// ============================================================================

/**
 * 创建系统角色和权限
 */
export async function setupSystemRolesAndPermissions(permissionService: any) {
  // 创建基础权限
  const permissions = [
    {
      name: 'Read Users',
      action: 'read',
      subject: 'User',
      description: '查看用户信息',
      isSystemPermission: true,
    },
    {
      name: 'Manage Users',
      action: 'manage',
      subject: 'User',
      description: '管理用户（包括创建、更新、删除）',
      allowedFields: ['name', 'email', 'avatar'],
      deniedFields: ['password', 'secretKey'],
      isSystemPermission: true,
    },
    {
      name: 'Read Projects',
      action: 'read',
      subject: 'Project',
      description: '查看项目信息',
      conditions: { status: 'active' }, // 只能查看活跃项目
    },
    {
      name: 'Manage Own Projects',
      action: 'manage',
      subject: 'Project',
      description: '管理自己的项目',
      conditions: { ownedBy: 'user' },
    },
  ]

  const createdPermissions = []
  for (const permission of permissions) {
    const created = await permissionService.createPermission(permission)
    createdPermissions.push(created)
  }

  // 创建角色层次结构
  const roles = [
    {
      name: 'guest',
      description: '访客角色',
      isSystemRole: true,
    },
    {
      name: 'user',
      description: '普通用户',
      parentRoleId: null, // guest角色ID将在创建后设置
      isSystemRole: true,
    },
    {
      name: 'project_manager',
      description: '项目经理',
      parentRoleId: null, // user角色ID将在创建后设置
      isSystemRole: true,
    },
    {
      name: 'admin',
      description: '管理员',
      parentRoleId: null, // project_manager角色ID将在创建后设置
      isSystemRole: true,
    },
    {
      name: 'super_admin',
      description: '超级管理员',
      parentRoleId: null, // admin角色ID将在创建后设置
      isSystemRole: true,
    },
  ]

  const createdRoles = []
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i]
    if (i > 0) {
      role.parentRoleId = createdRoles[i - 1].id // 设置父角色
    }
    const created = await permissionService.createRole(role)
    createdRoles.push(created)
  }

  // 分配权限给角色
  const rolePermissionMappings = [
    { role: 'guest', permissions: [] }, // 访客无权限
    { role: 'user', permissions: ['Read Projects'] },
    { role: 'project_manager', permissions: ['Manage Own Projects'] },
    { role: 'admin', permissions: ['Read Users', 'Manage Own Projects'] },
    { role: 'super_admin', permissions: ['Manage Users'] },
  ]

  for (const mapping of rolePermissionMappings) {
    const role = createdRoles.find(r => r.name === mapping.role)
    for (const permissionName of mapping.permissions) {
      const permission = createdPermissions.find(p => p.name === permissionName)
      if (role && permission) {
        await permissionService.assignPermissionToRole(role.id, permission.id)
      }
    }
  }

  return { roles: createdRoles, permissions: createdPermissions }
}

// ============================================================================
// 3. 用户权限分配
// ============================================================================

/**
 * 为用户分配角色
 */
export async function assignUserRoles(permissionService: any) {
  // 示例：分配角色给用户
  await permissionService.assignRoleToUser('user1', 'project_manager_role_id', {
    scope: 'project:123',
    scopeType: 'project',
    validFrom: new Date(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天有效期
  })

  // 分配管理员角色（无作用域限制）
  await permissionService.assignRoleToUser('user2', 'admin_role_id')

  // 临时权限分配
  await permissionService.assignRoleToUser('user3', 'super_admin_role_id', {
    validFrom: new Date(),
    validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天临时管理员
  })
}

// ============================================================================
// 4. 权限检查示例
// ============================================================================

/**
 * 权限检查示例
 */
export async function demonstratePermissionChecks(permissionEngine: any) {
  const user: LinchKitUser = {
    id: 'user1',
    email: 'user@example.com',
    name: 'Test User',
  }

  // 1. 基础权限检查
  const canReadUsers = await permissionEngine.check(user, 'read', 'User')
  console.log('Can read users:', canReadUsers)

  // 2. 增强权限检查（包含字段权限）
  const enhancedResult = await permissionEngine.checkEnhanced(
    user,
    'read',
    'User',
    { tenantId: 'tenant1' }
  )
  console.log('Enhanced permission result:', enhancedResult)

  // 3. 字段过滤示例
  const userData = {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret',
    salary: 100000,
    department: 'Engineering',
  }

  const filteredData = await permissionEngine.filterObjectFields(user, userData)
  console.log('Filtered user data:', filteredData)

  // 4. 批量资源过滤
  const projects = [
    { id: '1', name: 'Project A', status: 'active', userId: 'user1' },
    { id: '2', name: 'Project B', status: 'inactive', userId: 'user2' },
    { id: '3', name: 'Project C', status: 'active', userId: 'user1' },
  ]

  const accessibleProjects = await permissionEngine.filterResources(
    user,
    projects,
    'read'
  )
  console.log('Accessible projects:', accessibleProjects)

  // 5. 获取数据库查询条件
  const queryConditions = await permissionEngine.getAccessibleResourceQuery(
    user,
    'read',
    'Project',
    { tenantId: 'tenant1' }
  )
  console.log('Database query conditions:', queryConditions)
}

// ============================================================================
// 5. 资源级权限管理
// ============================================================================

/**
 * 资源级权限示例
 */
export async function demonstrateResourcePermissions(permissionService: any) {
  // 1. 为特定项目设置权限
  await permissionService.setResourcePermission(
    'Project',
    'project123',
    { userId: 'user1' },
    ['read', 'update'],
    { fields: ['name', 'description'] } // 只能访问特定字段
  )

  // 2. 为角色设置资源权限
  await permissionService.setResourcePermission(
    'Project',
    'project123',
    { roleId: 'project_manager_role_id' },
    ['read', 'update', 'delete'],
    { 
      departmentId: 'engineering',
      priority: { gte: 'medium' }
    }
  )

  // 3. 查询资源权限
  const resourcePermissions = await permissionService.getResourcePermissions(
    'Project',
    'project123'
  )
  console.log('Resource permissions:', resourcePermissions)
}

// ============================================================================
// 6. 权限缓存管理
// ============================================================================

/**
 * 权限缓存管理示例
 */
export async function demonstrateCacheManagement(
  permissionEngine: any,
  permissionService: any
) {
  const userId = 'user1'
  const roleId = 'project_manager_role_id'

  // 1. 清除用户权限缓存（当用户角色变更时）
  await permissionEngine.invalidateUserCache(userId)
  await permissionService.invalidateUserPermissionCache(userId)

  // 2. 清除角色权限缓存（当角色权限变更时）
  await permissionEngine.invalidateRoleCache(roleId)
  await permissionService.invalidateRolePermissionCache(roleId)

  console.log('Permission caches cleared')
}

// ============================================================================
// 7. 完整使用示例
// ============================================================================

/**
 * 完整权限系统使用示例
 */
export async function fullPermissionSystemDemo() {
  try {
    console.log('🚀 Initializing permission system...')
    const { permissionEngine, permissionService } = await initializePermissionSystem()

    console.log('📋 Setting up roles and permissions...')
    await setupSystemRolesAndPermissions(permissionService)

    console.log('👥 Assigning user roles...')
    await assignUserRoles(permissionService)

    console.log('🔍 Demonstrating permission checks...')
    await demonstratePermissionChecks(permissionEngine)

    console.log('🔒 Demonstrating resource permissions...')
    await demonstrateResourcePermissions(permissionService)

    console.log('💾 Demonstrating cache management...')
    await demonstrateCacheManagement(permissionEngine, permissionService)

    console.log('✅ Permission system demo completed successfully!')

  } catch (error) {
    console.error('❌ Permission system demo failed:', error)
  }
}

// ============================================================================
// 8. 中间件集成示例
// ============================================================================

/**
 * Express中间件集成示例
 */
export function createPermissionMiddleware(permissionEngine: any) {
  return function requirePermission(action: string, subject: string) {
    return async (req: any, res: any, next: any) => {
      try {
        const user = req.user // 假设用户信息已通过认证中间件获取
        if (!user) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const hasPermission = await permissionEngine.check(user, action, subject, {
          tenantId: req.headers['x-tenant-id'],
          scope: req.params.scope,
        })

        if (!hasPermission) {
          return res.status(403).json({ error: 'Permission denied' })
        }

        // 将权限信息附加到请求对象
        req.permissions = await permissionEngine.checkEnhanced(user, action, subject)
        next()

      } catch {
        res.status(500).json({ error: 'Permission check failed' })
      }
    }
  }
}

/**
 * tRPC权限装饰器示例
 */
export function requirePermission(action: string, subject: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const ctx = this // tRPC context
      const user = ctx.user

      if (!user) {
        throw new Error('Authentication required')
      }

      const hasPermission = await ctx.permissionEngine.check(user, action, subject, {
        tenantId: ctx.tenantId,
      })

      if (!hasPermission) {
        throw new Error('Permission denied')
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// 运行示例（仅在直接执行时运行）
if (require.main === module) {
  fullPermissionSystemDemo()
}