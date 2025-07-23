/**
 * AI Provider Manager
 * 
 * 简化的AI Provider管理器，支持多Provider但移除了未使用的模板系统
 * 专注于核心的AI Provider调用和管理功能
 * 
 * @version 2.0.0
 */

import { createLogger } from '@linch-kit/core'
import { AI_PROVIDERS, TIMEOUTS } from '../core/constants'

import { GeminiSDKProvider } from './gemini-sdk-provider'
import { CLIBasedAIProvider } from './cli-based-provider'

const logger = createLogger('ai-provider-manager')

export interface ProviderConfig {
  primaryProvider?: string
  fallbackProviders?: string[]
  aiTimeout?: number
  enableFallback?: boolean
  geminiApiKey?: string
  geminiModel?: string
  systemInstruction?: string
}

export interface AnalysisRequest {
  prompt: string
  context?: Record<string, any>
  requiresAI?: boolean
  expectedFormat?: 'json' | 'text'
  maxRetries?: number
}

export interface AnalysisResult {
  content: string
  source: 'ai' | 'fallback'
  provider?: string
  success: boolean
  executionTime: number
  confidence?: number
}

interface AIProvider {
  generateResponse(prompt: string, options?: any): Promise<{
    content: string
    success: boolean
    error?: string
    provider: string
    executionTime: number
  }>
  getProviderName(): string
}

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map()
  private config: ProviderConfig

  constructor(config: ProviderConfig = {}) {
    this.config = {
      primaryProvider: AI_PROVIDERS.DEFAULT,
      fallbackProviders: ['claude-cli'],
      aiTimeout: TIMEOUTS.AI_PROVIDER,
      enableFallback: true,
      ...config
    }
    
    this.initializeProviders()
  }

  private initializeProviders() {
    // 初始化 Gemini SDK Provider
    if (this.config.geminiApiKey) {
      const geminiProvider = new GeminiSDKProvider({
        apiKey: this.config.geminiApiKey,
        model: this.config.geminiModel || AI_PROVIDERS.DEFAULT_MODELS['gemini-sdk'],
        systemInstruction: this.config.systemInstruction,
        timeout: this.config.aiTimeout
      })
      this.providers.set('gemini-sdk', geminiProvider)
      logger.info('Initialized Gemini SDK provider')
    } else {
      logger.warn('Gemini API key not provided, SDK provider will not be available')
    }

    // 初始化 Claude CLI Provider
    try {
      const claudeProvider = new CLIBasedAIProvider('claude-cli', {
        command: 'claude',
        promptFlag: '-p',
        timeoutMs: this.config.aiTimeout
      })
      this.providers.set('claude-cli', claudeProvider)
      logger.info('Initialized Claude CLI provider')
    } catch (error) {
      logger.warn('Claude CLI provider initialization failed:', error.message)
    }
    
    logger.info(`Initialized ${this.providers.size} AI providers`)
  }

  /**
   * 执行AI分析
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now()
    
    try {
      // 尝试主要Provider
      const primaryProvider = this.providers.get(this.config.primaryProvider!)
      if (primaryProvider) {
        const result = await this.callProvider(primaryProvider, request)
        if (result.success) {
          return {
            ...result,
            source: 'ai',
            executionTime: Date.now() - startTime
          }
        }
        
        logger.warn(`Primary provider ${this.config.primaryProvider} failed: ${result.error}`)
      }

      // 尝试fallback providers
      if (this.config.enableFallback && this.config.fallbackProviders) {
        for (const providerName of this.config.fallbackProviders) {
          const provider = this.providers.get(providerName)
          if (provider) {
            try {
              const result = await this.callProvider(provider, request)
              if (result.success) {
                logger.info(`Fallback provider ${providerName} succeeded`)
                return {
                  ...result,
                  source: 'ai',
                  executionTime: Date.now() - startTime
                }
              }
            } catch (error) {
              logger.warn(`Fallback provider ${providerName} failed:`, error.message)
            }
          }
        }
      }

      // 所有AI Provider都失败，返回失败结果
      return {
        content: '',
        source: 'fallback',
        success: false,
        executionTime: Date.now() - startTime,
        confidence: 0
      }

    } catch (error) {
      logger.error('AI analysis failed:', error)
      return {
        content: '',
        source: 'fallback',
        success: false,
        executionTime: Date.now() - startTime,
        confidence: 0
      }
    }
  }

  /**
   * 调用特定Provider
   */
  private async callProvider(provider: AIProvider, request: AnalysisRequest) {
    const maxRetries = request.maxRetries || 1
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await provider.generateResponse(request.prompt, {
          context: request.context,
          expectedFormat: request.expectedFormat,
          timeout: this.config.aiTimeout
        })
        
        if (result.success) {
          return result
        }
        
        if (attempt < maxRetries) {
          logger.warn(`Provider ${provider.getProviderName()} attempt ${attempt} failed, retrying...`)
          await this.delay(1000 * attempt) // 指数退避
        }
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        logger.warn(`Provider ${provider.getProviderName()} attempt ${attempt} error:`, error.message)
        await this.delay(1000 * attempt)
      }
    }
    
    throw new Error(`All ${maxRetries} attempts failed`)
  }

  /**
   * 获取可用的Provider列表
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * 检查Provider是否可用
   */
  isProviderAvailable(providerName: string): boolean {
    return this.providers.has(providerName)
  }

  /**
   * 获取Provider状态
   */
  getStatus() {
    const providers = Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      available: true,
      type: provider.getProviderName()
    }))

    return {
      primaryProvider: this.config.primaryProvider,
      fallbackProviders: this.config.fallbackProviders,
      availableProviders: providers,
      totalProviders: this.providers.size,
      configuration: {
        timeout: this.config.aiTimeout,
        fallbackEnabled: this.config.enableFallback
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ProviderConfig>) {
    this.config = { ...this.config, ...newConfig }
    logger.info('AI Provider Manager configuration updated')
    
    // 如果更新了关键配置，重新初始化providers
    if (newConfig.geminiApiKey || newConfig.primaryProvider) {
      this.providers.clear()
      this.initializeProviders()
    }
  }

  /**
   * 工作流分析 - 专门用于工作流决策的分析
   */
  async analyzeWorkflow(taskDescription: string, context?: Record<string, any>): Promise<AnalysisResult> {
    const workflowPrompt = this.buildWorkflowAnalysisPrompt(taskDescription, context)
    
    return this.analyze({
      prompt: workflowPrompt,
      context,
      expectedFormat: 'json',
      requiresAI: true,
      maxRetries: 2
    })
  }

  /**
   * 构建工作流分析提示词
   */
  private buildWorkflowAnalysisPrompt(taskDescription: string, context?: Record<string, any>): string {
    const contextInfo = context ? JSON.stringify(context, null, 2) : 'No additional context'
    
    return `
Analyze the following development task and provide workflow recommendations:

Task: ${taskDescription}

Context: ${contextInfo}

Please provide a structured analysis in JSON format with the following structure:
{
  "approach": "string - recommended development approach",
  "confidence": 0.85,
  "estimatedEffort": {
    "hours": 2,
    "complexity": 3
  },
  "reasoning": "string - explanation of the recommendation",
  "requiredSkills": ["typescript", "react"],
  "risks": ["potential compatibility issues"],
  "dependencies": ["@linch-kit/core", "@linch-kit/ui"]
}
`.trim()
  }

  /**
   * 测试Provider连接
   */
  async testProvider(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      return false
    }

    try {
      const result = await provider.generateResponse('Test connection', { timeout: 5000 })
      return result.success
    } catch {
      return false
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.providers.clear()
    logger.info('AI Provider Manager cleaned up')
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 单例模式 - 全局共享的AI Provider Manager
let globalProviderManager: AIProviderManager | null = null

export function getGlobalAIProviderManager(config?: ProviderConfig): AIProviderManager {
  if (!globalProviderManager) {
    globalProviderManager = new AIProviderManager(config)
  }
  return globalProviderManager
}

export function resetGlobalAIProviderManager() {
  if (globalProviderManager) {
    globalProviderManager.cleanup()
    globalProviderManager = null
  }
}