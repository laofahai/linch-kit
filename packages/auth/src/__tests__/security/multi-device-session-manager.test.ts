/**
 * @linch-kit/auth 多设备会话管理器测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { 
  MultiDeviceSessionManager, 
  InMemoryDeviceSessionStorage,
  type DeviceSession,
  type DeviceInfo 
} from '../../security/multi-device-session-manager'

describe('MultiDeviceSessionManager', () => {
  let sessionManager: MultiDeviceSessionManager
  let storage: InMemoryDeviceSessionStorage

  beforeEach(() => {
    storage = new InMemoryDeviceSessionStorage()
    sessionManager = new MultiDeviceSessionManager({
      maxDevicesPerUser: 3,
      maxSessionsPerDevice: 2,
      inactiveSessionTimeout: 30 * 60 * 1000,
      enableDeviceIdentification: true,
      enableLocationTracking: false,
      enableTrustedDevices: true,
      requireVerificationForNewDevice: false
    }, storage)
  })

  describe('createDeviceSession', () => {
    it('应该成功创建设备会话', async () => {
      const options = {
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        refreshToken: 'refresh-123',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'device-fingerprint-123'
      }

      const deviceSession = await sessionManager.createDeviceSession(options)

      expect(deviceSession.id).toBe(options.sessionId)
      expect(deviceSession.userId).toBe(options.userId)
      expect(deviceSession.accessToken).toBe(options.accessToken)
      expect(deviceSession.refreshToken).toBe(options.refreshToken)
      expect(deviceSession.status).toBe('active')
      expect(deviceSession.device.deviceType).toBe('desktop')
      expect(deviceSession.device.trusted).toBe(false)
      expect(deviceSession.device.os).toBe('Windows')
      expect(deviceSession.device.browser).toBe('Chrome')
    })

    it('应该正确识别移动设备', async () => {
      const options = {
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        ipAddress: '192.168.1.2'
      }

      const deviceSession = await sessionManager.createDeviceSession(options)

      expect(deviceSession.device.deviceType).toBe('mobile')
      expect(deviceSession.device.os).toBe('iOS')
      expect(deviceSession.device.browser).toBe('Safari')
    })

    it('应该正确识别平板设备', async () => {
      const options = {
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        ipAddress: '192.168.1.3'
      }

      const deviceSession = await sessionManager.createDeviceSession(options)

      expect(deviceSession.device.deviceType).toBe('tablet')
      expect(deviceSession.device.os).toBe('iOS')
    })

    it('应该为相同设备复用设备ID', async () => {
      const baseOptions = {
        userId: 'user-123',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'same-device-fingerprint'
      }

      const session1 = await sessionManager.createDeviceSession({
        ...baseOptions,
        sessionId: 'session-1'
      })

      const session2 = await sessionManager.createDeviceSession({
        ...baseOptions,
        sessionId: 'session-2'
      })

      expect(session1.device.deviceId).toBe(session2.device.deviceId)
    })
  })

  describe('getUserDeviceSessions', () => {
    it('应该返回用户的所有设备会话', async () => {
      const userId = 'user-123'
      
      // 创建多个设备会话
      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Safari Mobile',
        ipAddress: '192.168.1.2'
      })

      const sessions = await sessionManager.getUserDeviceSessions(userId)

      expect(sessions).toHaveLength(2)
      expect(sessions.some(s => s.id === 'session-1')).toBe(true)
      expect(sessions.some(s => s.id === 'session-2')).toBe(true)
    })

    it('应该按最后访问时间排序', async () => {
      const userId = 'user-123'
      
      const session1 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      // 等待1毫秒确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 1))

      const session2 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Safari Mobile',
        ipAddress: '192.168.1.2'
      })

      const sessions = await sessionManager.getUserDeviceSessions(userId)

      expect(sessions[0].id).toBe('session-2') // 最新的会话应该排在前面
      expect(sessions[1].id).toBe('session-1')
    })
  })

  describe('getUserDevices', () => {
    it('应该返回用户的设备列表', async () => {
      const userId = 'user-123'
      
      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Safari Mobile',
        ipAddress: '192.168.1.2'
      })

      const devices = await sessionManager.getUserDevices(userId)

      expect(devices).toHaveLength(2)
      expect(devices.some(d => d.deviceType === 'desktop')).toBe(true)
      expect(devices.some(d => d.deviceType === 'mobile')).toBe(true)
    })

    it('应该去重相同设备', async () => {
      const userId = 'user-123'
      
      // 相同设备的多个会话
      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'same-device'
      })

      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'same-device'
      })

      const devices = await sessionManager.getUserDevices(userId)

      expect(devices).toHaveLength(1)
      expect(devices[0].deviceType).toBe('desktop')
    })
  })

  describe('revokeDeviceSession', () => {
    it('应该成功撤销设备会话', async () => {
      const session = await sessionManager.createDeviceSession({
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      const result = await sessionManager.revokeDeviceSession(session.id)

      expect(result).toBe(true)
      
      const revokedSession = await storage.getDeviceSession(session.id)
      expect(revokedSession?.status).toBe('revoked')
    })

    it('应该在会话不存在时返回false', async () => {
      const result = await sessionManager.revokeDeviceSession('non-existent-session')
      expect(result).toBe(false)
    })
  })

  describe('revokeDeviceSessions', () => {
    it('应该撤销设备的所有会话', async () => {
      const userId = 'user-123'
      const deviceFingerprint = 'device-123'
      
      // 同一设备的多个会话
      const session1 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint
      })

      const session2 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint
      })

      const revokedCount = await sessionManager.revokeDeviceSessions(session1.device.deviceId)

      expect(revokedCount).toBe(2)
      
      const revokedSession1 = await storage.getDeviceSession(session1.id)
      const revokedSession2 = await storage.getDeviceSession(session2.id)
      
      expect(revokedSession1?.status).toBe('revoked')
      expect(revokedSession2?.status).toBe('revoked')
    })
  })

  describe('revokeAllUserSessions', () => {
    it('应该撤销用户的所有设备会话', async () => {
      const userId = 'user-123'
      
      const session1 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      const session2 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Safari Mobile',
        ipAddress: '192.168.1.2'
      })

      const revokedCount = await sessionManager.revokeAllUserSessions(userId)

      expect(revokedCount).toBe(2)
      
      const revokedSession1 = await storage.getDeviceSession(session1.id)
      const revokedSession2 = await storage.getDeviceSession(session2.id)
      
      expect(revokedSession1?.status).toBe('revoked')
      expect(revokedSession2?.status).toBe('revoked')
    })
  })

  describe('updateSessionActivity', () => {
    it('应该更新会话活动状态', async () => {
      const session = await sessionManager.createDeviceSession({
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      const originalAccessTime = session.lastAccessedAt!

      // 等待一段时间确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 1))

      await sessionManager.updateSessionActivity(session.id)

      const updatedSession = await storage.getDeviceSession(session.id)
      expect(updatedSession?.lastAccessedAt!.getTime()).toBeGreaterThan(originalAccessTime.getTime())
    })
  })

  describe('markDeviceAsTrusted', () => {
    it('应该标记设备为可信', async () => {
      const session = await sessionManager.createDeviceSession({
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      expect(session.device.trusted).toBe(false)

      await sessionManager.markDeviceAsTrusted(session.device.deviceId)

      const deviceInfo = await storage.getDeviceInfo(session.device.deviceId)
      expect(deviceInfo?.trusted).toBe(true)
    })
  })

  describe('untrustDevice', () => {
    it('应该取消设备信任', async () => {
      const session = await sessionManager.createDeviceSession({
        userId: 'user-123',
        sessionId: 'session-456',
        accessToken: 'token-789',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      // 先标记为可信
      await sessionManager.markDeviceAsTrusted(session.device.deviceId)
      
      let deviceInfo = await storage.getDeviceInfo(session.device.deviceId)
      expect(deviceInfo?.trusted).toBe(true)

      // 取消信任
      await sessionManager.untrustDevice(session.device.deviceId)

      deviceInfo = await storage.getDeviceInfo(session.device.deviceId)
      expect(deviceInfo?.trusted).toBe(false)
    })
  })

  describe('设备和会话限制', () => {
    it('应该强制执行每个设备的会话限制', async () => {
      const userId = 'user-123'
      const deviceFingerprint = 'limited-device'
      
      // 创建超过限制的会话数
      const session1 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint
      })

      const session2 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint
      })

      // 第三个会话应该导致第一个会话被撤销
      const session3 = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-3',
        accessToken: 'token-3',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint
      })

      const deviceSessions = await storage.getDeviceSessions(session1.device.deviceId)
      const activeSessions = deviceSessions.filter(s => s.status === 'active')
      
      expect(activeSessions).toHaveLength(2) // 只有最后两个会话应该是活跃的
    })

    it('应该强制执行每个用户的设备限制', async () => {
      const userId = 'user-123'
      
      // 创建超过限制的设备数
      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-1',
        accessToken: 'token-1',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'device-1'
      })

      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-2',
        accessToken: 'token-2',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Safari Mobile',
        ipAddress: '192.168.1.2',
        deviceFingerprint: 'device-2'
      })

      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-3',
        accessToken: 'token-3',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Firefox Desktop',
        ipAddress: '192.168.1.3',
        deviceFingerprint: 'device-3'
      })

      // 第四个设备应该导致第一个设备的会话被撤销
      await sessionManager.createDeviceSession({
        userId,
        sessionId: 'session-4',
        accessToken: 'token-4',
        expiresAt: new Date(Date.now() + 60000),
        userAgent: 'Edge Desktop',
        ipAddress: '192.168.1.4',
        deviceFingerprint: 'device-4'
      })

      const userSessions = await sessionManager.getUserDeviceSessions(userId)
      const activeSessions = userSessions.filter(s => s.status === 'active')
      
      expect(activeSessions).toHaveLength(3) // 只有最后三个设备的会话应该是活跃的
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('应该清理过期的会话', async () => {
      const userId = 'user-123'
      
      // 创建过期会话
      const expiredSession = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'expired-session',
        accessToken: 'token-expired',
        expiresAt: new Date(Date.now() - 1000), // 1秒前过期
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1'
      })

      // 创建有效会话
      const validSession = await sessionManager.createDeviceSession({
        userId,
        sessionId: 'valid-session',
        accessToken: 'token-valid',
        expiresAt: new Date(Date.now() + 60000), // 1分钟后过期
        userAgent: 'Safari Mobile',
        ipAddress: '192.168.1.2'
      })

      const cleanedCount = await sessionManager.cleanupExpiredSessions()

      expect(cleanedCount).toBe(1)
      
      const remainingSession = await storage.getDeviceSession(validSession.id)
      const removedSession = await storage.getDeviceSession(expiredSession.id)
      
      expect(remainingSession).toBeTruthy()
      expect(removedSession).toBeNull()
    })
  })
})

describe('InMemoryDeviceSessionStorage', () => {
  let storage: InMemoryDeviceSessionStorage

  beforeEach(() => {
    storage = new InMemoryDeviceSessionStorage()
  })

  describe('基本存储操作', () => {
    it('应该保存和获取设备会话', async () => {
      const deviceSession: DeviceSession = {
        id: 'session-123',
        userId: 'user-456',
        accessToken: 'token-789',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        lastAccessedAt: new Date(),
        device: {
          deviceId: 'device-123',
          deviceType: 'desktop',
          userAgent: 'Chrome Desktop',
          ipAddress: '192.168.1.1',
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
          trusted: false
        },
        status: 'active'
      }

      await storage.saveDeviceSession(deviceSession)
      const retrieved = await storage.getDeviceSession(deviceSession.id)

      expect(retrieved).toEqual(deviceSession)
    })

    it('应该获取用户的所有设备会话', async () => {
      const userId = 'user-123'
      
      const session1: DeviceSession = {
        id: 'session-1',
        userId,
        accessToken: 'token-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        lastAccessedAt: new Date(),
        device: {
          deviceId: 'device-1',
          deviceType: 'desktop',
          userAgent: 'Chrome Desktop',
          ipAddress: '192.168.1.1',
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
          trusted: false
        },
        status: 'active'
      }

      const session2: DeviceSession = {
        id: 'session-2',
        userId,
        accessToken: 'token-2',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        lastAccessedAt: new Date(),
        device: {
          deviceId: 'device-2',
          deviceType: 'mobile',
          userAgent: 'Safari Mobile',
          ipAddress: '192.168.1.2',
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
          trusted: false
        },
        status: 'active'
      }

      await storage.saveDeviceSession(session1)
      await storage.saveDeviceSession(session2)

      const userSessions = await storage.getUserDeviceSessions(userId)
      expect(userSessions).toHaveLength(2)
    })

    it('应该删除设备会话', async () => {
      const deviceSession: DeviceSession = {
        id: 'session-123',
        userId: 'user-456',
        accessToken: 'token-789',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        lastAccessedAt: new Date(),
        device: {
          deviceId: 'device-123',
          deviceType: 'desktop',
          userAgent: 'Chrome Desktop',
          ipAddress: '192.168.1.1',
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
          trusted: false
        },
        status: 'active'
      }

      await storage.saveDeviceSession(deviceSession)
      expect(await storage.getDeviceSession(deviceSession.id)).toBeTruthy()

      await storage.deleteDeviceSession(deviceSession.id)
      expect(await storage.getDeviceSession(deviceSession.id)).toBeNull()
    })
  })

  describe('设备信息管理', () => {
    it('应该保存和获取设备信息', async () => {
      const deviceInfo: DeviceInfo = {
        deviceId: 'device-123',
        deviceType: 'desktop',
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        firstSeenAt: new Date(),
        lastActiveAt: new Date(),
        trusted: false,
        os: 'Windows',
        browser: 'Chrome'
      }

      await storage.saveDeviceInfo(deviceInfo)
      const retrieved = await storage.getDeviceInfo(deviceInfo.deviceId)

      expect(retrieved).toEqual(deviceInfo)
    })

    it('应该更新设备信息', async () => {
      const deviceInfo: DeviceInfo = {
        deviceId: 'device-123',
        deviceType: 'desktop',
        userAgent: 'Chrome Desktop',
        ipAddress: '192.168.1.1',
        firstSeenAt: new Date(),
        lastActiveAt: new Date(),
        trusted: false
      }

      await storage.saveDeviceInfo(deviceInfo)
      
      const updates = {
        trusted: true,
        lastActiveAt: new Date(Date.now() + 1000)
      }
      
      await storage.updateDeviceInfo(deviceInfo.deviceId, updates)
      
      const updated = await storage.getDeviceInfo(deviceInfo.deviceId)
      expect(updated?.trusted).toBe(true)
      expect(updated?.lastActiveAt).toEqual(updates.lastActiveAt)
    })
  })
})