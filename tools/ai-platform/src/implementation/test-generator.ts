/**
 * LinchKit AI 驱动的测试生成器
 * 智能分析源代码并生成高质量测试用例
 * 
 * @version 1.0.0 - AI 测试生成引擎
 */

import { createLogger } from '@linch-kit/core'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname, relative, parse } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

import type { AIProvider } from '../providers/types'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine'

const execAsync = promisify(exec)
const logger = createLogger('ai-test-generator')

export interface SourceCodeAnalysis {
  file: string
  functions: Array<{
    name: string
    type: 'function' | 'method' | 'arrow' | 'async'
    parameters: Array<{
      name: string
      type?: string
      optional?: boolean
    }>
    returnType?: string
    complexity: number
    isAsync: boolean
    isExported: boolean
    documentation?: string
    dependencies: string[]
  }>
  classes: Array<{
    name: string
    methods: string[]
    properties: string[]
    constructor?: {
      parameters: Array<{
        name: string
        type?: string
      }>
    }
    extends?: string
    implements?: string[]
  }>
  imports: Array<{
    source: string
    imports: string[]
    type: 'named' | 'default' | 'namespace'
  }>
  exports: Array<{
    name: string
    type: 'named' | 'default'
  }>
  constants: Array<{
    name: string
    type?: string
    value?: string
  }>
  complexity: {
    cyclomatic: number
    cognitive: number
    halstead: {
      operators: number
      operands: number
      vocabulary: number
      length: number
    }
  }
  testability: {
    score: number // 0-100
    issues: string[]
    improvements: string[]
  }
}

export interface TestGenerationOptions {
  framework: 'bun' | 'jest' | 'vitest'
  testType: 'unit' | 'integration' | 'e2e'
  mockStrategy: 'auto' | 'manual' | 'none'
  coverageTarget: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  testPatterns: Array<'happy-path' | 'edge-cases' | 'error-handling' | 'boundary-testing' | 'property-based'>
  generateDocumentationTests: boolean
  includePerformanceTests: boolean
  includeSecurityTests: boolean
  tddMode: boolean // Test-Driven Development 模式
}

export interface GeneratedTest {
  testFile: string
  testContent: string
  framework: string
  coverage: {
    expectedLines: number
    expectedFunctions: number
    expectedBranches: number
    expectedStatements: number
  }
  testCases: Array<{
    name: string
    type: 'unit' | 'integration' | 'edge-case' | 'error' | 'performance' | 'security'
    description: string
    priority: 'high' | 'medium' | 'low'
    dependencies: string[]
    mocks: Array<{
      target: string
      type: 'mock' | 'spy' | 'stub'
      behavior?: string
    }>
  }>
  setup: {
    imports: string[]
    mocks: string[]
    fixtures: string[]
    beforeEach?: string
    afterEach?: string
  }
  insights: {
    generationTime: number
    aiConfidence: number
    qualityScore: number
    suggestions: string[]
  }
}

