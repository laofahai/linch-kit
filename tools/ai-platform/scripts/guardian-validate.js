#!/usr/bin/env bun
/**
 * LinchKit AI Guardian 统一验证脚本
 * 集成ai-platform的Guardian智能体集群，替代ai-guardian/session-validator.ts
 * 
 * 用法: bun run ai:guardian:validate "任务描述"
 * 
 * @version 1.0.0
 * @author Claude Code
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * Guardian验证结果
 * @typedef {Object} GuardianValidationResult
 * @property {boolean} success
 * @property {string[]} violations 
 * @property {string[]} warnings
 * @property {string} taskDescription
 * @property {string} timestamp
 */

/**
 * AI Guardian 统一验证器
 * 整合ai-platform的各种Guardian能力
 */
class AIGuardianValidator {
  constructor() {
    this.violations = []
    this.warnings = []
  }

  /**
   * 主验证流程 - 集成ai-platform Guardian系统
   * @param {string} taskDescription 
   * @returns {Promise<GuardianValidationResult>}
   */
  async validate(taskDescription) {
    console.log('🚨 AI Session 强制验证启动...')
    
    // 1. 分支检查 (零容忍)
    this.checkBranch()
    
    // 2. 执行强制Graph RAG查询
    await this.executeGraphRAGQuery(taskDescription)
    
    // 3. 架构合规性检查 (使用ArchWarden)
    await this.checkArchitecture()
    
    // 4. 上下文验证 (使用ContextVerifier)
    await this.verifyContext()
    
    // 5. 包复用检查
    await this.checkPackageReuse(taskDescription)
    
    // 6. 生成约束文件
    this.generateConstraintsFile(taskDescription)
    
    const result = {
      success: this.violations.length === 0,
      violations: this.violations,
      warnings: this.warnings,
      taskDescription,
      timestamp: new Date().toISOString()
    }
    
    this.printResults(result)
    return result
  }
  
  checkBranch() {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      
      // 检查保护分支
      const protectedBranches = ['main', 'master', 'develop', 'release']
      if (protectedBranches.some(branch => currentBranch.startsWith(branch))) {
        this.violations.push(`🚨 分支违规: 禁止在保护分支工作 (${currentBranch})`)
        return
      }
      
      console.log(`✅ 分支检查通过: ${currentBranch}`)
      
    } catch (error) {
      this.violations.push('🚨 Git分支检查失败')
    }
  }
  
  async executeGraphRAGQuery(taskDescription) {
    console.log('🔍 执行强制Graph RAG查询...')
    console.log(`  查询关键词: ${taskDescription}`)
    
    try {
      // 使用ai-platform的session-tools进行查询
      const result = execSync(`bun tools/ai-platform/scripts/session-tools.js query "${taskDescription}" --debug`, {
        encoding: 'utf8'
      })
      
      console.log('✅ Graph RAG查询完成')
      
      // 检查查询结果
      if (result.includes('"total_found": 0')) {
        this.warnings.push('⚠️ Graph RAG未找到相关上下文')
      }
      
    } catch (error) {
      this.warnings.push('⚠️ Graph RAG查询失败，请手动确认项目上下文')
    }
  }
  
  async checkArchitecture() {
    try {
      // 使用ai-platform的arch-check进行架构检查
      execSync('bun tools/ai-platform/scripts/arch-check.js', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      console.log('✅ 架构合规性检查通过')
      
    } catch (error) {
      // arch-check失败时添加警告而非阻断
      this.warnings.push('⚠️ 架构合规性检查发现问题，建议查看详细报告')
    }
  }
  
  async verifyContext() {
    try {
      // 使用ai-platform的context-verifier
      execSync('bun tools/ai-platform/scripts/context-verifier.js --action=verify', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      console.log('✅ 上下文验证通过')
      
    } catch (error) {
      this.warnings.push('⚠️ 上下文验证发现问题')
    }
  }
  
  async checkPackageReuse(taskDescription) {
    try {
      // 使用现有的deps-check脚本
      const result = execSync(`bun run deps:check "${taskDescription}"`, {
        encoding: 'utf8'
      })
      
      if (result.includes('发现现有包实现')) {
        this.warnings.push('💡 发现可复用的现有实现，建议优先扩展')
      }
      
    } catch (error) {
      this.warnings.push('⚠️ 包复用检查失败')
    }
  }
  
  generateConstraintsFile(taskDescription) {
    const constraintsDir = '.claude'
    const constraintsFile = join(constraintsDir, 'session-constraints.md')
    
    if (!existsSync(constraintsDir)) {
      mkdirSync(constraintsDir, { recursive: true })
    }
    
    const sessionId = Date.now()
    const timestamp = new Date().toISOString()
    
    const constraintsContent = `# AI Session 强制约束 (${timestamp})

## 任务: ${taskDescription}

## 🚨 零容忍违规项
1. ❌ 在保护分支工作
2. ❌ 跳过Graph RAG查询  
3. ❌ 使用any类型
4. ❌ 使用console.log
5. ❌ 不同步更新测试
6. ❌ 重复实现现有功能

## 📋 质量门禁命令
\`\`\`bash
# 类型检查
bunx tsc --noEmit --strict

# 代码规范
bun run lint --max-warnings=0

# 测试同步
bun test
bun test --coverage
\`\`\`

---
生成时间: ${timestamp}
会话ID: ${sessionId}`

    writeFileSync(constraintsFile, constraintsContent)
    console.log('✅ 约束文件已生成')
    console.log('📋 约束文件: .claude/session-constraints.md')
  }
  
  printResults(result) {
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
      console.log('✅ AI Guardian已激活')
    } else {
      console.log('\n🚨 验证失败，请修复违规项后重试')
    }
    
    console.log('\n⚠️ 注意事项：')
    if (this.hasUncommittedChanges()) {
      console.log('  ⚠️ 工作目录有未提交的更改')
    }
    if (!this.hasDesignDoc()) {
      console.log('  ⚠️ 未找到设计文档，复杂功能开发前应创建DESIGN.md')
    }
  }
  
  hasUncommittedChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' })
      return status.trim().length > 0
    } catch {
      return false
    }
  }
  
  hasDesignDoc() {
    return existsSync('DESIGN.md') || existsSync('design.md') || existsSync('docs/DESIGN.md')
  }
}

// 主函数
async function main() {
  const taskDescription = process.argv[2]
  
  if (!taskDescription) {
    console.error('❌ 错误: 请提供任务描述')
    console.error('使用方法: bun run ai:guardian:validate "任务描述"')
    process.exit(1)
  }
  
  const validator = new AIGuardianValidator()
  const result = await validator.validate(taskDescription)
  
  if (!result.success) {
    process.exit(1)
  }
}

// 运行主函数
if (import.meta.main) {
  main().catch(console.error)
}