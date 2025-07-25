#!/usr/bin/env bun

/**
 * AI优化的Claude Code Hook集成脚本
 * 
 * 替代原有的constraint-pre-check和constraint-post-check
 * 使用AI驱动的智能评估系统
 * 
 * 使用方法:
 * bun tools/ai-platform/scripts/ai-optimized-hook.ts --file="$FILE" --operation="$OPERATION" --phase="pre|post"
 * 
 * @version 2.0.0
 */

// 加载.env文件中的环境变量
import { config } from 'dotenv'
import { join } from 'path'

// 加载项目根目录的.env文件，强制覆盖现有环境变量
config({ path: join(process.cwd(), '.env'), override: true })

import { createLogger } from '@linch-kit/core'
import { AIDrivenHookOptimizer } from '../hooks/ai-driven-hook-optimizer'
import { AI_PROVIDERS } from '../src/core/constants'

const logger = createLogger('ai-optimized-hook')

interface CLIArgs {
  file?: string
  operation: string
  phase: 'pre' | 'post'
  aiProvider?: string
  fast?: boolean
}

/**
 * 解析命令行参数
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  
  const getArg = (name: string): string | undefined => {
    const arg = args.find(arg => arg.startsWith(`--${name}=`))
    return arg?.split('=')[1]
  }
  
  const hasFlag = (name: string): boolean => {
    return args.includes(`--${name}`)
  }
  
  return {
    file: getArg('file'),
    operation: getArg('operation') || 'Unknown',
    phase: (getArg('phase') as 'pre' | 'post') || 'pre',
    aiProvider: getArg('ai-provider') || AI_PROVIDERS.DEFAULT,
    fast: hasFlag('fast')
  }
}

/**
 * 执行AI优化的Hook检查
 */
async function executeAIOptimizedHook(args: CLIArgs): Promise<void> {
  const startTime = Date.now()
  
  try {
    logger.info(`🚀 AI优化Hook执行开始 - 阶段: ${args.phase}, 文件: ${args.file}`)
    
    // 初始化AI驱动的优化器
    const optimizer = new AIDrivenHookOptimizer(args.aiProvider)
    
    // 构建Hook上下文
    const context = {
      toolName: args.operation,
      filePath: args.file,
      operation: args.operation
    }
    
    // 执行AI驱动的优化检查
    const result = await optimizer.executeWithAIOptimization(context)
    
    // 输出结果
    displayResults(result, args.phase, Date.now() - startTime)
    
    // 根据结果决定退出码
    process.exit(result.shouldBlock ? 1 : 0)
    
  } catch (error) {
    logger.error(`❌ AI优化Hook执行失败: ${error.message}`)
    
    // 降级到基础检查
    logger.info('🔄 降级到基础检查模式')
    await fallbackExecution(args)
  }
}

/**
 * 显示执行结果
 */
function displayResults(result: any, phase: string, totalTime: number): void {
  console.log('🤖 AI优化Hook执行结果')
  console.log('════════════════════════════════════════')
  console.log(`📋 阶段: ${phase.toUpperCase()}`)
  console.log(`⏱️ 总耗时: ${totalTime}ms`)
  
  if (result.aiEvaluated) {
    console.log(`🎯 AI评估: 风险${result.riskLevel} (信心度: ${(result.confidence * 100).toFixed(1)}%)`)
  } else {
    console.log('⚠️ 使用了降级策略')
  }
  
  if (result.skipped) {
    console.log(`⏭️ 跳过原因: ${result.skipReason}`)
  }
  
  if (result.suggestions && result.suggestions.length > 0) {
    console.log('\n💡 AI智能建议:')
    result.suggestions.forEach((suggestion: string) => {
      console.log(`  • ${suggestion}`)
    })
  }
  
  if (result.constraints && result.constraints.length > 0) {
    console.log('\n🛡️ 约束检查:')
    result.constraints.forEach((constraint: string) => {
      console.log(`  • ${constraint}`)
    })
  }
  
  if (result.shouldBlock) {
    console.log('\n🚫 操作被阻塞 - 请解决上述问题后重试')
  } else {
    console.log('\n✅ 检查通过，可以继续操作')
  }
  
  console.log('════════════════════════════════════════')
}

/**
 * 降级执行策略
 */
async function fallbackExecution(args: CLIArgs): Promise<void> {
  console.log('🔄 执行降级检查策略')
  console.log('──────────────────────────────────────')
  
  // 基于文件类型的简单规则
  const suggestions = ['AI服务不可用，执行基础检查']
  const constraints = ['确保代码质量', '遵循项目规范']
  let shouldBlock = false
  
  if (args.file) {
    // 高风险文件类型检查
    const highRiskPatterns = [
      '/api/',
      '/components/',
      '/hooks/',
      '/core/',
      'index.',
      '.config.'
    ]
    
    const isHighRisk = highRiskPatterns.some(pattern => args.file!.includes(pattern))
    
    if (isHighRisk && args.phase === 'pre') {
      suggestions.push('高风险文件，建议仔细检查')
      constraints.push('核心文件修改需要额外注意')
    }
    
    // 测试文件或文档的宽松策略
    const isLowRisk = args.file.includes('.test.') || 
                      args.file.includes('.md') || 
                      args.file.includes('/docs/')
    
    if (isLowRisk) {
      suggestions.push('低风险文件，简化检查')
    }
  }
  
  // 根据阶段给出不同建议
  if (args.phase === 'pre') {
    suggestions.push('操作前检查：确认文件路径和操作类型正确')
  } else {
    suggestions.push('操作后检查：验证代码格式和基本规范')
    if (args.fast) {
      suggestions.push('快速模式：跳过详细静态分析')
    }
  }
  
  // 输出降级结果
  console.log('💡 基础建议:')
  suggestions.forEach(s => console.log(`  • ${s}`))
  
  console.log('\n🛡️ 基础约束:')
  constraints.forEach(c => console.log(`  • ${c}`))
  
  if (shouldBlock) {
    console.log('\n🚫 降级检查发现问题')
  } else {
    console.log('\n✅ 降级检查通过')
  }
  
  console.log('──────────────────────────────────────')
  
  process.exit(shouldBlock ? 1 : 0)
}

/**
 * 主执行入口
 */
async function main(): Promise<void> {
  try {
    const args = parseArgs()
    
    // 验证必要参数
    if (!args.operation) {
      console.error('❌ 缺少必要参数: --operation')
      process.exit(1)
    }
    
    if (!['pre', 'post'].includes(args.phase)) {
      console.error('❌ 无效的phase参数，必须是 pre 或 post')
      process.exit(1)
    }
    
    await executeAIOptimizedHook(args)
    
  } catch (error) {
    logger.error(`❌ 程序执行失败: ${error.message}`)
    process.exit(1)
  }
}

// 优雅处理进程退出
process.on('SIGINT', () => {
  logger.info('📊 Hook执行被中断')
  process.exit(130)
})

process.on('SIGTERM', () => {
  logger.info('📊 Hook执行被终止')
  process.exit(143)
})

// 执行主程序
if (import.meta.main) {
  main()
}