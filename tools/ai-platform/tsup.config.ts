import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
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
  bundle: true
})