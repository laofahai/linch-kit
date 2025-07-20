/**
 * 混合智能管理器
 * 结合AI分析与规则引擎的智能决策系统
 */

import { createLogger } from '@linch-kit/core'

import { CLIBasedAIProvider, COMMON_CLI_PROVIDERS, CLIAIResponse } from './cli-based-provider'
import { PromptTemplateEngine, TemplateContext, PromptCategory } from '../prompt/template-engine'

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
  // 新增：结构化分析选项
  templateId?: string
  templateVariables?: Record<string, unknown>
  expectedFormat?: 'json' | 'yaml' | 'markdown' | 'text'
  enforceSchema?: boolean
}

export interface AnalysisResult {
  content: string
  source: 'ai' | 'rules' | 'hybrid'
  provider?: string
  success: boolean
  executionTime: number
  confidence?: number
  // 新增：结构化输出元数据
  structured?: {
    format: 'json' | 'yaml' | 'markdown' | 'text'
    parsed: unknown
    schema_valid: boolean
    template_used?: string
  }
}

export class HybridAIManager {
  private providers: Map<string, CLIBasedAIProvider> = new Map()
  private config: HybridConfig
  private promptEngine: PromptTemplateEngine

  constructor(config: HybridConfig = {}) {
    this.config = {
      primaryProvider: 'gemini',
      fallbackProviders: ['claude'],
      aiTimeout: 60000, // 增加到60秒
      enableRuleFallback: true,
      ...config
    }
    
    this.promptEngine = new PromptTemplateEngine()
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

    // 准备Prompt - 使用模板引擎或直接使用原始prompt
    let finalPrompt = request.prompt
    let templateUsed: string | undefined

    if (request.templateId && request.templateVariables) {
      const context = this.buildTemplateContext(request)
      const promptResult = this.promptEngine.generatePrompt(request.templateId, context)
      
      if (promptResult.success) {
        finalPrompt = promptResult.prompt
        templateUsed = request.templateId
        logger.info(`Using prompt template: ${request.templateId}`)
      } else {
        logger.warn(`Template generation failed: ${promptResult.error}`)
        // 继续使用原始prompt
      }
    }

    // 如果指定了输出格式，增强prompt
    if (request.expectedFormat) {
      finalPrompt = this.enhancePromptWithFormat(finalPrompt, request.expectedFormat, request.enforceSchema)
    }

    // 如果不需要AI或没有配置AI，直接使用规则引擎
    if (!request.requiresAI && request.ruleBasedFallback) {
      logger.info('Using rule-based analysis (AI not required)')
      const content = request.ruleBasedFallback()
      return this.buildAnalysisResult(content, 'rules', Date.now() - startTime, {
        template_used: templateUsed,
        expected_format: request.expectedFormat
      })
    }

    // 尝试AI分析
    const aiResult = await this.tryAIAnalysis(finalPrompt)
    
    if (aiResult.success) {
      return this.buildAnalysisResult(aiResult.content, 'ai', aiResult.executionTime, {
        provider: aiResult.provider,
        template_used: templateUsed,
        expected_format: request.expectedFormat,
        enforce_schema: request.enforceSchema
      })
    }

    // AI失败，使用规则引擎作为降级
    if (this.config.enableRuleFallback && request.ruleBasedFallback) {
      logger.warn('AI analysis failed, falling back to rules')
      const content = request.ruleBasedFallback()
      return this.buildAnalysisResult(content, 'rules', Date.now() - startTime, {
        template_used: templateUsed,
        expected_format: request.expectedFormat
      })
    }

    // 所有方法都失败
    return {
      content: 'Analysis failed: No AI providers available and no rule-based fallback',
      source: 'hybrid',
      success: false,
      executionTime: Date.now() - startTime,
      confidence: 0,
      structured: templateUsed ? {
        format: request.expectedFormat || 'text',
        parsed: null,
        schema_valid: false,
        template_used: templateUsed
      } : undefined
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

  /**
   * 构建模板上下文
   */
  private buildTemplateContext(request: AnalysisRequest): TemplateContext {
    const context = request.context || {}
    
    return {
      project: {
        name: context.project_name || 'LinchKit',
        version: context.project_version || '1.0.0',
        type: context.project_type || 'TypeScript Full-stack Framework',
        constraints: context.constraints || []
      },
      session: {
        id: context.session_id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        task_description: context.task_description || 'AI工作流任务'
      },
      codebase: {
        packages: context.packages || [],
        current_branch: context.current_branch,
        recent_commits: context.recent_commits || []
      },
      variables: request.templateVariables || {}
    }
  }

  /**
   * 增强Prompt以支持指定格式输出
   */
  private enhancePromptWithFormat(
    prompt: string, 
    format: string, 
    enforceSchema?: boolean
  ): string {
    let enhancement = ''
    
    switch (format) {
      case 'json':
        enhancement = enforceSchema 
          ? '\n\n**重要**: 必须返回有效的JSON格式。如果无法提供结构化数据，请返回 {"error": "reason"}。'
          : '\n\n请以JSON格式返回结果。'
        break
      case 'yaml':
        enhancement = '\n\n请以YAML格式返回结果。'
        break
      case 'markdown':
        enhancement = '\n\n请以Markdown格式返回结果，包含适当的标题和结构。'
        break
      default:
        enhancement = ''
    }

    return prompt + enhancement
  }

  /**
   * 构建分析结果，包含结构化输出处理
   */
  private buildAnalysisResult(
    content: string, 
    source: 'ai' | 'rules' | 'hybrid',
    executionTime: number,
    metadata: {
      provider?: string
      template_used?: string
      expected_format?: string
      enforce_schema?: boolean
    }
  ): AnalysisResult {
    const result: AnalysisResult = {
      content,
      source,
      provider: metadata.provider,
      success: true,
      executionTime,
      confidence: source === 'ai' ? 0.9 : 0.8
    }

    // 处理结构化输出
    if (metadata.expected_format && metadata.expected_format !== 'text') {
      const structured = this.parseStructuredOutput(content, metadata.expected_format)
      result.structured = {
        format: metadata.expected_format as any,
        parsed: structured.parsed,
        schema_valid: structured.valid,
        template_used: metadata.template_used
      }

      // 如果强制Schema验证且验证失败，标记为失败
      if (metadata.enforce_schema && !structured.valid) {
        result.success = false
        result.confidence = 0.3
      }
    }

    return result
  }

  /**
   * 解析结构化输出
   */
  private parseStructuredOutput(content: string, format: string): { parsed: unknown; valid: boolean } {
    try {
      switch (format) {
        case 'json':
          // 尝试提取JSON内容（可能被包含在markdown代码块中）
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                           content.match(/\{[\s\S]*\}/) ||
                           [null, content]
          const jsonContent = jsonMatch[1] || jsonMatch[0] || content
          const parsed = JSON.parse(jsonContent.trim())
          return { parsed, valid: true }
        
        case 'yaml':
          // 简单的YAML解析（可以后续集成yaml库）
          const yamlMatch = content.match(/```yaml\s*([\s\S]*?)\s*```/) || [null, content]
          const yamlContent = yamlMatch[1] || content
          // 这里简化处理，实际应该使用yaml解析库
          return { parsed: yamlContent.trim(), valid: true }
        
        default:
          return { parsed: content, valid: true }
      }
    } catch (error) {
      logger.warn(`Failed to parse ${format} output:`, error)
      return { parsed: content, valid: false }
    }
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

  /**
   * 获取可用的模板分类
   */
  getTemplateCategories(): PromptCategory[] {
    const templates = this.promptEngine.getAllTemplates()
    const categories = [...new Set(templates.map(t => t.category))]
    return categories as PromptCategory[]
  }

  /**
   * 获取指定分类的模板
   */
  getTemplatesByCategory(category: PromptCategory) {
    return this.promptEngine.getTemplatesByCategory(category)
  }

  /**
   * 结构化工作流分析 - 使用预定义模板
   */
  async analyzeWorkflow(taskDescription: string, context?: Record<string, any>): Promise<AnalysisResult> {
    return this.analyze({
      prompt: '', // 会被模板覆盖
      templateId: 'workflow-decision',
      templateVariables: { task_description: taskDescription },
      expectedFormat: 'json',
      enforceSchema: true,
      context,
      requiresAI: true
    })
  }

  /**
   * 结构化架构分析 - 使用预定义模板
   */
  async analyzeArchitecture(
    codeContent: string, 
    analysisScope: string, 
    focusAreas?: string[]
  ): Promise<AnalysisResult> {
    return this.analyze({
      prompt: '', // 会被模板覆盖
      templateId: 'architecture-analysis',
      templateVariables: {
        code_content: codeContent,
        analysis_scope: analysisScope,
        focus_areas: focusAreas || []
      },
      expectedFormat: 'markdown',
      requiresAI: true
    })
  }
}

// 工厂函数：从环境变量创建混合管理器
export function createHybridAIManager(): HybridAIManager {
  const config: HybridConfig = {
    primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'gemini',
    fallbackProviders: process.env.AI_FALLBACK_PROVIDERS?.split(',') || ['claude'],
    aiTimeout: parseInt(process.env.AI_TIMEOUT || '60000'), // 默认60秒
    enableRuleFallback: process.env.AI_ENABLE_RULE_FALLBACK !== 'false'
  }

  return new HybridAIManager(config)
}