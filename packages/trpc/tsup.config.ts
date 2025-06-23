import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
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
    '@linch-kit/auth',
    '@linch-kit/schema',
    '@linch-kit/core',
    '@linch-kit/types',
  ],
  banner: {
    js: '"use client";',
  },
  tsconfig: './tsconfig.build.json',
})
