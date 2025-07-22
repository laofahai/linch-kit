/**
 * LinchKit Quality Gate Guardian
 * AI代码质量门禁智能体
 * 
 * 职责: 验证Claude Code生成的代码质量和合规性
 * 集成: ai-platform Guardian智能体集群
 * 
 * @version 1.0.0
 * @author LinchKit AI Guardian System
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync } from 'fs'
import { createLogger } from '@linch-kit/core'
import { glob } from 'glob'

const execAsync = promisify(exec)
const logger = createLogger({ name: 'quality-gate-guardian' })

import type { GuardianAgent } from './index'

export interface QualityMetrics {
  typeScriptErrors: number
  eslintViolations: number
  testCoverage: number
  testsPassing: boolean
  buildSuccess: boolean
  codeQualityScore: number
}

export interface QualityViolation {
  type: 'critical' | 'warning' | 'suggestion'
  category: 'typescript' | 'eslint' | 'testing' | 'build' | 'ai-specific'
  message: string
  file?: string
  suggestion?: string
}

export interface QualityGateResult {
  success: boolean
  violations: QualityViolation[]
  metrics: QualityMetrics
  aiGeneratedFiles: string[]
}

/**
 * Quality Gate Guardian智能体实现
 */
export class QualityGateGuardian implements GuardianAgent {
  name = 'Quality Gate Guardian'
  version = '1.0.0'
  phase = 1
  status = 'active' as const
  capabilities = [
    'TypeScript严格类型检查',
    'ESLint规范验证',
    '构建成功性检查',
    '测试覆盖率验证',
    'AI生成代码质量检查'
  ]

  private violations: QualityViolation[] = []
  private metrics: QualityMetrics = {
    typeScriptErrors: 0,
    eslintViolations: 0,
    testCoverage: 0,
    testsPassing: false,
    buildSuccess: false,
    codeQualityScore: 0
  }

  /**
   * 主要质量门禁检查流程
   */
  async validate(): Promise<QualityGateResult> {
    logger.info('🚨 Quality Gate Guardian 启动...')
    
    this.violations = []
    this.resetMetrics()
    
    // 执行质量检查
    await this.checkTypeScript()
    await this.checkESLint()
    await this.checkBuild()
    await this.checkTests()
    await this.checkAIGeneratedCode()
    
    // 计算质量分数
    this.calculateQualityScore()
    
    const result: QualityGateResult = {
      success: this.violations.filter(v => v.type === 'critical').length === 0,
      violations: this.violations,
      metrics: this.metrics,
      aiGeneratedFiles: await this.findAIGeneratedFiles()
    }
    
    this.printResults(result)
    return result
  }
  
  private resetMetrics(): void {
    this.metrics = {
      typeScriptErrors: 0,
      eslintViolations: 0,
      testCoverage: 0,
      testsPassing: false,
      buildSuccess: false,
      codeQualityScore: 0
    }
  }
  
  private async checkTypeScript(): Promise<void> {
    logger.info('🔍 TypeScript严格检查...')
    
    try {
      await execAsync('bunx tsc --noEmit --strict')
      logger.info('✅ TypeScript检查通过')
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || ''
      const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'))
      this.metrics.typeScriptErrors = errorLines.length
      
      if (this.metrics.typeScriptErrors > 0) {
        this.addCritical('typescript', `TypeScript编译错误: ${this.metrics.typeScriptErrors}个`)
        
        // 检查AI生成代码常见问题
        if (errorOutput.includes('any')) {
          this.addCritical('typescript', '检测到any类型使用，违反严格模式')
        }
        if (errorOutput.includes('@ts-ignore')) {
          this.addCritical('typescript', '检测到@ts-ignore使用，禁止忽略类型错误')
        }
      }
    }
  }
  
  private async checkESLint(): Promise<void> {
    logger.info('📏 ESLint规范检查...')
    
    try {
      const { stdout } = await execAsync('bunx eslint . --format=json --max-warnings=0')
      const output = stdout
      
      const results = JSON.parse(output)
      let totalViolations = 0
      
      for (const file of results) {
        totalViolations += file.errorCount + file.warningCount
      }
      
      this.metrics.eslintViolations = totalViolations
      
      if (totalViolations === 0) {
        logger.info('✅ ESLint检查通过')
      } else {
        this.addWarning('eslint', `ESLint违规: ${totalViolations}个`)
        
        // 检查特定违规类型
        const outputText = JSON.stringify(results)
        if (outputText.includes('console.log')) {
          this.addCritical('eslint', '检测到console.log使用，必须使用LinchKit logger')
        }
      }
    } catch {
      this.addWarning('eslint', 'ESLint检查执行失败')
    }
  }
  
  private async checkBuild(): Promise<void> {
    logger.info('🔨 构建检查...')
    
    try {
      await execAsync('bun run build', { timeout: 120000 })
      logger.info('✅ 构建成功')
      this.metrics.buildSuccess = true
    } catch (error) {
      console.error('Build failed:', error instanceof Error ? error : new Error(String(error)))
      this.addCritical('build', '构建失败，代码无法编译')
      this.metrics.buildSuccess = false
    }
  }
  
