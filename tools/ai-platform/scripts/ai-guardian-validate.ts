#!/usr/bin/env bun
/**
 * LinchKit AI Guardian 混合智能验证脚本
 * 结合AI分析与规则引擎的智能代码质量检查系统
 * 
 * 用法: bun run ai:guardian:validate "任务描述"
 * 
 * @version 2.0.0 - 混合AI集成版本
 * @author Claude Code
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createLogger } from '@linch-kit/core'
import { createHybridAIManager } from '../src/provider/hybrid-ai-manager'

const logger = createLogger('ai-guardian-validator')

/**
 * 打印清晰的验证启动标题
 */
function printValidationHeader(taskDescription) {
  console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐')
  console.log('│                    🛡️  AI Guardian 智能验证系统                           │')
  console.log('├─────────────────────────────────────────────────────────────────────────────┤')
  console.log(`│ 任务: ${taskDescription.substring(0, 60)}${taskDescription.length > 60 ? '...' : ''}`)
  console.log('│ 版本: v2.0.0 - 混合AI集成版本')
  console.log('└─────────────────────────────────────────────────────────────────────────────┘\n')
}

/**
 * AI Guardian 验证结果
 * @typedef {Object} AIGuardianValidationResult
 * @property {boolean} success
 * @property {string[]} violations 
 * @property {string[]} warnings
 * @property {string} taskDescription
 * @property {string} timestamp
 * @property {string} analysisSource - 'ai' | 'rules' | 'hybrid'
 */

/**
 * AI Guardian 混合智能验证器
 * 结合AI分析与现有规则引擎的智能验证系统
 */
class AIGuardianValidator {
  constructor() {
    this.violations = []
    this.warnings = []
    this.aiManager = createHybridAIManager()
    this.analysisSource = 'rules' // 默认使用规则引擎
  }

  /**
   * 主验证流程 - 集成ai-platform Guardian系统
   * @param {string} taskDescription 
   * @returns {Promise<GuardianValidationResult>}
   */
  async validate(taskDescription) {
    printValidationHeader(taskDescription)
    
    // 0. AI 增强分析 (如果有可用的AI)
    await this.performAIAnalysis(taskDescription)
    
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
    
    // 6. 配置重复检查 (新增)
    await this.checkConfigurationDuplication()
    
    // 7. 生成约束文件
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

  /**
   * 配置重复检查 - 检测CSS、Tailwind等配置重复
   */
  async checkConfigurationDuplication() {
    try {
      console.log('🔍 检查配置重复...')
      
      // 检查CSS变量重复 - 严格排除node_modules和构建目录
      const cssFiles = this.findFiles(['**/*.css'], [
        'node_modules/**',
        '**/node_modules/**', 
        '**/dist/**', 
        '**/build/**', 
        '**/.next/**',
        '**/coverage/**',
        '**/.turbo/**',
        '**/out/**',
        '**/.cache/**'
      ])
      const cssVariableDuplication = this.checkCSSVariableDuplication(cssFiles)
      
      // 检查Tailwind配置重复
      const tailwindConfigs = this.findFiles(['**/tailwind.config.*'], [
        'node_modules/**',
        '**/node_modules/**'
      ])
      const tailwindDuplication = this.checkTailwindConfigDuplication(tailwindConfigs)
      
      // 检查ESLint配置不一致
      const eslintConfigs = this.findFiles(['**/.eslintrc*', '**/eslint.config.*'], [
        'node_modules/**',
        '**/node_modules/**',
        '**/dist/**', 
        '**/build/**'
      ])
      const eslintInconsistency = this.checkESLintConsistency(eslintConfigs)
      
      // 过滤真正的项目配置重复（排除node_modules误报）
      const projectCSSVarDuplication = cssVariableDuplication.filter(dup => 
        !dup.includes('node_modules') && 
        !dup.includes('playwright-core') &&
        !dup.includes('@auth/core') &&
        !dup.includes('tailwindcss/index.css')
      )
      
      if (projectCSSVarDuplication.length > 0) {
        this.violations.push(`🚨 项目CSS变量重复: ${projectCSSVarDuplication.join(', ')}`)
      }
      
      if (tailwindDuplication.length > 0) {
        this.warnings.push(`⚠️ Tailwind配置重复: ${tailwindDuplication.join(', ')}`)
      }
      
      if (eslintInconsistency.length > 0) {
        this.warnings.push(`⚠️ ESLint配置不一致: ${eslintInconsistency.join(', ')}`)
      }
      
    } catch (error) {
      this.warnings.push('⚠️ 配置重复检查失败')
      console.error('配置重复检查错误:', error)
    }
  }

  findFiles(patterns, ignore = []) {
    const { globSync } = require('glob')
    let files = []
    
    for (const pattern of patterns) {
      try {
        const matched = globSync(pattern, { ignore })
        files = files.concat(matched)
      } catch (error) {
        // 忽略glob错误
      }
    }
    
    return files
  }

  checkCSSVariableDuplication(cssFiles) {
    const fs = require('fs')
    const duplications = []
    const variableMap = new Map()
    
    for (const file of cssFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const variables = content.match(/--[\w-]+:\s*[^;]+;/g) || []
        
        for (const variable of variables) {
          const varName = variable.match(/--[\w-]+/)?.[0]
          if (varName) {
            if (variableMap.has(varName)) {
              if (!duplications.includes(varName)) {
                duplications.push(`${varName} (${variableMap.get(varName)} & ${file})`)
              }
            } else {
              variableMap.set(varName, file)
            }
          }
        }
      } catch (error) {
        // 忽略文件读取错误
      }
    }
    
    return duplications
  }

