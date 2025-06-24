import type { ConfigFileType } from './loader'

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
  return `import type { LinchConfig } from '@linch-kit/config'

const config: LinchConfig = {
  // 数据库配置
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    // 或者使用连接字符串
    // url: process.env.DATABASE_URL
  },

  // Schema 配置
  schema: {
    outputDir: './src/generated',
    generatePrisma: true,
    generateMock: false,
    generateOpenAPI: true
  },

  // Auth 配置
  auth: {
    userEntity: 'enterprise', // minimal | basic | enterprise | multi-tenant | custom
    providers: [
      {
        type: 'shared-token',
        id: 'shared-token',
        config: {
          token: process.env.SHARED_TOKEN,
          apiUrl: process.env.SHARED_TOKEN_API_URL
        }
      },
      {
        type: 'oauth',
        id: 'google',
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
      }
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: true,  // 支持部门层级权限
      multiTenant: false
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60     // 24 hours
    }
  },

  // 应用配置（可选，也可以从数据库加载）
  app: {
    name: process.env.APP_NAME || 'My Application',
    description: process.env.APP_DESCRIPTION || 'A Linch Kit application',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    url: process.env.APP_URL || \`http://localhost:\${process.env.PORT || 3000}\`,

    // 功能开关
    features: {
      userRegistration: process.env.FEATURE_USER_REGISTRATION !== 'false',
      emailVerification: process.env.FEATURE_EMAIL_VERIFICATION !== 'false',
      twoFactorAuth: process.env.FEATURE_TWO_FACTOR_AUTH === 'true',
      socialLogin: process.env.FEATURE_SOCIAL_LOGIN !== 'false'
    },

    // 主题配置
    theme: {
      primaryColor: process.env.THEME_PRIMARY_COLOR || '#3b82f6',
      secondaryColor: process.env.THEME_SECONDARY_COLOR || '#64748b',
      logo: process.env.THEME_LOGO || '/logo.png',
      favicon: process.env.THEME_FAVICON || '/favicon.ico'
    },

    // 邮件配置
    email: {
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@myapp.com',
      config: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    },

    // 存储配置
    storage: {
      provider: process.env.STORAGE_PROVIDER || 'local',
      config: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
      }
    }
  },

  // 插件配置
  plugins: [
    {
      name: '@linch-kit/plugin-analytics',
      enabled: true,
      config: {
        provider: 'google-analytics',
        trackingId: process.env.GA_TRACKING_ID
      }
    }
  ],

  // 自定义配置
  custom: {
    // 你的自定义配置
  }
}

export default config
`
}

/**
 * JavaScript 配置模板
 */
function generateJsConfigTemplate(): string {
  return `/** @type {import('@linch-kit/config').LinchConfig} */
const config = {
  database: {
    type: process.env.DB_TYPE || 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },

  schema: {
    outputDir: process.env.SCHEMA_OUTPUT_DIR || './src/generated',
    generatePrisma: process.env.GENERATE_PRISMA !== 'false',
    generateMock: process.env.GENERATE_MOCK === 'true',
    generateOpenAPI: process.env.GENERATE_OPENAPI !== 'false'
  },

  auth: {
    userEntity: process.env.AUTH_USER_ENTITY || 'basic',
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
      strategy: process.env.AUTH_STRATEGY || 'rbac',
      hierarchical: process.env.AUTH_HIERARCHICAL === 'true',
      multiTenant: process.env.AUTH_MULTI_TENANT === 'true'
    }
  },

  app: {
    name: process.env.APP_NAME || 'My Application',
    environment: process.env.NODE_ENV || 'development',
    features: {
      userRegistration: process.env.FEATURE_USER_REGISTRATION !== 'false',
      emailVerification: process.env.FEATURE_EMAIL_VERIFICATION !== 'false'
    }
  }
}

module.exports = config
`
}

/**
 * JSON 配置模板
 */
function generateJsonConfigTemplate(): string {
  return JSON.stringify({
    database: {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      username: 'postgres',
      password: 'password'
    },
    schema: {
      outputDir: './src/generated',
      generatePrisma: true,
      generateMock: false,
      generateOpenAPI: false
    },
    auth: {
      userEntity: 'basic',
      providers: [],
      permissions: {
        strategy: 'rbac',
        hierarchical: false,
        multiTenant: false
      }
    },
    app: {
      name: 'My Application',
      environment: 'development',
      features: {}
    }
  }, null, 2)
}

/**
 * ES Module 配置模板
 */
function generateMjsConfigTemplate(): string {
  return `/** @type {import('@linch-kit/config').LinchConfig} */
const config = {
  database: {
    type: process.env.DB_TYPE || 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },

  schema: {
    outputDir: process.env.SCHEMA_OUTPUT_DIR || './src/generated',
    generatePrisma: process.env.GENERATE_PRISMA !== 'false'
  },

  auth: {
    userEntity: process.env.AUTH_USER_ENTITY || 'basic',
    providers: [
      {
        type: 'shared-token',
        id: 'shared-token',
        config: {
          token: process.env.SHARED_TOKEN,
          apiUrl: process.env.SHARED_TOKEN_API_URL
        }
      }
    ]
  },

  app: {
    name: process.env.APP_NAME || 'My Application',
    environment: process.env.NODE_ENV || 'development'
  }
}

export default config
`
}

/**
 * 预设配置模板
 */
export const configPresets = {
  /** 简单博客 */
  blog: {
    database: { type: 'sqlite', database: './blog.db' },
    auth: {
      userEntity: 'basic',
      providers: [{ type: 'credentials', id: 'email-password', config: {} }],
      permissions: { strategy: 'rbac', hierarchical: false }
    },
    app: {
      name: 'My Blog',
      features: { userRegistration: true, comments: true }
    }
  },

  /** 企业应用 */
  enterprise: {
    database: { type: 'postgresql' },
    auth: {
      userEntity: 'enterprise',
      providers: [
        { type: 'shared-token', id: 'sso', config: {} },
        { type: 'oauth', id: 'google', config: {} }
      ],
      permissions: { strategy: 'rbac', hierarchical: true }
    },
    app: {
      name: 'Enterprise App',
      features: { 
        userRegistration: false, 
        ssoLogin: true,
        departmentHierarchy: true 
      }
    }
  },

  /** SaaS 平台 */
  saas: {
    database: { type: 'postgresql' },
    auth: {
      userEntity: 'multi-tenant',
      providers: [
        { type: 'oauth', id: 'google', config: {} },
        { type: 'credentials', id: 'email-password', config: {} }
      ],
      permissions: { strategy: 'rbac', hierarchical: true, multiTenant: true }
    },
    app: {
      name: 'SaaS Platform',
      features: {
        userRegistration: true,
        multiTenant: true,
        billing: true,
        analytics: true
      }
    }
  }
} as const
