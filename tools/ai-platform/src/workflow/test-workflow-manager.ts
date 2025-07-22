/**
 * LinchKit 测试 AI 工作流管理器
 * 智能测试管理、生成和优化系统，作为 AI 工作流的核心组件
 * 
 * @version 1.0.0 - Phase 3 测试工作流集成
 */

import { createLogger } from '@linch-kit/core'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, relative } from 'path'

import type { AIProvider } from '../providers/types'
import { createDefaultAIProvider, createAIProviderAdapter } from '../providers/ai-provider-adapter'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine'
import { TestCoverageAnalyzer, type TaskComplexityAnalysis, type CoverageAnalysisResult } from '../query/test-coverage-analyzer'
import { WorkflowStateMachine, WorkflowState } from './workflow-state-machine'
import { 
  TestStrategyDecisionEngine,
  type TestStrategyFactors,
  type StrategyAnalysisContext,
  type TestStrategyDecision
} from './test-strategy-engine'

const execAsync = promisify(exec)
const logger = createLogger('test-workflow-manager')

export interface TestWorkflowContext {
  taskDescription: string
  testType: 'unit' | 'integration' | 'e2e' | 'coverage' | 'ai-generate'
  targetFiles?: string[]
  coverageThreshold?: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  testStrategy?: 'tdd' | 'bdd' | 'mutation' | 'property-based' | 'traditional' | 'hybrid'
  strategyFactors?: TestStrategyFactors
  analysisContext?: StrategyAnalysisContext
  aiPreferences?: {
    generateMissingTests: boolean
    optimizeExistingTests: boolean
    suggestEdgeCases: boolean
    mockingStrategy: 'manual' | 'auto' | 'hybrid'
  }
}

export interface TestAnalysisResult {
  currentCoverage: {
    lines: number
    functions: number
    branches: number
    statements: number
    files: Record<string, any>
  }
  testGaps: Array<{
    file: string
    uncoveredLines: number[]
    missingFunctions: string[]
    suggestedTests: string[]
  }>
  existingTests: Array<{
    file: string
    testCount: number
    coverage: number
    quality: 'excellent' | 'good' | 'needs_improvement' | 'poor'
    suggestions: string[]
  }>
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    actions: Array<{
      type: 'generate' | 'improve' | 'refactor' | 'remove'
      target: string
      description: string
      effort: 'low' | 'medium' | 'high'
    }>
  }
}

export interface TestGenerationRequest {
  sourceFile: string
  testType: 'unit' | 'integration' | 'e2e'
  testFramework: 'bun' | 'jest' | 'vitest'
  mockingNeeds: Array<{
    dependency: string
    type: 'full' | 'partial' | 'spy'
  }>
  edgeCases: string[]
  businessRules: string[]
}

export interface TestGenerationResult {
  testFile: string
  testContent: string
  coverage: {
    expectedLines: number
    expectedFunctions: number
    expectedBranches: number
  }
  dependencies: string[]
  setupRequirements: string[]
  runInstructions: string[]
}

export class TestWorkflowManager {
  private aiProvider: AIProvider
  private queryEngine: IntelligentQueryEngine
  private workflowState: WorkflowStateMachine
  private coverageAnalyzer: TestCoverageAnalyzer
  private strategyEngine: TestStrategyDecisionEngine
  private projectRoot: string

  constructor(aiProvider?: AIProvider) {
    // Use provided AI provider or create default one
    this.aiProvider = aiProvider || createDefaultAIProvider()
    this.queryEngine = new IntelligentQueryEngine()
    this.workflowState = new WorkflowStateMachine('TEST_WORKFLOW')
    this.coverageAnalyzer = new TestCoverageAnalyzer()
    this.strategyEngine = new TestStrategyDecisionEngine(this.aiProvider)
    this.projectRoot = process.cwd()

    logger.info('TestWorkflowManager initialized', {
      aiProvider: this.aiProvider.getName(),
      projectRoot: this.projectRoot
    })
  }

