/**
 * LinchKit Pre-Check Guardian
 * AI代码生成前置检查智能体
 * 
 * 职责: 在Claude Code生成代码前执行环境和上下文验证
 * 集成: ai-platform Guardian智能体集群
 * 
 * @version 1.0.0
 * @author LinchKit AI Guardian System
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

import type { GuardianAgent } from './.*'

export interface PreCheckContext {
  featureDescription: string
  workingDirectory: string
  currentBranch: string
}

export interface PreCheckViolation {
  type: 'violation' | 'warning' | 'suggestion'
  message: string
  suggestion?: string
}

export interface PreCheckResult {
  success: boolean
  violations: PreCheckViolation[]
  context: PreCheckContext
}

/**
 * Pre-Check Guardian智能体实现
 * 集成到ai-platform的Guardian系统中
 */
export class PreCheckGuardian implements GuardianAgent {
  name = 'Pre-Check Guardian'
  version = '1.0.0'
  phase = 1
  status = 'active' as const
  capabilities = [
    '环境依赖检查',
    '分支状态验证',
    '代码质量预检',
    'Graph RAG上下文查询',
    '包复用检查'
  ]

  private violations: PreCheckViolation[] = []

  /**
   * 主要前置检查流程
   */
  async check(featureDescription: string): Promise<PreCheckResult> {
    logger.info('🔍 Pre-Check Guardian 启动...')
    logger.info(`📋 功能描述: ${featureDescription}`)
    
    this.violations = [] // 重置违规记录
    
    // 构建上下文
    const currentBranch = await this.getCurrentBranch()
    const context: PreCheckContext = {
      featureDescription,
      workingDirectory: process.cwd(),
      currentBranch
    }
    
    // 执行检查
    await this.checkEnvironment()
    await this.checkBranchStatus(context.currentBranch)
    await this.checkDependencies()
    await this.checkCodeQuality()
    await this.checkPackageReuse(featureDescription)
    await this.checkGraphRAGContext(featureDescription)
    
    const result: PreCheckResult = {
      success: this.violations.filter(v => v.type === 'violation').length === 0,
      violations: this.violations,
      context
    }
    
    this.printResults(result)
    return result
  }
  
