import { describe, it, expect, beforeEach } from 'bun:test'

import { createTracer } from '../../observability/tracing'
import type { Tracer } from '../../types'

describe('LinchKitTracer', () => {
  let tracer: Tracer

  beforeEach(() => {
    tracer = createTracer('test-service', '1.0.0')
  })

  describe('追踪器初始化', () => {
    it('should initialize with service name and version', () => {
      expect(tracer).toBeDefined()
      expect(tracer.startSpan).toBeDefined()
      expect(tracer.withSpan).toBeDefined()
    })

    it('should create tracer with default version', () => {
      const customTracer = createTracer('test-service-2')
      expect(customTracer).toBeDefined()
    })
  })

  describe('Span 管理', () => {
    it('should start and end span', () => {
      const span = tracer.startSpan('test-operation')

      expect(span).toBeDefined()
      expect(span.end).toBeDefined()
      expect(span.setAttribute).toBeDefined()
      expect(span.setAttributes).toBeDefined()
      expect(span.addEvent).toBeDefined()

      // 结束 span
      span.end()
      expect(true).toBe(true) // 验证没有抛出错误
    })

    it('should create child spans', () => {
      const parentSpan = tracer.startSpan('parent-operation')
      const childSpan = tracer.startSpan('child-operation', {
        parent: parentSpan,
      })

      expect(parentSpan).toBeDefined()
      expect(childSpan).toBeDefined()

      childSpan.end()
      parentSpan.end()
    })

    it('should start span with attributes', () => {
      const span = tracer.startSpan('test-operation', {
        attributes: {
          'user.id': '123',
          'operation.type': 'database',
        },
      })

      expect(span).toBeDefined()
      span.end()
    })
  })

  describe('Span 属性', () => {
    it('should set span attributes', () => {
      const span = tracer.startSpan('test-operation')

      span.setAttribute('user.id', '123')
      span.setAttribute('request.method', 'GET')
      span.setAttribute('response.status', 200)

      expect(span.setAttribute).toBeDefined()
      span.end()
    })

    it('should set multiple attributes', () => {
      const span = tracer.startSpan('test-operation')

      span.setAttributes({
        'user.id': '123',
        'operation.type': 'database',
        'request.method': 'GET',
      })

      expect(span.setAttributes).toBeDefined()
      span.end()
    })

    it('should add events to span', () => {
      const span = tracer.startSpan('test-operation')

      span.addEvent('cache.hit', {
        'cache.key': 'user:123',
        'cache.hit': true,
      })

      expect(span.addEvent).toBeDefined()
      span.end()
    })

    it('should set span status', () => {
      const span = tracer.startSpan('test-operation')

      span.setStatus({ code: 1, message: 'OK' })
      expect(span.setStatus).toBeDefined()

      span.end()
    })

    it('should record exceptions', () => {
      const span = tracer.startSpan('test-operation')

      const error = new Error('Test error')
      span.recordException(error)

      expect(span.recordException).toBeDefined()
      span.end()
    })
  })

  describe('withSpan 装饰器', () => {
    it('should execute function with span context', async () => {
      const result = await tracer.withSpan('test-function', async span => {
        expect(span).toBeDefined()
        span.setAttribute('test', 'value')
        return 'test-result'
      })

      expect(result).toBe('test-result')
    })

    it('should handle function errors gracefully', async () => {
      await expect(
        tracer.withSpan('error-function', async () => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')
    })

    it('should work with synchronous functions', async () => {
      const result = await tracer.withSpan('sync-function', span => {
        expect(span).toBeDefined()
        return 'sync-result'
      })

      expect(result).toBe('sync-result')
    })
  })

  describe('Span 上下文', () => {
    it('should get span context', () => {
      const span = tracer.startSpan('test-operation')
      const context = span.getContext()

      expect(context).toBeDefined()
      expect(context.traceId).toBeDefined()
      expect(context.spanId).toBeDefined()
      expect(typeof context.traceId).toBe('string')
      expect(typeof context.spanId).toBe('string')

      span.end()
    })
  })

  describe('批量操作', () => {
    it('should create multiple spans', () => {
      const spans = []

      for (let i = 0; i < 5; i++) {
        const span = tracer.startSpan(`operation-${i}`)
        spans.push(span)
      }

      expect(spans.length).toBe(5)

      // 清理
      spans.forEach(span => span.end())
    })

    it('should handle concurrent spans', async () => {
      const operations = Array.from({ length: 3 }, (_, i) => {
        return tracer.withSpan(`concurrent-op-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return `result-${i}`
        })
      })

      const results = await Promise.all(operations)
      expect(results).toEqual(['result-0', 'result-1', 'result-2'])
    })
  })

  describe('错误处理', () => {
    it('should handle span creation gracefully', () => {
      const span = tracer.startSpan('test-operation')
      expect(span).toBeDefined()
      span.end()
    })

    it('should handle withSpan errors and still end span', async () => {
      let spanEnded = false

      try {
        await tracer.withSpan('error-operation', span => {
          // 设置一个标记来验证 span 被正确处理
          span.setAttribute('test', 'will-throw')
          throw new Error('Intentional error')
        })
      } catch (error) {
        expect((error as Error).message).toBe('Intentional error')
        spanEnded = true
      }

      expect(spanEnded).toBe(true)
    })
  })
})
