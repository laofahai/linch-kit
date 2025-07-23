/**
 * @linch-kit/auth 数据库权限适配器
 * 为增强权限引擎提供数据库查询实现
 */

import type { PrismaClient } from '@prisma/client'

import type { LinchKitUser, PermissionContext } from '../types'

/**
 * 数据库权限适配器接口
 */
export interface IDatabasePermissionAdapter {
  // 用户角色查询
  getUserDirectRoles(userId: string): Promise<string[]>
  getInheritedRoles(roleIds: string[]): Promise<string[]>

  // 角色权限查询
  getRoleDirectPermissions(roleId: string): Promise<string[]>
  getParentRoles(roleId: string): Promise<string[]>

  // 字段权限查询
  getRoleFieldPermissions(
    roleId: string,
    resourceType: string
  ): Promise<{ allowed: string[]; denied: string[] }>
  getContextFieldPermissions(
    user: LinchKitUser,
    resourceType: string,
    context: PermissionContext
  ): Promise<{ allowed: string[]; denied: string[] }>

  // 权限条件查询
  getRoleConditions(roleId: string, action: string, subject: string | any): Promise<Record<string, unknown>>
  getResourceConditions(user: LinchKitUser, action: string, resource: any): Promise<Record<string, unknown>>
  getRoleResourceQuery(roleId: string, action: string, resourceType: string): Promise<Record<string, unknown>>
}

/**
 * Prisma数据库权限适配器实现
 */
