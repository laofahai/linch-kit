/**
 * 共享认证服务 - 避免重复创建实例和指标重复注册
 */

import { createJWTAuthService, createDatabaseAuthService, createPrismaAdapter } from '@linch-kit/auth'
import { logger } from '@linch-kit/core/server'
import { Registry } from 'prom-client'

import { PrismaClient } from '../prisma/generated/client'

// 全局单例实例
let authService: ReturnType<typeof createJWTAuthService> | null = null
let prisma: PrismaClient | null = null
let dedicatedRegistry: Registry | null = null

/**
 * 获取认证服务实例（单例模式）
 */
export async function getAuthService() {
  if (!authService) {
    try {
      logger.info('初始化认证服务', {
        service: 'auth-service-singleton'
      })

      // 创建专用的 Prometheus registry 避免指标冲突
      if (!dedicatedRegistry) {
        dedicatedRegistry = new Registry()
        logger.info('创建专用 Prometheus registry', {
          service: 'auth-service-singleton'
        })
      }

      // 创建 Prisma 客户端
      prisma = new PrismaClient()
      
      // 创建 Prisma 适配器
      const prismaAdapter = createPrismaAdapter(prisma)
      
      // 创建数据库认证服务
      const databaseAuthService = createDatabaseAuthService({
        databaseAdapter: prismaAdapter,
        saltRounds: 12,
        enableSessionTracking: true
      })

      // 动态导入性能监控器（避免构建时导入问题）
      const { createAuthPerformanceMonitor } = await import('@linch-kit/auth')
      const { LinchKitMetricCollector } = await import('@linch-kit/core/server')
      
      const metricCollector = new LinchKitMetricCollector(dedicatedRegistry)
      const performanceMonitor = createAuthPerformanceMonitor(logger, metricCollector)
      
      // 创建 JWT 认证服务，集成数据库服务和专用监控器
      authService = createJWTAuthService({
        jwtSecret: process.env['JWT_SECRET'] ?? 'your-super-secret-jwt-key-must-be-at-least-32-characters-long-development-key',
        accessTokenExpiry: process.env['ACCESS_TOKEN_EXPIRY'] ?? '15m',
        refreshTokenExpiry: process.env['REFRESH_TOKEN_EXPIRY'] ?? '7d',
        algorithm: 'HS256',
        issuer: 'linchkit-starter',
        audience: 'linchkit-starter-app',
        databaseAuthService // 集成数据库认证服务
      }, performanceMonitor) // 传入专用的性能监控器
      
      logger.info('认证服务初始化完成', {
        service: 'auth-service-singleton',
        hasDatabase: !!databaseAuthService,
        hasDedicatedRegistry: !!dedicatedRegistry
      })
    } catch (error) {
      logger.error('认证服务初始化失败', error instanceof Error ? error : undefined, {
        service: 'auth-service-singleton',
        errorMessage: error instanceof Error ? error.message : String(error)
      })
      
      // 重置状态以允许重试
      authService = null
      prisma = null
      dedicatedRegistry = null
      
      throw error
    }
  }
  
  return authService
}

/**
 * 获取 Prisma 客户端实例
 */
export function getPrismaClient() {
  // 如果没有通过认证服务初始化，直接创建
  prisma ??= new PrismaClient()
  return prisma
}

/**
 * 清理资源
 */
export async function cleanup() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
  if (dedicatedRegistry) {
    dedicatedRegistry.clear()
    dedicatedRegistry = null
  }
  authService = null
}

// 进程退出时清理资源
process.on('SIGTERM', () => { cleanup().catch(console.error) })
process.on('SIGINT', () => { cleanup().catch(console.error) })