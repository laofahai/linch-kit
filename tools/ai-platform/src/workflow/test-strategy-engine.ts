/**
 * LinchKit AI Test Strategy Decision Engine
 * Multi-factor decision matrix for intelligent test strategy selection
 * 
 * @version 1.0.0 - Production Integration
 */

import { createLogger } from '@linch-kit/core'
import type { AIProvider } from '../providers/types'

const logger = createLogger('test-strategy-engine')

export interface TestStrategyFactors {
  complexity: number          // Code complexity (1-10)
  businessImpact: number      // Business criticality (1-10)  
  riskLevel: number          // Risk assessment (1-10)
  currentCoverage: number    // Existing test coverage (0-100)
  changeFrequency: number    // How often code changes (1-10)
  teamExperience: number     // Team testing maturity (1-10)
}

export interface StrategyWeights {
  complexity: number
  businessImpact: number
  riskLevel: number
  coverage: number
  changeFreq: number
  experience: number
}

export type TestStrategy = 'tdd' | 'bdd' | 'mutation' | 'property-based' | 'traditional' | 'hybrid'

export interface TestStrategyDecision {
  primaryStrategy: TestStrategy
  secondaryStrategies: TestStrategy[]
  confidence: number
  reasoning: string[]
  resourceAllocation: {
    unitTests: number      // Percentage
    integrationTests: number
    e2eTests: number
    performanceTests: number
  }
  prioritization: Array<{
    testType: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    effort: number
    impact: number
  }>
  estimatedEffort: {
    hours: number
    complexity: 'simple' | 'moderate' | 'complex' | 'expert'
  }
}

export interface StrategyAnalysisContext {
  projectType: 'web-app' | 'api' | 'library' | 'cli' | 'mobile' | 'desktop'
  codebase: {
    language: string
    framework: string
    size: 'small' | 'medium' | 'large' | 'enterprise'
  }
  team: {
    size: number
    experience: 'junior' | 'mid' | 'senior' | 'expert'
    testingCulture: 'low' | 'medium' | 'high' | 'excellent'
  }
  timeline: {
    isUrgent: boolean
    hasDeadline: boolean
    iterationLength: number // in weeks
  }
}

export class TestStrategyDecisionEngine {
  private weights: StrategyWeights = {
    complexity: 0.25,
    businessImpact: 0.30,
    riskLevel: 0.20,
    coverage: 0.10,
    changeFreq: 0.10,
    experience: 0.05
  }

  constructor(
    private aiProvider?: AIProvider,
    customWeights?: Partial<StrategyWeights>
  ) {
    if (customWeights) {
      this.weights = { ...this.weights, ...customWeights }
      this.normalizeWeights()
    }
  }

  /**
   * Main decision engine - analyzes factors and recommends test strategy
   */
  async analyzeTestStrategy(
    factors: TestStrategyFactors,
    context: StrategyAnalysisContext,
    targetFiles?: string[]
  ): Promise<TestStrategyDecision> {
    logger.info('Analyzing test strategy', { 
      factors, 
      context: context.projectType,
      fileCount: targetFiles?.length || 0
    })

    try {
      // 1. Calculate weighted decision score
      const decisionMatrix = this.calculateDecisionMatrix(factors)
      
      // 2. Apply contextual adjustments
      const adjustedMatrix = this.applyContextualAdjustments(decisionMatrix, context)
      
      // 3. Select primary strategy
      const primaryStrategy = this.selectPrimaryStrategy(adjustedMatrix, factors)
      
      // 4. Determine secondary strategies
      const secondaryStrategies = this.selectSecondaryStrategies(
        primaryStrategy, 
        adjustedMatrix, 
        factors
      )
      
      // 5. Calculate resource allocation
      const resourceAllocation = this.calculateResourceAllocation(
        primaryStrategy, 
        factors, 
        context
      )
      
      // 6. Generate prioritization matrix
      const prioritization = this.generateTestPrioritization(
        factors, 
        context, 
        resourceAllocation
      )
      
      // 7. AI-enhanced reasoning (if available)
      const reasoning = await this.generateReasoning(
        factors, 
        context, 
        primaryStrategy, 
        adjustedMatrix
      )
      
      // 8. Estimate effort
      const estimatedEffort = this.estimateEffort(factors, context, prioritization)

      const decision: TestStrategyDecision = {
        primaryStrategy,
        secondaryStrategies,
        confidence: this.calculateConfidence(adjustedMatrix, factors),
        reasoning,
        resourceAllocation,
        prioritization,
        estimatedEffort
      }

      logger.info('Test strategy analysis completed', {
        strategy: primaryStrategy,
        confidence: decision.confidence,
        effort: decision.estimatedEffort.hours
      })

      return decision
    } catch (error) {
      logger.error('Test strategy analysis failed', error instanceof Error ? error : new Error(String(error)))
      return this.createFallbackStrategy(factors, context)
    }
  }

  /**
   * Calculate multi-dimensional decision matrix
   */
  private calculateDecisionMatrix(factors: TestStrategyFactors): Record<TestStrategy, number> {
    const matrix: Record<TestStrategy, number> = {
      tdd: 0,
      bdd: 0,
      mutation: 0,
      'property-based': 0,
      traditional: 0,
      hybrid: 0
    }

    // TDD scoring - favors high complexity, high risk, low coverage
    matrix.tdd = (
      factors.complexity * this.weights.complexity * 0.9 +
      factors.riskLevel * this.weights.riskLevel * 0.8 +
      (10 - factors.currentCoverage / 10) * this.weights.coverage * 0.7 +
      factors.businessImpact * this.weights.businessImpact * 0.6
    )

    // BDD scoring - favors high business impact, team experience
    matrix.bdd = (
      factors.businessImpact * this.weights.businessImpact * 1.0 +
      factors.teamExperience * this.weights.experience * 0.8 +
      factors.complexity * this.weights.complexity * 0.6 +
      (factors.currentCoverage / 10) * this.weights.coverage * 0.4
    )

    // Mutation testing - favors existing coverage, high quality requirements
    matrix.mutation = (
      (factors.currentCoverage / 10) * this.weights.coverage * 1.0 +
      factors.riskLevel * this.weights.riskLevel * 0.8 +
      factors.teamExperience * this.weights.experience * 0.7 +
      factors.businessImpact * this.weights.businessImpact * 0.5
    )

    // Property-based - favors complexity, mathematical/algorithmic code
    matrix['property-based'] = (
      factors.complexity * this.weights.complexity * 1.0 +
      factors.teamExperience * this.weights.experience * 0.8 +
      factors.riskLevel * this.weights.riskLevel * 0.6 +
      (10 - factors.changeFrequency) * this.weights.changeFreq * 0.4
    )

    // Traditional - default approach, balanced
    matrix.traditional = (
      (10 - factors.complexity) * this.weights.complexity * 0.6 +
      (10 - factors.teamExperience) * this.weights.experience * 0.8 +
      factors.businessImpact * this.weights.businessImpact * 0.5 +
      (factors.currentCoverage / 10) * this.weights.coverage * 0.6
    )

    // Hybrid - combines multiple approaches
    matrix.hybrid = (
      Math.min(factors.complexity, factors.businessImpact) * 0.6 +
      factors.teamExperience * this.weights.experience * 0.8 +
      factors.changeFrequency * this.weights.changeFreq * 0.7
    )

    return matrix
  }

