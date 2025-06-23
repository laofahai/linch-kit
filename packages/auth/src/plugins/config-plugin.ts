/**
 * Auth Core 配置插件
 *
 * 将认证相关的配置扩展注册到 core 包的配置系统中
 */

// 临时使用 any 类型，等待 core 包完善 ConfigPlugin 类型
// import type { ConfigPlugin } from '@linch-kit/core'
type ConfigPlugin = any
import { z } from 'zod'

/**
 * 认证提供商配置 Schema
 */
const AuthProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['oauth', 'credentials', 'email', 'sms']),
  options: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().default(true),
})

/**
 * 会话配置 Schema
 */
const SessionConfigSchema = z.object({
  strategy: z.enum(['jwt', 'database']).default('jwt'),
  maxAge: z.number().default(30 * 24 * 60 * 60), // 30 days
  updateAge: z.number().default(24 * 60 * 60), // 24 hours
  generateSessionToken: z.function().optional(),
  secret: z.string().optional(),
})

/**
 * 权限配置 Schema
 */
const PermissionConfigSchema = z.object({
  strategy: z.enum(['rbac', 'abac', 'hybrid']).default('rbac'),
  hierarchical: z.boolean().default(false),
  cacheTimeout: z.number().default(5 * 60 * 1000), // 5 minutes
  extensionPoints: z.array(z.string()).default([]),
  defaultRoles: z.array(z.string()).default([]),
})

/**
 * 多租户配置 Schema
 */
const MultiTenantConfigSchema = z.object({
  enabled: z.boolean().default(false),
  strategy: z.enum(['subdomain', 'path', 'header', 'database']).default('database'),
  isolation: z.enum(['shared', 'separate']).default('shared'),
  defaultTenant: z.string().optional(),
})

/**
 * Auth 配置 Schema
 */
const AuthConfigSchema = z.object({
  providers: z.array(AuthProviderSchema).default([]),
  session: SessionConfigSchema.default({}),
  permissions: PermissionConfigSchema.optional(),
  multiTenant: MultiTenantConfigSchema.optional(),
  pages: z
    .object({
      signIn: z.string().optional(),
      signOut: z.string().optional(),
      error: z.string().optional(),
      verifyRequest: z.string().optional(),
      newUser: z.string().optional(),
    })
    .optional(),
  callbacks: z
    .object({
      signIn: z.function().optional(),
      redirect: z.function().optional(),
      session: z.function().optional(),
      jwt: z.function().optional(),
    })
    .optional(),
  events: z
    .object({
      signIn: z.function().optional(),
      signOut: z.function().optional(),
      createUser: z.function().optional(),
      updateUser: z.function().optional(),
      linkAccount: z.function().optional(),
      session: z.function().optional(),
    })
    .optional(),
  debug: z.boolean().default(false),
  logger: z
    .object({
      error: z.function().optional(),
      warn: z.function().optional(),
      debug: z.function().optional(),
    })
    .optional(),
})

/**
 * Auth 配置插件
 */
