#!/usr/bin/env bun
/**
 * LinchKit Constraint Post-Check 脚本
 * Claude Code Hooks 集成 - PostToolUse 质量验证机制
 * 
 * 用法: bun run constraint:post-check --file="$TARGET_FILE" --operation="$TOOL_NAME"
 * 
 * @version 1.0.0
 * @author Claude Code
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync } from 'fs'
import { dirname, basename, extname, resolve } from 'path'
import { createLogger } from '@linch-kit/core'

const execAsync = promisify(exec)
const logger = createLogger('constraint-post-check')

interface ValidationResult {
  success: boolean
  issues: string[]
  warnings: string[]
  suggestions: string[]
}

class ConstraintPostCheck {
  private targetFile: string
  private operation: string
  private fileExists: boolean
  private results: ValidationResult

  constructor(targetFile: string, operation: string) {
    this.targetFile = resolve(targetFile)
    this.operation = operation
    this.fileExists = existsSync(this.targetFile)
    this.results = {
      success: true,
      issues: [],
      warnings: [],
      suggestions: []
    }
  }

  async execute(): Promise<boolean> {
    logger.info('🪝 PostToolUse Hook - 强制质量验证开始')
    logger.info(`📄 目标文件: ${this.targetFile}`)
    logger.info(`🔧 操作类型: ${this.operation}`)

    if (!this.fileExists && (this.operation === 'Edit' || this.operation === 'MultiEdit')) {
      this.results.issues.push('编辑操作后文件不存在')
      this.displayResults()
      return false
    }
    
    // 🚨 零容忍检查 - 先执行关键检查
    await this.enforceZeroToleranceChecks()

    // 在零容忍检查通过后，继续正常检查
    if (this.results.success) {
      // 1. TypeScript 类型检查
      await this.checkTypeScript()
      
      // 2. ESLint 代码风格检查  
      await this.checkESLint()
      
      // 3. 文件特定验证
      await this.checkFileSpecific()
      
      // 4. 测试相关检查
      await this.checkTestRequirements()
      
      // 5. 架构一致性检查
      await this.checkArchitectureConsistency()
    }

    this.displayResults()
    return this.results.success
  }

  private async checkTypeScript(): Promise<void> {
    if (!this.targetFile.match(/\.(ts|tsx)$/)) {
      return // 跳过非TypeScript文件
    }

    logger.info('🔍 TypeScript类型检查...')
    
    try {
      // 只检查目标文件的类型错误
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit --skipLibCheck ${this.targetFile}`)
      
      if (stderr && stderr.includes('error TS')) {
        this.results.success = false
        this.results.issues.push('TypeScript类型错误')
        
        // 提取具体错误信息
        const errors = stderr.split('\n').filter(line => line.includes('error TS'))
        errors.slice(0, 3).forEach(error => { // 只显示前3个错误
          this.results.issues.push(`  └─ ${error.trim()}`)
        })
        
        this.results.suggestions.push('修复TypeScript类型错误后重试')
      } else {
        logger.info('✅ TypeScript类型检查通过')
      }
    } catch (error) {
      // 如果tsc命令失败，尝试更简单的检查
      try {
        await execAsync(`bun run check-types`)
        logger.info('✅ TypeScript类型检查通过')
      } catch (globalError) {
        this.results.warnings.push('TypeScript类型检查失败，请手动验证')
      }
    }
  }

  private async checkESLint(): Promise<void> {
    if (!this.targetFile.match(/\.(ts|tsx|js|jsx)$/)) {
      return // 跳过非JS/TS文件
    }

    logger.info('🧹 ESLint代码风格检查...')
    
    try {
      await execAsync(`npx eslint "${this.targetFile}" --no-error-on-unmatched-pattern`)
      logger.info('✅ ESLint检查通过')
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message
      
      if (errorOutput.includes('✖')) {
        this.results.success = false
        this.results.issues.push('ESLint代码风格问题')
        
        // 提取具体问题
        const lines = errorOutput.split('\n')
        const errorLines = lines.filter(line => line.includes('error') || line.includes('warning')).slice(0, 3)
        errorLines.forEach(line => {
          this.results.issues.push(`  └─ ${line.trim()}`)
        })
        
        this.results.suggestions.push('运行 bun run lint:fix 修复代码风格问题')
      } else {
        this.results.warnings.push('ESLint检查失败，请手动检查代码风格')
      }
    }
  }

  private async checkFileSpecific(): Promise<void> {
    if (!this.fileExists) return

    const content = readFileSync(this.targetFile, 'utf-8')
    const filename = basename(this.targetFile)
    const directory = dirname(this.targetFile)

    // React组件检查
    if (directory.includes('components') && this.targetFile.endsWith('.tsx')) {
      this.checkReactComponent(content, filename)
    }

    // API路由检查
    if (directory.includes('api') && filename === 'route.ts') {
      this.checkAPIRoute(content)
    }

    // Hook文件检查
    if (directory.includes('hooks') && filename.startsWith('use')) {
      this.checkReactHook(content, filename)
    }

    // 测试文件检查
    if (filename.includes('.test.')) {
      this.checkTestFile(content, filename)
    }

    // 服务文件检查
    if (directory.includes('services') && filename.endsWith('.service.ts')) {
      this.checkServiceFile(content, filename)
    }
  }

  private checkReactComponent(content: string, filename: string): void {
    const componentName = filename.replace('.tsx', '')
    
    if (!content.includes(`const ${componentName}`) && !content.includes(`function ${componentName}`)) {
      this.results.warnings.push(`组件文件应该包含同名的${componentName}组件`)
    }

    if (!content.includes('React.FC') && !content.includes(': FC<')) {
      this.results.suggestions.push('建议使用React.FC类型定义组件Props')
    }

    if (!content.includes('export')) {
      this.results.issues.push('组件必须被导出')
      this.results.success = false
    }
  }

  private checkAPIRoute(content: string): void {
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    const hasHttpMethod = httpMethods.some(method => content.includes(`export async function ${method}`))
    
    if (!hasHttpMethod) {
      this.results.warnings.push('API路由文件应该导出HTTP方法函数')
    }

    if (!content.includes('Response.json') && !content.includes('NextResponse')) {
      this.results.suggestions.push('建议使用统一的响应格式')
    }
  }

  private checkReactHook(content: string, filename: string): void {
    if (!filename.startsWith('use')) {
      this.results.issues.push('自定义Hook文件名必须以use开头')
      this.results.success = false
    }

    if (!content.includes('return {') && !content.includes('return [')) {
      this.results.warnings.push('Hook应该返回对象或数组')
    }
  }

  private checkTestFile(content: string, filename: string): void {
    if (!content.includes('describe(')) {
      this.results.warnings.push('测试文件应该包含describe块')
    }

    if (!content.includes('it(') && !content.includes('test(')) {
      this.results.issues.push('测试文件必须包含测试用例')
      this.results.success = false
    }

    if (!content.includes('expect(')) {
      this.results.warnings.push('测试用例应该包含断言')
    }
  }

  private checkServiceFile(content: string, filename: string): void {
    const serviceName = filename.replace('.service.ts', 'Service')
    
    if (!content.includes(`class ${serviceName}`) && !content.includes(`export class`)) {
      this.results.warnings.push('服务文件应该导出服务类')
    }

    if (content.includes('class') && !content.includes('interface')) {
      this.results.suggestions.push('建议为服务类定义接口')
    }
  }

  private async checkTestRequirements(): Promise<void> {
    // 如果修改了组件或服务文件，检查是否有对应测试
    const isComponentOrService = this.targetFile.includes('components') || 
                                 this.targetFile.includes('services') ||
                                 this.targetFile.includes('hooks')
    
    if (isComponentOrService && !this.targetFile.includes('.test.')) {
      const testFilePath = this.targetFile.replace(/\.(ts|tsx)$/, '.test.$1')
      
      if (!existsSync(testFilePath)) {
        this.results.warnings.push('修改组件/服务文件时建议同时更新或创建测试')
        this.results.suggestions.push(`考虑创建测试文件: ${basename(testFilePath)}`)
      }
    }
  }

  private async checkArchitectureConsistency(): Promise<void> {
    logger.info('🏗️ 架构一致性检查...')
    
    try {
      await execAsync('bun run arch:check --quiet')
      logger.info('✅ 架构一致性检查通过')
    } catch (error) {
      this.results.warnings.push('架构一致性检查发现问题')
      this.results.suggestions.push('运行 bun run arch:check 查看详细架构报告')
    }
  }

  /**
   * 🚨 零容忍强制检查 - 直接修改原脚本实现真正强制执行
   */
  private async enforceZeroToleranceChecks(): Promise<void> {
    logger.info('🚨 执行零容忍强制检查...')
    
    // 1. TypeScript 编译必须成功
    await this.enforceTypeScriptCompilation()
    
    // 2. ESLint 零违规强制检查
    await this.enforceESLintZeroViolations()
    
    // 3. 禁止项检查
    await this.enforceForbiddenPatterns()
    
    // 4. 如果有致命违规，立即停止
    if (!this.results.success) {
      logger.error('❌ 零容忍检查失败，操作被强制中断！')
      this.displayResults()
      process.exit(2) // exit(2) = 阻塞错误，真正中断Claude操作
    }
  }

  private async enforceTypeScriptCompilation(): Promise<void> {
    if (!this.targetFile.match(/\.(ts|tsx)$/)) return
    
    try {
      await execAsync(`npx tsc --noEmit --strict "${this.targetFile}"`)
      logger.info('✅ TypeScript 编译强制检查通过')
    } catch (error) {
      this.results.success = false
      this.results.issues.push('🔴 零容忍违规: TypeScript 编译失败')
      const errorOutput = error.stderr || error.stdout || ''
      const errors = errorOutput.split('\n').filter(line => line.includes('error TS'))
      errors.slice(0, 2).forEach(err => {
        this.results.issues.push(`  └─ ${err.trim()}`)
      })
      logger.error('❌ TypeScript 编译强制检查失败')
    }
  }

  private async enforceESLintZeroViolations(): Promise<void> {
    if (!this.targetFile.match(/\.(ts|tsx|js|jsx)$/)) return
    
    try {
      await execAsync(`npx eslint "${this.targetFile}" --max-warnings=0`)
      logger.info('✅ ESLint 零违规强制检查通过')
    } catch (error) {
      this.results.success = false
      this.results.issues.push('🔴 零容忍违规: ESLint 违规检测')
      const errorOutput = error.stdout || error.stderr || ''
      const lines = errorOutput.split('\n').filter(line => 
        line.includes('error') || line.includes('warning')
      ).slice(0, 3)
      lines.forEach(line => {
        this.results.issues.push(`  └─ ${line.trim()}`)
      })
      logger.error('❌ ESLint 零违规强制检查失败')
    }
  }

  private async enforceForbiddenPatterns(): Promise<void> {
    if (!this.fileExists) return
    
    const content = readFileSync(this.targetFile, 'utf-8')
    
    // 禁止模式检查
    const forbiddenPatterns = [
      { pattern: /console\.log/, message: '禁止使用 console.log，必须使用 LinchKit logger' },
      { pattern: /any(?!\w)/, message: '禁止使用 any 类型，必须提供具体类型' },
      { pattern: /@ts-ignore/, message: '禁止使用 @ts-ignore，必须正确修复类型错误' },
      { pattern: /eslint-disable(?!-next-line)/, message: '禁止整体禁用 ESLint，必须修复具体问题' }
    ]
    
    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(content)) {
        this.results.success = false
        this.results.issues.push(`🔴 零容忍违规: ${message}`)
        logger.error(`❌ 检测到禁止模式: ${message}`)
      }
    }
  }

  private displayResults(): void {
    console.log('\n🎯 PostToolUse 强制质量验证结果:')
    console.log('─'.repeat(50))

    if (this.results.success) {
      console.log('✅ 强制质量验证通过')
    } else {
      console.log('❌ 强制质量验证失败 - 操作被阻止')
    }

    if (this.results.issues.length > 0) {
      console.log('\n🚨 必须修复的问题:')
      this.results.issues.forEach(issue => {
        console.log(`  • ${issue}`)
      })
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ 警告:')
      this.results.warnings.forEach(warning => {
        console.log(`  • ${warning}`)
      })
    }

    if (this.results.suggestions.length > 0) {
      console.log('\n💡 建议:')
      this.results.suggestions.forEach(suggestion => {
        console.log(`  💫 ${suggestion}`)
      })
    }

    console.log('─'.repeat(50))
    
    if (!this.results.success) {
      console.log('\n🛑 强制质量门禁失败，请立即修复后重试！')
    } else {
      console.log('\n🎉 文件操作完成，强制质量检查通过!')
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  
  let targetFile = ''
  let operation = ''
  
  // 解析参数
  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      targetFile = arg.substring(7)
    } else if (arg.startsWith('--operation=')) {
      operation = arg.substring(12)
    }
  }
  
  if (!targetFile || !operation) {
    logger.error('❌ 错误: 缺少必要参数')
    logger.error('使用方法: bun run constraint:post-check --file="path/to/file" --operation="ToolName"')
    process.exit(2) // exit(2) = 阻塞错误，真正中断Claude操作
  }
  
  const postCheck = new ConstraintPostCheck(targetFile, operation)
  const success = await postCheck.execute()
  
  if (!success) {
    process.exit(2) // exit(2) = 阻塞错误，真正中断Claude操作 // 失败时退出码非0，可以中断Claude的操作
  }
}

if (import.meta.main) {
  main().catch(console.error)
}