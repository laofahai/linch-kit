#!/usr/bin/env bun

/**
 * Claude Code PreToolUse Hook
 * 正确处理 stdin JSON 输入的预处理脚本
 */

// 加载.env文件中的环境变量
import { config } from 'dotenv'
import { join } from 'path'

// 加载项目根目录的.env文件，强制覆盖现有环境变量
config({ path: join(process.cwd(), '.env'), override: true })

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
      cwd: process.cwd()
    })
    
    result.on('close', (code) => {
      if (code === 0) {
        console.log('✅ [PRE-HOOK] 约束检查通过')
      } else {
        console.log('❌ [PRE-HOOK] 约束检查失败')
        process.exit(code)
      }
    })
    
  } catch (error) {
    logger.error('PreToolUse Hook 执行失败:', error)
    console.error('❌ [PRE-HOOK] 执行出错:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)