export const authConfigPlugin: ConfigPlugin = {
  name: '@linch-kit/auth',
  description: 'Authentication and authorization configuration',
  version: '0.1.0',

  configSchema: {
    auth: AuthConfigSchema,
  },

  configDefaults: {
    auth: {
      providers: [],
      session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
      },
      debug: process.env.NODE_ENV === 'development',
    },
  },

  configFiles: ['auth.config.ts', 'auth.config.js', 'auth.config.mjs', 'auth.config.json'],

  envVariables: ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'AUTH_TRUST_HOST', 'AUTH_SECRET'],

  async validateConfig(config: any) {
    try {
      const result = AuthConfigSchema.safeParse(config.auth)

      if (!result.success) {
        return {
          valid: false,
          errors: result.error.errors.map(err => ({
            path: ['auth', ...err.path].join('.'),
            message: err.message,
          })),
        }
      }

      // 额外的业务逻辑验证
      const authConfig = result.data
      const errors: Array<{ path: string; message: string }> = []

      // 验证提供商配置
      if (authConfig.providers.length === 0) {
        errors.push({
          path: 'auth.providers',
          message: 'At least one authentication provider must be configured',
        })
      }

      // 验证 JWT 配置
      if (
        authConfig.session.strategy === 'jwt' &&
        !process.env.NEXTAUTH_SECRET &&
        !authConfig.session.secret
      ) {
        errors.push({
          path: 'auth.session.secret',
          message: 'JWT strategy requires NEXTAUTH_SECRET environment variable or session.secret',
        })
      }

      // 验证多租户配置
      if (authConfig.multiTenant?.enabled) {
        if (authConfig.multiTenant.strategy === 'subdomain' && !process.env.NEXTAUTH_URL) {
          errors.push({
            path: 'auth.multiTenant',
            message: 'Subdomain strategy requires NEXTAUTH_URL environment variable',
          })
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            path: 'auth',
            message: `Configuration validation failed: ${error}`,
          },
        ],
      }
    }
  },

  async transformConfig(config: any) {
    if (!config.auth) {
      return config
    }

    // 环境变量替换
    if (config.auth.session?.secret === undefined && process.env.NEXTAUTH_SECRET) {
      config.auth.session.secret = process.env.NEXTAUTH_SECRET
    }

    // 提供商配置转换
    if (config.auth.providers) {
      config.auth.providers = config.auth.providers.map((provider: any) => {
        // 从环境变量中读取敏感配置
        if (provider.type === 'oauth' && provider.options) {
          const envPrefix = `AUTH_${provider.id.toUpperCase()}`
          if (!provider.options.clientId && process.env[`${envPrefix}_ID`]) {
            provider.options.clientId = process.env[`${envPrefix}_ID`]
          }
          if (!provider.options.clientSecret && process.env[`${envPrefix}_SECRET`]) {
            provider.options.clientSecret = process.env[`${envPrefix}_SECRET`]
          }
        }

        return provider
      })
    }

    return config
  },

  getConfigTemplate(type: 'ts' | 'js' | 'json' = 'ts') {
    switch (type) {
      case 'ts':
        return `import type { AuthConfig } from '@linch-kit/auth'

const authConfig: AuthConfig = {
  providers: [
    // Add your authentication providers here
    // Example:
    // {
    //   id: 'google',
    //   name: 'Google',
    //   type: 'oauth',
    //   options: {
    //     clientId: process.env.AUTH_GOOGLE_ID,
    //     clientSecret: process.env.AUTH_GOOGLE_SECRET,
    //   }
    // }
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  permissions: {
    strategy: 'rbac',
    hierarchical: false,
  },
  debug: process.env.NODE_ENV === 'development',
}

export default authConfig
`

      case 'js':
        return `/** @type {import('@linch-kit/auth').AuthConfig} */
const authConfig = {
  providers: [
    // Add your authentication providers here
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  permissions: {
    strategy: 'rbac',
    hierarchical: false,
  },
  debug: process.env.NODE_ENV === 'development',
}

module.exports = authConfig
`

      case 'json':
        return JSON.stringify(
          {
            providers: [],
            session: {
              strategy: 'jwt',
              maxAge: 2592000,
            },
            permissions: {
              strategy: 'rbac',
              hierarchical: false,
            },
            debug: false,
          },
          null,
          2
        )

      default:
        throw new Error(`Unsupported config type: ${type}`)
    }
  },
}

/**
 * 注册 Auth Core 配置插件
 */
export function registerAuthCoreConfigPlugin() {
  // 这个函数会在包被导入时自动调用
  // 通过 core 包的插件系统注册配置
  if (typeof globalThis !== 'undefined' && (globalThis as any).__LINCH_CONFIG_REGISTRY__) {
    ;(globalThis as any).__LINCH_CONFIG_REGISTRY__.registerPlugin(authConfigPlugin)
  }
}

/**
 * 导出类型定义
 */
export type AuthConfig = z.infer<typeof AuthConfigSchema>
export type AuthProvider = z.infer<typeof AuthProviderSchema>
export type SessionConfig = z.infer<typeof SessionConfigSchema>
export type PermissionConfig = z.infer<typeof PermissionConfigSchema>
export type MultiTenantConfig = z.infer<typeof MultiTenantConfigSchema>
