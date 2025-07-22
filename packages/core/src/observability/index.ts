/**
 * 可观测性模块
 * @module observability
 */

// Logger, tracing, and health are client-safe
export * from './logger'
export * from './tracing'
export * from './health'

// Metrics module uses prom-client, only available on server
export * from './metrics-client-safe'

// Direct server-side metrics exports for testing
export { 
  createMetricCollector as createServerMetricCollector,
  LinchKitMetricCollector,
  type MetricCollectorConfig 
} from './metrics'

// Performance monitoring (server-side only)
export * from './performance-monitor'