  private async checkTests(): Promise<void> {
    logger.info('🧪 测试检查...')
    
    try {
      // 运行测试
      await execAsync('bun test', { timeout: 180000 })
      
      this.metrics.testsPassing = true
      logger.info('✅ 测试通过')
      
      // 检查覆盖率
      try {
        const { stdout: coverageOutput } = await execAsync('bun test --coverage')
        
        const coverageMatch = coverageOutput.match(/All files\s*\|\s*(\d+\.?\d*)/);
        if (coverageMatch) {
          this.metrics.testCoverage = parseFloat(coverageMatch[1])
          
          if (this.metrics.testCoverage < 85) {
            this.addWarning('testing', `测试覆盖率偏低: ${this.metrics.testCoverage}%`)
          }
        }
      } catch (coverageError) {
        console.error('Coverage check failed:', coverageError instanceof Error ? coverageError : new Error(String(coverageError)))
        this.addWarning('testing', '无法获取测试覆盖率')
      }
      
    } catch (testError) {
      console.error('Tests failed:', testError instanceof Error ? testError : new Error(String(testError)))
      this.addCritical('testing', '测试执行失败')
      this.metrics.testsPassing = false
    }
  }
  
  private async checkAIGeneratedCode(): Promise<void> {
    logger.info('🤖 AI生成代码检查...')
    
    const tsFiles = await glob('**/*.ts', { ignore: ['node_modules/**', 'dist/**'] })
    let anyTypeCount = 0
    let consoleLogCount = 0
    
    for (const file of tsFiles) {
      try {
        const content = readFileSync(file, 'utf8')
        
        // 检查any类型
        const anyMatches = content.match(/:\s*any\b/g)
        if (anyMatches) {
          anyTypeCount += anyMatches.length
        }
        
        // 检查console.log
        const consoleMatches = content.match(/console\.log/g)
        if (consoleMatches) {
          consoleLogCount += consoleMatches.length
        }
        
        // 检查AI生成标记
        if (content.includes('TODO: AI generated') || content.includes('// AI generated')) {
          this.addWarning('ai-specific', `${file}: 包含未完成的AI生成标记`)
        }
        
      } catch {
        // 忽略无法读取的文件
      }
    }
    
    if (anyTypeCount > 0) {
      this.addCritical('ai-specific', `发现 ${anyTypeCount} 个any类型使用`)
    }
    
    if (consoleLogCount > 0) {
      this.addCritical('ai-specific', `发现 ${consoleLogCount} 个console.log使用`)
    }
  }
  
  private async findAIGeneratedFiles(): Promise<string[]> {
    const tsFiles = await glob('**/*.ts', { ignore: ['node_modules/**', 'dist/**'] })
    const aiFiles: string[] = []
    
    for (const file of tsFiles) {
      try {
        const content = readFileSync(file, 'utf8')
        if (content.includes('Claude Code') || content.includes('AI generated')) {
          aiFiles.push(file)
        }
      } catch {
        // 忽略
      }
    }
    
    return aiFiles
  }
  
  private calculateQualityScore(): void {
    let score = 100
    
    // TypeScript错误扣分
    score -= this.metrics.typeScriptErrors * 5
    
    // ESLint违规扣分
    score -= this.metrics.eslintViolations * 2
    
    // 构建失败扣分
    if (!this.metrics.buildSuccess) score -= 30
    
    // 测试失败扣分
    if (!this.metrics.testsPassing) score -= 20
    
    // 覆盖率扣分
    if (this.metrics.testCoverage < 85) {
      score -= (85 - this.metrics.testCoverage) * 0.5
    }
    
    this.metrics.codeQualityScore = Math.max(0, score)
  }
  
  private addCritical(category: QualityViolation['category'], message: string, file?: string, suggestion?: string): void {
    this.violations.push({ type: 'critical', category, message, file, suggestion })
  }
  
  private addWarning(category: QualityViolation['category'], message: string, file?: string, suggestion?: string): void {
    this.violations.push({ type: 'warning', category, message, file, suggestion })
  }
  
  private addSuggestion(category: QualityViolation['category'], message: string, file?: string): void {
    this.violations.push({ type: 'suggestion', category, message, file })
  }
  
  private printResults(result: QualityGateResult): void {
    logger.info('\n📊 Quality Gate Guardian 结果:')
    
    // 显示质量指标
    logger.info('\n📈 质量指标:')
    logger.info(`  • 质量分数: ${result.metrics.codeQualityScore}/100`)
    logger.info(`  • TypeScript错误: ${result.metrics.typeScriptErrors}`)
    logger.info(`  • ESLint违规: ${result.metrics.eslintViolations}`)
    logger.info(`  • 测试覆盖率: ${result.metrics.testCoverage}%`)
    logger.info(`  • 测试状态: ${result.metrics.testsPassing ? '✅ 通过' : '❌ 失败'}`)
    logger.info(`  • 构建状态: ${result.metrics.buildSuccess ? '✅ 成功' : '❌ 失败'}`)
    
    if (result.aiGeneratedFiles.length > 0) {
      logger.info(`  • AI生成文件: ${result.aiGeneratedFiles.length}个`)
    }
    
    const criticalViolations = result.violations.filter(v => v.type === 'critical')
    const warnings = result.violations.filter(v => v.type === 'warning')
    
    if (criticalViolations.length > 0) {
      logger.info('\n🚨 严重违规 (必须修复):')
      criticalViolations.forEach(v => logger.info(`  • [${v.category}] ${v.message}`))
    }
    
    if (warnings.length > 0) {
      logger.info('\n⚠️ 警告项:')
      warnings.forEach(v => logger.info(`  • [${v.category}] ${v.message}`))
    }
    
    if (result.success) {
      logger.info(`\n✅ Quality Gate Guardian 通过! 代码质量: ${result.metrics.codeQualityScore}/100`)
    } else {
      logger.info('\n🚨 Quality Gate Guardian 失败! 请修复严重违规项')
    }
  }
}

/**
 * 导出实例供脚本调用
 */
export const qualityGateGuardian = new QualityGateGuardian()