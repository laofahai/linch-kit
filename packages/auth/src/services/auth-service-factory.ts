/**
 * @linch-kit/auth 认证服务工厂
 * 
 * 实现功能开关机制，支持多种认证实现的切换
 * 遵循依赖注入和控制反转原则
 * 
 * @author LinchKit Team
 * @since 0.1.0
 */

import { logger } from '@linch-kit/core/server'

import type { IAuthService } from '../types'

import { MockAuthService } from './mock-auth.service'

/**
 * 认证服务类型
 */
export type AuthServiceType = 'mock' | 'jwt' | 'nextauth' | 'custom'

/**
 * 认证服务配置
 */
export interface AuthServiceConfig {
  type: AuthServiceType
  fallbackToMock?: boolean
  config?: Record<string, unknown>
}

/**
 * 认证服务工厂
 * 
 * 功能开关机制实现：
 * 1. 支持多种认证实现的动态切换
 * 2. 提供失败回退机制
 * 3. 统一的服务生命周期管理
 * 4. 配置驱动的服务选择
 */
export class AuthServiceFactory {
  private static instance: AuthServiceFactory | null = null
  private currentService: IAuthService | null = null
  private config: AuthServiceConfig
  private readonly serviceCache = new Map<AuthServiceType, IAuthService>()

  private constructor(config: AuthServiceConfig) {
    this.config = config
  }

  /**
   * 获取工厂实例（单例）
   */
  static getInstance(config?: AuthServiceConfig): AuthServiceFactory {
    if (!AuthServiceFactory.instance) {
      if (!config) {
        throw new Error('AuthServiceFactory requires config on first initialization')
      }
      AuthServiceFactory.instance = new AuthServiceFactory(config)
    }
    return AuthServiceFactory.instance
  }

  /**
   * 获取认证服务实例
   */
  async getAuthService(): Promise<IAuthService> {
    if (this.currentService) {
      return this.currentService
    }

    try {
      this.currentService = await this.createAuthService(this.config.type)
      logger.info(`认证服务已启动: ${this.config.type}`, {
        service: 'auth-service-factory',
        serviceType: this.config.type,
        fallbackEnabled: this.config.fallbackToMock
      })
      return this.currentService
    } catch (error) {
      logger.error('认证服务启动失败', error instanceof Error ? error : undefined, {
        service: 'auth-service-factory',
        serviceType: this.config.type
      })

      // 启用回退机制
      if (this.config.fallbackToMock && this.config.type !== 'mock') {
        logger.warn('启用认证服务回退机制，使用Mock实现', {
          service: 'auth-service-factory',
          originalType: this.config.type,
          fallbackType: 'mock'
        })
        this.currentService = await this.createAuthService('mock')
        return this.currentService
      }

      throw error
    }
  }

  /**
   * 切换认证服务实现
   */
  async switchService(type: AuthServiceType): Promise<IAuthService> {
    logger.info(`正在切换认证服务: ${this.config.type} -> ${type}`, {
      service: 'auth-service-factory',
      oldType: this.config.type,
      newType: type
    })

    try {
      const newService = await this.createAuthService(type)
      
      // 健康检查
      if (!(await newService.isHealthy())) {
        throw new Error(`认证服务健康检查失败: ${type}`)
      }

      // 切换成功
      this.currentService = newService
      this.config.type = type
      
      logger.info(`认证服务切换成功: ${type}`, {
        service: 'auth-service-factory',
        newType: type
      })
      
      return newService
    } catch (error) {
      logger.error(`认证服务切换失败: ${type}`, error instanceof Error ? error : undefined, {
        service: 'auth-service-factory',
        targetType: type
      })

      // 如果当前服务仍然健康，保持不变
      if (this.currentService && await this.currentService.isHealthy()) {
        logger.warn('保持当前认证服务不变', {
          service: 'auth-service-factory',
          currentType: this.config.type
        })
        return this.currentService
      }

      // 启用回退机制
      if (this.config.fallbackToMock && type !== 'mock') {
        logger.warn('启用认证服务回退机制', {
          service: 'auth-service-factory',
          failedType: type,
          fallbackType: 'mock'
        })
        this.currentService = await this.createAuthService('mock')
        return this.currentService
      }

      throw error
    }
  }

  /**
   * 创建认证服务实例
   */
  private async createAuthService(type: AuthServiceType): Promise<IAuthService> {
    // 检查缓存
    const cached = this.serviceCache.get(type)
    if (cached) {
      return cached
    }

    let service: IAuthService

    switch (type) {
      case 'mock':
        service = new MockAuthService()
        break
      
      case 'jwt':
        // TODO: 实现JWT认证服务
        throw new Error('JWT认证服务尚未实现')
      
      case 'nextauth':
        // TODO: 实现NextAuth认证服务
        throw new Error('NextAuth认证服务尚未实现')
      
      case 'custom':
        // TODO: 支持自定义认证服务
        throw new Error('自定义认证服务尚未实现')
      
      default:
        throw new Error(`不支持的认证服务类型: ${type}`)
    }

    // 健康检查
    if (!(await service.isHealthy())) {
      throw new Error(`认证服务健康检查失败: ${type}`)
    }

    // 缓存服务实例
    this.serviceCache.set(type, service)

    return service
  }

  /**
   * 获取当前配置
   */
  getConfig(): AuthServiceConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  async updateConfig(config: Partial<AuthServiceConfig>): Promise<void> {
    const newConfig = { ...this.config, ...config }
    
    // 如果服务类型改变，切换服务
    if (newConfig.type !== this.config.type) {
      await this.switchService(newConfig.type)
    }
    
    this.config = newConfig
  }

  /**
   * 获取服务健康状态
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean
    serviceType: AuthServiceType
    lastChecked: Date
  }> {
    const service = await this.getAuthService()
    const isHealthy = await service.isHealthy()
    
    return {
      isHealthy,
      serviceType: service.getServiceType(),
      lastChecked: new Date()
    }
  }

  /**
   * 重置工厂（用于测试）
   */
  static reset(): void {
    if (AuthServiceFactory.instance) {
      AuthServiceFactory.instance.currentService = null
      AuthServiceFactory.instance.serviceCache.clear()
      AuthServiceFactory.instance = null
    }
  }
}

/**
 * 默认认证服务工厂配置
 */
export const defaultAuthServiceConfig: AuthServiceConfig = {
  type: 'mock',
  fallbackToMock: true,
  config: {}
}

/**
 * 创建认证服务工厂实例
 */
export function createAuthServiceFactory(config: AuthServiceConfig = defaultAuthServiceConfig): AuthServiceFactory {
  return AuthServiceFactory.getInstance(config)
}

/**
 * 获取认证服务实例的便捷方法
 */
export async function getAuthService(config?: AuthServiceConfig): Promise<IAuthService> {
  const factory = createAuthServiceFactory(config)
  return await factory.getAuthService()
}