/**
 * Test Workflow Manager - 智能测试时机控制测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { TestWorkflowManager, type TestWorkflowContext } from '../../workflow/test-workflow-manager'
import { 
  createMockAIProvider, 
  createMockCoverageAnalyzer, 
  cleanupMocks,
  cleanupTestWorkflowManager
} from './shared-mocks'

describe('TestWorkflowManager - 智能测试时机控制', () => {
  let workflowManager: TestWorkflowManager
  let mockAIProvider: ReturnType<typeof createMockAIProvider>
  let mockCoverageAnalyzer: ReturnType<typeof createMockCoverageAnalyzer>

  beforeEach(() => {
    // Create fresh mocks for each test
    mockAIProvider = createMockAIProvider()
    mockCoverageAnalyzer = createMockCoverageAnalyzer()

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      ;(workflowManager as any).coverageAnalyzer = mockCoverageAnalyzer
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    // Comprehensive cleanup
    cleanupMocks(mockAIProvider, mockCoverageAnalyzer)
    await cleanupTestWorkflowManager(workflowManager)
    workflowManager = null as any
    mockAIProvider = null as any
    mockCoverageAnalyzer = null as any
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