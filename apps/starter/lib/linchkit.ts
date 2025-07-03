/**
 * LinchKit 初始化配置
 * 
 * 集中管理 LinchKit 框架的初始化和配置
 */

import { initLinchKit, type LinchKitContext } from '@linch-kit/core'
import { Logger } from '@linch-kit/core'

let linchKitContext: LinchKitContext | null = null

/**
 * 初始化 LinchKit
 */
export async function initializeLinchKit() {
  if (linchKitContext) {
    return linchKitContext
  }

  try {
    linchKitContext = await initLinchKit({
      appName: 'LinchKit Starter',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      debug: process.env.NODE_ENV === 'development',
      
      config: {
        // 数据库配置
        database: {
          url: process.env.DATABASE_URL,
          provider: 'postgresql'
        },
        
        // 认证配置
        auth: {
          secret: process.env.NEXTAUTH_SECRET,
          url: process.env.NEXTAUTH_URL,
          providers: {
            credentials: true,
            github: {
              enabled: !!process.env.GITHUB_CLIENT_ID,
              clientId: process.env.GITHUB_CLIENT_ID,
              clientSecret: process.env.GITHUB_CLIENT_SECRET
            },
            google: {
              enabled: !!process.env.GOOGLE_CLIENT_ID,
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET
            }
          }
        },
        
        // API 配置
        api: {
          baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
          timeout: parseInt(process.env.API_TIMEOUT || '30000', 10)
        },
        
        // 多租户配置
        multiTenant: {
          enabled: process.env.ENABLE_MULTI_TENANT === 'true',
          defaultTenant: process.env.DEFAULT_TENANT_ID
        },
        
        // 功能开关
        features: {
          registration: process.env.ENABLE_REGISTRATION !== 'false',
          socialLogin: process.env.ENABLE_SOCIAL_LOGIN !== 'false',
          mfa: process.env.ENABLE_MFA === 'true',
          audit: process.env.ENABLE_AUDIT !== 'false'
        }
      },
      
      onInit: async () => {
        Logger.info('LinchKit initialization complete')
        
        // 验证必需的环境变量
        const requiredEnvVars = [
          'DATABASE_URL',
          'NEXTAUTH_SECRET',
          'NEXTAUTH_URL'
        ]
        
        const missing = requiredEnvVars.filter(key => !process.env[key])
        if (missing.length > 0) {
          throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
        }
      },
      
      onError: (error) => {
        Logger.error('LinchKit initialization failed:', error)
      }
    })
    
    return linchKitContext
  } catch (error) {
    Logger.error('Failed to initialize LinchKit:', error)
    throw error
  }
}

/**
 * 获取 LinchKit 配置
 */
export function getLinchKitConfig<T = any>(path: string): T | undefined {
  if (!linchKitContext) {
    throw new Error('LinchKit not initialized')
  }
  
  const keys = path.split('.')
  let value: any = linchKitContext.config
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
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
 * 验证环境配置
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查必需的环境变量
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
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
    errors
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