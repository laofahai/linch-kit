/**
 * @linch-kit/auth Key Provider 接口
 * 
 * 抽象环境特定的密钥管理依赖，支持Edge Runtime和Node.js环境
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

/**
 * 密钥提供者接口
 * 
 * 为不同运行时环境提供统一的密钥获取接口
 * 支持同步和异步密钥获取
 */
export interface IKeyProvider {
  /**
   * 获取JWT签名密钥
   * 
   * @returns JWT密钥字符串
   * @throws Error 当密钥无效或不可用时
   */
  getJWTSecret(): string | Promise<string>

  /**
   * 获取加密密钥（用于敏感数据加密）
   * 
   * @returns 加密密钥字符串
   * @throws Error 当密钥无效或不可用时
   */
  getEncryptionKey(): string | Promise<string>

  /**
   * 验证密钥提供者健康状态
   * 
   * @returns 是否健康可用
   */
  isHealthy(): boolean | Promise<boolean>

  /**
   * 获取提供者类型标识
   * 
   * @returns 提供者类型
   */
  getProviderType(): 'edge' | 'server'
}

/**
 * 密钥验证配置
 */
export interface KeyValidationConfig {
  /**
   * 最小密钥长度
   */
  minKeyLength: number

  /**
   * 是否要求强密钥
   */
  requireStrongKey: boolean

  /**
   * 允许的密钥格式（正则表达式）
   */
  allowedKeyPattern?: RegExp
}

/**
 * 密钥提供者基础配置
 */
export interface BaseKeyProviderConfig {
  /**
   * 密钥验证配置
   */
  validation?: KeyValidationConfig

  /**
   * 是否在初始化时验证密钥
   */
  validateOnInit?: boolean
}

/**
 * 默认密钥验证配置
 */
export const defaultKeyValidationConfig: KeyValidationConfig = {
  minKeyLength: 32,
  requireStrongKey: true,
  allowedKeyPattern: /^[A-Za-z0-9+/=_-]+$/
}

/**
 * 密钥提供者抽象基类
 * 
 * 提供通用的密钥验证和错误处理逻辑
 */
export abstract class BaseKeyProvider implements IKeyProvider {
  protected readonly config: BaseKeyProviderConfig

  constructor(config: BaseKeyProviderConfig = {}) {
    this.config = {
      validation: defaultKeyValidationConfig,
      validateOnInit: true,
      ...config
    }

    if (this.config.validateOnInit) {
      this.validateProvider()
    }
  }

  abstract getJWTSecret(): string | Promise<string>
  abstract getEncryptionKey(): string | Promise<string>
  abstract getProviderType(): 'edge' | 'server'

  /**
   * 验证密钥是否符合要求
   * 
   * @param key 待验证的密钥
   * @throws Error 当密钥不符合要求时
   */
  protected validateKey(key: string): void {
    const validation = this.config.validation!

    if (!key) {
      throw new Error('Key cannot be empty')
    }

    if (key.length < validation.minKeyLength) {
      throw new Error(`Key must be at least ${validation.minKeyLength} characters long`)
    }

    if (validation.allowedKeyPattern && !validation.allowedKeyPattern.test(key)) {
      throw new Error('Key contains invalid characters')
    }

    if (validation.requireStrongKey && !this.isStrongKey(key)) {
      throw new Error('Key is not strong enough')
    }
  }

  /**
   * 检查是否为强密钥
   * 
   * @param key 待检查的密钥
   * @returns 是否为强密钥
   */
  protected isStrongKey(key: string): boolean {
    // 检查密钥复杂度：包含大小写字母、数字或符号
    const hasLower = /[a-z]/.test(key)
    const hasUpper = /[A-Z]/.test(key)
    const hasNumbers = /\d/.test(key)
    const hasSymbols = /[^A-Za-z0-9]/.test(key)

    const complexity = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length
    return complexity >= 3 && key.length >= 32
  }

  /**
   * 验证提供者配置
   * 
   * @throws Error 当配置无效时
   */
  protected async validateProvider(): Promise<void> {
    try {
      const jwtSecret = await this.getJWTSecret()
      const encryptionKey = await this.getEncryptionKey()

      this.validateKey(jwtSecret)
      this.validateKey(encryptionKey)
    } catch (error) {
      throw new Error(`Key provider validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 默认健康检查实现
   * 
   * @returns 是否健康
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.validateProvider()
      return true
    } catch {
      return false
    }
  }
}