  /**
   * Intelligent test timing control - analyzes when to generate tests
   */
  async analyzeTestTiming(context: TestWorkflowContext): Promise<{
    timingStrategy: TaskComplexityAnalysis
    coverageAnalysis: CoverageAnalysisResult
    recommendation: 'generate_now' | 'generate_later' | 'incremental' | 'skip'
    reasoning: string
  }> {
    logger.info('Analyzing intelligent test timing control', { 
      taskDescription: context.taskDescription,
      testType: context.testType 
    })

    try {
      // 1. Analyze task complexity for timing decision
      const timingStrategy = await this.coverageAnalyzer.analyzeTestTiming(
        context.taskDescription,
        {
          files: context.targetFiles,
          dependencies: await this.extractDependenciesFromFiles(context.targetFiles || [])
        }
      )

      // 2. Get current coverage analysis
      const coverageAnalysis = await this.coverageAnalyzer.analyzeCoverage({
        includeFiles: context.targetFiles,
        generateReport: false
      })

      // 3. Make intelligent timing decision
      const decision = this.makeTimingDecision(timingStrategy, coverageAnalysis, context)

      logger.info('Test timing analysis completed', {
        complexity: timingStrategy.score,
        strategy: timingStrategy.recommendation.mode,
        generateAt: timingStrategy.recommendation.generateAt,
        decision: decision.recommendation
      })

      return decision
    } catch (error) {
      logger.error('Test timing analysis failed', error instanceof Error ? error : new Error(String(error)))
      
      // Fallback to traditional approach
      return {
        timingStrategy: {
          score: 5,
          factors: [{ factor: 'Fallback analysis', weight: 1, contribution: 5 }],
          recommendation: {
            mode: 'traditional',
            generateAt: 'completion',
            testTypes: ['unit'],
            priority: 'future',
            reasoning: 'Fallback to traditional testing due to analysis failure'
          }
        },
        coverageAnalysis: await this.createFallbackCoverageAnalysis(),
        recommendation: 'generate_later',
        reasoning: 'Analysis failed, defaulting to safe traditional approach'
      }
    }
  }

  /**
   * Enhanced AI-driven test strategy analysis 
   * Integrates timing control with multi-factor strategy decision engine
   */
  async analyzeTestStrategy(context: TestWorkflowContext): Promise<{
    strategyDecision: TestStrategyDecision
    timingAnalysis: {
      strategy: TaskComplexityAnalysis
      recommendation: string
    }
    integration: {
      selectedStrategy: string
      confidence: number
      reasoning: string[]
    }
  }> {
    logger.info('Analyzing comprehensive test strategy', {
      taskDescription: context.taskDescription,
      hasStrategyFactors: !!context.strategyFactors,
      hasAnalysisContext: !!context.analysisContext
    })

    try {
      // 1. Analyze timing if not already done
      const timingAnalysis = await this.analyzeTestTiming(context)

      // 2. Prepare strategy factors (use provided or infer from context)
      const strategyFactors = context.strategyFactors || this.inferStrategyFactors(context, timingAnalysis)

      // 3. Prepare analysis context (use provided or infer from project)
      const analysisContext = context.analysisContext || await this.inferAnalysisContext(context)

      // 4. Run strategy decision engine
      const strategyDecision = await this.strategyEngine.analyzeTestStrategy(
        strategyFactors,
        analysisContext,
        context.targetFiles
      )

      // 5. Create integrated recommendation
      const integration = this.integrateTimingAndStrategy(
        timingAnalysis,
        strategyDecision,
        context
      )

      logger.info('Test strategy analysis completed', {
        strategy: strategyDecision.primaryStrategy,
        confidence: strategyDecision.confidence,
        timingRecommendation: timingAnalysis.recommendation
      })

      return {
        strategyDecision,
        timingAnalysis: {
          strategy: timingAnalysis.timingStrategy,
          recommendation: timingAnalysis.recommendation
        },
        integration
      }
    } catch (error) {
      logger.error('Test strategy analysis failed', error instanceof Error ? error : new Error(String(error)))
      
      // Fallback analysis
      return this.createFallbackStrategyAnalysis(context)
    }
  }

  /**
   * 执行测试工作流分析 (Legacy method - now enhanced with strategy engine)
   */
  async executeTestWorkflow(context: TestWorkflowContext): Promise<{
    analysis: TestAnalysisResult
    recommendations: any
    nextActions: string[]
    timingControl?: {
      strategy: TaskComplexityAnalysis
      recommendation: string
    }
  }> {
    logger.info('启动测试 AI 工作流', { 
      taskDescription: context.taskDescription,
      testType: context.testType 
    })

    try {
      // 0. **NEW** Intelligent test timing control analysis
      const timingControl = await this.analyzeTestTiming(context)
      
      // 1. 项目状态分析
      const projectStatus = await this.analyzeProjectTestStatus()
      
      // 2. Graph RAG 查询现有测试实现
      const existingTestContext = await this.queryExistingTests(context)
      
      // 3. 覆盖率分析 (enhanced with timing control)
      const coverageAnalysis = timingControl.coverageAnalysis
      
      // 4. AI 智能推荐 (enhanced with timing awareness)
      const aiRecommendations = await this.generateAIRecommendations(
        context, 
        projectStatus,
        existingTestContext,
        { coverage: this.adaptCoverageForLegacy(coverageAnalysis), gaps: [] },
        timingControl.timingStrategy
      )
      
      // 5. 生成执行计划 (timing-aware)
      const executionPlan = await this.createTestExecutionPlan(
        context,
        aiRecommendations,
        timingControl.recommendation
      )

      const analysis: TestAnalysisResult = {
        currentCoverage: this.adaptCoverageForLegacy(coverageAnalysis),
        testGaps: this.extractGapsFromAnalysis(coverageAnalysis),
        existingTests: existingTestContext.tests,
        recommendations: aiRecommendations
      }

      return {
        analysis,
        recommendations: aiRecommendations,
        nextActions: executionPlan.steps,
        timingControl: {
          strategy: timingControl.timingStrategy,
          recommendation: timingControl.recommendation
        }
      }
    } catch (error) {
      logger.error('测试工作流执行失败', { error: error.message })
      throw error
    }
  }