  private async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current')
      return stdout.trim()
    } catch (error) {
      console.error('Git branch check failed:', error instanceof Error ? error : new Error(String(error)))
      return 'unknown'
    }
  }
  
  private async checkEnvironment(): Promise<void> {
    logger.info('🌍 环境检查...')
    
    // Node.js版本检查
    try {
      const { stdout } = await execAsync('node --version')
      const nodeVersion = stdout.trim()
      if (!nodeVersion.startsWith('v20')) {
        this.addWarning(`Node.js版本建议使用v20.x，当前: ${nodeVersion}`)
      }
    } catch (error) {
      console.error('Node.js version check failed:', error instanceof Error ? error : new Error(String(error)))
      this.addViolation('Node.js未安装或无法访问')
    }
    
    // Bun检查
    try {
      await execAsync('bun --version')
    } catch (error) {
      console.error('Bun version check failed:', error instanceof Error ? error : new Error(String(error)))
      this.addViolation('Bun未安装或无法访问')
    }
    
    // 配置文件检查
    if (!existsSync('./tsconfig.json')) {
      this.addViolation('tsconfig.json不存在')
    }
    
    if (!existsSync('./eslint.config.mjs')) {
      this.addWarning('ESLint配置文件不存在')
    }
  }
  
  private async checkBranchStatus(currentBranch: string): Promise<void> {
    logger.info('🔀 分支状态检查...')
    
    // 保护分支检查
    const protectedBranches = ['main', 'master', 'develop']
    if (protectedBranches.some(branch => currentBranch.startsWith(branch))) {
      this.addViolation(`禁止在保护分支工作: ${currentBranch}`)
      this.addSuggestion('创建功能分支: git checkout -b feature/[feature-name]')
    }
    
    // 工作目录状态
    try {
      const { stdout } = await execAsync('git status --porcelain')
      if (stdout.trim()) {
        this.addWarning('工作目录有未提交的更改')
      }
    } catch (error) {
      console.error('Git status check failed:', error instanceof Error ? error : new Error(String(error)))
      this.addViolation('Git仓库检查失败')
    }
  }
  
  private async checkDependencies(): Promise<void> {
    logger.info('📦 依赖状态检查...')
    
    if (!existsSync('./node_modules')) {
      this.addViolation('依赖未安装，运行: bun install')
      return
    }
    
    if (!existsSync('./bun.lock')) {
      this.addWarning('bun.lock不存在，依赖可能不稳定')
    }
  }
  
  private async checkCodeQuality(): Promise<void> {
    logger.info('🔍 代码质量预检...')
    
    try {
      await execAsync('bunx tsc --noEmit --skipLibCheck')
    } catch (error) {
      console.error('TypeScript check failed:', error instanceof Error ? error : new Error(String(error)))
      this.addViolation('TypeScript编译错误，需要先修复现有代码')
      this.addSuggestion('运行: bun run check-types 查看详细错误')
    }
  }
  
  private async checkPackageReuse(featureDescription: string): Promise<void> {
    logger.info('🔄 包复用检查...')
    
    try {
      const keywords = this.extractKeywords(featureDescription)
      const { stdout } = await execAsync(`bun run deps:check "${keywords.join(' ')}"`)
      
      if (stdout.includes('发现现有包实现')) {
        this.addSuggestion('发现可复用的现有实现，优先考虑扩展')
      }
    } catch (error) {
      console.error('Package reuse check failed:', error instanceof Error ? error : new Error(String(error)))
      this.addWarning('包复用检查失败，请手动确认避免重复实现')
    }
  }
  
  private async checkGraphRAGContext(featureDescription: string): Promise<void> {
    logger.info('🧠 Graph RAG上下文检查...')
    
    try {
      const keywords = this.extractKeywords(featureDescription)
      const { stdout } = await execAsync(`bun run ai:session query "${keywords[0]}" --debug`)
      
      if (stdout.includes('"total_found": 0')) {
        this.addWarning('Graph RAG未找到相关上下文')
      } else {
        this.addSuggestion('已获取项目上下文，基于现有架构开发')
      }
    } catch (error) {
      console.error('Graph RAG query failed:', error instanceof Error ? error : new Error(String(error)))
      this.addWarning('Graph RAG查询失败')
    }
  }
  
  private extractKeywords(description: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to']
    return description
      .toLowerCase()
      .split(/[\s\-_.,;:!?()[\]{}]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 3)
  }
  
  private addViolation(message: string, suggestion?: string): void {
    this.violations.push({ type: 'violation', message, suggestion })
  }
  
  private addWarning(message: string, suggestion?: string): void {
    this.violations.push({ type: 'warning', message, suggestion })
  }
  
  private addSuggestion(message: string): void {
    this.violations.push({ type: 'suggestion', message })
  }
  
  private printResults(result: PreCheckResult): void {
    logger.info('\n📊 Pre-Check Guardian 结果:')
    
    const violations = result.violations.filter(v => v.type === 'violation')
    const warnings = result.violations.filter(v => v.type === 'warning')
    const suggestions = result.violations.filter(v => v.type === 'suggestion')
    
    if (violations.length > 0) {
      logger.info('\n❌ 必须修复的违规项:')
      violations.forEach(v => logger.info(`  • ${v.message}`))
    }
    
    if (warnings.length > 0) {
      logger.info('\n⚠️ 警告项:')
      warnings.forEach(v => logger.info(`  • ${v.message}`))
    }
    
    if (suggestions.length > 0) {
      logger.info('\n💡 建议:')
      suggestions.forEach(v => logger.info(`  • ${v.message}`))
    }
    
    if (result.success) {
      logger.info('\n✅ Pre-Check Guardian 通过，可以开始代码生成!')
    } else {
      logger.info('\n🚨 Pre-Check Guardian 失败，请先修复违规项!')
    }
  }
}

/**
 * 导出实例供脚本调用
 */
export const preCheckGuardian = new PreCheckGuardian()