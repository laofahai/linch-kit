/**
 * LinchKit AI工作流引擎Phase 3测试
 * 测试七状态转换、快照恢复和规则引擎功能
 * 
 * @version 3.0.0 - Phase 3 功能测试
 */

import { createLogger } from '@linch-kit/core'
import { WorkflowStateMachine, EnhancedFileBasedPersistence } from './workflow-state-machine'
import { WorkflowRulesEngine, createWorkflowRulesEngine } from './workflow-rules-engine'

const logger = createLogger('workflow-phase3-test')

/**
 * Phase 3功能测试套件
 */
export class WorkflowPhase3Test {
  private persistence: EnhancedFileBasedPersistence
  private rulesEngine: WorkflowRulesEngine

  constructor() {
    this.persistence = new EnhancedFileBasedPersistence('.linchkit/test-workflow-states')
    this.rulesEngine = createWorkflowRulesEngine({
      enabled: true,
      maxHistorySize: 100
    })
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    logger.info('🚀 Starting LinchKit AI Workflow Engine Phase 3 Tests')
    
    try {
      await this.testSevenStateWorkflow()
      await this.testSnapshotFunctionality()
      await this.testRulesEngine()
      await this.testFailureRecovery()
      await this.testEnhancedPersistence()
      
      logger.info('✅ All Phase 3 tests completed successfully!')
    } catch (error) {
      logger.error('❌ Phase 3 tests failed:', error)
      throw error
    }
  }

  /**
   * 测试七状态工作流转换
   */
  async testSevenStateWorkflow(): Promise<void> {
    logger.info('🔄 Testing Seven-State Workflow Transitions')
    
    const workflow = new WorkflowStateMachine(
      'test-seven-state-' + Date.now(),
      'Test seven-state workflow transitions',
      {
        persistence: this.persistence,
        autoSaveEnabled: true,
        snapshotInterval: 30 * 1000, // 30秒快照间隔
        priority: 'high',
        category: 'test',
        tags: ['phase3', 'seven-state']
      }
    )

    // 测试初始状态
    let currentState = workflow.getCurrentState()
    if (currentState !== 'INIT') {
      throw new Error(`Expected INIT state, got ${currentState}`)
    }
    logger.info(`✓ Initial state: ${currentState}`)

    // 测试 INIT → ANALYZE 转换
    const success1 = await workflow.transition('START_ANALYSIS')
    if (!success1) {
      throw new Error('Failed to transition from INIT to ANALYZE')
    }
    currentState = workflow.getCurrentState()
    logger.info(`✓ Transitioned to: ${currentState}`)

    // 更新分析数据
    workflow.updateAnalysis({
      approach: 'Test-driven development',
      confidence: 85,
      estimatedHours: 4,
      complexity: 3,
      risks: ['Time constraints', 'Integration complexity'],
      dependencies: ['External API', 'Database setup']
    })

    // 测试 ANALYZE → PLAN 转换
    const success2 = await workflow.transition('COMPLETE_ANALYSIS')
    if (!success2) {
      throw new Error('Failed to transition from ANALYZE to PLAN')
    }
    currentState = workflow.getCurrentState()
    logger.info(`✓ Transitioned to: ${currentState}`)

    // 添加规划数据
    const context = workflow.getContext()
    if (context.planning) {
      context.planning.milestones = [
        {
          id: 'milestone-1',
          name: 'Setup Environment',
          description: 'Initialize development environment',
          estimatedDuration: 60 * 60 * 1000, // 1小时
          dependencies: [],
          status: 'pending'
        },
        {
          id: 'milestone-2',
          name: 'Core Implementation',
          description: 'Implement core functionality',
          estimatedDuration: 3 * 60 * 60 * 1000, // 3小时
          dependencies: ['milestone-1'],
          status: 'pending'
        }
      ]
    }

    // 测试 PLAN → IMPLEMENT 转换
    // 首先确保有 planning 数据
    const planContext = workflow.getContext()
    if (planContext.planning) {
      planContext.planning.milestones = [
        { id: 'milestone-1', name: '设计API接口', completed: false },
        { id: 'milestone-2', name: '实现核心逻辑', completed: false }
      ]
      planContext.planning.timeline = Date.now() + 86400000
      planContext.planning.resources = ['developer', 'testing-environment']
    }
    
    const success3 = await workflow.transition('COMPLETE_PLANNING')
    if (!success3) {
      throw new Error('Failed to transition from PLAN to IMPLEMENT')
    }
    currentState = workflow.getCurrentState()
    logger.info(`✓ Transitioned to: ${currentState}`)

    // 更新实施进度
    workflow.updateImplementationProgress(50, 'milestone-1')
    workflow.updateImplementationProgress(100, 'milestone-2', [
      {
        id: 'error-1',
        timestamp: new Date().toISOString(),
        milestone: 'milestone-2',
        error: 'Minor dependency issue resolved',
        severity: 'info',
        resolved: true
      }
    ])
    
    // 确保实施进度达到测试要求 (>=80%)
    workflow.updateImplementationProgress(85)

    // 测试 IMPLEMENT → TEST 转换
    const success4 = await workflow.transition('START_TESTING')
    if (!success4) {
      throw new Error('Failed to transition from IMPLEMENT to TEST')
    }
    currentState = workflow.getCurrentState()
    logger.info(`✓ Transitioned to: ${currentState}`)

    // 添加测试数据
    const testContext = workflow.getContext()
    if (testContext.testing) {
      testContext.testing.testSuites = [
        {
          name: 'Unit Tests',
          type: 'unit',
          status: 'passed',
          results: { passed: 15, failed: 0, skipped: 2, coverage: 85 }
        },
        {
          name: 'Integration Tests',
          type: 'integration',
          status: 'passed',
          results: { passed: 8, failed: 0, skipped: 0, coverage: 78 }
        }
      ]
      testContext.testing.qualityMetrics = {
        codeQuality: 88,
        performance: 92,
        security: 95,
        maintainability: 85
      }
    }

    // 测试 TEST → REVIEW 转换
    const success5 = await workflow.transition('START_REVIEW')
    if (!success5) {
      throw new Error('Failed to transition from TEST to REVIEW')
    }
    currentState = workflow.getCurrentState()
    logger.info(`✓ Transitioned to: ${currentState}`)

    // 添加审查数据
    const reviewContext = workflow.getContext()
    if (reviewContext.review) {
      reviewContext.review.reviewers = ['senior-dev', 'tech-lead']
      reviewContext.review.checklistItems = [
        {
          category: 'code',
          item: 'Code follows style guidelines',
          status: 'approved',
          reviewer: 'senior-dev'
        },
        {
          category: 'testing',
          item: 'Test coverage meets requirements',
          status: 'approved',
          reviewer: 'tech-lead'
        }
      ]
      reviewContext.review.approvalStatus = 'approved'
    }

    // 测试 REVIEW → COMPLETE 转换
    const success6 = await workflow.transition('COMPLETE_REVIEW')
    if (!success6) {
      throw new Error('Failed to transition from REVIEW to COMPLETE')
    }
    currentState = workflow.getCurrentState()
    logger.info(`✓ Transitioned to: ${currentState}`)

    logger.info('✅ Seven-state workflow test completed successfully')
  }

