#!/usr/bin/env node

/**
 * LinchKit 架构检查脚本
 * 
 * 使用 AI Platform 中的 Arch-Warden 进行架构合规性检查
 * 
 * 使用方法:
 * - bun run arch:check                 # 基础检查
 * - bun run arch:check --verbose       # 详细模式
 * - bun run arch:check --strict        # 严格模式 (CI)
 * - bun run arch:check @linch-kit/ui   # 检查特定包
 */

import { ArchWarden } from '../dist/guardian/arch-warden.js'
import process from 'process'

// 简单的logger实现
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`)
}

async function main() {
  const args = process.argv.slice(2)
  
  // 解析参数
  const options = {
    targetPackage: undefined,
    verbose: args.includes('--verbose'),
    strict: args.includes('--strict'),
    format: 'text'
  }
  
  // 查找目标包参数
  const packageArg = args.find(arg => arg.startsWith('@linch-kit/'))
  if (packageArg) {
    options.targetPackage = packageArg
  }
  
  logger.info('🛡️ LinchKit Arch-Warden - AI架构守卫启动')
  logger.info(`   模式: ${options.strict ? '严格' : '标准'}${options.verbose ? ' (详细)' : ''}`)
  
  if (options.targetPackage) {
    logger.info(`   目标包: ${options.targetPackage}`)
  }
  
  logger.info('')
  
  try {
    const warden = new ArchWarden()
    const result = await warden.claudeCheck(options)
    
    // 输出检查结果
    logger.info(result.output)
    
    // 处理严格模式
    if (options.strict && !result.success) {
      logger.info('\n🚨 严格模式: 检测到架构违规，阻止继续执行')
      process.exit(1)
    }
    
    // 处理标准模式的错误
    if (!result.success) {
      const errorCount = result.report.violations.filter(v => v.severity === 'error').length
      const fatalCount = result.report.violations.filter(v => v.severity === 'fatal').length
      
      if (fatalCount > 0) {
        logger.info('\n💥 致命架构违规，必须修复')
        process.exit(1)
      }
      
      if (errorCount > 0) {
        logger.info('\n⚠️ 发现架构错误，建议修复')
        // 标准模式下允许继续，但返回警告码
        process.exit(2)
      }
    }
    
    logger.info('\n✅ 架构合规性检查完成')
    
  } catch (error) {
    logger.error('\n💥 Arch-Warden 执行失败:')
    logger.error(`   错误: ${error.message}`)
    
    if (options.verbose) {
      logger.error(`   堆栈: ${error.stack}`)
    }
    
    logger.error('\n🔧 故障排除建议:')
    logger.error('   1. 确保项目结构完整')
    logger.error('   2. 检查依赖是否正确安装')
    logger.error('   3. 验证 Graph RAG 系统状态')
    logger.error('   4. 运行 bun run deps:graph 检查依赖分析脚本')
    
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  logger.error('💥 未捕获错误:', error.message)
  process.exit(1)
})