#!/usr/bin/env bun
/**
 * LinchKit Constraint Pre-Check 脚本
 * Claude Code Hooks 集成 - PreToolUse 上下文注入机制
 * 
 * 用法: bun run constraint:pre-check --file="$TARGET_FILE" --operation="$TOOL_NAME"
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
const logger = createLogger('constraint-pre-check')

interface FileContext {
  path: string
  directory: string
  filename: string
  extension: string
  exists: boolean
  operation: string
}

interface RecommendedPattern {
  pattern: string
  description: string
  example: string
  reason: string
}

class ConstraintPreCheck {
  private targetFile: string
  private operation: string
  private context: FileContext
  private patterns: RecommendedPattern[] = []
  private constraints: string[] = []
  private suggestions: string[] = []

  constructor(targetFile: string, operation: string) {
    this.targetFile = targetFile
    this.operation = operation
    this.context = this.analyzeFileContext()
  }

  async execute(): Promise<void> {
    logger.info('🪝 PreToolUse Hook - 上下文注入开始')
    logger.info(`📄 目标文件: ${this.targetFile}`)
    logger.info(`🔧 操作类型: ${this.operation}`)

    // 1. 文件上下文分析
    this.analyzeContext()
    
    // 2. 查询相关模式推荐
    await this.queryRelevantPatterns()
    
    // 3. 检查现有实现
    await this.checkExistingImplementations()
    
    // 4. 提供约束建议
    this.generateConstraints()
    
    // 5. 输出上下文信息
    this.displayContextInfo()
  }

  private analyzeFileContext(): FileContext {
    const filePath = resolve(this.targetFile)
    return {
      path: filePath,
      directory: dirname(filePath),
      filename: basename(filePath),
      extension: extname(filePath),
      exists: existsSync(filePath),
      operation: this.operation
    }
  }

  private analyzeContext(): void {
    logger.info('🔍 分析文件上下文...')

    // 基于文件路径和扩展名分析
    if (this.context.directory.includes('components')) {
      this.patterns.push({
        pattern: 'React组件模式',
        description: '遵循项目React组件架构',
        example: 'export const ComponentName: React.FC<Props> = ({ }) => { }',
        reason: '保持组件API一致性'
      })
      this.constraints.push('必须包含TypeScript类型定义')
      this.constraints.push('组件必须导出为named export')
    }

    if (this.context.directory.includes('services')) {
      this.patterns.push({
        pattern: '服务层模式',
        description: '使用依赖注入和接口抽象',
        example: 'export class UserService implements IUserService',
        reason: '确保服务层可测试性和可扩展性'
      })
      this.constraints.push('服务类必须实现接口')
      this.constraints.push('使用依赖注入模式')
    }

    if (this.context.directory.includes('hooks')) {
      this.patterns.push({
        pattern: 'React Hooks模式',
        description: '自定义Hook命名和返回值规范',
        example: 'export const useFeatureName = () => { return { data, loading, error } }',
        reason: '保持Hooks API一致性'
      })
      this.constraints.push('Hook名称必须以use开头')
      this.constraints.push('返回值必须包含loading和error状态')
    }

    if (this.context.extension === '.test.ts' || this.context.extension === '.test.tsx') {
      this.patterns.push({
        pattern: '测试文件模式',
        description: '使用describe/it结构和准确的断言',
        example: 'describe("ComponentName", () => { it("should render correctly", () => { }) })',
        reason: '保持测试结构和可读性'
      })
      this.constraints.push('测试必须有明确的describe和it描述')
      this.constraints.push('每个测试用例必须有断言')
    }

    if (this.context.filename.includes('route') || this.context.directory.includes('api')) {
      this.patterns.push({
        pattern: 'API路由模式',
        description: '使用统一的错误处理和响应格式',
        example: 'export async function GET(request: Request) { return Response.json({ }) }',
        reason: 'API响应格式标准化'
      })
      this.constraints.push('API路由必须包含错误处理')
      this.constraints.push('响应必须使用统一格式')
    }
  }

  private async queryRelevantPatterns(): Promise<void> {
    logger.info('🧠 查询Graph RAG相关模式...')
    
    try {
      // 基于文件路径提取关键词
      const pathKeywords = this.extractPathKeywords()
      
      for (const keyword of pathKeywords) {
        try {
          const { stdout: result } = await execAsync(
            `bun run ai:session query "${keyword}" --debug 2>/dev/null || echo "无结果"`
          )
          
          if (result.includes('total_found') && !result.includes('"total_found": 0')) {
            this.suggestions.push(`发现与"${keyword}"相关的现有实现，建议参考现有模式`)
          }
        } catch (error) {
          // 忽略单个查询错误，继续其他查询
        }
      }
    } catch (error) {
      logger.warn('Graph RAG查询失败，将基于文件路径提供建议')
    }
  }

  private async checkExistingImplementations(): Promise<void> {
    logger.info('🔄 检查现有实现...')
    
    try {
      const keywords = this.extractPathKeywords()
      const { stdout: result } = await execAsync(
        `bun run deps:check "${keywords.join(' ')}" 2>/dev/null || echo "检查完成"`
      )
      
      if (result.includes('发现现有包实现')) {
        this.constraints.push('优先扩展现有实现，避免重复开发')
        this.suggestions.push('检查现有包的API，考虑复用或扩展现有功能')
      }
    } catch (error) {
      // 忽略错误，继续执行
    }
  }

  private generateConstraints(): void {
    // 基于操作类型添加约束
    if (this.operation === 'Edit' || this.operation === 'MultiEdit') {
      this.constraints.push('编辑文件后必须确保TypeScript编译通过')
      this.constraints.push('修改组件后需要更新相关测试')
      
      if (this.context.exists) {
        this.suggestions.push('正在编辑现有文件，请保持现有API兼容性')
      }
    }

    if (this.operation === 'Write') {
      this.constraints.push('新文件必须遵循项目命名规范')
      this.constraints.push('必须包含适当的导出和类型定义')
      this.suggestions.push('创建新文件，请确保符合项目架构模式')
    }

    // 通用约束
    this.constraints.push('代码必须通过ESLint检查')
    this.constraints.push('必须遵循项目的TypeScript配置')
  }

  private extractPathKeywords(): string[] {
    const pathParts = this.context.path.split('/')
    const keywords = []
    
    // 提取目录关键词
    const relevantDirs = pathParts.filter(part => 
      !['src', 'dist', 'node_modules', '.git'].includes(part) && 
      part.length > 2
    )
    keywords.push(...relevantDirs.slice(-3)) // 取最后3个相关目录
    
    // 提取文件名关键词
    const baseName = this.context.filename.replace(this.context.extension, '')
    const fileKeywords = baseName.split(/[-_.]/g).filter(k => k.length > 2)
    keywords.push(...fileKeywords.slice(0, 2)) // 取前2个文件名关键词
    
    return [...new Set(keywords)] // 去重
  }

  private displayContextInfo(): void {
    console.log('\n🎯 PreToolUse 上下文注入结果:')
    console.log('─'.repeat(50))
    
    if (this.patterns.length > 0) {
      console.log('\n📋 推荐模式:')
      this.patterns.forEach(pattern => {
        console.log(`  🔹 ${pattern.pattern}`)
        console.log(`     ${pattern.description}`)
        console.log(`     示例: ${pattern.example}`)
        console.log(`     原因: ${pattern.reason}\n`)
      })
    }

    if (this.constraints.length > 0) {
      console.log('🛡️ 必须遵守的约束:')
      this.constraints.forEach(constraint => {
        console.log(`  • ${constraint}`)
      })
    }

    if (this.suggestions.length > 0) {
      console.log('\n💡 建议:')
      this.suggestions.forEach(suggestion => {
        console.log(`  💫 ${suggestion}`)
      })
    }

    console.log('\n✅ 上下文注入完成，可以继续操作')
    console.log('─'.repeat(50))
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
    logger.error('使用方法: bun run constraint:pre-check --file="path/to/file" --operation="ToolName"')
    process.exit(1)
  }
  
  const preCheck = new ConstraintPreCheck(targetFile, operation)
  await preCheck.execute()
}

if (import.meta.main) {
  main().catch(console.error)
}