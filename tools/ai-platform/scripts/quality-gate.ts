#!/usr/bin/env bun
/**
 * LinchKit AI Quality Gate 脚本
 * 基于ai-platform Guardian能力的代码质量门禁检查
 * 
 * 用法: bun run ai:quality-gate
 * 
 * @version 1.0.0
 * @author Claude Code
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync } from 'fs'
import { glob } from 'glob'
import { createLogger } from '@linch-kit/core'

const execAsync = promisify(exec)

const logger = createLogger('ai-quality-gate')

interface QualityMetrics {
  typeScriptErrors: number
  eslintViolations: number
  buildSuccess: boolean
  testsPassing: boolean
  codeQualityScore: number
}

class AIQualityGate {
  private violations: string[] = []
  private warnings: string[] = []
  private metrics: QualityMetrics = {
    typeScriptErrors: 0,
    eslintViolations: 0,
    buildSuccess: false,
    testsPassing: false,
    codeQualityScore: 0
  }

  async validate(): Promise<boolean> {
    logger.info('🚨 AI代码质量门禁检查启动...')
    
    // 1. TypeScript严格类型检查
    await this.checkTypeScript()
    
    // 2. ESLint代码规范检查
    await this.checkESLint()
    
    // 3. 构建测试
    await this.checkBuild()
    
    // 4. 测试执行
    await this.checkTests()
    
    // 5. AI生成代码特定检查
    await this.checkAIGeneratedCode()
    
    // 6. 架构合规性检查
    await this.checkArchitecture()
    
    // 7. 安全检查
    await this.checkSecurity()
    
    // 计算质量分数
    this.calculateQualityScore()
    
    this.printResults()
    return this.violations.length === 0
  }

  private async checkTypeScript(): Promise<void> {
    logger.info('🔍 TypeScript严格检查...')
    
    try {
      await execAsync('bunx tsc --noEmit --strict')
      logger.info('✅ TypeScript检查通过')
      this.metrics.typeScriptErrors = 0
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || ''
      const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'))
      this.metrics.typeScriptErrors = errorLines.length
      
      if (this.metrics.typeScriptErrors > 0) {
        this.violations.push(`TypeScript编译错误: ${this.metrics.typeScriptErrors}个`)
        logger.error(`TypeScript错误详情: ${error.message}`)
        
        if (errorOutput.includes('any')) {
          this.violations.push('检测到any类型使用，违反严格模式要求')
        }
        if (errorOutput.includes('@ts-ignore')) {
          this.violations.push('检测到@ts-ignore使用，禁止忽略类型错误')
        }
      }
    }
  }

  private async checkESLint(): Promise<void> {
    logger.info('📏 ESLint规范检查...')
    
    try {
      await execAsync('bunx eslint . --max-warnings=0')
      
      logger.info('✅ ESLint检查通过')
      this.metrics.eslintViolations = 0
    } catch (error: any) {
      // 简单统计错误数量
      const errorOutput = error.stdout || error.stderr || ''
      const errorCount = (errorOutput.match(/error/gi) || []).length
      this.metrics.eslintViolations = errorCount
      
      if (errorCount > 0) {
        this.violations.push(`ESLint违规: ${errorCount}个`)
        logger.error(`ESLint错误详情: ${error.message}`)
        
        if (errorOutput.includes('console.log')) {
          this.violations.push('检测到console.log使用，必须使用LinchKit logger')
        }
      }
    }
  }

  private async checkBuild(): Promise<void> {
    logger.info('🔨 构建检查...')
    
    try {
      await execAsync('bun run build', { timeout: 120000 })
      logger.info('✅ 构建成功')
      this.metrics.buildSuccess = true
    } catch (error: any) {
      this.violations.push('构建失败，代码无法编译')
      this.metrics.buildSuccess = false
      logger.error(`构建失败详情: ${error.message}`)
    }
  }

  private async checkTests(): Promise<void> {
    logger.info('🧪 测试检查...')
    
    try {
      await execAsync('bun test', { timeout: 180000 })
      
      this.metrics.testsPassing = true
      logger.info('✅ 测试执行成功')
    } catch (error: any) {
      this.violations.push('测试执行失败')
      this.metrics.testsPassing = false
      logger.error(`测试失败详情: ${error.message}`)
    }
  }

  private async checkAIGeneratedCode(): Promise<void> {
    logger.info('🤖 AI生成代码检查...')
    
    try {
      const tsFiles = await glob('**/*.ts', { ignore: ['node_modules/**', 'dist/**'] })
      let anyTypeCount = 0
      let consoleLogCount = 0
      
      for (const file of tsFiles) {
        try {
          const content = readFileSync(file, 'utf8')
          
          const anyMatches = content.match(/:\s*any\b/g)
          if (anyMatches) {
            anyTypeCount += anyMatches.length
          }
          
          const consoleMatches = content.match(/console\.log/g)
          if (consoleMatches) {
            consoleLogCount += consoleMatches.length
          }
          
          if (content.includes('TODO: AI generated') || content.includes('// AI generated')) {
            this.warnings.push(`${file}: 包含未完成的AI生成代码标记`)
          }
        } catch {
          // 忽略无法读取的文件
        }
      }
      
      if (anyTypeCount > 0) {
        this.violations.push(`发现 ${anyTypeCount} 个any类型使用`)
      }
      
      if (consoleLogCount > 0) {
        this.violations.push(`发现 ${consoleLogCount} 个console.log使用`)
      }
      
      logger.info('✅ AI生成代码检查完成')
    } catch (error) {
      this.warnings.push('AI生成代码检查失败')
    }
  }

  private async checkArchitecture(): Promise<void> {
    logger.info('🏗️ 架构合规性检查...')
    
    try {
      await execAsync('bun tools/ai-platform/scripts/arch-check.js')
      logger.info('✅ 架构检查通过')
    } catch (error: any) {
      this.warnings.push('架构检查发现问题，建议查看详细报告')
      logger.error(`架构检查错误: ${error.message}`)
    }
  }

  private async checkSecurity(): Promise<void> {
    logger.info('🛡️ 安全检查...')
    
    try {
      await execAsync('bun tools/ai-platform/scripts/security-sentinel.js')
      logger.info('✅ 安全检查通过')
    } catch (error: any) {
      this.warnings.push('安全检查发现问题')
      logger.error(`安全检查错误: ${error.message}`)
    }
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
    
    this.metrics.codeQualityScore = Math.max(0, score)
  }

  private printResults(): void {
    logger.info('\n📊 质量门禁结果:')
    
    // 显示质量指标
    logger.info('\n📈 质量指标:')
    logger.info(`  • 质量分数: ${this.metrics.codeQualityScore}/100`)
    logger.info(`  • TypeScript错误: ${this.metrics.typeScriptErrors}`)
    logger.info(`  • ESLint违规: ${this.metrics.eslintViolations}`)
    logger.info(`  • 测试状态: ${this.metrics.testsPassing ? '✅ 通过' : '❌ 失败'}`)
    logger.info(`  • 构建状态: ${this.metrics.buildSuccess ? '✅ 成功' : '❌ 失败'}`)
    
    if (this.violations.length > 0) {
      logger.info('\n🚨 严重违规 (必须修复):')
      this.violations.forEach(violation => logger.info(`  • ${violation}`))
    }
    
    if (this.warnings.length > 0) {
      logger.info('\n⚠️ 警告项:')
      this.warnings.forEach(warning => logger.info(`  • ${warning}`))
    }
    
    if (this.violations.length === 0) {
      logger.info(`\n✅ Quality Gate Guardian 通过! 代码质量: ${this.metrics.codeQualityScore}/100`)
    } else {
      logger.info('\n🚨 Quality Gate Guardian 失败! 请修复严重违规项')
    }
  }
}

// 主函数
async function main() {
  const gate = new AIQualityGate()
  const success = await gate.validate()
  
  if (!success) {
    process.exit(1)
  }
}

if (import.meta.main) {
  main().catch(console.error)
}