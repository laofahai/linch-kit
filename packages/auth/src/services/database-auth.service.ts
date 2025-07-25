/**
 * 数据库认证服务 - LinchKit Auth 包版本
 * 
 * 实现真实的数据库用户认证、注册、验证功能
 * 集成到 @linch-kit/auth 的认证基础设施中
 */

import { hash, compare } from 'bcryptjs'
import { logger } from '@linch-kit/core/server'

import type { LinchKitUser, AuthRequest as _AuthRequest, AuthResult as _AuthResult, IAuthService as _IAuthService } from '../types'

/**
 * 数据库接口抽象
 * 支持不同的数据库实现 (Prisma, Drizzle 等)
 */
export interface IDatabaseAdapter {
  /**
   * 通过邮箱查找用户
   */
  findUserByEmail(email: string): Promise<DatabaseUser | null>
  
  /**
   * 通过ID查找用户
   */
  findUserById(userId: string): Promise<DatabaseUser | null>
  
  /**
   * 创建新用户
   */
  createUser(userData: CreateUserData): Promise<DatabaseUser>
  
  /**
   * 更新用户最后登录时间
   */
  updateLastLogin(userId: string): Promise<void>
  
  /**
   * 创建认证会话记录
   */
  createAuthSession(sessionData: CreateSessionData): Promise<void>
  
  /**
   * 撤销认证会话
   */
  revokeAuthSession(sessionId: string): Promise<boolean>
  
  /**
   * 验证会话有效性
   */
  validateSession(sessionId: string): Promise<boolean>
}

/**
 * 数据库用户类型
 */
export interface DatabaseUser {
  id: string
  email: string
  name: string | null
  status: string
  tenantId: string | null
  metadata: any
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

/**
 * 创建用户数据类型
 */
export interface CreateUserData {
  email: string
  name?: string
  passwordHash: string
  metadata?: any
}

/**
 * 创建会话数据类型
 */
export interface CreateSessionData {
  userId: string
  userEmail: string
  sessionId: string
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  deviceInfo?: any
}

/**
 * 数据库认证服务配置
 */
export interface DatabaseAuthServiceConfig {
  /**
   * 数据库适配器
   */
  databaseAdapter: IDatabaseAdapter
  
  /**
   * 密码哈希轮数 (默认: 12)
   */
  saltRounds?: number
  
  /**
   * 是否启用会话记录 (默认: true)
   */
  enableSessionTracking?: boolean
}

/**
 * 数据库认证服务
 * 
 * 提供基于数据库的用户认证功能：
 * - 用户注册和密码哈希
 * - 用户登录和凭据验证
 * - 会话管理和追踪
 * - 与现有 JWT 服务集成
 */
export class DatabaseAuthService {
  private readonly config: Required<DatabaseAuthServiceConfig>

  constructor(config: DatabaseAuthServiceConfig) {
    this.config = {
      saltRounds: 12,
      enableSessionTracking: true,
      ...config
    }
  }

  /**
   * 用户注册
   */
  async register(email: string, password: string, name?: string): Promise<{ success: boolean; user?: LinchKitUser; error?: string }> {
    try {
      logger.info('用户注册开始', {
        service: 'database-auth-service',
        email: email.slice(0, 3) + '***',
        hasName: !!name
      })

      // 检查用户是否已存在
      const existingUser = await this.config.databaseAdapter.findUserByEmail(email)
      if (existingUser) {
        logger.warn('用户注册失败 - 邮箱已存在', {
          service: 'database-auth-service',
          email: email.slice(0, 3) + '***'
        })
        return {
          success: false,
          error: '该邮箱已被注册'
        }
      }

      // 对密码进行哈希处理
      const passwordHash = await hash(password, this.config.saltRounds)

      // 创建用户数据
      const createUserData: CreateUserData = {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        metadata: {
          registrationMethod: 'email',
          registeredAt: new Date().toISOString()
        }
      }

      // 创建用户
      const user = await this.config.databaseAdapter.createUser(createUserData)

      logger.info('用户注册成功', {
        service: 'database-auth-service',
        userId: user.id,
        email: email.slice(0, 3) + '***'
      })

      return {
        success: true,
        user: this.mapDatabaseUserToLinchKitUser(user)
      }
    } catch (error) {
      logger.error('用户注册失败', error instanceof Error ? error : undefined, {
        service: 'database-auth-service',
        email: email.slice(0, 3) + '***'
      })
      return {
        success: false,
        error: '注册失败，请稍后再试'
      }
    }
  }

