/**
 * Vibe Coding Engine
 * 
 * LinchKit AI-驱动的智能代码生成引擎
 * 基于 Graph RAG 实现上下文感知的代码生成
 */

import { createLogger } from '@linch-kit/core/server'

import type { Logger } from '../types/index.js'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine.js'

import { ContextAnalyzer } from './context-analyzer.js'
import type {
  IVibeCodingEngine,
  GenerationContext,
  ContextAnalysis,
  GeneratedCode,
  DependencyInfo,
  ValidationResult,
  GenerationContextType,
  TechStack,
  QualityLevel
} from './types.js'
import {
  GenerationContextSchema,
  GeneratedCodeSchema,
  DependencyInfoSchema
} from './types.js'

/**
 * Vibe Coding Engine 核心实现
 */
export class VibeCodingEngine implements IVibeCodingEngine {
  private logger: Logger
  private queryEngine: IntelligentQueryEngine
  private contextAnalyzer: ContextAnalyzer
  private isInitialized = false

  // 代码模板缓存
  private templates = new Map<string, string>()
  
  // LinchKit 内部包映射
  private readonly linchkitPackages = new Set([
    '@linch-kit/core',
    '@linch-kit/schema', 
    '@linch-kit/auth',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui'
  ])

  constructor() {
    this.logger = createLogger({ name: 'ai:vibe-coding-engine' })
    this.queryEngine = new IntelligentQueryEngine()
    this.contextAnalyzer = new ContextAnalyzer()
    
    this.initializeTemplates()
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.logger.info('初始化 Vibe Coding Engine...')
      
      // 连接知识图谱
      await this.queryEngine.connect()
      
      this.isInitialized = true
      this.logger.info('Vibe Coding Engine 初始化完成')
    } catch (error) {
      this.logger.error('Vibe Coding Engine 初始化失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 基于自然语言提示生成代码
   */
  async generateCode(prompt: string, context?: Partial<GenerationContext>): Promise<GeneratedCode> {
    await this.ensureInitialized()
    
    const startTime = Date.now()
    this.logger.info('开始代码生成', { prompt, context })

    try {
      // 1. 规范化生成上下文
      const normalizedContext = this.normalizeContext(context)
      
      // 2. 分析上下文和查询图谱
      const contextAnalysis = await this.analyzeContext(prompt)
      
      // 3. 选择合适的生成策略
      const strategy = this.selectGenerationStrategy(prompt, normalizedContext, contextAnalysis)
      
      // 4. 生成代码
      const code = await this.executeGeneration(prompt, normalizedContext, contextAnalysis, strategy)
      
      // 5. 推理依赖关系
      const dependencies = await this.inferDependencies(code)
      
      // 6. 验证代码质量
      const validation = await this.validateGeneration(code)
      
      // 7. 构建结果
      const result: GeneratedCode = {
        code,
        imports: this.extractImports(code),
        exports: this.extractExports(code),
        dependencies: this.groupDependencies(dependencies),
        metadata: {
          generated_at: new Date().toISOString(),
          tech_stack: normalizedContext.tech_stack,
          confidence: this.calculateConfidence(contextAnalysis, validation),
          estimated_lines: code.split('\n').length,
          complexity_score: this.calculateComplexity(code)
        },
        validation
      }

      // 验证结果结构
      const validatedResult = GeneratedCodeSchema.parse(result)
      
      const endTime = Date.now()
      this.logger.info('代码生成完成', {
        duration: endTime - startTime,
        lines: validatedResult.metadata.estimated_lines,
        confidence: validatedResult.metadata.confidence
      })

      return validatedResult
    } catch (error) {
      this.logger.error('代码生成失败', error instanceof Error ? error : undefined, { prompt })
      throw error
    }
  }

  /**
   * 基于图谱查询获取上下文
   */
  async analyzeContext(prompt: string): Promise<ContextAnalysis> {
    await this.ensureInitialized()
    
    this.logger.info('开始上下文分析', { prompt })

    try {
      // 使用智能查询引擎查询相关节点
      const queryResult = await this.queryEngine.query(prompt)
      
      // 使用上下文分析器分析结果
      const analysis = await this.contextAnalyzer.analyze(
        prompt,
        queryResult.results.nodes,
        queryResult.results.relationships
      )

      this.logger.info('上下文分析完成', {
        relevantNodes: analysis.relevant_nodes.length,
        suggestedImports: analysis.suggested_imports.length,
        patterns: analysis.patterns.length
      })

      return analysis
    } catch (error) {
      this.logger.error('上下文分析失败', error instanceof Error ? error : undefined, { prompt })
      throw error
    }
  }

  /**
   * 智能依赖推理
   */
  async inferDependencies(code: string): Promise<DependencyInfo[]> {
    this.logger.info('开始依赖推理')

    try {
      const dependencies: DependencyInfo[] = []
      
      // 1. 提取 import 语句
      const importMatches = code.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || []
      
      for (const importMatch of importMatches) {
        const moduleMatch = importMatch.match(/from\s+['"]([^'"]+)['"]/)
        if (!moduleMatch) continue
        
        const moduleName = moduleMatch[1]
        const exportsMatch = importMatch.match(/import\s+(?:\*\s+as\s+\w+|\{([^}]+)\}|\w+)/)
        const exportsUsed = exportsMatch?.[1] 
          ? exportsMatch[1].split(',').map(e => e.trim().replace(/\s+as\s+.*/, ''))
          : ['default']

        const dependency: DependencyInfo = {
          name: this.getPackageName(moduleName),
          type: this.getDependencyType(moduleName),
          source: this.getDependencySource(moduleName),
          import_path: moduleName,
          exports_used: exportsUsed,
          confidence: this.calculateDependencyConfidence(moduleName),
          reason: this.getDependencyReason(moduleName)
        }

        // 添加版本信息（如果是已知的 LinchKit 包）
        if (this.linchkitPackages.has(dependency.name)) {
          dependency.version = '^1.0.0' // 假设版本，实际应该从 package.json 读取
        }

        dependencies.push(dependency)
      }

      // 2. 分析代码中使用的 API 和模式
      const apiDependencies = await this.analyzeApiUsage(code)
      dependencies.push(...apiDependencies)

      // 验证依赖信息
      const validatedDependencies = dependencies.map(dep => DependencyInfoSchema.parse(dep))
      
      this.logger.info('依赖推理完成', {
        count: validatedDependencies.length,
        linchkitDeps: validatedDependencies.filter(d => d.source === 'linchkit').length
      })

      return validatedDependencies
    } catch (error) {
      this.logger.error('依赖推理失败', error instanceof Error ? error : undefined)
      return []
    }
  }

  /**
   * 代码质量验证
   */
  async validateGeneration(code: string): Promise<ValidationResult> {
    this.logger.info('开始代码验证')

    try {
      const validation: ValidationResult = {
        syntax_valid: true,
        type_safe: true,
        lint_compliant: true,
        warnings: [],
        suggestions: []
      }

      // 1. 基础语法检查
      try {
        // 简单的语法检查 - 检查括号匹配等
        this.performSyntaxCheck(code)
      } catch (error) {
        validation.syntax_valid = false
        validation.warnings.push(`语法错误: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // 2. TypeScript 类型检查
      if (code.includes('any')) {
        validation.type_safe = false
        validation.warnings.push('代码中包含 any 类型，违反 TypeScript 严格模式')
        validation.suggestions.push('使用 unknown 或更具体的类型替代 any')
      }

      // 3. LinchKit 约定检查
      this.validateLinchKitConventions(code, validation)

      // 4. 安全检查
      this.performSecurityCheck(code, validation)

      this.logger.info('代码验证完成', {
        syntaxValid: validation.syntax_valid,
        typeSafe: validation.type_safe,
        warningsCount: validation.warnings.length
      })

      return validation
    } catch (error) {
      this.logger.error('代码验证失败', error instanceof Error ? error : undefined)
      return {
        syntax_valid: false,
        type_safe: false,
        lint_compliant: false,
        warnings: ['验证过程出现错误'],
        suggestions: []
      }
    }
  }

  /**
   * 获取代码生成建议
   */
  async getSuggestions(prompt: string): Promise<string[]> {
    await this.ensureInitialized()
    
    this.logger.info('生成代码建议', { prompt })

    try {
      const suggestions: string[] = []
      
      // 1. 基于提示分析生成类型建议
      const contextType = this.inferContextType(prompt)
      if (contextType) {
        suggestions.push(`建议生成 ${contextType} 类型的代码`)
      }

      // 2. 基于图谱查询生成相关建议
      const contextAnalysis = await this.analyzeContext(prompt)
      
      if (contextAnalysis.suggested_imports.length > 0) {
        suggestions.push(`建议导入: ${contextAnalysis.suggested_imports.map(imp => imp.module).join(', ')}`)
      }

      if (contextAnalysis.patterns.length > 0) {
        const pattern = contextAnalysis.patterns[0]
        suggestions.push(`建议使用 ${pattern.name} 模式: ${pattern.description}`)
      }

      // 3. 添加 LinchKit 最佳实践建议
      suggestions.push(...this.getLinchKitBestPractices(prompt))

      return suggestions
    } catch (error) {
      this.logger.error('生成建议失败', error instanceof Error ? error : undefined, { prompt })
      return ['无法生成建议，请检查输入或稍后重试']
    }
  }

  // === 私有辅助方法 ===

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private normalizeContext(context?: Partial<GenerationContext>): GenerationContext {
    const defaultContext: GenerationContext = {
      type: GenerationContextType.FUNCTION,
      tech_stack: [TechStack.TYPESCRIPT],
      quality_level: QualityLevel.DEVELOPMENT,
      existing_imports: [],
      constraints: {
        max_lines: 200,
        include_tests: false,
        include_docs: true,
        follow_conventions: true
      }
    }

    // 合并用户提供的上下文
    const merged = { ...defaultContext, ...context }
    
    // 验证上下文
    return GenerationContextSchema.parse(merged)
  }

  private selectGenerationStrategy(
    prompt: string, 
    context: GenerationContext, 
    _analysis: ContextAnalysis
  ): string {
    // 基于上下文类型选择策略
    switch (context.type) {
      case GenerationContextType.FUNCTION:
        return 'function_generation'
      case GenerationContextType.COMPONENT:
        return 'react_component_generation'
      case GenerationContextType.API_ROUTE:
        return 'api_route_generation'
      case GenerationContextType.SCHEMA:
        return 'schema_generation'
      default:
        return 'generic_generation'
    }
  }

  private async executeGeneration(
    prompt: string,
    context: GenerationContext,
    analysis: ContextAnalysis,
    strategy: string
  ): Promise<string> {
    // 根据策略生成代码
    switch (strategy) {
      case 'function_generation':
        return this.generateFunction(prompt, context, analysis)
      case 'react_component_generation':
        return this.generateReactComponent(prompt, context, analysis)
      case 'api_route_generation':
        return this.generateApiRoute(prompt, context, analysis)
      case 'schema_generation':
        return this.generateSchema(prompt, context, analysis)
      default:
        return this.generateGeneric(prompt, context, analysis)
    }
  }

  // === 代码生成具体实现 ===

  private generateFunction(prompt: string, _context: GenerationContext, analysis: ContextAnalysis): string {
    const imports = analysis.suggested_imports
      .filter(imp => imp.confidence > 0.7)
      .map(imp => `import { ${imp.exports.join(', ')} } from '${imp.module}'`)
      .join('\n')

    const functionName = this.extractFunctionName(prompt) || 'generatedFunction'
    
    return `${imports ? imports + '\n\n' : ''}/**
 * ${this.generateJSDoc(prompt)}
 */
export async function ${functionName}(): Promise<void> {
  // TODO: 实现函数逻辑
  throw new Error('函数未实现')
}`
  }

  private generateReactComponent(prompt: string, _context: GenerationContext, _analysis: ContextAnalysis): string {
    const componentName = this.extractComponentName(prompt) || 'GeneratedComponent'
    
    return `import { type FC } from 'react'

interface ${componentName}Props {
  // TODO: 定义组件属性
}

/**
 * ${this.generateJSDoc(prompt)}
 */
export const ${componentName}: FC<${componentName}Props> = (props) => {
  return (
    <div>
      {/* TODO: 实现组件内容 */}
      <h1>${componentName}</h1>
    </div>
  )
}`
  }

  private generateApiRoute(prompt: string, _context: GenerationContext, _analysis: ContextAnalysis): string {
    return `import { NextRequest, NextResponse } from 'next/server'

/**
 * ${this.generateJSDoc(prompt)}
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: 实现 GET 逻辑
    return NextResponse.json({ message: 'Success' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}`
  }

  private generateSchema(prompt: string, _context: GenerationContext, _analysis: ContextAnalysis): string {
    const schemaName = this.extractSchemaName(prompt) || 'GeneratedSchema'
    
    return `import { z } from 'zod'

/**
 * ${this.generateJSDoc(prompt)}
 */
export const ${schemaName}Schema = z.object({
  // TODO: 定义 schema 字段
  id: z.string().uuid().describe('唯一标识符'),
  name: z.string().min(1).describe('名称')
})

export type ${schemaName} = z.infer<typeof ${schemaName}Schema>`
  }

  private generateGeneric(prompt: string, _context: GenerationContext, _analysis: ContextAnalysis): string {
    return `/**
 * ${this.generateJSDoc(prompt)}
 */
// TODO: 根据需求实现具体功能
export const generatedCode = {
  // 请根据具体需求修改此处代码
}`
  }

  // === 辅助方法 ===

  private initializeTemplates(): void {
    // 初始化代码模板
    this.templates.set('function', '// Function template')
    this.templates.set('component', '// Component template') 
    // 更多模板...
  }

  private extractImports(code: string): string[] {
    const importMatches = code.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || []
    return importMatches
  }

  private extractExports(code: string): string[] {
    const exportMatches = code.match(/export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)/g) || []
    return exportMatches.map(match => {
      const nameMatch = match.match(/\s+(\w+)$/)
      return nameMatch?.[1] || ''
    }).filter(Boolean)
  }

  private groupDependencies(dependencies: DependencyInfo[]): { internal: string[]; external: string[] } {
    const internal = dependencies.filter(d => d.source === 'linchkit').map(d => d.name)
    const external = dependencies.filter(d => d.source !== 'linchkit').map(d => d.name)
    return { internal, external }
  }

  private calculateConfidence(analysis: ContextAnalysis, validation: ValidationResult): number {
    let confidence = 0.5 // 基础置信度
    
    // 基于分析结果调整
    if (analysis.relevant_nodes.length > 0) confidence += 0.2
    if (analysis.suggested_imports.length > 0) confidence += 0.1
    if (analysis.patterns.length > 0) confidence += 0.1
    
    // 基于验证结果调整
    if (validation.syntax_valid) confidence += 0.1
    if (validation.type_safe) confidence += 0.1
    if (validation.warnings.length === 0) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }

  private calculateComplexity(code: string): number {
    // 简单的复杂度计算
    const lines = code.split('\n').length
    const functions = (code.match(/function\s+\w+/g) || []).length
    const conditions = (code.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g) || []).length
    
    return Math.min((lines / 20) + functions + (conditions * 0.5), 10)
  }

  private getPackageName(modulePath: string): string {
    if (modulePath.startsWith('@linch-kit/')) {
      return modulePath.split('/').slice(0, 2).join('/')
    }
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return 'local'
    }
    return modulePath.split('/')[0]
  }

  private getDependencyType(modulePath: string): DependencyInfo['type'] {
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return 'direct'
    }
    return 'direct'
  }

  private getDependencySource(modulePath: string): DependencyInfo['source'] {
    if (modulePath.startsWith('@linch-kit/')) {
      return 'linchkit'
    }
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return 'local'
    }
    return 'npm'
  }

  private calculateDependencyConfidence(modulePath: string): number {
    if (modulePath.startsWith('@linch-kit/')) {
      return 0.9 // LinchKit 内部包置信度高
    }
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return 0.8 // 本地模块置信度较高
    }
    return 0.7 // 外部包置信度中等
  }

  private getDependencyReason(modulePath: string): string {
    if (modulePath.startsWith('@linch-kit/')) {
      return 'LinchKit 内部包依赖'
    }
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return '本地模块引用'
    }
    return 'NPM 包依赖'
  }

  private async analyzeApiUsage(code: string): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = []
    
    // 检查 React hooks 使用
    if (code.includes('useState') || code.includes('useEffect')) {
      dependencies.push({
        name: 'react',
        type: 'direct',
        source: 'npm',
        import_path: 'react',
        exports_used: ['useState', 'useEffect'],
        confidence: 0.9,
        reason: '检测到 React hooks 使用'
      })
    }

    // 检查 LinchKit 模式
    if (code.includes('createLogger')) {
      dependencies.push({
        name: '@linch-kit/core',
        type: 'direct',
        source: 'linchkit',
        import_path: '@linch-kit/core/server',
        exports_used: ['createLogger'],
        confidence: 0.9,
        reason: '检测到 LinchKit 日志系统使用'
      })
    }

    return dependencies
  }

  private performSyntaxCheck(code: string): void {
    // 简单的语法检查
    const openBraces = (code.match(/\{/g) || []).length
    const closeBraces = (code.match(/\}/g) || []).length
    
    if (openBraces !== closeBraces) {
      throw new Error('括号不匹配')
    }

    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    
    if (openParens !== closeParens) {
      throw new Error('圆括号不匹配')
    }
  }

  private validateLinchKitConventions(code: string, validation: ValidationResult): void {
    // 检查是否使用了 LinchKit 约定
    if (code.includes('createLogger')) {
      // 检查是否正确使用了日志系统
      if (!code.includes("{ name: '")) {
        validation.suggestions.push('建议为 logger 提供有意义的名称')
      }
    }

    // 检查是否遵循了文件结构约定
    if (code.includes('export') && !code.includes('/**')) {
      validation.suggestions.push('建议为导出的函数/类添加 JSDoc 注释')
    }
  }

  private performSecurityCheck(code: string, validation: ValidationResult): void {
    // 检查潜在的安全问题
    if (code.includes('eval(') || code.includes('Function(')) {
      validation.warnings.push('代码中包含 eval 或 Function 构造器，存在安全风险')
    }

    if (code.includes('process.env') && !code.includes('process.env.NODE_ENV')) {
      validation.suggestions.push('建议通过配置管理器访问环境变量而不是直接使用 process.env')
    }
  }

  private getLinchKitBestPractices(prompt: string): string[] {
    const practices: string[] = []
    
    if (prompt.includes('日志') || prompt.includes('log')) {
      practices.push('使用 @linch-kit/core createLogger 而不是 console.log')
    }

    if (prompt.includes('配置') || prompt.includes('config')) {
      practices.push('使用 @linch-kit/core ConfigManager 管理配置')
    }

    if (prompt.includes('schema') || prompt.includes('验证')) {
      practices.push('使用 @linch-kit/schema 进行数据验证')
    }

    if (prompt.includes('权限') || prompt.includes('auth')) {
      practices.push('使用 @linch-kit/auth 处理认证和授权')
    }

    return practices
  }

  private inferContextType(prompt: string): GenerationContextType | null {
    if (prompt.includes('函数') || prompt.includes('function')) {
      return GenerationContextType.FUNCTION
    }
    if (prompt.includes('组件') || prompt.includes('component')) {
      return GenerationContextType.COMPONENT
    }
    if (prompt.includes('API') || prompt.includes('路由')) {
      return GenerationContextType.API_ROUTE
    }
    if (prompt.includes('schema') || prompt.includes('验证')) {
      return GenerationContextType.SCHEMA
    }
    return null
  }

  private extractFunctionName(prompt: string): string | null {
    const match = prompt.match(/(?:函数|function)\s*(?:叫|名为|named|called)?\s*([a-zA-Z_]\w*)/i)
    return match?.[1] || null
  }

  private extractComponentName(prompt: string): string | null {
    const match = prompt.match(/(?:组件|component)\s*(?:叫|名为|named|called)?\s*([A-Z]\w*)/i)
    return match?.[1] || null
  }

  private extractSchemaName(prompt: string): string | null {
    const match = prompt.match(/(?:schema|验证)\s*(?:叫|名为|named|called)?\s*([A-Z]\w*)/i)
    return match?.[1] || null
  }

  private generateJSDoc(prompt: string): string {
    return `Generated function based on: ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}`
  }
}