  /**
   * AI 驱动的测试生成
   */
  async generateTests(request: TestGenerationRequest): Promise<TestGenerationResult> {
    logger.info('开始 AI 测试生成', { sourceFile: request.sourceFile })

    try {
      // 1. 分析源代码
      const sourceAnalysis = await this.analyzeSourceCode(request.sourceFile)
      
      // 2. Graph RAG 查询相似测试模式
      const testPatterns = await this.queryTestPatterns(request.sourceFile)
      
      // 3. 构建测试生成 Prompt
      const prompt = await this.buildTestGenerationPrompt(
        request, 
        sourceAnalysis, 
        testPatterns
      )
      
      // 4. AI 生成测试代码
      const aiResponse = await this.aiProvider.generateResponse({
        prompt,
        temperature: 0.3, // 降低随机性，确保代码质量
        schema: {
          type: 'object',
          properties: {
            testContent: { type: 'string' },
            imports: { type: 'array', items: { type: 'string' } },
            testCases: { 
              type: 'array', 
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string', enum: ['unit', 'integration', 'edge-case'] }
                }
              }
            },
            mockingSetup: { type: 'array', items: { type: 'string' } },
            coverage: {
              type: 'object',
              properties: {
                expectedLines: { type: 'number' },
                expectedFunctions: { type: 'number' },
                expectedBranches: { type: 'number' }
              }
            }
          },
          required: ['testContent', 'testCases', 'coverage']
        }
      })

      // 5. 验证和优化生成的测试
      const optimizedTest = await this.optimizeGeneratedTest(
        aiResponse.data,
        request
      )

