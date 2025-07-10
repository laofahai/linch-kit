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
    // 优化 bundle 大小 - 合并两个版本的配置
    config.resolve.fallback = {
      fs: false,
      path: false,
      // 禁用 Node.js 特定模块以避免在客户端环境中出现错误
      cluster: false,
      perf_hooks: false,
      worker_threads: false,
      child_process: false,
      os: false,
      crypto: false,
      stream: false,
      url: false,
      util: false,
      querystring: false,
      zlib: false,
      http: false,
      https: false,
      buffer: false,
      dns: false,
      net: false,
      tls: false,
      vm: false,
      process: false,
      v8: false,
      assert: false,
      constants: false,
      events: false,
      async_hooks: false,
      'stream/promises': false,
      // 排除所有 node: 协议的内置模块
      'node:child_process': false,
      'node:events': false,
      'node:fs': false,
      'node:path': false,
      'node:stream': false,
      'node:util': false,
      'node:crypto': false,
      'node:os': false,
      'node:url': false,
      'node:buffer': false,
      'node:process': false,
    }

    // 排除所有 TypeScript 声明文件和 source maps 被客户端 loader 处理
    config.module.rules.push({
      test: /\.(d\.ts|d\.mts|js\.map|mjs\.map)$/,
      type: 'asset/resource',
      generator: {
        emit: false,
      },
    })

    // 添加externals配置以排除Node.js专有模块
    config.externals = config.externals || []
    config.externals.push({
      'stream/promises': 'commonjs stream/promises',
    })

    // 确保 @linch-kit/core 只加载客户端文件
    config.resolve.alias = {
      ...config.resolve.alias,
      '@linch-kit/core$': '@linch-kit/core/client',
    }

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
