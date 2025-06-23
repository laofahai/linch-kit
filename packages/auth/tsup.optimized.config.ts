import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/test-standalone.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: false, // 关键优化：不解析依赖类型
  },
  clean: true,
  sourcemap: false,
  target: 'es2022',
  external: [
    // 明确标记外部依赖
    '@linch-kit/schema',
    'zod',
    'next-auth',
    'react',
    'react-dom'
  ],
  tsconfig: './tsconfig.build.json',
  minify: false,
  splitting: false,
  treeshake: false, // 关闭 treeshake 以提升速度
  outDir: 'dist-optimized'
})
