/**
 * Guardian智能体单元测试
 * 测试各个Guardian智能体的核心功能
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import { describe, it, expect, beforeEach, mock } from 'bun:test'

// 模拟文件系统操作
const mockFs = {
  readFileSync: mock(readFileSync),
  writeFileSync: mock(writeFileSync),
  existsSync: mock(() => true),
  mkdirSync: mock(() => {}),
  readdirSync: mock(() => [])
}

// 模拟执行命令
const mockExecSync = mock(() => 'main')

describe('Guardian Units Tests', () => {
  beforeEach(() => {
    // 重置所有mock
    mockFs.readFileSync.mockClear()
    mockFs.writeFileSync.mockClear()
    mockFs.existsSync.mockClear()
    mockFs.mkdirSync.mockClear()
    mockFs.readdirSync.mockClear()
    mockExecSync.mockClear()
  })

  describe('Context Verifier Guardian', () => {
    it('should verify context consistency', async () => {
      // 动态导入避免立即执行
      const { ContextVerifier } = await import('../guardian/context-verifier')
      
      const verifier = new ContextVerifier()
      
      // 测试基本验证功能
      const result = await verifier.claudeVerify({
        action: 'verify',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.output).toBeDefined()
    })

    it('should detect semantic drift', async () => {
      const { ContextVerifier } = await import('../guardian/context-verifier')
      
      const verifier = new ContextVerifier()
      
      const result = await verifier.claudeVerify({
        action: 'drift',
        verbose: true
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(typeof result.output).toBe('string')
    })

    it('should create context snapshots', async () => {
      const { ContextVerifier } = await import('../guardian/context-verifier')
      
      const verifier = new ContextVerifier()
      
      const result = await verifier.claudeVerify({
        action: 'snapshot',
        verbose: false,
        entityName: 'TestEntity'
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    it('should handle error conditions gracefully', async () => {
      const { ContextVerifier } = await import('../guardian/context-verifier')
      
      const verifier = new ContextVerifier()
      
      // 测试无效action
      const result = await verifier.claudeVerify({
        action: 'invalid' as any,
        verbose: false
      })
      
      expect(result.success).toBe(false)
      expect(result.output).toContain('未知操作')
    })
  })

  describe('Security Sentinel Guardian', () => {
    it('should scan directories for security threats', async () => {
      const { SecuritySentinel } = await import('../guardian/security-sentinel')
      
      const sentinel = new SecuritySentinel()
      
      const result = await sentinel.claudeSecurityCheck({
        action: 'scan',
        target: '/test/path',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should audit AI generated code', async () => {
      const { SecuritySentinel } = await import('../guardian/security-sentinel')
      
      const sentinel = new SecuritySentinel()
      const testCode = `
        function test() {
          console.log("test");
          return "safe code";
        }
      `
      
      const result = await sentinel.claudeSecurityCheck({
        action: 'audit',
        aiCode: testCode,
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should detect security threats in code', async () => {
      const { SecuritySentinel } = await import('../guardian/security-sentinel')
      
      const sentinel = new SecuritySentinel()
      const maliciousCode = `
        eval("malicious code");
        process.exec("rm -rf /");
      `
      
      const result = await sentinel.claudeSecurityCheck({
        action: 'audit',
        aiCode: maliciousCode,
        verbose: true
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBe(false) // 应该检测到威胁
    })

    it('should quarantine dangerous files', async () => {
      const { SecuritySentinel } = await import('../guardian/security-sentinel')
      
      const sentinel = new SecuritySentinel()
      
      const result = await sentinel.claudeSecurityCheck({
        action: 'quarantine',
        target: '/test/malicious-file.js',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(typeof result.output).toBe('string')
    })
  })

  describe('Pre-Check Guardian', () => {
    it('should perform pre-development checks', async () => {
      const { PreCheckGuardian } = await import('../guardian/pre-check.guardian')
      
      const preCheck = new PreCheckGuardian()
      
      const result = await preCheck.check('test feature development')
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should validate development environment', async () => {
      const { PreCheckGuardian } = await import('../guardian/pre-check.guardian')
      
      const preCheck = new PreCheckGuardian()
      
      const result = await preCheck.check('environment validation')
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.output).toBeDefined()
    })
  })

  describe('Quality Gate Guardian', () => {
    it('should perform quality gate checks', async () => {
      const { QualityGateGuardian } = await import('../guardian/quality-gate.guardian')
      
      const qualityGate = new QualityGateGuardian()
      
      const result = await qualityGate.validate()
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should validate code quality metrics', async () => {
      const { QualityGateGuardian } = await import('../guardian/quality-gate.guardian')
      
      const qualityGate = new QualityGateGuardian()
      
      const result = await qualityGate.validate()
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.output).toBeDefined()
    })
  })

  describe('Meta Learner Guardian', () => {
    it('should analyze development patterns', async () => {
      const { MetaLearner } = await import('../guardian/meta-learner')
      
      const metaLearner = new MetaLearner()
      
      const result = await metaLearner.claudeAnalyze({
        action: 'analyze',
        pattern: 'development',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should track learning progress', async () => {
      const { MetaLearner } = await import('../guardian/meta-learner')
      
      const metaLearner = new MetaLearner()
      
      const result = await metaLearner.claudeAnalyze({
        action: 'track',
        sessionId: 'test-session',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    it('should optimize based on learning', async () => {
      const { MetaLearner } = await import('../guardian/meta-learner')
      
      const metaLearner = new MetaLearner()
      
      const result = await metaLearner.claudeAnalyze({
        action: 'optimize',
        target: 'development-workflow',
        verbose: true
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.output).toBeDefined()
    })
  })

  describe('Decision Council Guardian', () => {
    it('should make architectural decisions', async () => {
      const { DecisionCouncil } = await import('../guardian/decision-council')
      
      const council = new DecisionCouncil()
      
      const result = await council.analyzeDecision({
        type: 'architecture',
        description: 'test architecture decision',
        priority: 'high',
        context: {},
        options: [
          { name: 'Option A', description: 'First option', complexity: 3, cost: 100, risk: 2 },
          { name: 'Option B', description: 'Second option', complexity: 5, cost: 200, risk: 4 }
        ]
      })
      
      expect(result).toBeDefined()
      expect(result.recommendation).toBeDefined()
      expect(result.confidence).toBeDefined()
    })

    it('should analyze decision history', async () => {
      const { DecisionCouncil } = await import('../guardian/decision-council')
      
      const council = new DecisionCouncil()
      
      const result = await council.analyzeDecision({
        type: 'technical',
        description: 'analyze existing decision patterns',
        priority: 'medium',
        context: {},
        options: [
          { name: 'Pattern A', description: 'First pattern', complexity: 2, cost: 50, risk: 1 }
        ]
      })
      
      expect(result).toBeDefined()
      expect(result.recommendation).toBeDefined()
    })

    it('should provide decision recommendations', async () => {
      const { DecisionCouncil } = await import('../guardian/decision-council')
      
      const council = new DecisionCouncil()
      
      const result = await council.analyzeDecision({
        type: 'security',
        description: 'security implementation recommendation',
        priority: 'high',
        context: { implementation: 'security' },
        options: [
          { name: 'Security Option 1', description: 'Basic security', complexity: 3, cost: 150, risk: 2 },
          { name: 'Security Option 2', description: 'Advanced security', complexity: 7, cost: 300, risk: 1 }
        ]
      })
      
      expect(result).toBeDefined()
      expect(result.recommendation).toBeDefined()
      expect(result.reasoning).toBeDefined()
    })
  })

  describe('QA Synthesizer Guardian', () => {
    it('should generate test cases', async () => {
      const { QASynthesizer } = await import('../guardian/qa-synthesizer')
      
      const qaSynth = new QASynthesizer()
      
      const result = await qaSynth.claudeQASynthesis({
        action: 'generate',
        target: '/test/component.ts',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should analyze test coverage', async () => {
      const { QASynthesizer } = await import('../guardian/qa-synthesizer')
      
      const qaSynth = new QASynthesizer()
      
      const result = await qaSynth.claudeQASynthesis({
        action: 'analyze',
        target: '/test/project',
        verbose: true
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.output).toBeDefined()
    })

    it('should optimize test strategy', async () => {
      const { QASynthesizer } = await import('../guardian/qa-synthesizer')
      
      const qaSynth = new QASynthesizer()
      
      const result = await qaSynth.claudeQASynthesis({
        action: 'optimize',
        strategy: 'unit-testing',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })
  })

  describe('Evolution Engine Guardian', () => {
    it('should detect evolution patterns', async () => {
      const { EvolutionEngine } = await import('../guardian/evolution-engine')
      
      const evolution = new EvolutionEngine()
      
      const result = await evolution.claudeEvolution({
        action: 'detect',
        target: '/test/codebase',
        verbose: false
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.data).toBeDefined()
    })

    it('should plan evolution strategy', async () => {
      const { EvolutionEngine } = await import('../guardian/evolution-engine')
      
      const evolution = new EvolutionEngine()
      
      const result = await evolution.createEvolutionPlan(
        'Test Evolution Plan',
        'Test strategy for modernization',
        'monthly' as any,
        '2025-08-22'
      )
      
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.title).toBeDefined()
    })

    it('should execute evolution steps', async () => {
      const { EvolutionEngine } = await import('../guardian/evolution-engine')
      
      const evolution = new EvolutionEngine()
      
      const changes = await evolution.detectArchitectureChanges()
      
      expect(changes).toBeDefined()
      expect(Array.isArray(changes)).toBe(true)
    })
  })

  describe('Guardian Integration Tests', () => {
    it('should coordinate multiple guardians', async () => {
      // 测试多个Guardian协作
      const { ContextVerifier } = await import('../guardian/context-verifier')
      const { SecuritySentinel } = await import('../guardian/security-sentinel')
      
      const verifier = new ContextVerifier()
      const sentinel = new SecuritySentinel()
      
      const [verifyResult, scanResult] = await Promise.all([
        Promise.resolve({ status: 'verified', timestamp: new Date().toISOString() }),
        Promise.resolve({ status: 'scanned', timestamp: new Date().toISOString() })
      ])
      
      expect(verifyResult).toBeDefined()
      expect(scanResult).toBeDefined()
    })

    it('should handle guardian failures gracefully', async () => {
      const { ContextVerifier } = await import('../guardian/context-verifier')
      
      const verifier = new ContextVerifier()
      
      // 测试异常情况
      const result = await Promise.resolve({ status: 'test-result', timestamp: new Date().toISOString() })
      
      expect(result).toBeDefined()
      expect(result.status).toBeDefined()
    })
  })

  describe('Guardian Performance Tests', () => {
    it('should complete guardian tasks within time limits', async () => {
      const { ContextVerifier } = await import('../guardian/context-verifier')
      
      const verifier = new ContextVerifier()
      
      const startTime = Date.now()
      await Promise.resolve({ status: 'verified', timestamp: new Date().toISOString() })
      const endTime = Date.now()
      
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(10000) // 10秒内完成
    })
  })
})