  /**
   * 测试快照功能
   */
  async testSnapshotFunctionality(): Promise<void> {
    logger.info('📸 Testing Snapshot Functionality')
    
    const workflow = new WorkflowStateMachine(
      'test-snapshot-' + Date.now(),
      'Test snapshot functionality',
      {
        persistence: this.persistence,
        autoSaveEnabled: true,
        priority: 'medium'
      }
    )

    // 先进行一个状态转换来保存工作流
    await workflow.transition('START_ANALYSIS')
    
    // 创建手动快照 (此时在ANALYZE状态)
    const snapshotId = await workflow.createSnapshot('ANALYZE state snapshot')
    if (!snapshotId) {
      throw new Error('Failed to create manual snapshot')
    }
    logger.info(`✓ Manual snapshot created: ${snapshotId}`)

    // 更新分析数据 (已经在ANALYZE状态)
    workflow.updateAnalysis({
      approach: 'Snapshot test approach',
      confidence: 90,
      estimatedHours: 2,
      complexity: 2,
      risks: [],
      dependencies: []
    })

    // 列出快照
    const snapshots = await this.persistence.listSnapshots(workflow.getContext().sessionId)
    if (snapshots.length === 0) {
      throw new Error('No snapshots found')
    }
    logger.info(`✓ Found ${snapshots.length} snapshots`)

    // 从快照恢复 (应该恢复到ANALYZE状态)
    const restored = await workflow.restoreFromSnapshot(snapshotId)
    if (!restored) {
      throw new Error('Failed to restore from snapshot')
    }
    
    const restoredState = workflow.getCurrentState()
    if (restoredState !== 'ANALYZE') {
      throw new Error(`Expected ANALYZE state after restore, got ${restoredState}`)
    }
    logger.info(`✓ Successfully restored to state: ${restoredState}`)

    logger.info('✅ Snapshot functionality test completed successfully')
  }

