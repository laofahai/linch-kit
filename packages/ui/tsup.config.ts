import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

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
    '@linch-kit/schema',
    'react-hook-form'  // 将 react-hook-form 也作为外部依赖
  ],
  treeshake: true,
  minify: false,
  target: 'es2020',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"'
    }
  },
  // 确保 ESM 输出格式正确
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    }
  },
  // 复制CSS文件到dist目录
  onSuccess: async () => {
    const stylesDir = 'dist/styles'
    mkdirSync(stylesDir, { recursive: true })
    copyFileSync('src/styles/globals.css', 'dist/styles/globals.css')
    console.log('CSS files copied to dist/styles/')
  }
})