/**
 * @linch-kit/auth 用户名密码认证提供商
 * 基于 passport-local 实现
 */

import bcrypt from 'bcryptjs'
import { Strategy as LocalStrategy } from 'passport-local'

import type { AuthRequest, AuthResult, User } from '../types'

import { BaseAuthProvider } from './base'

/**
 * 用户名密码认证提供商
 * 
 * 设计原则：
 * - 使用 bcrypt 进行密码哈希
 * - 支持邮箱和用户名登录
 * - 集成密码策略验证
 * - 防范暴力破解攻击
 */
export class CredentialsAuthProvider extends BaseAuthProvider {
  public readonly name = 'credentials'
  
  private readonly maxAttempts: number
  private readonly lockoutDuration: number
  private readonly attemptTracker = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>()

  constructor(options: {
    maxAttempts?: number
    lockoutDuration?: number
  } = {}) {
    super()
    this.maxAttempts = options.maxAttempts ?? 5
    this.lockoutDuration = options.lockoutDuration ?? 30 * 60 * 1000 // 30分钟
  }

  protected initialize(): void {
    const strategy = new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      async (req, email, password, done) => {
        try {
          // 检查是否被锁定
          if (this.isAccountLocked(email)) {
            return done(null, false, { message: 'Account temporarily locked due to multiple failed attempts' })
          }

          // 查找用户
          const user = await this.findUser(email)
          if (!user) {
            this.recordFailedAttempt(email)
            return done(null, false, { message: 'Invalid email or password' })
          }

          // 验证密码
          const isValid = await this.verifyPassword(user, password)
          if (!isValid) {
            this.recordFailedAttempt(email)
            return done(null, false, { message: 'Invalid email or password' })
          }

          // 检查用户状态
          this.checkUserStatus(user)

          // 清除失败记录
          this.clearFailedAttempts(email)

          // 更新最后登录时间
          await this.updateLastLogin(user.id)

          return done(null, user)
        } catch (error) {
          return done(error, false)
        }
      }
    )

    this.registerStrategy(strategy)
  }

  protected async performAuthentication(request: AuthRequest): Promise<AuthResult> {
    const { email, password } = request.credentials as { email: string; password: string }

    // 验证输入
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // 验证邮箱格式
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    // 检查账户锁定状态
    if (this.isAccountLocked(email)) {
      throw new Error('Account temporarily locked due to multiple failed attempts')
    }

    // 查找用户
    const user = await this.findUser(email)
    if (!user) {
      this.recordFailedAttempt(email)
      throw new Error('Invalid email or password')
    }

    // 验证密码
    const isValidPassword = await this.verifyPassword(user, password)
    if (!isValidPassword) {
      this.recordFailedAttempt(email)
      throw new Error('Invalid email or password')
    }

    // 检查用户状态
    this.checkUserStatus(user)

    // 清除失败记录
    this.clearFailedAttempts(email)

    // 更新最后登录时间
    await this.updateLastLogin(user.id)

    // 生成令牌
    const tokens = this.generateTokens(user)

    return {
      success: true,
      user: this.sanitizeUser(user),
      tokens
    }
  }

  protected async performValidation(_payload: unknown): Promise<User | null> {
    // 对于凭据认证，通常不需要额外验证
    // JWT验证由JWT提供商处理
    return null
  }

  protected async findUser(email: string): Promise<User | null> {
    // TODO: 实现数据库查询
    // 这里应该从数据库查找用户
    // 示例实现：
    console.log(`Finding user by email: ${email}`)
    
    // 模拟数据库查询
    if (email === 'test@example.com') {
      return {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    return null
  }

  protected async createUser(_userData: Partial<User>): Promise<User> {
    // TODO: 实现用户创建逻辑
    throw new Error('User creation not implemented')
  }

  protected async verifyPassword(user: User, password: string): Promise<boolean> {
    // TODO: 从数据库获取用户的哈希密码
    // 这里应该查询用户的密码哈希
    
    // 模拟密码验证
    const hashedPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LiOsaD5bQ8KvvfK6K' // 'password123'
    
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
      console.error('Password verification error:', error)
      return false
    }
  }

  /**
   * 哈希密码
   */
  public async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    return await bcrypt.hash(password, saltRounds)
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 检查账户是否被锁定
   */
  private isAccountLocked(email: string): boolean {
    const attempts = this.attemptTracker.get(email)
    if (!attempts) return false

    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return true
    }

    // 如果锁定期已过，清除锁定状态
    if (attempts.lockedUntil && attempts.lockedUntil <= new Date()) {
      this.clearFailedAttempts(email)
      return false
    }

    return attempts.count >= this.maxAttempts
  }

  /**
   * 记录失败尝试
   */
  private recordFailedAttempt(email: string): void {
    const attempts = this.attemptTracker.get(email) || { count: 0, lastAttempt: new Date() }
    
    attempts.count++
    attempts.lastAttempt = new Date()

    // 如果达到最大尝试次数，设置锁定
    if (attempts.count >= this.maxAttempts) {
      attempts.lockedUntil = new Date(Date.now() + this.lockoutDuration)
    }

    this.attemptTracker.set(email, attempts)

    console.log(`Failed login attempt for ${email}. Count: ${attempts.count}`)
  }

  /**
   * 清除失败记录
   */
  private clearFailedAttempts(email: string): void {
    this.attemptTracker.delete(email)
  }

  /**
   * 更新最后登录时间
   */
  private async updateLastLogin(userId: string): Promise<void> {
    // TODO: 更新数据库中的最后登录时间
    console.log(`Updating last login for user ${userId}`)
  }

  /**
   * 获取失败尝试统计
   */
  public getFailedAttempts(email: string): { count: number; lockedUntil?: Date } | null {
    const attempts = this.attemptTracker.get(email)
    return attempts ? { count: attempts.count, lockedUntil: attempts.lockedUntil } : null
  }

  /**
   * 手动解锁账户
   */
  public unlockAccount(email: string): void {
    this.clearFailedAttempts(email)
  }

  /**
   * 清理过期的尝试记录
   */
  public cleanupExpiredAttempts(): void {
    const now = new Date()
    for (const [email, attempts] of this.attemptTracker.entries()) {
      // 清理超过24小时的记录
      if (now.getTime() - attempts.lastAttempt.getTime() > 24 * 60 * 60 * 1000) {
        this.attemptTracker.delete(email)
      }
    }
  }
}