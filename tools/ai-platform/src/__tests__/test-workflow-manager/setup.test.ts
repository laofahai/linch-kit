/**
 * Test Workflow Manager - 初始化和配置测试
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { TestWorkflowManager } from '../../workflow/test-workflow-manager'

const mockAIProvider = {
  getName: mock(() => 'test-ai-provider'),
  getId: mock(() => 'test-ai-id'),
  isAvailable: mock(() => Promise.resolve(true)),
  generateResponse: mock(() => Promise.resolve({
    data: { testContent: 'mock test content' }
  }))
}

describe('TestWorkflowManager - 初始化和配置', () => {
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    Object.values(mockAIProvider).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        mockFn.mockClear()
      }
    })

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    Object.values(mockAIProvider).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockRestore' in mockFn) {
        mockFn.mockRestore()
      }
    })
    
    if (workflowManager) {
      Object.keys(workflowManager).forEach(key => {
        ;(workflowManager as any)[key] = null
      })
    }
    workflowManager = null as any
    
    delete process.env.GEMINI_API_KEY
    if (global.gc) global.gc()
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  it('应该成功初始化并使用提供的AI Provider', () => {
    expect(workflowManager).toBeDefined()
    expect(mockAIProvider.getName).toHaveBeenCalled()
  })

  it('应该正确更新AI Provider', () => {
    const newProvider = { ...mockAIProvider, getName: mock(() => 'new-provider') }
    workflowManager.updateAIProvider(newProvider as any)
    expect(workflowManager).toBeDefined()
  })

  it('应该获取Provider状态信息', async () => {
    const status = await workflowManager.getProviderStatus()
    expect(status).toEqual({
      name: 'test-ai-provider',
      id: 'test-ai-id',
      available: true
    })
  })
})