export class PrismaDatabasePermissionAdapter implements IDatabasePermissionAdapter {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取用户直接分配的角色
   */
  async getUserDirectRoles(userId: string): Promise<string[]> {
    const now = new Date()
    
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        validFrom: { lte: now },
        OR: [
          { validTo: null },
          { validTo: { gte: now } }
        ],
      },
      select: { roleId: true },
    })

    return assignments.map(a => a.roleId)
  }

  /**
   * 获取角色继承的所有角色
   */
  async getInheritedRoles(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return []

    const inheritedRoles = new Set<string>()
    const processedRoles = new Set<string>()

    // 递归查找继承角色
    const findInheritedRoles = async (currentRoleIds: string[]) => {
      const rolesToProcess = currentRoleIds.filter(id => !processedRoles.has(id))
      if (rolesToProcess.length === 0) return

      // 标记为已处理
      rolesToProcess.forEach(id => processedRoles.add(id))

      // 查询这些角色的父角色
      const roles = await this.prisma.role.findMany({
        where: { id: { in: rolesToProcess } },
        select: { id: true, parentRoleId: true, inherits: true },
      })

      const parentRoleIds: string[] = []

      for (const role of roles) {
        // 添加父角色
        if (role.parentRoleId) {
          inheritedRoles.add(role.parentRoleId)
          parentRoleIds.push(role.parentRoleId)
        }

        // 添加继承的角色
        if (role.inherits && Array.isArray(role.inherits)) {
          for (const inheritedRoleId of role.inherits) {
            inheritedRoles.add(inheritedRoleId)
            parentRoleIds.push(inheritedRoleId)
          }
        }
      }

      // 递归处理父角色
      if (parentRoleIds.length > 0) {
        await findInheritedRoles(parentRoleIds)
      }
    }

    await findInheritedRoles(roleIds)
    return Array.from(inheritedRoles)
  }

  /**
   * 获取角色的直接权限
   */
  async getRoleDirectPermissions(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    })

    return rolePermissions.map(rp => `${rp.permission.action}:${rp.permission.subject}`)
  }

  /**
   * 获取角色的父角色
   */
  async getParentRoles(roleId: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { parentRoleId: true, inherits: true },
    })

    if (!role) return []

    const parentRoles: string[] = []

    if (role.parentRoleId) {
      parentRoles.push(role.parentRoleId)
    }

    if (role.inherits && Array.isArray(role.inherits)) {
      parentRoles.push(...role.inherits)
    }

    return [...new Set(parentRoles)]
  }

  /**
   * 获取角色的字段权限
   */
  async getRoleFieldPermissions(
    roleId: string,
    resourceType: string
  ): Promise<{ allowed: string[]; denied: string[] }> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: { subject: resourceType },
      },
      include: { permission: true },
    })

    const allowed = new Set<string>()
    const denied = new Set<string>()

    for (const rp of rolePermissions) {
      // 使用覆盖字段（如果存在）
      const allowedFields = rp.overrideAllowedFields.length > 0 
        ? rp.overrideAllowedFields 
        : rp.permission.allowedFields || []
      
      const deniedFields = rp.overrideDeniedFields.length > 0
        ? rp.overrideDeniedFields
        : rp.permission.deniedFields || []

      allowedFields.forEach(field => allowed.add(field))
      deniedFields.forEach(field => denied.add(field))
    }

    return {
      allowed: Array.from(allowed),
      denied: Array.from(denied),
    }
  }

  /**
   * 根据上下文获取字段权限
   */
  async getContextFieldPermissions(
    user: LinchKitUser,
    resourceType: string,
    context: PermissionContext
  ): Promise<{ allowed: string[]; denied: string[] }> {
    // 查询上下文相关的权限规则
    const contextRules = await this.prisma.contextPermissionRule.findMany({
      where: {
        resourceType,
        OR: [
          { userId: user.id },
          { tenantId: context.tenantId },
          { scope: context.scope },
        ],
      },
    })

    const allowed = new Set<string>()
    const denied = new Set<string>()

    for (const rule of contextRules) {
      if (rule.allowedFields) {
        rule.allowedFields.forEach((field: string) => allowed.add(field))
      }
      if (rule.deniedFields) {
        rule.deniedFields.forEach((field: string) => denied.add(field))
      }
    }

    return {
      allowed: Array.from(allowed),
      denied: Array.from(denied),
    }
  }

  /**
   * 获取角色的权限条件
   */
  async getRoleConditions(
    roleId: string,
    action: string,
    subject: string | any
  ): Promise<Record<string, unknown>> {
    const subjectType = typeof subject === 'string' ? subject : this.getResourceType(subject)
    
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: {
          action,
          subject: subjectType,
        },
      },
      include: { permission: true },
    })

    const conditions: Record<string, unknown> = {}

    for (const rp of rolePermissions) {
      // 使用覆盖条件（如果存在）
      const permissionConditions = rp.overrideConditions 
        ? JSON.parse(rp.overrideConditions)
        : (rp.permission.conditions ? JSON.parse(rp.permission.conditions as string) : {})

      Object.assign(conditions, permissionConditions)
    }

    return conditions
  }

  /**
   * 获取资源级权限条件
   */
  async getResourceConditions(
    user: LinchKitUser,
    action: string,
    resource: any
  ): Promise<Record<string, unknown>> {
    const resourceType = this.getResourceType(resource)
    const resourceId = this.getResourceId(resource)

    if (!resourceId) return {}

    const resourcePermissions = await this.prisma.resourcePermission.findMany({
      where: {
        resourceType,
        resourceId,
        OR: [
          { userId: user.id },
          { role: { users: { some: { id: user.id } } } },
        ],
        actions: { has: action },
      },
    })

    const conditions: Record<string, unknown> = {}

    for (const rp of resourcePermissions) {
      if (rp.conditions) {
        const resourceConditions = JSON.parse(rp.conditions as string)
        Object.assign(conditions, resourceConditions)
      }
    }

    return conditions
  }

  /**
   * 获取角色的资源查询条件
   */
  async getRoleResourceQuery(
    roleId: string,
    action: string,
    resourceType: string
  ): Promise<Record<string, unknown>> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: {
          action,
          subject: resourceType,
        },
      },
      include: { permission: true },
    })

    const query: Record<string, unknown> = {}

    for (const rp of rolePermissions) {
      const conditions = rp.overrideConditions 
        ? JSON.parse(rp.overrideConditions)
        : (rp.permission.conditions ? JSON.parse(rp.permission.conditions as string) : {})

      // 转换权限条件为数据库查询条件
      if (conditions.departmentId) {
        query.departmentId = conditions.departmentId
      }

      if (conditions.ownedBy === 'user') {
        query.OR = query.OR || []
        ;(query.OR as any[]).push(
          { userId: { not: null } },
          { createdBy: { not: null } }
        )
      }

      if (conditions.status) {
        query.status = conditions.status
      }
    }

    return query
  }

  /**
   * 获取资源类型
   */
  private getResourceType(resource: any): string {
    if (typeof resource === 'string') {
      return resource
    }

    if (resource && typeof resource === 'object') {
      if (resource.constructor?.name) {
        return resource.constructor.name
      }
      if (resource._type) return resource._type
      if (resource.type) return resource.type
      if (resource.__typename) return resource.__typename
    }

    return 'unknown'
  }

  /**
   * 获取资源ID
   */
  private getResourceId(resource: any): string | null {
    if (!resource || typeof resource !== 'object') return null
    
    return resource.id || resource._id || resource.uuid || null
  }
}

/**
 * 创建数据库权限适配器的工厂函数
 */
export function createDatabasePermissionAdapter(prisma: PrismaClient): IDatabasePermissionAdapter {
  return new PrismaDatabasePermissionAdapter(prisma)
}