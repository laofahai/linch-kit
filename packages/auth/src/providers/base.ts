/**
 * @linch-kit/auth 认证提供商基类
 * 基于 Passport.js 的统一认证接口
 */

import passport from 'passport'

import type { AuthRequest, AuthResult, User, IAuthProvider } from '../types'

/**
 * 认证提供商基类
 * 
 * 设计原则：
 * - 基于 Passport.js 策略生态
 * - 标准化认证流程和错误处理  
 * - 支持热插拔的认证策略
 */
export abstract class BaseAuthProvider implements IAuthProvider {
  public abstract readonly name: string
  protected strategy?: passport.Strategy

  constructor() {
    this.initialize()
  }

  /**
   * 初始化提供商
   */
  protected abstract initialize(): void

  /**
   * 认证用户
   */
  public async authenticate(request: AuthRequest): Promise<AuthResult> {
    try {
      // 验证请求格式
      this.validateRequest(request)
      
      // 执行提供商特定的认证逻辑
      const result = await this.performAuthentication(request)
      
      // 记录认证事件
      await this.logAuthEvent(request, result)
      
      return result
    } catch (error) {
      const errorResult: AuthResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
      
      await this.logAuthEvent(request, errorResult)
      return errorResult
    }
  }

  /**
   * 验证用户（用于JWT等场景）
   */
  public async validate(payload: unknown): Promise<User | null> {
    try {
      return await this.performValidation(payload)
    } catch (error) {
      console.error(`Validation failed for provider ${this.name}:`, error)
      return null
    }
  }

  /**
   * 注册 Passport 策略
   */
  protected registerStrategy(strategy: passport.Strategy): void {
    this.strategy = strategy
    passport.use(this.name, strategy)
  }

  /**
   * 获取策略名称
   */
  public getStrategyName(): string {
    return this.name
  }

  /**
   * 检查提供商是否可用
   */
  public isAvailable(): boolean {
    return this.strategy !== undefined
  }

  /**
   * 验证认证请求格式
   */
  protected validateRequest(request: AuthRequest): void {
    if (!request.provider) {
      throw new Error('Provider is required')
    }
    
    if (request.provider !== this.name) {
      throw new Error(`Invalid provider: expected ${this.name}, got ${request.provider}`)
    }
    
    if (!request.credentials || typeof request.credentials !== 'object') {
      throw new Error('Credentials are required')
    }
  }

  /**
   * 执行认证（子类实现）
   */
  protected abstract performAuthentication(request: AuthRequest): Promise<AuthResult>

  /**
   * 执行验证（子类实现）
   */
  protected abstract performValidation(payload: unknown): Promise<User | null>

  /**
   * 生成访问令牌
   */
  protected generateTokens(_user: User): { accessToken: string; refreshToken: string; expiresIn: number } {
    // 这里会依赖会话管理器，暂时返回示例结构
    return {
      accessToken: 'generated-access-token',
      refreshToken: 'generated-refresh-token',
      expiresIn: 900 // 15分钟
    }
  }

  /**
   * 查找用户（子类实现具体逻辑）
   */
  protected abstract findUser(identifier: string): Promise<User | null>

  /**
   * 创建新用户（子类实现具体逻辑）
   */
  protected abstract createUser(userData: Partial<User>): Promise<User>

  /**
   * 验证密码（用于凭据认证）
   */
  protected abstract verifyPassword(user: User, password: string): Promise<boolean>

  /**
   * 记录认证事件
   */
  protected async logAuthEvent(request: AuthRequest, result: AuthResult): Promise<void> {
    // 基础日志记录，可由审计系统扩展
    const eventData = {
      provider: this.name,
      success: result.success,
      userId: result.user?.id,
      ipAddress: request.metadata?.ipAddress,
      userAgent: request.metadata?.userAgent,
      timestamp: new Date()
    }
    
    console.log(`Auth event:`, eventData)
    
    // TODO: 集成审计日志系统
    // await auditLogger.log({
    //   eventType: result.success ? 'login_success' : 'login_failed',
    //   userId: result.user?.id,
    //   ipAddress: request.metadata?.ipAddress,
    //   userAgent: request.metadata?.userAgent,
    //   details: { provider: this.name },
    //   result: result.success ? 'success' : 'failure'
    // })
  }

  /**
   * 处理认证错误
   */
  protected handleAuthError(error: unknown): never {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Authentication failed')
  }

  /**
   * 清理敏感数据
   */
  protected sanitizeUser(user: User): User {
    // 移除敏感字段
    const { ...sanitized } = user
    return sanitized
  }

  /**
   * 检查用户状态
   */
  protected checkUserStatus(user: User): void {
    if (user.status === 'disabled') {
      throw new Error('Account is disabled')
    }
    
    if (user.status === 'inactive') {
      throw new Error('Account is inactive')
    }
    
    if (user.status === 'pending' && !this.allowPendingUsers()) {
      throw new Error('Account verification required')
    }
  }

  /**
   * 是否允许待验证用户登录
   */
  protected allowPendingUsers(): boolean {
    return false
  }

  /**
   * 获取提供商配置
   */
  protected getConfig(): unknown {
    // TODO: 从配置管理器获取
    return {}
  }
}