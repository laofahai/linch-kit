/**
 * @linch-kit/auth 多设备会话管理器
 * 
 * 实现用户多设备会话管理功能
 * 支持设备识别、会话同步、设备限制等
 * 
 * @author LinchKit Team
 * @since 0.2.0
 */

import { v4 as uuidv4 } from 'uuid'
import { logger } from '@linch-kit/core/server'

import type { Session } from '../types'

/**
 * 设备信息
 */
export interface DeviceInfo {
  /** 设备ID */
  deviceId: string
  /** 设备类型 */
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  /** 设备名称 */
  deviceName?: string
  /** 用户代理 */
  userAgent: string
  /** IP地址 */
  ipAddress: string
  /** 设备指纹 */
  deviceFingerprint?: string
  /** 操作系统 */
  os?: string
  /** 浏览器 */
  browser?: string
  /** 首次登录时间 */
  firstSeenAt: Date
  /** 最后活动时间 */
  lastActiveAt: Date
  /** 是否可信设备 */
  trusted: boolean
}

/**
 * 设备会话
 */
export interface DeviceSession extends Session {
  /** 设备信息 */
  device: DeviceInfo
  /** 会话状态 */
  status: 'active' | 'inactive' | 'revoked'
  /** 位置信息 */
  location?: {
    country?: string
    city?: string
    latitude?: number
    longitude?: number
  }
}

/**
 * 多设备会话管理器配置
 */
export interface MultiDeviceSessionManagerConfig {
  /** 每个用户最大设备数 */
  maxDevicesPerUser: number
  /** 每个设备最大会话数 */
  maxSessionsPerDevice: number
  /** 不活跃会话超时时间（毫秒） */
  inactiveSessionTimeout: number
  /** 是否启用设备识别 */
  enableDeviceIdentification: boolean
  /** 是否启用位置跟踪 */
  enableLocationTracking: boolean
  /** 是否启用可信设备 */
  enableTrustedDevices: boolean
  /** 新设备登录是否需要验证 */
  requireVerificationForNewDevice: boolean
}

/**
 * 设备会话存储接口
 */
export interface DeviceSessionStorage {
  /**
   * 保存设备会话
   */
  saveDeviceSession(session: DeviceSession): Promise<void>
  
  /**
   * 获取用户的所有设备会话
   */
  getUserDeviceSessions(userId: string): Promise<DeviceSession[]>
  
  /**
   * 获取设备的所有会话
   */
  getDeviceSessions(deviceId: string): Promise<DeviceSession[]>
  
  /**
   * 获取特定会话
   */
  getDeviceSession(sessionId: string): Promise<DeviceSession | null>
  
  /**
   * 更新设备会话
   */
  updateDeviceSession(sessionId: string, updates: Partial<DeviceSession>): Promise<void>
  
  /**
   * 删除设备会话
   */
  deleteDeviceSession(sessionId: string): Promise<void>
  
  /**
   * 删除用户的所有设备会话
   */
  deleteUserDeviceSessions(userId: string): Promise<number>
  
  /**
   * 删除设备的所有会话
   */
  deleteDeviceSessions(deviceId: string): Promise<number>
  
  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): Promise<number>
  
  /**
   * 获取设备信息
   */
  getDeviceInfo(deviceId: string): Promise<DeviceInfo | null>
  
  /**
   * 保存设备信息
   */
  saveDeviceInfo(device: DeviceInfo): Promise<void>
  
  /**
   * 更新设备信息
   */
  updateDeviceInfo(deviceId: string, updates: Partial<DeviceInfo>): Promise<void>
}

/**
 * 内存设备会话存储实现
 */
export class InMemoryDeviceSessionStorage implements DeviceSessionStorage {
  private readonly deviceSessions = new Map<string, DeviceSession>()
  private readonly devices = new Map<string, DeviceInfo>()
  private readonly userDevices = new Map<string, Set<string>>() // userId -> Set<deviceId>
  private readonly deviceSessionIds = new Map<string, Set<string>>() // deviceId -> Set<sessionId>

