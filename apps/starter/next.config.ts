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

  // 优化配置
  compress: true,
  poweredByHeader: false,

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig