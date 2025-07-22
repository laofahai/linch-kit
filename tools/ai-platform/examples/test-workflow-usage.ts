/**
 * LinchKit AI Test Strategy Decision Engine - Usage Examples
 * Production-ready examples showing intelligent test timing control and strategy selection
 * 
 * @version 1.0.0 - Production Integration
 */

import { TestWorkflowManager } from '../src/workflow/test-workflow-manager'
import { createDefaultAIProvider, createAIProviderAdapter } from '../src/providers/ai-provider-adapter'
import type { TestWorkflowContext, TestStrategyFactors, StrategyAnalysisContext } from '../src/workflow/test-workflow-manager'

// Example 1: Basic Usage with Default AI Provider
async function basicUsage() {
  console.log('🚀 Example 1: Basic Test Strategy Analysis\n')

  // Create workflow manager with default AI provider (Gemini)
  const workflowManager = new TestWorkflowManager()

  const context: TestWorkflowContext = {
    taskDescription: 'Implement user authentication with JWT tokens',
    testType: 'unit',
    targetFiles: [
      'src/workflow/test-strategy-engine.ts',
      'src/providers/ai-provider-adapter.ts'
    ]
  }

  try {
    // Get comprehensive test strategy analysis
    const result = await workflowManager.analyzeTestStrategy(context)

    console.log('Strategy Decision:', result.strategyDecision.primaryStrategy)
    console.log('Confidence:', Math.round(result.strategyDecision.confidence * 100) + '%')
    console.log('Timing Recommendation:', result.timingAnalysis.recommendation)
    console.log('\nReasoning:')
    result.integration.reasoning.forEach((reason, i) => 
      console.log(`  ${i + 1}. ${reason}`)
    )

    console.log('\nResource Allocation:')
    const allocation = result.strategyDecision.resourceAllocation
    console.log(`  • Unit Tests: ${allocation.unitTests}%`)
    console.log(`  • Integration Tests: ${allocation.integrationTests}%`)
    console.log(`  • E2E Tests: ${allocation.e2eTests}%`)
    console.log(`  • Performance Tests: ${allocation.performanceTests}%`)

    console.log('\nEstimated Effort:', result.strategyDecision.estimatedEffort.hours, 'hours')
    console.log('Complexity Level:', result.strategyDecision.estimatedEffort.complexity)
  } catch (error) {
    console.error('Analysis failed:', error instanceof Error ? error.message : error)
  }
}

