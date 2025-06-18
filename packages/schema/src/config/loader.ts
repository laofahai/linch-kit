import { existsSync } from 'fs'
import { resolve } from 'path'

/**
 * Schema 配置接口
 */
export interface SchemaConfig {
  /** 实体文件路径模式 */
  entities?: string[]
  /** 输出配置 */
  output?: {
    prisma?: string
    validators?: string
    mocks?: string
    openapi?: string
    testData?: string
    i18n?: string
  }
  /** 数据库配置 */
  database?: {
    provider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver'
    url?: string
  }
  /** API 文档配置 */
  api?: {
    title?: string
    version?: string
    description?: string
  }
  /** 国际化配置 */
  i18n?: {
    /** 默认语言 */
    defaultLocale?: string
    /** 支持的语言列表 */
    locales?: string[]
    /** 翻译文件路径模式 */
    translationFiles?: string[]
    /** 是否生成翻译文件模板 */
    generateTemplates?: boolean
  }
}

/**
 * 默认配置
 */
const defaultConfig: SchemaConfig = {
  entities: [
    'src/entities/**/*.{ts,js}',
    'entities/**/*.{ts,js}',
    'src/schema/**/*.{ts,js}',
    'schema/**/*.{ts,js}',
  ],
  output: {
    prisma: './prisma/schema.prisma',
    validators: './src/validators/generated.ts',
    mocks: './src/mocks/factories.ts',
    openapi: './docs/api.json',
    testData: './test-data',
  },
  database: {
    provider: 'postgresql',
  },
  api: {
    title: 'API',
    version: '1.0.0',
    description: 'Auto-generated API documentation',
  },
}

/**
 * 加载配置文件
 */
export async function loadConfig(configPath?: string): Promise<SchemaConfig> {
  const possiblePaths = [
    configPath,
    'linch-schema.config.js',
    'linch-schema.config.ts',
    'schema.config.js',
    'schema.config.ts',
  ].filter(Boolean) as string[]

  for (const path of possiblePaths) {
    const fullPath = resolve(process.cwd(), path)
    if (existsSync(fullPath)) {
      try {
        const { pathToFileURL } = await import('url')
        const configModule = await import(pathToFileURL(fullPath).href)
        const userConfig = configModule.default || configModule
        
        return mergeConfig(defaultConfig, userConfig)
      } catch (error) {
        console.warn(`⚠️  Failed to load config from ${path}:`, error)
      }
    }
  }

  return defaultConfig
}

/**
 * 合并配置
 */
function mergeConfig(defaultConfig: SchemaConfig, userConfig: Partial<SchemaConfig>): SchemaConfig {
  return {
    entities: userConfig.entities || defaultConfig.entities,
    output: {
      ...defaultConfig.output,
      ...userConfig.output,
    },
    database: {
      ...defaultConfig.database,
      ...userConfig.database,
    },
    api: {
      ...defaultConfig.api,
      ...userConfig.api,
    },
  }
}

/**
 * 生成示例配置文件
 */
export function generateConfigTemplate(): string {
  return `// linch-schema.config.js
export default {
  // 实体文件路径模式
  entities: [
    'src/entities/**/*.{ts,js}',
    'src/models/**/*.{ts,js}',
  ],
  
  // 输出配置
  output: {
    prisma: './prisma/schema.prisma',
    validators: './src/validators/generated.ts',
    mocks: './src/mocks/factories.ts',
    openapi: './docs/api.json',
    testData: './test-data',
  },
  
  // 数据库配置
  database: {
    provider: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver'
    url: process.env.DATABASE_URL,
  },
  
  // API 文档配置
  api: {
    title: 'My API',
    version: '1.0.0',
    description: 'My awesome API',
  },
}
`
}
