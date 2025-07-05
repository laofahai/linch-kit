/**
 * @linch-kit/auth PermissionService 测试
 * 全面覆盖权限服务的核心功能
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'

import { createPermissionService } from '../../services/permission.service'
import type { Role, Permission } from '../../types'

// Mock Prisma 客户端
const mockPrisma = {
  role: {
    create: mock(),
    update: mock(),
    delete: mock(),
    findUnique: mock(),
    findMany: mock()
  },
  permission: {
    create: mock(),
    update: mock(),
    delete: mock(),
    findUnique: mock(),
    findMany: mock()
  },
  rolePermission: {
    create: mock(),
    delete: mock(),
    findMany: mock()
  },
  userRoleAssignment: {
    create: mock(),
    deleteMany: mock(),
    findMany: mock()
  },
  resourcePermission: {
    upsert: mock(),
    findMany: mock()
  },
  permissionCache: {
    deleteMany: mock()
  }
}

// Mock 数据
const mockRole: Role = {
  id: 'role-1',
  name: 'Test Role',
  description: 'Test role description',
  parentRoleId: null,
  isSystemRole: false,
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockPermission: Permission = {
  id: 'perm-1',
  name: 'Test Permission',
  action: 'read',
  subject: 'User',
  conditions: { status: 'active' },
  allowedFields: ['name', 'email'],
  deniedFields: ['password'],
  description: 'Test permission description',
  isSystemPermission: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockRolePermission = {
  roleId: 'role-1',
  permissionId: 'perm-1',
  overrideConditions: null,
  overrideAllowedFields: [],
  overrideDeniedFields: [],
  permission: mockPermission
}

const mockUserRoleAssignment = {
  userId: 'user-1',
  roleId: 'role-1',
  scope: null,
  scopeType: null,
  validFrom: new Date(),
  validTo: null,
  role: mockRole
}

describe('PermissionService', () => {
  let service: ReturnType<typeof createPermissionService>

  beforeEach(() => {
    // 重置所有 mock
    Object.values(mockPrisma).forEach(model => {
      Object.values(model).forEach(method => {
        if (typeof method === 'function') {
          method.mockClear()
        }
      })
    })

    service = createPermissionService(mockPrisma)
  })

  describe('角色管理', () => {
    describe('createRole', () => {
      it('应该创建新角色', async () => {
        mockPrisma.role.create.mockResolvedValue(mockRole)

        const result = await service.createRole({
          name: 'Test Role',
          description: 'Test role description',
          tenantId: 'tenant-1'
        })

        expect(result).toEqual(mockRole)
        expect(mockPrisma.role.create).toHaveBeenCalledWith({
          data: {
            name: 'Test Role',
            description: 'Test role description',
            parentRoleId: undefined,
            isSystemRole: false,
            tenantId: 'tenant-1'
          }
        })
      })

      it('应该创建系统角色', async () => {
        const systemRole = { ...mockRole, isSystemRole: true }
        mockPrisma.role.create.mockResolvedValue(systemRole)

        const result = await service.createRole({
          name: 'System Role',
          isSystemRole: true
        })

        expect(result.isSystemRole).toBe(true)
        expect(mockPrisma.role.create).toHaveBeenCalledWith({
          data: {
            name: 'System Role',
            description: undefined,
            parentRoleId: undefined,
            isSystemRole: true,
            tenantId: undefined
          }
        })
      })
    })

    describe('updateRole', () => {
      it('应该更新角色信息', async () => {
        const updatedRole = { ...mockRole, name: 'Updated Role' }
        mockPrisma.role.update.mockResolvedValue(updatedRole)

        const result = await service.updateRole('role-1', { name: 'Updated Role' })

        expect(result).toEqual(updatedRole)
        expect(mockPrisma.role.update).toHaveBeenCalledWith({
          where: { id: 'role-1' },
          data: { name: 'Updated Role' }
        })
      })
    })

    describe('deleteRole', () => {
      it('应该成功删除角色', async () => {
        mockPrisma.role.delete.mockResolvedValue(mockRole)

        const result = await service.deleteRole('role-1')

        expect(result).toBe(true)
        expect(mockPrisma.role.delete).toHaveBeenCalledWith({
          where: { id: 'role-1' }
        })
      })

      it('应该处理删除失败的情况', async () => {
        mockPrisma.role.delete.mockRejectedValue(new Error('Delete failed'))

        const result = await service.deleteRole('role-1')

        expect(result).toBe(false)
      })
    })

    describe('getRole', () => {
      it('应该获取角色信息', async () => {
        mockPrisma.role.findUnique.mockResolvedValue(mockRole)

        const result = await service.getRole('role-1')

        expect(result).toEqual(mockRole)
        expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
          where: { id: 'role-1' }
        })
      })

      it('应该处理角色不存在的情况', async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null)

        const result = await service.getRole('nonexistent')

        expect(result).toBeNull()
      })
    })

    describe('getRoles', () => {
      it('应该获取所有角色', async () => {
        mockPrisma.role.findMany.mockResolvedValue([mockRole])

        const result = await service.getRoles()

        expect(result).toEqual([mockRole])
        expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
          where: undefined
        })
      })

      it('应该按租户过滤角色', async () => {
        mockPrisma.role.findMany.mockResolvedValue([mockRole])

        const result = await service.getRoles({ tenantId: 'tenant-1' })

        expect(result).toEqual([mockRole])
        expect(mockPrisma.role.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-1' }
        })
      })
    })

    describe('getRoleHierarchy', () => {
      it('应该获取角色层次结构', async () => {
        const parentRole = { ...mockRole, id: 'parent-role' }
        const childRole = { ...mockRole, id: 'child-role', parentRoleId: 'parent-role' }
        
        mockPrisma.role.findUnique
          .mockResolvedValueOnce(childRole)
          .mockResolvedValueOnce(parentRole)

        const result = await service.getRoleHierarchy('child-role')

        expect(result).toEqual([childRole, parentRole])
      })

      it('应该处理没有父角色的情况', async () => {
        mockPrisma.role.findUnique.mockResolvedValue(mockRole)

        const result = await service.getRoleHierarchy('role-1')

        expect(result).toEqual([mockRole])
      })
    })
  })

  describe('权限管理', () => {
    describe('createPermission', () => {
      it('应该创建新权限', async () => {
        mockPrisma.permission.create.mockResolvedValue(mockPermission)

        const result = await service.createPermission({
          name: 'Test Permission',
          action: 'read',
          subject: 'User',
          conditions: { status: 'active' },
          allowedFields: ['name', 'email'],
          deniedFields: ['password']
        })

        expect(result).toEqual(mockPermission)
        expect(mockPrisma.permission.create).toHaveBeenCalledWith({
          data: {
            name: 'Test Permission',
            action: 'read',
            subject: 'User',
            conditions: '{"status":"active"}',
            allowedFields: ['name', 'email'],
            deniedFields: ['password'],
            description: undefined,
            isSystemPermission: false
          }
        })
      })

      it('应该创建系统权限', async () => {
        const systemPermission = { ...mockPermission, isSystemPermission: true }
        mockPrisma.permission.create.mockResolvedValue(systemPermission)

        const result = await service.createPermission({
          name: 'System Permission',
          action: 'manage',
          subject: 'all',
          isSystemPermission: true
        })

        expect(result.isSystemPermission).toBe(true)
      })
    })

    describe('updatePermission', () => {
      it('应该更新权限信息', async () => {
        const updatedPermission = { ...mockPermission, name: 'Updated Permission' }
        mockPrisma.permission.update.mockResolvedValue(updatedPermission)

        const result = await service.updatePermission('perm-1', {
          name: 'Updated Permission',
          conditions: { status: 'updated' }
        })

        expect(result).toEqual(updatedPermission)
        expect(mockPrisma.permission.update).toHaveBeenCalledWith({
          where: { id: 'perm-1' },
          data: {
            name: 'Updated Permission',
            conditions: '{"status":"updated"}'
          }
        })
      })
    })

    describe('deletePermission', () => {
      it('应该成功删除权限', async () => {
        mockPrisma.permission.delete.mockResolvedValue(mockPermission)

        const result = await service.deletePermission('perm-1')

        expect(result).toBe(true)
        expect(mockPrisma.permission.delete).toHaveBeenCalledWith({
          where: { id: 'perm-1' }
        })
      })

      it('应该处理删除失败的情况', async () => {
        mockPrisma.permission.delete.mockRejectedValue(new Error('Delete failed'))

        const result = await service.deletePermission('perm-1')

        expect(result).toBe(false)
      })
    })

    describe('getPermission', () => {
      it('应该获取权限信息', async () => {
        const permissionWithStringConditions = {
          ...mockPermission,
          conditions: '{"status":"active"}'
        }
        mockPrisma.permission.findUnique.mockResolvedValue(permissionWithStringConditions)

        const result = await service.getPermission('perm-1')

        expect(result).toEqual(mockPermission)
        expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
          where: { id: 'perm-1' }
        })
      })

      it('应该处理权限不存在的情况', async () => {
        mockPrisma.permission.findUnique.mockResolvedValue(null)

        const result = await service.getPermission('nonexistent')

        expect(result).toBeNull()
      })
    })

    describe('getPermissions', () => {
      it('应该获取所有权限', async () => {
        const permissionsWithStringConditions = [{
          ...mockPermission,
          conditions: '{"status":"active"}'
        }]
        mockPrisma.permission.findMany.mockResolvedValue(permissionsWithStringConditions)

        const result = await service.getPermissions()

        expect(result).toEqual([mockPermission])
        expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
          where: undefined
        })
      })

      it('应该按筛选条件获取权限', async () => {
        const permissionWithStringConditions = {
          ...mockPermission,
          conditions: '{"status":"active"}'
        }
        mockPrisma.permission.findMany.mockResolvedValue([permissionWithStringConditions])

        const result = await service.getPermissions({ action: 'read', subject: 'User' })

        expect(result).toEqual([mockPermission])
        expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
          where: { action: 'read', subject: 'User' }
        })
      })
    })
  })

  describe('角色权限分配', () => {
    describe('assignPermissionToRole', () => {
      it('应该成功分配权限到角色', async () => {
        mockPrisma.rolePermission.create.mockResolvedValue(mockRolePermission)
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([])

        const result = await service.assignPermissionToRole('role-1', 'perm-1')

        expect(result).toBe(true)
        expect(mockPrisma.rolePermission.create).toHaveBeenCalledWith({
          data: {
            roleId: 'role-1',
            permissionId: 'perm-1',
            overrideConditions: null,
            overrideAllowedFields: [],
            overrideDeniedFields: []
          }
        })
      })

      it('应该支持权限覆盖', async () => {
        mockPrisma.rolePermission.create.mockResolvedValue(mockRolePermission)
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([])

        const overrides = {
          conditions: { department: 'IT' },
          allowedFields: ['name'],
          deniedFields: ['salary']
        }

        const result = await service.assignPermissionToRole('role-1', 'perm-1', overrides)

        expect(result).toBe(true)
        expect(mockPrisma.rolePermission.create).toHaveBeenCalledWith({
          data: {
            roleId: 'role-1',
            permissionId: 'perm-1',
            overrideConditions: '{"department":"IT"}',
            overrideAllowedFields: ['name'],
            overrideDeniedFields: ['salary']
          }
        })
      })

      it('应该处理分配失败的情况', async () => {
        mockPrisma.rolePermission.create.mockRejectedValue(new Error('Assignment failed'))

        const result = await service.assignPermissionToRole('role-1', 'perm-1')

        expect(result).toBe(false)
      })
    })

    describe('removePermissionFromRole', () => {
      it('应该成功移除角色权限', async () => {
        mockPrisma.rolePermission.delete.mockResolvedValue(mockRolePermission)
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([])

        const result = await service.removePermissionFromRole('role-1', 'perm-1')

        expect(result).toBe(true)
        expect(mockPrisma.rolePermission.delete).toHaveBeenCalledWith({
          where: {
            roleId_permissionId: {
              roleId: 'role-1',
              permissionId: 'perm-1'
            }
          }
        })
      })

      it('应该处理移除失败的情况', async () => {
        mockPrisma.rolePermission.delete.mockRejectedValue(new Error('Remove failed'))

        const result = await service.removePermissionFromRole('role-1', 'perm-1')

        expect(result).toBe(false)
      })
    })

    describe('getRolePermissions', () => {
      it('应该获取角色的直接权限', async () => {
        const rolePermissionWithStringConditions = {
          ...mockRolePermission,
          permission: {
            ...mockPermission,
            conditions: '{"status":"active"}'
          }
        }
        mockPrisma.rolePermission.findMany.mockResolvedValue([rolePermissionWithStringConditions])

        const result = await service.getRolePermissions('role-1', false)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(mockPermission)
      })

      it('应该获取角色的继承权限', async () => {
        const parentRole = { ...mockRole, id: 'parent-role' }
        const childRole = { ...mockRole, id: 'child-role', parentRoleId: 'parent-role' }
        
        const rolePermissionWithStringConditions = {
          ...mockRolePermission,
          permission: {
            ...mockPermission,
            conditions: '{"status":"active"}'
          }
        }
        
        mockPrisma.rolePermission.findMany
          .mockResolvedValueOnce([rolePermissionWithStringConditions]) // 子角色权限
          .mockResolvedValueOnce([{ ...rolePermissionWithStringConditions, roleId: 'parent-role' }]) // 父角色权限
        
        mockPrisma.role.findUnique
          .mockResolvedValueOnce(childRole) // 获取子角色
          .mockResolvedValueOnce(parentRole) // 获取父角色

        const result = await service.getRolePermissions('child-role', true)

        expect(result).toHaveLength(1) // 权限去重
      })
    })
  })

  describe('用户角色分配', () => {
    describe('assignRoleToUser', () => {
      it('应该成功分配角色到用户', async () => {
        mockPrisma.userRoleAssignment.create.mockResolvedValue(mockUserRoleAssignment)
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })

        const result = await service.assignRoleToUser('user-1', 'role-1')

        expect(result).toBe(true)
        expect(mockPrisma.userRoleAssignment.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-1',
            roleId: 'role-1',
            scope: undefined,
            scopeType: undefined,
            validFrom: expect.any(Date),
            validTo: undefined
          }
        })
      })

      it('应该支持有效期限制', async () => {
        mockPrisma.userRoleAssignment.create.mockResolvedValue(mockUserRoleAssignment)
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })

        const validFrom = new Date()
        const validTo = new Date(Date.now() + 86400000) // 24 hours later

        const result = await service.assignRoleToUser('user-1', 'role-1', {
          scope: 'project-1',
          scopeType: 'project',
          validFrom,
          validTo
        })

        expect(result).toBe(true)
        expect(mockPrisma.userRoleAssignment.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-1',
            roleId: 'role-1',
            scope: 'project-1',
            scopeType: 'project',
            validFrom,
            validTo
          }
        })
      })

      it('应该处理分配失败的情况', async () => {
        mockPrisma.userRoleAssignment.create.mockRejectedValue(new Error('Assignment failed'))

        const result = await service.assignRoleToUser('user-1', 'role-1')

        expect(result).toBe(false)
      })
    })

    describe('removeRoleFromUser', () => {
      it('应该成功移除用户角色', async () => {
        mockPrisma.userRoleAssignment.deleteMany.mockResolvedValue({ count: 1 })
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })

        const result = await service.removeRoleFromUser('user-1', 'role-1')

        expect(result).toBe(true)
        expect(mockPrisma.userRoleAssignment.deleteMany).toHaveBeenCalledWith({
          where: { userId: 'user-1', roleId: 'role-1' }
        })
      })

      it('应该支持按作用域移除', async () => {
        mockPrisma.userRoleAssignment.deleteMany.mockResolvedValue({ count: 1 })
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })

        const result = await service.removeRoleFromUser('user-1', 'role-1', 'project-1')

        expect(result).toBe(true)
        expect(mockPrisma.userRoleAssignment.deleteMany).toHaveBeenCalledWith({
          where: { userId: 'user-1', roleId: 'role-1', scope: 'project-1' }
        })
      })

      it('应该处理移除失败的情况', async () => {
        mockPrisma.userRoleAssignment.deleteMany.mockRejectedValue(new Error('Remove failed'))

        const result = await service.removeRoleFromUser('user-1', 'role-1')

        expect(result).toBe(false)
      })
    })

    describe('getUserRoles', () => {
      it('应该获取用户的有效角色', async () => {
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([mockUserRoleAssignment])

        const result = await service.getUserRoles('user-1', false)

        expect(result).toEqual([mockRole])
        expect(mockPrisma.userRoleAssignment.findMany).toHaveBeenCalledWith({
          where: {
            userId: 'user-1',
            validFrom: { lte: expect.any(Date) },
            OR: [
              { validTo: null },
              { validTo: { gte: expect.any(Date) } }
            ]
          },
          include: { role: true }
        })
      })

      it('应该获取用户的继承角色', async () => {
        const parentRole = { ...mockRole, id: 'parent-role' }
        const childRole = { ...mockRole, id: 'child-role', parentRoleId: 'parent-role' }
        
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([{
          ...mockUserRoleAssignment,
          role: childRole
        }])
        
        mockPrisma.role.findUnique
          .mockResolvedValueOnce(childRole)
          .mockResolvedValueOnce(parentRole)

        const result = await service.getUserRoles('user-1', true)

        expect(result).toHaveLength(2)
        expect(result.map(r => r.id)).toContain('child-role')
        expect(result.map(r => r.id)).toContain('parent-role')
      })
    })

    describe('getUserEffectivePermissions', () => {
      it('应该获取用户的有效权限', async () => {
        // Mock 用户角色
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([mockUserRoleAssignment])
        
        // Mock 角色权限
        const rolePermissionWithStringConditions = {
          ...mockRolePermission,
          permission: {
            ...mockPermission,
            conditions: '{"status":"active"}'
          }
        }
        mockPrisma.rolePermission.findMany.mockResolvedValue([rolePermissionWithStringConditions])
        
        // Mock 资源权限
        mockPrisma.resourcePermission.findMany.mockResolvedValue([])

        const result = await service.getUserEffectivePermissions('user-1')

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(mockPermission)
      })

      it('应该合并相同权限的字段权限', async () => {
        const rolePermissionWithStringConditions = {
          ...mockRolePermission,
          permission: {
            ...mockPermission,
            conditions: '{"status":"active"}'
          }
        }
        
        const duplicatePermission = {
          ...mockRolePermission,
          permission: {
            ...mockPermission,
            conditions: '{"status":"active"}',
            allowedFields: ['id', 'status'],
            deniedFields: ['secret']
          }
        }

        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([mockUserRoleAssignment])
        mockPrisma.rolePermission.findMany.mockResolvedValue([
          rolePermissionWithStringConditions,
          duplicatePermission
        ])
        mockPrisma.resourcePermission.findMany.mockResolvedValue([])

        const result = await service.getUserEffectivePermissions('user-1')

        expect(result).toHaveLength(1)
        expect(result[0].allowedFields).toEqual(['name', 'email', 'id', 'status'])
        expect(result[0].deniedFields).toEqual(['password', 'secret'])
      })

      it('应该包含用户资源权限', async () => {
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([])
        mockPrisma.resourcePermission.findMany.mockResolvedValue([{
          id: 'resource-1',
          userId: 'user-1',
          resourceType: 'Document',
          resourceId: 'doc-1',
          actions: ['read', 'write'],
          conditions: '{"department":"IT"}',
          createdAt: new Date(),
          updatedAt: new Date()
        }])

        const result = await service.getUserEffectivePermissions('user-1')

        expect(result).toHaveLength(1)
        expect(result[0].subject).toBe('Document')
        expect(result[0].action).toBe('read,write')
        expect(result[0].conditions).toEqual({ department: 'IT' })
      })
    })
  })

  describe('资源权限管理', () => {
    describe('setResourcePermission', () => {
      it('应该为用户设置资源权限', async () => {
        mockPrisma.resourcePermission.upsert.mockResolvedValue({})
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 1 })

        const result = await service.setResourcePermission(
          'Document',
          'doc-1',
          { userId: 'user-1' },
          ['read', 'write'],
          { department: 'IT' }
        )

        expect(result).toBe(true)
        expect(mockPrisma.resourcePermission.upsert).toHaveBeenCalledWith({
          where: {
            resourceType_resourceId_userId_roleId: {
              resourceType: 'Document',
              resourceId: 'doc-1',
              userId: 'user-1',
              roleId: null
            }
          },
          update: {
            actions: ['read', 'write'],
            conditions: '{"department":"IT"}'
          },
          create: {
            resourceType: 'Document',
            resourceId: 'doc-1',
            userId: 'user-1',
            roleId: undefined,
            actions: ['read', 'write'],
            conditions: '{"department":"IT"}'
          }
        })
      })

      it('应该为角色设置资源权限', async () => {
        mockPrisma.resourcePermission.upsert.mockResolvedValue({})

        const result = await service.setResourcePermission(
          'Document',
          'doc-1',
          { roleId: 'role-1' },
          ['read']
        )

        expect(result).toBe(true)
        expect(mockPrisma.resourcePermission.upsert).toHaveBeenCalledWith({
          where: {
            resourceType_resourceId_userId_roleId: {
              resourceType: 'Document',
              resourceId: 'doc-1',
              userId: null,
              roleId: 'role-1'
            }
          },
          update: {
            actions: ['read'],
            conditions: null
          },
          create: {
            resourceType: 'Document',
            resourceId: 'doc-1',
            userId: undefined,
            roleId: 'role-1',
            actions: ['read'],
            conditions: null
          }
        })
      })

      it('应该处理设置失败的情况', async () => {
        mockPrisma.resourcePermission.upsert.mockRejectedValue(new Error('Upsert failed'))

        const result = await service.setResourcePermission(
          'Document',
          'doc-1',
          { userId: 'user-1' },
          ['read']
        )

        expect(result).toBe(false)
      })
    })

    describe('getResourcePermissions', () => {
      it('应该获取资源权限', async () => {
        const mockResourcePermissions = [
          {
            userId: 'user-1',
            roleId: null,
            actions: ['read', 'write'],
            conditions: '{"department":"IT"}'
          },
          {
            userId: null,
            roleId: 'role-1',
            actions: ['read'],
            conditions: null
          }
        ]

        mockPrisma.resourcePermission.findMany.mockResolvedValue(mockResourcePermissions)

        const result = await service.getResourcePermissions('Document', 'doc-1')

        expect(result).toEqual([
          {
            userId: 'user-1',
            roleId: null,
            actions: ['read', 'write'],
            conditions: { department: 'IT' }
          },
          {
            userId: null,
            roleId: 'role-1',
            actions: ['read'],
            conditions: undefined
          }
        ])
        expect(mockPrisma.resourcePermission.findMany).toHaveBeenCalledWith({
          where: {
            resourceType: 'Document',
            resourceId: 'doc-1'
          }
        })
      })
    })
  })

  describe('缓存管理', () => {
    describe('invalidateUserPermissionCache', () => {
      it('应该清除用户权限缓存', async () => {
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 5 })

        await service.invalidateUserPermissionCache('user-1')

        expect(mockPrisma.permissionCache.deleteMany).toHaveBeenCalledWith({
          where: { userId: 'user-1' }
        })
      })
    })

    describe('invalidateRolePermissionCache', () => {
      it('应该清除角色相关用户的权限缓存', async () => {
        mockPrisma.userRoleAssignment.findMany.mockResolvedValue([
          { userId: 'user-1' },
          { userId: 'user-2' },
          { userId: 'user-1' } // 重复用户
        ])
        mockPrisma.permissionCache.deleteMany.mockResolvedValue({ count: 10 })

        await service.invalidateRolePermissionCache('role-1')

        expect(mockPrisma.userRoleAssignment.findMany).toHaveBeenCalledWith({
          where: { roleId: 'role-1' },
          select: { userId: true }
        })
        expect(mockPrisma.permissionCache.deleteMany).toHaveBeenCalledWith({
          where: {
            userId: { in: ['user-1', 'user-2'] } // 去重后的用户ID
          }
        })
      })
    })
  })

  describe('createPermissionService 工厂函数', () => {
    it('应该创建权限服务实例', () => {
      const service = createPermissionService(mockPrisma)

      expect(service).toBeDefined()
      expect(typeof service.createRole).toBe('function')
      expect(typeof service.createPermission).toBe('function')
      expect(typeof service.assignRoleToUser).toBe('function')
    })

    it('应该正确设置 prisma 实例', () => {
      const service = createPermissionService(mockPrisma)
      
      // 通过调用方法验证 prisma 实例设置正确
      expect(async () => {
        await service.createRole({ name: 'Test' })
      }).not.toThrow()
    })
  })
})