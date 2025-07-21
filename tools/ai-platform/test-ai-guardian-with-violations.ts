#!/usr/bin/env bun

/**
 * 测试AI Guardian在检测到违规时的强制性命令生成
 * 模拟各种违规场景
 */

class TestableAIGuardian {
  constructor() {
    this.violations = []
    this.warnings = []
    this.analysisSource = 'test'
    this.taskDescription = '测试违规场景处理'
  }

  // 模拟各种违规检测
  simulateViolations(scenario) {
    switch (scenario) {
      case 'protected-branch':
        this.violations.push('🚨 禁止在保护分支工作: main')
        break
      case 'neo4j-failure':
        this.violations.push('🚨 Graph RAG查询失败 - 必须修复Neo4j连接')
        break
      case 'context-verification':
        this.violations.push('🚨 上下文验证失败 - Context Verifier执行错误')
        break
      case 'multiple-issues':
        this.violations.push('🚨 禁止在保护分支工作: main')
        this.violations.push('🚨 Graph RAG查询失败 - 必须修复Neo4j连接')
        this.violations.push('🚨 上下文验证失败 - Context Verifier执行错误')
        this.warnings.push('⚠️ 工作目录有未提交的更改')
        break
    }
  }

  generateClaudeCodeCommands(result) {
    const commands = []

    // 动态导入命令生成器
    const { ClaudeCodeCommandGenerator, CommonClaudeCodeCommands } = require('./src/cli/claude-code-commands.ts')

    // 如果有严重违规，生成停止执行命令
    if (result.violations.length > 0) {
      commands.push(ClaudeCodeCommandGenerator.generateStopExecution(
        `发现 ${result.violations.length} 个零容忍违规项`,
        [
          '修复所有违规项',
          '重新运行AI Guardian验证',
          '确保分支状态正确',
          '修复Graph RAG连接问题'
        ]
      ))
    }

    // 如果Neo4j连接失败，强制修复
    if (this.violations.some(v => v.includes('Graph RAG') || v.includes('Neo4j'))) {
      commands.push(CommonClaudeCodeCommands.forceFixNeo4j())
    }

    // 如果在保护分支，强制创建分支
    if (this.violations.some(v => v.includes('保护分支'))) {
      commands.push(CommonClaudeCodeCommands.forceCreateBranch(this.taskDescription || '新功能开发'))
    }

    return commands
  }

  printResults(result) {
    console.log(`\n📋 违规场景: ${result.scenario}`)
    console.log('=' .repeat(50))
    
    if (result.violations.length > 0) {
      console.log('\n❌ 发现违规项:')
      result.violations.forEach(violation => console.log(`  ${violation}`))
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ 警告项:')
      result.warnings.forEach(warning => console.log(`  ${warning}`))
    }
    
    if (result.success) {
      console.log('\n✅ 所有强制验证已通过！')
    } else {
      console.log('\n🚨 验证失败，请修复违规项后重试')
      
      // 🔴 生成强制性Claude Code命令
      const commands = this.generateClaudeCodeCommands(result)
      if (commands.length > 0) {
        const { ClaudeCodeCommandGenerator } = require('./src/cli/claude-code-commands.ts')
        const formattedCommands = ClaudeCodeCommandGenerator.formatForClaudeCode(commands)
        
        console.log('\n' + '🔴'.repeat(30))
        console.log('📢 CLAUDE CODE 强制执行指令')
        console.log('🔴'.repeat(30))
        console.log(formattedCommands)
        console.log('🔴'.repeat(30))
      }
    }
  }

  runTest(scenario) {
    console.log(`\n🧪 测试场景: ${scenario}`)
    
    // 重置状态
    this.violations = []
    this.warnings = []
    
    // 模拟违规
    this.simulateViolations(scenario)
    
    // 生成结果
    const result = {
      scenario,
      violations: this.violations,
      warnings: this.warnings,
      success: this.violations.length === 0
    }
    
    // 打印结果
    this.printResults(result)
  }
}

// 运行测试
const guardian = new TestableAIGuardian()

console.log('🛡️ AI Guardian 强制性命令测试')
console.log('=' .repeat(60))

// 场景1: 保护分支违规
guardian.runTest('protected-branch')

console.log('\n' + '='.repeat(60))

// 场景2: Neo4j连接失败
guardian.runTest('neo4j-failure')

console.log('\n' + '='.repeat(60))

// 场景3: 上下文验证失败
guardian.runTest('context-verification')

console.log('\n' + '='.repeat(60))

// 场景4: 多重违规
guardian.runTest('multiple-issues')

console.log('\n🎯 总结:')
console.log('✅ AI Guardian现在可以:')
console.log('  1. 检测各种违规情况')
console.log('  2. 生成对应的强制性Claude Code命令')
console.log('  3. 要求用户确认关键决策')
console.log('  4. 强制执行修复工具')
console.log('  5. 在严重违规时停止执行流程')
console.log('')
console.log('💪 不再是黑盒！用户可以清楚看到:')
console.log('  - 每个检查步骤的结果')
console.log('  - 违规的具体原因')
console.log('  - 需要采取的具体行动')
console.log('  - Claude Code接下来必须执行的操作')