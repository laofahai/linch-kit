#!/usr/bin/env bun

/**
 * Claude Code PreToolUse Hook
 * 正确处理 stdin JSON 输入的预处理脚本
 */

// 加载.env文件中的环境变量
import { config } from 'dotenv'
import { join } from 'path'
import { existsSync } from 'fs'

// 获取项目根目录，优先使用 Claude Code 提供的环境变量
function getProjectRoot(): string {
  // 优先使用 Claude Code 提供的项目目录环境变量
  if (process.env.CLAUDE_PROJECT_DIR) {
    return process.env.CLAUDE_PROJECT_DIR
  }
  
  // 备用：使用自定义环境变量
  if (process.env.LINCHKIT_ROOT) {
    return process.env.LINCHKIT_ROOT
  }
  
  // 最后备用：查找包含 package.json 和 .claude 的目录
  let currentPath = process.cwd()
  
  while (currentPath !== '/' && currentPath !== '.') {
    const packageJsonPath = join(currentPath, 'package.json')
    const claudeConfigPath = join(currentPath, '.claude')
    
    if (existsSync(packageJsonPath) && existsSync(claudeConfigPath)) {
      try {
        const pkg = require(packageJsonPath)
        if (pkg.name === 'linch-kit' || 
            pkg.workspaces || 
            (pkg.dependencies && pkg.dependencies['@linch-kit/core'])) {
          return currentPath
        }
      } catch (error) {
        // 忽略JSON解析错误，继续向上查找
      }
    }
    
    const parentPath = join(currentPath, '..')
    if (parentPath === currentPath) break
    currentPath = parentPath
  }
  
  return process.cwd()
}

const projectRoot = getProjectRoot()

// 创建一个执行上下文，而不是改变全局工作目录
const executeInProjectRoot = (fn: () => any) => {
  const originalCwd = process.cwd()
  try {
    process.chdir(projectRoot)
    return fn()
  } finally {
    process.chdir(originalCwd)
  }
}

// 加载项目根目录的.env文件，使用绝对路径
config({ path: join(projectRoot, '.env'), override: true })

import { createLogger } from '@linch-kit/core'

const logger = createLogger('claude-pre-hook')

interface HookInput {
  session_id: string
  transcript_path: string
  tool_name: string
  tool_input: Record<string, any>
}

async function main() {
  try {
    // 从 stdin 读取 JSON 输入
    const input = await Bun.stdin.text()
    const hookData: HookInput = JSON.parse(input)
    
    console.log(`🚨 [PRE-HOOK] 工具操作即将开始 - ${hookData.tool_name}`)
    
    // 获取文件路径（如果存在）
    const filePath = hookData.tool_input?.file_path
    if (filePath) {
      console.log(`📁 目标文件: ${filePath}`)
    }
    
    // 执行约束检查
    console.log('🔍 执行预处理约束检查...')
    
    // 在项目根目录上下文中调用原有的约束检查脚本
    executeInProjectRoot(() => {
      // 调用原有的约束检查脚本，传递解析出的参数
    const { spawn } = require('child_process')
    const args = [
      'tools/ai-platform/scripts/ai-optimized-hook.ts',
      '--phase=pre',
      `--operation=${hookData.tool_name}`
    ]
    
    if (filePath) {
      args.push(`--file=${filePath}`)
    }
    
      const result = spawn('bun', args, { 
        stdio: 'inherit',
        cwd: projectRoot // 使用项目根目录
      })
    
      result.on('close', (code) => {
        if (code === 0) {
          console.log('✅ [PRE-HOOK] 约束检查通过')
        } else {
          console.log('❌ [PRE-HOOK] 约束检查失败')
          process.exit(code)
        }
      })
    }) // 结束executeInProjectRoot
    
  } catch (error) {
    logger.error('PreToolUse Hook 执行失败:', error)
    console.error('❌ [PRE-HOOK] 执行出错:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)