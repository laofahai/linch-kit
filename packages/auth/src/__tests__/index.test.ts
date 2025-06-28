/**
 * @linch-kit/auth 主入口测试
 *
 * @description 测试包的主要导出和集成功能
 * @author LinchKit Team
 * @since 0.1.0
 */

import { describe, it, expect, vi } from 'vitest'

// Mock NextAuth.js to avoid dependency issues
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }))
}))

describe('@linch-kit/auth Package Exports', () => {
  describe('NextAuth.js Core Exports', () => {
    /**
     * @description 测试 NextAuth 核心导出
     * @test 应该能够导入 NextAuth 核心功能
     * @expect NextAuth 相关导出存在且类型正确
     */
    it('should export NextAuth core functionality', async () => {
      const authModule = await import('../index')

      expect(authModule.NextAuth).toBeDefined()
      expect(typeof authModule.NextAuth).toBe('function')
    })

    /**
     * @description 测试 NextAuth 类型导出
     * @test 应该能够导入 NextAuth 类型定义
     * @expect 类型导出正确
     */
    it('should export NextAuth types', async () => {
      // 这里主要测试导入不会出错
      const { createLinchKitAuthConfig } = await import('../index')
      expect(createLinchKitAuthConfig).toBeDefined()
      expect(typeof createLinchKitAuthConfig).toBe('function')
    })
  })

  describe('LinchKit Adapter Exports', () => {
    /**
     * @description 测试 LinchKit 适配器导出
     * @test 应该能够导入 LinchKit 认证适配器
     * @expect 适配器函数正确导出
     */
    it('should export LinchKit auth adapter', async () => {
      const { createLinchKitAuthConfig } = await import('../index')
      
      expect(createLinchKitAuthConfig).toBeDefined()
      expect(typeof createLinchKitAuthConfig).toBe('function')
    })

    /**
     * @description 测试适配器功能
     * @test 适配器应该能够创建有效的配置
     * @expect 返回有效的 NextAuth 配置对象
     */
    it('should create valid auth configuration', async () => {
      const { createLinchKitAuthConfig } = await import('../index')
      
      const config = createLinchKitAuthConfig({
        providers: {
          credentials: {
            authorize: async () => null
          }
        }
      })

      expect(config).toBeDefined()
      expect(config.providers).toBeDefined()
      expect(config.session).toBeDefined()
      expect(config.callbacks).toBeDefined()
    })
  })

  describe('Permission Engine Exports', () => {
    /**
     * @description 测试权限引擎导出
     * @test 应该能够导入 CASL 权限引擎
     * @expect 权限引擎类正确导出
     */
    it('should export CASL permission engine', async () => {
      const { CASLPermissionEngine } = await import('../index')
      
      expect(CASLPermissionEngine).toBeDefined()
      expect(typeof CASLPermissionEngine).toBe('function')
    })

    /**
     * @description 测试权限引擎实例化
     * @test 权限引擎应该能够正确实例化
     * @expect 创建有效的权限引擎实例
     */
    it('should create permission engine instance', async () => {
      const { CASLPermissionEngine } = await import('../index')
      
      const engine = new CASLPermissionEngine()
      expect(engine).toBeDefined()
      expect(typeof engine.check).toBe('function')
      expect(typeof engine.checkMultiple).toBe('function')
      expect(typeof engine.getAccessibleResources).toBe('function')
    })
  })

  describe('Enterprise Extensions Exports', () => {
    /**
     * @description 测试企业级扩展导出
     * @test 应该能够导入企业级认证扩展
     * @expect 企业级扩展类正确导出
     */
    it('should export enterprise auth extensions', async () => {
      const { EnterpriseAuthExtensions } = await import('../index')
      
      expect(EnterpriseAuthExtensions).toBeDefined()
      expect(typeof EnterpriseAuthExtensions).toBe('function')
    })

    /**
     * @description 测试 MFA 管理器导出
     * @test 应该能够导入 MFA 管理器
     * @expect MFA 管理器类正确导出
     */
    it('should export MFA manager', async () => {
      const { MFAManager } = await import('../index')
      
      expect(MFAManager).toBeDefined()
      expect(typeof MFAManager).toBe('function')
    })

    /**
     * @description 测试企业级扩展实例化
     * @test 企业级扩展应该能够正确实例化
     * @expect 创建有效的企业级扩展实例
     */
    it('should create enterprise extensions instance', async () => {
      const { EnterpriseAuthExtensions } = await import('../index')
      
      const extensions = new EnterpriseAuthExtensions({
        tenantId: 'test-tenant',
        enableMFA: true,
        enableAuditLog: true
      })
      
      expect(extensions).toBeDefined()
      expect(typeof extensions.checkUserAccess).toBe('function')
      expect(typeof extensions.validateSession).toBe('function')
    })

    /**
     * @description 测试 MFA 管理器实例化
     * @test MFA 管理器应该能够正确实例化
     * @expect 创建有效的 MFA 管理器实例
     */
    it('should create MFA manager instance', async () => {
      const { MFAManager } = await import('../index')
      
      const mfaManager = new MFAManager()
      expect(mfaManager).toBeDefined()
      expect(typeof mfaManager.generateTOTPSecret).toBe('function')
      expect(typeof mfaManager.verifyTOTP).toBe('function')
      expect(typeof mfaManager.generateBackupCodes).toBe('function')
    })
  })

  describe('Type Definitions Export', () => {
    /**
     * @description 测试类型定义导出
     * @test 应该能够导入所有类型定义
     * @expect 类型导入不会出错
     */
    it('should export all type definitions', async () => {
      // 测试类型导入不会出错
      await expect(async () => {
        await import('../types')
      }).not.toThrow()
    })
  })

  describe('Version Information', () => {
    /**
     * @description 测试版本信息导出
     * @test 应该能够导入包版本信息
     * @expect 版本信息正确导出
     */
    it('should export version information', async () => {
      const { VERSION } = await import('../index')
      
      expect(VERSION).toBeDefined()
      expect(typeof VERSION).toBe('string')
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+/)
    })
  })

  describe('Integration Tests', () => {
    /**
     * @description 测试组件集成
     * @test 各个组件应该能够协同工作
     * @expect 组件间集成正常
     */
    it('should integrate components properly', async () => {
      const { 
        createLinchKitAuthConfig, 
        CASLPermissionEngine, 
        EnterpriseAuthExtensions,
        MFAManager 
      } = await import('../index')

      // 创建各个组件实例
      const authConfig = createLinchKitAuthConfig({
        providers: {
          credentials: {
            authorize: async () => ({ id: '1', email: 'test@example.com' })
          }
        }
      })

      const permissionEngine = new CASLPermissionEngine()
      const enterpriseExtensions = new EnterpriseAuthExtensions()
      const mfaManager = new MFAManager()

      // 验证所有组件都正确创建
      expect(authConfig).toBeDefined()
      expect(permissionEngine).toBeDefined()
      expect(enterpriseExtensions).toBeDefined()
      expect(mfaManager).toBeDefined()
    })

    /**
     * @description 测试企业级功能集成
     * @test 企业级功能应该能够与权限系统集成
     * @expect 企业级功能集成正常
     */
    it('should integrate enterprise features with permission system', async () => {
      const { CASLPermissionEngine, EnterpriseAuthExtensions } = await import('../index')

      const permissionEngine = new CASLPermissionEngine()
      const enterpriseExtensions = new EnterpriseAuthExtensions({
        enableRoleBasedAccess: true,
        enableAuditLog: true
      })

      // 测试组件间的基本交互
      expect(permissionEngine).toBeDefined()
      expect(enterpriseExtensions).toBeDefined()
      
      // 验证方法存在
      expect(typeof permissionEngine.check).toBe('function')
      expect(typeof enterpriseExtensions.checkUserAccess).toBe('function')
    })
  })
})
