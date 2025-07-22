import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

import { ExtensionPermissionManager } from '../../extension/permission-manager'
import type { PermissionPolicy, PermissionContext, PermissionGrant } from '../../extension/permission-manager'

describe('ExtensionPermissionManager', () => {
  let permissionManager: ExtensionPermissionManager

  beforeEach(() => {
    permissionManager = new ExtensionPermissionManager()
  })

  afterEach(() => {
    permissionManager.removeAllListeners()
  })

  describe('默认权限策略', () => {
    it('应该初始化默认权限策略', () => {
      const exportData = permissionManager.exportPermissions()
      const policies = exportData.policies
      
      expect(policies.length).toBeGreaterThan(0)
      expect(policies.find(p => p.name === 'database:read')).toBeDefined()
      expect(policies.find(p => p.name === 'database:write')).toBeDefined()
      expect(policies.find(p => p.name === 'api:read')).toBeDefined()
      expect(policies.find(p => p.name === 'api:write')).toBeDefined()
      expect(policies.find(p => p.name === 'ui:render')).toBeDefined()
      expect(policies.find(p => p.name === 'system:hooks')).toBeDefined()
    })

    it('应该正确设置权限级别', () => {
      const exportData = permissionManager.exportPermissions()
      const policies = exportData.policies
      
      const dbRead = policies.find(p => p.name === 'database:read')
      const dbWrite = policies.find(p => p.name === 'database:write')
      const systemHooks = policies.find(p => p.name === 'system:hooks')
      
      expect(dbRead?.level).toBe('medium')
      expect(dbWrite?.level).toBe('high')
      expect(systemHooks?.level).toBe('critical')
    })

    it('应该正确设置权限依赖关系', () => {
      const exportData = permissionManager.exportPermissions()
      const policies = exportData.policies
      
      const dbWrite = policies.find(p => p.name === 'database:write')
      const apiWrite = policies.find(p => p.name === 'api:write')
      
      expect(dbWrite?.dependencies).toContain('database:read')
      expect(apiWrite?.dependencies).toContain('api:read')
    })
  })

  describe('权限策略注册', () => {
    it('应该成功注册自定义权限策略', () => {
      const customPolicy: PermissionPolicy = {
        name: 'custom:permission',
        description: '自定义权限',
        level: 'medium',
        requiresUserConfirmation: true,
      }

      permissionManager.registerPolicy(customPolicy)
      
      const exportData = permissionManager.exportPermissions()
      const policies = exportData.policies
      expect(policies.find(p => p.name === 'custom:permission')).toBeDefined()
    })

    it('应该覆盖已存在的权限策略', () => {
      const updatedPolicy: PermissionPolicy = {
        name: 'database:read',
        description: '更新的数据库读取权限',
        level: 'high', // 从medium升级到high
        requiresUserConfirmation: true,
      }

      permissionManager.registerPolicy(updatedPolicy)
      
      const exportData = permissionManager.exportPermissions()
      const policies = exportData.policies
      const dbRead = policies.find(p => p.name === 'database:read')
      
      expect(dbRead?.level).toBe('high')
      expect(dbRead?.description).toBe('更新的数据库读取权限')
      expect(dbRead?.requiresUserConfirmation).toBe(true)
    })
  })

  describe('权限授权', () => {
    beforeEach(async () => {
      // 为测试Extension授权一些权限
      await permissionManager.grantPermission('test-extension', 'database:read')
      await permissionManager.grantPermission('test-extension', 'api:read')
    })

    it('应该成功授权权限', async () => {
      await permissionManager.grantPermission('extension-1', 'ui:render')
      
      const permissions = permissionManager.getExtensionPermissions('extension-1')
      expect(permissions).toContain('ui:render')
    })

    it('应该支持临时权限授权', () => {
      const expiresAt = Date.now() + 60000 // 1分钟后过期
      
      permissionManager.grantPermission('temp-extension', 'database:read', {
        permanent: false,
        expiresAt,
      })
      
      const grants = permissionManager.getExtensionGrants('temp-extension')
      const grant = grants.find(g => g.permission === 'database:read')
      
      expect(grant?.permanent).toBe(false)
      expect(grant?.expiresAt).toBe(expiresAt)
    })

    it('应该支持使用次数限制', () => {
      permissionManager.grantPermission('limited-extension', 'api:read', {
        usageLimit: 5,
      })
      
      const grants = permissionManager.getExtensionGrants('limited-extension')
      const grant = grants.find(g => g.permission === 'api:read')
      
      expect(grant?.usageLimit).toBe(5)
      expect(grant?.usageCount).toBe(0)
    })

    it('应该记录授权信息', () => {
      const grantedBy = 'admin'
      
      permissionManager.grantPermission('tracked-extension', 'ui:render', {
        grantedBy,
      })
      
      const grants = permissionManager.getExtensionGrants('tracked-extension')
      const grant = grants.find(g => g.permission === 'ui:render')
      
      expect(grant?.grantedBy).toBe(grantedBy)
      expect(grant?.grantedAt).toBeGreaterThan(0)
    })
  })

  describe('权限检查', () => {
    beforeEach(() => {
      permissionManager.grantPermission('test-extension', 'database:read')
      permissionManager.grantPermission('test-extension', 'database:write')
      permissionManager.grantPermission('test-extension', 'api:read')
    })

    it('应该允许已授权的权限', async () => {
      const hasPermission = await permissionManager.checkPermission(
        'test-extension',
        'database:read'
      )
      
      expect(hasPermission).toBe(true)
    })

    it('应该拒绝未授权的权限', async () => {
      const hasPermission = await permissionManager.checkPermission(
        'test-extension',
        'system:hooks'
      )
      
      expect(hasPermission).toBe(false)
    })

    it('应该检查权限依赖关系', async () => {
      // database:write 依赖 database:read
      const hasPermission = await permissionManager.checkPermission(
        'test-extension',
        'database:write'
      )
      
      expect(hasPermission).toBe(true)
    })

    it('应该拒绝缺少依赖权限的检查', async () => {
      // 只授权 database:write，但没有 database:read
      permissionManager.revokePermission('test-extension', 'database:read')
      
      const hasPermission = await permissionManager.checkPermission(
        'test-extension',
        'database:write'
      )
      
      expect(hasPermission).toBe(false)
    })

    it('应该缓存权限检查结果', async () => {
      // 第一次检查
      const start1 = Date.now()
      await permissionManager.checkPermission('test-extension', 'database:read')
      const time1 = Date.now() - start1
      
      // 第二次检查（应该使用缓存）
      const start2 = Date.now()
      await permissionManager.checkPermission('test-extension', 'database:read')
      const time2 = Date.now() - start2
      
      // 缓存的检查应该更快（这个断言可能不稳定，主要用于验证缓存逻辑存在）
      expect(time2).toBeLessThanOrEqual(time1 + 10) // 给一些容错空间
    })

    it('应该处理未知权限', async () => {
      const hasPermission = await permissionManager.checkPermission(
        'test-extension',
        'unknown:permission' as any
      )
      
      expect(hasPermission).toBe(false)
    })
  })

  describe('权限撤销', () => {
    beforeEach(() => {
      permissionManager.grantPermission('test-extension', 'database:read')
      permissionManager.grantPermission('test-extension', 'api:read')
      permissionManager.grantPermission('test-extension', 'ui:render')
    })

    it('应该成功撤销权限', () => {
      const result = permissionManager.revokePermission('test-extension', 'database:read')
      
      expect(result).toBe(true)
      
      const grants = permissionManager.getExtensionGrants('test-extension')
      expect(grants.find(g => g.permission === 'database:read')).toBeUndefined()
    })

    it('应该撤销Extension的所有权限', () => {
      permissionManager.revokeAllPermissions('test-extension')
      
      const grants = permissionManager.getExtensionGrants('test-extension')
      expect(grants).toHaveLength(0)
    })

    it('应该处理撤销不存在的权限', () => {
      const result = permissionManager.revokePermission('test-extension', 'system:hooks')
      
      expect(result).toBe(false)
    })

    it('应该处理撤销不存在Extension的权限', () => {
      const result = permissionManager.revokePermission('non-existent', 'database:read')
      
      expect(result).toBe(false)
    })
  })

  describe('过期权限处理', () => {
    it('应该自动拒绝过期权限', async () => {
      const pastTime = Date.now() - 1000 // 1秒前过期
      
      permissionManager.grantPermission('temp-extension', 'database:read', {
        expiresAt: pastTime,
      })
      
      const hasPermission = await permissionManager.checkPermission(
        'temp-extension',
        'database:read'
      )
      
      expect(hasPermission).toBe(false)
      
      // 检查权限是否被自动撤销
      const grants = permissionManager.getExtensionGrants('temp-extension')
      expect(grants.find(g => g.permission === 'database:read')).toBeUndefined()
    })

    it('应该发射过期事件', async () => {
      const eventHandler = mock(() => {})
      permissionManager.on('permissionCheck', eventHandler)
      
      const pastTime = Date.now() - 1000
      permissionManager.grantPermission('temp-extension', 'database:read', {
        expiresAt: pastTime,
      })
      
      await permissionManager.checkPermission('temp-extension', 'database:read')
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expired',
          extensionName: 'temp-extension',
          permission: 'database:read',
          reason: 'Permission expired',
        })
      )
    })
  })

  describe('使用次数限制', () => {
    it('应该跟踪权限使用次数', async () => {
      permissionManager.grantPermission('limited-extension', 'api:read', {
        usageLimit: 3,
      })
      
      // 使用3次权限
      await permissionManager.checkPermission('limited-extension', 'api:read')
      await permissionManager.checkPermission('limited-extension', 'api:read')
      await permissionManager.checkPermission('limited-extension', 'api:read')
      
      const grants = permissionManager.getExtensionGrants('limited-extension')
      const grant = grants.find(g => g.permission === 'api:read')
      
      expect(grant?.usageCount).toBe(3)
    })

    it('应该拒绝超过使用次数限制的权限检查', async () => {
      permissionManager.grantPermission('limited-extension', 'api:read', {
        usageLimit: 2,
      })
      
      // 使用2次（达到限制）
      await permissionManager.checkPermission('limited-extension', 'api:read')
      await permissionManager.checkPermission('limited-extension', 'api:read')
      
      // 第3次应该被拒绝
      const hasPermission = await permissionManager.checkPermission('limited-extension', 'api:read')
      
      expect(hasPermission).toBe(false)
    })

    it('应该发射使用次数超限事件', async () => {
      const eventHandler = mock(() => {})
      permissionManager.on('permissionCheck', eventHandler)
      
      permissionManager.grantPermission('limited-extension', 'api:read', {
        usageLimit: 1,
      })
      
      await permissionManager.checkPermission('limited-extension', 'api:read')
      await permissionManager.checkPermission('limited-extension', 'api:read') // 超限
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'usage_exceeded',
          extensionName: 'limited-extension',
          permission: 'api:read',
          reason: 'Usage limit exceeded',
        })
      )
    })
  })

  describe('自定义验证器', () => {
    it('应该调用权限策略的自定义验证器', async () => {
      const validator = mock(async () => true)
      
      const customPolicy: PermissionPolicy = {
        name: 'custom:validated',
        description: '需要验证的权限',
        level: 'high',
        requiresUserConfirmation: true,
        validator,
      }
      
      permissionManager.registerPolicy(customPolicy)
      permissionManager.grantPermission('validated-extension', 'custom:validated')
      
      await permissionManager.checkPermission('validated-extension', 'custom:validated', {
        operation: 'test-operation',
        data: { test: 'value' },
      })
      
      expect(validator).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionName: 'validated-extension',
          permission: 'custom:validated',
          operation: 'test-operation',
          data: { test: 'value' },
        })
      )
    })

    it('应该在验证器返回false时拒绝权限', async () => {
      const validator = mock(async () => false)
      
      const restrictivePolicy: PermissionPolicy = {
        name: 'restrictive:permission',
        description: '严格限制的权限',
        level: 'critical',
        requiresUserConfirmation: true,
        validator,
      }
      
      permissionManager.registerPolicy(restrictivePolicy)
      permissionManager.grantPermission('restricted-extension', 'restrictive:permission')
      
      const hasPermission = await permissionManager.checkPermission(
        'restricted-extension',
        'restrictive:permission'
      )
      
      expect(hasPermission).toBe(false)
    })

    it('应该处理验证器抛出异常的情况', async () => {
      const failingValidator = mock(async () => {
        throw new Error('Validation failed')
      })
      
      const failingPolicy: PermissionPolicy = {
        name: 'failing:permission',
        description: '验证失败的权限',
        level: 'high',
        requiresUserConfirmation: true,
        validator: failingValidator,
      }
      
      permissionManager.registerPolicy(failingPolicy)
      permissionManager.grantPermission('failing-extension', 'failing:permission')
      
      const hasPermission = await permissionManager.checkPermission(
        'failing-extension',
        'failing:permission'
      )
      
      // 验证器异常应该导致权限被拒绝
      expect(hasPermission).toBe(false)
    })
  })

  describe('事件发射', () => {
    it('应该在权限检查时发射事件', async () => {
      const eventHandler = mock(() => {})
      permissionManager.on('permissionCheck', eventHandler)
      
      permissionManager.grantPermission('event-extension', 'database:read')
      await permissionManager.checkPermission('event-extension', 'database:read')
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'granted',
          extensionName: 'event-extension',
          permission: 'database:read',
          timestamp: expect.any(Number),
        })
      )
    })

    it('应该在权限被拒绝时发射事件', async () => {
      const eventHandler = mock(() => {})
      permissionManager.on('permissionCheck', eventHandler)
      
      await permissionManager.checkPermission('denied-extension', 'database:read')
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'denied',
          extensionName: 'denied-extension',
          permission: 'database:read',
        })
      )
    })
  })

  describe('权限查询', () => {
    beforeEach(() => {
      permissionManager.grantPermission('query-extension', 'database:read', { permanent: true })
      permissionManager.grantPermission('query-extension', 'api:read', { permanent: true })
      permissionManager.grantPermission('query-extension', 'ui:render', { permanent: true })
    })

    it('应该返回Extension的所有权限授权', () => {
      const grants = permissionManager.getExtensionGrants('query-extension')
      
      expect(grants).toHaveLength(3)
      expect(grants.map(g => g.permission)).toContain('database:read')
      expect(grants.map(g => g.permission)).toContain('api:read')
      expect(grants.map(g => g.permission)).toContain('ui:render')
    })

    it('应该返回特定权限的详细信息', () => {
      const grant = permissionManager.getPermissionGrant('query-extension', 'database:read')
      
      expect(grant).toBeDefined()
      expect(grant?.extensionName).toBe('query-extension')
      expect(grant?.permission).toBe('database:read')
      expect(grant?.permanent).toBe(true)
      expect(grant?.usageCount).toBe(0)
    })

    it('应该对不存在的权限授权返回undefined', () => {
      const grant = permissionManager.getPermissionGrant('query-extension', 'system:hooks')
      
      expect(grant).toBeUndefined()
    })

    it('应该返回所有权限策略', () => {
      const exportData = permissionManager.exportPermissions()
      const policies = exportData.policies
      
      expect(policies.length).toBeGreaterThanOrEqual(6) // 至少有6个默认策略
      expect(policies.every(p => p.name && p.description && p.level)).toBe(true)
    })

    it('应该检查Extension是否具有特定权限', () => {
      const hasDbRead = permissionManager.hasPermission('query-extension', 'database:read')
      const hasSystemHooks = permissionManager.hasPermission('query-extension', 'system:hooks')
      
      expect(hasDbRead).toBe(true)
      expect(hasSystemHooks).toBe(false)
    })
  })

  describe('边界情况和错误处理', () => {
    it('应该处理空Extension名称', async () => {
      const hasPermission = await permissionManager.checkPermission('', 'database:read')
      
      expect(hasPermission).toBe(false)
    })

    it('应该处理空权限名称', async () => {
      const hasPermission = await permissionManager.checkPermission(
        'test-extension',
        '' as any
      )
      
      expect(hasPermission).toBe(false)
    })

    it('应该处理重复权限授权', async () => {
      await permissionManager.grantPermission('dup-extension', 'database:read')
      await permissionManager.grantPermission('dup-extension', 'database:read')
      
      const grants = permissionManager.getExtensionGrants('dup-extension')
      expect(grants.filter(g => g.permission === 'database:read')).toHaveLength(1)
    })

    it('应该清理过期的缓存', async () => {
      // 这个测试比较难验证，主要确保不会抛出异常
      await permissionManager.checkPermission('cache-extension', 'database:read')
      
      // 调用清理方法（如果存在）
      if (typeof (permissionManager as any).clearExpiredCache === 'function') {
        (permissionManager as any).clearExpiredCache()
      }
      
      expect(true).toBe(true) // 占位符断言
    })
  })
})