  async saveDeviceSession(session: DeviceSession): Promise<void> {
    this.deviceSessions.set(session.id, session)
    
    // 更新设备会话映射
    if (!this.deviceSessionIds.has(session.device.deviceId)) {
      this.deviceSessionIds.set(session.device.deviceId, new Set())
    }
    this.deviceSessionIds.get(session.device.deviceId)!.add(session.id)
    
    // 更新用户设备映射
    if (!this.userDevices.has(session.userId)) {
      this.userDevices.set(session.userId, new Set())
    }
    this.userDevices.get(session.userId)!.add(session.device.deviceId)
  }

  async getUserDeviceSessions(userId: string): Promise<DeviceSession[]> {
    const sessions: DeviceSession[] = []
    
    for (const [, session] of this.deviceSessions.entries()) {
      if (session.userId === userId) {
        sessions.push(session)
      }
    }
    
    return sessions.sort((a, b) => b.lastAccessedAt!.getTime() - a.lastAccessedAt!.getTime())
  }

  async getDeviceSessions(deviceId: string): Promise<DeviceSession[]> {
    const sessionIds = this.deviceSessionIds.get(deviceId) || new Set()
    const sessions: DeviceSession[] = []
    
    for (const sessionId of sessionIds) {
      const session = this.deviceSessions.get(sessionId)
      if (session) {
        sessions.push(session)
      }
    }
    
    return sessions.sort((a, b) => b.lastAccessedAt!.getTime() - a.lastAccessedAt!.getTime())
  }

  async getDeviceSession(sessionId: string): Promise<DeviceSession | null> {
    return this.deviceSessions.get(sessionId) || null
  }

  async updateDeviceSession(sessionId: string, updates: Partial<DeviceSession>): Promise<void> {
    const session = this.deviceSessions.get(sessionId)
    if (session) {
      Object.assign(session, updates)
      this.deviceSessions.set(sessionId, session)
    }
  }

  async deleteDeviceSession(sessionId: string): Promise<void> {
    const session = this.deviceSessions.get(sessionId)
    if (session) {
      this.deviceSessions.delete(sessionId)
      
      // 清理设备会话映射
      const deviceSessionIds = this.deviceSessionIds.get(session.device.deviceId)
      if (deviceSessionIds) {
        deviceSessionIds.delete(sessionId)
        if (deviceSessionIds.size === 0) {
          this.deviceSessionIds.delete(session.device.deviceId)
        }
      }
    }
  }

  async deleteUserDeviceSessions(userId: string): Promise<number> {
    const sessions = await this.getUserDeviceSessions(userId)
    
    for (const session of sessions) {
      await this.deleteDeviceSession(session.id)
    }
    
    this.userDevices.delete(userId)
    return sessions.length
  }

  async deleteDeviceSessions(deviceId: string): Promise<number> {
    const sessions = await this.getDeviceSessions(deviceId)
    
    for (const session of sessions) {
      await this.deleteDeviceSession(session.id)
    }
    
    return sessions.length
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date()
    let cleanedCount = 0
    
    for (const [sessionId, session] of this.deviceSessions.entries()) {
      if (session.expiresAt < now || session.status === 'revoked') {
        await this.deleteDeviceSession(sessionId)
        cleanedCount++
      }
    }
    
    return cleanedCount
  }

  async getDeviceInfo(deviceId: string): Promise<DeviceInfo | null> {
    return this.devices.get(deviceId) || null
  }

  async saveDeviceInfo(device: DeviceInfo): Promise<void> {
    this.devices.set(device.deviceId, device)
  }

  async updateDeviceInfo(deviceId: string, updates: Partial<DeviceInfo>): Promise<void> {
    const device = this.devices.get(deviceId)
    if (device) {
      Object.assign(device, updates)
      this.devices.set(deviceId, device)
    }
  }
}

