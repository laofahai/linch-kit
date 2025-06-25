/**
 * 基于 OpenTelemetry 的追踪系统适配器
 * @module observability/tracing
 */

import { 
  trace, 
  context, 
  SpanStatusCode, 
  Span as OtelSpan,
  Tracer as OtelTracer
} from '@opentelemetry/api'

import type { 
  Tracer, 
  Span, 
  SpanOptions, 
  TraceContext 
} from '../types'

/**
 * LinchKit Span 适配器
 */
class LinchKitSpan implements Span {
  constructor(private otelSpan: OtelSpan) {}

  setAttribute(key: string, value: string | number | boolean): void {
    this.otelSpan.setAttribute(key, value)
  }

  setAttributes(attributes: Record<string, string | number | boolean>): void {
    this.otelSpan.setAttributes(attributes)
  }

  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    this.otelSpan.addEvent(name, attributes)
  }

  recordException(exception: Error): void {
    this.otelSpan.recordException(exception)
  }

  setStatus(status: { code: number; message?: string }): void {
    this.otelSpan.setStatus(status)
  }

  end(): void {
    this.otelSpan.end()
  }

  getContext(): TraceContext {
    const spanContext = this.otelSpan.spanContext()
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      flags: spanContext.traceFlags
    }
  }
}

/**
 * LinchKit 追踪器
 * 基于 OpenTelemetry 提供分布式追踪功能
 */
export class LinchKitTracer implements Tracer {
  constructor(private otelTracer: OtelTracer) {}

  startSpan(name: string, options?: SpanOptions): Span {
    const otelOptions: Parameters<OtelTracer['startSpan']>[1] = {}

    // Handle parent context through OpenTelemetry context API
    let ctx = context.active()
    if (options?.parent) {
      if ('traceId' in options.parent) {
        // TraceContext - use active context
        ctx = context.active()
      } else {
        // Span - set span in context
        ctx = trace.setSpan(context.active(), (options.parent as LinchKitSpan)['otelSpan'])
      }
    }

    if (options?.attributes) {
      otelOptions.attributes = options.attributes
    }

    if (options?.startTime) {
      otelOptions.startTime = options.startTime
    }

    if (options?.links) {
      otelOptions.links = options.links.map(link => ({
        context: {
          traceId: link.context.traceId,
          spanId: link.context.spanId,
          traceFlags: link.context.flags || 0
        },
        attributes: link.attributes
      }))
    }

    const otelSpan = this.otelTracer.startSpan(name, otelOptions, ctx)
    return new LinchKitSpan(otelSpan)
  }

  async withSpan<T>(name: string, fn: (span: Span) => Promise<T> | T): Promise<T> {
    const span = this.startSpan(name)
    
    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      })
      throw error
    } finally {
      span.end()
    }
  }

  getActiveSpan(): Span | undefined {
    const activeSpan = trace.getActiveSpan()
    return activeSpan ? new LinchKitSpan(activeSpan) : undefined
  }
}

/**
 * 追踪配置选项
 */
export interface TracingConfig {
  serviceName?: string
  version?: string
  environment?: string
  instrumentations?: string[]
  samplingRate?: number
  endpoint?: string
  headers?: Record<string, string>
}

/**
 * 创建追踪器
 */
export function createTracer(name: string, version?: string): Tracer {
  const otelTracer = trace.getTracer(name, version)
  return new LinchKitTracer(otelTracer)
}

/**
 * 默认追踪器实例
 */
export const tracer = createTracer('linchkit-core', '0.1.0')