      return {
        testFile: this.getTestFilePath(request.sourceFile),
        testContent: optimizedTest.testContent,
        coverage: optimizedTest.coverage,
        dependencies: optimizedTest.dependencies,
        setupRequirements: optimizedTest.setupRequirements,
        runInstructions: optimizedTest.runInstructions
      }
    } catch (error) {
      logger.error('AI 测试生成失败', { 
        sourceFile: request.sourceFile,
        error: error.message 
      })
      throw error
    }
  }

  /**
   * 智能测试优化建议
   */
  async optimizeExistingTests(testFiles: string[]): Promise<{
    optimizations: Array<{
      file: string
      issues: string[]
      suggestions: string[]
      priority: 'high' | 'medium' | 'low'
    }>
    overallScore: number
  }> {
    logger.info('开始测试优化分析', { fileCount: testFiles.length })

    const optimizations = []

    for (const testFile of testFiles) {
      try {
        // 1. 分析测试文件质量
        const testAnalysis = await this.analyzeTestQuality(testFile)
        
        // 2. AI 评估和建议
        const aiOptimization = await this.getAIOptimizationSuggestions(
          testFile,
          testAnalysis
        )

        optimizations.push({
          file: testFile,
          issues: testAnalysis.issues,
          suggestions: aiOptimization.suggestions,
          priority: aiOptimization.priority
        })
      } catch (error) {
        logger.warn('测试文件分析失败', { 
          testFile,
          error: error.message 
        })
      }
    }

    // 计算整体测试质量评分
    const overallScore = this.calculateTestQualityScore(optimizations)

    return {
      optimizations,
      overallScore
    }
  }

  /**
   * 执行智能测试运行
   */
  async runIntelligentTests(options: {
    testType?: 'unit' | 'integration' | 'e2e' | 'all'
    coverage?: boolean
    watch?: boolean
    aiAnalysis?: boolean
  } = {}): Promise<{
    results: any
    analysis: any
    recommendations: string[]
  }> {
    logger.info('开始智能测试运行', options)

    try {
      // 1. 运行测试
      const testResults = await this.executeTests(options)
      
      // 2. AI 分析测试结果
      let analysis = null
      if (options.aiAnalysis) {
        analysis = await this.analyzeTestResults(testResults)
      }

      // 3. 生成改进建议
      const recommendations = await this.generateTestRecommendations(
        testResults,
        analysis
      )

      return {
        results: testResults,
        analysis,
        recommendations
      }
    } catch (error) {
      logger.error('智能测试运行失败', { error: error.message })
      throw error
    }
  }

  // ========== 私有方法 ==========

  private async analyzeProjectTestStatus() {
    logger.debug('分析项目测试状态')
    
    try {
      // 1. 检查测试配置
      const bunConfig = existsSync(join(this.projectRoot, 'bunfig.toml'))
      const jestConfig = existsSync(join(this.projectRoot, 'jest.config.js'))
      const vitestConfig = existsSync(join(this.projectRoot, 'vitest.config.ts'))

      // 2. 统计测试文件
      const { stdout: testFiles } = await execAsync('find . -name "*.test.*" -o -name "*.spec.*" | wc -l')
      const testFileCount = parseInt(testFiles.trim())

      // 3. 获取最近的测试运行结果
      let lastTestRun = null
      try {
        if (existsSync(join(this.projectRoot, 'coverage', 'test-report.json'))) {
          const reportContent = readFileSync(join(this.projectRoot, 'coverage', 'test-report.json'), 'utf-8')
          lastTestRun = JSON.parse(reportContent)
        }
      } catch {}

      return {
        testFramework: bunConfig ? 'bun' : jestConfig ? 'jest' : vitestConfig ? 'vitest' : 'unknown',
        testFileCount,
        lastTestRun,
        hasCI: existsSync(join(this.projectRoot, '.github', 'workflows'))
      }
    } catch (error) {
      logger.warn('项目测试状态分析失败', { error: error.message })
      return {
        testFramework: 'unknown',
        testFileCount: 0,
        lastTestRun: null,
        hasCI: false
      }
    }
  }

  private async queryExistingTests(context: TestWorkflowContext) {
    logger.debug('查询现有测试实现')
    
    try {
      // 使用 Graph RAG 查询相关测试
      const query = `test ${context.taskDescription} ${context.testType}`
      const results = await this.queryEngine.searchRelated(query, {
        includeTests: true,
        maxResults: 10
      })

      return {
        tests: results.relatedItems?.filter(item => 
          item.type === 'test' || item.file?.includes('.test.') || item.file?.includes('.spec.')
        ) || [],
        patterns: results.patterns || [],
        suggestions: results.suggestions || []
      }
    } catch (error) {
      logger.warn('Graph RAG 测试查询失败', { error: error.message })
      return { tests: [], patterns: [], suggestions: [] }
    }
  }

  private async analyzeCoverageGaps(context: TestWorkflowContext) {
    logger.debug('分析测试覆盖率缺口')

    try {
      // 1. 运行覆盖率分析
      const { stdout } = await execAsync('bun test --coverage --reporter=json', { 
        cwd: this.projectRoot 
      })
      const coverageData = JSON.parse(stdout)

      // 2. 分析覆盖率缺口
      const gaps = []
      for (const [file, data] of Object.entries(coverageData.files || {})) {
        const fileData = data as any
        if (fileData.lines?.percentage < (context.coverageThreshold?.lines || 80)) {
          gaps.push({
            file: relative(this.projectRoot, file),
            uncoveredLines: this.extractUncoveredLines(fileData),
            missingFunctions: this.extractMissingFunctions(fileData),
            suggestedTests: [] // 将由 AI 填充
          })
        }
      }

      return {
        coverage: coverageData.summary || { lines: 0, functions: 0, branches: 0, statements: 0 },
        gaps
      }
    } catch (error) {
      logger.warn('覆盖率分析失败', { error: error.message })
      return {
        coverage: { lines: 0, functions: 0, branches: 0, statements: 0 },
        gaps: []
      }
    }
  }

  private extractUncoveredLines(fileData: any): number[] {
    if (!fileData.l) return []
    
    return Object.entries(fileData.l)
      .filter(([line, count]) => (count as number) === 0)
      .map(([line]) => parseInt(line))
  }

  private extractMissingFunctions(fileData: any): string[] {
    if (!fileData.f) return []
    
    return Object.entries(fileData.f)
      .filter(([func, count]) => (count as number) === 0)
      .map(([func]) => func)
  }

  private async generateAIRecommendations(
    context: TestWorkflowContext,
    projectStatus: any,
    testContext: any,
    coverageAnalysis: any,
    timingStrategy?: TaskComplexityAnalysis
  ) {
    logger.debug('生成 AI 测试推荐')

    try {
      const prompt = `
作为测试架构专家，基于以下信息生成测试策略建议：

## 任务描述
${context.taskDescription}

## 测试类型
${context.testType}

## 项目状态
- 测试框架: ${projectStatus.testFramework}
- 现有测试文件: ${projectStatus.testFileCount}
- CI集成: ${projectStatus.hasCI ? '已配置' : '未配置'}

## 覆盖率状态
- 当前行覆盖率: ${coverageAnalysis.coverage.lines}%
- 发现 ${coverageAnalysis.gaps.length} 个覆盖率缺口

## 现有相关测试
${testContext.tests.length > 0 ? 
  testContext.tests.map((t: any) => `- ${t.file}: ${t.description || '无描述'}`).join('\n') : 
  '未找到相关测试'
}

请提供：
1. 测试策略建议 (TDD/BDD/其他)
2. 优先级排序的行动项
3. 预估工作量 (小时)
4. 风险评估和缓解策略
`

      const response = await this.aiProvider.generateResponse({
        prompt,
        temperature: 0.4,
        schema: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  target: { type: 'string' },
                  description: { type: 'string' },
                  effort: { type: 'string', enum: ['low', 'medium', 'high'] },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
              }
            },
            estimatedHours: { type: 'number' },
            risks: { type: 'array', items: { type: 'string' } }
          }
        }
      })

      return response.data
    } catch (error) {
      logger.warn('AI 推荐生成失败', { error: error.message })
      return {
        strategy: 'balanced',
        priority: 'medium',
        actions: [],
        estimatedHours: 0,
        risks: []
      }
    }
  }

  private async createTestExecutionPlan(
    context: TestWorkflowContext, 
    recommendations: any,
    timingRecommendation?: string
  ) {
    const baseSteps = [
      `分析 ${context.testType} 测试需求`,
      `基于 ${recommendations.strategy} 策略开始实施`
    ]

    // Add timing-aware steps
    if (timingRecommendation === 'generate_now') {
      baseSteps.unshift('🚀 立即生成测试框架 (TDD模式)')
    } else if (timingRecommendation === 'incremental') {
      baseSteps.push('📝 增量式测试开发')
    } else if (timingRecommendation === 'generate_later') {
      baseSteps.push('⏰ 编码完成后生成测试')
    }

    return {
      steps: [
        ...baseSteps,
        ...recommendations.actions.map((action: any) => 
          `${action.type}: ${action.description} (${action.effort} effort)`
        ),
        '执行测试验证',
        '生成覆盖率报告'
      ]
    }
  }

  private async analyzeSourceCode(sourceFile: string) {
    // 简化的源代码分析
    try {
      const content = readFileSync(sourceFile, 'utf-8')
      
      // 提取函数、类、导出等
      const functions = (content.match(/function\s+\w+|const\s+\w+\s*=|export\s+(function|const|class)/g) || [])
      const imports = (content.match(/import.*from/g) || [])
      const exports = (content.match(/export/g) || [])

      return {
        functions: functions.length,
        imports: imports.length,
        exports: exports.length,
        complexity: this.calculateComplexity(content),
        dependencies: this.extractDependencies(imports)
      }
    } catch (error) {
      logger.warn('源代码分析失败', { sourceFile, error: error.message })
      return {
        functions: 0,
        imports: 0,
        exports: 0,
        complexity: 1,
        dependencies: []
      }
    }
  }

  private calculateComplexity(content: string): number {
    // 简化的循环复杂度计算
    const conditions = (content.match(/if\s*\(|while\s*\(|for\s*\(|switch\s*\(|\|\||&&/g) || []).length
    return Math.max(1, conditions)
  }

  private extractDependencies(imports: string[]): string[] {
    return imports
      .map(imp => {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/)
        return match ? match[1] : null
      })
      .filter(Boolean) as string[]
  }

  private async queryTestPatterns(sourceFile: string) {
    // 查询相似的测试模式
    try {
      const query = `test patterns for ${sourceFile}`
      const results = await this.queryEngine.searchRelated(query, {
        includeTests: true,
        maxResults: 5
      })
      return results.patterns || []
    } catch (error) {
      logger.warn('测试模式查询失败', { error: error.message })
      return []
    }
  }

  private async buildTestGenerationPrompt(
    request: TestGenerationRequest,
    sourceAnalysis: any,
    testPatterns: any[]
  ) {
    return `
作为资深测试工程师，为以下源代码生成高质量的 ${request.testType} 测试：

## 源文件信息
- 文件: ${request.sourceFile}
- 函数数量: ${sourceAnalysis.functions}
- 复杂度: ${sourceAnalysis.complexity}
- 依赖项: ${sourceAnalysis.dependencies.join(', ')}

## 测试要求
- 框架: ${request.testFramework}
- 类型: ${request.testType}
- Mock 需求: ${request.mockingNeeds.map(m => m.dependency).join(', ')}

## 业务规则
${request.businessRules.join('\n')}

## 边界情况
${request.edgeCases.join('\n')}

## 参考模式
${testPatterns.length > 0 ? testPatterns.map(p => `- ${p}`).join('\n') : '无'}

请生成：
1. 完整的测试文件内容
2. 必要的导入语句
3. 详细的测试用例
4. Mock 设置代码
5. 预期覆盖率指标
`
  }

  private async optimizeGeneratedTest(aiResponse: any, request: TestGenerationRequest) {
    // 优化生成的测试代码
    return {
      testContent: aiResponse.testContent,
      coverage: aiResponse.coverage,
      dependencies: this.extractTestDependencies(aiResponse.testContent),
      setupRequirements: aiResponse.mockingSetup || [],
      runInstructions: [
        `bun test ${this.getTestFilePath(request.sourceFile)}`,
        `bun test --coverage ${this.getTestFilePath(request.sourceFile)}`
      ]
    }
  }

  private extractTestDependencies(testContent: string): string[] {
    const imports = testContent.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
    return imports.map(imp => {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/)
      return match ? match[1] : null
    }).filter(Boolean) as string[]
  }

  private getTestFilePath(sourceFile: string): string {
    const dir = sourceFile.replace(/\/[^/]+$/, '')
    const name = sourceFile.replace(/^.*\//, '').replace(/\.(ts|js)$/, '')
    return join(dir, '__tests__', `${name}.test.ts`)
  }

  private async analyzeTestQuality(testFile: string) {
    // 分析测试文件质量
    try {
      const content = readFileSync(testFile, 'utf-8')
      const issues = []
      
      // 检查常见问题
      if (!content.includes('describe') && !content.includes('test')) {
        issues.push('缺少测试结构')
      }
      
      if (!content.includes('expect')) {
        issues.push('缺少断言')
      }

      const testCount = (content.match(/test\s*\(|it\s*\(/g) || []).length

      return {
        testCount,
        issues,
        hasSetup: content.includes('beforeEach') || content.includes('beforeAll'),
        hasTeardown: content.includes('afterEach') || content.includes('afterAll'),
        complexity: this.calculateComplexity(content)
      }
    } catch (error) {
      logger.warn('测试质量分析失败', { testFile, error: error.message })
      return {
        testCount: 0,
        issues: ['文件读取失败'],
        hasSetup: false,
        hasTeardown: false,
        complexity: 0
      }
    }
  }

  private async getAIOptimizationSuggestions(testFile: string, analysis: any) {
    // AI 优化建议
    const severity = analysis.issues.length > 3 ? 'high' : analysis.issues.length > 1 ? 'medium' : 'low'
    
    return {
      suggestions: analysis.issues.map((issue: string) => `修复: ${issue}`),
      priority: severity as 'high' | 'medium' | 'low'
    }
  }

  private calculateTestQualityScore(optimizations: any[]): number {
    if (optimizations.length === 0) return 100

    const highIssues = optimizations.filter(opt => opt.priority === 'high').length
    const mediumIssues = optimizations.filter(opt => opt.priority === 'medium').length
    const lowIssues = optimizations.filter(opt => opt.priority === 'low').length

    // 简化的评分算法
    const score = Math.max(0, 100 - (highIssues * 20) - (mediumIssues * 10) - (lowIssues * 5))
    return score
  }

  private async executeTests(options: any) {
    // 执行测试
    try {
      const testCommand = this.buildTestCommand(options)
      const { stdout, stderr } = await execAsync(testCommand, { cwd: this.projectRoot })
      
      return {
        success: true,
        output: stdout,
        errors: stderr,
        command: testCommand
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: error.message,
        command: 'test execution failed'
      }
    }
  }

  private buildTestCommand(options: any): string {
    let cmd = 'bun test'
    
    if (options.testType && options.testType !== 'all') {
      cmd += ` --testNamePattern=${options.testType}`
    }
    
    if (options.coverage) {
      cmd += ' --coverage'
    }
    
    if (options.watch) {
      cmd += ' --watch'
    }
    
    return cmd
  }

  private async analyzeTestResults(results: any) {
    // AI 分析测试结果
    if (!results.success) {
      return {
        status: 'failed',
        issues: [results.errors],
        suggestions: ['修复测试错误', '检查测试配置']
      }
    }

    return {
      status: 'passed',
      issues: [],
      suggestions: ['继续保持良好的测试覆盖率']
    }
  }

  private async generateTestRecommendations(results: any, analysis: any): Promise<string[]> {
    const recommendations = []
    
    if (!results.success) {
      recommendations.push('修复失败的测试用例')
      recommendations.push('检查测试依赖和配置')
    } else {
      recommendations.push('考虑增加边界情况测试')
      recommendations.push('优化测试性能')
    }

    if (analysis?.suggestions) {
      recommendations.push(...analysis.suggestions)
    }

    return recommendations
  }

  // ========== NEW: Test Strategy Engine Integration Methods ==========

  /**
   * Infer strategy factors from timing analysis and context
   */
  private inferStrategyFactors(
    context: TestWorkflowContext, 
    timingAnalysis: any
  ): TestStrategyFactors {
    const { timingStrategy } = timingAnalysis
    
    return {
      complexity: timingStrategy.score || 5,
      businessImpact: context.testType === 'e2e' ? 8 : 6,
      riskLevel: timingStrategy.score >= 7 ? 8 : 5,
      currentCoverage: timingAnalysis.coverageAnalysis?.overall?.lines?.percentage || 0,
      changeFrequency: context.targetFiles?.length > 5 ? 7 : 4,
      teamExperience: 6 // Default mid-level, could be configurable
    }
  }

  /**
   * Infer analysis context from project structure
   */
  private async inferAnalysisContext(context: TestWorkflowContext): Promise<StrategyAnalysisContext> {
    // Try to detect project type from package.json or file structure
    let projectType: StrategyAnalysisContext['projectType'] = 'web-app'
    let framework = 'unknown'
    
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        
        // Detect framework
        if (packageJson.dependencies?.['next'] || packageJson.devDependencies?.['next']) {
          framework = 'next.js'
          projectType = 'web-app'
        } else if (packageJson.dependencies?.['express'] || packageJson.dependencies?.['fastify']) {
          projectType = 'api'
          framework = 'node.js'
        } else if (packageJson.name?.includes('lib') || packageJson.main) {
          projectType = 'library'
        }
      }
      
      // Determine project size based on file count
      const { stdout } = await execAsync('find . -name "*.ts" -o -name "*.js" | grep -v node_modules | wc -l')
      const fileCount = parseInt(stdout.trim())
      const size = fileCount < 50 ? 'small' : fileCount < 200 ? 'medium' : fileCount < 1000 ? 'large' : 'enterprise'

      return {
        projectType,
        codebase: {
          language: 'typescript', // Assume TypeScript for LinchKit
          framework,
          size: size as any
        },
        team: {
          size: 3, // Default assumption
          experience: 'mid',
          testingCulture: 'medium'
        },
        timeline: {
          isUrgent: false,
          hasDeadline: true,
          iterationLength: 2
        }
      }
    } catch (error) {
      logger.warn('Could not infer project context, using defaults', error)
      return {
        projectType: 'web-app',
        codebase: { language: 'typescript', framework: 'unknown', size: 'medium' },
        team: { size: 3, experience: 'mid', testingCulture: 'medium' },
        timeline: { isUrgent: false, hasDeadline: true, iterationLength: 2 }
      }
    }
  }

  /**
   * Integrate timing and strategy recommendations
   */
  private integrateTimingAndStrategy(
    timingAnalysis: any,
    strategyDecision: TestStrategyDecision,
    context: TestWorkflowContext
  ): { selectedStrategy: string; confidence: number; reasoning: string[] } {
    const { recommendation: timingRec } = timingAnalysis
    const { primaryStrategy, confidence, reasoning } = strategyDecision

    // Combine recommendations
    let selectedStrategy = primaryStrategy
    let integratedConfidence = confidence
    const integratedReasoning = [...reasoning]

    // Adjust strategy based on timing analysis
    if (timingRec === 'generate_now' && primaryStrategy === 'traditional') {
      selectedStrategy = 'tdd'
      integratedReasoning.push('Upgraded to TDD based on immediate test generation timing')
      integratedConfidence = Math.min(confidence + 0.1, 0.95)
    } else if (timingRec === 'skip' && confidence < 0.7) {
      selectedStrategy = 'traditional'
      integratedReasoning.push('Simplified to traditional approach due to low confidence and skip recommendation')
      integratedConfidence = 0.8
    }

    // Add timing-specific reasoning
    integratedReasoning.push(`Timing analysis recommends: ${timingRec}`)
    if (timingAnalysis.timingStrategy.recommendation.mode) {
      integratedReasoning.push(`Development mode: ${timingAnalysis.timingStrategy.recommendation.mode}`)
    }

    return {
      selectedStrategy,
      confidence: integratedConfidence,
      reasoning: integratedReasoning.slice(0, 6) // Limit reasoning length
    }
  }

  /**
   * Create fallback strategy analysis when main analysis fails
   */
  private createFallbackStrategyAnalysis(context: TestWorkflowContext): any {
    return {
      strategyDecision: {
        primaryStrategy: 'traditional',
        secondaryStrategies: [],
        confidence: 0.6,
        reasoning: ['Fallback analysis due to strategy engine failure'],
        resourceAllocation: { unitTests: 70, integrationTests: 20, e2eTests: 8, performanceTests: 2 },
        prioritization: [],
        estimatedEffort: { hours: 8, complexity: 'moderate' }
      },
      timingAnalysis: {
        strategy: { score: 5, recommendation: { mode: 'traditional', generateAt: 'completion' } },
        recommendation: 'generate_later'
      },
      integration: {
        selectedStrategy: 'traditional',
        confidence: 0.6,
        reasoning: ['Conservative fallback approach', 'Manual refinement recommended']
      }
    }
  }

  // ========== Enhanced AI Provider Methods ==========

  /**
   * Update AI provider with error handling and fallback
   */
  updateAIProvider(provider: AIProvider): void {
    this.aiProvider = provider
    this.strategyEngine = new TestStrategyDecisionEngine(provider)
    logger.info('Updated AI provider', { provider: provider.getName() })
  }

  /**
   * Get AI provider info and availability
   */
  async getProviderStatus(): Promise<{
    name: string
    id: string
    available: boolean
    error?: string
  }> {
    try {
      const available = await this.aiProvider.isAvailable()
      return {
        name: this.aiProvider.getName(),
        id: this.aiProvider.getId(),
        available
      }
    } catch (error) {
      return {
        name: this.aiProvider.getName(),
        id: this.aiProvider.getId(), 
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ========== Legacy: Intelligent Test Timing Control Support Methods ==========

  /**
   * Make intelligent timing decision based on analysis
   */
  private makeTimingDecision(
    timingStrategy: TaskComplexityAnalysis,
    coverageAnalysis: CoverageAnalysisResult,
    context: TestWorkflowContext
  ): {
    timingStrategy: TaskComplexityAnalysis
    coverageAnalysis: CoverageAnalysisResult
    recommendation: 'generate_now' | 'generate_later' | 'incremental' | 'skip'
    reasoning: string
  } {
    const { score, recommendation } = timingStrategy
    const { overall } = coverageAnalysis
    
    let decision: 'generate_now' | 'generate_later' | 'incremental' | 'skip'
    let reasoning: string

    // High complexity or critical business logic
    if (score >= 8 || recommendation.mode === 'tdd') {
      decision = 'generate_now'
      reasoning = `High complexity (${score}/10) requires TDD approach. ${recommendation.reasoning}`
    }
    // Medium complexity with existing low coverage
    else if (score >= 6 && overall.lines.percentage < 70) {
      decision = 'incremental' 
      reasoning = `Medium complexity with low coverage (${overall.lines.percentage}%). Incremental testing recommended.`
    }
    // Low complexity but critical gaps
    else if (coverageAnalysis.gapAnalysis.criticalGaps > 0) {
      decision = 'generate_later'
      reasoning = `${coverageAnalysis.gapAnalysis.criticalGaps} critical coverage gaps found. Generate tests after implementation.`
    }
    // Very low complexity with good coverage
    else if (score < 4 && overall.lines.percentage > 80) {
      decision = 'skip'
      reasoning = `Low complexity (${score}/10) with good coverage (${overall.lines.percentage}%). Testing may be optional.`
    }
    // Default case
    else {
      decision = recommendation.generateAt === 'planning' ? 'generate_now' : 'generate_later'
      reasoning = `Following ${recommendation.mode} strategy: ${recommendation.reasoning}`
    }

    return {
      timingStrategy,
      coverageAnalysis,
      recommendation: decision,
      reasoning
    }
  }

  /**
   * Extract dependencies from target files for timing analysis
   */
  private async extractDependenciesFromFiles(targetFiles: string[]): Promise<string[]> {
    const dependencies: Set<string> = new Set()

    for (const file of targetFiles) {
      try {
        const content = readFileSync(file, 'utf-8')
        const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
        
        importMatches.forEach(match => {
          const depMatch = match.match(/from\s+['"]([^'"]+)['"]/)
          if (depMatch && !depMatch[1].startsWith('.')) {
            dependencies.add(depMatch[1])
          }
        })
      } catch (error) {
        logger.warn(`Failed to extract dependencies from ${file}`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    return Array.from(dependencies)
  }

  /**
   * Create fallback coverage analysis when main analysis fails
   */
  private async createFallbackCoverageAnalysis(): Promise<CoverageAnalysisResult> {
    return {
      overall: {
        lines: { total: 0, covered: 0, uncovered: 0, percentage: 0 },
        functions: { total: 0, covered: 0, uncovered: 0, percentage: 0 },
        branches: { total: 0, covered: 0, uncovered: 0, percentage: 0 },
        statements: { total: 0, covered: 0, uncovered: 0, percentage: 0 }
      },
      files: [],
      gapAnalysis: {
        totalGaps: 0,
        criticalGaps: 0,
        highPriorityFiles: [],
        suggestedTests: [],
        coverageGoals: {
          currentOverall: 0,
          targetOverall: 80,
          improveBy: 80
        }
      },
      recommendations: [],
      trends: {
        coverageChange: 0,
        qualityScore: 50,
        testHealthScore: 50
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  /**
   * Adapt new coverage analysis format to legacy format
   */
  private adaptCoverageForLegacy(analysis: CoverageAnalysisResult): any {
    return {
      lines: analysis.overall.lines.percentage,
      functions: analysis.overall.functions.percentage,
      branches: analysis.overall.branches.percentage,
      statements: analysis.overall.statements.percentage,
      files: analysis.files.reduce((acc: any, file) => {
        acc[file.path] = {
          lines: { percentage: file.metrics.lines.percentage },
          functions: { percentage: file.metrics.functions.percentage },
          branches: { percentage: file.metrics.branches.percentage },
          statements: { percentage: file.metrics.statements.percentage }
        }
        return acc
      }, {})
    }
  }

  /**
   * Extract gaps from new coverage analysis for legacy format
   */
  private extractGapsFromAnalysis(analysis: CoverageAnalysisResult): any[] {
    return analysis.files
      .filter(file => file.priority === 'high')
      .map(file => ({
        file: file.path,
        uncoveredLines: file.uncoveredLines,
        missingFunctions: file.uncoveredFunctions,
        suggestedTests: [`Test ${file.uncoveredFunctions.length} uncovered functions`]
      }))
  }
}

export type { 
  TestWorkflowContext, 
  TestAnalysisResult, 
  TestGenerationRequest, 
  TestGenerationResult 
}