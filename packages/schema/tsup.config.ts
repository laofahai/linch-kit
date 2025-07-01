import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['cjs', 'esm'],
  dts: true, // 必须包含完整的 .d.ts 文件
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['reflect-metadata', '@linch-kit/core']
})