  /**
   * Apply project context adjustments to decision matrix
   */
  private applyContextualAdjustments(
    matrix: Record<TestStrategy, number>, 
    context: StrategyAnalysisContext
  ): Record<TestStrategy, number> {
    const adjusted = { ...matrix }

    // Project type adjustments
    if (context.projectType === 'library') {
      adjusted['property-based'] *= 1.3
      adjusted.mutation *= 1.2
    } else if (context.projectType === 'web-app') {
      adjusted.bdd *= 1.2
      adjusted.tdd *= 1.1
    } else if (context.projectType === 'api') {
      adjusted.tdd *= 1.3
      adjusted['property-based'] *= 1.1
    }

    // Team experience adjustments
    if (context.team.experience === 'junior') {
      adjusted.traditional *= 1.3
      adjusted.tdd *= 0.7
      adjusted['property-based'] *= 0.5
    } else if (context.team.experience === 'expert') {
      adjusted.tdd *= 1.2
      adjusted['property-based'] *= 1.4
      adjusted.mutation *= 1.3
    }

    // Timeline pressure adjustments
    if (context.timeline.isUrgent) {
      adjusted.traditional *= 1.2
      adjusted.tdd *= 0.8
      adjusted.bdd *= 0.7
    }

    // Testing culture adjustments
    if (context.team.testingCulture === 'excellent') {
      adjusted.tdd *= 1.2
      adjusted.mutation *= 1.3
      adjusted['property-based'] *= 1.2
    } else if (context.team.testingCulture === 'low') {
      adjusted.traditional *= 1.4
      adjusted.hybrid *= 0.6
    }

    return adjusted
  }

  /**
   * Select the highest-scoring primary strategy
   */
  private selectPrimaryStrategy(
    matrix: Record<TestStrategy, number>, 
    factors: TestStrategyFactors
  ): TestStrategy {
    const sorted = Object.entries(matrix).sort(([,a], [,b]) => b - a)
    
    // Ensure minimum thresholds are met
    const topStrategy = sorted[0][0] as TestStrategy
    const topScore = sorted[0][1]
    
    // Fallback to traditional if scores are too close or too low
    if (topScore < 3.0 || (sorted[1][1] / topScore) > 0.9) {
      return 'traditional'
    }
    
    return topStrategy
  }

  /**
   * Select complementary secondary strategies
   */
  private selectSecondaryStrategies(
    primary: TestStrategy,
    matrix: Record<TestStrategy, number>,
    factors: TestStrategyFactors
  ): TestStrategy[] {
    const secondaries: TestStrategy[] = []
    const sorted = Object.entries(matrix)
      .filter(([strategy]) => strategy !== primary)
      .sort(([,a], [,b]) => b - a)

    // Add 1-2 complementary strategies
    if (sorted.length > 0 && sorted[0][1] > 2.5) {
      secondaries.push(sorted[0][0] as TestStrategy)
    }
    
    if (sorted.length > 1 && sorted[1][1] > 2.0 && secondaries.length < 2) {
      secondaries.push(sorted[1][0] as TestStrategy)
    }

    // Special cases for hybrid approaches
    if (primary === 'tdd' && factors.businessImpact > 7) {
      secondaries.push('bdd')
    } else if (primary === 'bdd' && factors.complexity > 7) {
      secondaries.push('property-based')
    }

    return secondaries.slice(0, 2) // Maximum 2 secondary strategies
  }

  /**
   * Calculate optimal resource allocation across test types
   */
  private calculateResourceAllocation(
    strategy: TestStrategy,
    factors: TestStrategyFactors,
    context: StrategyAnalysisContext
  ): { unitTests: number; integrationTests: number; e2eTests: number; performanceTests: number } {
    const baseAllocations: Record<TestStrategy, [number, number, number, number]> = {
      tdd: [70, 20, 8, 2],
      bdd: [40, 35, 20, 5],
      mutation: [80, 15, 3, 2],
      'property-based': [75, 20, 3, 2],
      traditional: [60, 25, 12, 3],
      hybrid: [55, 25, 15, 5]
    }

    let [unit, integration, e2e, performance] = baseAllocations[strategy]

    // Adjust based on project type
    if (context.projectType === 'api') {
      integration += 10
      e2e -= 5
      unit -= 5
    } else if (context.projectType === 'web-app') {
      e2e += 8
      unit -= 5
      integration -= 3
    }

    // Adjust based on risk level
    if (factors.riskLevel > 8) {
      unit += 5
      integration += 5
      e2e -= 5
      performance -= 5
    }

    // Ensure totals add up to 100
    const total = unit + integration + e2e + performance
    const normalize = (val: number) => Math.round((val / total) * 100)

    return {
      unitTests: normalize(unit),
      integrationTests: normalize(integration),
      e2eTests: normalize(e2e),
      performanceTests: normalize(performance)
    }
  }

