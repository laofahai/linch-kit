/**
 * Guardian系统相关类型定义
 */

export interface GuardianAgent {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number
  
  validate(context: unknown): Promise<GuardianValidationResult>
  getName(): string
  getDescription(): string
}

export interface GuardianValidationResult {
  passed: boolean
  warnings: string[]
  violations: string[]
  metadata?: {
    rulesBroken?: string[]
    severity?: 'low' | 'medium' | 'high' | 'critical'
    suggestions?: string[]
    executionTime?: number
    confidence?: number
  }
}

export interface GuardianConfig {
  enabled: boolean
  strictMode: boolean
  agents: string[]
  timeout: number
  retryCount: number
}

export interface ArchViolation {
  id: string
  type: 'circular_dependency' | 'layer_violation' | 'forbidden_import' | 'coupling_violation'
  severity: 'warning' | 'error' | 'critical'
  message: string
  source: string
  target?: string
  suggestion?: string
  context?: {
    file?: string
    line?: number
    function?: string
  }
}