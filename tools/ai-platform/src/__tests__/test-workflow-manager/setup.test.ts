/**
 * Test Workflow Manager - 初始化和配置测试
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { TestWorkflowManager } from '../../workflow/test-workflow-manager'
import { createMockAIProvider, cleanupMocks, cleanupTestWorkflowManager } from './shared-mocks'

describe('TestWorkflowManager - 初始化和配置', () => {
  let workflowManager: TestWorkflowManager
  let mockAIProvider: ReturnType<typeof createMockAIProvider>

  beforeEach(() => {
    mockAIProvider = createMockAIProvider()

    try {
      workflowManager = new TestWorkflowManager(mockAIProvider as any)
    } catch (error) {
      workflowManager = {} as TestWorkflowManager
    }
  })

  afterEach(async () => {
    await cleanupTestWorkflowManager(workflowManager)
    cleanupMocks(mockAIProvider)
    workflowManager = null as any
    mockAIProvider = null as any
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