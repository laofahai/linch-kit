import { z } from 'zod'

/**
 * 数据库配置
 */
export const DatabaseConfigSchema = z.object({
  type: z.enum(['mysql', 'postgresql', 'sqlite', 'mongodb']),
  host: z.string().optional(),
  port: z.number().optional(),
  database: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
  ssl: z.boolean().optional(),
  pool: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional()
})

/**
 * Schema 配置
 */
export const SchemaConfigSchema = z.object({
  /** 输出目录 */
  outputDir: z.string().default('./src/generated'),
  /** 是否生成 Prisma schema */
  generatePrisma: z.boolean().default(true),
  /** 是否生成 Mock 数据 */
  generateMock: z.boolean().default(false),
  /** 是否生成 OpenAPI */
  generateOpenAPI: z.boolean().default(false),
  /** 自定义生成器 */
  generators: z.array(z.string()).optional()
})

/**
 * Auth 配置
 */
export const AuthConfigSchema = z.object({
  /** 用户实体类型 */
  userEntity: z.enum(['minimal', 'basic', 'enterprise', 'multi-tenant', 'custom']).default('basic'),
  /** 认证提供者 */
  providers: z.array(z.object({
    type: z.enum(['oauth', 'credentials', 'shared-token', 'custom']),
    id: z.string(),
    config: z.record(z.string(), z.unknown())
  })).default([]),
  /** 权限策略 */
  permissions: z.object({
    strategy: z.enum(['rbac', 'abac', 'custom']).default('rbac'),
    hierarchical: z.boolean().default(false),
    multiTenant: z.boolean().default(false)
  }).optional(),
  /** 会话配置 */
  session: z.object({
    strategy: z.enum(['jwt', 'database']).default('jwt'),
    maxAge: z.number().default(2592000), // 30 days
    updateAge: z.number().default(86400)  // 24 hours
  }).optional()
})

/**
 * 应用配置（可存储在数据库）
 */
export const AppConfigSchema = z.object({
  /** 应用名称 */
  name: z.string(),
  /** 应用描述 */
  description: z.string().optional(),
  /** 应用版本 */
  version: z.string().optional(),
  /** 应用环境 */
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  /** 应用 URL */
  url: z.string().url().optional(),
  /** 应用设置 */
  settings: z.record(z.string(), z.unknown()).optional(),
  /** 功能开关 */
  features: z.record(z.boolean()).optional(),
  /** 主题配置 */
  theme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logo: z.string().url().optional(),
    favicon: z.string().url().optional()
  }).optional(),
  /** 邮件配置 */
  email: z.object({
    provider: z.enum(['smtp', 'sendgrid', 'mailgun', 'ses']).optional(),
    from: z.string().email().optional(),
    config: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  /** 存储配置 */
  storage: z.object({
    provider: z.enum(['local', 's3', 'oss', 'cos']).optional(),
    config: z.record(z.string(), z.unknown()).optional()
  }).optional()
})

/**
 * 主配置文件
 */
export const LinchConfigSchema = z.object({
  /** 数据库配置 */
  database: DatabaseConfigSchema,
  /** Schema 配置 */
  schema: SchemaConfigSchema.optional(),
  /** Auth 配置 */
  auth: AuthConfigSchema.optional(),
  /** 应用配置（可选，可从数据库加载） */
  app: AppConfigSchema.optional(),
  /** 插件配置 */
  plugins: z.array(z.object({
    name: z.string(),
    enabled: z.boolean().default(true),
    config: z.record(z.string(), z.unknown()).optional()
  })).optional(),
  /** 自定义配置 */
  custom: z.record(z.string(), z.unknown()).optional()
})

// 导出类型
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>
export type SchemaConfig = z.infer<typeof SchemaConfigSchema>
export type AuthConfig = z.infer<typeof AuthConfigSchema>
export type AppConfig = z.infer<typeof AppConfigSchema>
export type LinchConfig = z.infer<typeof LinchConfigSchema>

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
  /** 是否从数据库加载应用配置 */
  loadAppFromDatabase?: boolean
  /** 数据库连接（用于加载应用配置） */
  databaseUrl?: string
}

/**
 * 配置提供者接口
 */
export interface ConfigProvider {
  /** 加载配置 */
  load(): Promise<Partial<LinchConfig>>
  /** 保存配置 */
  save(config: Partial<LinchConfig>): Promise<void>
  /** 监听配置变化 */
  watch?(callback: (config: Partial<LinchConfig>) => void): void
}

/**
 * 数据库配置提供者接口
 */
export interface DatabaseConfigProvider extends ConfigProvider {
  /** 获取应用配置 */
  getAppConfig(): Promise<AppConfig | null>
  /** 更新应用配置 */
  updateAppConfig(config: Partial<AppConfig>): Promise<void>
  /** 获取功能开关 */
  getFeatureFlags(): Promise<Record<string, boolean>>
  /** 更新功能开关 */
  updateFeatureFlag(key: string, enabled: boolean): Promise<void>
}
