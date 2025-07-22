/**
 * Shared mock factories for test workflow manager tests
 * Ensures consistent and complete mock data structures to prevent memory leaks
 */
import { mock } from 'bun:test'

export function createMockAIProvider() {
  return {
    getName: mock(() => 'test-ai-provider'),
    getId: mock(() => 'test-ai-id'),
    isAvailable: mock(() => Promise.resolve(true)),
    generateResponse: mock(() => Promise.resolve({
      data: {
        testContent: 'mock test content',
        coverage: { expectedLines: 90, expectedFunctions: 10, expectedBranches: 8 },
        testCases: [
          { name: 'test case 1', description: 'test description', type: 'unit' }
        ]
      }
    }))
  }
}

export function createMockCoverageAnalyzer() {
  return {
    analyzeTestTiming: mock(() => Promise.resolve({
      score: 6,
      recommendation: { mode: 'traditional', generateAt: 'completion' }
    })),
    analyzeCoverage: mock(() => Promise.resolve({
      overall: {
        lines: { total: 100, covered: 70, uncovered: 30, percentage: 70 },
        functions: { total: 20, covered: 15, uncovered: 5, percentage: 75 },
        branches: { total: 50, covered: 35, uncovered: 15, percentage: 70 },
        statements: { total: 120, covered: 84, uncovered: 36, percentage: 70 }
      },
      files: [],
      gapAnalysis: {
        totalGaps: 5,
        criticalGaps: 2,
        highPriorityFiles: [],
        suggestedTests: [],
        coverageGoals: { currentOverall: 70, targetOverall: 85, improveBy: 15 }
      },
      recommendations: {
        actions: [
          {
            type: 'improve_coverage',
            priority: 'high',
            description: 'Improve error handling tests',
            expectedImpact: { lines: 5, functions: 2, branches: 3 },
            effort: 'medium'
          }
        ],
        summary: 'Improve error handling tests',
        strategy: 'balanced',
        priority: 'medium',
        estimatedHours: 4,
        risks: []
      },
      trends: { coverageChange: 5, qualityScore: 80, testHealthScore: 75 },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }))
  }
}

export function createMockQueryEngine() {
  return {
    searchRelated: mock(() => Promise.resolve({
      relatedItems: [
        { type: 'test', file: 'example.test.ts', description: 'Example test' }
      ],
      patterns: ['pattern1', 'pattern2'],
      suggestions: ['suggestion1']
    }))
  }
}

export function cleanupMocks(...mocks: any[]) {
  mocks.forEach(mockObj => {
    if (mockObj && typeof mockObj === 'object') {
      Object.values(mockObj).forEach(mockFn => {
        if (typeof mockFn === 'function') {
          if ('mockRestore' in mockFn) {
            mockFn.mockRestore()
          } else if ('mockClear' in mockFn) {
            mockFn.mockClear()
          }
        }
      })
    }
  })
}

export async function cleanupTestWorkflowManager(manager: any) {
  if (!manager) return
  
  // Disconnect if method exists
  if (typeof manager.disconnect === 'function') {
    try {
      await manager.disconnect()
    } catch (error) {
      // Ignore disconnect errors
    }
  }
  
  // Clear all internal references
  Object.keys(manager).forEach(key => {
    try {
      ;(manager as any)[key] = null
    } catch (error) {
      // Ignore property assignment errors
    }
  })
  
  // Clear environment variables
  delete process.env.GEMINI_API_KEY
  delete process.env.GOOGLE_API_KEY
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Wait for async cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 100))
}