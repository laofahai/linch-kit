/**
 * AI Provider Adapter 单元测试
 * 完整测试AI Provider适配器的各种场景和错误处理
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { 
  createDefaultAIProvider, 
  createAIProviderAdapter
} from '../providers/ai-provider-adapter'
import type { AIProvider, AIGenerationRequest, AIGenerationResponse } from '../providers/types'

// Mock Gemini SDK
const mockGeminiProvider = {
  getName: () => 'gemini-1.5-flash',
  getId: () => 'gemini-provider',
  isAvailable: mock(() => Promise.resolve(true)),
  chat: mock(() => Promise.resolve({
    content: 'Generated content',
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    model: 'gemini-1.5-flash',
    finish_reason: 'stop'
  })),
  generateResponse: mock(() => Promise.resolve({
    success: true,
    data: { content: 'Generated content', metadata: { provider: 'gemini' } },
    metadata: { provider: 'gemini-1.5-flash', executionTime: 150 }
  }))
}

// Mock fallback provider
const mockFallbackProvider = {
  getName: () => 'rules-engine',
  getId: () => 'rules-fallback',
  isAvailable: mock(() => Promise.resolve(true)),
  chat: mock(() => Promise.resolve({
    content: 'Rules-based response',
    usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
    model: 'rules-engine',
    finish_reason: 'stop'
  })),
  generateResponse: mock(() => Promise.resolve({
    success: true,
    data: { content: 'Rules-based response' },
    metadata: { provider: 'rules', executionTime: 50 }
  }))
}

describe('AI Provider Adapter Tests', () => {
  const timers: NodeJS.Timeout[] = []

  beforeEach(() => {
    // Clear all mocks
    mockGeminiProvider.isAvailable.mockClear()
    mockGeminiProvider.generateResponse.mockClear()
    mockFallbackProvider.isAvailable.mockClear()
    mockFallbackProvider.generateResponse.mockClear()
  })

  afterEach(() => {
    // Clear any timers created during tests
    timers.forEach(timer => clearTimeout(timer))
    timers.length = 0
  })

  describe('默认AI Provider创建', () => {
    it('应该在有API Key时创建默认AI Provider', () => {
      // Mock environment variable
      const originalEnv = process.env.GEMINI_API_KEY
      process.env.GEMINI_API_KEY = 'test-api-key'
      
      try {
        const provider = createDefaultAIProvider()
        expect(provider).toBeDefined()
        expect(provider.getName()).toBeDefined()
        expect(provider.getId()).toBeDefined()
      } finally {
        // Restore original environment
        if (originalEnv) {
          process.env.GEMINI_API_KEY = originalEnv
        } else {
          delete process.env.GEMINI_API_KEY
        }
      }
    })

    it('应该在没有API Key时抛出错误', () => {
      // Ensure no API key is set
      const originalGemini = process.env.GEMINI_API_KEY
      const originalGoogle = process.env.GOOGLE_API_KEY
      delete process.env.GEMINI_API_KEY
      delete process.env.GOOGLE_API_KEY
      
      try {
        expect(() => createDefaultAIProvider()).toThrow('No AI provider API key found')
      } finally {
        // Restore original environment
        if (originalGemini) process.env.GEMINI_API_KEY = originalGemini
        if (originalGoogle) process.env.GOOGLE_API_KEY = originalGoogle
      }
    })
  })

  describe('AI Provider适配器', () => {
    it('应该创建带有主Provider和备用Provider的适配器', () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )
      
      expect(adapter).toBeDefined()
      expect(adapter.getName()).toContain('gemini-1.5-flash')
      expect(adapter.getId()).toBe('gemini-provider')
    })

    it('应该优先使用主Provider生成响应', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test prompt',
        temperature: 0.7
      }

      const response = await adapter.generateResponse(request)
      
      expect(response.success).toBe(true)
      expect(response.data.content).toBe('Generated content')
      expect(response.metadata.provider).toBe('gemini-1.5-flash')
      
      expect(mockGeminiProvider.generateResponse).toHaveBeenCalledWith(request)
      expect(mockFallbackProvider.generateResponse).not.toHaveBeenCalled()
    })

    it('应该在主Provider失败时切换到备用Provider', async () => {
      // Mock main provider failure
      mockGeminiProvider.generateResponse.mockRejectedValueOnce(
        new Error('Gemini API unavailable')
      )

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test prompt for fallback',
        temperature: 0.5
      }

      const response = await adapter.generateResponse(request)
      
      expect(response.success).toBe(true)
      expect(response.data.content).toBe('Rules-based response')
      expect(response.metadata.provider).toBe('rules')
      
      expect(mockGeminiProvider.generateResponse).toHaveBeenCalledWith(request)
      expect(mockFallbackProvider.generateResponse).toHaveBeenCalledWith(request)
    })

    it('应该在主Provider不可用时使用备用Provider', async () => {
      // Mock main provider as unavailable
      mockGeminiProvider.isAvailable.mockResolvedValueOnce(false)

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test with unavailable main provider'
      }

      const response = await adapter.generateResponse(request)
      
      expect(response.success).toBe(true)
      expect(response.data.content).toBe('Rules-based response')
      
      expect(mockGeminiProvider.isAvailable).toHaveBeenCalled()
      expect(mockFallbackProvider.generateResponse).toHaveBeenCalledWith(request)
    })

    it('应该处理所有Provider都失败的情况', async () => {
      // Mock both providers failing
      mockGeminiProvider.generateResponse.mockRejectedValueOnce(
        new Error('Gemini failed')
      )
      mockFallbackProvider.generateResponse.mockRejectedValueOnce(
        new Error('Fallback failed')
      )

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test complete failure scenario'
      }

      await expect(adapter.generateResponse(request)).rejects.toThrow()
    })

    it('应该传递完整的请求参数', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const complexRequest: AIGenerationRequest = {
        prompt: 'Complex test prompt',
        temperature: 0.3,
        maxTokens: 1000,
        schema: {
          type: 'object',
          properties: {
            result: { type: 'string' },
            confidence: { type: 'number' }
          }
        },
        metadata: {
          requestId: 'test-123',
          context: 'unit-test'
        }
      }

      await adapter.generateResponse(complexRequest)
      
      expect(mockGeminiProvider.generateResponse).toHaveBeenCalledWith(complexRequest)
    })

    it('应该正确报告适配器可用性', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      // Both available
      const isAvailable1 = await adapter.isAvailable()
      expect(isAvailable1).toBe(true)

      // Main unavailable, fallback available
      mockGeminiProvider.isAvailable.mockResolvedValueOnce(false)
      const isAvailable2 = await adapter.isAvailable()
      expect(isAvailable2).toBe(true)

      // Both unavailable
      mockGeminiProvider.isAvailable.mockResolvedValueOnce(false)
      mockFallbackProvider.isAvailable.mockResolvedValueOnce(false)
      const isAvailable3 = await adapter.isAvailable()
      expect(isAvailable3).toBe(false)
    })
  })

  describe('错误处理和边界条件', () => {
    it('应该处理空prompt请求', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: '',
        temperature: 0.5
      }

      const response = await adapter.generateResponse(request)
      expect(response).toBeDefined()
      expect(mockGeminiProvider.generateResponse).toHaveBeenCalledWith(request)
    })

    it('应该处理无效的temperature值', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test prompt',
        temperature: -1 // Invalid value
      }

      // Should still call the provider (let provider handle validation)
      await adapter.generateResponse(request)
      expect(mockGeminiProvider.generateResponse).toHaveBeenCalledWith(request)
    })

    it('应该处理Provider isAvailable检查失败', async () => {
      // Mock isAvailable throwing error
      mockGeminiProvider.isAvailable.mockRejectedValueOnce(
        new Error('Availability check failed')
      )

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test availability error handling'
      }

      // Should fallback to second provider
      const response = await adapter.generateResponse(request)
      expect(response.data.content).toBe('Rules-based response')
    })

    it('应该处理响应解析错误', async () => {
      // Mock provider returning invalid response format
      mockGeminiProvider.generateResponse.mockResolvedValueOnce({
        success: true,
        data: null, // Invalid data
        metadata: {}
      })

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Test response parsing'
      }

      // Should handle gracefully and potentially fallback
      const response = await adapter.generateResponse(request)
      expect(response).toBeDefined()
    })
  })

  describe('性能和缓存', () => {
    it('应该记录执行时间', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Performance test'
      }

      const startTime = Date.now()
      const response = await adapter.generateResponse(request)
      const endTime = Date.now()

      expect(response.metadata.executionTime).toBeDefined()
      expect(typeof response.metadata.executionTime).toBe('number')
      expect(response.metadata.executionTime).toBeGreaterThan(0)
      expect(response.metadata.executionTime).toBeLessThan(endTime - startTime + 100)
    })

    it('应该处理超时情况', async () => {
      // Mock slow provider
      mockGeminiProvider.generateResponse.mockImplementationOnce(
        () => new Promise(resolve => {
          const timer = setTimeout(() => resolve({
            success: true,
            data: { content: 'Slow response' },
            metadata: { provider: 'gemini', executionTime: 5000 }
          }), 100) // Simulate slow response
          timers.push(timer)
        })
      )

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Timeout test'
      }

      const response = await adapter.generateResponse(request)
      expect(response).toBeDefined()
    })
  })

  describe('集成场景', () => {
    it('应该支持多轮对话Context', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const conversationRequests = [
        { prompt: 'Hello, what is AI?', temperature: 0.7 },
        { prompt: 'Can you explain it simply?', temperature: 0.7 },
        { prompt: 'Give me an example', temperature: 0.7 }
      ]

      for (const request of conversationRequests) {
        const response = await adapter.generateResponse(request)
        expect(response.success).toBe(true)
      }

      expect(mockGeminiProvider.generateResponse).toHaveBeenCalledTimes(3)
    })

    it('应该支持不同类型的生成任务', async () => {
      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      // Code generation
      const codeRequest: AIGenerationRequest = {
        prompt: 'Generate a TypeScript function',
        temperature: 0.2,
        schema: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            explanation: { type: 'string' }
          }
        }
      }

      // Text analysis
      const analysisRequest: AIGenerationRequest = {
        prompt: 'Analyze this text sentiment',
        temperature: 0.1
      }

      // Creative writing
      const creativeRequest: AIGenerationRequest = {
        prompt: 'Write a short story',
        temperature: 0.9
      }

      const responses = await Promise.all([
        adapter.generateResponse(codeRequest),
        adapter.generateResponse(analysisRequest),
        adapter.generateResponse(creativeRequest)
      ])

      responses.forEach(response => {
        expect(response.success).toBe(true)
        expect(response.data.content).toBeDefined()
      })
    })

    it('应该处理Schema验证', async () => {
      mockGeminiProvider.generateResponse.mockResolvedValueOnce({
        success: true,
        data: {
          content: 'Structured response',
          validated: true,
          schema: 'object'
        },
        metadata: { provider: 'gemini', schemaValidated: true }
      })

      const adapter = createAIProviderAdapter(
        mockGeminiProvider as AIProvider,
        mockFallbackProvider as AIProvider
      )

      const request: AIGenerationRequest = {
        prompt: 'Generate structured data',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            active: { type: 'boolean' }
          },
          required: ['name', 'age']
        }
      }

      const response = await adapter.generateResponse(request)
      expect(response.success).toBe(true)
      expect(response.metadata.schemaValidated).toBe(true)
    })
  })
})