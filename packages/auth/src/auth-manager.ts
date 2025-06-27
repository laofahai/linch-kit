/**
 * @linch-kit/auth 认证管理器
 * 统一的认证入口和管理接口
 */

import type { TranslationFunction } from '@linch-kit/core'

import { authI18n } from './i18n'
import type { 
  AuthRequest, 
  AuthResult, 
  User, 
  AuthProvider,
  IAuthProvider,
  AuthConfig
} from './types'
import { CredentialsAuthProvider } from './providers/credentials'

/**
 * 认证管理器
 * 
 * 设计原则：
 * - 统一的认证接口
 * - 插件化的认证提供商
 * - 国际化支持
 * - 配置驱动
 */
export class AuthManager {
  private providers = new Map<AuthProvider, IAuthProvider>()
  private config: AuthConfig
  private userT?: TranslationFunction

  constructor(config: Partial<AuthConfig> = {}, userT?: TranslationFunction) {
    this.userT = userT

    // 设置默认配置
    this.config = this.createDefaultConfig(config)

    // 初始化默认提供商
    this.initializeDefaultProviders()
  }

  /**
   * 获取翻译函数
   */
  public getTranslation(userT?: TranslationFunction): TranslationFunction {
    return authI18n.getTranslation(userT || this.userT)
  }

  /**
   * 认证用户
   */
  public async authenticate(request: AuthRequest): Promise<AuthResult> {
    const t = this.getTranslation()

    try {
      // 验证请求
      if (!request.provider) {
        return {
          success: false,
          error: t('auth.invalid_provider')
        }
      }

      // 获取认证提供商
      const provider = this.providers.get(request.provider as AuthProvider)
      if (!provider) {
        return {
          success: false,
          error: t('auth.provider_not_found')
        }
      }

      // 执行认证
      const result = await provider.authenticate(request)

      // 后处理
      if (result.success && result.user) {
        await this.postAuthenticationProcessing(result.user, request)
      }

      return result
    } catch (error) {
      console.error('Authentication error:', error)
      return {
        success: false,
        error: t('auth.failed')
      }
    }
  }

  /**
   * 验证用户（用于JWT等场景）
   */
  public async validateUser(provider: AuthProvider, payload: unknown): Promise<User | null> {
    try {
      const authProvider = this.providers.get(provider)
      if (!authProvider || !authProvider.validate) {
        return null
      }

      return await authProvider.validate(payload)
    } catch (error) {
      console.error('User validation error:', error)
      return null
    }
  }

  /**
   * 注册认证提供商
   */
  public registerProvider(provider: IAuthProvider): void {
    this.providers.set(provider.name as AuthProvider, provider)
  }

  /**
   * 移除认证提供商
   */
  public unregisterProvider(name: AuthProvider): boolean {
    return this.providers.delete(name)
  }

  /**
   * 获取所有可用的认证提供商
   */
  public getAvailableProviders(): AuthProvider[] {
    return Array.from(this.providers.keys())
  }

  /**
   * 检查提供商是否可用
   */
  public isProviderAvailable(name: AuthProvider): boolean {
    const provider = this.providers.get(name)
    return provider !== undefined
  }

  /**
   * 获取提供商实例
   */
  public getProvider(name: AuthProvider): IAuthProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...config }
    this.reinitializeProviders()
  }

  /**
   * 获取当前配置
   */
  public getConfig(): AuthConfig {
    return { ...this.config }
  }

  /**
   * 获取配置的提供商信息
   */
  public getProviderConfig(name: AuthProvider): unknown {
    return this.config.providers?.[name]?.config ?? {}
  }

  /**
   * 检查提供商是否启用
   */
  public isProviderEnabled(name: AuthProvider): boolean {
    return this.config.providers?.[name]?.enabled ?? false
  }

  /**
   * 启用/禁用提供商
   */
  public setProviderEnabled(name: AuthProvider, enabled: boolean): void {
    if (!this.config.providers) {
      this.config.providers = {}
    }
    if (!this.config.providers[name]) {
      this.config.providers[name] = { enabled: false }
    }
    this.config.providers[name].enabled = enabled
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 创建默认配置
   */
  private createDefaultConfig(config: Partial<AuthConfig>): AuthConfig {
    const defaultConfig: AuthConfig = {
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        algorithm: 'HS256'
      },
      session: {
        maxConcurrentSessions: 5,
        maxInactiveTime: '30m',
        extendOnActivity: true
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDuration: '30m',
        passwordPolicy: {
          minLength: 8,
          maxLength: 64,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false,
          preventReuse: 3,
          saltRounds: 12
        },
        requireEmailVerification: true,
        mfaRequired: false
      },
      providers: {
        credentials: { enabled: true },
        google: { enabled: false },
        github: { enabled: false },
        saml: { enabled: false }
      }
    }

    return { ...defaultConfig, ...config }
  }

  /**
   * 初始化默认提供商
   */
  private initializeDefaultProviders(): void {
    // 初始化凭据认证提供商
    if (this.isProviderEnabled('credentials')) {
      const credentialsProvider = new CredentialsAuthProvider({
        maxAttempts: this.config.security.maxLoginAttempts,
        lockoutDuration: this.parseDurationToMs(this.config.security.lockoutDuration)
      })
      this.registerProvider(credentialsProvider)
    }

    // TODO: 初始化其他提供商
    // if (this.isProviderEnabled('google')) {
    //   const googleProvider = new GoogleAuthProvider(this.getProviderConfig('google'))
    //   this.registerProvider(googleProvider)
    // }
  }

  /**
   * 重新初始化提供商
   */
  private reinitializeProviders(): void {
    this.providers.clear()
    this.initializeDefaultProviders()
  }

  /**
   * 认证后处理
   */
  private async postAuthenticationProcessing(user: User, request: AuthRequest): Promise<void> {
    try {
      // 记录登录事件
      console.log(`User ${user.id} authenticated via ${request.provider}`)

      // 检查是否需要邮箱验证
      if (this.config.security.requireEmailVerification && !user.emailVerified) {
        // TODO: 发送验证邮件或返回验证要求
      }

      // 检查是否需要MFA
      if (this.config.security.mfaRequired) {
        // TODO: 检查用户MFA设置
      }

      // 更新用户活动记录
      await this.updateUserActivity(user.id, request.metadata)

    } catch (error) {
      console.error('Post-authentication processing error:', error)
      // 不抛出错误，避免影响认证流程
    }
  }

  /**
   * 更新用户活动记录
   */
  private async updateUserActivity(_userId: string, _metadata?: unknown): Promise<void> {
    // TODO: 更新数据库中的用户活动记录
    // console.log(`Updating activity for user ${userId}`, metadata)
  }

  /**
   * 解析时间字符串为毫秒
   */
  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/)
    if (!match) return 30 * 60 * 1000 // 默认30分钟

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 30 * 60 * 1000
    }
  }
}