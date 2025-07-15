#!/usr/bin/env bun
/**
 * LinchKit AI Pre-Check 脚本
 * 基于ai-platform Guardian能力的代码生成前置检查
 * 
 * 用法: bun run ai:pre-check "功能描述"
 * 
 * @version 1.0.0
 * @author Claude Code
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('ai-pre-check')

class AIPreCheck {
  private violations: string[] = []
  private warnings: string[] = []
  private suggestions: string[] = []

  async check(featureDescription: string): Promise<boolean> {
    logger.info('🔍 AI代码生成前置检查启动...')
    logger.info(`📋 功能描述: ${featureDescription}`)
    
    // 1. 环境基础检查
    this.checkEnvironment()
    
    // 2. 分支状态检查
    this.checkBranch()
    
    // 3. 依赖状态检查
    this.checkDependencies()
    
    // 4. Graph RAG上下文检查
    await this.checkContext(featureDescription)
    
    // 5. 包复用检查
    await this.checkPackageReuse(featureDescription)
    
    // 6. 架构预检查
    await this.checkArchitecture()
    
    this.printResults()
    return this.violations.length === 0
  }

  private checkEnvironment(): void {
    logger.info('🌍 环境检查...')
    
    // 检查bun
    try {
      execSync('bun --version', { stdio: 'pipe' })
    } catch {
      this.violations.push('Bun未安装或无法访问')
    }
    
    // 检查配置文件
    if (!existsSync('./tsconfig.json')) {
      this.violations.push('tsconfig.json不存在')
    }
    
    if (!existsSync('./package.json')) {
      this.violations.push('package.json不存在')
    }
  }

  private checkBranch(): void {
    logger.info('🔀 分支状态检查...')
    
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      
      const protectedBranches = ['main', 'master', 'develop']
      if (protectedBranches.some(branch => currentBranch.startsWith(branch))) {
        this.violations.push(`禁止在保护分支工作: ${currentBranch}`)
        this.suggestions.push('创建功能分支: git checkout -b feature/[feature-name]')
      } else {
        logger.info(`✅ 当前分支: ${currentBranch}`)
      }
      
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
      if (gitStatus.trim()) {
        this.warnings.push('工作目录有未提交的更改')
      }
    } catch {
      this.violations.push('Git仓库检查失败')
    }
  }

  private checkDependencies(): void {
    logger.info('📦 依赖状态检查...')
    
    if (!existsSync('./node_modules')) {
      this.violations.push('依赖未安装，运行: bun install')
      return
    }
    
    if (!existsSync('./bun.lock')) {
      this.warnings.push('bun.lock不存在，依赖可能不稳定')
    }
    
    logger.info('✅ 依赖状态正常')
  }

  private async checkContext(featureDescription: string): Promise<void> {
    logger.info('🧠 Graph RAG上下文检查...')
    
    try {
      const keywords = this.extractKeywords(featureDescription)
      const result = execSync(`bun tools/ai-platform/scripts/session-tools.js query "${keywords[0]}" --debug`, { 
        encoding: 'utf8' 
      })
      
      if (result.includes('"total_found": 0')) {
        this.warnings.push('Graph RAG未找到相关上下文，可能需要手动查询项目结构')
      } else {
        logger.info('✅ Graph RAG上下文检查完成')
        this.suggestions.push('已获取项目上下文，基于现有架构进行开发')
      }
    } catch {
      this.warnings.push('Graph RAG查询失败，需要手动确认项目上下文')
    }
  }

  private async checkPackageReuse(featureDescription: string): Promise<void> {
    logger.info('🔄 包复用检查...')
    
    try {
      const keywords = this.extractKeywords(featureDescription)
      const result = execSync(`bun run deps:check "${keywords.join(' ')}"`, { 
        encoding: 'utf8' 
      })
      
      if (result.includes('发现现有包实现')) {
        this.suggestions.push('发现可复用的现有实现，优先考虑扩展而非重新实现')
      }
      
      logger.info('✅ 包复用检查完成')
    } catch {
      this.warnings.push('包复用检查失败，手动确认避免重复实现')
    }
  }

  private async checkArchitecture(): Promise<void> {
    logger.info('🏗️ 架构预检查...')
    
    try {
      execSync('bun tools/ai-platform/scripts/arch-check.js', {
        stdio: 'pipe'
      })
      logger.info('✅ 架构检查通过')
    } catch {
      this.warnings.push('架构检查发现问题，建议查看详细报告')
    }
  }

  private extractKeywords(description: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    return description
      .toLowerCase()
      .split(/[\s\-_.,;:!?()[\]{}]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 3)
  }

  private printResults(): void {
    logger.info('\n📊 前置检查结果:')
    
    if (this.violations.length > 0) {
      logger.info('\n❌ 违规项 (必须修复):')
      this.violations.forEach(violation => logger.info(`  • ${violation}`))
    }
    
    if (this.warnings.length > 0) {
      logger.info('\n⚠️ 警告项:')
      this.warnings.forEach(warning => logger.info(`  • ${warning}`))
    }
    
    if (this.suggestions.length > 0) {
      logger.info('\n💡 建议:')
      this.suggestions.forEach(suggestion => logger.info(`  • ${suggestion}`))
    }
    
    if (this.violations.length === 0) {
      logger.info('\n✅ 前置检查通过，可以开始AI代码生成!')
    } else {
      logger.info('\n🚨 前置检查失败，请先修复违规项!')
    }
  }
}

// 主函数
async function main() {
  const featureDescription = process.argv[2]
  
  if (!featureDescription) {
    logger.error('❌ 错误: 请提供功能描述')
    logger.error('使用方法: bun run ai:pre-check "功能描述"')
    process.exit(1)
  }
  
  const checker = new AIPreCheck()
  const success = await checker.check(featureDescription)
  
  if (!success) {
    process.exit(1)
  }
}

if (import.meta.main) {
  main().catch(console.error)
}