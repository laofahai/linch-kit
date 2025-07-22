/**
 * AI Provider Adapter - Bridges custom SDK providers to standard AI interface
 * Ensures abstraction between test workflow and specific AI implementations
 * 
 * @version 1.0.0 - Production Integration
 */

import { createLogger } from '@linch-kit/core'
import type { AIProvider, AIProviderRequest, AIProviderResponse } from './types'
import { GeminiSDKProvider, type GeminiResponse } from './gemini-sdk-provider'

const logger = createLogger('ai-provider-adapter')

/**
 * Adapter for GeminiSDKProvider to implement standard AIProvider interface
 */
export class GeminiProviderAdapter implements AIProvider {
  private provider: GeminiSDKProvider
  private providerId: string
  private providerName: string

  constructor(provider: GeminiSDKProvider) {
    this.provider = provider
    this.providerId = 'gemini-sdk'
    this.providerName = 'Google Gemini SDK'
  }

  getId(): string {
    return this.providerId
  }

  getName(): string {
    return this.providerName
  }

  async chat(request: AIProviderRequest): Promise<AIProviderResponse> {
    logger.debug('Converting request to Gemini SDK format', {
      hasPrompt: !!request.prompt,
      hasMessages: !!request.messages?.length,
      model: request.model
    })

    try {
      // Convert messages to prompt if provided
      let prompt = request.prompt
      if (request.messages && request.messages.length > 0) {
        prompt = this.convertMessagesToPrompt(request.messages, request.prompt)
      }

      // Configure generation options
      const options: any = {}
      
      if (request.json_mode) {
        options.format = 'json'
      }

      // Use Gemini SDK to generate response
      const geminiResponse: GeminiResponse = await this.provider.generate(prompt, options)

      if (!geminiResponse.success) {
        throw new Error(geminiResponse.error || 'Gemini SDK generation failed')
      }

      // Convert Gemini response to standard format
      const standardResponse: AIProviderResponse = {
        content: geminiResponse.content,
        usage: {
          prompt_tokens: this.estimateTokens(prompt),
          completion_tokens: this.estimateTokens(geminiResponse.content),
          total_tokens: this.estimateTokens(prompt) + this.estimateTokens(geminiResponse.content)
        },
        model: geminiResponse.metadata?.model || request.model || 'gemini-1.5-flash',
        finish_reason: geminiResponse.metadata?.finishReason || 'stop',
        rawResponse: geminiResponse
      }

      logger.info('Gemini SDK request completed successfully', {
        contentLength: geminiResponse.content.length,
        executionTime: geminiResponse.executionTime,
        model: standardResponse.model
      })

      return standardResponse
    } catch (error) {
      logger.error('Gemini SDK request failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a minimal prompt
      const testResponse = await this.provider.generate('ping', { format: 'text' })
      return testResponse.success
    } catch (error) {
      logger.warn('Gemini SDK availability check failed', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Enhanced chat method with JSON schema support for test workflows
   */
  async generateResponse(options: {
    prompt: string
    temperature?: number
    schema?: any
    maxTokens?: number
  }): Promise<{ data: any; usage?: any }> {
    const request: AIProviderRequest = {
      prompt: options.prompt,
      temperature: options.temperature || 0.7,
      json_mode: !!options.schema,
      max_tokens: options.maxTokens
    }

    const response = await this.chat(request)

    let parsedData = response.content
    if (options.schema && response.content) {
      try {
        parsedData = JSON.parse(response.content)
      } catch (parseError) {
        // Try to extract JSON from content if parsing fails
        const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1])
        } else {
          logger.warn('Failed to parse JSON response, returning raw content')
          parsedData = { content: response.content }
        }
      }
    }

    return {
      data: parsedData,
      usage: response.usage
    }
  }

  /**
   * Convert messages array to single prompt string
   */
  private convertMessagesToPrompt(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    additionalPrompt?: string
  ): string {
    const systemMessages = messages.filter(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')

    let prompt = ''
    
    // Add system messages at the top
    if (systemMessages.length > 0) {
      prompt += systemMessages.map(m => m.content).join('\n\n') + '\n\n'
    }

    // Add conversation messages
    if (conversationMessages.length > 0) {
      prompt += conversationMessages.map(m => {
        const roleLabel = m.role === 'user' ? 'User' : 'Assistant'
        return `${roleLabel}: ${m.content}`
      }).join('\n\n') + '\n\n'
    }

    // Add additional prompt if provided
    if (additionalPrompt) {
      prompt += additionalPrompt
    }

    return prompt
  }

  /**
   * Estimate token count for usage tracking (rough approximation)
   */
  private estimateTokens(text: string): number {
    if (!text) return 0
    // Rough approximation: ~4 characters per token for most text
    return Math.ceil(text.length / 4)
  }
}

/**
 * Factory function to create AI Provider Adapter for different providers
 */
export function createAIProviderAdapter(
  providerType: 'gemini-sdk',
  config: any
): AIProvider {
  switch (providerType) {
    case 'gemini-sdk':
      const geminiProvider = new GeminiSDKProvider(config)
      return new GeminiProviderAdapter(geminiProvider)
      
    default:
      throw new Error(`Unsupported provider type: ${providerType}`)
  }
}

/**
 * Provider factory with environment-based configuration
 */
export function createDefaultAIProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  
  if (!apiKey) {
    throw new Error('No AI provider API key found. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.')
  }

  return createAIProviderAdapter('gemini-sdk', {
    apiKey,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    timeout: 30000,
    systemInstruction: 'You are a helpful AI assistant specializing in software testing and development.'
  })
}

export type { AIProvider, AIProviderRequest, AIProviderResponse }