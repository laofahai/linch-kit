#!/usr/bin/env bun

/**
 * Claude Code PostToolUse Hook
 * 正确处理 stdin JSON 输入的后处理脚本
 */

// 加载.env文件中的环境变量
import { config } from 'dotenv'
import { join } from 'path'
import { existsSync } from 'fs'

// 自动查找项目根目录
function findProjectRoot(startPath: string = process.cwd()): string {
  let currentPath = startPath
  
  while (currentPath !== '/') {
    // 检查是否是LinchKit项目根目录（有package.json且包含linch-kit名称）
    const packageJsonPath = join(currentPath, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = require(packageJsonPath)
        if (pkg.name === 'linch-kit' || pkg.workspaces) {
          return currentPath
        }
      } catch {}
    }
    currentPath = join(currentPath, '..')
  }
  
  // 如果找不到，回退到当前目录
  return startPath
}

const projectRoot = findProjectRoot()

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
        
        qualityGateResult.on('close', async (finalCode) => {
          if (finalCode === 0) {
            console.log('🎉 [POST-HOOK] 所有检查完成')
            
            // 🎯 优化的增量同步（如果有文件修改）
            if (filePath && (hookData.tool_name === 'Edit' || hookData.tool_name === 'MultiEdit' || hookData.tool_name === 'Write')) {
              console.log('🔄 [SYNC] 触发Graph RAG智能增量同步...')
              
              // 🎯 优化1: 智能判断是否需要同步
              const shouldSync = await checkIfSyncNeeded(filePath, hookData.tool_name)
              
              if (shouldSync) {
                console.log(`📊 [SYNC] 检测到重要文件修改: ${filePath}`)
                
                // 🎯 优化2: 使用优化的同步命令，限制处理时间
                const syncResult = spawn('bun', [
                  'run', 'ai:session', 'sync', 
                  '--incremental',
                  '--file', filePath,
                  '--timeout', '10000' // 10秒超时
                ], {
                  stdio: 'inherit',
                  cwd: process.cwd()
                })
                
                syncResult.on('close', (syncCode) => {
                  if (syncCode === 0) {
                    console.log('✅ [SYNC] Graph RAG智能增量同步完成')
                  } else {
                    console.log('⚠️ [SYNC] Graph RAG增量同步失败，将在/end-session时重新尝试')
                  }
                })
              } else {
                console.log('ℹ️ [SYNC] 文件修改不影响Graph RAG，跳过同步')
              }
            }

            async function checkIfSyncNeeded(filePath: string, operation: string): Promise<boolean> {
              // 🎯 优化3: 智能判断哪些文件修改需要同步
              const importantFilePatterns = [
                /\/components\//,
                /\/services\//,
                /\/utils\//,
                /\/hooks\//,
                /\/lib\//,
                /\.tsx?$/
              ]
              
              const skipPatterns = [
                /\.test\./,
                /\.spec\./,
                /\/dist\//,
                /\/node_modules\//,
                /\.d\.ts$/
              ]
              
              // 跳过测试文件和构建输出
              if (skipPatterns.some(pattern => pattern.test(filePath))) {
                return false
              }
              
              // 只同步重要文件
              return importantFilePatterns.some(pattern => pattern.test(filePath))
            }
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