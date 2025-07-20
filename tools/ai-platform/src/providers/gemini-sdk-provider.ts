/**
 * 基于 Google Generative AI SDK 的 Gemini Provider
 * 使用官方 SDK 提供高性能、功能完整的 AI 集成
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('gemini-sdk-provider')

export interface GeminiSDKConfig {
  apiKey: string
  model?: string
  generationConfig?: GenerationConfig
  safetySettings?: SafetySetting[]
  systemInstruction?: string
  timeout?: number
}

export interface GeminiResponse {
  content: string
  success: boolean
  error?: string
  provider: string
  executionTime: number
  metadata?: {
    model: string
    tokensUsed?: number
    finishReason?: string
  }
}

export class GeminiSDKProvider {
  private client: GoogleGenerativeAI
  private model: GenerativeModel
  private config: GeminiSDKConfig
  private providerName = 'gemini-sdk'

  constructor(config: GeminiSDKConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required')
    }

    this.config = {
      model: 'gemini-1.5-flash',
      timeout: 30000,
      ...config
    }

    // 初始化客户端
    this.client = new GoogleGenerativeAI(this.config.apiKey)
    
    // 配置模型
    this.model = this.client.getGenerativeModel({
      model: this.config.model!,
      generationConfig: this.config.generationConfig || {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: this.config.safetySettings || this.getDefaultSafetySettings(),
      systemInstruction: this.config.systemInstruction
    })
  }

  async generate(prompt: string, options?: {
    format?: 'json' | 'text' | 'markdown'
    context?: Record<string, any>
    stream?: boolean
  }): Promise<GeminiResponse> {
    const startTime = Date.now()
    
    try {
      // 根据格式要求调整 prompt
      const formattedPrompt = this.formatPrompt(prompt, options?.format)
      
      logger.info(`Generating response with model: ${this.config.model}`)
      
      if (options?.stream) {
        // 流式响应
        return await this.generateStream(formattedPrompt, startTime)
      } else {
        // 常规响应
        const result = await this.model.generateContent(formattedPrompt)
        const response = await result.response
        const content = response.text()
        
        const executionTime = Date.now() - startTime
        logger.info(`Gemini SDK completed in ${executionTime}ms`)
        
        return {
          content,
          success: true,
          provider: this.providerName,
          executionTime,
          metadata: {
            model: this.config.model!,
            finishReason: response.candidates?.[0]?.finishReason
          }
        }
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error(`Gemini SDK failed after ${executionTime}ms:`, errorMessage)
      
      return {
        content: '',
        success: false,
        error: errorMessage,
        provider: this.providerName,
        executionTime
      }
    }
  }

  async generateStream(prompt: string, startTime: number): Promise<GeminiResponse> {
    try {
      const result = await this.model.generateContentStream(prompt)
      let fullContent = ''
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullContent += chunkText
      }
      
      const executionTime = Date.now() - startTime
      logger.info(`Gemini SDK stream completed in ${executionTime}ms`)
      
      return {
        content: fullContent,
        success: true,
        provider: this.providerName,
        executionTime,
        metadata: {
          model: this.config.model!
        }
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        content: '',
        success: false,
        error: errorMessage,
        provider: this.providerName,
        executionTime
      }
    }
  }

  async generateWithFunctions(
    prompt: string,
    functions: any[],
    functionCall?: { name: string }
  ): Promise<GeminiResponse> {
    const startTime = Date.now()
    
    try {
      // 使用函数调用功能
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: functions }],
        toolConfig: functionCall ? {
          functionCallingConfig: {
            mode: 'ANY',
            allowedFunctionNames: [functionCall.name]
          }
        } : undefined
      })
      
      const response = await result.response
      const content = response.text()
      const executionTime = Date.now() - startTime
      
      return {
        content,
        success: true,
        provider: this.providerName,
        executionTime,
        metadata: {
          model: this.config.model!,
          finishReason: response.candidates?.[0]?.finishReason
        }
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        content: '',
        success: false,
        error: errorMessage,
        provider: this.providerName,
        executionTime
      }
    }
  }

  private formatPrompt(prompt: string, format?: string): string {
    if (!format || format === 'text') {
      return prompt
    }
    
    const formatInstructions = {
      json: '\n\nPlease respond with valid JSON only, no additional text or markdown formatting.',
      markdown: '\n\nPlease format your response using Markdown.',
    }
    
    return prompt + (formatInstructions[format] || '')
  }

  private getDefaultSafetySettings(): SafetySetting[] {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ]
  }

  getProviderName(): string {
    return this.providerName
  }

  updateConfig(config: Partial<GeminiSDKConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 重新初始化模型
    this.model = this.client.getGenerativeModel({
      model: this.config.model!,
      generationConfig: this.config.generationConfig,
      safetySettings: this.config.safetySettings || this.getDefaultSafetySettings(),
      systemInstruction: this.config.systemInstruction
    })
  }
}

// 工厂函数
export function createGeminiSDKProvider(config: GeminiSDKConfig): GeminiSDKProvider {
  return new GeminiSDKProvider(config)
}