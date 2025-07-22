import { z } from 'zod'

/**
 * LinchKit Starter Configuration Schema
 */
export const StarterConfigSchema = z.object({
  /** 应用名称 */
  appName: z.string(),
  /** 应用版本 */
  version: z.string().default('1.0.0'),
  /** 扩展配置 */
  extensions: z.array(z.string()).default([]),
  /** 认证配置 */
  auth: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['supabase', 'nextauth', 'custom']).default('supabase'),
  }).default({}),
  /** 数据库配置 */
  database: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['prisma', 'drizzle']).default('prisma'),
  }).default({}),
  /** tRPC配置 */
  trpc: z.object({
    enabled: z.boolean().default(true),
  }).default({}),
  /** UI配置 */
  ui: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    components: z.array(z.string()).default([]),
  }).default({}),
})

export type StarterConfig = z.infer<typeof StarterConfigSchema>

/**
 * Extension Integration Configuration
 */
export const ExtensionIntegrationSchema = z.object({
  /** 扩展名称 */
  name: z.string(),
  /** 扩展版本 */
  version: z.string(),
  /** 是否启用 */
  enabled: z.boolean().default(true),
  /** 扩展配置 */
  config: z.record(z.unknown()).default({}),
})

export type ExtensionIntegration = z.infer<typeof ExtensionIntegrationSchema>

/**
 * Starter Integration Manager Interface
 */
export interface StarterIntegrationManager {
  /** 初始化Starter应用 */
  initialize(config: StarterConfig): Promise<void>
  
  /** 添加扩展 */
  addExtension(extension: ExtensionIntegration): Promise<void>
  
  /** 移除扩展 */
  removeExtension(name: string): Promise<void>
  
  /** 获取已安装的扩展 */
  getInstalledExtensions(): ExtensionIntegration[]
  
  /** 更新配置 */
  updateConfig(config: Partial<StarterConfig>): Promise<void>
}

/**
 * Template Generator Interface
 */
export interface TemplateGenerator {
  /** 生成Next.js配置 */
  generateNextConfig(config: StarterConfig): string
  
  /** 生成tRPC路由 */
  generateTrpcRouter(config: StarterConfig): string
  
  /** 生成认证中间件 */
  generateAuthMiddleware(config: StarterConfig): string
  
  /** 生成扩展配置 */
  generateExtensionConfig(extensions: ExtensionIntegration[]): string
}