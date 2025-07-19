import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/client.ts', 'src/server.ts', 'src/shared.ts', 'src/styles/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true, // 启用代码分割，现代库最佳实践
  sourcemap: true,
  clean: true,
  minify: false,
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

  // CSS 将通过 build:css 脚本单独处理
  onSuccess: async () => {
    console.log('✅ TypeScript compilation completed')
    
    // 确保客户端构建产物保留 'use client' 指令
    const { promises: fs } = await import('fs')
    const { resolve } = await import('path')
    
    const clientFiles = [
      'dist/client.js',
      'dist/client.mjs'
    ]
    
    for (const file of clientFiles) {
      try {
        const filePath = resolve(file)
        const content = await fs.readFile(filePath, 'utf-8')
        
        // 检查是否已有 'use client' 指令
        if (!content.trim().startsWith("'use client'") && !content.trim().startsWith('"use client"')) {
          console.log(`📝 Adding 'use client' directive to ${file}`)
          await fs.writeFile(filePath, `'use client';\n${content}`)
        } else {
          console.log(`✅ 'use client' directive already present in ${file}`)
        }
      } catch (error) {
        console.log(`⚠️  Could not process ${file}: ${error.message}`)
      }
    }
  },
})
