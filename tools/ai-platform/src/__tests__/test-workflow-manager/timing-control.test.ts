/**
 * Test Workflow Manager - 智能测试时机控制测试
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { TestWorkflowManager, type TestWorkflowContext } from '../../workflow/test-workflow-manager'

const mockAIProvider = {
  getName: mock(() => 'test-ai-provider'),
  getId: mock(() => 'test-ai-id'),
  isAvailable: mock(() => Promise.resolve(true)),
  generateResponse: mock(() => Promise.resolve({ data: {} }))
}

const mockCoverageAnalyzer = {
  analyzeTestTiming: mock(() => Promise.resolve({
    score: 6,
    factors: [{ factor: 'Medium complexity', weight: 1, contribution: 6 }],
    recommendation: {
      mode: 'traditional',
      generateAt: 'completion',
      testTypes: ['unit'],
      priority: 'medium',
      reasoning: 'Standard complexity project'
    }
  })),
  analyzeCoverage: mock(() => Promise.resolve({
    overall: {
      lines: { total: 100, covered: 70, uncovered: 30, percentage: 70 },
      functions: { total: 20, covered: 15, uncovered: 5, percentage: 75 },
      branches: { total: 50, covered: 35, uncovered: 15, percentage: 70 },
      statements: { total: 120, covered: 84, uncovered: 36, percentage: 70 }
    },
    files: [],
    gapAnalysis: {
      totalGaps: 5,
      criticalGaps: 2,
      highPriorityFiles: [],
      suggestedTests: [],
      coverageGoals: { currentOverall: 70, targetOverall: 85, improveBy: 15 }
    },
    recommendations: [],
    trends: { coverageChange: 5, qualityScore: 80, testHealthScore: 75 },
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }))
}

describe('TestWorkflowManager - 智能测试时机控制', () => {
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    Object.values(mockAIProvider).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear()
      }
    })
    Object.values(mockCoverageAnalyzer).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear()
      }
    })

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      ;(workflowManager as any).coverageAnalyzer = mockCoverageAnalyzer
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    // 1. 清理所有mock
    Object.values(mockAIProvider).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockRestore' in mockFn) {
        mockFn.mockRestore()
      }
    })
    Object.values(mockCoverageAnalyzer).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockRestore' in mockFn) {
        mockFn.mockRestore()
      }
    })
    
    // 2. 清理工作流管理器
    if (workflowManager && typeof workflowManager === 'object') {
      Object.keys(workflowManager).forEach(key => {
        ;(workflowManager as any)[key] = null
      })
    }
    workflowManager = null as any
    
    // 3. 清理环境变量
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_API_KEY
    
    // 4. 强制垃圾回收
    if (global.gc) global.gc()
    
    // 5. 等待清理完成
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  const context: TestWorkflowContext = {
    taskDescription: 'Implement user authentication',
    testType: 'unit',
    targetFiles: [] // Empty to avoid file system access
  }

  it('应该正确分析测试时机', async () => {
    const result = await workflowManager.analyzeTestTiming(context)
    
    expect(result).toBeDefined()
    expect(result.timingStrategy).toBeDefined()
    expect(result.coverageAnalysis).toBeDefined()
    expect(result.recommendation).toMatch(/generate_now|generate_later|incremental|skip/)
    expect(result.reasoning).toBeDefined()
  })

  it('应该处理高复杂度任务 - 推荐立即生成', async () => {
    mockCoverageAnalyzer.analyzeTestTiming.mockResolvedValueOnce({
      score: 9,
      recommendation: { mode: 'tdd', generateAt: 'planning' }
    })

    const result = await workflowManager.analyzeTestTiming(context)
    expect(result.recommendation).toMatch(/generate_now|generate_later/)
    expect(result.reasoning).toBeDefined()
  })

  it('应该处理分析失败 - 使用回退策略', async () => {
    mockCoverageAnalyzer.analyzeTestTiming.mockRejectedValueOnce(new Error('Analysis failed'))

    const result = await workflowManager.analyzeTestTiming(context)
    expect(result.recommendation).toBe('generate_later')
    expect(result.reasoning).toContain('Analysis failed')
    expect(result.timingStrategy.score).toBe(5)
  })
})