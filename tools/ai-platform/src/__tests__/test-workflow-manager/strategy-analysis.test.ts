/**
 * Test Workflow Manager - AI驱动的测试策略分析测试
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { TestWorkflowManager, type TestWorkflowContext } from '../../workflow/test-workflow-manager'

const mockAIProvider = {
  getName: mock(() => 'test-ai-provider'),
  getId: mock(() => 'test-ai-id'),
  isAvailable: mock(() => Promise.resolve(true)),
  generateResponse: mock(() => Promise.resolve({ data: {} }))
}

const mockStrategyEngine = {
  analyzeTestStrategy: mock(() => Promise.resolve({
    primaryStrategy: 'tdd',
    secondaryStrategies: ['bdd'],
    confidence: 0.85,
    reasoning: ['High complexity requires TDD approach'],
    resourceAllocation: { unitTests: 70, integrationTests: 20, e2eTests: 8, performanceTests: 2 },
    prioritization: [
      { phase: 'unit', priority: 1, estimatedHours: 4 },
      { phase: 'integration', priority: 2, estimatedHours: 2 }
    ],
    estimatedEffort: { hours: 8, complexity: 'moderate' }
  }))
}

describe('TestWorkflowManager - AI驱动的测试策略分析', () => {
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    Object.values(mockAIProvider).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear()
      }
    })
    Object.values(mockStrategyEngine).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear()
      }
    })

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      ;(workflowManager as any).strategyEngine = mockStrategyEngine
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    // 清理所有mock和资源
    [mockAIProvider, mockStrategyEngine].forEach(mockObj => {
      Object.values(mockObj).forEach(mockFn => {
        if (typeof mockFn === 'function' && 'mockRestore' in mockFn) {
          mockFn.mockRestore()
        }
      })
    })
    
    if (workflowManager && typeof workflowManager === 'object') {
      Object.keys(workflowManager).forEach(key => {
        ;(workflowManager as any)[key] = null
      })
    }
    workflowManager = null as any
    
    delete process.env.GEMINI_API_KEY
    if (global.gc) global.gc()
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  const context: TestWorkflowContext = {
    taskDescription: 'Complex payment processing system',
    testType: 'integration',
    targetFiles: [] // Empty to avoid file system access
  }

  it('应该执行完整的策略分析', async () => {
    const result = await workflowManager.analyzeTestStrategy(context)
    
    expect(result).toBeDefined()
    expect(result.strategyDecision).toBeDefined()
    expect(result.timingAnalysis).toBeDefined()
    expect(result.integration).toBeDefined()
    
    expect(result.strategyDecision.primaryStrategy).toBe('tdd')
    expect(result.strategyDecision.confidence).toBeGreaterThan(0.8)
    expect(result.integration.selectedStrategy).toBeDefined()
  })

  it('应该正确推断策略因子', async () => {
    const contextWithFactors: TestWorkflowContext = {
      ...context,
      strategyFactors: {
        complexity: 8,
        businessImpact: 9,
        riskLevel: 7,
        currentCoverage: 60,
        changeFrequency: 5,
        teamExperience: 7
      }
    }

    const result = await workflowManager.analyzeTestStrategy(contextWithFactors)
    expect(mockStrategyEngine.analyzeTestStrategy).toHaveBeenCalledWith(
      contextWithFactors.strategyFactors,
      expect.any(Object),
      contextWithFactors.targetFiles
    )
  })

  it('应该处理策略引擎失败 - 使用回退分析', async () => {
    mockStrategyEngine.analyzeTestStrategy.mockRejectedValueOnce(new Error('Strategy engine failed'))

    const result = await workflowManager.analyzeTestStrategy(context)
    expect(result.strategyDecision.primaryStrategy).toBe('traditional')
    expect(result.integration.confidence).toBe(0.6)
  })
})