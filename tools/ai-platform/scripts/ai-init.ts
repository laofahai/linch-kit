#!/usr/bin/env bun
/**
 * LinchKit AI 初始化脚本
 * 轻量级初始化命令，配合 Claude Code Hooks 系统使用
 * 
 * 用法: bun run ai:init --task="任务描述"
 * 
 * @version 1.0.0
 * @author Claude Code
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { createLogger } from '@linch-kit/core'

const execAsync = promisify(exec)
const logger = createLogger('ai-init')

class AIInitializer {
  private taskDescription: string
  private violations: string[] = []

  constructor(taskDescription: string) {
    this.taskDescription = taskDescription
  }

  async initialize(): Promise<boolean> {
    logger.info('🚀 LinchKit AI 初始化开始...')
    logger.info(`📋 任务: ${this.taskDescription}`)
    
    // 1. 快速环境检查
    await this.quickEnvironmentCheck()
    
    // 2. 验证 Hooks 配置
    this.verifyHooksConfiguration()
    
    // 3. 显示初始化结果
    this.displayResults()
    
    return this.violations.length === 0
  }

  private async quickEnvironmentCheck(): Promise<void> {
    logger.info('🔍 快速环境检查...')
    
    // 检查基础配置文件
    if (!existsSync('./package.json')) {
      this.violations.push('package.json 不存在')
    }
    
    if (!existsSync('./tsconfig.json')) {
      this.violations.push('tsconfig.json 不存在')
    }
    
    // 检查 Hooks 脚本是否存在
    if (!existsSync('./tools/ai-platform/scripts/constraint-pre-check.ts')) {
      this.violations.push('constraint:pre-check 脚本不存在')
    }
    
    if (!existsSync('./tools/ai-platform/scripts/constraint-post-check.ts')) {
      this.violations.push('constraint:post-check 脚本不存在')
    }
    
    // 检查当前分支
    try {
      const { stdout: currentBranch } = await execAsync('git branch --show-current')
      const branch = currentBranch.trim()
      
      if (['main', 'master', 'develop'].includes(branch)) {
        this.violations.push(`不建议在保护分支 ${branch} 上直接开发`)
      } else {
        logger.info(`✅ 当前分支: ${branch}`)
      }
    } catch (error) {
      logger.warn('Git 分支检查失败，继续执行')
    }
  }

  private verifyHooksConfiguration(): void {
    logger.info('🪝 验证 Hooks 配置...')
    
    if (!existsSync('./.claude/settings.json')) {
      this.violations.push('Claude Code hooks 配置文件不存在')
      return
    }
    
    try {
      const fs = require('fs')
      const settings = JSON.parse(fs.readFileSync('./.claude/settings.json', 'utf-8'))
      
      if (!settings.hooks?.PreToolUse) {
        this.violations.push('PreToolUse hooks 未配置')
      }
      
      if (!settings.hooks?.PostToolUse) {
        this.violations.push('PostToolUse hooks 未配置')
      }
      
      if (this.violations.length === 0) {
        logger.info('✅ Claude Code Hooks 配置正常')
      }
    } catch (error) {
      this.violations.push('Hooks 配置文件格式错误')
    }
  }

  private displayResults(): void {
    console.log('\n🎯 AI 初始化结果:')
    console.log('═'.repeat(50))
    
    if (this.violations.length === 0) {
      console.log('\n✅ 初始化成功!')
      console.log('\n🪝 Claude Code Hooks 系统已激活:')
      console.log('  • PreToolUse: 文件操作前自动进行上下文注入')
      console.log('  • PostToolUse: 文件操作后自动进行质量验证')
      
      console.log('\n📋 接下来的文件操作将自动触发:')
      console.log('  🔹 智能模式推荐')
      console.log('  🔹 现有实现查询')
      console.log('  🔹 约束检查')
      console.log('  🔹 质量验证')
      
      console.log('\n🚀 准备就绪，可以开始开发!')
    } else {
      console.log('\n❌ 初始化失败:')
      this.violations.forEach(violation => {
        console.log(`  • ${violation}`)
      })
      
      console.log('\n🔧 请修复上述问题后重试')
    }
    
    console.log('═'.repeat(50))
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  let taskDescription = ''
  
  // 解析参数
  for (const arg of args) {
    if (arg.startsWith('--task=')) {
      taskDescription = arg.substring(7)
    }
  }
  
  if (!taskDescription) {
    logger.error('❌ 错误: 请提供任务描述')
    logger.error('使用方法: bun run ai:init --task="任务描述"')
    process.exit(1)
  }
  
  const initializer = new AIInitializer(taskDescription)
  const success = await initializer.initialize()
  
  if (!success) {
    process.exit(1)
  }
}

if (import.meta.main) {
  main().catch(console.error)
}