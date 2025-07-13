/**
 * LinchKit 初始化配置
 *
 * 集中管理 LinchKit 框架的初始化和配置
 */

import { Logger } from '@linch-kit/core/client'

// 客户端专用的LinchKit上下文类型
export interface LinchKitContext {
  app: {
    name: string
    version: string
    environment: string
  }
  config: Record<string, unknown>
  logger: typeof Logger
}


let linchKitContext: LinchKitContext | null = null

/**
 * 客户端专用的 LinchKit 初始化
 */
export async function initializeLinchKit(): Promise<LinchKitContext> {
  if (linchKitContext) {
    return linchKitContext
  }

  try {
    // 客户端简化初始化，避免服务端模块
    const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'

    // 配置日志
    if (environment === 'development') {
      Logger.setLevel('debug')
    }

    Logger.info(`Initializing LinchKit Starter v${version} in ${environment} mode`)

    // 创建客户端上下文
    linchKitContext = {
      app: {
        name: 'LinchKit Starter',
        version,
        environment,
      },
      config: {
        // API 配置（客户端安全）
        api: {
          baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
          timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
        },

        // 功能开关（客户端安全）
        features: {
          registration: process.env.ENABLE_REGISTRATION !== 'false',
          socialLogin: process.env.ENABLE_SOCIAL_LOGIN !== 'false',
          mfa: process.env.ENABLE_MFA === 'true',
          audit: process.env.ENABLE_AUDIT !== 'false',
        },
      },
      logger: Logger,
    }

    Logger.info(`LinchKit Starter initialized successfully`)
    return linchKitContext
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    Logger.error(`Failed to initialize LinchKit: ${err.message}`)
    throw err
  }
}

/**
 * 获取 LinchKit 配置
 */
export function getLinchKitConfig<T = unknown>(path: string): T | undefined {
  if (!linchKitContext) {
    throw new Error('LinchKit not initialized')
  }

  const keys = path.split('.')
  let value: unknown = linchKitContext.config

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return value as T
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: string): boolean {
  const features = getLinchKitConfig<Record<string, boolean>>('features')
  return features?.[feature] ?? false
}

/**
 * 获取环境变量（带默认值）
 */
export function getEnvVar(key: string, defaultValue = ''): string {
  return process.env[key] || defaultValue
}

/**
 * 验证环境配置 - 仅在服务端执行
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  // 客户端跳过验证，避免敏感信息泄露
  if (typeof window !== 'undefined') {
    return { valid: true, errors: [] }
  }

  const errors: string[] = []

  // 检查必需的环境变量
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  }

  // 检查 URL 格式
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string')
  }

  if (process.env.NEXTAUTH_URL && !isValidUrl(process.env.NEXTAUTH_URL)) {
    errors.push('NEXTAUTH_URL must be a valid URL')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 导出 LinchKit 实例
export { Logger }
