# @linch-kit/ai 包技术文档

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**开发优先级**: P2 - 中优先级
**依赖关系**: core → ai
**维护状态**: 🔄 开发中

---

## 📖 目录

1. [模块概览](#1-模块概览)
2. [API 设计](#2-api-设计)
3. [实现细节](#3-实现细节)
4. [集成接口](#4-集成接口)
5. [最佳实践](#5-最佳实践)
6. [性能考量](#6-性能考量)
7. [测试策略](#7-测试策略)
8. [AI 集成支持](#8-ai-集成支持)

---

## 1. 模块概览

### 1.1 功能定位

@linch-kit/ai 是 LinchKit 的 AI 服务集成核心包，提供统一的 AI 能力抽象层。它支持多种 AI 服务提供商（OpenAI、Anthropic、本地模型等），为整个 LinchKit 生态系统提供一致的 AI 调用接口。

```mermaid
graph TB
    A[LinchKit 应用层] --> B[@linch-kit/ai]
    B --> C[AI 提供商抽象层]
    C --> D[OpenAI Provider]
    C --> E[Anthropic Provider]
    C --> F[Local Model Provider]
    C --> G[Custom Provider]

    B --> H[AI 服务管理层]
    H --> I[注册表管理]
    H --> J[配置管理]
    H --> K[缓存管理]
    H --> L[监控管理]
```

### 1.2 核心价值

- **🔌 多后端支持**: 统一接口支持主流 AI 服务和本地模型
- **⚡ 高性能**: 智能缓存、连接池、请求优化
- **🛡️ 可靠性**: 重试机制、错误处理、降级策略
- **📊 可观测性**: 完整的监控、日志、性能指标
- **🔧 易扩展**: 插件化架构，易于添加新的 AI 提供商
- **💰 成本优化**: 智能路由、缓存策略、使用量监控

### 1.3 技术架构

```typescript
// 核心架构概览
interface AIArchitecture {
  // 提供商层：AI 服务抽象
  providers: {
    openai: OpenAIProvider
    anthropic: AnthropicProvider
    local: LocalModelProvider
    custom: CustomProvider[]
  }

  // 管理层：服务管理和协调
  management: {
    registry: AIRegistry
    config: ConfigManager
    cache: CacheManager
    monitor: MonitoringManager
  }

  // 服务层：统一 AI 服务接口
  services: {
    completion: CompletionService
    chat: ChatService
    embedding: EmbeddingService
    image: ImageService
  }

  // 工具层：辅助功能
  utilities: {
    tokenizer: TokenizerUtils
    validator: ValidationUtils
    formatter: ResponseFormatter
  }
}
```

### 1.4 职责边界

| 职责范围 | 包含功能 | 不包含功能 |
|---------|---------|-----------|
| **AI 服务抽象** | 提供商接口、统一调用、协议转换 | 具体 AI 模型训练 |
| **配置管理** | 多提供商配置、认证管理、环境切换 | 业务配置逻辑 |
| **性能优化** | 缓存策略、连接池、请求优化 | 业务层性能优化 |
| **监控观测** | 使用量统计、性能监控、错误追踪 | 业务指标监控 |
| **扩展支持** | 插件接口、自定义提供商 | 业务插件开发 |

---

## 2. API 设计

### 2.1 核心接口设计

#### AI 提供商抽象接口

```typescript
// 基础 AI 提供商接口
export abstract class AIProvider {
  abstract readonly name: string
  abstract readonly version: string
  abstract readonly capabilities: AICapabilities

  // 生命周期管理
  abstract initialize(config: AIConfig): Promise<void>
  abstract destroy(): Promise<void>
  abstract healthCheck(): Promise<HealthCheckResult>

  // 文本生成
  abstract complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResponse>

  // 对话生成
  abstract chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse>

  // 嵌入向量
  abstract embeddings(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<EmbeddingResponse>

  // 流式响应
  abstract streamComplete(
    prompt: string,
    options?: StreamOptions
  ): AsyncIterable<CompletionChunk>

  abstract streamChat(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncIterable<ChatChunk>

  // 函数调用
  abstract callFunction(
    messages: ChatMessage[],
    functions: FunctionDefinition[],
    options?: FunctionCallOptions
  ): Promise<FunctionCallResponse>

  // 多模态能力（可选）
  abstract generateImage?(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageResponse>

  abstract analyzeImage?(
    image: ImageInput,
    prompt: string,
    options?: ImageAnalysisOptions
  ): Promise<ImageAnalysisResponse>

  abstract processAudio?(
    audio: AudioInput,
    options?: AudioProcessingOptions
  ): Promise<AudioResponse>
}

// AI 能力定义
export interface AICapabilities {
  // 基础文本能力
  completion: boolean
  chat: boolean
  embeddings: boolean

  // 高级功能
  streaming: boolean
  functionCalling: boolean
  jsonMode: boolean
  systemPrompt: boolean

  // 多模态能力
  imageGeneration: boolean
  imageAnalysis: boolean
  audioProcessing: boolean
  videoProcessing: boolean

  // 模型信息
  models: ModelInfo[]
  maxTokens: number
  supportedLanguages: string[]

  // 性能特征
  latency: 'low' | 'medium' | 'high'
  throughput: 'low' | 'medium' | 'high'
  costEfficiency: 'low' | 'medium' | 'high'
}

// 模型信息
export interface ModelInfo {
  id: string
  name: string
  description: string
  contextLength: number
  inputTypes: ('text' | 'image' | 'audio' | 'video')[]
  outputTypes: ('text' | 'image' | 'audio' | 'video')[]
  pricing?: {
    input: number  // per 1K tokens
    output: number // per 1K tokens
    image?: number // per image
    audio?: number // per minute
  }
  limits?: {
    requestsPerMinute: number
    tokensPerMinute: number
    concurrentRequests: number
  }
}
```

### 2.2 统一服务接口

#### AI 服务管理器

```typescript
// 主要的 AI 服务接口
export interface AIService {
  // 提供商管理
  registerProvider(provider: AIProvider): void
  unregisterProvider(name: string): void
  listProviders(): ProviderInfo[]
  getProvider(name: string): AIProvider | undefined

  // 配置管理
  configure(config: AIServiceConfig): Promise<void>
  setDefaultProvider(name: string, config?: AIConfig): Promise<void>

  // 文本生成服务
  complete(
    prompt: string,
    options?: CompletionServiceOptions
  ): Promise<CompletionResponse>

  // 对话服务
  chat(
    messages: ChatMessage[],
    options?: ChatServiceOptions
  ): Promise<ChatResponse>

  // 流式对话
  streamChat(
    messages: ChatMessage[],
    options?: StreamServiceOptions
  ): AsyncIterable<ChatChunk>

  // 嵌入服务
  embeddings(
    texts: string[],
    options?: EmbeddingServiceOptions
  ): Promise<EmbeddingResponse>

  // 函数调用服务
  callFunction(
    messages: ChatMessage[],
    functions: FunctionDefinition[],
    options?: FunctionServiceOptions
  ): Promise<FunctionCallResponse>

  // 多模态服务
  generateImage(
    prompt: string,
    options?: ImageGenerationServiceOptions
  ): Promise<ImageResponse>

  analyzeImage(
    image: ImageInput,
    prompt: string,
    options?: ImageAnalysisServiceOptions
  ): Promise<ImageAnalysisResponse>

  // 工具方法
  estimateTokens(text: string, model?: string): number
  estimateCost(usage: TokenUsage, model?: string): number

  // 监控和统计
  getUsageStats(timeRange?: TimeRange): Promise<UsageStats>
  getPerformanceMetrics(): Promise<PerformanceMetrics>
}

// 服务配置
export interface AIServiceConfig {
  // 默认提供商
  defaultProvider?: string

  // 提供商配置
  providers: Record<string, AIConfig>

  // 缓存配置
  cache?: {
    enabled: boolean
    ttl: number
    maxSize: number
    strategy: 'memory' | 'redis' | 'hybrid'
  }

  // 重试配置
  retry?: {
    enabled: boolean
    maxAttempts: number
    backoffStrategy: 'linear' | 'exponential'
    baseDelay: number
  }

  // 监控配置
  monitoring?: {
    enabled: boolean
    metricsInterval: number
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }

  // 限流配置
  rateLimit?: {
    enabled: boolean
    requestsPerMinute: number
    tokensPerMinute: number
  }
}
```

### 2.3 请求和响应类型

#### 通用类型定义

```typescript
// 聊天消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  functionCall?: FunctionCall
}

// 函数调用
export interface FunctionCall {
  name: string
  arguments: string
}

// 函数定义
export interface FunctionDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

// 完成响应
export interface CompletionResponse {
  text: string
  usage: TokenUsage
  model: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call'
  metadata?: Record<string, any>
}

// 聊天响应
export interface ChatResponse {
  message: ChatMessage
  usage: TokenUsage
  model: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call'
  metadata?: Record<string, any>
}

// 流式响应块
export interface ChatChunk {
  content?: string
  role?: string
  finishReason?: string
  functionCall?: Partial<FunctionCall>
  metadata?: Record<string, any>
}

// 嵌入响应
export interface EmbeddingResponse {
  embeddings: number[][]
  usage: TokenUsage
  model: string
  metadata?: Record<string, any>
}

// Token 使用情况
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

// 健康检查结果
export interface HealthCheckResult {
  healthy: boolean
  latency?: number
  error?: string
  metadata?: Record<string, any>
}
```

### 2.4 配置接口

#### 提供商配置

```typescript
// 基础配置接口
export interface AIConfig {
  apiKey?: string
  baseURL?: string
  timeout?: number
  retries?: number
  metadata?: Record<string, any>
}

// OpenAI 配置
export interface OpenAIConfig extends AIConfig {
  organization?: string
  project?: string
  dangerouslyAllowBrowser?: boolean
}

// Anthropic 配置
export interface AnthropicConfig extends AIConfig {
  version?: string
  maxRetries?: number
}

// 本地模型配置
export interface LocalModelConfig extends AIConfig {
  modelPath: string
  device?: 'cpu' | 'gpu' | 'auto'
  threads?: number
  contextSize?: number
}

// 自定义提供商配置
export interface CustomProviderConfig extends AIConfig {
  endpoint: string
  headers?: Record<string, string>
  authentication?: {
    type: 'bearer' | 'api-key' | 'basic' | 'custom'
    credentials: Record<string, string>
  }
}
```

### 2.5 错误处理接口

#### 错误类型定义

```typescript
// AI 错误基类
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AIError'
  }
}

// 具体错误类型
export class AIProviderError extends AIError {
  constructor(message: string, provider: string, details?: any) {
    super(message, 'PROVIDER_ERROR', provider, details)
  }
}

export class AIConfigurationError extends AIError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', undefined, details)
  }
}

export class AIRateLimitError extends AIError {
  constructor(message: string, provider: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', provider, { retryAfter })
  }
}

export class AIQuotaExceededError extends AIError {
  constructor(message: string, provider: string, details?: any) {
    super(message, 'QUOTA_EXCEEDED_ERROR', provider, details)
  }
}

export class AIValidationError extends AIError {
  constructor(message: string, field: string, value: any) {
    super(message, 'VALIDATION_ERROR', undefined, { field, value })
  }
}

// 错误处理器接口
export interface ErrorHandler {
  handle(error: Error, context: ErrorContext): Promise<ErrorHandlingResult>
  canHandle(error: Error): boolean
  priority: number
}

export interface ErrorContext {
  provider: string
  operation: string
  input: any
  attempt: number
  timestamp: Date
}

export interface ErrorHandlingResult {
  action: 'retry' | 'fallback' | 'fail'
  delay?: number
  fallbackProvider?: string
  transformedError?: Error
}
```

---

## 3. 实现细节

### 3.1 AI 注册表实现

#### 提供商注册和管理

```typescript
export class AIRegistry {
  private providers: Map<string, typeof AIProvider> = new Map()
  private instances: Map<string, AIProvider> = new Map()
  private configs: Map<string, AIConfig> = new Map()
  private healthStatus: Map<string, HealthCheckResult> = new Map()

  constructor(private logger: Logger) {}

  // 注册提供商类
  registerProvider(ProviderClass: typeof AIProvider): void {
    const provider = new ProviderClass()
    this.providers.set(provider.name, ProviderClass)
    this.logger.info(`Registered AI provider: ${provider.name}`)
  }

  // 创建提供商实例
  async createInstance(
    providerName: string,
    config: AIConfig
  ): Promise<AIProvider> {
    const ProviderClass = this.providers.get(providerName)
    if (!ProviderClass) {
      throw new AIProviderError(`Provider '${providerName}' not found`, providerName)
    }

    const configHash = this.hashConfig(config)
    const instanceKey = `${providerName}:${configHash}`

    // 检查是否已存在实例
    const existingInstance = this.instances.get(instanceKey)
    if (existingInstance) {
      return existingInstance
    }

    // 创建新实例
    const instance = new ProviderClass()

    try {
      await instance.initialize(config)

      // 健康检查
      const healthResult = await instance.healthCheck()
      this.healthStatus.set(instanceKey, healthResult)

      if (!healthResult.healthy) {
        throw new AIProviderError(
          `Provider '${providerName}' failed health check: ${healthResult.error}`,
          providerName,
          healthResult
        )
      }

      this.instances.set(instanceKey, instance)
      this.configs.set(instanceKey, config)

      this.logger.info(`Created AI provider instance: ${instanceKey}`)
      return instance

    } catch (error) {
      this.logger.error(`Failed to create AI provider instance: ${instanceKey}`, error)
      throw error
    }
  }

  // 获取提供商实例
  getInstance(providerName: string, configHash?: string): AIProvider | undefined {
    if (configHash) {
      return this.instances.get(`${providerName}:${configHash}`)
    }

    // 返回第一个匹配的健康实例
    for (const [key, instance] of this.instances) {
      if (key.startsWith(`${providerName}:`)) {
        const health = this.healthStatus.get(key)
        if (health?.healthy) {
          return instance
        }
      }
    }

    return undefined
  }

  // 销毁实例
  async destroyInstance(providerName: string, configHash?: string): Promise<void> {
    const pattern = configHash ? `${providerName}:${configHash}` : `${providerName}:`

    for (const [key, instance] of this.instances) {
      if (key.startsWith(pattern)) {
        try {
          await instance.destroy()
          this.instances.delete(key)
          this.configs.delete(key)
          this.healthStatus.delete(key)
          this.logger.info(`Destroyed AI provider instance: ${key}`)
        } catch (error) {
          this.logger.error(`Failed to destroy AI provider instance: ${key}`, error)
        }
      }
    }
  }

  // 列出所有提供商
  listProviders(): ProviderInfo[] {
    return Array.from(this.providers.entries()).map(([name, ProviderClass]) => {
      const provider = new ProviderClass()
      const instances = this.getProviderInstances(name)

      return {
        name,
        version: provider.version,
        capabilities: provider.capabilities,
        instanceCount: instances.length,
        healthyInstances: instances.filter(i => i.healthy).length
      }
    })
  }

  // 获取提供商能力
  getCapabilities(providerName: string): AICapabilities | undefined {
    const ProviderClass = this.providers.get(providerName)
    if (!ProviderClass) return undefined

    const provider = new ProviderClass()
    return provider.capabilities
  }

  // 健康检查
  async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.instances.entries()).map(async ([key, instance]) => {
      try {
        const result = await instance.healthCheck()
        this.healthStatus.set(key, result)

        if (!result.healthy) {
          this.logger.warn(`Provider instance unhealthy: ${key}`, result)
        }
      } catch (error) {
        this.healthStatus.set(key, {
          healthy: false,
          error: error.message
        })
        this.logger.error(`Health check failed for: ${key}`, error)
      }
    })

    await Promise.all(checks)
  }

  private hashConfig(config: AIConfig): string {
    // 创建配置的哈希值，排除敏感信息
    const sanitized = { ...config }
    delete sanitized.apiKey
    return crypto.createHash('md5').update(JSON.stringify(sanitized)).digest('hex')
  }

  private getProviderInstances(providerName: string): InstanceInfo[] {
    const instances: InstanceInfo[] = []

    for (const [key, instance] of this.instances) {
      if (key.startsWith(`${providerName}:`)) {
        const health = this.healthStatus.get(key)
        instances.push({
          key,
          healthy: health?.healthy || false,
          latency: health?.latency,
          error: health?.error
        })
      }
    }

    return instances
  }
}

interface ProviderInfo {
  name: string
  version: string
  capabilities: AICapabilities
  instanceCount: number
  healthyInstances: number
}

interface InstanceInfo {
  key: string
  healthy: boolean
  latency?: number
  error?: string
}
```

### 3.2 OpenAI 提供商实现

#### OpenAI 提供商类

```typescript
export class OpenAIProvider extends AIProvider {
  readonly name = 'openai'
  readonly version = '1.0.0'
  readonly capabilities: AICapabilities = {
    completion: true,
    chat: true,
    embeddings: true,
    streaming: true,
    functionCalling: true,
    jsonMode: true,
    systemPrompt: true,
    imageGeneration: true,
    imageAnalysis: true,
    audioProcessing: true,
    videoProcessing: false,
    models: [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Most capable model with vision',
        contextLength: 128000,
        inputTypes: ['text', 'image'],
        outputTypes: ['text'],
        pricing: { input: 0.01, output: 0.03 },
        limits: {
          requestsPerMinute: 500,
          tokensPerMinute: 150000,
          concurrentRequests: 10
        }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model',
        contextLength: 16385,
        inputTypes: ['text'],
        outputTypes: ['text'],
        pricing: { input: 0.0005, output: 0.0015 },
        limits: {
          requestsPerMinute: 3500,
          tokensPerMinute: 90000,
          concurrentRequests: 20
        }
      },
      {
        id: 'text-embedding-3-large',
        name: 'Text Embedding 3 Large',
        description: 'Most capable embedding model',
        contextLength: 8191,
        inputTypes: ['text'],
        outputTypes: ['embedding'],
        pricing: { input: 0.00013, output: 0 }
      }
    ],
    maxTokens: 128000,
    supportedLanguages: ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru'],
    latency: 'medium',
    throughput: 'high',
    costEfficiency: 'medium'
  }

  private client?: OpenAI
  private config?: OpenAIConfig
  private rateLimiter?: RateLimiter

  async initialize(config: OpenAIConfig): Promise<void> {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      project: config.project,
      timeout: config.timeout || 60000,
      maxRetries: config.retries || 3,
    })

    // 初始化限流器
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 500,
      tokensPerMinute: 150000
    })

    // 验证连接
    const healthResult = await this.healthCheck()
    if (!healthResult.healthy) {
      throw new AIProviderError(
        `OpenAI provider initialization failed: ${healthResult.error}`,
        this.name,
        healthResult
      )
    }
  }

  async destroy(): Promise<void> {
    this.client = undefined
    this.config = undefined
    this.rateLimiter = undefined
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      if (!this.client) {
        return {
          healthy: false,
          error: 'Client not initialized'
        }
      }

      await this.client.models.list()
      const latency = Date.now() - startTime

      return {
        healthy: true,
        latency,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error.message,
        metadata: {
          provider: this.name,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async complete(
    prompt: string,
    options: OpenAICompletionOptions = {}
  ): Promise<CompletionResponse> {
    if (!this.client) {
      throw new AIProviderError('OpenAI provider not initialized', this.name)
    }

    // 限流检查
    await this.rateLimiter?.checkLimit('completion')

    try {
      const response = await this.client.completions.create({
        model: options.model || 'gpt-3.5-turbo-instruct',
        prompt,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        user: options.user,
      })

      return {
        text: response.choices[0]?.text || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finishReason: this.mapFinishReason(response.choices[0]?.finish_reason),
        metadata: {
          id: response.id,
          created: response.created,
          provider: this.name
        }
      }
    } catch (error) {
      throw this.handleError(error, 'completion', { prompt, options })
    }
  }

  async chat(
    messages: ChatMessage[],
    options: OpenAIChatOptions = {}
  ): Promise<ChatResponse> {
    if (!this.client) {
      throw new AIProviderError('OpenAI provider not initialized', this.name)
    }

    // 限流检查
    await this.rateLimiter?.checkLimit('chat')

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: this.formatMessages(messages),
        max_tokens: options.maxTokens,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        functions: options.functions,
        function_call: options.functionCall,
        response_format: options.responseFormat,
        user: options.user,
      })

      const choice = response.choices[0]
      return {
        message: {
          role: choice?.message?.role || 'assistant',
          content: choice?.message?.content || '',
          functionCall: choice?.message?.function_call ? {
            name: choice.message.function_call.name,
            arguments: choice.message.function_call.arguments
          } : undefined,
        },
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finishReason: this.mapFinishReason(choice?.finish_reason),
        metadata: {
          id: response.id,
          created: response.created,
          provider: this.name
        }
      }
    } catch (error) {
      throw this.handleError(error, 'chat', { messages, options })
    }
  }

  async *streamChat(
    messages: ChatMessage[],
    options: OpenAIStreamOptions = {}
  ): AsyncIterable<ChatChunk> {
    if (!this.client) {
      throw new AIProviderError('OpenAI provider not initialized', this.name)
    }

    // 限流检查
    await this.rateLimiter?.checkLimit('stream')

    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: this.formatMessages(messages),
        stream: true,
        max_tokens: options.maxTokens,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        user: options.user,
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (delta) {
          yield {
            content: delta.content || undefined,
            role: delta.role || undefined,
            finishReason: chunk.choices[0]?.finish_reason || undefined,
            functionCall: delta.function_call ? {
              name: delta.function_call.name,
              arguments: delta.function_call.arguments
            } : undefined,
            metadata: {
              id: chunk.id,
              created: chunk.created,
              provider: this.name
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error, 'streamChat', { messages, options })
    }
  }

  async embeddings(
    texts: string[],
    options: OpenAIEmbeddingOptions = {}
  ): Promise<EmbeddingResponse> {
    if (!this.client) {
      throw new AIProviderError('OpenAI provider not initialized', this.name)
    }

    try {
      const response = await this.client.embeddings.create({
        model: options.model || 'text-embedding-3-small',
        input: texts,
        encoding_format: options.encodingFormat || 'float',
        dimensions: options.dimensions,
        user: options.user,
      })

      return {
        embeddings: response.data.map(item => item.embedding),
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: 0,
          totalTokens: response.usage.total_tokens,
        },
        model: response.model,
        metadata: {
          provider: this.name,
          dimensions: response.data[0]?.embedding.length
        }
      }
    } catch (error) {
      throw this.handleError(error, 'embeddings', { texts, options })
    }
  }

  private formatMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
      function_call: msg.functionCall ? {
        name: msg.functionCall.name,
        arguments: msg.functionCall.arguments
      } : undefined
    }))
  }

  private mapFinishReason(reason?: string): string {
    const reasonMap: Record<string, string> = {
      'stop': 'stop',
      'length': 'length',
      'content_filter': 'content_filter',
      'function_call': 'function_call',
      'tool_calls': 'function_call'
    }
    return reasonMap[reason || ''] || 'unknown'
  }

  private handleError(error: any, operation: string, context: any): AIError {
    if (error.status === 429) {
      return new AIRateLimitError(
        `OpenAI rate limit exceeded for ${operation}`,
        this.name,
        error.headers?.['retry-after']
      )
    }

    if (error.status === 402) {
      return new AIQuotaExceededError(
        `OpenAI quota exceeded for ${operation}`,
        this.name,
        { usage: context }
      )
    }

    return new AIProviderError(
      `OpenAI ${operation} failed: ${error.message}`,
      this.name,
      { error, context }
    )
  }
}
```

### 3.3 缓存管理器实现

#### 智能缓存系统

```typescript
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private accessOrder: string[] = []
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  }

  constructor(private config: CacheConfig, private logger: Logger) {}

  async get<T>(key: string): Promise<T | null> {
    this.stats.totalRequests++

    const entry = this.cache.get(key)

    if (!entry || this.isExpired(entry)) {
      this.stats.misses++
      if (entry) {
        this.cache.delete(key)
        this.removeFromAccessOrder(key)
      }
      return null
    }

    this.stats.hits++
    this.updateAccessOrder(key)

    return entry.value as T
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      createdAt: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      size: this.estimateSize(value)
    }

    if (this.cache.size >= this.config.maxSize) {
      await this.evictEntries()
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl
  }

  private async evictEntries(): Promise<void> {
    const evictionCount = Math.max(1, Math.floor(this.config.maxSize * 0.1))

    for (let i = 0; i < evictionCount && this.accessOrder.length > 0; i++) {
      const keyToEvict = this.accessOrder.shift()!
      this.cache.delete(keyToEvict)
      this.stats.evictions++
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2
    } catch {
      return 1000
    }
  }
}
```

### 3.4 AI 服务管理器实现

```typescript
export class AIServiceManager implements AIService {
  private registry: AIRegistry
  private cacheManager: CacheManager
  private config: AIServiceConfig
  private defaultProvider?: string

  constructor(config: AIServiceConfig, logger: Logger) {
    this.config = config
    this.registry = new AIRegistry(logger)
    this.cacheManager = new CacheManager(config.cache || {
      defaultTTL: 5 * 60 * 1000,
      maxSize: 1000
    }, logger)

    this.registerBuiltinProviders()
  }

  async configure(config: AIServiceConfig): Promise<void> {
    this.config = { ...this.config, ...config }

    for (const [providerName, providerConfig] of Object.entries(config.providers)) {
      try {
        await this.registry.createInstance(providerName, providerConfig)
      } catch (error) {
        console.error(`Failed to configure provider ${providerName}:`, error)
      }
    }

    if (config.defaultProvider) {
      this.defaultProvider = config.defaultProvider
    }
  }

  registerProvider(provider: AIProvider): void {
    this.registry.registerProvider(provider.constructor as typeof AIProvider)
  }

  async complete(
    prompt: string,
    options: CompletionServiceOptions = {}
  ): Promise<CompletionResponse> {
    const provider = this.getProviderForRequest(options.provider)
    const cacheKey = this.generateCacheKey('complete', { prompt, options })

    if (this.config.cache?.enabled) {
      const cached = await this.cacheManager.get<CompletionResponse>(cacheKey)
      if (cached) return cached
    }

    const response = await provider.complete(prompt, options)

    if (this.config.cache?.enabled) {
      await this.cacheManager.set(cacheKey, response, this.config.cache.ttl)
    }

    return response
  }

  private getProviderForRequest(providerName?: string): AIProvider {
    const targetProvider = providerName || this.defaultProvider

    if (!targetProvider) {
      throw new AIConfigurationError('No provider specified and no default provider set')
    }

    const provider = this.registry.getInstance(targetProvider)
    if (!provider) {
      throw new AIProviderError(`Provider '${targetProvider}' not found`, targetProvider)
    }

    return provider
  }

  private generateCacheKey(operation: string, params: any): string {
    const sanitized = { ...params }
    delete sanitized.apiKey
    delete sanitized.user

    const hash = crypto.createHash('md5').update(JSON.stringify(sanitized)).digest('hex')
    return `${operation}:${hash}`
  }

  private registerBuiltinProviders(): void {
    this.registry.registerProvider(OpenAIProvider)
    this.registry.registerProvider(AnthropicProvider)
  }
}
```

---

## 4. 集成接口

### 4.1 与 @linch-kit/core 集成

#### 插件系统集成

```typescript
import { Plugin, PluginManager } from '@linch-kit/core'

export class AIPlugin implements Plugin {
  id = 'ai'
  name = 'AI Integration Plugin'
  version = '1.0.0'
  description = 'Provides AI service integration with multiple providers'

  private aiService?: AIServiceManager

  async setup(context: PluginContext): Promise<void> {
    // 插件设置阶段
    console.log('AI plugin setup')
  }

  async activate(context: PluginContext): Promise<void> {
    // 注册 AI 相关钩子
    context.hooks.register('ai:before-request', this.beforeRequest)
    context.hooks.register('ai:after-request', this.afterRequest)
    context.hooks.register('ai:error', this.onError)

    // 注册 AI 服务
    const config = context.getConfig('ai') as AIServiceConfig
    this.aiService = new AIServiceManager(config, context.logger)

    // 将 AI 服务注册到插件上下文
    context.registerService('ai', this.aiService)
  }

  async deactivate(context: PluginContext): Promise<void> {
    // 清理钩子注册
    context.hooks.unregister('ai:before-request', this.beforeRequest)
    context.hooks.unregister('ai:after-request', this.afterRequest)
    context.hooks.unregister('ai:error', this.onError)
  }

  async teardown(context: PluginContext): Promise<void> {
    if (this.aiService) {
      const providers = this.aiService.listProviders()
      for (const provider of providers) {
        this.aiService.unregisterProvider(provider.name)
      }
    }
  }

  private async beforeRequest(context: any): Promise<void> {
    console.log('AI request starting:', context)
  }

  private async afterRequest(context: any): Promise<void> {
    console.log('AI request completed:', context)
  }

  private async onError(context: any): Promise<void> {
    console.error('AI request error:', context)
  }
}
```

### 4.2 与其他包的集成

#### 与 @linch-kit/schema 集成

```typescript
import { EntitySchema } from '@linch-kit/schema'

export class AISchemaIntegration {
  constructor(private aiService: AIService) {}

  async generateSchemaFromDescription(
    description: string,
    options: SchemaGenerationOptions = {}
  ): Promise<EntitySchema<any>> {
    const prompt = this.buildSchemaPrompt(description, options)

    const response = await this.aiService.chat([
      {
        role: 'system',
        content: 'You are a schema generation expert. Generate TypeScript schemas based on descriptions.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      provider: options.provider,
      model: options.model || 'gpt-4',
      responseFormat: { type: 'json_object' }
    })

    return this.parseSchemaResponse(response.message.content)
  }

  async validateSchemaWithAI(
    schema: EntitySchema<any>,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const prompt = this.buildValidationPrompt(schema, context)

    const response = await this.aiService.complete(prompt, {
      provider: context.provider,
      maxTokens: 1000
    })

    return this.parseValidationResponse(response.text)
  }

  private buildSchemaPrompt(description: string, options: SchemaGenerationOptions): string {
    return `
Generate a TypeScript entity schema for: ${description}

Requirements:
- Include field types, validation rules, and relationships
- Follow best practices for data modeling
- Include appropriate indexes and constraints
- Format as JSON schema

Additional context: ${options.context || 'None'}
    `.trim()
  }
}
```

#### 与 @linch-kit/crud 集成

```typescript
import { CRUDManager } from '@linch-kit/crud'

export class AICRUDIntegration {
  constructor(private aiService: AIService) {}

  async generateCRUDOperations(
    entityName: string,
    schema: EntitySchema<any>,
    requirements: CRUDRequirements
  ): Promise<CRUDOperations> {
    const prompt = this.buildCRUDPrompt(entityName, schema, requirements)

    const response = await this.aiService.chat([
      {
        role: 'system',
        content: 'You are a CRUD operation generator. Create efficient database operations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      model: 'gpt-4',
      responseFormat: { type: 'json_object' }
    })

    return this.parseCRUDResponse(response.message.content)
  }

  async optimizeQuery(
    query: QueryInput<any>,
    performance: PerformanceMetrics
  ): Promise<OptimizedQuery> {
    const prompt = this.buildQueryOptimizationPrompt(query, performance)

    const response = await this.aiService.complete(prompt, {
      maxTokens: 1500
    })

    return this.parseOptimizationResponse(response.text)
  }
}
```

---

## 5. 最佳实践

### 5.1 提供商选择最佳实践

#### 1. 根据用例选择提供商

```typescript
// ✅ 推荐：根据具体需求选择提供商
const getOptimalProvider = (task: AITask): ProviderConfig => {
  switch (task.type) {
    case 'code-generation':
      return {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.1 // 低温度确保代码准确性
      }

    case 'creative-writing':
      return {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        temperature: 0.8 // 高温度增加创造性
      }

    case 'data-analysis':
      return {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.2 // 中低温度平衡准确性和灵活性
      }

    case 'embedding':
      return {
        provider: 'openai',
        model: 'text-embedding-3-large'
      }

    default:
      return {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      }
  }
}

// 使用示例
const task: AITask = { type: 'code-generation', context: 'TypeScript API' }
const config = getOptimalProvider(task)
const response = await aiService.complete(prompt, config)
```

#### 2. 实现智能降级策略

```typescript
// ✅ 推荐：实现提供商降级
export class FallbackStrategy {
  private providers = [
    { name: 'openai', priority: 1, cost: 'medium' },
    { name: 'anthropic', priority: 2, cost: 'high' },
    { name: 'local', priority: 3, cost: 'low' }
  ]

  async executeWithFallback<T>(
    operation: (provider: AIProvider) => Promise<T>,
    options: FallbackOptions = {}
  ): Promise<T> {
    const sortedProviders = this.providers
      .filter(p => !options.excludeProviders?.includes(p.name))
      .sort((a, b) => a.priority - b.priority)

    let lastError: Error | undefined

    for (const providerConfig of sortedProviders) {
      try {
        const provider = await this.aiService.getProvider(providerConfig.name)
        const result = await operation(provider)

        // 记录成功使用的提供商
        this.recordProviderSuccess(providerConfig.name)
        return result

      } catch (error) {
        lastError = error
        this.recordProviderFailure(providerConfig.name, error)

        // 如果是配额错误，跳过该提供商
        if (error instanceof AIQuotaExceededError) {
          continue
        }

        // 如果是最后一个提供商，抛出错误
        if (providerConfig === sortedProviders[sortedProviders.length - 1]) {
          throw error
        }
      }
    }

    throw lastError || new Error('All providers failed')
  }
}
```

### 5.2 性能优化最佳实践

#### 1. 智能缓存策略

```typescript
// ✅ 推荐：基于内容和上下文的缓存策略
export class SmartCacheStrategy {
  generateCacheKey(
    operation: string,
    input: any,
    options: any
  ): string {
    // 标准化输入以提高缓存命中率
    const normalizedInput = this.normalizeInput(input)
    const relevantOptions = this.extractRelevantOptions(options)

    const cacheData = {
      operation,
      input: normalizedInput,
      options: relevantOptions
    }

    return crypto.createHash('sha256')
      .update(JSON.stringify(cacheData))
      .digest('hex')
  }

  private normalizeInput(input: any): any {
    if (typeof input === 'string') {
      // 移除多余空格，统一换行符
      return input.trim().replace(/\s+/g, ' ').replace(/\r\n/g, '\n')
    }

    if (Array.isArray(input)) {
      return input.map(item => this.normalizeInput(item))
    }

    if (typeof input === 'object' && input !== null) {
      const normalized: any = {}
      for (const [key, value] of Object.entries(input)) {
        normalized[key] = this.normalizeInput(value)
      }
      return normalized
    }

    return input
  }

  private extractRelevantOptions(options: any): any {
    // 只缓存影响结果的选项
    const relevantKeys = [
      'model', 'temperature', 'maxTokens', 'topP',
      'frequencyPenalty', 'presencePenalty', 'stop'
    ]

    const relevant: any = {}
    for (const key of relevantKeys) {
      if (options[key] !== undefined) {
        relevant[key] = options[key]
      }
    }

    return relevant
  }
}
```

#### 2. 请求批处理

```typescript
// ✅ 推荐：批量处理相似请求
export class BatchProcessor {
  private pendingRequests: Map<string, PendingRequest[]> = new Map()
  private batchTimeout = 100 // 100ms

  async batchProcess<T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const pending: PendingRequest = { resolve, reject, request }

      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, [])

        // 设置批处理定时器
        setTimeout(() => {
          this.processBatch(key)
        }, this.batchTimeout)
      }

      this.pendingRequests.get(key)!.push(pending)
    })
  }

  private async processBatch(key: string): Promise<void> {
    const requests = this.pendingRequests.get(key) || []
    this.pendingRequests.delete(key)

    if (requests.length === 0) return

    try {
      // 执行第一个请求，其他请求共享结果
      const result = await requests[0].request()

      // 所有请求返回相同结果
      requests.forEach(req => req.resolve(result))

    } catch (error) {
      // 所有请求返回相同错误
      requests.forEach(req => req.reject(error))
    }
  }
}
```

### 5.3 错误处理最佳实践

#### 1. 分层错误处理

```typescript
// ✅ 推荐：分层错误处理策略
export class ErrorHandlingStrategy {
  private errorHandlers: ErrorHandler[] = [
    new RateLimitErrorHandler(),
    new QuotaErrorHandler(),
    new NetworkErrorHandler(),
    new ValidationErrorHandler(),
    new GenericErrorHandler()
  ]

  async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorHandlingResult> {
    // 按优先级处理错误
    for (const handler of this.errorHandlers) {
      if (handler.canHandle(error)) {
        const result = await handler.handle(error, context)

        // 记录错误处理结果
        this.logErrorHandling(error, handler, result)

        return result
      }
    }

    // 默认处理
    return { action: 'fail', transformedError: error }
  }
}

class RateLimitErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof AIRateLimitError
  }

  async handle(error: AIRateLimitError, context: ErrorContext): Promise<ErrorHandlingResult> {
    const retryAfter = error.details?.retryAfter || 60

    if (context.attempt < 3) {
      return {
        action: 'retry',
        delay: retryAfter * 1000
      }
    }

    // 尝试降级到其他提供商
    const fallbackProvider = this.selectFallbackProvider(context.provider)
    if (fallbackProvider) {
      return {
        action: 'fallback',
        fallbackProvider
      }
    }

    return { action: 'fail', transformedError: error }
  }

  priority = 1
}
```

---

## 6. 性能考量

### 6.1 性能指标

| 指标 | 目标值 | 当前值 | 优化策略 |
|------|--------|--------|----------|
| **API 响应时间** | < 5秒 | 3.2秒 | 连接池、缓存优化 |
| **流式首字节** | < 100ms | 80ms | 连接复用、预热 |
| **缓存命中率** | > 60% | 65% | 智能缓存策略 |
| **并发处理** | 100+ | 150 | 连接池、队列管理 |

### 6.2 资源管理

#### 内存优化

```typescript
export class MemoryManager {
  private memoryThreshold = 100 * 1024 * 1024 // 100MB
  private gcInterval = 5 * 60 * 1000 // 5分钟

  constructor() {
    setInterval(() => this.performGC(), this.gcInterval)
  }

  private performGC(): void {
    const usage = process.memoryUsage()

    if (usage.heapUsed > this.memoryThreshold) {
      // 清理过期缓存
      this.cacheManager.cleanup()

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc()
      }

      console.log(`Memory GC performed. Usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`)
    }
  }
}
```

---

## 7. 测试策略

### 7.1 单元测试

```typescript
describe('AIServiceManager', () => {
  let aiService: AIServiceManager
  let mockProvider: jest.Mocked<AIProvider>

  beforeEach(() => {
    mockProvider = createMockProvider()
    aiService = new AIServiceManager(testConfig, mockLogger)
    aiService.registerProvider(mockProvider)
  })

  it('should complete text successfully', async () => {
    const prompt = 'Hello, world!'
    const expectedResponse = {
      text: 'Hello! How can I help you?',
      usage: { promptTokens: 3, completionTokens: 7, totalTokens: 10 },
      model: 'test-model',
      finishReason: 'stop'
    }

    mockProvider.complete.mockResolvedValue(expectedResponse)

    const result = await aiService.complete(prompt)

    expect(result).toEqual(expectedResponse)
    expect(mockProvider.complete).toHaveBeenCalledWith(prompt, {})
  })
})
```

---

## 8. AI 集成支持

### 8.1 自我优化能力

```typescript
export class SelfOptimizingAI {
  async optimizeProviderSelection(
    usage: UsageStats,
    performance: PerformanceMetrics
  ): Promise<ProviderOptimization> {
    const analysis = await this.aiService.chat([
      {
        role: 'system',
        content: 'You are an AI system optimizer. Analyze usage patterns and suggest improvements.'
      },
      {
        role: 'user',
        content: `Analyze this usage data and suggest optimal provider configurations: ${JSON.stringify({ usage, performance })}`
      }
    ])

    return this.parseOptimizationSuggestions(analysis.message.content)
  }
}
```

---

## 📚 参考资料

### 相关文档
- [@linch-kit/core 包文档](./core.md)
- [LinchKit 架构概览](../system-architecture.md)

### 外部依赖
- [OpenAI SDK](https://github.com/openai/openai-node)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)

---

**最后更新**: 2025-06-23
**文档版本**: v1.0.0
**维护者**: LinchKit 开发团队
