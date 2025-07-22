/**
 * LinchKit AI Test Coverage Analyzer
 * 
 * Intelligent test coverage analysis system for AI-driven test generation
 * Provides real-time coverage monitoring, hotspot identification, and smart recommendations
 * 
 * @version 1.0.0 - Phase 3 AI Test Workflow Integration
 */

import { createLogger } from '@linch-kit/core'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'

const execAsync = promisify(exec)
const logger = createLogger('test-coverage-analyzer')

export interface CoverageMetrics {
  lines: {
    total: number
    covered: number
    uncovered: number
    percentage: number
  }
  functions: {
    total: number
    covered: number
    uncovered: number
    percentage: number
  }
  branches: {
    total: number
    covered: number
    uncovered: number
    percentage: number
  }
  statements: {
    total: number
    covered: number
    uncovered: number
    percentage: number
  }
}

export interface FileCapture {
  path: string
  metrics: CoverageMetrics
  uncoveredLines: number[]
  uncoveredFunctions: string[]
  hotspots: Array<{
    line: number
    type: 'critical' | 'important' | 'normal'
    reason: string
  }>
  complexity: number
  priority: 'high' | 'medium' | 'low'
}

export interface TestGapAnalysis {
  totalGaps: number
  criticalGaps: number
  highPriorityFiles: string[]
  suggestedTests: Array<{
    file: string
    testType: 'unit' | 'integration' | 'e2e'
    description: string
    priority: 'high' | 'medium' | 'low'
    estimatedEffort: 'low' | 'medium' | 'high'
  }>
  coverageGoals: {
    currentOverall: number
    targetOverall: number
    improveBy: number
  }
}

export interface CoverageAnalysisResult {
  overall: CoverageMetrics
  files: FileCapture[]
  gapAnalysis: TestGapAnalysis
  recommendations: Array<{
    type: 'generate_test' | 'improve_existing' | 'refactor_code' | 'add_integration_test'
    target: string
    description: string
    impact: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
  }>
  trends: {
    coverageChange: number
    qualityScore: number
    testHealthScore: number
  }
  timestamp: string
  version: string
}

export interface TestTimingStrategy {
  mode: 'tdd' | 'traditional' | 'incremental'
  generateAt: 'planning' | 'implementation' | 'completion'
  testTypes: Array<'unit' | 'integration' | 'e2e'>
  priority: 'immediate' | 'next_phase' | 'future'
  reasoning: string
}

export interface TaskComplexityAnalysis {
  score: number // 1-10
  factors: Array<{
    factor: string
    weight: number
    contribution: number
  }>
  recommendation: TestTimingStrategy
}

