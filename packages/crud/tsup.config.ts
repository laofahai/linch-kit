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
    '@prisma/client',
    'zod',
    'ioredis',
    'lru-cache'
  ]
})