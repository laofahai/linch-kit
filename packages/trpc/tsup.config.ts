import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@trpc/client',
    '@trpc/server',
    '@trpc/react-query',
    '@trpc/next',
    'next-auth',
    'next',
    'react',
    '@tanstack/react-query',
    '@linch-kit/auth-core',
    '@linch-kit/schema',
    '@linch-kit/core',
    '@linch-kit/types'
  ],
  banner: {
    js: '"use client";'
  }
})
