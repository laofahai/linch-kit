#!/usr/bin/env node

/**
 * 使用 graceful-fs 启动 Next.js 开发服务器
 * 解决 monorepo 中 EMFILE: too many open files 问题
 */

import gracefulFs from 'graceful-fs'
import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'

// 在任何其他操作之前设置 graceful-fs
gracefulFs.gracefulify(fs)

// 设置文件描述符限制
process.setMaxListeners(0)

console.log('🚀 启动 Next.js 开发服务器 (使用 graceful-fs)')

const child = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    // 优化 Node.js 内存使用
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
})

child.on('exit', (code) => {
  process.exit(code)
})

// 优雅地处理退出信号
process.on('SIGINT', () => {
  console.log('\n📝 正在关闭开发服务器...')
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\n📝 正在关闭开发服务器...')
  child.kill('SIGTERM')
})