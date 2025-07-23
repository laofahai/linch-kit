#!/usr/bin/env bun

/**
 * Claude Code PostToolUse Hook
 * 正确处理 stdin JSON 输入的后处理脚本
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('claude-post-hook')

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
    
    console.log(`✅ [POST-HOOK] 工具操作已完成 - ${hookData.tool_name}`)
    
    // 获取文件路径（如果存在）
    const filePath = hookData.tool_input?.file_path
    if (filePath) {
      console.log(`📁 已处理文件: ${filePath}`)
    }
    
    // 执行后处理检查
    console.log('🔍 执行后处理质量检查...')
    
    // 调用原有的约束检查脚本
    const { spawn } = require('child_process')
    const args = [
      'tools/ai-platform/scripts/ai-optimized-hook.ts',
      '--phase=post',
      `--operation=${hookData.tool_name}`
    ]
    
    if (filePath) {
      args.push(`--file=${filePath}`)
    }
    
    const postCheckResult = spawn('bun', args, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    postCheckResult.on('close', (code) => {
      if (code === 0) {
        console.log('✅ [POST-HOOK] 后处理检查通过')
        
        // 执行最终质量门禁
        console.log('🛡️ [FINAL-CHECK] 执行最终质量门禁')
        const qualityGateResult = spawn('bun', ['run', 'ai:quality-gate', '--fast'], {
          stdio: 'inherit',
          cwd: process.cwd()
        })
        
        qualityGateResult.on('close', (finalCode) => {
          if (finalCode === 0) {
            console.log('🎉 [POST-HOOK] 所有检查完成')
          } else {
            console.log('❌ [POST-HOOK] 质量门禁失败')
            process.exit(finalCode)
          }
        })
      } else {
        console.log('❌ [POST-HOOK] 后处理检查失败')
        process.exit(code)
      }
    })
    
  } catch (error) {
    logger.error('PostToolUse Hook 执行失败:', error)
    console.error('❌ [POST-HOOK] 执行出错:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)