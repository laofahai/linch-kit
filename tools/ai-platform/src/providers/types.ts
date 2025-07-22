/**
 * LinchKit AI Provider 类型定义
 * 统一的AI调用抽象层
 * 
 * @version 1.0.0
 */

export interface AIProviderRequest {
  prompt: string
  messages?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  model?: string
  temperature?: number
  json_mode?: boolean
  max_tokens?: number
  timeout?: number
}

export interface AIProviderResponse {
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  finish_reason: string
  rawResponse?: any
}

// AI Generation interfaces for adapter layer
export interface AIGenerationRequest {
  prompt: string
  temperature?: number
  maxTokens?: number
  schema?: any
  metadata?: Record<string, any>
}

export interface AIGenerationResponse {
  success: boolean
  data: {
    content: string
    metadata?: Record<string, any>
  }
  metadata: {
    provider: string
    executionTime: number
    [key: string]: any
  }
}

export interface AIProvider {
  getId(): string
  getName(): string
  chat(request: AIProviderRequest): Promise<AIProviderResponse>
  isAvailable(): Promise<boolean>
  // For adapter compatibility
  generateResponse?(request: AIGenerationRequest): Promise<AIGenerationResponse>
}

export interface AIProviderConfig {
  name: string
  driver: 'anthropic' | 'openai' | 'gemini' | 'ollama'
  model: string
  apiKeyEnv?: string
  baseUrl?: string
  timeout?: number
  defaultTemperature?: number
}

export interface AIConfig {
  defaultProvider: string
  providers: AIProviderConfig[]
  taskMappings: Record<string, string>
}

export interface AITaskContext {
  task: string
  description?: string
  projectContext?: any
  files?: string[]
}