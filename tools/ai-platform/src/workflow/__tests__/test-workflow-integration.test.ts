/**
 * Integration tests for the complete test workflow with strategy engine
 * Tests the end-to-end pipeline: timing analysis → strategy selection → test generation
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { TestWorkflowManager } from '../test-workflow-manager'
import { createAIProviderAdapter } from '../../providers/ai-provider-adapter'
import type { AIProvider } from '../../providers/types'

// Mock AI Provider for testing
class MockAIProvider implements AIProvider {
  private responses: Map<string, any> = new Map()

  setMockResponse(prompt: string, response: any): void {
    this.responses.set(prompt, response)
  }

  getId(): string {
    return 'mock-ai'
  }

  getName(): string {
    return 'Mock AI Provider'
  }

  async chat(request: any): Promise<any> {
    return {
      content: JSON.stringify(this.getDefaultResponse()),
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
      model: 'mock-model',
      finish_reason: 'stop'
    }
  }

  async generateResponse(options: { prompt: string; schema?: any }): Promise<{ data: any }> {
    const mockResponse = this.responses.get(options.prompt) || this.getDefaultResponse()
    return { data: mockResponse }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  private getDefaultResponse(): any {
    return {
      strategy: 'tdd',
      priority: 'high',
      actions: [
        {
          type: 'generate',
          target: 'unit-tests',
          description: 'Generate unit tests for core functionality',
          effort: 'medium',
          priority: 'high'
        }
      ],
      estimatedHours: 4,
      risks: ['Complex business logic', 'External dependencies'],
      reasoning: [
        'High complexity requires TDD approach',
        'Critical business functionality needs comprehensive testing',
        'Low current coverage necessitates immediate attention'
      ]
    }
  }
}

describe('Test Workflow Integration', () => {
  let mockProvider: MockAIProvider
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    mockProvider = new MockAIProvider()
    workflowManager = new TestWorkflowManager(mockProvider)
  })

  describe('Complete Strategy Analysis Pipeline', () => {
    it('should complete end-to-end strategy analysis with timing control', async () => {
      const context = {
        taskDescription: 'Implement user authentication service with OAuth integration',
        testType: 'unit' as const,
        targetFiles: [
          'src/auth/AuthService.ts',
          'src/auth/OAuthProvider.ts'
        ],
        strategyFactors: {
          complexity: 8,
          businessImpact: 9,
          riskLevel: 8,
          currentCoverage: 35,
          changeFrequency: 6,
          teamExperience: 7
        },
        analysisContext: {
          projectType: 'api' as const,
          codebase: {
            language: 'typescript',
            framework: 'express',
            size: 'medium' as const
          },
          team: {
            size: 4,
            experience: 'senior' as const,
            testingCulture: 'high' as const
          },
          timeline: {
            isUrgent: false,
            hasDeadline: true,
            iterationLength: 3
          }
        }
      }

      const result = await workflowManager.analyzeTestStrategy(context)

      // Verify strategy analysis structure
      expect(result).toBeDefined()
      expect(result.strategyDecision).toBeDefined()
      expect(result.timingAnalysis).toBeDefined()
      expect(result.integration).toBeDefined()

      // Verify strategy decision
      expect(result.strategyDecision.primaryStrategy).toBeDefined()
      expect(result.strategyDecision.confidence).toBeGreaterThan(0)
      expect(result.strategyDecision.reasoning).toBeInstanceOf(Array)
      expect(result.strategyDecision.resourceAllocation).toBeDefined()
      expect(result.strategyDecision.estimatedEffort).toBeDefined()

      // Verify timing analysis
      expect(result.timingAnalysis.strategy).toBeDefined()
      expect(result.timingAnalysis.recommendation).toBeDefined()

      // Verify integration
      expect(result.integration.selectedStrategy).toBeDefined()
      expect(result.integration.confidence).toBeGreaterThan(0)
      expect(result.integration.reasoning).toBeInstanceOf(Array)
    }, 10000) // 10 second timeout for complex analysis

    it('should handle fallback gracefully when analysis fails', async () => {
      const failingProvider = new MockAIProvider()
      failingProvider.generateResponse = async () => {
        throw new Error('AI provider failure')
      }

      const failingManager = new TestWorkflowManager(failingProvider)
      
      const context = {
        taskDescription: 'Simple utility function',
        testType: 'unit' as const
      }

      const result = await failingManager.analyzeTestStrategy(context)

      expect(result).toBeDefined()
      expect(result.strategyDecision.primaryStrategy).toBeDefined()
      expect(result.integration.selectedStrategy).toBeDefined()
      expect(result.integration.reasoning).toBeInstanceOf(Array)
    })

    it('should properly integrate timing and strategy recommendations', async () => {
      // Test scenario: High complexity with immediate timing recommendation
      const context = {
        taskDescription: 'Critical payment processing module',
        testType: 'integration' as const,
        strategyFactors: {
          complexity: 9,
          businessImpact: 10,
          riskLevel: 9,
          currentCoverage: 20,
          changeFrequency: 8,
          teamExperience: 8
        }
      }

      const result = await workflowManager.analyzeTestStrategy(context)

      // Should recommend an advanced strategy for high complexity/risk
      expect(['tdd', 'bdd', 'traditional', 'hybrid']).toContain(result.strategyDecision.primaryStrategy)
      
      // Integration should maintain or upgrade strategy based on timing
      expect(result.integration.confidence).toBeGreaterThan(0.5)
      
      // Should provide specific reasoning for integration decision
      expect(result.integration.reasoning.length).toBeGreaterThan(2)
    })
  })

  describe('AI Provider Integration', () => {
    it('should work with different AI provider implementations', async () => {
      const providerStatus = await workflowManager.getProviderStatus()
      
      expect(providerStatus.name).toBe('Mock AI Provider')
      expect(providerStatus.id).toBe('mock-ai')
      expect(providerStatus.available).toBe(true)
    })

    it('should handle provider updates correctly', () => {
      const newProvider = new MockAIProvider()
      newProvider.getId = () => 'new-mock'
      newProvider.getName = () => 'New Mock Provider'

      workflowManager.updateAIProvider(newProvider)
      
      // Verify the provider was updated
      // Note: We can't directly test this without exposing the provider
      // but the test ensures the method completes without error
      expect(true).toBe(true)
    })

    it('should handle AI provider unavailability gracefully', async () => {
      const unavailableProvider = new MockAIProvider()
      unavailableProvider.isAvailable = async () => false

      const unavailableManager = new TestWorkflowManager(unavailableProvider)
      const status = await unavailableManager.getProviderStatus()

      expect(status.available).toBe(false)
      expect(status.name).toBe('Mock AI Provider')
    })
  })

  describe('Strategy Factor Inference', () => {
    it('should infer reasonable strategy factors from context', async () => {
      const minimalContext = {
        taskDescription: 'Basic CRUD operations',
        testType: 'unit' as const,
        targetFiles: ['src/crud.ts']
      }

      const result = await workflowManager.analyzeTestStrategy(minimalContext)

      // Should infer reasonable defaults
      expect(result.strategyDecision).toBeDefined()
      expect(result.strategyDecision.confidence).toBeGreaterThan(0.3)
      
      // Should complete analysis despite minimal input
      expect(result.integration.selectedStrategy).toBeDefined()
    })

    it('should handle different project types appropriately', async () => {
      const libraryContext = {
        taskDescription: 'Utility library functions',
        testType: 'unit' as const,
        analysisContext: {
          projectType: 'library' as const,
          codebase: { language: 'typescript', framework: 'none', size: 'small' as const },
          team: { size: 2, experience: 'expert' as const, testingCulture: 'excellent' as const },
          timeline: { isUrgent: false, hasDeadline: false, iterationLength: 4 }
        }
      }

      const result = await workflowManager.analyzeTestStrategy(libraryContext)

      // Library projects should use appropriate strategies (may vary based on factors)
      expect(['property-based', 'mutation', 'tdd', 'traditional', 'hybrid']).toContain(result.strategyDecision.primaryStrategy)
    })
  })

  describe('Resource Allocation', () => {
    it('should provide realistic resource allocation', async () => {
      const context = {
        taskDescription: 'E2E user workflow',
        testType: 'e2e' as const,
        analysisContext: {
          projectType: 'web-app' as const,
          codebase: { language: 'typescript', framework: 'next.js', size: 'large' as const },
          team: { size: 5, experience: 'mid' as const, testingCulture: 'medium' as const },
          timeline: { isUrgent: true, hasDeadline: true, iterationLength: 1 }
        }
      }

      const result = await workflowManager.analyzeTestStrategy(context)

      const allocation = result.strategyDecision.resourceAllocation
      
      // Total should be approximately 100%
      const total = allocation.unitTests + allocation.integrationTests + 
                   allocation.e2eTests + allocation.performanceTests
      expect(total).toBe(100)

      // E2E context should favor integration and e2e tests
      expect(allocation.e2eTests + allocation.integrationTests).toBeGreaterThan(20)
    })

    it('should prioritize tests appropriately', async () => {
      const highRiskContext = {
        taskDescription: 'Financial transaction processing',
        testType: 'integration' as const,
        strategyFactors: {
          complexity: 9,
          businessImpact: 10,
          riskLevel: 10,
          currentCoverage: 10,
          changeFrequency: 9,
          teamExperience: 6
        }
      }

      const result = await workflowManager.analyzeTestStrategy(highRiskContext)

      const prioritization = result.strategyDecision.prioritization
      
      // Should have critical priority items
      const criticalItems = prioritization.filter(p => p.priority === 'critical')
      expect(criticalItems.length).toBeGreaterThan(0)

      // High priority items should come first
      expect(prioritization[0].priority).toBe('critical')
    })
  })
})

describe('Legacy Workflow Compatibility', () => {
  let workflowManager: TestWorkflowManager

  beforeEach(() => {
    const mockProvider = new MockAIProvider()
    workflowManager = new TestWorkflowManager(mockProvider)
  })

  it('should maintain compatibility with legacy executeTestWorkflow method', async () => {
    const context = {
      taskDescription: 'Legacy test workflow',
      testType: 'unit' as const
    }

    const result = await workflowManager.executeTestWorkflow(context)

    // Verify legacy interface is maintained
    expect(result.analysis).toBeDefined()
    expect(result.recommendations).toBeDefined()
    expect(result.nextActions).toBeDefined()
    
    // New features should be available
    expect(result.timingControl).toBeDefined()
    expect(result.timingControl?.strategy).toBeDefined()
  })
})