/**
 * Client-safe metrics module
 * @module observability/metrics-client-safe
 */

import type { 
  MetricCollector, 
  Counter, 
  Gauge, 
  Histogram, 
  Summary, 
  MetricConfig 
} from '../types'

/**
 * Client-side metrics stub implementation
 */
class ClientMetricStub implements Counter, Gauge, Histogram, Summary {
  // Counter methods
  inc(_value = 1, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  // Gauge methods
  set(_value: number, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  dec(_value = 1, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  // Histogram methods
  observe(_value: number, _labels?: Record<string, string>): void {
    // No-op on client side
  }

  startTimer(_labels?: Record<string, string>): () => void {
    return () => {} // No-op on client side
  }

  get(_labels?: Record<string, string>): unknown {
    return { buckets: {}, count: 0, sum: 0, quantiles: {}, value: 0 }
  }

  reset(): void {
    // No-op on client side
  }
}

/**
 * Client-side metric collector stub
 */
class ClientMetricCollector implements MetricCollector {
  createCounter(_config: MetricConfig): Counter {
    return new ClientMetricStub()
  }

  createGauge(_config: MetricConfig): Gauge {
    return new ClientMetricStub()
  }

  createHistogram(_config: MetricConfig): Histogram {
    return new ClientMetricStub()
  }

  createSummary(_config: MetricConfig): Summary {
    return new ClientMetricStub()
  }

  async getMetrics(): Promise<string> {
    return '# No metrics available on client side'
  }

  reset(): void {
    // No-op on client side
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
export async function createMetricCollector(_config: unknown = {}): Promise<MetricCollector> {
  if (isServerSide()) {
    const serverMetrics = await loadServerMetrics()
    if (serverMetrics) {
      return serverMetrics.createMetricCollector(_config)
    }
  }
  
  return new ClientMetricCollector()
}

/**
 * Default metrics instance (client-safe)
 */
export const metrics = new ClientMetricCollector()

// Re-export types
export type {
  MetricCollector,
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricConfig
} from '../types'