  checkTailwindConfigDuplication(configFiles) {
    const duplications = []
    
    if (configFiles.length > 1) {
      // 检查是否有多个未通过继承的配置文件
      const fs = require('fs')
      let standaloneConfigs = 0
      
      for (const file of configFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8')
          // 检查是否包含完整主题配置而不是继承
          if (content.includes('theme:') && content.includes('extend:') && !content.includes('...base')) {
            standaloneConfigs++
          }
        } catch (error) {
          // 忽略文件读取错误
        }
      }
      
      if (standaloneConfigs > 1) {
        duplications.push(`发现${standaloneConfigs}个独立Tailwind配置，建议使用继承`)
      }
    }
    
    return duplications
  }

  checkESLintConsistency(eslintConfigs) {
    const inconsistencies = []
    
    if (eslintConfigs.length > 1) {
      const fs = require('fs')
      const configTypes = new Set()
      
      for (const file of eslintConfigs) {
        try {
          const content = fs.readFileSync(file, 'utf8')
          if (file.includes('.eslintrc')) {
            configTypes.add('legacy')
          } else if (file.includes('eslint.config')) {
            configTypes.add('flat')
          }
        } catch (error) {
          // 忽略文件读取错误
        }
      }
      
      if (configTypes.size > 1) {
        inconsistencies.push('混合使用legacy和flat配置格式')
      }
    }
    
    return inconsistencies
  }
  
  generateConstraintsFile(taskDescription) {
    const constraintsDir = '.claude'
    const constraintsFile = join(constraintsDir, 'session-constraints.md')
    
    if (!existsSync(constraintsDir)) {
      mkdirSync(constraintsDir, { recursive: true })
    }
    
    const sessionId = Date.now()
    const timestamp = new Date().toISOString()
    
    const constraintsContent = `# 质量门禁约束检查结果 (${timestamp})

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
      console.log(`✅ AI Guardian已激活 (分析来源: ${this.analysisSource})`)
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
  
  /**
   * AI 智能分析 - 使用混合AI管理器进行任务分析
   * @param {string} taskDescription 
   */
  async performAIAnalysis(taskDescription) {
    try {
      console.log('🤖 启动AI智能分析...')
      
      const analysisPrompt = `
任务分析：${taskDescription}

请分析这个开发任务的以下方面：
1. 潜在的代码质量风险
2. 架构设计考虑点
3. 安全性关注点
4. 测试策略建议
5. 违规风险评估

请提供简洁的分析结果，每个方面用一行总结。`

      const aiResult = await this.aiManager.analyze({
        prompt: analysisPrompt,
        requiresAI: false, // 允许降级到规则引擎
        ruleBasedFallback: () => this.generateRuleBasedAnalysis(taskDescription)
      })
      
      if (aiResult.success) {
        console.log(`🧠 AI分析完成 (来源: ${aiResult.source})`)
        this.analysisSource = aiResult.source
        
        // 根据AI分析结果添加建议
        if (aiResult.source === 'ai' && aiResult.content.includes('风险')) {
          this.warnings.push('⚠️ AI分析发现潜在风险，请仔细审查')
        }
      } else {
        console.log('🤖 AI分析降级为规则引擎')
        this.analysisSource = 'rules'
      }
    } catch (error) {
      console.log('🤖 AI分析失败，使用规则引擎')
      this.analysisSource = 'rules'
    }
  }
  
  /**
   * 规则基础分析 (AI降级时使用)
   * @param {string} taskDescription 
   */
  generateRuleBasedAnalysis(taskDescription) {
    const analysis = []
    
    // 基于关键词的简单分析
    if (taskDescription.includes('数据库') || taskDescription.includes('SQL')) {
      analysis.push('数据安全: 注意SQL注入防护')
    }
    
    if (taskDescription.includes('API') || taskDescription.includes('接口')) {
      analysis.push('API安全: 验证输入参数和权限检查')
    }
    
    if (taskDescription.includes('前端') || taskDescription.includes('UI')) {
      analysis.push('前端安全: 防范XSS攻击')
    }
    
    if (taskDescription.includes('删除') || taskDescription.includes('清理')) {
      analysis.push('操作风险: 确保备份和权限验证')
    }
    
    return analysis.length > 0 
      ? `规则分析结果:\n${analysis.join('\n')}`
      : '规则分析: 标准开发任务，遵循现有约束即可'
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