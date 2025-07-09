import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack 配置（稳定版本）
  turbopack: {
    rules: {
      // 自定义 Turbopack 规则
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // 服务器外部包配置
  serverExternalPackages: ['@prisma/client'],

  // 性能优化
  compress: true,
  poweredByHeader: false,

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向规则
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Webpack 配置
  webpack: (config: any) => {
    // 优化 bundle 大小
    config.resolve.fallback = { fs: false, path: false }

    return config
  },

  // 类型检查
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 配置
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 输出配置
  output: 'standalone',

  // 静态导出优化
  trailingSlash: false,
}

export default nextConfig
