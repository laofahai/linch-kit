import type { LinchConfig } from '@linch-kit/core'

const config: LinchConfig = {
  // 数据库配置
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'linch_kit_dev',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    // 或者使用连接字符串
    // url: process.env.DATABASE_URL
  },

  // Schema 配置
  schema: {
    entities: ['src/entities/**/*.{ts,tsx,js}'],
    output: {
      prisma: './prisma/schema.prisma',
      validators: './src/validators/generated.ts',
      mocks: './src/mocks/factories.ts',
      openapi: './docs/api.json'
    },
    database: {
      provider: 'postgresql'
    }
  },

  // Auth 配置
  auth: {
    userEntity: 'multi-tenant',
    providers: [
      {
        type: 'shared-token',
        id: 'shared-token',
        config: {
          token: process.env.SHARED_TOKEN,
          apiUrl: process.env.SHARED_TOKEN_API_URL
        }
      }
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: true,
      multiTenant: true
    }
  },

  // 插件配置
  plugins: [
    '@linch-kit/schema',
    '@linch-kit/auth-core',
    '@linch-kit/trpc'
  ],

  // 应用配置
  app: {
    name: 'LinchKit Development',
    description: 'LinchKit monorepo development environment',
    version: '0.1.0',
    environment: 'development',
    url: process.env.APP_URL || 'http://localhost:3000'
  }
}

export default config
