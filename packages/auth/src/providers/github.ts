/**
 * @linch-kit/auth GitHub OAuth认证提供商
 * 基于 passport-github2 实现
 */

import { Strategy as GitHubStrategy } from 'passport-github2'
import type { AuthRequest, AuthResult, User } from '../types'
import { BaseAuthProvider } from './base'

/**
 * GitHub OAuth认证提供商配置
 */
export interface GitHubAuthConfig {
  clientID: string
  clientSecret: string
  callbackURL: string
  scope?: string[]
  userAgent?: string
  customHeaders?: Record<string, string>
}

/**
 * GitHub OAuth认证提供商
 * 
 * 设计原则：
 * - 基于 passport-github2 策略
 * - 支持组织成员验证
 * - 自动用户创建和关联
 * - GitHub API集成
 */
export class GitHubAuthProvider extends BaseAuthProvider {
  public readonly name = 'github'
  private config: GitHubAuthConfig

  constructor(config: GitHubAuthConfig) {
    super()
    this.config = config
  }

  protected initialize(): void {
    const strategy = new GitHubStrategy(
      {
        clientID: this.config.clientID,
        clientSecret: this.config.clientSecret,
        callbackURL: this.config.callbackURL,
        scope: this.config.scope || ['user:email'],
        userAgent: this.config.userAgent || 'LinchKit-Auth',
        customHeaders: this.config.customHeaders,
        passReqToCallback: true
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // 获取用户邮箱（GitHub可能不在profile中提供）
          const userEmails = await this.getUserEmails(accessToken)
          const primaryEmail = this.getPrimaryEmail(userEmails)

          if (!primaryEmail) {
            return done(null, false, { message: 'Unable to get user email from GitHub' })
          }

          // 验证组织成员身份（如果需要）
          if (!(await this.validateOrganizationMembership(accessToken, profile.username))) {
            return done(null, false, { message: 'Organization membership required' })
          }

          // 查找或创建用户
          let user = await this.findUserByGitHubId(profile.id)
          
          if (!user) {
            // 尝试通过邮箱查找现有用户
            user = await this.findUserByEmail(primaryEmail)
            
            if (user) {
              // 关联GitHub账户到现有用户
              await this.linkGitHubAccount(user.id, profile.id, accessToken, profile.username)
            } else {
              // 创建新用户
              user = await this.createUserFromGitHubProfile(profile, primaryEmail, accessToken)
            }
          } else {
            // 更新GitHub令牌和信息
            await this.updateGitHubTokens(user.id, accessToken, profile.username)
          }

          // 检查用户状态
          this.checkUserStatus(user)

          // 更新最后登录时间
          await this.updateLastLogin(user.id)

          return done(null, user)
        } catch (error) {
          console.error('GitHub authentication error:', error)
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
      throw new Error(`GitHub OAuth error: ${error}`)
    }

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // 在实际实现中，这里会处理OAuth代码交换令牌的逻辑
    // 由于我们使用Passport.js，这个逻辑通常在策略中处理
    throw new Error('Use passport middleware for GitHub OAuth authentication')
  }

  protected async performValidation(payload: any): Promise<User | null> {
    // 对于GitHub OAuth，验证通常通过GitHub令牌完成
    if (payload.githubId) {
      return await this.findUserByGitHubId(payload.githubId)
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
    // GitHub OAuth不需要密码验证
    return true
  }

  /**
   * 获取用户邮箱列表
   */
  private async getUserEmails(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': this.config.userAgent || 'LinchKit-Auth',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get GitHub user emails:', error)
      return []
    }
  }

  /**
   * 获取主要邮箱
   */
  private getPrimaryEmail(emails: any[]): string | null {
    const primaryEmail = emails.find(email => email.primary && email.verified)
    return primaryEmail ? primaryEmail.email : null
  }

  /**
   * 验证组织成员身份
   */
  private async validateOrganizationMembership(accessToken: string, username: string): Promise<boolean> {
    // TODO: 如果需要组织验证，在这里实现
    // 示例：检查用户是否是特定组织的成员
    const requiredOrg = process.env.GITHUB_REQUIRED_ORG
    
    if (!requiredOrg) {
      return true // 不需要组织验证
    }

    try {
      const response = await fetch(`https://api.github.com/orgs/${requiredOrg}/members/${username}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': this.config.userAgent || 'LinchKit-Auth',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      return response.status === 200
    } catch (error) {
      console.error('Failed to check organization membership:', error)
      return false
    }
  }

  /**
   * 通过GitHub ID查找用户
   */
  private async findUserByGitHubId(githubId: string): Promise<User | null> {
    // TODO: 实现数据库查询
    console.log(`Finding user by GitHub ID: ${githubId}`)
    return null
  }

  /**
   * 通过邮箱查找用户
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    // TODO: 实现数据库查询
    console.log(`Finding user by email: ${email}`)
    return null
  }

  /**
   * 关联GitHub账户到现有用户
   */
  private async linkGitHubAccount(
    userId: string, 
    githubId: string, 
    accessToken: string,
    username: string
  ): Promise<void> {
    // TODO: 实现数据库更新
    console.log(`Linking GitHub account ${githubId} (${username}) to user ${userId}`)
  }

  /**
   * 从GitHub资料创建新用户
   */
  private async createUserFromGitHubProfile(
    profile: any, 
    email: string,
    accessToken: string
  ): Promise<User> {
    const userData = {
      email: email,
      name: profile.displayName || profile.username,
      avatar: profile.photos?.[0]?.value,
      status: 'active' as const,
      emailVerified: true, // GitHub邮箱已验证
      metadata: {
        githubId: profile.id,
        githubUsername: profile.username,
        provider: 'github',
        accessToken: accessToken
      }
    }

    // TODO: 实现数据库创建
    console.log('Creating user from GitHub profile:', userData)
    
    // 模拟创建的用户
    const user: User = {
      id: this.generateUserId(),
      email: userData.email,
      name: userData.name,
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
   * 更新GitHub令牌和信息
   */
  private async updateGitHubTokens(
    userId: string, 
    accessToken: string, 
    username: string
  ): Promise<void> {
    // TODO: 实现数据库更新
    console.log(`Updating GitHub tokens for user ${userId}`)
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
   * 获取GitHub授权URL
   */
  public getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientID,
      scope: (this.config.scope || ['user:email']).join(' '),
      redirect_uri: this.config.callbackURL
    })

    if (state) {
      params.append('state', state)
    }

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * 撤销GitHub访问令牌
   */
  public async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.github.com/applications/${this.config.clientID}/grant`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': this.config.userAgent || 'LinchKit-Auth',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Failed to revoke GitHub token:', error)
      return false
    }
  }

  /**
   * 获取GitHub用户信息
   */
  public async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': this.config.userAgent || 'LinchKit-Auth',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get GitHub user info:', error)
      throw error
    }
  }

  /**
   * 获取用户的GitHub仓库
   */
  public async getUserRepositories(accessToken: string, type: 'all' | 'owner' | 'member' = 'all'): Promise<any[]> {
    try {
      const response = await fetch(`https://api.github.com/user/repos?type=${type}&sort=updated`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': this.config.userAgent || 'LinchKit-Auth',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get GitHub repositories:', error)
      return []
    }
  }

  /**
   * 获取用户的组织列表
   */
  public async getUserOrganizations(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.github.com/user/orgs', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': this.config.userAgent || 'LinchKit-Auth',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get GitHub organizations:', error)
      return []
    }
  }
}