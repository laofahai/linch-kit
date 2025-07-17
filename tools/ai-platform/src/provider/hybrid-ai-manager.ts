/**
 * 混合智能管理器
 * 结合AI分析与规则引擎的智能决策系统
 */

import { createLogger } from '@linch-kit/core'

import { CLIBasedAIProvider, COMMON_CLI_PROVIDERS, CLIAIResponse } from './cli-based-provider'

const logger = createLogger('hybrid-ai-manager')

export interface HybridConfig {
  primaryProvider?: string
  fallbackProviders?: string[]
  aiTimeout?: number
  enableRuleFallback?: boolean
  customProviders?: Record<string, any>
}

export interface AnalysisRequest {
  prompt: string
  context?: Record<string, any>
  requiresAI?: boolean
  ruleBasedFallback?: () => string
}

export interface AnalysisResult {
  content: string
  source: 'ai' | 'rules' | 'hybrid'
  provider?: string
  success: boolean
  executionTime: number
  confidence?: number
}

export class HybridAIManager {
  private providers: Map<string, CLIBasedAIProvider> = new Map()
  private config: HybridConfig

  constructor(config: HybridConfig = {}) {
    this.config = {
      primaryProvider: 'gemini',
      fallbackProviders: ['claude'],
      aiTimeout: 30000,
      enableRuleFallback: true,
      ...config
    }
    
    this.initializeProviders()
  }

  private initializeProviders() {
    // 初始化常见CLI提供者
    for (const [name, config] of Object.entries(COMMON_CLI_PROVIDERS)) {
      const provider = new CLIBasedAIProvider(name, {
        ...config,
        timeoutMs: this.config.aiTimeout
      })
      this.providers.set(name, provider)
    }

    // 初始化自定义提供者
    if (this.config.customProviders) {
      for (const [name, config] of Object.entries(this.config.customProviders)) {
        const provider = new CLIBasedAIProvider(name, {
          ...config,
          timeoutMs: this.config.aiTimeout
        })
        this.providers.set(name, provider)
      }
    }

    logger.info(`Initialized ${this.providers.size} AI providers`)
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now()

    // 如果不需要AI或没有配置AI，直接使用规则引擎
    if (!request.requiresAI && request.ruleBasedFallback) {
      logger.info('Using rule-based analysis (AI not required)')
      const content = request.ruleBasedFallback()
      return {
        content,
        source: 'rules',
        success: true,
        executionTime: Date.now() - startTime,
        confidence: 0.8
      }
    }

    // 尝试AI分析
    const aiResult = await this.tryAIAnalysis(request.prompt)
    
    if (aiResult.success) {
      return {
        content: aiResult.content,
        source: 'ai',
        provider: aiResult.provider,
        success: true,
        executionTime: aiResult.executionTime,
        confidence: 0.9
      }
    }

    // AI失败，使用规则引擎作为降级
    if (this.config.enableRuleFallback && request.ruleBasedFallback) {
      logger.warn('AI analysis failed, falling back to rules')
      const content = request.ruleBasedFallback()
      return {
        content,
        source: 'rules',
        success: true,
        executionTime: Date.now() - startTime,
        confidence: 0.7
      }
    }

    // 所有方法都失败
    return {
      content: 'Analysis failed: No AI providers available and no rule-based fallback',
      source: 'hybrid',
      success: false,
      executionTime: Date.now() - startTime,
      confidence: 0
    }
  }

  private async tryAIAnalysis(prompt: string): Promise<CLIAIResponse> {
    const providersToTry = [
      this.config.primaryProvider!,
      ...(this.config.fallbackProviders || [])
    ]

    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName)
      if (!provider) {
        logger.warn(`Provider ${providerName} not available`)
        continue
      }

      try {
        // 检查CLI是否可用
        await provider.validateCLI()
        
        logger.info(`Trying AI analysis with ${providerName}`)
        const result = await provider.generate(prompt)
        
        if (result.success) {
          logger.info(`AI analysis successful with ${providerName}`)
          return result
        } else {
          logger.warn(`${providerName} failed: ${result.error}`)
        }
      } catch (error) {
        logger.warn(`${providerName} CLI not available: ${error}`)
        continue
      }
    }

    return {
      content: '',
      success: false,
      error: 'All AI providers failed or unavailable',
      provider: 'none',
      executionTime: 0
    }
  }

  async validateProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.validateCLI()
        logger.info(`Provider ${name}: ${results[name] ? 'Available' : 'Not available'}`)
      } catch (error) {
        results[name] = false
        logger.info(`Provider ${name}: Not available (${error})`)
      }
    }
    
    return results
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  async getProviderStatus(): Promise<Array<{name: string, available: boolean, command: string}>> {
    const status = []
    
    for (const [name, provider] of this.providers) {
      const available = await provider.validateCLI().catch(() => false)
      status.push({
        name,
        available,
        command: (provider as any).config?.command || 'unknown'
      })
    }
    
    return status
  }
}

// 工厂函数：从环境变量创建混合管理器
export function createHybridAIManager(): HybridAIManager {
  const config: HybridConfig = {
    primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'gemini',
    fallbackProviders: process.env.AI_FALLBACK_PROVIDERS?.split(',') || ['claude'],
    aiTimeout: parseInt(process.env.AI_TIMEOUT || '30000'),
    enableRuleFallback: process.env.AI_ENABLE_RULE_FALLBACK !== 'false'
  }

  return new HybridAIManager(config)
}