  /**
   * 验证用户凭据
   */
  async validateCredentials(email: string, password: string): Promise<LinchKitUser | null> {
    try {
      logger.info('用户凭据验证开始', {
        service: 'database-auth-service',
        email: email.slice(0, 3) + '***'
      })

      // 查找用户
      const user = await this.config.databaseAdapter.findUserByEmail(email)
      if (!user) {
        logger.warn('用户登录失败 - 用户不存在', {
          service: 'database-auth-service',
          email: email.slice(0, 3) + '***'
        })
        return null
      }

      // 检查用户状态
      if (user.status !== 'active') {
        logger.warn('用户登录失败 - 账户已停用', {
          service: 'database-auth-service',
          userId: user.id,
          status: user.status
        })
        return null
      }

      // 验证密码
      const passwordHash = user.metadata?.passwordHash
      if (!passwordHash) {
        logger.warn('用户登录失败 - 密码哈希不存在', {
          service: 'database-auth-service',
          userId: user.id
        })
        return null
      }

      const isPasswordValid = await compare(password, passwordHash)
      if (!isPasswordValid) {
        logger.warn('用户登录失败 - 密码错误', {
          service: 'database-auth-service',
          userId: user.id
        })
        return null
      }

      // 更新最后登录时间
      await this.config.databaseAdapter.updateLastLogin(user.id)

      logger.info('用户凭据验证成功', {
        service: 'database-auth-service',
        userId: user.id
      })

      return this.mapDatabaseUserToLinchKitUser(user)
    } catch (error) {
      logger.error('用户凭据验证失败', error instanceof Error ? error : undefined, {
        service: 'database-auth-service',
        email: email.slice(0, 3) + '***'
      })
      return null
    }
  }

  /**
   * 通过ID获取用户
   */
  async getUserById(userId: string): Promise<LinchKitUser | null> {
    try {
      const user = await this.config.databaseAdapter.findUserById(userId)
      if (!user) {
        return null
      }

      return this.mapDatabaseUserToLinchKitUser(user)
    } catch (error) {
      logger.error('通过ID获取用户失败', error instanceof Error ? error : undefined, {
        service: 'database-auth-service',
        userId
      })
      return null
    }
  }

  /**
   * 创建认证会话记录
   */
  async createAuthSession(userId: string, sessionId: string, accessToken: string, refreshToken?: string): Promise<void> {
    if (!this.config.enableSessionTracking) {
      return
    }

    try {
      const user = await this.config.databaseAdapter.findUserById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      const sessionData: CreateSessionData = {
        userId,
        userEmail: user.email,
        sessionId,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15分钟
        deviceInfo: {
          type: 'web',
          platform: 'linchkit-auth'
        }
      }

      await this.config.databaseAdapter.createAuthSession(sessionData)

      logger.info('认证会话创建成功', {
        service: 'database-auth-service',
        userId,
        sessionId
      })
    } catch (error) {
      logger.error('认证会话创建失败', error instanceof Error ? error : undefined, {
        service: 'database-auth-service',
        userId,
        sessionId
      })
      throw error
    }
  }

  /**
   * 撤销认证会话
   */
  async revokeAuthSession(sessionId: string): Promise<boolean> {
    if (!this.config.enableSessionTracking) {
      return true
    }

    try {
      const success = await this.config.databaseAdapter.revokeAuthSession(sessionId)

      if (success) {
        logger.info('认证会话撤销成功', {
          service: 'database-auth-service',
          sessionId
        })
      }

      return success
    } catch (error) {
      logger.error('认证会话撤销失败', error instanceof Error ? error : undefined, {
        service: 'database-auth-service',
        sessionId
      })
      return false
    }
  }

  /**
   * 验证会话是否有效
   */
  async validateSession(sessionId: string): Promise<boolean> {
    if (!this.config.enableSessionTracking) {
      return true
    }

    try {
      return await this.config.databaseAdapter.validateSession(sessionId)
    } catch (error) {
      logger.error('会话验证失败', error instanceof Error ? error : undefined, {
        service: 'database-auth-service',
        sessionId
      })
      return false
    }
  }

  /**
   * 将数据库用户对象映射为 LinchKit 用户对象  
   */
  private mapDatabaseUserToLinchKitUser(user: DatabaseUser): LinchKitUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      status: user.status as 'active' | 'inactive' | 'disabled' | 'pending',
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }
}

/**
 * 创建数据库认证服务实例
 */
export function createDatabaseAuthService(config: DatabaseAuthServiceConfig): DatabaseAuthService {
  return new DatabaseAuthService(config)
}