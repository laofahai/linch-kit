/**
 * 统一的Metrics系统
 * 根据环境自动选择服务器端或客户端实现
 * @module metrics
 */

import type { MetricCollector, Counter, Gauge, Histogram, Summary, MetricConfig } from '../types'

/**
 * 检查当前环境是否为服务器端
 */
function isServerEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node
}

/**
 * 服务器端Metrics实现
 */
class ServerMetrics implements MetricCollector {
  private promClient: any
  private registry: any

  constructor(config: MetricConfig = {}) {
    // 动态导入prom-client以避免客户端打包问题
    this.promClient = require('prom-client')
    
    if (config.enableDefaultMetrics !== false) {
      this.promClient.collectDefaultMetrics({
        register: this.promClient.register,
        timeout: config.defaultMetricsTimeout || 5000,
      })
    }
    
    this.registry = this.promClient.register
  }

  createCounter(name: string, help: string, labels?: string[]): Counter {
    const counter = new this.promClient.Counter({
      name,
      help,
      labelNames: labels || [],
    })

    return {
      inc: (value = 1, labelValues?: Record<string, string>) => {
        counter.inc(labelValues || {}, value)
      },
      get: (labelValues?: Record<string, string>) => {
        const metric = counter.get()
        if (labelValues) {
          const found = metric.values?.find((v: any) =>
            Object.entries(labelValues).every(([key, val]) => v.labels[key] === val)
          )
          return found?.value || 0
        }
        return metric.values?.reduce((sum: number, v: any) => sum + v.value, 0) || 0
      },
      reset: () => counter.reset(),
    }
  }

  createGauge(name: string, help: string, labels?: string[]): Gauge {
    const gauge = new this.promClient.Gauge({
      name,
      help,
      labelNames: labels || [],
    })

    return {
      set: (value: number, labelValues?: Record<string, string>) => {
        gauge.set(labelValues || {}, value)
      },
      inc: (value = 1, labelValues?: Record<string, string>) => {
        gauge.inc(labelValues || {}, value)
      },
      dec: (value = 1, labelValues?: Record<string, string>) => {
        gauge.dec(labelValues || {}, value)
      },
      get: (labelValues?: Record<string, string>) => {
        const metric = gauge.get()
        if (labelValues) {
          const found = metric.values?.find((v: any) =>
            Object.entries(labelValues).every(([key, val]) => v.labels[key] === val)
          )
          return found?.value || 0
        }
        return metric.values?.[0]?.value || 0
      },
      reset: () => gauge.reset(),
    }
  }

  createHistogram(name: string, help: string, buckets?: number[], labels?: string[]): Histogram {
    const histogram = new this.promClient.Histogram({
      name,
      help,
      buckets: buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      labelNames: labels || [],
    })

    return {
      observe: (value: number, labelValues?: Record<string, string>) => {
        histogram.observe(labelValues || {}, value)
      },
      get: (labelValues?: Record<string, string>) => {
        const metric = histogram.get()
        if (labelValues) {
          const found = metric.values?.find((v: any) =>
            Object.entries(labelValues).every(([key, val]) => v.labels[key] === val)
          )
          return found?.value || 0
        }
        return metric.values?.[0]?.value || 0
      },
      reset: () => histogram.reset(),
    }
  }

  createSummary(name: string, help: string, percentiles?: number[], labels?: string[]): Summary {
    const summary = new this.promClient.Summary({
      name,
      help,
      percentiles: percentiles || [0.5, 0.9, 0.95, 0.99],
      labelNames: labels || [],
    })

    return {
      observe: (value: number, labelValues?: Record<string, string>) => {
        summary.observe(labelValues || {}, value)
      },
      get: (labelValues?: Record<string, string>) => {
        const metric = summary.get()
        if (labelValues) {
          const found = metric.values?.find((v: any) =>
            Object.entries(labelValues).every(([key, val]) => v.labels[key] === val)
          )
          return found?.value || 0
        }
        return metric.values?.[0]?.value || 0
      },
      reset: () => summary.reset(),
    }
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics()
  }

