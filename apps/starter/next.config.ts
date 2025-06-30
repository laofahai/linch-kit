import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 实验性功能
  experimental: {
    // 启用服务端组件
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // 转译包
  transpilePackages: ['@linch-kit/ui', 'react-hook-form'],

  // 服务端外部包
  serverExternalPackages: ['@prisma/client', 'prom-client', '@linch-kit/core', '@linch-kit/console'],

  // TypeScript 配置
  typescript: {
    // 生产构建时忽略类型错误（由 CI 处理）
    ignoreBuildErrors: false,
  },

  // ESLint 配置
  eslint: {
    // 生产构建时忽略 ESLint 错误（由 CI 处理）
    ignoreDuringBuilds: false,
  },

  // 图片优化
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },

  // 环境变量
  env: {
    CONSOLE_BASE_PATH: process.env.CONSOLE_BASE_PATH || '/admin',
    CONSOLE_FEATURES: process.env.CONSOLE_FEATURES || 'dashboard,tenants,users,permissions',
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ]
  },

  // 重写
  async rewrites() {
    return [
      {
        source: '/api/trpc/:path*',
        destination: '/api/trpc/:path*',
      },
    ]
  },

  // 头部设置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Tenant-ID',
          },
        ],
      },
    ]
  },

  // 简化的 Webpack 配置
  webpack: (config, { dev, isServer }) => {
    // 基本的 fallback 配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    return config
  },

  // 输出配置
  output: 'standalone',

  // 压缩
  compress: true,

  // 生成 source map
  productionBrowserSourceMaps: false,

  // 自定义构建ID
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`
  },
}

export default nextConfig