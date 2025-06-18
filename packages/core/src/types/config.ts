/**
 * @ai-context 配置系统类型定义
 * @ai-purpose 定义配置管理相关的所有类型
 * @ai-extensible 支持插件扩展配置类型
 */

import { z } from 'zod'
import type { Named, Versioned, OptionalConfig, DatabaseProvider, Environment } from './common'

/**
 * @ai-interface 配置提供者接口
 * @ai-purpose 定义配置源的标准接口，支持多种配置来源
 * @ai-extensible 插件可以实现此接口提供自定义配置源
 */
export interface ConfigProvider extends Named {
  /** @ai-field 提供者优先级，数字越大优先级越高 */
  priority: number
  
  /**
   * @ai-method 加载配置
   * @ai-purpose 从特定源加载配置数据
   * @ai-return Promise<any> - 配置对象
   */
  load(): Promise<any>
  
  /**
   * @ai-method 监听配置变更
   * @ai-purpose 监听配置源的变更，支持热重载
   * @ai-parameter callback: (config: any) => void - 变更回调
   * @ai-optional 可选实现
   */
  watch?(callback: (config: any) => void): void
}

/**
 * @ai-interface 配置 Schema 注册项
 * @ai-purpose 描述动态注册的配置 Schema
 */
export interface ConfigSchema extends Named, Versioned {
  /** @ai-field Zod Schema 定义 */
  schema: z.ZodSchema
  
  /** @ai-field 默认配置值 */
  defaults?: any
  
  /** @ai-field 注册来源（包名） */
  source?: string
  
  /** @ai-field 配置分类 */
  category?: string
}

/**
 * @ai-interface 项目配置
 * @ai-purpose 定义项目基本信息配置
 */
export interface ProjectConfig {
  /** @ai-field 项目名称 */
  name: string
  
  /** @ai-field 项目版本 */
  version: string
  
  /** @ai-field 项目描述 */
  description?: string
  
  /** @ai-field 项目作者 */
  author?: string
  
  /** @ai-field 项目许可证 */
  license?: string
  
  /** @ai-field 项目主页 */
  homepage?: string
  
  /** @ai-field 项目仓库 */
  repository?: string
}

/**
 * @ai-interface 数据库配置
 * @ai-purpose 定义数据库连接和设置
 */
export interface DatabaseConfig {
  /** @ai-field 数据库提供商 */
  provider: DatabaseProvider
  
  /** @ai-field 数据库连接 URL */
  url?: string
  
  /** @ai-field 数据库主机 */
  host?: string
  
  /** @ai-field 数据库端口 */
  port?: number
  
  /** @ai-field 数据库名称 */
  database?: string
  
  /** @ai-field 用户名 */
  username?: string
  
  /** @ai-field 密码 */
  password?: string
  
  /** @ai-field 是否启用 SSL */
  ssl?: boolean
  
  /** @ai-field 连接池配置 */
  pool?: {
    /** @ai-field 最小连接数 */
    min?: number
    /** @ai-field 最大连接数 */
    max?: number
    /** @ai-field 连接超时时间 */
    timeout?: number
  }
  
  /** @ai-field 是否启用日志 */
  logging?: boolean
  
  /** @ai-field 迁移配置 */
  migrations?: {
    /** @ai-field 迁移文件目录 */
    directory?: string
    /** @ai-field 迁移表名 */
    tableName?: string
  }
}

/**
 * @ai-interface Schema 配置
 * @ai-purpose 定义 Schema 系统配置
 */
export interface SchemaConfig {
  /** @ai-field 实体文件模式 */
  entities?: string[]
  
  /** @ai-field 输出配置 */
  output?: {
    /** @ai-field Prisma schema 输出路径 */
    prisma?: string
    /** @ai-field 验证器输出路径 */
    validators?: string
    /** @ai-field Mock 数据输出路径 */
    mocks?: string
    /** @ai-field OpenAPI 文档输出路径 */
    openapi?: string
  }
  
  /** @ai-field 生成选项 */
  generate?: {
    /** @ai-field 是否生成 Prisma client */
    prismaClient?: boolean
    /** @ai-field 是否生成验证器 */
    validators?: boolean
    /** @ai-field 是否生成 Mock 数据 */
    mocks?: boolean
    /** @ai-field 是否生成 OpenAPI 文档 */
    openapi?: boolean
  }
}

/**
 * @ai-interface 认证配置
 * @ai-purpose 定义认证系统配置
 */
export interface AuthConfig extends OptionalConfig {
  /** @ai-field 认证提供商 */
  providers?: string[]
  
  /** @ai-field 会话配置 */
  session?: {
    /** @ai-field 会话策略 */
    strategy?: 'jwt' | 'database'
    /** @ai-field 会话过期时间 */
    maxAge?: number
    /** @ai-field 会话密钥 */
    secret?: string
  }
  
