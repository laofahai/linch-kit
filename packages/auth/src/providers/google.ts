/**
 * @linch-kit/auth Google OAuth认证提供商
 * 基于 passport-google-oauth20 实现
 */

import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import type { AuthRequest, AuthResult, User } from '../types'
import { BaseAuthProvider } from './base'

/**
 * Google OAuth认证提供商配置
 */
export interface GoogleAuthConfig {
  clientID: string
  clientSecret: string
  callbackURL: string
  scope?: string[]
  hostedDomain?: string // 限制特定域名
  accessType?: 'online' | 'offline'
  prompt?: 'none' | 'consent' | 'select_account'
}

/**
 * Google OAuth认证提供商
 * 
 * 设计原则：
 * - 基于 passport-google-oauth20 策略
 * - 支持企业级域名限制
 * - 自动用户创建和关联
 * - 安全的令牌处理
 */
export class GoogleAuthProvider extends BaseAuthProvider {
  public readonly name = 'google'
  private config: GoogleAuthConfig

  constructor(config: GoogleAuthConfig) {
    super()
    this.config = config
  }

  protected initialize(): void {
    const strategy = new GoogleStrategy(
      {
        clientID: this.config.clientID,
        clientSecret: this.config.clientSecret,
        callbackURL: this.config.callbackURL,
        scope: this.config.scope || ['profile', 'email'],
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // 验证域名限制
          if (this.config.hostedDomain && !this.isAllowedDomain(profile.emails?.[0]?.value)) {
            return done(null, false, { message: 'Domain not allowed' })
          }

          // 查找或创建用户
          let user = await this.findUserByGoogleId(profile.id)
          
          if (!user) {
            // 尝试通过邮箱查找现有用户
            user = await this.findUserByEmail(profile.emails?.[0]?.value)
            
            if (user) {
              // 关联Google账户到现有用户
              await this.linkGoogleAccount(user.id, profile.id, accessToken, refreshToken)
            } else {
              // 创建新用户
              user = await this.createUserFromGoogleProfile(profile, accessToken, refreshToken)
            }
          } else {
            // 更新Google令牌
            await this.updateGoogleTokens(user.id, accessToken, refreshToken)
          }

          // 检查用户状态
          this.checkUserStatus(user)

          // 更新最后登录时间
          await this.updateLastLogin(user.id)

          return done(null, user)
        } catch (error) {
          console.error('Google authentication error:', error)
          return done(error, false)
        }
      }
    )

    this.registerStrategy(strategy)
  }

  protected async performAuthentication(request: AuthRequest): Promise<AuthResult> {
    // OAuth流程通常通过重定向处理，这里主要用于处理回调结果
    const { code, state, error } = request.credentials as { 
      code?: string 
      state?: string 
      error?: string 
    }

    if (error) {
      throw new Error(`Google OAuth error: ${error}`)
    }

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // 在实际实现中，这里会处理OAuth代码交换令牌的逻辑
    // 由于我们使用Passport.js，这个逻辑通常在策略中处理
    throw new Error('Use passport middleware for Google OAuth authentication')
  }

  protected async performValidation(payload: any): Promise<User | null> {
    // 对于Google OAuth，验证通常通过Google令牌完成
    if (payload.googleId) {
      return await this.findUserByGoogleId(payload.googleId)
    }
    return null
  }

  protected async findUser(identifier: string): Promise<User | null> {
    return await this.findUserByEmail(identifier)
  }

  protected async createUser(userData: Partial<User>): Promise<User> {
    // TODO: 实现用户创建逻辑
    throw new Error('User creation not implemented')
  }

  protected async verifyPassword(user: User, password: string): Promise<boolean> {
    // Google OAuth不需要密码验证
    return true
  }

  /**
   * 检查域名是否被允许
   */
  private isAllowedDomain(email?: string): boolean {
    if (!this.config.hostedDomain || !email) return true
    
    const domain = email.split('@')[1]
    return domain === this.config.hostedDomain
  }

  /**
   * 通过Google ID查找用户
   */
  private async findUserByGoogleId(googleId: string): Promise<User | null> {
    // TODO: 实现数据库查询
    console.log(`Finding user by Google ID: ${googleId}`)
    return null
  }

  /**
   * 通过邮箱查找用户
   */
  private async findUserByEmail(email?: string): Promise<User | null> {
    if (!email) return null
    
    // TODO: 实现数据库查询
    console.log(`Finding user by email: ${email}`)
    return null
  }

  /**
   * 关联Google账户到现有用户
   */
  private async linkGoogleAccount(
    userId: string, 
    googleId: string, 
    accessToken: string, 
    refreshToken?: string
  ): Promise<void> {
    // TODO: 实现数据库更新
    console.log(`Linking Google account ${googleId} to user ${userId}`)
  }

  /**
   * 从Google资料创建新用户
   */
  private async createUserFromGoogleProfile(
    profile: any, 
    accessToken: string, 
    refreshToken?: string
  ): Promise<User> {
    const userData = {
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      status: 'active' as const,
      emailVerified: true, // Google账户默认已验证
      metadata: {
        googleId: profile.id,
        provider: 'google',
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    }

    // TODO: 实现数据库创建
    console.log('Creating user from Google profile:', userData)
    
    // 模拟创建的用户
    const user: User = {
      id: this.generateUserId(),
      email: userData.email!,
      name: userData.name!,
      avatar: userData.avatar,
      status: userData.status,
      emailVerified: userData.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: userData.metadata
    }

    return user
  }

  /**
   * 更新Google令牌
   */
  private async updateGoogleTokens(
    userId: string, 
    accessToken: string, 
    refreshToken?: string
  ): Promise<void> {
    // TODO: 实现数据库更新
    console.log(`Updating Google tokens for user ${userId}`)
  }

  /**
   * 更新最后登录时间
   */
  private async updateLastLogin(userId: string): Promise<void> {
    // TODO: 实现数据库更新
    console.log(`Updating last login for user ${userId}`)
  }

  /**
   * 生成用户ID
   */
  private generateUserId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  /**
   * 获取Google授权URL
   */
  public getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientID,
      response_type: 'code',
      scope: (this.config.scope || ['profile', 'email']).join(' '),
      redirect_uri: this.config.callbackURL,
      access_type: this.config.accessType || 'online'
    })

    if (state) {
      params.append('state', state)
    }

    if (this.config.hostedDomain) {
      params.append('hd', this.config.hostedDomain)
    }

    if (this.config.prompt) {
      params.append('prompt', this.config.prompt)
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * 撤销Google访问令牌
   */
  public async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Failed to revoke Google token:', error)
      return false
    }
  }

  /**
   * 获取Google用户信息
   */
  public async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get Google user info:', error)
      throw error
    }
  }
}