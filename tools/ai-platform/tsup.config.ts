import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/**/*.ts'
  ],
  outDir: 'dist',
  format: ['esm'],
  dts: false,
  clean: true,
  external: ['@linch-kit/core', 'dotenv', 'fs', 'neo4j-driver'],
  treeshake: false,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  skipNodeModulesBundle: true,
  bundle: false, // 保持目录结构
  keepNames: true
})