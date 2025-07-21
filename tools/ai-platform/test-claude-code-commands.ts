#!/usr/bin/env bun

/**
 * 测试Claude Code强制性命令系统
 * 演示脚本如何强制Claude Code执行特定操作和用户确认
 */

import { ClaudeCodeCommandGenerator, CommonClaudeCodeCommands } from './src/cli/claude-code-commands'

console.log('🧪 测试Claude Code强制性命令系统\n')

// 1. 演示用户确认命令
console.log('1️⃣ 演示: 包复用选择确认')
const packageChoice = CommonClaudeCodeCommands.confirmPackageChoice(
  ['@linch-kit/auth', '@linch-kit/platform'], 
  '自定义认证服务'
)
console.log(ClaudeCodeCommandGenerator.formatForClaudeCode([packageChoice]))

console.log('\n' + '='.repeat(80) + '\n')

// 2. 演示危险操作确认
console.log('2️⃣ 演示: 危险操作确认')
const dangerousOp = CommonClaudeCodeCommands.confirmDangerousOperation(
  '删除所有用户数据',
  ['不可恢复的数据丢失', '可能违反数据保护法规', '影响生产环境']
)
console.log(ClaudeCodeCommandGenerator.formatForClaudeCode([dangerousOp]))

console.log('\n' + '='.repeat(80) + '\n')

// 3. 演示分支强制创建
console.log('3️⃣ 演示: 强制分支创建')
const branchForcing = CommonClaudeCodeCommands.forceCreateBranch('新用户认证功能')
console.log(ClaudeCodeCommandGenerator.formatForClaudeCode([branchForcing]))

console.log('\n' + '='.repeat(80) + '\n')

// 4. 演示工具强制执行
console.log('4️⃣ 演示: 强制工具执行')
const forceToolExec = ClaudeCodeCommandGenerator.generateToolExecution(
  'Bash',
  {
    command: 'bun run validate:light',
    description: '执行轻量级验证'
  },
  '运行代码质量检查',
  '代码质量验证失败，必须修复',
  'BLOCKING'
)
console.log(ClaudeCodeCommandGenerator.formatForClaudeCode([forceToolExec]))

console.log('\n' + '='.repeat(80) + '\n')

// 5. 演示复杂的多命令组合
console.log('5️⃣ 演示: 复杂多命令组合')
const multiCommands = [
  ClaudeCodeCommandGenerator.generateUserConfirmation(
    '检测到多个问题，选择处理方式:',
    [
      { 
        label: '自动修复所有问题', 
        value: 'auto-fix',
        action: ClaudeCodeCommandGenerator.generateToolExecution(
          'Bash',
          { command: 'bun run fix:all', description: '自动修复所有问题' },
          '自动修复',
          '用户选择自动修复'
        )
      },
      { 
        label: '手动处理每个问题', 
        value: 'manual' 
      },
      { 
        label: '跳过此次检查', 
        value: 'skip',
        action: ClaudeCodeCommandGenerator.generateStopExecution(
          '用户选择跳过检查',
          ['稍后手动运行检查', '确保代码质量']
        )
      }
    ],
    '多个质量问题需要处理'
  ),
  ClaudeCodeCommandGenerator.generateToolExecution(
    'TodoWrite',
    {
      todos: [
        { content: '修复Neo4j连接问题', status: 'pending', priority: 'high', id: 'fix-neo4j' },
        { content: '更新测试用例', status: 'pending', priority: 'medium', id: 'update-tests' }
      ]
    },
    '创建修复任务清单',
    '记录需要处理的问题'
  )
]

console.log(ClaudeCodeCommandGenerator.formatForClaudeCode(multiCommands))

console.log('\n🎯 总结:')
console.log('✅ 脚本可以强制Claude Code执行:')
console.log('  1. 用户确认对话框')
console.log('  2. 特定工具调用 (Bash, Read, Edit, etc.)')
console.log('  3. 停止执行流程')
console.log('  4. 创建TODO任务')
console.log('  5. 复杂的条件分支逻辑')
console.log('')
console.log('💪 强制性级别:')
console.log('  - BLOCKING: 必须执行，不可跳过')
console.log('  - HIGH: 强烈建议执行')
console.log('  - MEDIUM: 建议执行')
console.log('')
console.log('🔗 集成方式:')
console.log('  - AI Guardian验证脚本自动生成命令')
console.log('  - Graph RAG查询失败时强制修复')
console.log('  - 保护分支检测时强制创建分支')
console.log('  - 包复用冲突时要求用户选择')