#!/usr/bin/env bun

/**
 * JWT认证系统完整验证脚本
 * 
 * 验证JWT认证系统的完整功能：
 * - JWTAuthService基础功能
 * - AuthServiceFactory集成
 * - 功能开关机制
 * - 错误处理和回退
 */

import { getAuthService, AuthServiceFactory } from '../src/services'
import type { AuthRequest } from '../src/types'

const logger = console

/**
 * 验证JWT认证服务基础功能
 */
async function validateJWTAuthService() {
  logger.info('🔍 验证JWT认证服务基础功能...')
  
  try {
    // 创建JWT认证服务
    const authService = await getAuthService({
      type: 'jwt',
      fallbackToMock: false,
      config: {
        jwtSecret: 'test-jwt-secret-for-validation-with-at-least-32-characters',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
      }
    })

    // 验证服务类型
    if (authService.getServiceType() !== 'jwt') {
      throw new Error(`期望服务类型为'jwt'，实际为'${authService.getServiceType()}'`)
    }

    // 验证健康检查
    const isHealthy = await authService.isHealthy()
    if (!isHealthy) {
      throw new Error('JWT认证服务健康检查失败')
    }

    // 验证认证功能
    const authRequest: AuthRequest = {
      provider: 'credentials',
      credentials: {
        email: 'test@example.com',
        password: 'password123'
      }
    }

    const authResult = await authService.authenticate(authRequest)
    if (!authResult.success || !authResult.tokens) {
      throw new Error('JWT认证失败')
    }

    // 验证会话验证
    const session = await authService.validateSession(authResult.tokens.accessToken)
    if (!session || session.userId !== 'test-user-id') {
      throw new Error('JWT会话验证失败')
    }

    // 验证令牌刷新
    const refreshedSession = await authService.refreshToken(authResult.tokens.refreshToken)
    if (!refreshedSession || refreshedSession.userId !== 'test-user-id') {
      throw new Error('JWT令牌刷新失败')
    }

    // 验证会话注销（使用刷新后的会话ID）
    const revokeResult = await authService.revokeSession(refreshedSession.id)
    if (!revokeResult) {
      throw new Error('JWT会话注销失败')
    }

    logger.info('✅ JWT认证服务基础功能验证通过')
    return true
  } catch (error) {
    logger.error('❌ JWT认证服务基础功能验证失败:', error)
    return false
  } finally {
    AuthServiceFactory.reset()
  }
}

/**
 * 验证功能开关机制
 */
async function validateFeatureToggle() {
  logger.info('🔍 验证功能开关机制...')
  
  try {
    // 创建工厂实例
    const factory = AuthServiceFactory.getInstance({
      type: 'mock',
      fallbackToMock: true
    })

    // 验证初始为Mock服务
    let service = await factory.getAuthService()
    if (service.getServiceType() !== 'mock') {
      throw new Error(`期望初始服务类型为'mock'，实际为'${service.getServiceType()}'`)
    }

    // 切换到JWT服务
    service = await factory.switchService('jwt')
    if (service.getServiceType() !== 'jwt') {
      throw new Error(`期望切换后服务类型为'jwt'，实际为'${service.getServiceType()}'`)
    }

    // 验证JWT服务功能
    const authRequest: AuthRequest = {
      provider: 'credentials',
      credentials: {
        email: 'test@example.com',
        password: 'password123'
      }
    }

    const authResult = await service.authenticate(authRequest)
    if (!authResult.success) {
      throw new Error('JWT服务切换后认证失败')
    }

    // 切换回Mock服务
    service = await factory.switchService('mock')
    if (service.getServiceType() !== 'mock') {
      throw new Error(`期望切换后服务类型为'mock'，实际为'${service.getServiceType()}'`)
    }

    logger.info('✅ 功能开关机制验证通过')
    return true
  } catch (error) {
    logger.error('❌ 功能开关机制验证失败:', error)
    return false
  } finally {
    AuthServiceFactory.reset()
  }
}

/**
 * 验证错误处理和回退机制
 */
async function validateErrorHandling() {
  logger.info('🔍 验证错误处理和回退机制...')
  
  try {
    // 测试无效JWT配置的回退
    const authService = await getAuthService({
      type: 'jwt',
      fallbackToMock: true,
      config: {
        jwtSecret: 'too-short', // 无效的JWT secret
        accessTokenExpiry: '15m'
      }
    })

    // 应该回退到Mock服务
    if (authService.getServiceType() !== 'mock') {
      throw new Error(`期望回退到'mock'服务，实际为'${authService.getServiceType()}'`)
    }

    // 验证Mock服务正常工作
    const authRequest: AuthRequest = {
      provider: 'credentials',
      credentials: {
        email: 'test@linchkit.com',
        password: 'password123'
      }
    }
    
    // 检查服务类型以确认回退成功
    logger.info(`服务类型: ${authService.getServiceType()}`)

    const authResult = await authService.authenticate(authRequest)
    if (!authResult.success) {
      logger.error('Mock服务认证失败，错误:', authResult.error)
      throw new Error('回退到Mock服务后认证失败')
    }

    logger.info('✅ 错误处理和回退机制验证通过')
    return true
  } catch (error) {
    logger.error('❌ 错误处理和回退机制验证失败:', error)
    return false
  } finally {
    AuthServiceFactory.reset()
  }
}

