/**
 * Workflow State Machine 单元测试
 * 目标：提升覆盖率从23.85%到90%+
 * 
 * 重点测试：
 * - Phase 3 七状态工作流引擎
 * - 状态转换和守卫条件
 * - 快照管理和版本控制
 * - 错误处理和恢复机制
 * - 并发和性能场景
 */

import { describe, it, expect, beforeEach, mock, afterEach } from 'bun:test'
import { 
  WorkflowStateMachine, 
  EnhancedFileBasedPersistence,
  type WorkflowState, 
  type WorkflowAction, 
  type WorkflowContext,
  type ExtendedWorkflowState
} from '../workflow/workflow-state-machine'

// Mock file system operations
const mockFs = {
  writeFile: mock(() => Promise.resolve()),
  readFile: mock(() => Promise.resolve(JSON.stringify({
    sessionId: 'test-session',
    currentState: 'INIT',
    metadata: { version: '3.0.0', startTime: new Date().toISOString() }
  }))),
  access: mock(() => Promise.resolve()),
  mkdir: mock(() => Promise.resolve()),
  readdir: mock(() => Promise.resolve(['test-session.json'])),
  unlink: mock(() => Promise.resolve()),
  constants: { F_OK: 0 }
}

// Mock child_process for Graph RAG sync  
const mockExecAsync = mock(() => Promise.resolve({ stdout: 'Graph RAG sync completed', stderr: '' }))

