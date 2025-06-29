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

  // Webpack 配置
  webpack: (config, { dev, isServer }) => {
    // 使用轮询模式解决 EMFILE 问题
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/.git/**',
          '**/dist/**',
          '**/build/**',
          '**/coverage/**',
          '**/.turbo/**'
        ]
      }
    }

    // 客户端构建时排除 Node.js 特定模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        cluster: false,
        child_process: false,
        tty: false,
        net: false,
        tls: false,
        dns: false,
        dgram: false,
        readline: false,
        repl: false,
        vm: false,
        worker_threads: false,
        v8: false,
        perf_hooks: false,
        inspector: false,
      }
      
      // 忽略 fsevents
      config.externals = [...(config.externals || []), 'fsevents']
    }

    // 优化依赖
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': '@prisma/client',
      }
    }

    // 确保 react-hook-form 正确解析
    config.resolve.extensions = [...(config.resolve.extensions || []), '.mjs', '.js', '.jsx', '.ts', '.tsx']
    
    // 处理 ESM 模块
    config.resolve.mainFields = ['browser', 'module', 'main']

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