/**
 * 多设备会话管理器
 * 
 * 提供多设备会话管理功能：
 * - 设备识别和管理
 * - 会话创建和同步
 * - 设备限制和安全控制
 * - 可信设备管理
 */
export class MultiDeviceSessionManager {
  private readonly config: MultiDeviceSessionManagerConfig
  private readonly storage: DeviceSessionStorage

  constructor(config: Partial<MultiDeviceSessionManagerConfig> = {}, storage?: DeviceSessionStorage) {
    this.config = {
      maxDevicesPerUser: 10,
      maxSessionsPerDevice: 3,
      inactiveSessionTimeout: 30 * 60 * 1000, // 30分钟
      enableDeviceIdentification: true,
      enableLocationTracking: false,
      enableTrustedDevices: true,
      requireVerificationForNewDevice: true,
      ...config
    }
    
    this.storage = storage || new InMemoryDeviceSessionStorage()
  }

  /**
   * 创建设备会话
   */
  async createDeviceSession(options: {
    userId: string
    sessionId: string
    accessToken: string
    refreshToken?: string
    expiresAt: Date
    userAgent: string
    ipAddress: string
    deviceFingerprint?: string
    metadata?: Record<string, unknown>
  }): Promise<DeviceSession> {
    const deviceInfo = await this.identifyDevice(options)
    
    // 检查设备限制
    await this.enforceDeviceLimits(options.userId, deviceInfo.deviceId)
    
    // 检查新设备验证
    if (this.config.requireVerificationForNewDevice && !deviceInfo.trusted) {
      const existingDevice = await this.storage.getDeviceInfo(deviceInfo.deviceId)
      if (!existingDevice) {
        logger.warn('新设备尝试登录，可能需要验证', {
          service: 'multi-device-session-manager',
          userId: options.userId,
          deviceId: deviceInfo.deviceId,
          ipAddress: options.ipAddress
        })
      }
    }
    
    const deviceSession: DeviceSession = {
      id: options.sessionId,
      userId: options.userId,
      accessToken: options.accessToken,
      refreshToken: options.refreshToken,
      createdAt: new Date(),
      expiresAt: options.expiresAt,
      lastAccessedAt: new Date(),
      device: deviceInfo,
      status: 'active',
      metadata: options.metadata
    }
    
    await this.storage.saveDeviceSession(deviceSession)
    await this.storage.saveDeviceInfo(deviceInfo)
    
    logger.info('设备会话创建成功', {
      service: 'multi-device-session-manager',
      userId: options.userId,
      sessionId: options.sessionId,
      deviceId: deviceInfo.deviceId,
      deviceType: deviceInfo.deviceType
    })
    
    return deviceSession
  }

  /**
   * 获取用户的所有设备会话
   */
  async getUserDeviceSessions(userId: string): Promise<DeviceSession[]> {
    return await this.storage.getUserDeviceSessions(userId)
  }

  /**
   * 获取用户的设备列表
   */
  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    const sessions = await this.getUserDeviceSessions(userId)
    const deviceMap = new Map<string, DeviceInfo>()
    
    // 去重并获取最新的设备信息
    for (const session of sessions) {
      const existing = deviceMap.get(session.device.deviceId)
      if (!existing || session.lastAccessedAt! > existing.lastActiveAt) {
        deviceMap.set(session.device.deviceId, {
          ...session.device,
          lastActiveAt: session.lastAccessedAt!
        })
      }
    }
    
