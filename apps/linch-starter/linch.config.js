// @ts-check
/** @type {import('@linch-kit/core').LinchConfig} */
const config = {
  // 项目基本信息
  project: {
    name: 'linch-starter',
    version: '0.1.0',
    description: 'AI-First application built with Linch Kit',
    author: '',
  },

  // 数据库配置
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
    name: 'postgres',
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
    // 移除重复的 database 配置，使用顶级 database 配置
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
  plugins: [
    '@linch-kit/schema',
    {
      name: '@linch-kit/auth',
      config: {
        // 使用多租户认证套件（关联表架构）
        // 决策原因：支持复杂权限系统、数据一致性、查询灵活性
        entityKit: 'multi-tenant',
      },
    },
  ],
}

module.exports = config
