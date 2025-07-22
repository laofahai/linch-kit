/**
 * Test Workflow Manager - 智能测试运行测试
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { TestWorkflowManager } from '../../workflow/test-workflow-manager'

const mockAIProvider = {
  getName: mock(() => 'test-ai-provider'),
  getId: mock(() => 'test-ai-id'),
  isAvailable: mock(() => Promise.resolve(false)), // Test unavailable case
  generateResponse: mock(() => Promise.resolve({ data: {} }))
}

describe('TestWorkflowManager - 智能测试运行', () => {
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    Object.values(mockAIProvider).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear()
      }
    })

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      // Mock the executeTests method to avoid real test execution
      ;(workflowManager as any).executeTests = mock(() => Promise.resolve({
        success: true,
        passed: 10,
        failed: 0,
        coverage: { lines: 85, functions: 90 }
      }))
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(() => {
    workflowManager = null as any
    if (global.gc) global.gc()
  })

  it('应该执行基本测试运行', async () => {
    const result = await workflowManager.runIntelligentTests({
      testType: 'unit',
      coverage: true
    })
    
    expect(result).toBeDefined()
    expect(result.results).toBeDefined()
    expect(result.recommendations).toBeDefined()
    expect(Array.isArray(result.recommendations)).toBe(true)
  })

  it('应该支持AI分析结果', async () => {
    const result = await workflowManager.runIntelligentTests({
      testType: 'all',
      aiAnalysis: true
    })
    
    expect(result.analysis).toBeDefined()
    expect(result.analysis.status).toBeDefined()
  })

  it('应该处理测试失败情况', async () => {
    // Override the mocked executeTests to simulate failure
    ;(workflowManager as any).executeTests = mock(() => Promise.resolve({
      success: false,
      errors: 'Test execution failed'
    }))

    const result = await workflowManager.runIntelligentTests({ testType: 'unit' })
    expect(result.recommendations).toContain('修复失败的测试用例')
  })

  it('应该处理AI Provider不可用', async () => {
    const status = await workflowManager.getProviderStatus()
    expect(status.available).toBe(false)
  })
})