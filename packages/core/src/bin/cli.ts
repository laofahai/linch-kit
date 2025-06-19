#!/usr/bin/env node

/**
 * Linch Kit CLI 入口文件
 * 
 * 这个文件是 CLI 的主入口点，负责启动整个 CLI 系统
 */

import { createCLI } from '../cli'

// 启动 CLI
createCLI().catch(error => {
  console.error('AI: Failed to start CLI:', error)
  process.exit(1)
})
