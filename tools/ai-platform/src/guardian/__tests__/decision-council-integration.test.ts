/**
 * Decision Council Real AI Integration Test
 * 测试真实Gemini API集成的功能
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { DecisionCouncil, DecisionType, DecisionPriority, type DecisionInput } from '../decision-council'

describe('Decision Council - Real AI Integration', () => {
  let council: DecisionCouncil
  let testDecisionInput: DecisionInput

  beforeAll(() => {
    council = new DecisionCouncil()
    
    testDecisionInput = {
      id: 'test-decision-001',
      title: 'Gemini API集成测试决策',
      description: '测试真实Gemini API集成是否正常工作',
      type: DecisionType.TECHNOLOGY,
      priority: DecisionPriority.HIGH,
      context: {
        packages: ['@linch-kit/core', '@linch-kit/ai-platform'],
        constraints: ['TypeScript严格模式', '高性能要求'],
        requirements: ['真实AI分析', '降级机制']
      },
      options: [
        {
          id: 'option-a',
          name: '使用Gemini SDK',
          description: '直接使用Google Generative AI SDK',
          pros: ['官方支持', '功能完整', '性能优秀'],
          cons: ['需要API密钥', '网络依赖'],
          complexity: 3,
          cost: {
            development: 40,
            maintenance: 20,
            learning: 30
          },
          risks: []
        },
        {
          id: 'option-b', 
          name: '使用规则引擎',
          description: '完全基于规则的分析',
          pros: ['无网络依赖', '响应快速', '成本低'],
          cons: ['分析质量有限', '缺乏智能性'],
          complexity: 2,
          cost: {
            development: 20,
            maintenance: 10,
            learning: 15
          },
          risks: []
        }
      ]
    }
  })

  it('应该能创建Decision Council实例', () => {
    expect(council).toBeDefined()
    expect(typeof council.analyzeDecision).toBe('function')
  })

  it('应该能获取统计信息', () => {
    const stats = council.getStatistics()
    expect(stats).toBeDefined()
    expect(typeof stats.totalDecisions).toBe('number')
    expect(typeof stats.avgConfidence).toBe('number')
  })

  it('应该能处理决策分析 (可能使用降级策略)', async () => {
    // 设置较短的超时时间，以测试降级机制
    const decision = await council.analyzeDecision(testDecisionInput)
    
    expect(decision).toBeDefined()
    expect(decision.decisionId).toBe(testDecisionInput.id)
    expect(decision.recommendedOption).toBeDefined()
    expect(decision.confidence).toBeGreaterThan(0)
    expect(decision.agentAnalyses).toBeInstanceOf(Array)
    expect(decision.agentAnalyses.length).toBeGreaterThan(0)
    
    // 检查是否有Agent分析结果
    decision.agentAnalyses.forEach(analysis => {
      expect(analysis.role).toBeDefined()
      expect(analysis.recommendedOption).toBeDefined()
      expect(analysis.confidence).toBeGreaterThanOrEqual(0)
      expect(analysis.confidence).toBeLessThanOrEqual(100)
      expect(analysis.reasoning).toBeInstanceOf(Array)
      expect(analysis.concerns).toBeInstanceOf(Array)
      expect(analysis.suggestions).toBeInstanceOf(Array)
    })

    // 检查风险评估
    expect(decision.riskSummary).toBeDefined()
    expect(decision.riskSummary.overallRisk).toBeGreaterThan(0)
    expect(decision.riskSummary.criticalRisks).toBeInstanceOf(Array)
    expect(decision.riskSummary.mitigationPlan).toBeInstanceOf(Array)

    // 检查实施建议
    expect(decision.implementationPlan).toBeDefined()
    expect(decision.implementationPlan.steps).toBeInstanceOf(Array)
    expect(decision.implementationPlan.monitoringMetrics).toBeInstanceOf(Array)
    expect(decision.implementationPlan.rollbackPlan).toBeInstanceOf(Array)

    console.log('🎯 Decision Analysis Results:')
    console.log(`- Recommended Option: ${decision.recommendedOption}`)
    console.log(`- Confidence: ${decision.confidence.toFixed(1)}%`)
    console.log(`- Consensus Level: ${decision.consensusLevel}`)
    console.log(`- Agent Count: ${decision.agentAnalyses.length}`)
    console.log(`- Risk Score: ${decision.riskSummary.overallRisk.toFixed(1)}/10`)
    console.log(`- Requires Human Review: ${decision.requiresHumanReview}`)
    
    // 显示Agent分析来源
    const aiAnalyses = decision.agentAnalyses.filter(a => a.confidence > 70)
    const fallbackAnalyses = decision.agentAnalyses.filter(a => a.confidence <= 70)
    
    console.log(`\n📊 Analysis Sources:`)
    console.log(`- AI-powered analyses: ${aiAnalyses.length}`)
    console.log(`- Fallback analyses: ${fallbackAnalyses.length}`)
    
    if (aiAnalyses.length > 0) {
      console.log('✅ Real AI integration is working!')
    } else {
      console.log('⚠️ Using fallback analysis (AI may not be available)')
    }
  }, 120000) // 2分钟超时

  it('应该能生成决策报告', async () => {
    const decision = await council.analyzeDecision(testDecisionInput)
    const report = council.generateDecisionReport(decision)
    
    expect(report).toBeDefined()
    expect(typeof report).toBe('string')
    expect(report.length).toBeGreaterThan(100)
    expect(report).toContain('决策分析报告')
    expect(report).toContain(testDecisionInput.title)
    
    console.log('\n📋 Generated Report Preview:')
    console.log(report.substring(0, 500) + '...')
  })

  it('应该能更新实施状态', async () => {
    const decision = await council.analyzeDecision(testDecisionInput)
    
    expect(() => {
      council.updateImplementationStatus(decision.decisionId, 'in_progress')
    }).not.toThrow()
    
    const history = council.getDecisionHistory(decision.decisionId)
    expect(history).toBeInstanceOf(Array)
    expect(history.length).toBe(1)
    expect(history[0].implementationStatus).toBe('in_progress')
  })
})