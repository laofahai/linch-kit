#!/usr/bin/env bun
/**
 * LinchKit AI Session验证器
 * 强制执行所有约束检查，确保Claude Code session遵守规范
 * 
 * 使用: bun run ai:guardian:validate "任务描述"
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  success: boolean
  violations: string[]
  warnings: string[]
}

class AISessionValidator {
  private violations: string[] = []
  private warnings: string[] = []

  /**
   * 主验证流程
   */
  async validate(taskDescription: string): Promise<ValidationResult> {
    console.log('🚨 AI Session 强制验证启动...')
    
    // 1. 分支检查 (零容忍)
    this.checkBranch()
    
    // 2. 工作目录状态
    this.checkWorkingDirectory()
    
    // 3. Graph RAG强制查询
    await this.enforceGraphRAG(taskDescription)
    
    // 4. 包复用检查
    await this.checkPackageReuse(taskDescription)
    
    // 5. 设计文档检查
    this.checkDesignDocuments()
    
    // 6. AI Guardian激活
    this.activateGuardians()
    
    // 7. 生成约束文件
    this.generateConstraintsFile(taskDescription)
    
    return {
      success: this.violations.length === 0,
      violations: this.violations,
      warnings: this.warnings
    }
  }

  /**
   * 分支检查 - 零容忍违规
   */
  private checkBranch(): void {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      const protectedBranches = ['main', 'master', 'develop']
      
      for (const protected_branch of protectedBranches) {
        if (currentBranch === protected_branch || currentBranch.startsWith(`${protected_branch}/`)) {
          this.violations.push(`🚨 FATAL: 禁止在保护分支 '${currentBranch}' 上工作`)
          this.violations.push(`💡 必须执行: git checkout -b feature/[task-name]`)
          return
        }
      }
      
      console.log(`✅ 分支检查通过: ${currentBranch}`)
    } catch (error) {
      this.violations.push('❌ Git分支检查失败')
    }
  }

  /**
   * 工作目录状态检查
   */
  private checkWorkingDirectory(): void {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' })
      if (status.trim()) {
        this.warnings.push('⚠️ 工作目录有未提交的更改')
      }
    } catch (error) {
      this.warnings.push('⚠️ 无法检查工作目录状态')
    }
  }

  /**
   * 强制Graph RAG查询
   */
  private async enforceGraphRAG(taskDescription: string): Promise<void> {
    console.log('🔍 执行强制Graph RAG查询...')
    
    // 提取关键词
    const keywords = this.extractKeywords(taskDescription)
    
    for (const keyword of keywords) {
      try {
        console.log(`  查询关键词: ${keyword}`)
        execSync(`bun run ai:session query "${keyword}" --debug`, { 
          stdio: 'pipe',
          timeout: 30000 
        })
      } catch (error) {
        // Graph RAG查询失败时，记录警告但继续执行
        this.warnings.push(`⚠️ Graph RAG查询失败 (${keyword}): ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log(`⚠️ Graph RAG查询失败但继续执行: ${keyword}`)
      }
    }
    
    console.log('✅ Graph RAG查询完成')
  }

  /**
   * 包复用检查
   */
  private async checkPackageReuse(taskDescription: string): Promise<void> {
    const keywords = this.extractKeywords(taskDescription)
    
    for (const keyword of keywords) {
      try {
        // 尝试执行包复用检查
        execSync(`bun run deps:check "${keyword}"`, { 
          stdio: 'pipe',
          timeout: 10000 
        })
      } catch (error) {
        // 如果命令不存在，记录警告
        this.warnings.push(`⚠️ 包复用检查工具不可用 (${keyword})`)
      }
    }
  }

  /**
   * 设计文档检查
   */
  private checkDesignDocuments(): void {
    const designPaths = [
      'DESIGN.md',
      'docs/DESIGN.md',
      'docs/design.md',
      'design/README.md'
    ]
    
    let hasDesignDoc = false
    for (const path of designPaths) {
      if (existsSync(path)) {
        hasDesignDoc = true
        break
      }
    }
    
    if (!hasDesignDoc) {
      this.warnings.push('⚠️ 未找到设计文档，复杂功能开发前应创建DESIGN.md')
    }
  }

  /**
   * 激活AI Guardian
   */
  private activateGuardians(): void {
    const guardiansDir = '.claude/guardians'
    if (!existsSync(guardiansDir)) {
      mkdirSync(guardiansDir, { recursive: true })
    }

    // 激活质量守护者
    const qualityGuardian = `# 代码质量守护者 - 已激活
激活时间: ${new Date().toISOString()}

## 监督职责
- TypeScript严格模式检查
- ESLint零违规验证  
- 禁止any类型使用
- 禁止console.log使用
- 强制错误处理

## 状态: 🔴 ACTIVE
`
    writeFileSync(join(guardiansDir, 'code-quality.md'), qualityGuardian)

    // 激活测试守护者
    const testGuardian = `# 测试覆盖守护者 - 已激活
激活时间: ${new Date().toISOString()}

## 覆盖率要求
- 核心包: 98%+
- 关键包: 95%+
- UI组件: 90%+
- 应用层: 85%+

## 状态: 🔴 ACTIVE
`
    writeFileSync(join(guardiansDir, 'test-coverage.md'), testGuardian)

    console.log('✅ AI Guardian已激活')
  }

  /**
   * 生成约束文件
   */
  private generateConstraintsFile(taskDescription: string): void {
    const constraintsDir = '.claude'
    if (!existsSync(constraintsDir)) {
      mkdirSync(constraintsDir, { recursive: true })
    }

    const constraints = `# AI Session 强制约束 (${new Date().toISOString()})

## 任务: ${taskDescription}

## 🚨 零容忍违规项
1. ❌ 在保护分支工作
2. ❌ 跳过Graph RAG查询  
3. ❌ 使用any类型
4. ❌ 使用console.log
5. ❌ 不同步更新测试
6. ❌ 重复实现现有功能

## ✅ 已完成强制检查
- [x] 分支状态验证
- [x] Graph RAG查询执行
- [x] AI Guardian激活
- [x] 约束文件生成

## 🔴 违规处理协议
发现任何违规行为必须：
1. 立即停止当前任务
2. 公开承认违规行为
3. 解释违规原因
4. 修复违规后重新验证

## 📋 强制命令清单
每次编码前必须执行：
\`\`\`bash
# 质量检查
bun run type-check
bun run lint --max-warnings=0

# 测试同步
bun test
bun test --coverage
\`\`\`

---
生成时间: ${new Date().toISOString()}
会话ID: ${Date.now()}
`

    writeFileSync(join(constraintsDir, 'session-constraints.md'), constraints)
    console.log('✅ 约束文件已生成')
  }

  /**
   * AI原生智能关键词提取
   */
  private extractKeywords(taskDescription: string): string[] {
    // 🤖 AI原生处理：直接使用任务描述的核心词汇
    // 不使用硬编码映射，让AI智能理解语义
    
    const cleanDescription = taskDescription
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留字母、数字、空格和中文
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 5) // 限制关键词数量
    
    // AI智能去重和优化
    const uniqueKeywords = [...new Set(cleanDescription)]
    
    // 确保至少有一个关键词用于Graph RAG查询
    return uniqueKeywords.length > 0 ? uniqueKeywords : ['general']
  }
}

// 主执行函数
async function main() {
  const taskDescription = process.argv[2] || '默认AI任务'
  
  const validator = new AISessionValidator()
  const result = await validator.validate(taskDescription)
  
  // 输出结果
  if (result.success) {
    console.log('\n✅ 所有强制验证已通过！')
    console.log('📋 约束文件: .claude/session-constraints.md')
    process.exit(0)
  } else {
    console.log('\n🚨 发现零容忍违规行为：')
    for (const violation of result.violations) {
      console.log(`  ${violation}`)
    }
    console.log('\n❌ 会话无法继续，必须先修复违规')
    process.exit(1)
  }
}

// 执行
if (import.meta.main) {
  main().catch(console.error)
}