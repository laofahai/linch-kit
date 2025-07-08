/**
 * @linch-kit/auth 权限服务
 * 管理权限、角色和用户角色分配
 */

import type { Role, Permission, PermissionContext } from '../types'

/**
 * 权限服务接口
 */
export interface IPermissionService {
  // 角色管理
  createRole(data: Partial<Role>): Promise<Role>
  updateRole(roleId: string, data: Partial<Role>): Promise<Role>
  deleteRole(roleId: string): Promise<boolean>
  getRole(roleId: string): Promise<Role | null>
  getRoles(filter?: { tenantId?: string }): Promise<Role[]>
  getRoleHierarchy(roleId: string): Promise<Role[]>

  // 权限管理
  createPermission(data: Partial<Permission>): Promise<Permission>
  updatePermission(permissionId: string, data: Partial<Permission>): Promise<Permission>
  deletePermission(permissionId: string): Promise<boolean>
  getPermission(permissionId: string): Promise<Permission | null>
  getPermissions(filter?: { action?: string; subject?: string }): Promise<Permission[]>

  // 角色权限分配
  assignPermissionToRole(
    roleId: string,
    permissionId: string,
    overrides?: {
      conditions?: Record<string, unknown>
      allowedFields?: string[]
      deniedFields?: string[]
    }
  ): Promise<boolean>
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>
  getRolePermissions(roleId: string, includeInherited?: boolean): Promise<Permission[]>

  // 用户角色分配
  assignRoleToUser(
    userId: string,
    roleId: string,
    options?: {
      scope?: string
      scopeType?: string
      validFrom?: Date
      validTo?: Date
    }
  ): Promise<boolean>
  removeRoleFromUser(userId: string, roleId: string, scope?: string): Promise<boolean>
  getUserRoles(userId: string, includeInherited?: boolean): Promise<Role[]>
  getUserEffectivePermissions(userId: string, context?: PermissionContext): Promise<Permission[]>

  // 资源权限
  setResourcePermission(
    resourceType: string,
    resourceId: string,
    principal: { userId?: string; roleId?: string },
    actions: string[],
    conditions?: Record<string, unknown>
  ): Promise<boolean>
  getResourcePermissions(
    resourceType: string,
    resourceId: string
  ): Promise<
    Array<{
      userId?: string
      roleId?: string
      actions: string[]
      conditions?: Record<string, unknown>
    }>
  >

  // 缓存管理
  invalidateUserPermissionCache(userId: string): Promise<void>
  invalidateRolePermissionCache(roleId: string): Promise<void>
}

/**
 * 权限服务基础实现
 * 注意：这是一个抽象实现，具体的数据库操作需要在应用层实现
 */
export abstract class BasePermissionService implements IPermissionService {
  // 抽象方法 - 需要在具体实现中提供
  protected abstract prisma: any // Prisma 客户端实例

  // 角色管理实现
  async createRole(data: Partial<Role>): Promise<Role> {
    return await this.prisma.role.create({
      data: {
        name: data.name!,
        description: data.description,
        parentRoleId: data.parentRoleId,
        isSystemRole: data.isSystemRole || false,
        tenantId: data.tenantId,
      },
    })
  }

  async updateRole(roleId: string, data: Partial<Role>): Promise<Role> {
    return await this.prisma.role.update({
      where: { id: roleId },
      data,
    })
  }

  async deleteRole(roleId: string): Promise<boolean> {
    try {
      await this.prisma.role.delete({
        where: { id: roleId },
      })
      return true
    } catch {
      return false
    }
  }

