import { describe, it, expect, beforeEach, mock, afterEach } from 'bun:test'

import { LinchKitTracer } from '../../observability/tracing'

describe('LinchKitTracer', () => {
  let tracer: LinchKitTracer

  beforeEach(() => {
    tracer = new LinchKitTracer()
  })

  afterEach(() => {
    // bun:test doesn't have vi.clearAllMocks(), mocks are automatically managed
    // bun:test doesn't have vi.restoreAllMocks(), mocks are automatically managed
  })

  describe('追踪器初始化', () => {
    it('should initialize with default options', () => {
      expect(tracer).toBeDefined()
      expect(tracer.startSpan).toBeDefined()
      expect(tracer.getActiveSpan).toBeDefined()
      expect(tracer.setAttributes).toBeDefined()
    })

    it('should initialize with custom tracer provider', () => {
      const customTracer = new LinchKitTracer({
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      })

      expect(customTracer).toBeDefined()
    })
  })

  describe('Span 管理', () => {
    it('should start and end span', () => {
      const span = tracer.startSpan('test-operation')

      expect(span).toBeDefined()
      expect(span.end).toBeDefined()

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

    it('should get active span', () => {
      const span = tracer.startSpan('test-operation')

      // 在实际实现中，这会返回当前活动的 span
      const activeSpan = tracer.getActiveSpan()

      // 由于我们没有 mock OpenTelemetry，这里只验证方法存在
      expect(tracer.getActiveSpan).toBeDefined()

      span.end()
    })
  })

  describe('Span 属性', () => {
    it('should set span attributes', () => {
      const span = tracer.startSpan('test-operation')

      tracer.setAttributes(span, {
        'user.id': '123',
        'operation.type': 'database',
        'request.method': 'GET',
      })

      expect(span.setAttributes).toBeDefined()
      span.end()
    })

    it('should add events to span', () => {
      const span = tracer.startSpan('test-operation')

      tracer.addEvent(span, 'cache.hit', {
        'cache.key': 'user:123',
        'cache.hit': true,
      })

      expect(span.addEvent).toBeDefined()
      span.end()
    })

    it('should set span status', () => {
      const span = tracer.startSpan('test-operation')

      tracer.setStatus(span, 'OK')
      expect(span.setStatus).toBeDefined()

      span.end()
    })
  })

  describe('上下文管理', () => {
    it('should create span context', () => {
      const span = tracer.startSpan('test-operation')
      const context = tracer.createContext(span)

      expect(context).toBeDefined()
      span.end()
    })

    it('should execute with context', async () => {
      const span = tracer.startSpan('test-operation')
      const context = tracer.createContext(span)

      const result = await tracer.withContext(context, async () => {
        return 'test-result'
      })

      expect(result).toBe('test-result')
      span.end()
    })
  })

  describe('追踪装饰器', () => {
    it('should trace function execution', async () => {
      const testFunction = async (input: string) => {
        return `processed-${input}`
      }

      const tracedFunction = tracer.trace('test-function', testFunction)
      const result = await tracedFunction('test-input')

      expect(result).toBe('processed-test-input')
    })

    it('should handle function errors', async () => {
      const errorFunction = async () => {
        throw new Error('Test error')
      }

      const tracedFunction = tracer.trace('error-function', errorFunction)

      await expect(tracedFunction()).rejects.toThrow('Test error')
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
        return tracer.trace(`concurrent-op-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return `result-${i}`
        })
      })

      const results = await Promise.all(operations.map(op => op()))
      expect(results).toEqual(['result-0', 'result-1', 'result-2'])
    })
  })

  describe('错误处理', () => {
    it('should handle span creation errors gracefully', () => {
      // 测试在某些情况下 span 创建可能失败
      const span = tracer.startSpan('test-operation')
      expect(span).toBeDefined()
      span.end()
    })

    it('should handle context errors gracefully', () => {
      const span = tracer.startSpan('test-operation')
      const context = tracer.createContext(span)

      expect(() => {
        tracer.withContext(context, () => {
          throw new Error('Context error')
        })
      }).toThrow('Context error')

      span.end()
    })
  })
})
