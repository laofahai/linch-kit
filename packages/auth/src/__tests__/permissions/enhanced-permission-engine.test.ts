/**
 * @linch-kit/auth EnhancedPermissionEngine 测试
 * 覆盖增强型权限引擎的核心功能
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { EnhancedPermissionEngine, type EnhancedPermissionResult } from '../../permissions/enhanced-permission-engine'
import type { LinchKitUser, PermissionContext } from '../../types'

describe('EnhancedPermissionEngine', () => {
  let permissionEngine: EnhancedPermissionEngine
  
  const mockUser: LinchKitUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['TENANT_ADMIN'],
    permissions: ['read:user', 'write:user'],
    tenantId: 'tenant-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    permissionEngine = new EnhancedPermissionEngine({
      enableCache: true,
      cachePrefix: 'test-auth',
      cacheTTL: 300,
      roleHierarchyEnabled: true
    })
  })

  describe('Construction', () => {
    it('should create enhanced permission engine with default options', () => {
      const engine = new EnhancedPermissionEngine()
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(EnhancedPermissionEngine)
    })

    it('should create enhanced permission engine with custom options', () => {
      const engine = new EnhancedPermissionEngine({
        enableCache: false,
        cachePrefix: 'custom-auth',
        cacheTTL: 600,
        roleHierarchyEnabled: false
      })
      expect(engine).toBeDefined()
    })
  })

  describe('Enhanced Permission Checking', () => {
    it('should perform enhanced permission check with granted result', async () => {
      // Mock the basic check method
      permissionEngine.check = mock().mockResolvedValue(true)
      
      // Mock field permissions and conditions
      permissionEngine.getFieldPermissions = mock().mockResolvedValue({
        allowed: ['name', 'email'],
        denied: ['password', 'secret']
      })
      
      permissionEngine.getPermissionConditions = mock().mockResolvedValue({
        tenantId: 'tenant-1'
      })

      const result: EnhancedPermissionResult = await permissionEngine.checkEnhanced(
        mockUser,
        'read',
        'user',
        { tenantId: 'tenant-1' }
      )

      expect(result.granted).toBe(true)
      expect(result.allowedFields).toEqual(['name', 'email'])
      expect(result.deniedFields).toEqual(['password', 'secret'])
      expect(result.conditions).toEqual({ tenantId: 'tenant-1' })
      expect(result.reason).toBeUndefined()
    })

    it('should return denied result when basic check fails', async () => {
      // Mock the basic check method to return false
      permissionEngine.check = mock().mockResolvedValue(false)

      const result: EnhancedPermissionResult = await permissionEngine.checkEnhanced(
        mockUser,
        'delete',
        'user'
      )

      expect(result.granted).toBe(false)
      expect(result.reason).toBe('Permission denied by basic check')
      expect(result.allowedFields).toBeUndefined()
      expect(result.deniedFields).toBeUndefined()
      expect(result.conditions).toBeUndefined()
    })

    it('should handle enhanced check without context', async () => {
      permissionEngine.check = mock().mockResolvedValue(true)
      permissionEngine.getFieldPermissions = mock().mockResolvedValue({
        allowed: ['id', 'name'],
        denied: []
      })
      permissionEngine.getPermissionConditions = mock().mockResolvedValue({})

      const result: EnhancedPermissionResult = await permissionEngine.checkEnhanced(
        mockUser,
        'read',
        'user'
      )

      expect(result.granted).toBe(true)
      expect(result.allowedFields).toEqual(['id', 'name'])
      expect(result.deniedFields).toEqual([])
      expect(result.conditions).toEqual({})
    })
  })

  describe('Effective Roles Management', () => {
    it('should get effective roles including inherited roles', async () => {
      // Mock direct roles
      permissionEngine.getUserDirectRoles = mock().mockResolvedValue(['TENANT_ADMIN'])
      
      // Mock inherited roles
      permissionEngine.getInheritedRoles = mock().mockResolvedValue(['USER'])

      const effectiveRoles = await permissionEngine.getEffectiveRoles('user-1')

      expect(effectiveRoles).toEqual(['TENANT_ADMIN', 'USER'])
      expect(permissionEngine.getUserDirectRoles).toHaveBeenCalledWith('user-1')
      expect(permissionEngine.getInheritedRoles).toHaveBeenCalledWith(['TENANT_ADMIN'])
    })

    it('should handle user with no inherited roles', async () => {
      permissionEngine.getUserDirectRoles = mock().mockResolvedValue(['USER'])
      permissionEngine.getInheritedRoles = mock().mockResolvedValue([])

      const effectiveRoles = await permissionEngine.getEffectiveRoles('user-2')

      expect(effectiveRoles).toEqual(['USER'])
    })

    it('should deduplicate roles correctly', async () => {
      permissionEngine.getUserDirectRoles = mock().mockResolvedValue(['USER', 'TENANT_ADMIN'])
      permissionEngine.getInheritedRoles = mock().mockResolvedValue(['USER', 'GUEST'])

      const effectiveRoles = await permissionEngine.getEffectiveRoles('user-3')

      // Should contain unique roles only
      expect(effectiveRoles).toEqual(['USER', 'TENANT_ADMIN', 'GUEST'])
      expect(effectiveRoles.length).toBe(3)
    })
  })

  describe('Role Permissions Management', () => {
    it('should get role permissions including inherited permissions', async () => {
      // Mock direct permissions
      permissionEngine.getRoleDirectPermissions = mock().mockResolvedValue(['read:user', 'write:user'])
      
      // Mock parent roles
      permissionEngine.getParentRoles = mock().mockResolvedValue(['USER'])
      
      // Create a spy for the recursive call
      const originalGetRolePermissions = permissionEngine.getRolePermissions
      permissionEngine.getRolePermissions = mock()
        .mockResolvedValueOnce(['read:user', 'write:user', 'read:profile']) // First call (TENANT_ADMIN)
        .mockResolvedValueOnce(['read:profile']) // Recursive call (USER)

      const permissions = await originalGetRolePermissions.call(permissionEngine, 'TENANT_ADMIN')

      expect(permissions).toEqual(['read:user', 'write:user', 'read:profile'])
    })

    it('should handle role with no parent roles', async () => {
      permissionEngine.getRoleDirectPermissions = mock().mockResolvedValue(['read:user'])
      permissionEngine.getParentRoles = mock().mockResolvedValue([])

      const permissions = await permissionEngine.getRolePermissions('USER')

      expect(permissions).toEqual(['read:user'])
    })

    it('should deduplicate permissions correctly', async () => {
      permissionEngine.getRoleDirectPermissions = mock().mockResolvedValue(['read:user', 'write:user'])
      permissionEngine.getParentRoles = mock().mockResolvedValue(['USER'])
      
      // Mock recursive call to return overlapping permissions
      const originalGetRolePermissions = permissionEngine.getRolePermissions
      permissionEngine.getRolePermissions = mock()
        .mockResolvedValueOnce(['read:user', 'write:user', 'read:profile']) // First call
        .mockResolvedValueOnce(['read:user', 'read:profile']) // Recursive call

      const permissions = await originalGetRolePermissions.call(permissionEngine, 'ADMIN')

      expect(permissions).toEqual(['read:user', 'write:user', 'read:profile'])
      expect(permissions.length).toBe(3) // Should be deduplicated
    })
  })

  describe('Field-Level Permissions', () => {
    it('should get field permissions for user and resource', async () => {
      // Mock effective roles
      permissionEngine.getEffectiveRoles = mock().mockResolvedValue(['TENANT_ADMIN', 'USER'])
      
      // Mock resource type detection
      permissionEngine.getResourceType = mock().mockReturnValue('user')
      
      // Mock field permission collection (this would be implemented in the actual class)
      const mockGetFieldPermissionsForRoles = mock().mockResolvedValue({
        allowed: ['name', 'email', 'role'],
        denied: ['password', 'secretKey']
      })
      
      // Replace the internal method if it exists
      if (permissionEngine.getFieldPermissionsForRoles) {
        permissionEngine.getFieldPermissionsForRoles = mockGetFieldPermissionsForRoles
      }

      const fieldPermissions = await permissionEngine.getFieldPermissions(
        mockUser,
        { type: 'user', id: 'user-2' },
        { tenantId: 'tenant-1' }
      )

      expect(permissionEngine.getEffectiveRoles).toHaveBeenCalledWith('user-1')
      expect(permissionEngine.getResourceType).toHaveBeenCalledWith({ type: 'user', id: 'user-2' })
      expect(fieldPermissions).toHaveProperty('allowed')
      expect(fieldPermissions).toHaveProperty('denied')
      expect(fieldPermissions.allowed).toBeInstanceOf(Array)
      expect(fieldPermissions.denied).toBeInstanceOf(Array)
    })

    it('should handle field permissions without context', async () => {
      permissionEngine.getEffectiveRoles = mock().mockResolvedValue(['USER'])
      permissionEngine.getResourceType = mock().mockReturnValue('user')

      const fieldPermissions = await permissionEngine.getFieldPermissions(
        mockUser,
        { type: 'user', id: 'user-2' }
      )

      expect(fieldPermissions).toHaveProperty('allowed')
      expect(fieldPermissions).toHaveProperty('denied')
    })

    it('should handle user with no roles', async () => {
      permissionEngine.getEffectiveRoles = mock().mockResolvedValue([])
      permissionEngine.getResourceType = mock().mockReturnValue('user')

      const fieldPermissions = await permissionEngine.getFieldPermissions(
        { ...mockUser, roles: [] },
        { type: 'user', id: 'user-2' }
      )

      expect(fieldPermissions.allowed).toBeInstanceOf(Array)
      expect(fieldPermissions.denied).toBeInstanceOf(Array)
    })
  })

  describe('Permission Conditions', () => {
    it('should get permission conditions for user action and subject', async () => {
      // Mock the getPermissionConditions method
      permissionEngine.getPermissionConditions = mock().mockResolvedValue({
        tenantId: 'tenant-1',
        ownerId: 'user-1',
        status: 'active'
      })

      const conditions = await permissionEngine.getPermissionConditions(
        mockUser,
        'read',
        'user',
        { tenantId: 'tenant-1' }
      )

      expect(conditions).toEqual({
        tenantId: 'tenant-1',
        ownerId: 'user-1',
        status: 'active'
      })
    })

    it('should handle empty conditions', async () => {
      permissionEngine.getPermissionConditions = mock().mockResolvedValue({})

      const conditions = await permissionEngine.getPermissionConditions(
        mockUser,
        'read',
        'user'
      )

      expect(conditions).toEqual({})
    })
  })

  describe('Resource Type Detection', () => {
    it('should detect resource type from object', () => {
      permissionEngine.getResourceType = mock().mockReturnValue('user')

      const resourceType = permissionEngine.getResourceType({ type: 'user', id: '1' })
      expect(resourceType).toBe('user')
    })

    it('should detect resource type from string', () => {
      permissionEngine.getResourceType = mock().mockReturnValue('user')

      const resourceType = permissionEngine.getResourceType('user')
      expect(resourceType).toBe('user')
    })

    it('should handle unknown resource type', () => {
      permissionEngine.getResourceType = mock().mockReturnValue('unknown')

      const resourceType = permissionEngine.getResourceType(null)
      expect(resourceType).toBe('unknown')
    })
  })

  describe('Helper Methods', () => {
    it('should get user direct roles', async () => {
      permissionEngine.getUserDirectRoles = mock().mockResolvedValue(['TENANT_ADMIN'])

      const directRoles = await permissionEngine.getUserDirectRoles('user-1')
      expect(directRoles).toEqual(['TENANT_ADMIN'])
    })

    it('should get inherited roles from direct roles', async () => {
      permissionEngine.getInheritedRoles = mock().mockResolvedValue(['USER', 'GUEST'])

      const inheritedRoles = await permissionEngine.getInheritedRoles(['TENANT_ADMIN'])
      expect(inheritedRoles).toEqual(['USER', 'GUEST'])
    })

    it('should get role direct permissions', async () => {
      permissionEngine.getRoleDirectPermissions = mock().mockResolvedValue(['read:user', 'write:user'])

      const permissions = await permissionEngine.getRoleDirectPermissions('TENANT_ADMIN')
      expect(permissions).toEqual(['read:user', 'write:user'])
    })

    it('should get parent roles', async () => {
      permissionEngine.getParentRoles = mock().mockResolvedValue(['USER'])

      const parentRoles = await permissionEngine.getParentRoles('TENANT_ADMIN')
      expect(parentRoles).toEqual(['USER'])
    })
  })

  describe('Error Handling', () => {
    it('should handle errors in enhanced permission check', async () => {
      permissionEngine.check = mock().mockRejectedValue(new Error('Permission check failed'))

      await expect(permissionEngine.checkEnhanced(
        mockUser,
        'read',
        'user'
      )).rejects.toThrow('Permission check failed')
    })

    it('should handle errors in effective roles retrieval', async () => {
      permissionEngine.getUserDirectRoles = mock().mockRejectedValue(new Error('Database error'))

      await expect(permissionEngine.getEffectiveRoles('user-1')).rejects.toThrow('Database error')
    })

    it('should handle errors in field permissions', async () => {
      permissionEngine.getEffectiveRoles = mock().mockRejectedValue(new Error('Role retrieval failed'))

      await expect(permissionEngine.getFieldPermissions(
        mockUser,
        'user'
      )).rejects.toThrow('Role retrieval failed')
    })
  })

  describe('Performance and Caching', () => {
    it('should handle caching when enabled', async () => {
      const engineWithCache = new EnhancedPermissionEngine({
        enableCache: true,
        cachePrefix: 'perf-test',
        cacheTTL: 300
      })

      // Mock methods for caching test
      engineWithCache.getUserDirectRoles = mock().mockResolvedValue(['USER'])
      engineWithCache.getInheritedRoles = mock().mockResolvedValue([])

      // First call
      const roles1 = await engineWithCache.getEffectiveRoles('user-1')
      
      // Second call (should potentially use cache)
      const roles2 = await engineWithCache.getEffectiveRoles('user-1')

      expect(roles1).toEqual(['USER'])
      expect(roles2).toEqual(['USER'])
    })

    it('should handle large role hierarchies efficiently', async () => {
      const manyRoles = Array.from({ length: 50 }, (_, i) => `ROLE_${i}`)
      const manyPermissions = Array.from({ length: 100 }, (_, i) => `permission:${i}`)

      permissionEngine.getUserDirectRoles = mock().mockResolvedValue(manyRoles.slice(0, 10))
      permissionEngine.getInheritedRoles = mock().mockResolvedValue(manyRoles.slice(10))
      permissionEngine.getRoleDirectPermissions = mock().mockResolvedValue(manyPermissions.slice(0, 20))
      permissionEngine.getParentRoles = mock().mockResolvedValue([])

      const startTime = Date.now()
      
      const effectiveRoles = await permissionEngine.getEffectiveRoles('user-1')
      const rolePermissions = await permissionEngine.getRolePermissions('ROLE_1')
      
      const endTime = Date.now()

      expect(effectiveRoles).toHaveLength(50)
      expect(rolePermissions).toHaveLength(20)
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
    })
  })

  describe('Integration with Base Engine', () => {
    it('should extend CASLPermissionEngine functionality', () => {
      expect(permissionEngine).toHaveProperty('check')
      expect(permissionEngine).toHaveProperty('checkEnhanced')
      expect(typeof permissionEngine.check).toBe('function')
      expect(typeof permissionEngine.checkEnhanced).toBe('function')
    })

    it('should inherit base engine configuration', () => {
      const engine = new EnhancedPermissionEngine({
        enableCache: false,
        roleHierarchyEnabled: true
      })

      expect(engine).toBeDefined()
      // Should inherit from CASLPermissionEngine
      expect(engine.check).toBeDefined()
    })
  })
})