  async getRole(roleId: string): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { id: roleId },
    })
  }

  async getRoles(filter?: { tenantId?: string }): Promise<Role[]> {
    return await this.prisma.role.findMany({
      where: filter,
    })
  }

  async getRoleHierarchy(roleId: string): Promise<Role[]> {
    const hierarchy: Role[] = []
    let currentRole = await this.getRole(roleId)

    while (currentRole) {
      hierarchy.push(currentRole)
      if (currentRole.parentRoleId) {
        currentRole = await this.getRole(currentRole.parentRoleId)
      } else {
        break
      }
    }

    return hierarchy
  }

  // 权限管理实现
  async createPermission(data: Partial<Permission>): Promise<Permission> {
    return await this.prisma.permission.create({
      data: {
        name: data.name!,
        action: data.action!,
        subject: data.subject!,
        conditions: data.conditions ? JSON.stringify(data.conditions) : null,
        allowedFields: data.allowedFields || [],
        deniedFields: data.deniedFields || [],
        description: data.description,
        isSystemPermission: data.isSystemPermission || false,
      },
    })
  }

  async updatePermission(permissionId: string, data: Partial<Permission>): Promise<Permission> {
    const updateData: any = { ...data }
    if (data.conditions) {
      updateData.conditions = JSON.stringify(data.conditions)
    }

    return await this.prisma.permission.update({
      where: { id: permissionId },
      data: updateData,
    })
  }

  async deletePermission(permissionId: string): Promise<boolean> {
    try {
      await this.prisma.permission.delete({
        where: { id: permissionId },
      })
      return true
    } catch {
      return false
    }
  }

  async getPermission(permissionId: string): Promise<Permission | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    })

    if (permission && permission.conditions) {
      permission.conditions = JSON.parse(permission.conditions)
    }

    return permission
  }

  async getPermissions(filter?: { action?: string; subject?: string }): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: filter,
    })

    return permissions.map((p: any) => ({
      ...p,
      conditions: p.conditions ? JSON.parse(p.conditions) : undefined,
    }))
  }

  // 角色权限分配实现
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    overrides?: {
      conditions?: Record<string, unknown>
      allowedFields?: string[]
      deniedFields?: string[]
    }
  ): Promise<boolean> {
    try {
      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
          overrideConditions: overrides?.conditions ? JSON.stringify(overrides.conditions) : null,
          overrideAllowedFields: overrides?.allowedFields || [],
          overrideDeniedFields: overrides?.deniedFields || [],
        },
      })

      await this.invalidateRolePermissionCache(roleId)
      return true
    } catch {
      return false
    }
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    try {
      await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      })

      await this.invalidateRolePermissionCache(roleId)
      return true
    } catch {
      return false
    }
  }

  async getRolePermissions(roleId: string, includeInherited = true): Promise<Permission[]> {
    // 获取直接权限
    const directPermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    })

    const permissions = directPermissions.map((rp: any) => ({
      ...rp.permission,
      conditions: rp.permission.conditions ? JSON.parse(rp.permission.conditions) : undefined,
      // 应用覆盖
      ...(rp.overrideConditions && {
        conditions: JSON.parse(rp.overrideConditions),
      }),
      ...(rp.overrideAllowedFields.length > 0 && {
        allowedFields: rp.overrideAllowedFields,
      }),
      ...(rp.overrideDeniedFields.length > 0 && {
        deniedFields: rp.overrideDeniedFields,
      }),
    }))

    // 获取继承的权限
    if (includeInherited) {
      const role = await this.getRole(roleId)
      if (role?.parentRoleId) {
        const parentPermissions = await this.getRolePermissions(role.parentRoleId, true)

        // 合并权限，子角色权限优先
        const permissionMap = new Map<string, Permission>()

        parentPermissions.forEach(p => {
          permissionMap.set(p.id, p)
        })

        permissions.forEach((p: Permission) => {
          permissionMap.set(p.id, p)
        })

        return Array.from(permissionMap.values())
      }
    }

    return permissions
  }

  // 用户角色分配实现
  async assignRoleToUser(
    userId: string,
    roleId: string,
    options?: {
      scope?: string
      scopeType?: string
      validFrom?: Date
      validTo?: Date
    }
  ): Promise<boolean> {
    try {
      await this.prisma.userRoleAssignment.create({
        data: {
          userId,
          roleId,
          scope: options?.scope,
          scopeType: options?.scopeType,
          validFrom: options?.validFrom || new Date(),
          validTo: options?.validTo,
        },
      })

      await this.invalidateUserPermissionCache(userId)
      return true
    } catch {
      return false
    }
  }

  async removeRoleFromUser(userId: string, roleId: string, scope?: string): Promise<boolean> {
    try {
      const where: any = { userId, roleId }
      if (scope !== undefined) {
        where.scope = scope
      }

      await this.prisma.userRoleAssignment.deleteMany({ where })

      await this.invalidateUserPermissionCache(userId)
      return true
    } catch {
      return false
    }
  }

  async getUserRoles(userId: string, includeInherited = true): Promise<Role[]> {
    const now = new Date()

    // 获取有效的角色分配
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: { role: true },
    })

    const directRoles = assignments.map((a: any) => a.role)

    if (!includeInherited) {
      return directRoles
    }

    // 获取继承的角色
    const allRoles = new Map<string, Role>()

    for (const role of directRoles) {
      allRoles.set(role.id, role)

      const hierarchy = await this.getRoleHierarchy(role.id)
      hierarchy.forEach(r => allRoles.set(r.id, r))
    }

    return Array.from(allRoles.values())
  }

  async getUserEffectivePermissions(
    userId: string,
    _context?: PermissionContext
  ): Promise<Permission[]> {
    // 获取用户的所有角色
    const roles = await this.getUserRoles(userId, true)

    // 收集所有权限
    const permissionMap = new Map<string, Permission>()

    for (const role of roles) {
      const rolePermissions = await this.getRolePermissions(role.id, false)

      rolePermissions.forEach(p => {
        // 如果已存在相同权限，合并字段权限
        if (permissionMap.has(p.id)) {
          const existing = permissionMap.get(p.id)!

          // 合并允许的字段
          const allowedFields = new Set([
            ...(existing.allowedFields || []),
            ...(p.allowedFields || []),
          ])

          // 合并拒绝的字段（拒绝优先）
          const deniedFields = new Set([
            ...(existing.deniedFields || []),
            ...(p.deniedFields || []),
          ])

          permissionMap.set(p.id, {
            ...p,
            allowedFields: Array.from(allowedFields),
            deniedFields: Array.from(deniedFields),
          })
        } else {
          permissionMap.set(p.id, p)
        }
      })
    }

    // 获取直接分配给用户的资源权限
    const userResourcePermissions = await this.prisma.resourcePermission.findMany({
      where: { userId },
    })

    // 将资源权限转换为权限对象
    userResourcePermissions.forEach((rp: any) => {
      const permissionId = `resource_${rp.id}`
      permissionMap.set(permissionId, {
        id: permissionId,
        name: `Resource permission for ${rp.resourceType}#${rp.resourceId}`,
        action: rp.actions.join(','),
        subject: rp.resourceType,
        conditions: rp.conditions ? JSON.parse(rp.conditions) : undefined,
        isSystemPermission: false,
        createdAt: rp.createdAt,
        updatedAt: rp.updatedAt,
      } as Permission)
    })

    return Array.from(permissionMap.values())
  }

  // 资源权限实现
  async setResourcePermission(
    resourceType: string,
    resourceId: string,
    principal: { userId?: string; roleId?: string },
    actions: string[],
    conditions?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      await this.prisma.resourcePermission.upsert({
        where: {
          resourceType_resourceId_userId_roleId: {
            resourceType,
            resourceId,
            userId: principal.userId || null,
            roleId: principal.roleId || null,
          },
        },
        update: {
          actions,
          conditions: conditions ? JSON.stringify(conditions) : null,
        },
        create: {
          resourceType,
          resourceId,
          userId: principal.userId,
          roleId: principal.roleId,
          actions,
          conditions: conditions ? JSON.stringify(conditions) : null,
        },
      })

      if (principal.userId) {
        await this.invalidateUserPermissionCache(principal.userId)
      }

      return true
    } catch {
      return false
    }
  }

  async getResourcePermissions(
    resourceType: string,
    resourceId: string
  ): Promise<
    Array<{
      userId?: string
      roleId?: string
      actions: string[]
      conditions?: Record<string, unknown>
    }>
  > {
    const permissions = await this.prisma.resourcePermission.findMany({
      where: {
        resourceType,
        resourceId,
      },
    })

    return permissions.map((p: any) => ({
      userId: p.userId,
      roleId: p.roleId,
      actions: p.actions,
      conditions: p.conditions ? JSON.parse(p.conditions) : undefined,
    }))
  }

  // 缓存管理实现
  async invalidateUserPermissionCache(userId: string): Promise<void> {
    await this.prisma.permissionCache.deleteMany({
      where: { userId },
    })
  }

  async invalidateRolePermissionCache(roleId: string): Promise<void> {
    // 获取所有拥有该角色的用户
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { roleId },
      select: { userId: true },
    })

    const userIds = [...new Set(assignments.map((a: any) => a.userId))]

    // 清除这些用户的缓存
    await this.prisma.permissionCache.deleteMany({
      where: {
        userId: { in: userIds },
      },
    })
  }
}

/**
 * 创建权限服务的工厂函数
 * 注意：需要在应用层提供具体实现
 */
export function createPermissionService(prisma: any): IPermissionService {
  class PermissionService extends BasePermissionService {
    protected prisma = prisma
  }

  return new PermissionService()
}