  /**
   * Generate test prioritization matrix
   */
  private generateTestPrioritization(
    factors: TestStrategyFactors,
    context: StrategyAnalysisContext,
    allocation: { unitTests: number; integrationTests: number; e2eTests: number; performanceTests: number }
  ): Array<{ testType: string; priority: 'critical' | 'high' | 'medium' | 'low'; effort: number; impact: number }> {
    const priorities = [
      {
        testType: 'Critical Path Unit Tests',
        priority: 'critical' as const,
        effort: Math.round(factors.complexity * 0.8),
        impact: factors.businessImpact
      },
      {
        testType: 'Core Business Logic Tests',
        priority: factors.businessImpact > 7 ? 'critical' as const : 'high' as const,
        effort: Math.round(factors.complexity * 0.6),
        impact: factors.businessImpact
      },
      {
        testType: 'Integration Tests',
        priority: allocation.integrationTests > 25 ? 'high' as const : 'medium' as const,
        effort: Math.round(factors.complexity * 1.2),
        impact: Math.round((factors.businessImpact + factors.riskLevel) / 2)
      },
      {
        testType: 'Edge Case & Error Handling',
        priority: factors.riskLevel > 7 ? 'high' as const : 'medium' as const,
        effort: Math.round(factors.complexity * 0.4),
        impact: factors.riskLevel
      },
      {
        testType: 'End-to-End Tests',
        priority: context.projectType === 'web-app' ? 'high' as const : 'medium' as const,
        effort: Math.round(factors.complexity * 1.5),
        impact: Math.round((factors.businessImpact + 5) / 2)
      },
      {
        testType: 'Performance Tests',
        priority: allocation.performanceTests > 3 ? 'medium' as const : 'low' as const,
        effort: Math.round(factors.complexity * 1.8),
        impact: Math.round(factors.businessImpact * 0.6)
      }
    ]

    return priorities.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriorityScore = priorityOrder[a.priority]
      const bPriorityScore = priorityOrder[b.priority]
      
      if (aPriorityScore !== bPriorityScore) {
        return bPriorityScore - aPriorityScore
      }
      
      // Secondary sort by impact/effort ratio
      const aRatio = a.impact / Math.max(a.effort, 1)
      const bRatio = b.impact / Math.max(b.effort, 1)
      return bRatio - aRatio
    })
  }

  /**
   * Generate AI-enhanced reasoning for strategy selection
   */
  private async generateReasoning(
    factors: TestStrategyFactors,
    context: StrategyAnalysisContext,
    strategy: TestStrategy,
    matrix: Record<TestStrategy, number>
  ): Promise<string[]> {
    const baseReasoning = [
      `Selected ${strategy} based on complexity: ${factors.complexity}/10, risk: ${factors.riskLevel}/10`,
      `Business impact (${factors.businessImpact}/10) and team experience (${factors.teamExperience}/10) considered`,
      `Current coverage: ${factors.currentCoverage}% influences strategy selection`
    ]

    if (!this.aiProvider) {
      return this.generateHeuristicReasoning(factors, strategy, context)
    }

    try {
      const prompt = `
As a testing strategy expert, explain why ${strategy} was selected for a ${context.projectType} project with these factors:

## Code Analysis
- Complexity: ${factors.complexity}/10
- Business Impact: ${factors.businessImpact}/10
- Risk Level: ${factors.riskLevel}/10
- Current Coverage: ${factors.currentCoverage}%
- Change Frequency: ${factors.changeFrequency}/10

## Team Context  
- Experience: ${context.team.experience}
- Testing Culture: ${context.team.testingCulture}
- Team Size: ${context.team.size}

## Project Context
- Type: ${context.projectType}
- Size: ${context.codebase.size}
- Timeline: ${context.timeline.isUrgent ? 'Urgent' : 'Normal'}

## Strategy Scores
${Object.entries(matrix).map(([s, score]) => `- ${s}: ${score.toFixed(2)}`).join('\n')}

Provide 3-5 specific reasons why ${strategy} is optimal, focusing on the key factors that drove this decision.
`

      const response = await this.aiProvider.generateResponse({
        prompt,
        temperature: 0.3,
        schema: {
          type: 'object',
          properties: {
            reasoning: {
              type: 'array',
              items: { type: 'string' },
              minItems: 3,
              maxItems: 5
            }
          },
          required: ['reasoning']
        }
      })

      return response.data?.reasoning || baseReasoning
    } catch (error) {
      logger.warn('AI reasoning generation failed, using heuristic approach', error)
      return this.generateHeuristicReasoning(factors, strategy, context)
    }
  }

  /**
   * Generate heuristic-based reasoning when AI is unavailable
   */
  private generateHeuristicReasoning(
    factors: TestStrategyFactors,
    strategy: TestStrategy,
    context: StrategyAnalysisContext
  ): string[] {
    const reasoning: string[] = []

    // Strategy-specific reasoning
    switch (strategy) {
      case 'tdd':
        reasoning.push(`TDD selected due to high complexity (${factors.complexity}/10) and risk (${factors.riskLevel}/10)`)
        if (factors.currentCoverage < 50) {
          reasoning.push('Low current coverage (${factors.currentCoverage}%) makes TDD essential for quality')
        }
        break

      case 'bdd':
        reasoning.push(`BDD chosen for high business impact (${factors.businessImpact}/10) and stakeholder alignment`)
        if (context.team.experience !== 'junior') {
          reasoning.push('Team experience supports behavior-driven development approach')
        }
        break

      case 'mutation':
        reasoning.push(`Mutation testing selected due to existing coverage (${factors.currentCoverage}%) needing quality validation`)
        reasoning.push('High risk level justifies comprehensive test quality assessment')
        break

      case 'property-based':
        reasoning.push(`Property-based testing chosen for algorithmic complexity (${factors.complexity}/10)`)
        reasoning.push('Mathematical/logical code patterns benefit from property validation')
        break

      case 'traditional':
        reasoning.push('Traditional approach selected for balanced risk/effort optimization')
        if (context.timeline.isUrgent) {
          reasoning.push('Timeline constraints favor proven traditional testing methods')
        }
        break

      case 'hybrid':
        reasoning.push('Hybrid strategy combines multiple approaches for complex requirements')
        reasoning.push('Balances thoroughness with practical development constraints')
        break
    }

    // Context-based reasoning
    if (context.projectType === 'library') {
      reasoning.push('Library project requires extensive boundary and integration testing')
    } else if (context.projectType === 'web-app') {
      reasoning.push('Web application needs user journey and integration coverage')
    }

    if (context.team.testingCulture === 'low') {
      reasoning.push('Building testing culture through practical, achievable strategy')
    }

    return reasoning.slice(0, 4) // Limit to 4 reasons
  }

  /**
   * Estimate development effort for test implementation
   */
  private estimateEffort(
    factors: TestStrategyFactors,
    context: StrategyAnalysisContext,
    prioritization: Array<{ effort: number; priority: string }>
  ): { hours: number; complexity: 'simple' | 'moderate' | 'complex' | 'expert' } {
    // Base effort calculation
    const baseEffort = prioritization.reduce((sum, item) => sum + item.effort, 0)
    
    // Complexity multipliers
    const complexityMultipliers = {
      1: 0.5, 2: 0.7, 3: 0.8, 4: 0.9, 5: 1.0,
      6: 1.2, 7: 1.4, 8: 1.7, 9: 2.0, 10: 2.5
    }
    
    // Experience multipliers (inverse - better experience = less time)
    const experienceMultipliers = {
      'junior': 1.5,
      'mid': 1.2,
      'senior': 1.0,
      'expert': 0.8
    }
    
    const complexityMultiplier = complexityMultipliers[factors.complexity] || 1.0
    const experienceMultiplier = experienceMultipliers[context.team.experience] || 1.2
    
    const estimatedHours = Math.round(
      baseEffort * complexityMultiplier * experienceMultiplier
    )
    
    // Determine complexity rating
    let complexity: 'simple' | 'moderate' | 'complex' | 'expert'
    if (estimatedHours <= 8) {
      complexity = 'simple'
    } else if (estimatedHours <= 24) {
      complexity = 'moderate' 
    } else if (estimatedHours <= 60) {
      complexity = 'complex'
    } else {
      complexity = 'expert'
    }

    return {
      hours: estimatedHours,
      complexity
    }
  }

  /**
   * Calculate confidence score for strategy decision
   */
  private calculateConfidence(
    matrix: Record<TestStrategy, number>,
    factors: TestStrategyFactors
  ): number {
    const scores = Object.values(matrix).sort((a, b) => b - a)
    const topScore = scores[0]
    const secondScore = scores[1] || 0
    
    // Base confidence on score separation
    const scoreSeparation = topScore - secondScore
    const baseConfidence = Math.min(0.95, (scoreSeparation / topScore) * 0.8 + 0.5)
    
    // Adjust for data quality
    const dataQualityFactors = [
      factors.complexity > 0 ? 0.15 : 0,
      factors.businessImpact > 0 ? 0.15 : 0,
      factors.riskLevel > 0 ? 0.15 : 0,
      factors.currentCoverage >= 0 ? 0.15 : 0
    ]
    
    const dataQuality = dataQualityFactors.reduce((sum, factor) => sum + factor, 0.4)
    
    return Math.round((baseConfidence * dataQuality) * 100) / 100
  }

  /**
   * Create fallback strategy when analysis fails
   */
  private createFallbackStrategy(
    factors: TestStrategyFactors,
    context: StrategyAnalysisContext
  ): TestStrategyDecision {
    return {
      primaryStrategy: 'traditional',
      secondaryStrategies: ['tdd'],
      confidence: 0.6,
      reasoning: [
        'Fallback to traditional strategy due to analysis failure',
        'Conservative approach prioritizes reliability over optimization',
        'Manual strategy refinement recommended'
      ],
      resourceAllocation: {
        unitTests: 65,
        integrationTests: 25,
        e2eTests: 8,
        performanceTests: 2
      },
      prioritization: [
        {
          testType: 'Core Functionality Tests',
          priority: 'high',
          effort: 5,
          impact: 7
        }
      ],
      estimatedEffort: {
        hours: Math.max(8, factors.complexity * 2),
        complexity: 'moderate'
      }
    }
  }

  /**
   * Normalize weights to ensure they sum to 1.0
   */
  private normalizeWeights(): void {
    const total = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0)
    if (total !== 1.0) {
      Object.keys(this.weights).forEach(key => {
        this.weights[key as keyof StrategyWeights] /= total
      })
    }
  }

  /**
   * Update strategy weights for fine-tuning
   */
  updateWeights(newWeights: Partial<StrategyWeights>): void {
    this.weights = { ...this.weights, ...newWeights }
    this.normalizeWeights()
    logger.info('Updated strategy weights', this.weights)
  }
}