  /**
   * 测试规则引擎
   */
  async testRulesEngine(): Promise<void> {
    logger.info('⚙️ Testing Rules Engine')
    
    const workflow = new WorkflowStateMachine(
      'test-rules-' + Date.now(),
      'Test rules engine functionality',
      {
        persistence: this.persistence,
        priority: 'critical'
      }
    )

    // 添加自定义规则
    this.rulesEngine.addRule({
      id: 'test-high-complexity-rule',
      name: 'High Complexity Warning',
      description: 'Warn when complexity is too high',
      enabled: true,
      priority: 7,
      condition: (context) => {
        return context.analysis?.complexity && context.analysis.complexity > 4
      },
      action: {
        type: 'notification',
        level: 'warning',
        message: 'High complexity detected, consider breaking down the task'
      },
      constraints: {
        requiredStates: ['ANALYZE', 'PLAN']
      },
      metadata: {
        category: 'quality',
        tags: ['complexity', 'warning']
      }
    })

    // 转换到ANALYZE状态并设置高复杂度
    await workflow.transition('START_ANALYSIS')
    workflow.updateAnalysis({
      approach: 'Complex implementation',
      confidence: 70,
      estimatedHours: 8,
      complexity: 5, // 高复杂度，应触发规则
      risks: ['High complexity'],
      dependencies: []
    })

    // 执行规则
    const ruleResults = await this.rulesEngine.executeRules(workflow.getContext())
    if (ruleResults.length === 0) {
      throw new Error('No rules were executed')
    }
    
    const highComplexityRuleResult = ruleResults.find(r => r.ruleId === 'test-high-complexity-rule')
    if (!highComplexityRuleResult || !highComplexityRuleResult.success) {
      throw new Error('High complexity rule did not execute successfully')
    }
    logger.info(`✓ Rule executed: ${highComplexityRuleResult.ruleId}`)

    // 测试Schema验证规则
    this.rulesEngine.addSchemaRule({
      id: 'test-analysis-schema',
      name: 'Analysis Data Validation',
      description: 'Validate analysis data structure',
      enabled: true,
      priority: 9,
      schema: {
        type: 'object',
        properties: {
          approach: { type: 'string' },
          confidence: { type: 'number' },
          complexity: { type: 'number' }
        },
        required: ['approach', 'confidence', 'complexity']
      },
      validationPath: 'analysis',
      onValidationFail: {
        type: 'notification',
        level: 'error',
        message: 'Analysis data validation failed'
      },
      onValidationPass: {
        type: 'notification',
        level: 'info',
        message: 'Analysis data validation passed'
      },
      metadata: {
        category: 'quality',
        tags: ['validation', 'schema']
      }
    })

    // 执行Schema验证
    const schemaResults = await this.rulesEngine.executeSchemaValidation(workflow.getContext())
    if (schemaResults.length === 0) {
      throw new Error('No schema validation rules were executed')
    }
    logger.info(`✓ Schema validation executed: ${schemaResults.length} rules`)

    // 获取规则引擎统计
    const stats = this.rulesEngine.getStatistics()
    logger.info(`✓ Rules engine stats: ${stats.totalRules} total rules, ${stats.executionCount} executions`)

    logger.info('✅ Rules engine test completed successfully')
  }

  /**
   * 测试失败恢复
   */
  async testFailureRecovery(): Promise<void> {
    logger.info('🔧 Testing Failure Recovery')
    
    const workflow = new WorkflowStateMachine(
      'test-failure-' + Date.now(),
      'Test failure recovery functionality',
      {
        persistence: this.persistence,
        priority: 'high'
      }
    )

    // 添加失败恢复规则 (简化版，应该匹配任何状态)
    this.rulesEngine.addRecoveryRule({
      id: 'test-implementation-failure',
      name: 'Implementation Failure Recovery',
      description: 'Handle implementation failures',
      enabled: true,
      priority: 10,
      failurePattern: {
        // 不设置任何条件，应该匹配所有情况
      },
      recoveryStrategy: {
        immediate: {
          type: 'recovery',
          strategy: 'retry',
          maxRetries: 2,
          retryDelay: 1000
        },
        escalation: {
          threshold: 3,
          action: {
            type: 'recovery',
            strategy: 'pause'
          }
        }
      },
      metadata: {
        category: 'recovery',
        tags: ['implementation', 'retry']
      }
    })

    // 转换到IMPLEMENT状态
    await workflow.transition('START_ANALYSIS')
    
    // 添加分析数据
    workflow.updateAnalysis({
      approach: 'Test implementation approach',
      confidence: 85,
      estimatedHours: 10,
      complexity: 3,
      risks: ['Implementation complexity'],
      dependencies: ['external-api']
    })
    
    await workflow.transition('COMPLETE_ANALYSIS')
    
    // 添加计划数据
    const context = workflow.getContext()
    if (context.planning) {
      context.planning.milestones = [
        { id: 'impl-1', name: '实现核心功能', completed: false }
      ]
    }
    
    await workflow.transition('COMPLETE_PLANNING')

    // 模拟失败
    const testError = new Error('Simulated implementation failure')
    const currentContext = workflow.getContext()
    logger.info(`Current state before failure recovery: ${currentContext.currentState}`)
    logger.info(`Error type: ${testError.constructor.name}`)
    
    // 检查规则引擎是否有恢复规则（通过统计）
    const stats = await this.rulesEngine.getStatistics()
    logger.info(`Total rules in engine: ${stats.totalRules}`)
    
    const recoveryResults = await this.rulesEngine.executeFailureRecovery(
      currentContext,
      testError
    )

    if (recoveryResults.length === 0) {
      throw new Error('No recovery rules were executed')
    }
    
    const recoveryResult = recoveryResults[0]
    if (!recoveryResult.success) {
      throw new Error('Recovery rule execution failed')
    }
    logger.info(`✓ Recovery rule executed: ${recoveryResult.ruleId}`)

    logger.info('✅ Failure recovery test completed successfully')
  }