  /** @ai-field JWT 配置 */
  jwt?: {
    /** @ai-field JWT 密钥 */
    secret?: string
    /** @ai-field JWT 过期时间 */
    expiresIn?: string
    /** @ai-field JWT 算法 */
    algorithm?: string
  }
  
  /** @ai-field 回调 URL */
  callbacks?: {
    /** @ai-field 登录成功回调 */
    signIn?: string
    /** @ai-field 登出回调 */
    signOut?: string
    /** @ai-field 错误回调 */
    error?: string
  }
}

/**
 * @ai-interface 插件配置
 * @ai-purpose 定义插件系统配置
 */
export interface PluginConfig {
  /** @ai-field 是否启用插件系统 */
  enabled?: boolean

  /** @ai-field 插件目录 */
  directories?: string[]

  /** @ai-field 启用的插件列表 */
  enabledPlugins?: string[]

  /** @ai-field 禁用的插件列表 */
  disabled?: string[]

  /** @ai-field 插件配置映射 */
  configs?: Record<string, any>

  /** @ai-field 自动发现插件 */
  autoDiscovery?: boolean

  /** @ai-field 插件加载超时时间 */
  loadTimeout?: number

  /** @ai-field 配置选项 */
  options?: Record<string, any>
}

/**
 * @ai-interface 开发配置
 * @ai-purpose 定义开发环境配置
 */
export interface DevConfig extends OptionalConfig {
  /** @ai-field 开发服务器端口 */
  port?: number
  
  /** @ai-field 开发服务器主机 */
  host?: string
  
  /** @ai-field 是否自动打开浏览器 */
  open?: boolean
  
  /** @ai-field 是否启用热重载 */
  hotReload?: boolean
  
  /** @ai-field 是否启用 HTTPS */
  https?: boolean
  
  /** @ai-field 代理配置 */
  proxy?: Record<string, string>
  
  /** @ai-field 监听文件模式 */
  watchFiles?: string[]
  
  /** @ai-field 忽略文件模式 */
  ignoreFiles?: string[]
}

/**
 * @ai-interface 构建配置
 * @ai-purpose 定义构建相关配置
 */
export interface BuildConfig extends OptionalConfig {
  /** @ai-field 输出目录 */
  outDir?: string
  
  /** @ai-field 是否生成 source map */
  sourcemap?: boolean
  
  /** @ai-field 是否压缩代码 */
  minify?: boolean
  
  /** @ai-field 目标环境 */
  target?: string
  
  /** @ai-field 外部依赖 */
  external?: string[]
  
  /** @ai-field 是否分析包大小 */
  analyze?: boolean
  
  /** @ai-field 环境变量 */
  env?: Record<string, string>
}

/**
 * @ai-interface 主配置接口
 * @ai-purpose 定义 Linch Kit 的完整配置结构
 * @ai-extensible 支持插件扩展配置字段
 */
export interface LinchConfig {
  /** @ai-field 项目配置 */
  project?: ProjectConfig
  
  /** @ai-field 数据库配置 */
  database?: DatabaseConfig
  
  /** @ai-field Schema 配置 */
  schema?: SchemaConfig
  
  /** @ai-field 认证配置 */
  auth?: AuthConfig
  
  /** @ai-field 插件配置 */
  plugins?: PluginConfig
  
  /** @ai-field 开发配置 */
  dev?: DevConfig
  
  /** @ai-field 构建配置 */
  build?: BuildConfig
  
  /** @ai-field 环境类型 */
  environment?: Environment
  
  /** @ai-field 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  
  /** @ai-field 自定义配置 */
  [key: string]: any
}

/**
 * @ai-interface 配置文件元数据
 * @ai-purpose 描述配置文件的元信息
 */
export interface ConfigFileMetadata {
  /** @ai-field 配置文件路径 */
  path: string
  
  /** @ai-field 配置文件格式 */
  format: 'js' | 'ts' | 'json' | 'yaml'
  
  /** @ai-field 是否存在 */
  exists: boolean
  
  /** @ai-field 最后修改时间 */
  lastModified?: Date
  
  /** @ai-field 文件大小 */
  size?: number
}

/**
 * @ai-interface 配置加载结果
 * @ai-purpose 描述配置加载的结果
 */
export interface ConfigLoadResult {
  /** @ai-field 是否加载成功 */
  success: boolean
  
  /** @ai-field 加载的配置 */
  config?: LinchConfig
  
  /** @ai-field 配置文件元数据 */
  metadata?: ConfigFileMetadata
  
  /** @ai-field 加载错误 */
  errors?: string[]
  
  /** @ai-field 加载耗时 */
  duration?: number
  
  /** @ai-field 使用的提供者 */
  providers?: string[]
}
