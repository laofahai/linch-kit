/**
 * Test Workflow Manager - AI测试生成测试
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { TestWorkflowManager } from '../../workflow/test-workflow-manager'
import { createMockAIProvider, createMockQueryEngine, cleanupMocks, cleanupTestWorkflowManager } from './shared-mocks'

describe('TestWorkflowManager - AI测试生成', () => {
  let workflowManager: TestWorkflowManager
  let mockAIProvider: ReturnType<typeof createMockAIProvider>
  let mockQueryEngine: ReturnType<typeof createMockQueryEngine>

  beforeEach(() => {
    mockAIProvider = createMockAIProvider()
    mockQueryEngine = createMockQueryEngine()

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
      ;(workflowManager as any).queryEngine = mockQueryEngine
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    await cleanupTestWorkflowManager(workflowManager)
    cleanupMocks(mockAIProvider, mockQueryEngine)
    workflowManager = null as any
    mockAIProvider = null as any
    mockQueryEngine = null as any
  })

  const request = {
    sourceFile: 'src/utils.ts',
    testType: 'unit' as const,
    testFramework: 'bun' as const,
    mockingNeeds: [
      { dependency: 'fs', type: 'full' as const }
    ],
    edgeCases: ['empty input', 'invalid format'],
    businessRules: ['must validate input', 'should handle errors']
  }

  it('应该成功生成测试代码', async () => {
    const result = await workflowManager.generateTests(request)
    
    expect(result).toBeDefined()
    expect(result.testFile).toContain('__tests__')
    expect(result.testFile).toContain('utils.test.ts')
    expect(result.testContent).toBe('mock test content')
    expect(result.coverage.expectedLines).toBe(90)
    
    expect(mockAIProvider.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.3,
        schema: expect.any(Object)
      })
    )
  })

  it('应该查询相似测试模式', async () => {
    await workflowManager.generateTests(request)
    
    expect(mockQueryEngine.searchRelated).toHaveBeenCalledWith(
      expect.stringContaining('test patterns for'),
      expect.objectContaining({
        includeTests: true,
        maxResults: 5
      })
    )
  })

  it('应该处理AI生成失败', async () => {
    mockAIProvider.generateResponse.mockRejectedValueOnce(new Error('AI generation failed'))
    
    await expect(workflowManager.generateTests(request)).rejects.toThrow('AI generation failed')
  })
})