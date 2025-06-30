import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/auth',
    '@linch-kit/trpc',
    '@prisma/client',
    'zod',
    'ioredis',
    'lru-cache'
  ]
})