import type { StarterConfig } from '../../types'

/**
 * Generate Next.js configuration based on Starter config
 */
export function generateNextConfig(config: StarterConfig): string {
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