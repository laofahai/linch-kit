import type { StarterConfig, ExtensionIntegration, TemplateGenerator as ITemplateGenerator } from '../types'

/**
 * LinchKit Starter Template Generator
 * 生成Starter应用的配置文件和代码模板
 */
export class TemplateGenerator implements ITemplateGenerator {
  /**
   * 生成Next.js配置
   */
  generateNextConfig(config: StarterConfig): string {
    return `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 基本配置
  reactStrictMode: true,
  experimental: {
    // TypeScript严格模式
    typedRoutes: true,
    // 服务端组件优化
    serverComponentsExternalPackages: ['@linch-kit/core'],
  },
  
  // 扩展配置
  ${config.extensions.length > 0 ? `
  // 启用的扩展: ${config.extensions.join(', ')}
  transpilePackages: [
    '@linch-kit/core',
    '@linch-kit/ui',
    '@linch-kit/console',
    ${config.extensions.map(ext => `'@linch-kit/${ext}'`).join(',\n    ')}
  ],` : `
  transpilePackages: [
    '@linch-kit/core',
    '@linch-kit/ui',
    '@linch-kit/console',
  ],`}
  
  // 环境变量配置
  env: {
    LINCHKIT_APP_NAME: '${config.appName}',
    LINCHKIT_VERSION: '${config.version}',
    LINCHKIT_AUTH_ENABLED: '${config.auth.enabled}',
    LINCHKIT_AUTH_PROVIDER: '${config.auth.provider}',
    LINCHKIT_DATABASE_ENABLED: '${config.database.enabled}',
    LINCHKIT_DATABASE_PROVIDER: '${config.database.provider}',
    LINCHKIT_TRPC_ENABLED: '${config.trpc.enabled}',
  },
}

export default nextConfig`
  }

  /**
   * 生成tRPC路由
   */
  generateTrpcRouter(config: StarterConfig): string {
    if (!config.trpc.enabled) {
      return '// tRPC is disabled in configuration'
    }

    return `import { createTRPCRouter } from '@linch-kit/core/server'
import { authRouter } from '@linch-kit/auth/server'
import { platformRouter } from '@linch-kit/platform'
${config.extensions.map(ext => `import { ${ext}Router } from '@linch-kit/${ext}'`).join('\n')}

/**
 * LinchKit Starter tRPC Router
 * 自动生成的路由配置 - 基于 ${config.appName} v${config.version}
 */
export const appRouter = createTRPCRouter({
  // 认证路由
  ${config.auth.enabled ? `auth: authRouter,` : `// auth: authRouter, // 已禁用`}
  
  // 平台路由
  platform: platformRouter,
  
  // 扩展路由
${config.extensions.map(ext => `  ${ext}: ${ext}Router,`).join('\n')}
})

export type AppRouter = typeof appRouter`
  }

  /**
   * 生成认证中间件
   */
  generateAuthMiddleware(config: StarterConfig): string {
    if (!config.auth.enabled) {
      return `// 认证已禁用
export { middleware } from '@linch-kit/core/server'`
    }

    return `import { createMiddleware } from '@linch-kit/auth/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * LinchKit Starter 认证中间件
 * 提供商: ${config.auth.provider}
 * 应用: ${config.appName}
 */
export const middleware = createMiddleware({
  provider: '${config.auth.provider}',
  
  // 受保护的路由
  protectedPaths: [
    '/dashboard',
    '/admin',
    '/api/protected',
  ],
  
  // 公开路由
  publicPaths: [
    '/',
    '/auth',
    '/api/auth',
  ],
  
  // 登录重定向
  signInUrl: '/auth/login',
  
  // 扩展集成
  extensions: ${JSON.stringify(config.extensions, null, 2)},
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}`
  }

  /**
   * 生成扩展配置
   */
  generateExtensionConfig(extensions: ExtensionIntegration[]): string {
    if (extensions.length === 0) {
      return `/**
 * LinchKit Starter 扩展配置
 * 当前无扩展启用
 */
export const extensionConfig = {
  extensions: [],
  registry: {},
}

export default extensionConfig`
    }

    return `/**
 * LinchKit Starter 扩展配置
 * 自动生成的扩展集成配置
 */

export const extensionConfig = {
  // 已启用的扩展
  extensions: [
${extensions.map(ext => `    {
      name: '${ext.name}',
      version: '${ext.version}',
      enabled: ${ext.enabled},
      config: ${JSON.stringify(ext.config, null, 6)},
    },`).join('\n')}
  ],
  
  // 扩展注册表
  registry: {
${extensions.map(ext => `    '${ext.name}': () => import('@linch-kit/${ext.name}'),`).join('\n')}
  },
  
  // 扩展加载配置
  loading: {
    eager: ['console', 'auth'], // 预加载的扩展
    lazy: [${extensions.filter(ext => !['console', 'auth'].includes(ext.name)).map(ext => `'${ext.name}'`).join(', ')}], // 按需加载的扩展
  },
}

export default extensionConfig`
  }

  /**
   * 生成完整的Starter应用配置
   */
  generateCompleteConfig(config: StarterConfig, extensions: ExtensionIntegration[]): {
    nextConfig: string
    trpcRouter: string
    authMiddleware: string
    extensionConfig: string
  } {
    return {
      nextConfig: this.generateNextConfig(config),
      trpcRouter: this.generateTrpcRouter(config),
      authMiddleware: this.generateAuthMiddleware(config),
      extensionConfig: this.generateExtensionConfig(extensions),
    }
  }
}

/**
 * 创建Template Generator实例
 */
export function createTemplateGenerator(): TemplateGenerator {
  return new TemplateGenerator()
}