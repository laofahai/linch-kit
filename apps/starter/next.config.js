/** @type {import('next').NextConfig} */
const nextConfig = {
  // 限制文件监听范围，避免EMFILE错误
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/.next',
          '**/dist',
          '**/build',
          '**/.turbo',
          // 忽略其他应用和包的目录
          '**/apps/demo-app/**',
          '**/packages/**',
          '**/modules/**',
        ],
      }
    }
    return config
  },
  // 使用更稳定的文件监听策略
  experimental: {
    // Next.js 15 已经内置了优化的文件监听
    // watchOptions 已被移除
  }
}

module.exports = nextConfig