// Example 2: Advanced Usage with Custom Strategy Factors
async function advancedUsage() {
  console.log('\n🧠 Example 2: Advanced Strategy Analysis with Custom Factors\n')

  const workflowManager = new TestWorkflowManager()

  // Define specific strategy factors based on your assessment
  const strategyFactors: TestStrategyFactors = {
    complexity: 8,          // High complexity code
    businessImpact: 9,      // Critical business functionality
    riskLevel: 8,           // High risk if it fails
    currentCoverage: 25,    // Low existing coverage
    changeFrequency: 7,     // Code changes frequently
    teamExperience: 6       // Mid-level team experience
  }

  // Define project analysis context
  const analysisContext: StrategyAnalysisContext = {
    projectType: 'api',
    codebase: {
      language: 'typescript',
      framework: 'express',
      size: 'large'
    },
    team: {
      size: 5,
      experience: 'senior',
      testingCulture: 'high'
    },
    timeline: {
      isUrgent: false,
      hasDeadline: true,
      iterationLength: 2 // 2 weeks
    }
  }

  const context: TestWorkflowContext = {
    taskDescription: 'Payment processing system with multiple providers',
    testType: 'integration',
    targetFiles: [
      'src/payment/PaymentProcessor.ts',
      'src/payment/StripeProvider.ts',
      'src/payment/PayPalProvider.ts'
    ],
    strategyFactors,
    analysisContext
  }

  try {
    const result = await workflowManager.analyzeTestStrategy(context)

    console.log('🎯 Comprehensive Strategy Analysis')
    console.log('=====================================')
    console.log(`Primary Strategy: ${result.strategyDecision.primaryStrategy.toUpperCase()}`)
    
    if (result.strategyDecision.secondaryStrategies.length > 0) {
      console.log('Secondary Strategies:', result.strategyDecision.secondaryStrategies.join(', '))
    }

    console.log(`\nConfidence Score: ${Math.round(result.strategyDecision.confidence * 100)}%`)
    
    console.log('\n📋 Test Prioritization:')
    result.strategyDecision.prioritization.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.testType} (${item.priority.toUpperCase()})`)
      console.log(`     Effort: ${item.effort}/10, Impact: ${item.impact}/10`)
    })

    console.log('\n⏰ Timing Integration:')
    console.log(`  • Selected Strategy: ${result.integration.selectedStrategy}`)
    console.log(`  • Timing Mode: ${result.timingAnalysis.strategy.recommendation?.mode || 'N/A'}`)
    console.log(`  • Generate At: ${result.timingAnalysis.strategy.recommendation?.generateAt || 'N/A'}`)

  } catch (error) {
    console.error('Advanced analysis failed:', error instanceof Error ? error.message : error)
  }
}

// Example 3: Different Project Types and Scenarios
async function scenarioExamples() {
  console.log('\n🎪 Example 3: Different Project Scenarios\n')

  const workflowManager = new TestWorkflowManager()

  const scenarios = [
    {
      name: 'Library Development',
      context: {
        taskDescription: 'Utility functions for data transformation',
        testType: 'unit' as const,
        analysisContext: {
          projectType: 'library' as const,
          codebase: { language: 'typescript', framework: 'none', size: 'small' as const },
          team: { size: 2, experience: 'expert' as const, testingCulture: 'excellent' as const },
          timeline: { isUrgent: false, hasDeadline: false, iterationLength: 4 }
        }
      }
    },
    {
      name: 'Web Application',
      context: {
        taskDescription: 'User dashboard with real-time data',
        testType: 'e2e' as const,
        analysisContext: {
          projectType: 'web-app' as const,
          codebase: { language: 'typescript', framework: 'next.js', size: 'medium' as const },
          team: { size: 4, experience: 'mid' as const, testingCulture: 'medium' as const },
          timeline: { isUrgent: true, hasDeadline: true, iterationLength: 1 }
        }
      }
    },
    {
      name: 'CLI Tool',
      context: {
        taskDescription: 'Command-line interface with multiple commands',
        testType: 'integration' as const,
        analysisContext: {
          projectType: 'cli' as const,
          codebase: { language: 'typescript', framework: 'commander', size: 'small' as const },
          team: { size: 1, experience: 'senior' as const, testingCulture: 'high' as const },
          timeline: { isUrgent: false, hasDeadline: true, iterationLength: 3 }
        }
      }
    }
  ]

  for (const scenario of scenarios) {
    try {
      console.log(`📊 ${scenario.name} Scenario:`)
      const result = await workflowManager.analyzeTestStrategy(scenario.context)
      
      console.log(`  Strategy: ${result.strategyDecision.primaryStrategy}`)
      console.log(`  Confidence: ${Math.round(result.strategyDecision.confidence * 100)}%`)
      console.log(`  Effort: ${result.strategyDecision.estimatedEffort.hours}h (${result.strategyDecision.estimatedEffort.complexity})`)
      console.log(`  Unit/Integration/E2E: ${result.strategyDecision.resourceAllocation.unitTests}/${result.strategyDecision.resourceAllocation.integrationTests}/${result.strategyDecision.resourceAllocation.e2eTests}%`)
      console.log()
    } catch (error) {
      console.error(`  ❌ ${scenario.name} failed:`, error instanceof Error ? error.message : error)
    }
  }
}

// Example 4: Provider Management and Error Handling
async function providerManagement() {
  console.log('🔌 Example 4: AI Provider Management\n')

  try {
    // Create workflow manager with custom provider configuration
    const customProvider = createAIProviderAdapter('gemini-sdk', {
      apiKey: process.env.GEMINI_API_KEY || 'demo-key',
      model: 'gemini-1.5-flash',
      timeout: 30000
    })

    const workflowManager = new TestWorkflowManager(customProvider)

    // Check provider status
    const status = await workflowManager.getProviderStatus()
    console.log('Provider Status:')
    console.log(`  Name: ${status.name}`)
    console.log(`  ID: ${status.id}`)
    console.log(`  Available: ${status.available ? '✅' : '❌'}`)
    if (status.error) {
      console.log(`  Error: ${status.error}`)
    }

    // Demonstrate fallback behavior
    const context: TestWorkflowContext = {
      taskDescription: 'Simple utility function',
      testType: 'unit'
    }

    if (status.available) {
      console.log('\n✨ Running analysis with AI provider...')
      const result = await workflowManager.analyzeTestStrategy(context)
      console.log(`Result: ${result.strategyDecision.primaryStrategy} strategy selected`)
    } else {
      console.log('\n⚠️  AI provider unavailable, using fallback analysis...')
      // Analysis will still work with heuristic fallback
      const result = await workflowManager.analyzeTestStrategy(context)
      console.log(`Fallback result: ${result.strategyDecision.primaryStrategy} strategy selected`)
    }

  } catch (error) {
    console.error('Provider management example failed:', error instanceof Error ? error.message : error)
  }
}

// Example 5: Legacy Workflow Compatibility
async function legacyCompatibility() {
  console.log('\n🔄 Example 5: Legacy Workflow Compatibility\n')

  const workflowManager = new TestWorkflowManager()

  const context: TestWorkflowContext = {
    taskDescription: 'Legacy codebase modernization',
    testType: 'unit',
    targetFiles: ['src/legacy-module.ts']
  }

  try {
    // Use legacy executeTestWorkflow method (still works with new features)
    const legacyResult = await workflowManager.executeTestWorkflow(context)
    
    console.log('Legacy Interface Results:')
    console.log(`  Test Gaps Found: ${legacyResult.analysis.testGaps.length}`)
    console.log(`  Existing Tests: ${legacyResult.analysis.existingTests.length}`)
    console.log(`  Recommendations: ${legacyResult.recommendations.priority}`)
    console.log(`  Next Actions: ${legacyResult.nextActions.length}`)
    
    // New timing control features are available in legacy results too
    if (legacyResult.timingControl) {
      console.log(`  Timing Strategy: ${legacyResult.timingControl.strategy.recommendation?.mode || 'N/A'}`)
      console.log(`  Timing Recommendation: ${legacyResult.timingControl.recommendation}`)
    }

  } catch (error) {
    console.error('Legacy compatibility example failed:', error instanceof Error ? error.message : error)
  }
}

// Main execution function
async function runAllExamples() {
  console.log('🧪 LinchKit AI Test Strategy Decision Engine - Usage Examples')
  console.log('==============================================================\n')

  try {
    await basicUsage()
    await advancedUsage()
    await scenarioExamples()
    await providerManagement()
    await legacyCompatibility()
    
    console.log('\n✅ All examples completed successfully!')
    console.log('\nNext Steps:')
    console.log('1. Set GEMINI_API_KEY environment variable for real AI analysis')
    console.log('2. Integrate with your build system and CI/CD pipeline')
    console.log('3. Customize strategy weights based on your team preferences')
    console.log('4. Use the generated strategies to guide your test implementation')

  } catch (error) {
    console.error('\n❌ Examples failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run examples if called directly
if (import.meta.main) {
  runAllExamples()
}