    return Array.from(deviceMap.values())
  }

  /**
   * 撤销设备会话
   */
  async revokeDeviceSession(sessionId: string, reason: string = 'user_request'): Promise<boolean> {
    const session = await this.storage.getDeviceSession(sessionId)
    if (!session) {
      return false
    }
    
    await this.storage.updateDeviceSession(sessionId, {
      status: 'revoked',
      metadata: {
        ...session.metadata,
        revokedAt: new Date(),
        revokedReason: reason
      }
    })
    
    logger.info('设备会话已撤销', {
      service: 'multi-device-session-manager',
      sessionId,
      userId: session.userId,
      deviceId: session.device.deviceId,
      reason
    })
    
    return true
  }

  /**
   * 撤销设备的所有会话
   */
  async revokeDeviceSessions(deviceId: string, reason: string = 'security'): Promise<number> {
    const sessions = await this.storage.getDeviceSessions(deviceId)
    let revokedCount = 0
    
    for (const session of sessions) {
      if (session.status === 'active') {
        await this.revokeDeviceSession(session.id, reason)
        revokedCount++
      }
    }
    
    logger.info('设备所有会话已撤销', {
      service: 'multi-device-session-manager',
      deviceId,
      revokedCount,
      reason
    })
    
    return revokedCount
  }

  /**
   * 撤销用户的所有设备会话
   */
  async revokeAllUserSessions(userId: string, reason: string = 'security'): Promise<number> {
    const sessions = await this.getUserDeviceSessions(userId)
    let revokedCount = 0
    
    for (const session of sessions) {
      if (session.status === 'active') {
        await this.revokeDeviceSession(session.id, reason)
        revokedCount++
      }
    }
    
    logger.info('用户所有设备会话已撤销', {
      service: 'multi-device-session-manager',
      userId,
      revokedCount,
      reason
    })
    
    return revokedCount
  }

  /**
   * 更新会话活动状态
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.storage.getDeviceSession(sessionId)
    if (session && session.status === 'active') {
      await this.storage.updateDeviceSession(sessionId, {
        lastAccessedAt: new Date()
      })
      
      // 更新设备最后活动时间
      await this.storage.updateDeviceInfo(session.device.deviceId, {
        lastActiveAt: new Date()
      })
    }
  }

  /**
   * 标记设备为可信
   */
  async markDeviceAsTrusted(deviceId: string): Promise<void> {
    await this.storage.updateDeviceInfo(deviceId, {
      trusted: true
    })
    
    logger.info('设备已标记为可信', {
      service: 'multi-device-session-manager',
      deviceId
    })
  }

  /**
   * 取消设备信任
   */
  async untrustDevice(deviceId: string): Promise<void> {
    await this.storage.updateDeviceInfo(deviceId, {
      trusted: false
    })
    
    logger.info('设备信任已取消', {
      service: 'multi-device-session-manager',
      deviceId
    })
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const cleanedCount = await this.storage.cleanupExpiredSessions()
    
    if (cleanedCount > 0) {
      logger.info('设备会话清理完成', {
        service: 'multi-device-session-manager',
        cleanedCount
      })
    }
    
    return cleanedCount
  }

  /**
   * 识别设备
   */
  private async identifyDevice(options: {
    userAgent: string
    ipAddress: string
    deviceFingerprint?: string
  }): Promise<DeviceInfo> {
    // 生成设备ID
    const deviceId = this.generateDeviceId(options.userAgent, options.ipAddress, options.deviceFingerprint)
    
    // 解析设备信息
    const deviceType = this.parseDeviceType(options.userAgent)
    const { os, browser } = this.parseUserAgent(options.userAgent)
    
    // 检查是否是已知设备
    const existingDevice = await this.storage.getDeviceInfo(deviceId)
    
    if (existingDevice) {
      return {
        ...existingDevice,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
        lastActiveAt: new Date()
      }
    }
    
    // 创建新设备信息
    const deviceInfo: DeviceInfo = {
      deviceId,
      deviceType,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
      deviceFingerprint: options.deviceFingerprint,
      os,
      browser,
      firstSeenAt: new Date(),
      lastActiveAt: new Date(),
      trusted: false
    }
    
    return deviceInfo
  }

  /**
   * 生成设备ID
   */
  private generateDeviceId(userAgent: string, ipAddress: string, deviceFingerprint?: string): string {
    const source = deviceFingerprint || `${userAgent}:${ipAddress}`
    return Buffer.from(source).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
  }

  /**
   * 解析设备类型
   */
  private parseDeviceType(userAgent: string): DeviceInfo['deviceType'] {
    const ua = userAgent.toLowerCase()
    
    // 先检查iPad（在mobile检查之前）
    if (ua.includes('ipad')) {
      return 'tablet'
    }
    
    // 检查其他平板设备
    if (ua.includes('tablet')) {
      return 'tablet'
    }
    
    // 检查手机设备
    if (ua.includes('mobile') || ua.includes('phone') || ua.includes('iphone')) {
      return 'mobile'
    }
    
    // 检查桌面设备
    if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      return 'desktop'
    }
    
    return 'unknown'
  }

  /**
   * 解析用户代理
   */
  private parseUserAgent(userAgent: string): { os?: string; browser?: string } {
    const ua = userAgent.toLowerCase()
    
    let os: string | undefined
    let browser: string | undefined
    
    // 检测操作系统（顺序很重要）
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      os = 'iOS'
    } else if (ua.includes('android')) {
      os = 'Android'
    } else if (ua.includes('windows')) {
      os = 'Windows'
    } else if (ua.includes('mac os x') || ua.includes('macos')) {
      os = 'macOS'
    } else if (ua.includes('linux')) {
      os = 'Linux'
    }
    
    // 检测浏览器（顺序很重要，因为有些浏览器包含其他浏览器的标识）
    if (ua.includes('edg/') || ua.includes('edge/')) {
      browser = 'Edge'
    } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
      browser = 'Chrome'
    } else if (ua.includes('firefox/')) {
      browser = 'Firefox'
    } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
      browser = 'Safari'
    }
    
    return { os, browser }
  }

  /**
   * 强制执行设备限制
   */
  private async enforceDeviceLimits(userId: string, _deviceId: string): Promise<void> {
    const deviceSessions = await this.storage.getDeviceSessions(_deviceId)
    
    // 检查每个设备的会话限制
    const activeDeviceSessions = deviceSessions.filter(s => s.status === 'active')
    if (activeDeviceSessions.length >= this.config.maxSessionsPerDevice) {
      // 撤销最旧的会话
      const sessionsToRevoke = activeDeviceSessions
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, activeDeviceSessions.length - this.config.maxSessionsPerDevice + 1)
      
      for (const session of sessionsToRevoke) {
        await this.revokeDeviceSession(session.id, 'device_limit_exceeded')
      }
    }
    
    // 检查每个用户的设备限制
    const userDevices = await this.getUserDevices(userId)
    if (userDevices.length >= this.config.maxDevicesPerUser) {
      // 移除最旧的设备会话
      const devicesToRemove = userDevices
        .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime())
        .slice(0, userDevices.length - this.config.maxDevicesPerUser + 1)
      
      for (const device of devicesToRemove) {
        await this.revokeDeviceSessions(device.deviceId, 'user_device_limit_exceeded')
      }
    }
  }
}

/**
 * 创建多设备会话管理器实例
 */
export function createMultiDeviceSessionManager(
  config?: Partial<MultiDeviceSessionManagerConfig>,
  storage?: DeviceSessionStorage
): MultiDeviceSessionManager {
  return new MultiDeviceSessionManager(config, storage)
}

/**
 * 默认多设备会话管理器配置
 */
export const defaultMultiDeviceSessionManagerConfig: MultiDeviceSessionManagerConfig = {
  maxDevicesPerUser: 10,
  maxSessionsPerDevice: 3,
  inactiveSessionTimeout: 30 * 60 * 1000, // 30分钟
  enableDeviceIdentification: true,
  enableLocationTracking: false,
  enableTrustedDevices: true,
  requireVerificationForNewDevice: true
}