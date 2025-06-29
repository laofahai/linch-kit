import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/index.ts',
    'src/forms/index.ts',
    'src/tables/index.ts',
    'src/utils/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@hookform/resolvers',
    '@linch-kit/core',
    '@linch-kit/crud',
    '@linch-kit/schema'
  ],
  treeshake: true,
  minify: false,
  target: 'es2020',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"'
    }
  }
})