export class TestCoverageAnalyzer {
  private projectRoot: string
  private coverageThresholds: {
    lines: number
    functions: number
    branches: number
    statements: number
  }

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.coverageThresholds = {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80
    }
  }

  /**
   * Analyze current test coverage and generate intelligent recommendations
   */
  async analyzeCoverage(options: {
    includeFiles?: string[]
    excludeFiles?: string[]
    testPattern?: string
    generateReport?: boolean
  } = {}): Promise<CoverageAnalysisResult> {
    logger.info('Starting intelligent test coverage analysis')

    try {
      // 1. Run coverage analysis
      const rawCoverage = await this.runCoverageAnalysis(options.testPattern)
      
      // 2. Parse and process coverage data
      const processedCoverage = await this.processCoverageData(rawCoverage, options)
      
      // 3. Perform gap analysis
      const gapAnalysis = await this.performGapAnalysis(processedCoverage)
      
      // 4. Generate intelligent recommendations
      const recommendations = await this.generateRecommendations(processedCoverage, gapAnalysis)
      
      // 5. Calculate trends and health scores
      const trends = await this.calculateTrends(processedCoverage)
      
      const result: CoverageAnalysisResult = {
        overall: this.calculateOverallMetrics(processedCoverage),
        files: processedCoverage,
        gapAnalysis,
        recommendations,
        trends,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }

      // 6. Generate report if requested
      if (options.generateReport) {
        await this.generateVisualReport(result)
      }

      logger.info('Coverage analysis completed', {
        totalFiles: result.files.length,
        overallCoverage: result.overall.lines.percentage,
        criticalGaps: result.gapAnalysis.criticalGaps
      })

      return result
    } catch (error) {
      logger.error('Coverage analysis failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Intelligent test timing decision engine
   * Analyzes task complexity and recommends when to generate tests
   */
  async analyzeTestTiming(taskDescription: string, codeContext?: {
    files?: string[]
    complexity?: number
    dependencies?: string[]
  }): Promise<TaskComplexityAnalysis> {
    logger.info('Analyzing test timing strategy', { taskDescription })

    const factors: Array<{ factor: string, weight: number, contribution: number }> = []
    let score = 0

    // Factor 1: Task keyword complexity
    const complexityKeywords = [
      { keywords: ['async', 'promise', 'callback', 'event'], weight: 0.2, score: 8 },
      { keywords: ['database', 'sql', 'query', 'transaction'], weight: 0.25, score: 9 },
      { keywords: ['api', 'http', 'request', 'endpoint'], weight: 0.15, score: 7 },
      { keywords: ['auth', 'permission', 'security', 'token'], weight: 0.2, score: 8 },
      { keywords: ['validation', 'schema', 'parse', 'transform'], weight: 0.1, score: 6 },
      { keywords: ['integration', 'system', 'workflow', 'process'], weight: 0.3, score: 9 }
    ]

    const taskLower = taskDescription.toLowerCase()
    for (const { keywords, weight, score: keywordScore } of complexityKeywords) {
      if (keywords.some(keyword => taskLower.includes(keyword))) {
        const contribution = weight * keywordScore
        factors.push({ factor: `Complexity Keywords (${keywords.join(', ')})`, weight, contribution })
        score += contribution
      }
    }

    // Factor 2: Code context complexity
    if (codeContext) {
      if (codeContext.complexity && codeContext.complexity > 5) {
        const contribution = 0.15 * Math.min(codeContext.complexity, 10)
        factors.push({ factor: 'Code Complexity', weight: 0.15, contribution })
        score += contribution
      }

      if (codeContext.files && codeContext.files.length > 3) {
        const contribution = 0.1 * Math.min(codeContext.files.length / 3, 3)
        factors.push({ factor: 'Multi-file Impact', weight: 0.1, contribution })
        score += contribution
      }

      if (codeContext.dependencies && codeContext.dependencies.length > 2) {
        const contribution = 0.1 * Math.min(codeContext.dependencies.length / 2, 2)
        factors.push({ factor: 'External Dependencies', weight: 0.1, contribution })
        score += contribution
      }
    }

    // Normalize score to 1-10 range
    score = Math.max(1, Math.min(10, score))

    // Determine test timing strategy
    const recommendation = this.determineTestTimingStrategy(score, taskDescription, factors)

    return {
      score,
      factors,
      recommendation
    }
  }

  /**
   * Monitor coverage changes in real-time during development
   */
  async watchCoverageChanges(callback: (change: {
    file: string
    oldCoverage: number
    newCoverage: number
    impact: 'positive' | 'negative' | 'neutral'
    suggestions: string[]
  }) => void): Promise<() => void> {
    logger.info('Starting real-time coverage monitoring')

    let previousCoverage: Map<string, number> = new Map()

    const checkCoverage = async () => {
      try {
        const result = await this.analyzeCoverage()
        
        for (const file of result.files) {
          const previousPercent = previousCoverage.get(file.path) ?? file.metrics.lines.percentage
          const currentPercent = file.metrics.lines.percentage
          
          if (Math.abs(currentPercent - previousPercent) >= 1) { // 1% change threshold
            const impact = currentPercent > previousPercent ? 'positive' : 'negative'
            const suggestions = this.generateCoverageSuggestions(file, impact)
            
            callback({
              file: file.path,
              oldCoverage: previousPercent,
              newCoverage: currentPercent,
              impact,
              suggestions
            })
          }
          
          previousCoverage.set(file.path, currentPercent)
        }
      } catch (error) {
        logger.warn('Coverage monitoring check failed', error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkCoverage, 30000)
    
    // Initial check
    await checkCoverage()

    return () => {
      clearInterval(interval)
      logger.info('Coverage monitoring stopped')
    }
  }

  // Private implementation methods

  private async runCoverageAnalysis(testPattern?: string): Promise<unknown> {
    const command = testPattern 
      ? `bun test ${testPattern} --coverage --reporter=json`
      : 'bun test --coverage --reporter=json'

    logger.debug('Running coverage analysis', { command })

    try {
      const { stdout } = await execAsync(command, { 
        cwd: this.projectRoot,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })
      
      return JSON.parse(stdout)
    } catch (error) {
      logger.warn('Direct coverage run failed, trying fallback method')
      return this.runFallbackCoverage()
    }
  }

  private async runFallbackCoverage(): Promise<unknown> {
    // Fallback: analyze existing coverage files
    const coverageFiles = [
      'coverage/coverage-final.json',
      'coverage/lcov-report/lcov.json', 
      '.nyc_output/coverage-final.json'
    ]

    for (const coverageFile of coverageFiles) {
      const fullPath = join(this.projectRoot, coverageFile)
      if (existsSync(fullPath)) {
        logger.debug('Using existing coverage file', { file: fullPath })
        try {
          const content = readFileSync(fullPath, 'utf-8')
          return JSON.parse(content)
        } catch (error) {
          logger.warn(`Failed to parse coverage file ${coverageFile}`, error instanceof Error ? error : new Error(String(error)))
        }
      }
    }

    // Generate minimal coverage data if no files found
    return this.generateMinimalCoverageData()
  }

  private async generateMinimalCoverageData(): Promise<unknown> {
    logger.info('Generating minimal coverage data from source files')

    const sourceFiles = await glob('src/**/*.{ts,js}', { 
      cwd: this.projectRoot,
      ignore: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts']
    })

    const coverage: Record<string, unknown> = {}
    
    for (const file of sourceFiles) {
      const fullPath = join(this.projectRoot, file)
      try {
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n')
        
        coverage[fullPath] = {
          path: fullPath,
          statementMap: {},
          fnMap: {},
          branchMap: {},
          s: {},
          f: {},
          b: {},
          l: Object.fromEntries(lines.map((_, i) => [i + 1, 0]))
        }
      } catch (error) {
        logger.warn(`Failed to process file ${file}`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    return { coverage }
  }

  private async processCoverageData(rawCoverage: any, options: any): Promise<FileCapture[]> {
    const files: FileCapture[] = []
    const coverageData = rawCoverage?.coverage || rawCoverage || {}

    for (const [filePath, fileData] of Object.entries(coverageData)) {
      if (typeof fileData !== 'object' || !fileData) continue

      const data = fileData as any
      const relativePath = relative(this.projectRoot, filePath)

      // Skip files based on options
      if (options.includeFiles && !options.includeFiles.some((pattern: string) => 
        relativePath.includes(pattern)
      )) continue

      if (options.excludeFiles && options.excludeFiles.some((pattern: string) => 
        relativePath.includes(pattern)
      )) continue

      const metrics = this.calculateFileMetrics(data)
      const uncoveredLines = this.extractUncoveredLines(data)
      const uncoveredFunctions = this.extractUncoveredFunctions(data)
      const hotspots = this.identifyHotspots(data, metrics)
      const complexity = this.calculateComplexity(filePath)
      const priority = this.determinePriority(metrics, complexity, hotspots.length)

      files.push({
        path: relativePath,
        metrics,
        uncoveredLines,
        uncoveredFunctions,
        hotspots,
        complexity,
        priority
      })
    }

    return files.sort((a, b) => {
      // Sort by priority, then by coverage percentage
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) return bPriority - aPriority
      return a.metrics.lines.percentage - b.metrics.lines.percentage
    })
  }

  private calculateFileMetrics(data: any): CoverageMetrics {
    const lines = this.calculateCoverageMetric(data.l || {})
    const statements = this.calculateCoverageMetric(data.s || {})
    const functions = this.calculateCoverageMetric(data.f || {})
    const branches = this.calculateCoverageMetric(data.b || {})

    return { lines, statements, functions, branches }
  }

  private calculateCoverageMetric(coverageMap: Record<string, number>): {
    total: number
    covered: number
    uncovered: number
    percentage: number
  } {
    const entries = Object.values(coverageMap)
    const total = entries.length
    const covered = entries.filter(count => count > 0).length
    const uncovered = total - covered
    const percentage = total > 0 ? Math.round((covered / total) * 100) : 0

    return { total, covered, uncovered, percentage }
  }

  private extractUncoveredLines(data: any): number[] {
    if (!data.l) return []
    
    return Object.entries(data.l)
      .filter(([_, count]) => (count as number) === 0)
      .map(([line]) => parseInt(line))
  }

  private extractUncoveredFunctions(data: any): string[] {
    if (!data.fnMap || !data.f) return []
    
    return Object.entries(data.f)
      .filter(([_, count]) => (count as number) === 0)
      .map(([id]) => data.fnMap[id]?.name || `function_${id}`)
  }

  private identifyHotspots(data: any, metrics: CoverageMetrics): Array<{
    line: number
    type: 'critical' | 'important' | 'normal'
    reason: string
  }> {
    const hotspots: Array<{ line: number, type: 'critical' | 'important' | 'normal', reason: string }> = []

    // Critical: uncovered functions with branches
    if (data.fnMap && data.f && data.branchMap) {
      for (const [fnId, count] of Object.entries(data.f)) {
        if ((count as number) === 0) {
          const fnInfo = data.fnMap[fnId]
          if (fnInfo && this.hasBranches(fnId, data.branchMap)) {
            hotspots.push({
              line: fnInfo.loc?.start?.line || 0,
              type: 'critical',
              reason: 'Uncovered function with branching logic'
            })
          }
        }
      }
    }

    // Important: lines with high execution but no coverage
    if (data.l) {
      for (const [line, count] of Object.entries(data.l)) {
        if ((count as number) === 0) {
          hotspots.push({
            line: parseInt(line),
            type: 'important',
            reason: 'Uncovered line in production code'
          })
        }
      }
    }

    return hotspots
  }

  private hasBranches(functionId: string, branchMap: any): boolean {
    return Object.values(branchMap).some((branch: any) => 
      branch.fnId === functionId || branch.line >= (parseInt(functionId) - 5)
    )
  }

  private calculateComplexity(filePath: string): number {
    try {
      if (!existsSync(filePath)) return 1

      const content = readFileSync(filePath, 'utf-8')
      
      // Simple complexity calculation based on control flow statements
      const complexityPatterns = [
        /if\s*\(/g,
        /else\s*if/g,
        /while\s*\(/g,
        /for\s*\(/g,
        /switch\s*\(/g,
        /catch\s*\(/g,
        /&&|\|\|/g,
        /\?\s*.*\s*:/g // ternary operator
      ]

      let complexity = 1 // Base complexity
      
      for (const pattern of complexityPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          complexity += matches.length
        }
      }

      return Math.min(complexity, 10) // Cap at 10
    } catch (error) {
      logger.warn('Failed to calculate complexity', { filePath, error: (error as Error).message })
      return 1
    }
  }

  private determinePriority(metrics: CoverageMetrics, complexity: number, hotspotsCount: number): 'high' | 'medium' | 'low' {
    const score = 
      (100 - metrics.lines.percentage) * 0.4 + // Coverage gap weight
      complexity * 5 + // Complexity weight  
      hotspotsCount * 10 // Hotspots weight

    if (score > 50 || metrics.lines.percentage < 60) return 'high'
    if (score > 25 || metrics.lines.percentage < 80) return 'medium'
    return 'low'
  }

  private calculateOverallMetrics(files: FileCapture[]): CoverageMetrics {
    if (files.length === 0) {
      return {
        lines: { total: 0, covered: 0, uncovered: 0, percentage: 0 },
        functions: { total: 0, covered: 0, uncovered: 0, percentage: 0 },
        branches: { total: 0, covered: 0, uncovered: 0, percentage: 0 },
        statements: { total: 0, covered: 0, uncovered: 0, percentage: 0 }
      }
    }

    const totals = files.reduce((acc, file) => ({
      lines: {
        total: acc.lines.total + file.metrics.lines.total,
        covered: acc.lines.covered + file.metrics.lines.covered
      },
      functions: {
        total: acc.functions.total + file.metrics.functions.total,
        covered: acc.functions.covered + file.metrics.functions.covered
      },
      branches: {
        total: acc.branches.total + file.metrics.branches.total,
        covered: acc.branches.covered + file.metrics.branches.covered
      },
      statements: {
        total: acc.statements.total + file.metrics.statements.total,
        covered: acc.statements.covered + file.metrics.statements.covered
      }
    }), {
      lines: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      statements: { total: 0, covered: 0 }
    })

    return {
      lines: {
        total: totals.lines.total,
        covered: totals.lines.covered,
        uncovered: totals.lines.total - totals.lines.covered,
        percentage: totals.lines.total > 0 ? Math.round((totals.lines.covered / totals.lines.total) * 100) : 0
      },
      functions: {
        total: totals.functions.total,
        covered: totals.functions.covered,
        uncovered: totals.functions.total - totals.functions.covered,
        percentage: totals.functions.total > 0 ? Math.round((totals.functions.covered / totals.functions.total) * 100) : 0
      },
      branches: {
        total: totals.branches.total,
        covered: totals.branches.covered,
        uncovered: totals.branches.total - totals.branches.covered,
        percentage: totals.branches.total > 0 ? Math.round((totals.branches.covered / totals.branches.total) * 100) : 0
      },
      statements: {
        total: totals.statements.total,
        covered: totals.statements.covered,
        uncovered: totals.statements.total - totals.statements.covered,
        percentage: totals.statements.total > 0 ? Math.round((totals.statements.covered / totals.statements.total) * 100) : 0
      }
    }
  }

  private async performGapAnalysis(files: FileCapture[]): Promise<TestGapAnalysis> {
    const highPriorityFiles = files.filter(f => f.priority === 'high').map(f => f.path)
    const criticalGaps = files.filter(f => 
      f.metrics.lines.percentage < 50 || 
      f.hotspots.filter(h => h.type === 'critical').length > 0
    ).length

    const overall = this.calculateOverallMetrics(files)
    const target = 85 // Target coverage percentage

    const suggestedTests = this.generateTestSuggestions(files)

    return {
      totalGaps: files.filter(f => f.metrics.lines.percentage < this.coverageThresholds.lines).length,
      criticalGaps,
      highPriorityFiles,
      suggestedTests,
      coverageGoals: {
        currentOverall: overall.lines.percentage,
        targetOverall: target,
        improveBy: Math.max(0, target - overall.lines.percentage)
      }
    }
  }

  private generateTestSuggestions(files: FileCapture[]): Array<{
    file: string
    testType: 'unit' | 'integration' | 'e2e'
    description: string
    priority: 'high' | 'medium' | 'low'
    estimatedEffort: 'low' | 'medium' | 'high'
  }> {
    const suggestions: Array<{
      file: string
      testType: 'unit' | 'integration' | 'e2e'
      description: string
      priority: 'high' | 'medium' | 'low'
      estimatedEffort: 'low' | 'medium' | 'high'
    }> = []

    for (const file of files.slice(0, 10)) { // Top 10 files
      if (file.metrics.lines.percentage < 70) {
        const testType = this.determineTestType(file)
        const effort = file.complexity > 7 ? 'high' : file.complexity > 4 ? 'medium' : 'low'
        
        suggestions.push({
          file: file.path,
          testType,
          description: `Add ${testType} tests for ${file.uncoveredFunctions.length} uncovered functions`,
          priority: file.priority,
          estimatedEffort: effort
        })
      }
    }

    return suggestions
  }

  private determineTestType(file: FileCapture): 'unit' | 'integration' | 'e2e' {
    const path = file.path.toLowerCase()
    
    if (path.includes('api') || path.includes('controller') || path.includes('route')) {
      return 'integration'
    }
    
    if (path.includes('component') || path.includes('page') || path.includes('e2e')) {
      return 'e2e'
    }
    
    return 'unit'
  }

  private async generateRecommendations(files: FileCapture[], gapAnalysis: TestGapAnalysis): Promise<Array<{
    type: 'generate_test' | 'improve_existing' | 'refactor_code' | 'add_integration_test'
    target: string
    description: string
    impact: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
  }>> {
    const recommendations: Array<{
      type: 'generate_test' | 'improve_existing' | 'refactor_code' | 'add_integration_test'
      target: string
      description: string
      impact: 'high' | 'medium' | 'low'
      effort: 'low' | 'medium' | 'high'
    }> = []

    // High-impact recommendations first
    for (const file of files.filter(f => f.priority === 'high').slice(0, 5)) {
      if (file.metrics.lines.percentage < 50) {
        recommendations.push({
          type: 'generate_test',
          target: file.path,
          description: `Generate comprehensive test suite - only ${file.metrics.lines.percentage}% covered`,
          impact: 'high',
          effort: file.complexity > 7 ? 'high' : 'medium'
        })
      }

      if (file.complexity > 8) {
        recommendations.push({
          type: 'refactor_code',
          target: file.path,
          description: `Consider refactoring to reduce complexity (current: ${file.complexity})`,
          impact: 'medium',
          effort: 'high'
        })
      }
    }

    // Integration test recommendations
    const apiFiles = files.filter(f => f.path.includes('api') || f.path.includes('controller'))
    if (apiFiles.length > 0 && apiFiles.every(f => f.metrics.lines.percentage < 80)) {
      recommendations.push({
        type: 'add_integration_test',
        target: 'API layer',
        description: 'Add integration tests to cover API endpoints and controller logic',
        impact: 'high',
        effort: 'medium'
      })
    }

    return recommendations
  }

  private async calculateTrends(files: FileCapture[]): Promise<{
    coverageChange: number
    qualityScore: number
    testHealthScore: number
  }> {
    // For now, calculate based on current state
    // TODO: Implement historical trend tracking
    const overall = this.calculateOverallMetrics(files)
    
    return {
      coverageChange: 0, // Would track from previous runs
      qualityScore: Math.round(
        (overall.lines.percentage * 0.4 + 
         overall.functions.percentage * 0.3 + 
         overall.branches.percentage * 0.3)
      ),
      testHealthScore: files.filter(f => f.priority !== 'high').length / Math.max(files.length, 1) * 100
    }
  }

  private async generateVisualReport(result: CoverageAnalysisResult): Promise<void> {
    const reportPath = join(this.projectRoot, 'coverage-analysis-report.json')
    
    try {
      writeFileSync(reportPath, JSON.stringify(result, null, 2))
      logger.info('Coverage analysis report generated', { reportPath })
    } catch (error) {
      logger.warn('Failed to generate report file', error instanceof Error ? error : new Error(String(error)))
    }
  }

  private determineTestTimingStrategy(score: number, taskDescription: string, factors: Array<any>): TestTimingStrategy {
    let mode: 'tdd' | 'traditional' | 'incremental'
    let generateAt: 'planning' | 'implementation' | 'completion'
    let testTypes: Array<'unit' | 'integration' | 'e2e'>
    let priority: 'immediate' | 'next_phase' | 'future'

    if (score >= 8) {
      // High complexity - TDD approach
      mode = 'tdd'
      generateAt = 'planning'
      testTypes = ['unit', 'integration']
      priority = 'immediate'
    } else if (score >= 6) {
      // Medium complexity - incremental approach
      mode = 'incremental'
      generateAt = 'implementation'
      testTypes = ['unit']
      priority = 'next_phase'
    } else {
      // Low complexity - traditional approach
      mode = 'traditional'
      generateAt = 'completion'
      testTypes = ['unit']
      priority = 'future'
    }

    // Adjust based on specific factors
    const hasAsyncFactors = factors.some(f => f.factor.includes('async') || f.factor.includes('API'))
    if (hasAsyncFactors) {
      testTypes.push('integration')
    }

    const reasoning = this.generateTestTimingReasoning(score, mode, factors)

    return { mode, generateAt, testTypes, priority, reasoning }
  }

  private generateTestTimingReasoning(score: number, mode: string, factors: Array<any>): string {
    const mainFactors = factors
      .filter(f => f.contribution > 1)
      .map(f => f.factor)
      .slice(0, 3)

    let reasoning = `Based on complexity score ${score}/10, recommending ${mode.toUpperCase()} approach. `
    
    if (mainFactors.length > 0) {
      reasoning += `Key factors: ${mainFactors.join(', ')}. `
    }

    switch (mode) {
      case 'tdd':
        reasoning += 'High complexity requires test-first development to ensure correctness.'
        break
      case 'incremental':
        reasoning += 'Medium complexity benefits from incremental test development alongside implementation.'
        break
      case 'traditional':
        reasoning += 'Low complexity allows for traditional test-after development.'
        break
    }

    return reasoning
  }

  private generateCoverageSuggestions(file: FileCapture, impact: 'positive' | 'negative' | 'neutral'): string[] {
    const suggestions: string[] = []

    if (impact === 'negative') {
      suggestions.push(`Coverage decreased for ${file.path}`)
      if (file.uncoveredLines.length > 0) {
        suggestions.push(`Focus on lines: ${file.uncoveredLines.slice(0, 5).join(', ')}`)
      }
      if (file.uncoveredFunctions.length > 0) {
        suggestions.push(`Test functions: ${file.uncoveredFunctions.slice(0, 3).join(', ')}`)
      }
    } else if (impact === 'positive') {
      suggestions.push(`Great! Coverage improved for ${file.path}`)
      if (file.metrics.lines.percentage >= 90) {
        suggestions.push('Excellent coverage level achieved!')
      }
    }

    return suggestions
  }
}

export type { 
  CoverageAnalysisResult,
  TestTimingStrategy,
  TaskComplexityAnalysis,
  FileCapture,
  TestGapAnalysis
}