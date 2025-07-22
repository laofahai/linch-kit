/**
 * Test Workflow Manager - 测试工作流执行测试
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
    recommendation: { mode: 'traditional', generateAt: 'completion' }
  })),
  analyzeCoverage: mock(() => Promise.resolve({
    overall: { 
      lines: { total: 100, covered: 70, percentage: 70 },
      functions: { total: 20, covered: 15, percentage: 75 },
      branches: { total: 50, covered: 35, percentage: 70 },
      statements: { total: 120, covered: 84, percentage: 70 }
    },
    files: [],
    gapAnalysis: { totalGaps: 5, criticalGaps: 2 },
    recommendations: ['Improve error handling tests'],
    trends: { coverageChange: 5, qualityScore: 80 },
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }))
}

const mockQueryEngine = {
  searchRelated: mock(() => Promise.resolve({
    relatedItems: [],
    patterns: [],
    suggestions: []
  }))
}

describe('TestWorkflowManager - 测试工作流执行', () => {
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    [mockAIProvider, mockCoverageAnalyzer, mockQueryEngine].forEach(mockObj => {
      Object.values(mockObj).forEach(mockFn => {
        if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
          mockFn.mockClear()
        }
      })
    })

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      ;(workflowManager as any).coverageAnalyzer = mockCoverageAnalyzer
      ;(workflowManager as any).queryEngine = mockQueryEngine
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(() => {
    workflowManager = null as any
    if (global.gc) global.gc()
  })

  const context: TestWorkflowContext = {
    taskDescription: 'User management API',
    testType: 'unit',
    coverageThreshold: { lines: 85, functions: 90, branches: 80, statements: 85 }
  }

  it('应该执行完整的测试工作流', async () => {
    const result = await workflowManager.executeTestWorkflow(context)
    
    expect(result).toBeDefined()
    expect(result.analysis).toBeDefined()
    expect(result.recommendations).toBeDefined()
    expect(result.nextActions).toBeDefined()
    expect(result.timingControl).toBeDefined()
    
    expect(result.analysis.currentCoverage).toBeDefined()
    expect(result.analysis.testGaps).toBeDefined()
    expect(result.analysis.existingTests).toBeDefined()
  })

  it('应该集成时机控制到工作流中', async () => {
    const result = await workflowManager.executeTestWorkflow(context)
    
    expect(result.timingControl).toBeDefined()
    expect(result.timingControl!.strategy).toBeDefined()
    expect(result.timingControl!.recommendation).toMatch(/generate_now|generate_later|incremental|skip/)
    
    expect(Array.isArray(result.nextActions)).toBe(true)
    expect(result.nextActions.length).toBeGreaterThan(0)
  })

  it('应该处理无效的覆盖率阈值', async () => {
    const invalidContext: TestWorkflowContext = {
      taskDescription: 'Test task',
      testType: 'unit',
      coverageThreshold: { lines: -1, functions: 150, branches: -10, statements: 200 }
    }

    const result = await workflowManager.executeTestWorkflow(invalidContext)
    expect(result).toBeDefined()
  })
})