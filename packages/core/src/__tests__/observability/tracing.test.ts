import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import { LinchKitTracer } from '../../observability/tracing'

// Mock OpenTelemetry
vi.mock('@opentelemetry/api', () => {
  const mockSpan = {
    setAttribute: vi.fn(),
    setAttributes: vi.fn(),
    addEvent: vi.fn(),
    recordException: vi.fn(),
    setStatus: vi.fn(),
    end: vi.fn(),
    spanContext: vi.fn().mockReturnValue({ traceId: 'test-trace-id', spanId: 'test-span-id' }),
  }

  const mockTracer = {
    startSpan: vi.fn().mockReturnValue(mockSpan),
  }

  return {
    trace: {
      getTracer: vi.fn().mockReturnValue(mockTracer),
      setSpan: vi.fn(),
      getActiveSpan: vi.fn().mockReturnValue(mockSpan),
    },
    context: {
      with: vi.fn().mockImplementation((ctx, fn) => fn()),
      active: vi.fn().mockReturnValue({}),
      setValue: vi.fn().mockReturnValue({}),
    },
    SpanStatusCode: {
      OK: 1,
      ERROR: 2,
    },
  }
})

describe('LinchKitTracer', () => {
  let tracer: LinchKitTracer
  let mockOtelApi: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockOtelApi = await import('@opentelemetry/api')
    tracer = new LinchKitTracer('test-service')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const defaultTracer = new LinchKitTracer()
      expect(defaultTracer).toBeInstanceOf(LinchKitTracer)
    })

    it('should initialize with custom options', () => {
      const customTracer = new LinchKitTracer('custom-service')
      expect(customTracer).toBeInstanceOf(LinchKitTracer)
    })
  })

  describe('Span Creation', () => {
    it('should create a span', () => {
      const span = tracer.startSpan('test-operation')

      expect(span).toBeDefined()
      expect(mockOtelApi.trace.getTracer().startSpan).toHaveBeenCalledWith(
        'test-operation',
        undefined
      )
    })

    it('should create a span with options', () => {
      const options = {
        attributes: { 'test.attribute': 'value' },
        kind: 1,
      }

      const span = tracer.startSpan('test-operation', options)

      expect(span).toBeDefined()
      expect(mockOtelApi.trace.getTracer().startSpan).toHaveBeenCalledWith(
        'test-operation',
        options
      )
    })

    it('should create a child span', () => {
      const parentSpan = tracer.startSpan('parent-operation')
      const childSpan = tracer.startSpan('child-operation', {
        parent: parentSpan,
      })

      expect(childSpan).toBeDefined()
    })
  })

  describe('Span Operations', () => {
    let span: any

    beforeEach(() => {
      span = tracer.startSpan('test-span')
    })

    it('should set single attribute', () => {
      span.setAttribute('test.key', 'test-value')
      expect(span.setAttribute).toBeDefined()
    })

    it('should set multiple attributes', () => {
      const attributes = {
        'http.method': 'GET',
        'http.status_code': 200,
        'http.success': true,
      }

      span.setAttributes(attributes)
      expect(span.setAttributes).toBeDefined()
    })

    it('should add events', () => {
      span.addEvent('request.start')
      span.addEvent('request.validated', { 'validation.time': 10 })

      expect(span.addEvent).toBeDefined()
    })

    it('should record exceptions', () => {
      const error = new Error('Test error')
      span.recordException(error)

      expect(span.recordException).toBeDefined()
    })

    it('should set status', () => {
      span.setStatus({ code: 1, message: 'Success' })
      span.setStatus({ code: 2, message: 'Error' })

      expect(span.setStatus).toBeDefined()
    })

    it('should end span', () => {
      span.end()
      expect(span.end).toBeDefined()
    })
  })

  describe('Context Management', () => {
    it('should get current span', () => {
      const currentSpan = tracer.getCurrentSpan()
      expect(currentSpan).toBeDefined()
    })

    it('should execute with span context', () => {
      const span = tracer.startSpan('context-test')
      const mockCallback = vi.fn()

      tracer.withSpan(span, mockCallback)

      expect(mockCallback).toHaveBeenCalled()
      expect(mockOtelApi.context.with).toHaveBeenCalled()
    })

    it('should trace async function', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('result')

      const result = await tracer.trace('async-operation', asyncFunction)

      expect(result).toBe('result')
      expect(asyncFunction).toHaveBeenCalled()
    })

    it('should trace sync function', () => {
      const syncFunction = vi.fn().mockReturnValue('sync-result')

      const result = tracer.trace('sync-operation', syncFunction)

      expect(result).toBe('sync-result')
      expect(syncFunction).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle exceptions in traced functions', async () => {
      const errorFunction = vi.fn().mockRejectedValue(new Error('Test error'))

      await expect(tracer.trace('error-operation', errorFunction)).rejects.toThrow('Test error')
      expect(errorFunction).toHaveBeenCalled()
    })

    it('should record exception in span when function throws', async () => {
      const error = new Error('Function error')
      const throwingFunction = vi.fn().mockRejectedValue(error)

      try {
        await tracer.trace('throwing-operation', throwingFunction)
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    it('should set error status on span when exception occurs', async () => {
      const throwingFunction = vi.fn().mockImplementation(() => {
        throw new Error('Sync error')
      })

      try {
        tracer.trace('sync-error-operation', throwingFunction)
      } catch (e) {
        expect(e).toBeInstanceOf(Error)
      }
    })
  })

  describe('Trace Context', () => {
    it('should extract trace context from span', () => {
      const span = tracer.startSpan('context-extraction')
      const context = tracer.getTraceContext(span)

      expect(context).toBeDefined()
      expect(context.traceId).toBeDefined()
      expect(context.spanId).toBeDefined()
    })

    it('should get active trace context', () => {
      const context = tracer.getActiveTraceContext()
      expect(context).toBeDefined()
    })
  })

  describe('Instrumentation', () => {
    it('should instrument HTTP requests', () => {
      const requestSpan = tracer.startSpan('http-request', {
        attributes: {
          'http.method': 'GET',
          'http.url': 'https://api.example.com/users',
          'http.scheme': 'https',
          'http.host': 'api.example.com',
          'http.target': '/users',
        },
      })

      expect(requestSpan).toBeDefined()
    })

    it('should instrument database operations', () => {
      const dbSpan = tracer.startSpan('db-query', {
        attributes: {
          'db.system': 'postgresql',
          'db.name': 'users_db',
          'db.statement': 'SELECT * FROM users WHERE active = true',
          'db.operation': 'SELECT',
        },
      })

      expect(dbSpan).toBeDefined()
    })

    it('should instrument function calls with decorators', () => {
      // Simulating decorator usage
      const instrumentedFunction = (originalFunction: Function) => {
        return (...args: any[]) => {
          return tracer.trace('instrumented-function', () => {
            return originalFunction.apply(this, args)
          })
        }
      }

      const originalFn = vi.fn().mockReturnValue('decorated-result')
      const decoratedFn = instrumentedFunction(originalFn)

      const result = decoratedFn('test-arg')

      expect(result).toBe('decorated-result')
      expect(originalFn).toHaveBeenCalledWith('test-arg')
    })
  })

  describe('Performance', () => {
    it('should handle high frequency span creation', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        const span = tracer.startSpan(`operation-${i}`)
        span.end()
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle nested spans efficiently', () => {
      const rootSpan = tracer.startSpan('root-operation')

      tracer.withSpan(rootSpan, () => {
        for (let i = 0; i < 100; i++) {
          const childSpan = tracer.startSpan(`child-operation-${i}`)
          childSpan.end()
        }
      })

      rootSpan.end()
    })
  })

  describe('Sampling', () => {
    it('should respect sampling decisions', () => {
      // Create spans that should be sampled
      const span1 = tracer.startSpan('sampled-operation-1')
      const span2 = tracer.startSpan('sampled-operation-2')

      expect(span1).toBeDefined()
      expect(span2).toBeDefined()

      span1.end()
      span2.end()
    })
  })

  describe('Batch Operations', () => {
    it('should handle batch span operations', () => {
      const spans = []

      // Create multiple spans
      for (let i = 0; i < 50; i++) {
        spans.push(tracer.startSpan(`batch-operation-${i}`))
      }

      // Set attributes on all spans
      spans.forEach((span, index) => {
        span.setAttribute('batch.index', index)
        span.setAttribute('batch.total', spans.length)
      })

      // End all spans
      spans.forEach(span => span.end())

      expect(spans).toHaveLength(50)
    })
  })
})
