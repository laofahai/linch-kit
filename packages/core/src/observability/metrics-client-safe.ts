/**
 * Client-safe metrics module
 * @module observability/metrics-client-safe
 */

import type { MetricCollector, Counter, Gauge, Histogram, Summary, MetricConfig } from '../types/observability'

/**
 * Client-side Counter stub implementation
 */
class ClientCounterStub implements Counter {
  inc(_value = 1, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  get(_labels?: Record<string, string>): number {
    return 0
  }

  reset(): void {
    // No-op on client side
  }
}

/**
 * Client-side Gauge stub implementation
 */
class ClientGaugeStub implements Gauge {
  set(_value: number, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  inc(_value = 1, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  dec(_value = 1, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  get(_labels?: Record<string, string>): number {
    return 0
  }

  reset(): void {
    // No-op on client side
  }
}

/**
 * Client-side Histogram stub implementation
 */
class ClientHistogramStub implements Histogram {
  observe(_value: number, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  get(_labels?: Record<string, string>): number {
    return 0
  }

  reset(): void {
    // No-op on client side
  }
}

/**
 * Client-side Summary stub implementation
 */
class ClientSummaryStub implements Summary {
  observe(_value: number, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  get(_labels?: Record<string, string>): number {
    return 0
  }

  reset(): void {
    // No-op on client side
  }
}

/**
 * Client-side metric collector stub
 */
class ClientMetricCollector implements MetricCollector {
  createCounter(_name: string, _help: string, _labels?: string[]): Counter {
    return new ClientCounterStub()
  }

  createGauge(_name: string, _help: string, _labels?: string[]): Gauge {
    return new ClientGaugeStub()
  }

  createHistogram(_name: string, _help: string, _buckets?: number[], _labels?: string[]): Histogram {
    return new ClientHistogramStub()
  }

  createSummary(_name: string, _help: string, _percentiles?: number[], _labels?: string[]): Summary {
    return new ClientSummaryStub()
  }

  async getMetrics(): Promise<string> {
    return '# No metrics available on client side'
  }

  getRegistry?(): any {
    return null
  }
}

/**
 * Check if we're on the server side
 */
function isServerSide(): boolean {
  return typeof window === 'undefined'
}

/**
 * Conditionally load server-side metrics
 */
async function loadServerMetrics() {
  if (isServerSide()) {
    try {
      const { createMetricCollector, LinchKitMetricCollector } = await import('./metrics')
      return { createMetricCollector, LinchKitMetricCollector }
    } catch (error) {
      console.warn('Failed to load server-side metrics:', error)
      return null
    }
  }
  return null
}

/**
 * Create metric collector (server-side implementation or client stub)
 */
export async function createMetricCollector(config: unknown = {}): Promise<MetricCollector> {
  if (isServerSide()) {
    const serverMetrics = await loadServerMetrics()
    if (serverMetrics) {
      // Type cast to avoid type conflicts between client/server configs
      return serverMetrics.createMetricCollector(
        config as Parameters<typeof serverMetrics.createMetricCollector>[0]
      )
    }
  }

  return new ClientMetricCollector()
}

/**
 * Default metrics instance (client-safe)
 */
export const metrics = new ClientMetricCollector()

// Re-export types
export type { MetricCollector, Counter, Gauge, Histogram, Summary, MetricConfig } from '../types/observability'
