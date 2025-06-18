import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import type { AuthCoreConfig } from '../types/auth'

/**
 * 配置文件类型
 */
export type ConfigFileType = 'js' | 'ts' | 'json' | 'mjs'

/**
 * 配置加载选项
 */
export interface ConfigLoaderOptions {
  /** 配置文件路径 */
  configPath?: string
  /** 工作目录 */
  cwd?: string
  /** 是否必须存在配置文件 */
  required?: boolean
}

/**
 * 默认配置文件名
 */
const DEFAULT_CONFIG_FILES = [
  'auth.config.ts',
  'auth.config.js',
  'auth.config.mjs',
  'auth.config.json',
  'linch-auth.config.ts',
  'linch-auth.config.js',
  'linch-auth.config.mjs',
  'linch-auth.config.json'
]

/**
 * 查找配置文件
 */
export function findConfigFile(options: ConfigLoaderOptions = {}): string | null {
  const { configPath, cwd = process.cwd() } = options

  // 如果指定了配置文件路径，直接使用
  if (configPath) {
    const fullPath = resolve(cwd, configPath)
    return existsSync(fullPath) ? fullPath : null
  }

  // 按顺序查找默认配置文件
  for (const fileName of DEFAULT_CONFIG_FILES) {
    const fullPath = resolve(cwd, fileName)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }

  return null
}

/**
 * 加载配置文件
 */
export async function loadAuthConfig(options: ConfigLoaderOptions = {}): Promise<AuthCoreConfig | null> {
  const configFile = findConfigFile(options)

  if (!configFile) {
    if (options.required) {
      throw new Error('Auth config file not found')
    }
    return null
  }

  try {
    const ext = configFile.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'json':
        return loadJsonConfig(configFile)
      case 'js':
      case 'mjs':
        return await loadJsConfig(configFile)
      case 'ts':
        return await loadTsConfig(configFile)
      default:
        throw new Error(`Unsupported config file type: ${ext}`)
    }
  } catch (error) {
    throw new Error(`Failed to load auth config from ${configFile}: ${error}`)
  }
}

/**
 * 加载 JSON 配置
 */
function loadJsonConfig(configFile: string): AuthCoreConfig {
  const content = readFileSync(configFile, 'utf-8')
  return JSON.parse(content)
}

/**
 * 加载 JS/MJS 配置
 */
async function loadJsConfig(configFile: string): Promise<AuthCoreConfig> {
  const { pathToFileURL } = await import('url')
  const module = await import(pathToFileURL(configFile).href)
  return module.default || module
}

/**
 * 加载 TS 配置
 */
async function loadTsConfig(configFile: string): Promise<AuthCoreConfig> {
  // 在实际项目中，这里可能需要使用 ts-node 或其他 TypeScript 运行时
  // 现在先简单处理
  try {
    // 尝试使用动态导入（如果环境支持）
    const { pathToFileURL } = await import('url')
    const module = await import(pathToFileURL(configFile).href)
    return module.default || module
  } catch (error) {
    throw new Error(`TypeScript config loading requires ts-node or similar runtime: ${error}`)
  }
}

/**
 * 生成配置文件模板
 */
export function generateConfigTemplate(type: ConfigFileType = 'ts'): string {
  switch (type) {
    case 'ts':
      return generateTsConfigTemplate()
    case 'js':
      return generateJsConfigTemplate()
    case 'json':
      return generateJsonConfigTemplate()
    case 'mjs':
      return generateMjsConfigTemplate()
    default:
      throw new Error(`Unsupported config file type: ${type}`)
  }
}

/**
 * TypeScript 配置模板
 */
function generateTsConfigTemplate(): string {
  return `import type { AuthCoreConfig } from '@linch-kit/auth-core'
import { 
  sharedTokenProvider,
  oauthProviders,
  createCredentialsProvider,
  BasicUserTemplate 
} from '@linch-kit/auth-core'

const authConfig: AuthCoreConfig = {
  // 用户实体（可选，使用模板或自定义）
  userEntity: BasicUserTemplate,

  // 认证提供者
  providers: [
    // 共享令牌认证
    sharedTokenProvider,

    // OAuth 认证
    oauthProviders.google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),

    // 邮箱密码认证
    createCredentialsProvider({
      authorize: async (credentials) => {
        // 实现你的认证逻辑
        const { email, password } = credentials
        // 验证用户凭据...
        return { id: '1', email, name: 'User' }
      }
    })
  ],

  // 会话配置
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  // 权限配置（可选）
  permissions: {
    strategy: 'rbac',
    checkPermission: async (user, resource, action) => {
      // 实现你的权限检查逻辑
      return true
    }
  },

  // 多租户配置（可选）
  multiTenant: {
    enabled: false,
    tenantResolver: async (request) => {
      // 从请求中提取租户信息
      return 'default'
    }
  },

  // 回调函数
  callbacks: {
    signIn: async (user, account, profile) => {
      // 登录回调
      return true
    },
    session: async (session, user) => {
      // 会话回调
      return session
    }
  },

  // 页面配置
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },

  // 调试模式
  debug: process.env.NODE_ENV === 'development'
}

export default authConfig
`
}

/**
 * JavaScript 配置模板
 */
function generateJsConfigTemplate(): string {
  return `const { 
  sharedTokenProvider,
  oauthProviders,
  createCredentialsProvider,
  BasicUserTemplate 
} = require('@linch-kit/auth-core')

/** @type {import('@linch-kit/auth-core').AuthCoreConfig} */
const authConfig = {
  userEntity: BasicUserTemplate,

  providers: [
    sharedTokenProvider,
    
    oauthProviders.google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),

    createCredentialsProvider({
      authorize: async (credentials) => {
        const { email, password } = credentials
        // 验证用户凭据...
        return { id: '1', email, name: 'User' }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },

  debug: process.env.NODE_ENV === 'development'
}

module.exports = authConfig
`
}

/**
 * JSON 配置模板
 */
function generateJsonConfigTemplate(): string {
  return JSON.stringify({
    providers: [],
    session: {
      strategy: 'jwt',
      maxAge: 2592000
    },
    debug: false
  }, null, 2)
}

/**
 * ES Module 配置模板
 */
function generateMjsConfigTemplate(): string {
  return `import { 
  sharedTokenProvider,
  oauthProviders,
  BasicUserTemplate 
} from '@linch-kit/auth-core'

const authConfig = {
  userEntity: BasicUserTemplate,
  
  providers: [
    sharedTokenProvider,
    
    oauthProviders.google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },

  debug: process.env.NODE_ENV === 'development'
}

export default authConfig
`
}
