/**
 * Linch Kit Schema Configuration
 * 
 * 配置 Schema 生成器的行为
 */

export default {
  // 实体文件匹配模式
  entities: [
    'src/entities/**/*.ts',
    'src/entities/**/*.js',
    'app/_lib/schemas/**/*.ts'
  ],

  // 数据库配置
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/linch_kit_dev'
  },

  // 输出配置
  output: {
    prisma: './prisma/schema.prisma',
    validators: './src/validators/generated.ts',
    mocks: './src/mocks/factories.ts',
    openapi: './docs/api.json',
    testData: './test-data'
  },

  // 生成选项
  generation: {
    // Prisma 生成选项
    prisma: {
      clientOutput: './node_modules/.prisma/client',
      binaryTargets: ['native'],
      previewFeatures: ['jsonProtocol']
    },

    // 验证器生成选项
    validators: {
      includeCreateSchemas: true,
      includeUpdateSchemas: true,
      includePartialSchemas: true
    },

    // Mock 生成选项
    mocks: {
      includeFactories: true,
      includeSeeds: true,
      defaultCount: 10
    },

    // OpenAPI 生成选项
    openapi: {
      title: 'Linch Kit API',
      version: '1.0.0',
      description: 'AI-First Enterprise Development Framework API',
      includeSchemas: true,
      includePaths: true
    }
  },

  // 插件配置
  plugins: [
    // 可以在这里添加自定义插件
  ]
}
