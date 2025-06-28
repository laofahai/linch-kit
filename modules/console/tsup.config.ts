import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  clean: true,
  external: [
    'react',
    'react-dom',
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/auth',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui'
  ],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  minify: false,
})