  /**
   * 测试增强持久化功能
   */
  async testEnhancedPersistence(): Promise<void> {
    logger.info('💾 Testing Enhanced Persistence')
    
    const workflow1 = new WorkflowStateMachine(
      'test-persistence-1-' + Date.now(),
      'Test persistence functionality - workflow 1',
      {
        persistence: this.persistence,
        priority: 'high',
        category: 'persistence-test',
        tags: ['test', 'persistence']
      }
    )

    const workflow2 = new WorkflowStateMachine(
      'test-persistence-2-' + Date.now(),
      'Test persistence functionality - workflow 2',
      {
        persistence: this.persistence,
        priority: 'medium',
        category: 'persistence-test',
        tags: ['test', 'persistence']
      }
    )

    // 创建不同状态的工作流
    await workflow1.transition('START_ANALYSIS')
    await workflow2.transition('START_ANALYSIS')
    await workflow2.transition('COMPLETE_ANALYSIS')

    // 测试高级查询功能
    const highPriorityWorkflows = await this.persistence.findByPriority('high')
    if (highPriorityWorkflows.length === 0) {
      throw new Error('No high priority workflows found')
    }
    logger.info(`✓ Found ${highPriorityWorkflows.length} high priority workflows`)

    const analyzeStateWorkflows = await this.persistence.findByState('ANALYZE')
    if (analyzeStateWorkflows.length === 0) {
      throw new Error('No workflows in ANALYZE state found')
    }
    logger.info(`✓ Found ${analyzeStateWorkflows.length} workflows in ANALYZE state`)

    const testCategoryWorkflows = await this.persistence.findByCategory('persistence-test')
    if (testCategoryWorkflows.length < 2) {
      throw new Error('Expected at least 2 workflows in persistence-test category')
    }
    logger.info(`✓ Found ${testCategoryWorkflows.length} workflows in persistence-test category`)

    const testTagWorkflows = await this.persistence.findByTag('persistence')
    if (testTagWorkflows.length < 2) {
      throw new Error('Expected at least 2 workflows with persistence tag')
    }
    logger.info(`✓ Found ${testTagWorkflows.length} workflows with persistence tag`)

    // 测试统计功能
    const stats = await this.persistence.getStatistics()
    logger.info(`✓ Persistence statistics: ${stats.totalWorkflows} total workflows`)

    // 测试版本控制
    const context1 = workflow1.getContext()
    await this.persistence.saveVersion(context1, 'v1.0')
    
    const versions = await this.persistence.listVersions(context1.sessionId)
    if (versions.length === 0) {
      throw new Error('No versions found')
    }
    logger.info(`✓ Created version: ${versions[0]}`)

    const loadedVersion = await this.persistence.loadVersion(context1.sessionId, 'v1.0')
    if (!loadedVersion) {
      throw new Error('Failed to load version')
    }
    logger.info(`✓ Successfully loaded version v1.0`)

    logger.info('✅ Enhanced persistence test completed successfully')
  }
}

/**
 * 运行测试的便捷函数
 */
export async function runPhase3Tests(): Promise<void> {
  const tester = new WorkflowPhase3Test()
  await tester.runAllTests()
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runPhase3Tests().catch(error => {
    console.error('Phase 3 tests failed:', error)
    process.exit(1)
  })
}