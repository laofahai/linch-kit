#!/usr/bin/env bun

/**
 * LinchKit AI Platform CLI
 * Graph RAG 知识图谱查询和管理工具
 */

import { Command } from 'commander'

const program = new Command()

program
  .name('ai-platform')
  .description('LinchKit AI Platform - Graph RAG知识图谱工具')
  .version('1.0.0')

program
  .command('query <keyword>')
  .description('查询项目知识图谱')
  .action(async (keyword: string) => {
    logger.info(`🔍 查询关键词: ${keyword}`)
    // 调用 Graph RAG 查询
    const { spawn } = await import('child_process')
    spawn('bun', ['run', 'scripts/session-tools.js', 'query', keyword], {
      stdio: 'inherit',
      cwd: process.cwd()
    })
  })

program
  .command('extract')
  .description('提取项目代码到知识图谱')
  .action(async () => {
    logger.info('🔄 开始提取项目代码...')
    const { spawn } = await import('child_process')
    spawn('bun', ['graph', 'sync'], {
      stdio: 'inherit',
      cwd: process.cwd()
    })
  })

program.parse()