#!/usr/bin/env node

// Demo App 开发服务器启动脚本

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 设置文件监听限制
process.env.UV_THREADPOOL_SIZE = '64'
process.env.NODE_MAX_LISTENERS = '100'

// 启动 Next.js 开发服务器
const dev = spawn('bunx', ['next', 'dev', '--port', '3001'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    FORCE_COLOR: '1',
    NODE_ENV: 'development'
  }
})

dev.on('close', (code) => {
  process.exit(code || 0)
})

process.on('SIGINT', () => {
  dev.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  dev.kill('SIGTERM')
  process.exit(0)
})