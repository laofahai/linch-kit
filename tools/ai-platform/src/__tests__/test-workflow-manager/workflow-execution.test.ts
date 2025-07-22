/**
 * Test Workflow Manager - 测试工作流执行测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { TestWorkflowManager, type TestWorkflowContext } from '../../workflow/test-workflow-manager'
import { 
  createMockAIProvider, 
  createMockCoverageAnalyzer, 
  createMockQueryEngine,
  cleanupMocks,
  cleanupTestWorkflowManager
} from './shared-mocks'

describe('TestWorkflowManager - 测试工作流执行', () => {
  let workflowManager: TestWorkflowManager
  let mockAIProvider: ReturnType<typeof createMockAIProvider>
  let mockCoverageAnalyzer: ReturnType<typeof createMockCoverageAnalyzer>
  let mockQueryEngine: ReturnType<typeof createMockQueryEngine>

  beforeEach(() => {
    // Create fresh mocks for each test
    mockAIProvider = createMockAIProvider()
    mockCoverageAnalyzer = createMockCoverageAnalyzer()
    mockQueryEngine = createMockQueryEngine()

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      ;(workflowManager as any).coverageAnalyzer = mockCoverageAnalyzer
      ;(workflowManager as any).queryEngine = mockQueryEngine
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    // Comprehensive cleanup
    cleanupMocks(mockAIProvider, mockCoverageAnalyzer, mockQueryEngine)
    await cleanupTestWorkflowManager(workflowManager)
    workflowManager = null as any
    mockAIProvider = null as any
    mockCoverageAnalyzer = null as any
    mockQueryEngine = null as any
  })

  const context: TestWorkflowContext = {
    taskDescription: 'User management API',
    testType: 'unit',
    coverageThreshold: { lines: 85, functions: 90, branches: 80, statements: 85 },
    targetFiles: [] // Empty array to prevent file system reads
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