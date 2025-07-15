import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  entry: ['src/client.ts', 'src/server.ts', 'src/shared.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true, // 启用代码分割，现代库最佳实践
  sourcemap: true,
  clean: true,
  target: 'es2020',
  
  // 关键：将所有 React 和框架包标记为外部依赖
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'next',
    'next/link',
    'next/image',
    'next/router',
    '@hookform/resolvers',
    '@linch-kit/core',
    '@linch-kit/crud', 
    '@linch-kit/schema',
    'react-hook-form',
  ],
  
  esbuildOptions(options) {
    // 使用现代 JSX 自动转换
    options.jsx = 'automatic'
    options.jsxImportSource = 'react'
  },
  
  // 确保正确的文件扩展名
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    }
  },
  
  // 复制CSS文件
  onSuccess: async () => {
    const stylesDir = 'dist/styles'
    const themesDir = 'dist/styles/themes'
    mkdirSync(stylesDir, { recursive: true })
    mkdirSync(themesDir, { recursive: true })
    
    copyFileSync('src/styles/globals.css', 'dist/styles/globals.css')
    copyFileSync('src/styles/themes/linch-kit.css', 'dist/styles/themes/linch-kit.css')
    copyFileSync('src/styles/utilities.css', 'dist/styles/utilities.css')
    copyFileSync('src/styles/index.css', 'dist/styles/index.css')
    
    console.log('✅ CSS files copied to dist/styles/')
    console.log('   - index.css (complete theme system)')
    console.log('   - globals.css (base styles)')
    console.log('   - themes/linch-kit.css (default theme)')
    console.log('   - utilities.css (theme utilities)')
  },
})