  getRegistry(): any {
    return this.registry
  }
}

/**
 * 客户端Metrics实现（存根）
 */
class ClientMetrics implements MetricCollector {
  private metrics = new Map<string, { type: string; value: number; labels: Record<string, string> }>()

  createCounter(name: string, help: string, labels?: string[]): Counter {
    return {
      inc: (value = 1, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        const current = this.metrics.get(key)
        this.metrics.set(key, {
          type: 'counter',
          value: (current?.value || 0) + value,
          labels: labelValues || {},
        })
      },
      get: (labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        return this.metrics.get(key)?.value || 0
      },
      reset: () => {
        for (const [key] of this.metrics) {
          if (key.startsWith(name + ':')) {
            this.metrics.delete(key)
          }
        }
      },
    }
  }

  createGauge(name: string, help: string, labels?: string[]): Gauge {
    return {
      set: (value: number, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        this.metrics.set(key, {
          type: 'gauge',
          value,
          labels: labelValues || {},
        })
      },
      inc: (value = 1, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        const current = this.metrics.get(key)
        this.metrics.set(key, {
          type: 'gauge',
          value: (current?.value || 0) + value,
          labels: labelValues || {},
        })
      },
      dec: (value = 1, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        const current = this.metrics.get(key)
        this.metrics.set(key, {
          type: 'gauge',
          value: (current?.value || 0) - value,
          labels: labelValues || {},
        })
      },
      get: (labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        return this.metrics.get(key)?.value || 0
      },
      reset: () => {
        for (const [key] of this.metrics) {
          if (key.startsWith(name + ':')) {
            this.metrics.delete(key)
          }
        }
      },
    }
  }

  createHistogram(name: string, help: string, buckets?: number[], labels?: string[]): Histogram {
    return {
      observe: (value: number, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        const current = this.metrics.get(key)
        this.metrics.set(key, {
          type: 'histogram',
          value: (current?.value || 0) + value,
          labels: labelValues || {},
        })
      },
      get: (labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        return this.metrics.get(key)?.value || 0
      },
      reset: () => {
        for (const [key] of this.metrics) {
          if (key.startsWith(name + ':')) {
            this.metrics.delete(key)
          }
        }
      },
    }
  }

  createSummary(name: string, help: string, percentiles?: number[], labels?: string[]): Summary {
    return {
      observe: (value: number, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        const current = this.metrics.get(key)
        this.metrics.set(key, {
          type: 'summary',
          value: (current?.value || 0) + value,
          labels: labelValues || {},
        })
      },
      get: (labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues)
        return this.metrics.get(key)?.value || 0
      },
      reset: () => {
        for (const [key] of this.metrics) {
          if (key.startsWith(name + ':')) {
            this.metrics.delete(key)
          }
        }
      },
    }
  }

  async getMetrics(): Promise<string> {
    const result = []
    for (const [key, metric] of this.metrics) {
      const [name] = key.split(':')
      const labelsStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',')
      const labels = labelsStr ? `{${labelsStr}}` : ''
      result.push(`${name}${labels} ${metric.value}`)
    }
    return result.join('\n')
  }

  getRegistry(): any {
    return {
      metrics: () => this.getMetrics(),
      clear: () => this.metrics.clear(),
    }
  }

  private getMetricKey(name: string, labelValues?: Record<string, string>): string {
    if (!labelValues || Object.keys(labelValues).length === 0) {
      return name
    }
    const labelsStr = Object.entries(labelValues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    return `${name}:${labelsStr}`
  }
}

/**
 * 统一的Metrics工厂函数
 * 根据环境自动选择合适的实现
 */
export function createMetricCollector(config: MetricConfig = {}): MetricCollector {
  if (isServerEnvironment()) {
    return new ServerMetrics(config)
  } else {
    return new ClientMetrics()
  }
}

/**
 * 默认Metrics实例
 */
export const metrics = createMetricCollector()

/**
 * 向后兼容的导出
 */
export { metrics as Metrics }
export { createMetricCollector as createDefaultMetricCollector }