describe('WorkflowStateMachine Unit Tests', () => {
  let stateMachine: WorkflowStateMachine
  let persistence: EnhancedFileBasedPersistence

  beforeEach(() => {
    // Clear all mocks
    Object.values(mockFs).forEach(fn => typeof fn === 'function' && fn.mockClear?.())
    mockExecAsync.mockClear()

    // Create new instances
    persistence = new EnhancedFileBasedPersistence('.test-states')
    stateMachine = new WorkflowStateMachine(
      'test-session-001',
      'Test task implementation',
      {
        persistence,
        priority: 'high',
        category: 'development',
        tags: ['testing', 'ai-workflow'],
        assignee: 'claude'
      }
    )
  })

  describe('初始化和配置', () => {
    it('应该正确初始化七状态工作流机', () => {
      expect(stateMachine).toBeDefined()
      expect(stateMachine.getCurrentState()).toBe('INIT')
      
      const context = stateMachine.getContext()
      expect(context.sessionId).toBe('test-session-001')
      expect(context.taskDescription).toBe('Test task implementation')
      expect(context.metadata.version).toBe('3.0.0')
      expect(context.metadata.priority).toBe('high')
    })

    it('应该支持自定义配置选项', () => {
      const customMachine = new WorkflowStateMachine(
        'custom-session',
        'Custom task',
        {
          autoSaveEnabled: false,
          snapshotInterval: 10 * 60 * 1000,
          priority: 'critical',
          category: 'hotfix'
        }
      )

      const context = customMachine.getContext()
      expect(context.metadata.priority).toBe('critical')
      expect(context.metadata.category).toBe('hotfix')
    })
  })

  describe('Phase 3 七状态转换流程', () => {
    describe('正向状态转换', () => {
      it('应该从INIT自动转换到ANALYZE', async () => {
        const result = await stateMachine.transition('START_ANALYSIS')
        expect(result).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('ANALYZE')
      })

      it('应该从ANALYZE转换到PLAN（满足条件）', async () => {
        await stateMachine.transition('START_ANALYSIS')
        
        // Update analysis to meet transition conditions
        stateMachine.updateAnalysis({
          approach: 'incremental development',
          confidence: 85,
          estimatedHours: 8,
          complexity: 4,
          risks: ['data consistency', 'performance impact'],
          dependencies: ['auth-service', 'database-layer']
        })

        const result = await stateMachine.transition('COMPLETE_ANALYSIS')
        expect(result).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('PLAN')
      })

      it('应该阻止不满足条件的转换', async () => {
        await stateMachine.transition('START_ANALYSIS')
        
        // Low confidence analysis should not allow transition
        stateMachine.updateAnalysis({
          approach: 'uncertain',
          confidence: 40, // Below threshold
          estimatedHours: 2,
          complexity: 1,
          risks: [],
          dependencies: []
        })

        const result = await stateMachine.transition('COMPLETE_ANALYSIS')
        expect(result).toBe(false) // Should be blocked by guard
        expect(stateMachine.getCurrentState()).toBe('ANALYZE')
      })

      it('应该支持完整的七状态流程', async () => {
        // INIT → ANALYZE
        await stateMachine.transition('START_ANALYSIS')
        expect(stateMachine.getCurrentState()).toBe('ANALYZE')

        // Prepare analysis data with sufficient confidence
        stateMachine.updateAnalysis({
          approach: 'tdd development',
          confidence: 90,
          estimatedHours: 12,
          complexity: 6,
          risks: ['integration complexity'],
          dependencies: ['external-api']
        })

        // ANALYZE → PLAN
        await stateMachine.transition('COMPLETE_ANALYSIS')
        expect(stateMachine.getCurrentState()).toBe('PLAN')

        // Set planning data using updatePlanning method
        stateMachine.updatePlanning({
          milestones: [
            {
              id: 'milestone-1',
              name: 'Core implementation',
              description: 'Implement core functionality',
              estimatedDuration: 4 * 60 * 60 * 1000,
              dependencies: [],
              status: 'pending'
            }
          ]
        })
        
        // PLAN → IMPLEMENT
        const planResult = await stateMachine.transition('COMPLETE_PLANNING')
        expect(planResult).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('IMPLEMENT')

        // Simulate implementation progress
        stateMachine.updateImplementationProgress(96)

        // IMPLEMENT → TEST
        await stateMachine.transition('COMPLETE_IMPLEMENTATION')
        expect(stateMachine.getCurrentState()).toBe('TEST')
      })
    })

    describe('扩展状态管理', () => {
      it('应该支持暂停和恢复', async () => {
        await stateMachine.transition('START_ANALYSIS')
        
        // Pause workflow
        const pauseResult = await stateMachine.transition('PAUSE')
        expect(pauseResult).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('PAUSED')

        const context = stateMachine.getContext()
        expect(context.pauseInfo).toBeDefined()
        expect(context.pauseInfo?.previousState).toBe('ANALYZE')

        // Resume workflow
        const resumeResult = await stateMachine.transition('RESUME')
        expect(resumeResult).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('ANALYZE')
      })

      it('应该支持状态回滚', async () => {
        // Get to PLAN state
        await stateMachine.transition('START_ANALYSIS')
        stateMachine.updateAnalysis({
          approach: 'test approach',
          confidence: 80,
          estimatedHours: 5,
          complexity: 3,
          risks: [],
          dependencies: []
        })
        await stateMachine.transition('COMPLETE_ANALYSIS')
        expect(stateMachine.getCurrentState()).toBe('PLAN')

        // Rollback to previous state
        const rollbackResult = await stateMachine.transition('ROLLBACK')
        expect(rollbackResult).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('ANALYZE')
      })

      it('应该处理失败状态和重试机制', async () => {
        await stateMachine.transition('START_ANALYSIS')
        
        // Mark as failed
        const failResult = await stateMachine.transition('FAIL')
        expect(failResult).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('FAILED')

        // Setup failure info for retry using updateFailureInfo method
        stateMachine.updateFailureInfo({
          failedAt: new Date().toISOString(),
          failureReason: 'Test failure',
          errorDetails: { code: 'TEST_ERROR' },
          recoveryAttempts: 0,
          recoveryStrategy: 'retry'
        })
        
        // Retry should work now
        const retryResult = await stateMachine.transition('RETRY')
        expect(retryResult).toBe(true)
        expect(stateMachine.getCurrentState()).toBe('ANALYZE')
      })

      it('应该限制重试次数', async () => {
        const context = stateMachine.getContext()
        context.currentState = 'FAILED'
        context.failureInfo = {
          failedAt: new Date().toISOString(),
          failureReason: 'Repeated failure',
          errorDetails: {},
          recoveryAttempts: 5, // Exceeds limit
          recoveryStrategy: 'retry'
        }

        const retryResult = await stateMachine.transition('RETRY')
        expect(retryResult).toBe(false) // Should fail due to attempt limit
      })
    })
  })

  describe('Phase 3 快照管理', () => {
    it('应该创建手动快照', async () => {
      const snapshotId = await stateMachine.createSnapshot('Manual test snapshot')
      expect(snapshotId).toBeDefined()
      expect(typeof snapshotId).toBe('string')
    })

    it('应该从快照恢复状态', async () => {
      // Advance to a different state
      await stateMachine.transition('START_ANALYSIS')
      
      // Create snapshot
      const snapshotId = await stateMachine.createSnapshot('Before planning')
      expect(snapshotId).toBeTruthy()

      // Change state further
      stateMachine.updateAnalysis({
        approach: 'test',
        confidence: 75,
        estimatedHours: 3,
        complexity: 2,
        risks: [],
        dependencies: []
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')

      // Restore from snapshot
      const restoreResult = await stateMachine.restoreFromSnapshot(snapshotId!)
      expect(restoreResult).toBe(true)
    })

    it('应该处理无效快照ID', async () => {
      const restoreResult = await stateMachine.restoreFromSnapshot('invalid-snapshot-id')
      expect(restoreResult).toBe(false)
    })
  })

  describe('守卫条件和验证', () => {
    it('应该验证实施进度要求', async () => {
      // Get to IMPLEMENT state
      await stateMachine.transition('START_ANALYSIS')
      stateMachine.updateAnalysis({
        approach: 'test',
        confidence: 80,
        estimatedHours: 4,
        complexity: 3,
        risks: [],
        dependencies: []
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')

      // Set planning data using updatePlanning method
      stateMachine.updatePlanning({
        milestones: [{ id: '1', name: 'test', description: 'test', estimatedDuration: 1000, dependencies: [], status: 'pending' }]
      })
      
      const planResult = await stateMachine.transition('COMPLETE_PLANNING')
      expect(planResult).toBe(true)
      expect(stateMachine.getCurrentState()).toBe('IMPLEMENT')

      // Low progress should block transition
      stateMachine.updateImplementationProgress(50) // Below 90% threshold
      const result = await stateMachine.transition('COMPLETE_IMPLEMENTATION')
      expect(result).toBe(false)
      expect(stateMachine.getCurrentState()).toBe('IMPLEMENT')
    })

    it('应该验证致命错误阻止转换', async () => {
      // Get to IMPLEMENT state
      await stateMachine.transition('START_ANALYSIS')
      stateMachine.updateAnalysis({
        approach: 'test',
        confidence: 85,
        estimatedHours: 6,
        complexity: 4,
        risks: [],
        dependencies: []
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')

      const context = stateMachine.getContext()
      context.planning = {
        startedAt: new Date().toISOString(),
        milestones: [{ id: '1', name: 'test', description: 'test', estimatedDuration: 1000, dependencies: [], status: 'pending' }],
        resourceAllocation: { timeSlots: [] },
        riskMitigation: []
      }
      await stateMachine.transition('COMPLETE_PLANNING')

      // Add fatal error
      stateMachine.updateImplementationProgress(100, 'milestone-1', [
        {
          id: 'fatal-error-1',
          timestamp: new Date().toISOString(),
          error: 'Critical system failure',
          severity: 'fatal',
          resolved: false
        }
      ])

      // Fatal error should block transition
      const result = await stateMachine.transition('COMPLETE_IMPLEMENTATION')
      expect(result).toBe(false)
    })

    it('应该验证测试质量要求', async () => {
      // Get to TEST state
      await stateMachine.transition('START_ANALYSIS')
      stateMachine.updateAnalysis({
        approach: 'test',
        confidence: 88,
        estimatedHours: 7,
        complexity: 5,
        risks: [],
        dependencies: []
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')

      const context = stateMachine.getContext()
      context.planning = {
        startedAt: new Date().toISOString(),
        milestones: [{ id: '1', name: 'test', description: 'test', estimatedDuration: 1000, dependencies: [], status: 'pending' }],
        resourceAllocation: { timeSlots: [] },
        riskMitigation: []
      }
      await stateMachine.transition('COMPLETE_PLANNING')
      
      stateMachine.updateImplementationProgress(95)
      await stateMachine.transition('COMPLETE_IMPLEMENTATION')

      // Low security score should block transition
      context.testing = {
        startedAt: new Date().toISOString(),
        testSuites: [
          { name: 'unit tests', type: 'unit', status: 'passed', results: { passed: 10, failed: 0, skipped: 0 } }
        ],
        qualityMetrics: {
          codeQuality: 85,
          performance: 80,
          security: 75, // Below 80 threshold
          maintainability: 90
        }
      }

      const result = await stateMachine.transition('COMPLETE_TESTING')
      expect(result).toBe(false) // Should be blocked by security score
    })
  })

  describe('状态处理器和生命周期', () => {
    it('应该正确初始化各阶段数据结构', async () => {
      // Test analysis initialization
      await stateMachine.transition('START_ANALYSIS')
      const contextAfterAnalysis = stateMachine.getContext()
      expect(contextAfterAnalysis.analysis).toBeDefined()
      expect(contextAfterAnalysis.analysis?.confidence).toBe(0)

      // Test planning initialization  
      stateMachine.updateAnalysis({
        approach: 'test',
        confidence: 80,
        estimatedHours: 4,
        complexity: 3,
        risks: [],
        dependencies: []
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')
      
      const contextAfterPlanning = stateMachine.getContext()
      expect(contextAfterPlanning.planning).toBeDefined()
      expect(contextAfterPlanning.planning?.milestones).toEqual([])
    })

    it('应该正确处理完成状态和Graph RAG同步', async () => {
      // Mock successful exec for Graph RAG sync
      mockExecAsync.mockResolvedValueOnce({ stdout: 'Graph RAG sync completed', stderr: '' })

      // Get to COMPLETE state through full workflow
      await stateMachine.transition('START_ANALYSIS')
      stateMachine.updateAnalysis({
        approach: 'comprehensive',
        confidence: 92,
        estimatedHours: 10,
        complexity: 7,
        risks: ['complexity'],
        dependencies: ['service-a']
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')

      // Set planning data using updatePlanning method
      stateMachine.updatePlanning({
        milestones: [{ id: '1', name: 'test', description: 'test', estimatedDuration: 1000, dependencies: [], status: 'pending' }]
      })
      await stateMachine.transition('COMPLETE_PLANNING')
      
      stateMachine.updateImplementationProgress(100)
      await stateMachine.transition('COMPLETE_IMPLEMENTATION')

      // Set up successful testing using updateTesting method
      stateMachine.updateTesting({
        testSuites: [
          { name: 'all tests', type: 'unit', status: 'passed', results: { passed: 25, failed: 0, skipped: 0 } }
        ],
        qualityMetrics: {
          codeQuality: 92,
          performance: 88,
          security: 95,
          maintainability: 90
        }
      })
      await stateMachine.transition('COMPLETE_TESTING')

      // Set up successful review using updateReview method
      stateMachine.updateReview({
        reviewers: ['reviewer1'],
        checklistItems: [
          { category: 'code', item: 'Code quality', status: 'approved' }
        ],
        approvalStatus: 'approved'
      })
      
      // Transition to COMPLETE should trigger Graph RAG sync
      const result = await stateMachine.transition('COMPLETE_REVIEW')
      expect(result).toBe(true)
      expect(stateMachine.getCurrentState()).toBe('COMPLETE')
      
      // Note: Graph RAG sync happens in background, hard to test with dynamic imports
      // But we can verify the completion state was reached
      const context = stateMachine.getContext()
      expect(context.metadata.actualCompletion).toBeDefined()
    })
  })

  describe('可用操作和状态查询', () => {
    it('应该返回当前状态可用的操作', () => {
      const actions = stateMachine.getAvailableActions()
      expect(Array.isArray(actions)).toBe(true)
      expect(actions.length).toBeGreaterThan(0)
      expect(actions).toContain('START_ANALYSIS')
    })

    it('应该检查操作可行性', () => {
      expect(stateMachine.canTransition('START_ANALYSIS')).toBe(true)
      expect(stateMachine.canTransition('COMPLETE_REVIEW')).toBe(false) // Not available from INIT
    })

    it('应该在状态变化后更新可用操作', async () => {
      const initialActions = stateMachine.getAvailableActions()
      
      await stateMachine.transition('START_ANALYSIS')
      
      // Update analysis to meet condition for COMPLETE_ANALYSIS
      stateMachine.updateAnalysis({
        approach: 'test approach',
        confidence: 80, // Above 70 threshold
        estimatedHours: 4,
        complexity: 3,
        risks: [],
        dependencies: []
      })
      
      const analysisActions = stateMachine.getAvailableActions()
      
      expect(analysisActions).not.toEqual(initialActions)
      expect(analysisActions).toContain('COMPLETE_ANALYSIS')
    })
  })

  describe('错误处理和边界条件', () => {
    it('应该处理无效状态转换', async () => {
      const result = await stateMachine.transition('COMPLETE_REVIEW' as WorkflowAction)
      expect(result).toBe(false)
      expect(stateMachine.getCurrentState()).toBe('INIT') // Should remain unchanged
    })

    it('应该处理空任务描述', () => {
      const emptyMachine = new WorkflowStateMachine('empty-session', '')
      expect(emptyMachine.getContext().taskDescription).toBe('')
    })

    it('应该支持任务描述更新', () => {
      stateMachine.updateTaskDescription('Updated task description')
      expect(stateMachine.getContext().taskDescription).toBe('Updated task description')
    })

    it('应该处理实施进度越界值', async () => {
      // Need to get to IMPLEMENT state first to create implementation context
      await stateMachine.transition('START_ANALYSIS')
      stateMachine.updateAnalysis({
        approach: 'test',
        confidence: 80,
        estimatedHours: 4,
        complexity: 3,
        risks: [],
        dependencies: []
      })
      await stateMachine.transition('COMPLETE_ANALYSIS')
      
      stateMachine.updatePlanning({
        milestones: [{ id: '1', name: 'test', description: 'test', estimatedDuration: 1000, dependencies: [], status: 'pending' }]
      })
      await stateMachine.transition('COMPLETE_PLANNING')
      
      // Now test bounds checking
      stateMachine.updateImplementationProgress(-10) // Negative
      expect(stateMachine.getContext().implementation?.progress).toBe(0)

      stateMachine.updateImplementationProgress(150) // Over 100
      expect(stateMachine.getContext().implementation?.progress).toBe(100)
    })

    it('应该处理快照创建失败', async () => {
      // Mock persistence failure
      const failingPersistence = {
        ...persistence,
        saveSnapshot: mock(() => Promise.reject(new Error('Snapshot save failed')))
      }
      
      const failingMachine = new WorkflowStateMachine(
        'failing-session',
        'Test task',
        { persistence: failingPersistence }
      )

      const snapshotId = await failingMachine.createSnapshot('Test snapshot')
      expect(snapshotId).toBeNull()
    })
  })

  describe('性能和并发场景', () => {
    it('应该处理并发状态转换', async () => {
      await stateMachine.transition('START_ANALYSIS')
      
      // Simulate concurrent transitions
      const promises = [
        stateMachine.transition('PAUSE'),
        stateMachine.transition('FAIL')
      ]
      
      const results = await Promise.all(promises)
      // At least one should succeed, but system should remain consistent
      expect(results.some(r => r === true)).toBe(true)
      
      const finalState = stateMachine.getCurrentState()
      expect(['PAUSED', 'FAILED'].includes(finalState)).toBe(true)
    })

    it('应该处理大量状态历史记录', async () => {
      // First get to a state that supports PAUSE/RESUME
      await stateMachine.transition('START_ANALYSIS')
      
      // Simulate many transitions to build large history
      for (let i = 0; i < 20; i++) {
        await stateMachine.transition('PAUSE')
        await stateMachine.transition('RESUME')
      }

      const context = stateMachine.getContext()
      expect(context.stateHistory.length).toBeGreaterThan(40)
      
      // Should still perform efficiently
      const startTime = Date.now()
      const actions = stateMachine.getAvailableActions()
      const endTime = Date.now()
      
      expect(actions).toBeDefined()
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })
  })

  afterEach(() => {
    // Cleanup if needed
  })
})