/**
 * 验证配置管理
 */
async function validateConfigManagement() {
  logger.info('🔍 验证配置管理...')
  
  try {
    const factory = AuthServiceFactory.getInstance({
      type: 'jwt',
      fallbackToMock: false,
      config: {
        jwtSecret: 'initial-jwt-secret-with-at-least-32-characters',
        accessTokenExpiry: '15m'
      }
    })

    // 验证初始配置
    let config = factory.getConfig()
    if (config.type !== 'jwt') {
      throw new Error(`期望初始配置类型为'jwt'，实际为'${config.type}'`)
    }

    // 更新配置
    await factory.updateConfig({
      type: 'jwt',
      config: {
        jwtSecret: 'updated-jwt-secret-with-at-least-32-characters',
        accessTokenExpiry: '30m'
      }
    })

    // 验证配置更新
    config = factory.getConfig()
    if (!config.config || (config.config as any).accessTokenExpiry !== '30m') {
      throw new Error('配置更新失败')
    }

    // 验证服务仍然正常工作
    const service = await factory.getAuthService()
    const isHealthy = await service.isHealthy()
    if (!isHealthy) {
      throw new Error('配置更新后服务健康检查失败')
    }

    logger.info('✅ 配置管理验证通过')
    return true
  } catch (error) {
    logger.error('❌ 配置管理验证失败:', error)
    return false
  } finally {
    AuthServiceFactory.reset()
  }
}

/**
 * 验证令牌格式和安全性
 */
async function validateTokenSecurity() {
  logger.info('🔍 验证令牌格式和安全性...')
  
  try {
    const authService = await getAuthService({
      type: 'jwt',
      fallbackToMock: false,
      config: {
        jwtSecret: 'secure-jwt-secret-with-at-least-32-characters',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
      }
    })

    // 进行认证
    const authRequest: AuthRequest = {
      provider: 'credentials',
      credentials: {
        email: 'test@example.com',
        password: 'password123'
      }
    }

    const authResult = await authService.authenticate(authRequest)
    if (!authResult.success || !authResult.tokens) {
      throw new Error('认证失败')
    }

    // 验证访问令牌格式（JWT应该有3个部分）
    const accessTokenParts = authResult.tokens.accessToken.split('.')
    if (accessTokenParts.length !== 3) {
      throw new Error('访问令牌格式不正确')
    }

    // 验证刷新令牌格式（应该是UUID）
    const refreshTokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!refreshTokenPattern.test(authResult.tokens.refreshToken)) {
      throw new Error('刷新令牌格式不正确')
    }

    // 验证令牌过期时间
    if (authResult.tokens.expiresIn !== 900) { // 15分钟 = 900秒
      throw new Error('令牌过期时间设置不正确')
    }

    // 验证令牌无法被其他服务验证
    // 重置工厂以确保创建新的服务实例
    AuthServiceFactory.reset()
    
    const otherAuthService = await getAuthService({
      type: 'jwt',
      fallbackToMock: false,
      config: {
        jwtSecret: 'different-jwt-secret-with-at-least-32-characters',
        accessTokenExpiry: '15m'
      }
    })

    const invalidSession = await otherAuthService.validateSession(authResult.tokens.accessToken)
    if (invalidSession) {
      throw new Error('令牌不应该被不同密钥的服务验证')
    }

    logger.info('✅ 令牌格式和安全性验证通过')
    return true
  } catch (error) {
    logger.error('❌ 令牌格式和安全性验证失败:', error)
    return false
  } finally {
    AuthServiceFactory.reset()
  }
}

/**
 * 主验证函数
 */
async function main() {
  logger.info('🚀 开始LinchKit JWT认证系统完整验证')
  logger.info('=' .repeat(60))

  const tests = [
    { name: 'JWT认证服务基础功能', fn: validateJWTAuthService },
    { name: '功能开关机制', fn: validateFeatureToggle },
    { name: '错误处理和回退机制', fn: validateErrorHandling },
    { name: '配置管理', fn: validateConfigManagement },
    { name: '令牌格式和安全性', fn: validateTokenSecurity }
  ]

  let passed = 0
  let total = tests.length

  for (const test of tests) {
    logger.info(`\n🧪 测试: ${test.name}`)
    logger.info('-'.repeat(40))
    
    const result = await test.fn()
    if (result) {
      passed++
    }
  }

  logger.info('\n' + '='.repeat(60))
  logger.info(`📊 验证结果: ${passed}/${total} 通过`)
  
  if (passed === total) {
    logger.info('🎉 所有验证通过！JWT认证系统运行正常')
    process.exit(0)
  } else {
    logger.error(`❌ ${total - passed} 个验证失败，请检查问题`)
    process.exit(1)
  }
}

// 运行验证
main().catch(error => {
  logger.error('验证过程发生错误:', error)
  process.exit(1)
})