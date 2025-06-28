import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@linch-kit/ui', 'lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  transpilePackages: [
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/auth',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui',
  ],
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['src'],
  },
}

export default nextConfig