#!/usr/bin/env bun
/**
 * Context Verifier CLI Script
 * 
 * AI理解一致性验证的命令行接口
 */

import { ContextVerifier } from '../src/guardian/context-verifier.js'

const verifier = new ContextVerifier()

const action = process.argv[2] || 'verify'
const entityName = process.env.ENTITY_NAME || 
  process.argv.find(arg => arg.startsWith('--entity='))?.split('=')[1]
const verbose = process.env.VERBOSE === 'true' || 
  process.argv.includes('--verbose')
const format = process.env.FORMAT || 
  (process.argv.find(arg => arg.startsWith('--format='))?.split('=')[1]) || 'text'

async function main() {
  try {
    console.log(`🔍 Context Verifier - ${action}ing...`)
    
    const result = await verifier.claudeVerify({
      action,
      entityName,
      verbose,
      format
    })
    
    console.log(result.output)
    process.exit(result.success ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Context Verifier执行失败:', error.message)
    process.exit(1)
  }
}

main()