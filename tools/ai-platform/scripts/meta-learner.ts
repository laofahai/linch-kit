#!/usr/bin/env bun

/**
 * Meta-Learner CLI Script
 * 
 * Claude Code命令接口适配器
 * 为Meta-Learner提供命令行入口
 */

import { MetaLearner } from '../src/guardian/meta-learner.js'

async function main() {
  const args = process.argv.slice(2)
  const action = args[0] || 'analyze'
  const verbose = args.includes('--verbose')
  const format = args.includes('--format=json') ? 'json' : 'text'

  const metaLearner = new MetaLearner()

  try {
    const result = await metaLearner.claudeAnalyze({
      action,
      verbose,
      format
    })

    logger.info(result.output)
    
    if (!result.success) {
      process.exit(1)
    }
  } catch (error) {
    logger.error('❌ Meta-Learner执行失败:', error.message)
    process.exit(1)
  }
}

// 直接执行
await main()