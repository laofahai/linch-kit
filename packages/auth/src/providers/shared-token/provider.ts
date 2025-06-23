/**
 * Shared Token 认证提供者
 * 
 * 保留现有的 shared token 功能，确保向后兼容
 */

import type { AuthUser } from '../../types/auth'

// 动态导入 next-auth，在 CLI 环境中可能不可用
let CredentialsProvider: any

// 创建 mock 函数
const createMockCredentialsProvider = (config: any) => ({
  id: config.id || 'credentials',
  name: config.name || 'Credentials',
  type: 'credentials',
  credentials: config.credentials,
  authorize: config.authorize
})

try {
  const nextAuthModule = require('next-auth/providers/credentials')
  CredentialsProvider = nextAuthModule.default || nextAuthModule

  // 确保 CredentialsProvider 是一个函数
  if (typeof CredentialsProvider !== 'function') {
    CredentialsProvider = createMockCredentialsProvider
  }
} catch {
  // 在 CLI 环境中，next-auth 可能不可用，提供一个 mock
  CredentialsProvider = createMockCredentialsProvider
}

/**
 * 共享令牌数据源接口
 */
export interface SharedTokenSource {
  /** API 基础 URL */
  apiUrl: string
  /** 用户信息端点 */
  userEndpoint?: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 自定义用户数据转换 */
  transformUser?: (data: any) => AuthUser
}

/**
 * 共享令牌选项
 */
export interface SharedTokenOptions {
  /** 共享令牌值 */
  token: string
  /** 数据源配置 */
  source: SharedTokenSource
  /** 提供者名称 */
  name?: string
  /** 提供者 ID */
  id?: string
  /** 是否启用调试 */
  debug?: boolean
}

/**
 * 创建共享令牌认证提供者
 */
export function createSharedTokenProvider(options: SharedTokenOptions) {
  return CredentialsProvider({
    id: options.id || 'shared-token',
    name: options.name || 'Shared Token',
    credentials: {
      token: {
        label: 'Token',
        type: 'password',
        placeholder: 'Enter shared token'
      }
    },
    async authorize(credentials: any) {
      try {
        const token = credentials?.token
        
        // 验证令牌
        if (!token || token !== options.token) {
          if (options.debug) {
            console.log('Shared token validation failed:', { 
              provided: token, 
              expected: options.token 
            })
          }
          return null
        }

        // 获取用户信息
        const userEndpoint = options.source.userEndpoint || '/api/user'
        const url = `${options.source.apiUrl}${userEndpoint}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.source.headers
          }
        })

        if (!response.ok) {
          if (options.debug) {
            console.error('Failed to fetch user info:', response.status, response.statusText)
          }
          return null
        }

        const userData = await response.json()
        
        // 转换用户数据
        if (options.source.transformUser) {
          return options.source.transformUser(userData)
        }

        // 默认转换
        const data = userData as any
        return {
          id: data.id || data.userId || 'shared-token-user',
          name: data.name || data.username || 'Shared Token User',
          email: data.email,
          ...data
        }

      } catch (error) {
        if (options.debug) {
          console.error('Shared token authentication error:', error)
        }
        return null
      }
    }
  })
}

/**
 * 创建传统共享令牌提供者（向后兼容）
 */
export function createLegacySharedTokenProvider(token: string, apiUrl?: string) {
  return createSharedTokenProvider({
    token,
    source: {
      apiUrl: apiUrl || process.env.SHARED_TOKEN_API_URL || 'http://localhost:3000',
      userEndpoint: '/api/user',
      transformUser: (data) => ({
        id: data.id || 'shared-token-user',
        name: data.name || 'Shared Token User',
        email: data.email,
        ...data
      })
    },
    debug: process.env.NODE_ENV === 'development'
  })
}

/**
 * 默认共享令牌提供者实例
 * 
 * 使用环境变量配置，保持向后兼容
 */
export const sharedTokenProvider = createLegacySharedTokenProvider(
  process.env.SHARED_TOKEN || 'default-shared-token',
  process.env.SHARED_TOKEN_API_URL
)

/**
 * 从环境变量创建共享令牌提供者
 */
export function createSharedTokenProviderFromEnv(envPrefix = 'SHARED_TOKEN') {
  const token = process.env[envPrefix] || process.env.SHARED_TOKEN
  const apiUrl = process.env[`${envPrefix}_API_URL`] || process.env.SHARED_TOKEN_API_URL
  
  if (!token) {
    throw new Error(`Environment variable ${envPrefix} is required for shared token provider`)
  }

  return createLegacySharedTokenProvider(token, apiUrl)
}

/**
 * 高级共享令牌提供者配置
 */
export function createAdvancedSharedTokenProvider(config: {
  tokens: string[]  // 支持多个令牌
  source: SharedTokenSource
  name?: string
  id?: string
  debug?: boolean
}) {
  return CredentialsProvider({
    id: config.id || 'shared-token-advanced',
    name: config.name || 'Shared Token (Advanced)',
    credentials: {
      token: {
        label: 'Token',
        type: 'password',
        placeholder: 'Enter shared token'
      }
    },
    async authorize(credentials: any) {
      try {
        const token = credentials?.token
        
        // 验证令牌（支持多个）
        if (!token || !config.tokens.includes(token)) {
          if (config.debug) {
            console.log('Advanced shared token validation failed:', { 
              provided: token, 
              validTokens: config.tokens.length 
            })
          }
          return null
        }

        // 获取用户信息
        const userEndpoint = config.source.userEndpoint || '/api/user'
        const url = `${config.source.apiUrl}${userEndpoint}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...config.source.headers
          }
        })

        if (!response.ok) {
          if (config.debug) {
            console.error('Failed to fetch user info:', response.status, response.statusText)
          }
          return null
        }

        const userData = await response.json()
        
        // 转换用户数据
        if (config.source.transformUser) {
          return config.source.transformUser(userData)
        }

        // 默认转换
        const data = userData as any
        return {
          id: data.id || data.userId || `shared-token-user-${Date.now()}`,
          name: data.name || data.username || 'Shared Token User',
          email: data.email,
          token, // 保存使用的令牌
          ...data
        }

      } catch (error) {
        if (config.debug) {
          console.error('Advanced shared token authentication error:', error)
        }
        return null
      }
    }
  })
}
