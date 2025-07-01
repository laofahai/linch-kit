import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  transpilePackages: [
    '@linch-kit/core',
    '@linch-kit/auth', 
    '@linch-kit/schema',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui',
    '@linch-kit/console',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        os: false,
        cluster: false,
        v8: false,
        'node:child_process': false,
        'node:events': false,
        'node:fs': false,
        'node:fs/promises': false,
        'child_process': false,
        events: false,
        'stream/promises': false,
      }
    }
    
    // 对于包含 Node.js 专用功能的包，仅在服务端构建
    config.externals = config.externals || []
    if (!isServer) {
      config.externals.push({
        'prom-client': 'commonjs prom-client',
        'commander': 'commonjs commander',
        'chokidar': 'commonjs chokidar',
      })
    }
    
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default withNextIntl(nextConfig)