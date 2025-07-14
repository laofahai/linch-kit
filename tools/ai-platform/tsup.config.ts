import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/guardian/*.ts'
  ],
  outDir: 'dist',
  format: ['esm'],
  dts: false,
  clean: true,
  external: ['@linch-kit/core', 'dotenv', 'fs'],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  skipNodeModulesBundle: true,
  bundle: false // 改为false以保持目录结构
})