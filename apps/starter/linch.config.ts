import type { LinchConfig } from '@linch-kit/core'

const config: LinchConfig = {
  // 项目基本信息
  project: {
    name: 'Linch Kit Starter',
    version: '0.1.0',
    description: 'AI-First 企业级开发框架的起始模板',
    author: 'Linch Tech',
  },

  // 数据库配置
  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://postgres:tech.linch.flexreport@db.evfjsbldujohgeshcixt.supabase.co:5432/postgres',
  },

  // Schema 配置
  schema: {
    entities: ['src/entities/**/*.{ts,tsx,js}'],
    output: {
      prisma: './prisma/schema.prisma',
      validators: './src/validators/generated.ts',
      mocks: './src/mocks/factories.ts',
      openapi: './docs/api.json',
    },
    database: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://postgres:tech.linch.flexreport@db.evfjsbldujohgeshcixt.supabase.co:5432/postgres',
    },
    // 启用软删除
    softDelete: true,
  },

  // Auth 配置
  auth: {
    userEntity: 'basic',
    providers: [
      {
        type: 'credentials',
        id: 'credentials',
        config: {
          name: 'credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
        },
      },
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: false,
      multiTenant: false,
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
  },

  // tRPC 配置
  trpc: {
    endpoint: '/api/trpc',
    enableSubscriptions: false,
    enableBatching: true,
    maxBatchSize: 10,
  },

  // 插件配置
  plugins: ['@linch-kit/auth-core', '@linch-kit/schema', '@linch-kit/trpc'],
}

export default config
