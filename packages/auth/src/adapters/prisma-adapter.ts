/**
 * Prisma 数据库适配器
 * 
 * 为 DatabaseAuthService 提供 Prisma 数据库操作实现
 * 支持完整的用户认证和会话管理功能
 */

// 使用任意类型避免 Prisma 依赖问题
type PrismaClient = any
import { logger } from '@linch-kit/core/server'

import type { 
  IDatabaseAdapter, 
  DatabaseUser, 
  CreateUserData, 
  CreateSessionData 
} from '../services/database-auth.service'

/**
 * Prisma 适配器配置
 */
export interface PrismaAdapterConfig {
  /**
   * Prisma 客户端实例
   */
  prisma: PrismaClient
}

/**
 * Prisma 数据库适配器
 * 
 * 实现 IDatabaseAdapter 接口，提供基于 Prisma 的数据库操作
 */
export class PrismaAdapter implements IDatabaseAdapter {
  private readonly prisma: PrismaClient

  constructor(config: PrismaAdapterConfig) {
    this.prisma = config.prisma
  }

  /**
   * 通过邮箱查找用户
   */
  async findUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      })

      return user ? this.mapPrismaUserToDatabase(user) : null
    } catch (error) {
      logger.error('通过邮箱查找用户失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        email: email.slice(0, 3) + '***'
      })
      throw error
    }
  }

  /**
   * 通过ID查找用户
   */
  async findUserById(userId: string): Promise<DatabaseUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      })

      return user ? this.mapPrismaUserToDatabase(user) : null
    } catch (error) {
      logger.error('通过ID查找用户失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        userId
      })
      throw error
    }
  }

  /**
   * 创建新用户
   */
  async createUser(userData: CreateUserData): Promise<DatabaseUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          metadata: {
            passwordHash: userData.passwordHash,
            ...userData.metadata
          }
        }
      })

      logger.info('用户创建成功', {
        service: 'prisma-adapter',
        userId: user.id,
        email: userData.email.slice(0, 3) + '***'
      })

      return this.mapPrismaUserToDatabase(user)
    } catch (error) {
      logger.error('创建用户失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        email: userData.email.slice(0, 3) + '***'
      })
      throw error
    }
  }

  /**
   * 更新用户最后登录时间
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      })

      logger.debug('用户最后登录时间更新成功', {
        service: 'prisma-adapter',
        userId
      })
    } catch (error) {
      logger.error('更新最后登录时间失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        userId
      })
      throw error
    }
  }

  /**
   * 创建认证会话记录
   */
  async createAuthSession(sessionData: CreateSessionData): Promise<void> {
    try {
      await this.prisma.authSession.create({
        data: {
          userId: sessionData.userId,
          userEmail: sessionData.userEmail,
          sessionId: sessionData.sessionId,
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          expiresAt: sessionData.expiresAt,
          deviceInfo: sessionData.deviceInfo
        }
      })

      logger.info('认证会话创建成功', {
        service: 'prisma-adapter',
        userId: sessionData.userId,
        sessionId: sessionData.sessionId
      })
    } catch (error) {
      logger.error('创建认证会话失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        userId: sessionData.userId,
        sessionId: sessionData.sessionId
      })
      throw error
    }
  }

  /**
   * 撤销认证会话
   */
  async revokeAuthSession(sessionId: string): Promise<boolean> {
    try {
      const result = await this.prisma.authSession.updateMany({
        where: { 
          sessionId,
          status: 'active'
        },
        data: {
          status: 'revoked',
          revokedAt: new Date()
        }
      })

      const success = result.count > 0

      if (success) {
        logger.info('认证会话撤销成功', {
          service: 'prisma-adapter',
          sessionId
        })
      } else {
        logger.warn('认证会话撤销失败 - 会话不存在或已撤销', {
          service: 'prisma-adapter',
          sessionId
        })
      }

      return success
    } catch (error) {
      logger.error('撤销认证会话失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        sessionId
      })
      throw error
    }
  }

  /**
   * 验证会话有效性
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.prisma.authSession.findUnique({
        where: { sessionId }
      })

      if (!session || session.status !== 'active' || session.expiresAt < new Date()) {
        return false
      }

      // 更新最后访问时间
      await this.prisma.authSession.update({
        where: { sessionId },
        data: { lastAccessAt: new Date() }
      })

      return true
    } catch (error) {
      logger.error('验证会话失败', error instanceof Error ? error : undefined, {
        service: 'prisma-adapter',
        sessionId
      })
      return false
    }
  }

  /**
   * 将 Prisma 用户对象映射为 DatabaseUser
   */
  private mapPrismaUserToDatabase(user: any): DatabaseUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      tenantId: user.tenantId,
      metadata: user.metadata || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    }
  }

  /**
   * 关闭数据库连接
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

/**
 * 创建 Prisma 适配器实例
 */
export function createPrismaAdapter(prisma: PrismaClient): PrismaAdapter {
  return new PrismaAdapter({ prisma })
}