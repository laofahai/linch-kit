import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack 配置 (稳定版)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // 类型安全
  typescript: {
    // 在构建时启用类型检查
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    // 在构建时启用 ESLint 检查
    ignoreDuringBuilds: false,
  },
  
  // 实验性功能配置
  experimental: {
    // 实验性配置
  },
  
  // 输出配置 - 禁用静态生成
  output: 'standalone',

  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 客户端构建时排除 Node.js 模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        async_hooks: false,
        'coffee-script': false,
        path: false,
        stream: false,
        crypto: false,
        os: false,
        util: false,
        'node:fs': false,
        'node:path': false,
        'node:stream': false,
        'node:crypto': false,
        'node:os': false,
        'node:util': false,
        'node:fs/promises': false,
      }
      
      // 排除 bun:test 和服务器端模块
      config.externals = config.externals ?? []
      config.externals.push('bun:test')
      config.externals.push('chokidar')
      
      // 忽略测试文件和服务器端文件
      config.module.rules.push({
        test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
        loader: 'ignore-loader',
      })
    }
    return config
  },

  // 优化配置
  compress: true,
  poweredByHeader: false,

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env['CUSTOM_KEY'],
  },
}

export default nextConfig