export class AITestGenerator {
  private aiProvider: AIProvider
  private queryEngine: IntelligentQueryEngine
  private projectRoot: string
  private defaultOptions: TestGenerationOptions

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider
    this.queryEngine = new IntelligentQueryEngine()
    this.projectRoot = process.cwd()
    this.defaultOptions = {
      framework: 'bun',
      testType: 'unit',
      mockStrategy: 'auto',
      coverageTarget: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90
      },
      testPatterns: ['happy-path', 'edge-cases', 'error-handling'],
      generateDocumentationTests: true,
      includePerformanceTests: false,
      includeSecurityTests: false,
      tddMode: false
    }
  }

  /**
   * 生成测试文件
   */
  async generateTest(
    sourceFile: string,
    options: Partial<TestGenerationOptions> = {}
  ): Promise<GeneratedTest> {
    const startTime = Date.now()
    const opts = { ...this.defaultOptions, ...options }
    
    logger.info(`开始为 ${sourceFile} 生成 ${opts.testType} 测试`, {
      framework: opts.framework,
      mockStrategy: opts.mockStrategy
    })

    try {
      // 1. 分析源代码
      const sourceAnalysis = await this.analyzeSourceCode(sourceFile)
      
      // 2. 查询现有测试模式
      const testPatterns = await this.queryTestPatterns(sourceFile, opts.testType)
      
      // 3. 生成测试内容
      const testContent = await this.generateTestContent(sourceAnalysis, testPatterns, opts)
      
      // 4. 创建测试文件
      const testFilePath = await this.createTestFile(sourceFile, testContent, opts)
      
      // 5. 验证和优化
      const optimizedTest = await this.optimizeGeneratedTest(testFilePath, testContent, opts)

      const generationTime = Date.now() - startTime

      return {
        testFile: testFilePath,
        testContent: optimizedTest.content,
        framework: opts.framework,
        coverage: optimizedTest.coverage,
        testCases: optimizedTest.testCases,
        setup: optimizedTest.setup,
        insights: {
          generationTime,
          aiConfidence: optimizedTest.confidence,
          qualityScore: optimizedTest.qualityScore,
          suggestions: optimizedTest.suggestions
        }
      }
    } catch (error) {
      logger.error(`测试生成失败: ${sourceFile}`, { error: error.message })
      throw error
    }
  }

  /**
   * 批量生成测试
   */
  async generateTestSuite(
    sourceFiles: string[],
    options: Partial<TestGenerationOptions> = {}
  ): Promise<{
    results: GeneratedTest[]
    summary: {
      totalFiles: number
      successCount: number
      failureCount: number
      totalTestCases: number
      totalCoverage: {
        lines: number
        functions: number
        branches: number
        statements: number
      }
    }
  }> {
    logger.info(`开始批量生成测试套件`, { fileCount: sourceFiles.length })

    const results: GeneratedTest[] = []
    let successCount = 0
    let failureCount = 0
    let totalTestCases = 0
    const coverageAccumulator = { lines: 0, functions: 0, branches: 0, statements: 0 }

    for (const sourceFile of sourceFiles) {
      try {
        const result = await this.generateTest(sourceFile, options)
        results.push(result)
        successCount++
        totalTestCases += result.testCases.length

        // 累计覆盖率
        coverageAccumulator.lines += result.coverage.expectedLines
        coverageAccumulator.functions += result.coverage.expectedFunctions
        coverageAccumulator.branches += result.coverage.expectedBranches
        coverageAccumulator.statements += result.coverage.expectedStatements
      } catch (error) {
        logger.warn(`跳过文件 ${sourceFile}:`, error.message)
        failureCount++
      }
    }

    // 计算平均覆盖率
    const avgCoverage = {
      lines: successCount > 0 ? coverageAccumulator.lines / successCount : 0,
      functions: successCount > 0 ? coverageAccumulator.functions / successCount : 0,
      branches: successCount > 0 ? coverageAccumulator.branches / successCount : 0,
      statements: successCount > 0 ? coverageAccumulator.statements / successCount : 0
    }

    logger.info(`批量测试生成完成`, {
      success: successCount,
      failures: failureCount,
      testCases: totalTestCases
    })

    return {
      results,
      summary: {
        totalFiles: sourceFiles.length,
        successCount,
        failureCount,
        totalTestCases,
        totalCoverage: avgCoverage
      }
    }
  }

  /**
   * TDD 模式：测试先行生成
   */
  async generateTDDTests(
    specification: {
      moduleName: string
      functions: Array<{
        name: string
        description: string
        parameters: Array<{
          name: string
          type: string
          description: string
        }>
        returnType: string
        behavior: string
        examples: Array<{
          input: any
          output: any
          description: string
        }>
      }>
      businessRules: string[]
      constraints: string[]
    },
    options: Partial<TestGenerationOptions> = {}
  ): Promise<GeneratedTest> {
    const opts = { ...this.defaultOptions, ...options, tddMode: true }
    
    logger.info(`TDD 模式生成测试: ${specification.moduleName}`)

    try {
      // TDD 特定的 AI Prompt
      const tddPrompt = await this.buildTDDPrompt(specification, opts)
      
      // 调用 AI 生成测试
      const aiResponse = await this.aiProvider.generateResponse({
        prompt: tddPrompt,
        temperature: 0.2, // 更低的随机性，确保一致性
        schema: this.getTestGenerationSchema()
      })

      const testContent = this.formatTDDTestContent(aiResponse.data, specification, opts)
      const testFilePath = join(this.projectRoot, `src/__tests__/${specification.moduleName}.test.ts`)

      // 创建测试文件
      await this.ensureDirectoryExists(dirname(testFilePath))
      writeFileSync(testFilePath, testContent)

      return {
        testFile: testFilePath,
        testContent,
        framework: opts.framework,
        coverage: {
          expectedLines: 95, // TDD 通常要求更高覆盖率
          expectedFunctions: 100,
          expectedBranches: 90,
          expectedStatements: 95
        },
        testCases: aiResponse.data.testCases || [],
        setup: aiResponse.data.setup || { imports: [], mocks: [], fixtures: [] },
        insights: {
          generationTime: 0,
          aiConfidence: aiResponse.data.confidence || 90,
          qualityScore: 95, // TDD 模式默认高质量
          suggestions: [
            '实现规范中定义的所有函数',
            '确保所有测试用例都能通过',
            '根据业务规则验证行为正确性'
          ]
        }
      }
    } catch (error) {
      logger.error(`TDD 测试生成失败: ${specification.moduleName}`, { error: error.message })
      throw error
    }
  }

  // ========== 私有方法 ==========

  private async analyzeSourceCode(sourceFile: string): Promise<SourceCodeAnalysis> {
    logger.debug(`分析源代码: ${sourceFile}`)

    try {
      const content = readFileSync(sourceFile, 'utf-8')
      const relativePath = relative(this.projectRoot, sourceFile)

      // 简化的代码分析（实际项目中可以使用 AST 解析器如 ts-morph）
      const functions = this.extractFunctions(content)
      const classes = this.extractClasses(content)
      const imports = this.extractImports(content)
      const exports = this.extractExports(content)
      const constants = this.extractConstants(content)
      const complexity = this.calculateComplexity(content)
      const testability = this.assessTestability(content, functions, classes)

      return {
        file: relativePath,
        functions,
        classes,
        imports,
        exports,
        constants,
        complexity,
        testability
      }
    } catch (error) {
      logger.warn(`源代码分析失败: ${sourceFile}`, { error: error.message })
      throw new Error(`无法分析源文件: ${error.message}`)
    }
  }

  private extractFunctions(content: string): SourceCodeAnalysis['functions'] {
    const functions: SourceCodeAnalysis['functions'] = []
    
    // 匹配各种函数声明模式
    const patterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g,
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/g,
      /(\w+)\s*:\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/g
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const [, name, params, returnType] = match
        if (name && !functions.find(f => f.name === name)) {
          functions.push({
            name,
            type: this.detectFunctionType(match[0]),
            parameters: this.parseParameters(params || ''),
            returnType: returnType?.trim(),
            complexity: this.calculateFunctionComplexity(match[0]),
            isAsync: match[0].includes('async'),
            isExported: match[0].includes('export'),
            dependencies: this.extractFunctionDependencies(match[0])
          })
        }
      }
    }

    return functions
  }

  private extractClasses(content: string): SourceCodeAnalysis['classes'] {
    const classes: SourceCodeAnalysis['classes'] = []
    const classPattern = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*{([^}]+)}/g

    let match
    while ((match = classPattern.exec(content)) !== null) {
      const [, name, extendsClass, implementsClasses, body] = match
      
      const methods = this.extractMethods(body)
      const properties = this.extractProperties(body)
      const constructor = this.extractConstructor(body)

      classes.push({
        name,
        methods,
        properties,
        constructor,
        extends: extendsClass,
        implements: implementsClasses?.split(',').map(i => i.trim()).filter(Boolean)
      })
    }

    return classes
  }

  private extractImports(content: string): SourceCodeAnalysis['imports'] {
    const imports: SourceCodeAnalysis['imports'] = []
    const patterns = [
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, // default import
      /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g, // named imports
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g // namespace import
    ]

    patterns.forEach((pattern, index) => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const type = ['default', 'named', 'namespace'][index] as 'default' | 'named' | 'namespace'
        const [, importNames, source] = match
        
        imports.push({
          source,
          imports: type === 'named' ? 
            importNames.split(',').map(i => i.trim()).filter(Boolean) : 
            [importNames],
          type
        })
      }
    })

    return imports
  }

  private extractExports(content: string): SourceCodeAnalysis['exports'] {
    const exports: SourceCodeAnalysis['exports'] = []
    const patterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g
    ]

    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const names = match[1].includes(',') ? 
          match[1].split(',').map(n => n.trim()) : 
          [match[1]]
        
        names.forEach(name => {
          if (name && !exports.find(e => e.name === name)) {
            exports.push({
              name,
              type: match[0].includes('default') ? 'default' : 'named'
            })
          }
        })
      }
    })

    return exports
  }

  private extractConstants(content: string): SourceCodeAnalysis['constants'] {
    const constants: SourceCodeAnalysis['constants'] = []
    const pattern = /(?:export\s+)?const\s+([A-Z_][A-Z0-9_]*)\s*(?::\s*([^=]+))?\s*=\s*([^;\n]+)/g

    let match
    while ((match = pattern.exec(content)) !== null) {
      const [, name, type, value] = match
      constants.push({
        name,
        type: type?.trim(),
        value: value?.trim()
      })
    }

    return constants
  }

  private calculateComplexity(content: string): SourceCodeAnalysis['complexity'] {
    // 简化的复杂度计算
    const operators = (content.match(/[+\-*/%=<>!&|]+/g) || []).length
    const operands = (content.match(/\b\w+\b/g) || []).length
    const conditions = (content.match(/if|while|for|switch|case|\?\?|\|\||&&/g) || []).length

    return {
      cyclomatic: Math.max(1, conditions + 1),
      cognitive: this.calculateCognitiveComplexity(content),
      halstead: {
        operators,
        operands,
        vocabulary: operators + operands,
        length: (content.match(/\S+/g) || []).length
      }
    }
  }

  private calculateCognitiveComplexity(content: string): number {
    // 简化的认知复杂度
    const patterns = [
      /if\s*\(/g, // +1
      /else\s+if\s*\(/g, // +1
      /while\s*\(/g, // +1
      /for\s*\(/g, // +1
      /switch\s*\(/g, // +1
      /catch\s*\(/g, // +1
      /&&|\|\|/g, // +1 each
      /\?\s*[^:]+:/g // +1 ternary
    ]

    return patterns.reduce((complexity, pattern) => {
      const matches = content.match(pattern) || []
      return complexity + matches.length
    }, 0)
  }

  private assessTestability(
    content: string,
    functions: SourceCodeAnalysis['functions'],
    classes: SourceCodeAnalysis['classes']
  ): SourceCodeAnalysis['testability'] {
    const issues = []
    const improvements = []
    let score = 100

    // 检查全局状态
    if (content.includes('window.') || content.includes('global.')) {
      issues.push('使用全局状态，影响测试隔离')
      score -= 20
    }

    // 检查外部依赖
    if (content.includes('fetch(') || content.includes('XMLHttpRequest')) {
      issues.push('包含网络请求，需要 mock')
      improvements.push('考虑依赖注入或使用抽象层')
      score -= 10
    }

    // 检查函数复杂度
    const complexFunctions = functions.filter(f => f.complexity > 10)
    if (complexFunctions.length > 0) {
      issues.push(`${complexFunctions.length} 个函数复杂度过高`)
      improvements.push('将复杂函数拆分为更小的单元')
      score -= complexFunctions.length * 5
    }

    // 检查类的可测试性
    classes.forEach(cls => {
      if (!cls.constructor || cls.constructor.parameters.length > 5) {
        issues.push(`类 ${cls.name} 构造函数参数过多`)
        improvements.push('使用构建者模式或配置对象')
        score -= 10
      }
    })

    return {
      score: Math.max(0, score),
      issues,
      improvements
    }
  }

  private detectFunctionType(functionDecl: string): 'function' | 'method' | 'arrow' | 'async' {
    if (functionDecl.includes('async')) return 'async'
    if (functionDecl.includes('=>')) return 'arrow'
    if (functionDecl.includes('function')) return 'function'
    return 'method'
  }

  private parseParameters(paramStr: string): Array<{ name: string; type?: string; optional?: boolean }> {
    if (!paramStr.trim()) return []

    return paramStr.split(',').map(param => {
      const trimmed = param.trim()
      const optional = trimmed.includes('?')
      const [nameType] = trimmed.split('=') // 移除默认值
      const [name, type] = nameType.split(':').map(s => s.trim().replace('?', ''))

      return {
        name,
        type,
        optional
      }
    })
  }

  private calculateFunctionComplexity(functionStr: string): number {
    const conditions = (functionStr.match(/if|while|for|switch|case|\?\?|\|\||&&/g) || []).length
    return Math.max(1, conditions + 1)
  }

  private extractFunctionDependencies(functionStr: string): string[] {
    // 简化的依赖提取
    const deps = []
    const callPattern = /(\w+)\s*\(/g
    let match

    while ((match = callPattern.exec(functionStr)) !== null) {
      const funcName = match[1]
      if (funcName && !['if', 'for', 'while', 'switch', 'return', 'console'].includes(funcName)) {
        deps.push(funcName)
      }
    }

    return [...new Set(deps)]
  }

  private extractMethods(classBody: string): string[] {
    const methods = []
    const methodPattern = /(\w+)\s*\([^)]*\)\s*[:{]/g
    let match

    while ((match = methodPattern.exec(classBody)) !== null) {
      if (match[1] !== 'constructor') {
        methods.push(match[1])
      }
    }

    return methods
  }

  private extractProperties(classBody: string): string[] {
    const properties = []
    const propertyPattern = /(?:private|protected|public)?\s*(\w+)\s*[:=]/g
    let match

    while ((match = propertyPattern.exec(classBody)) !== null) {
      properties.push(match[1])
    }

    return properties
  }

  private extractConstructor(classBody: string): { parameters: Array<{ name: string; type?: string }> } | undefined {
    const constructorMatch = classBody.match(/constructor\s*\(([^)]*)\)/)
    if (!constructorMatch) return undefined

    const params = this.parseParameters(constructorMatch[1])
    return {
      parameters: params
    }
  }

  private async queryTestPatterns(sourceFile: string, testType: string): Promise<any[]> {
    try {
      const query = `test patterns ${testType} ${parse(sourceFile).name}`
      const results = await this.queryEngine.searchRelated(query, {
        includeTests: true,
        maxResults: 5
      })

      return results.patterns || []
    } catch (error) {
      logger.debug('测试模式查询失败', { error: error.message })
      return []
    }
  }

  private async generateTestContent(
    sourceAnalysis: SourceCodeAnalysis,
    testPatterns: any[],
    options: TestGenerationOptions
  ): Promise<any> {
    const prompt = this.buildTestGenerationPrompt(sourceAnalysis, testPatterns, options)

    const response = await this.aiProvider.generateResponse({
      prompt,
      temperature: 0.3,
      schema: this.getTestGenerationSchema()
    })

    return response.data
  }

  private buildTestGenerationPrompt(
    analysis: SourceCodeAnalysis,
    patterns: any[],
    options: TestGenerationOptions
  ): string {
    return `
作为资深测试工程师，为以下源代码生成完整的 ${options.testType} 测试：

## 源代码分析
- **文件**: ${analysis.file}
- **函数数量**: ${analysis.functions.length}
- **类数量**: ${analysis.classes.length}
- **循环复杂度**: ${analysis.complexity.cyclomatic}
- **可测试性评分**: ${analysis.testability.score}/100

### 函数列表
${analysis.functions.map(f => `
- **${f.name}** (${f.type}${f.isAsync ? ', async' : ''})
  - 参数: ${f.parameters.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ')}
  - 返回类型: ${f.returnType || '未知'}
  - 复杂度: ${f.complexity}
  - 导出: ${f.isExported ? '是' : '否'}
`).join('')}

### 类列表
${analysis.classes.map(c => `
- **${c.name}**
  - 方法: ${c.methods.join(', ')}
  - 属性: ${c.properties.join(', ')}
  - 继承: ${c.extends || '无'}
`).join('')}

### 依赖关系
${analysis.imports.map(i => `- ${i.source}: ${i.imports.join(', ')}`).join('\n')}

## 测试要求
- **框架**: ${options.framework}
- **类型**: ${options.testType}
- **Mock策略**: ${options.mockStrategy}
- **覆盖率目标**: 行${options.coverageTarget.lines}%, 函数${options.coverageTarget.functions}%
- **测试模式**: ${options.testPatterns.join(', ')}

## 测试模式参考
${patterns.length > 0 ? patterns.map(p => `- ${p}`).join('\n') : '无现有模式'}

## 可测试性问题
${analysis.testability.issues.length > 0 ? 
  analysis.testability.issues.map(issue => `⚠️ ${issue}`).join('\n') : 
  '✅ 无明显问题'}

## 改进建议
${analysis.testability.improvements.join('\n')}

请生成：
1. 完整的测试文件内容
2. 所有必要的导入语句
3. 适当的 Mock 设置
4. 每个函数/方法的测试用例
5. 边界情况和错误处理测试
6. 性能测试（如需要）
7. 安全测试（如需要）

确保：
- 测试覆盖所有公共函数和方法
- 包含正常路径和异常路径
- 使用描述性的测试名称
- 遵循 ${options.framework} 最佳实践
- 达到指定的覆盖率目标
`
  }

  private buildTDDPrompt(specification: any, options: TestGenerationOptions): string {
    return `
作为TDD专家，基于规范先行生成测试用例：

## 模块规范
**模块名**: ${specification.moduleName}

### 函数规范
${specification.functions.map(func => `
#### ${func.name}
- **描述**: ${func.description}
- **参数**: ${func.parameters.map(p => `${p.name}: ${p.type} - ${p.description}`).join(', ')}
- **返回**: ${func.returnType}
- **行为**: ${func.behavior}
- **示例**:
${func.examples.map(ex => `  - 输入: ${JSON.stringify(ex.input)} → 输出: ${JSON.stringify(ex.output)} (${ex.description})`).join('\n')}
`).join('')}

### 业务规则
${specification.businessRules.map(rule => `- ${rule}`).join('\n')}

### 约束条件
${specification.constraints.map(constraint => `- ${constraint}`).join('\n')}

## 测试要求
- **框架**: ${options.framework}
- **TDD模式**: 测试先行，覆盖所有规范
- **覆盖率**: 函数100%, 行95%+
- **包含**: 正常情况、边界情况、异常处理

生成完整的TDD测试套件，确保：
1. 每个函数都有全面的测试覆盖
2. 所有业务规则都通过测试验证
3. 约束条件都有相应的测试
4. 测试名称清晰描述期望行为
5. 包含设置和清理代码
`
  }

  private getTestGenerationSchema() {
    return {
      type: 'object',
      properties: {
        testContent: { type: 'string' },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              mocks: { type: 'array' }
            }
          }
        },
        setup: {
          type: 'object',
          properties: {
            imports: { type: 'array', items: { type: 'string' } },
            mocks: { type: 'array', items: { type: 'string' } },
            fixtures: { type: 'array', items: { type: 'string' } },
            beforeEach: { type: 'string' },
            afterEach: { type: 'string' }
          }
        },
        coverage: {
          type: 'object',
          properties: {
            expectedLines: { type: 'number' },
            expectedFunctions: { type: 'number' },
            expectedBranches: { type: 'number' },
            expectedStatements: { type: 'number' }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 }
      },
      required: ['testContent', 'testCases', 'setup', 'coverage']
    }
  }

  private formatTDDTestContent(aiData: any, specification: any, options: TestGenerationOptions): string {
    // 格式化TDD测试内容
    return `// TDD 测试 - ${specification.moduleName}
// 生成时间: ${new Date().toISOString()}

import { test, expect, describe, beforeEach, afterEach } from '${options.framework}:test'

${aiData.setup?.imports?.join('\n') || ''}

describe('${specification.moduleName}', () => {
  ${aiData.setup?.beforeEach ? `beforeEach(() => {\n    ${aiData.setup.beforeEach}\n  })` : ''}
  
  ${aiData.setup?.afterEach ? `afterEach(() => {\n    ${aiData.setup.afterEach}\n  })` : ''}

${aiData.testContent || '  // AI 生成的测试内容'}
})
`
  }

  private async createTestFile(sourceFile: string, testContent: any, options: TestGenerationOptions): Promise<string> {
    const parsed = parse(sourceFile)
    const testDir = join(dirname(sourceFile), '__tests__')
    const testFileName = `${parsed.name}.test.${parsed.ext.slice(1)}`
    const testFilePath = join(testDir, testFileName)

    await this.ensureDirectoryExists(testDir)
    
    const formattedContent = this.formatTestFile(testContent, options)
    writeFileSync(testFilePath, formattedContent)

    logger.info(`测试文件已创建: ${relative(this.projectRoot, testFilePath)}`)
    
    return testFilePath
  }

  private formatTestFile(testContent: any, options: TestGenerationOptions): string {
    const imports = testContent.setup?.imports || []
    const header = `// Auto-generated test file
// Framework: ${options.framework}
// Generated: ${new Date().toISOString()}

import { test, expect, describe, beforeEach, afterEach } from '${options.framework}:test'
${imports.join('\n')}

`

    return header + testContent.testContent
  }

  private async optimizeGeneratedTest(testFilePath: string, testContent: any, options: TestGenerationOptions): Promise<{
    content: string
    coverage: any
    testCases: any[]
    confidence: number
    qualityScore: number
    suggestions: string[]
  }> {
    // 优化生成的测试
    const suggestions = []
    let qualityScore = 90

    // 检查测试质量
    if (!testContent.testContent.includes('expect')) {
      suggestions.push('添加更多断言')
      qualityScore -= 20
    }

    if (!testContent.setup?.mocks?.length && options.mockStrategy !== 'none') {
      suggestions.push('考虑添加必要的 Mock')
      qualityScore -= 10
    }

    return {
      content: testContent.testContent,
      coverage: testContent.coverage || { expectedLines: 80, expectedFunctions: 80, expectedBranches: 70, expectedStatements: 80 },
      testCases: testContent.testCases || [],
      confidence: testContent.confidence || 85,
      qualityScore,
      suggestions
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  }
}

export type { SourceCodeAnalysis, TestGenerationOptions, GeneratedTest }