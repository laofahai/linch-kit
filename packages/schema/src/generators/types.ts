/**
 * 生成器类型定义
 * 
 * 这些类型可以安全地在前端环境中使用
 */

/**
 * Prisma 生成器选项
 */
export interface PrismaGeneratorOptions {
  databaseUrl?: string
  provider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver'
}

/**
 * 验证器生成器选项
 */
export interface ValidatorGeneratorOptions {
  outputPath?: string
  includeTypes?: boolean
  includeSchemas?: boolean
}

/**
 * Mock 生成器选项
 */
export interface MockGeneratorOptions {
  outputPath?: string
  includeFactories?: boolean
  includeSeeds?: boolean
  locale?: string
}

/**
 * OpenAPI 生成器选项
 */
export interface OpenAPIGeneratorOptions {
  outputPath?: string
  title?: string
  version?: string
  description?: string
  servers?: Array<{
    url: string
    description?: string
  }>
}
