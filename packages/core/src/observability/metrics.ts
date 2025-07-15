/**
 * 基于 prom-client 的指标系统适配器
 * @module observability/metrics
 */

import {
  register,
  collectDefaultMetrics,
  Counter as PromCounter,
  Gauge as PromGauge,
  Histogram as PromHistogram,
  Summary as PromSummary,
  Registry,
} from 'prom-client'

import type { MetricCollector, Counter, Gauge, Histogram, Summary } from '../types'

/**
 * Prometheus metric value interface
 */
interface PromMetricValue {
  value: number
  labels: Record<string, string>
  metricName?: string
}

/**
 * Prometheus metric response interface
 */
interface PromMetric {
  values: PromMetricValue[]
}

/**
 * LinchKit 计数器适配器
 */
class LinchKitCounter implements Counter {
  constructor(private promCounter: PromCounter<string>) {}

  inc(value = 1, labels?: Record<string, string>): void {
    this.promCounter.inc(labels || {}, value)
  }

  get(labels?: Record<string, string>): number {
    const metric = this.promCounter.get() as unknown as PromMetric

    if (labels) {
      const found = metric.values?.find((v: PromMetricValue) =>
        Object.entries(labels).every(([key, val]) => v.labels[key] === val)
      )
      return found?.value || 0
    }
    return metric.values?.reduce((sum: number, v: PromMetricValue) => sum + v.value, 0) || 0
  }

  reset(): void {
    this.promCounter.reset()
  }
}

/**
 * LinchKit 仪表盘适配器
 */
class LinchKitGauge implements Gauge {
  constructor(private promGauge: PromGauge<string>) {}

  set(value: number, labels?: Record<string, string>): void {
    this.promGauge.set(labels || {}, value)
  }

  inc(value = 1, labels?: Record<string, string>): void {
    this.promGauge.inc(labels || {}, value)
  }

  dec(value = 1, labels?: Record<string, string>): void {
    this.promGauge.dec(labels || {}, value)
  }

  get(labels?: Record<string, string>): number {
    const metric = this.promGauge.get() as unknown as PromMetric

    if (labels) {
      const found = metric.values?.find((v: PromMetricValue) =>
        Object.entries(labels).every(([key, val]) => v.labels[key] === val)
      )
      return found?.value || 0
    }
    return metric.values?.reduce((sum: number, v: PromMetricValue) => sum + v.value, 0) || 0
  }

  reset(): void {
    this.promGauge.reset()
  }
}

/**
 * LinchKit 直方图适配器
 */
class LinchKitHistogram implements Histogram {
  constructor(private promHistogram: PromHistogram<string>) {}

  observe(value: number, labels?: Record<string, string>): void {
    this.promHistogram.observe(labels || {}, value)
  }

  startTimer(labels?: Record<string, string>): () => void {
    return this.promHistogram.startTimer(labels)
  }

  get(labels?: Record<string, string>): number {
    const metric = this.promHistogram.get() as unknown as PromMetric

    if (labels) {
      // 查找匹配标签的指标
      const matchingValues =
        metric.values?.filter((v: PromMetricValue) =>
          Object.entries(labels).every(([key, val]) => v.labels[key] === val)
        ) || []

      let count = 0

      for (const value of matchingValues) {
        if (value.metricName?.endsWith('_count')) {
          count = value.value
        }
      }

      return count
    }

    // 聚合所有值的计数
    let count = 0

    for (const value of metric.values || []) {
      if (value.metricName?.endsWith('_count')) {
        count += value.value
      }
    }

    return count
  }

  reset(): void {
    this.promHistogram.reset()
  }
}

/**
 * LinchKit 摘要适配器
 */
class LinchKitSummary implements Summary {
  constructor(private promSummary: PromSummary<string>) {}

  observe(value: number, labels?: Record<string, string>): void {
    this.promSummary.observe(labels || {}, value)
  }

  get(labels?: Record<string, string>): number {
    const metric = this.promSummary.get() as unknown as PromMetric

    if (labels) {
      const matchingValues =
        metric.values?.filter((v: PromMetricValue) =>
          Object.entries(labels).every(([key, val]) => v.labels[key] === val)
        ) || []

      let count = 0

      for (const value of matchingValues) {
        if (value.metricName?.endsWith('_count')) {
          count = value.value
        }
      }

      return count
    }

    // 聚合所有值的计数
    let count = 0

    for (const value of metric.values || []) {
      if (value.metricName?.endsWith('_count')) {
        count += value.value
      }
    }

    return count
  }

  reset(): void {
    this.promSummary.reset()
  }
}

/**
 * LinchKit 指标收集器
 * 基于 prom-client 提供指标收集功能
 */
export class LinchKitMetricCollector implements MetricCollector {
  private registry: Registry

  constructor(registry: Registry = register) {
    this.registry = registry
  }

  createCounter(name: string, help: string, labels?: string[]): Counter {
    const promCounter = new PromCounter({
      name,
      help,
      labelNames: labels,
      registers: [this.registry],
    })

    return new LinchKitCounter(promCounter)
  }

  createGauge(name: string, help: string, labels?: string[]): Gauge {
    const promGauge = new PromGauge({
      name,
      help,
      labelNames: labels,
      registers: [this.registry],
    })

    return new LinchKitGauge(promGauge)
  }

  createHistogram(name: string, help: string, buckets?: number[], labels?: string[]): Histogram {
    const promHistogram = new PromHistogram({
      name,
      help,
      labelNames: labels,
      buckets,
      registers: [this.registry],
    })

    return new LinchKitHistogram(promHistogram)
  }

  createSummary(name: string, help: string, percentiles?: number[], labels?: string[]): Summary {
    const promSummary = new PromSummary({
      name,
      help,
      labelNames: labels,
      percentiles,
      registers: [this.registry],
    })

    return new LinchKitSummary(promSummary)
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  reset(): void {
    this.registry.resetMetrics()
  }

  /**
   * 获取 Prometheus 注册表
   */
  getRegistry(): Registry {
    return this.registry
  }

  /**
   * 启用默认指标收集
   */
  collectDefaultMetrics(options?: { register?: Registry; prefix?: string }): void {
    collectDefaultMetrics({
      register: options?.register || this.registry,
      prefix: options?.prefix,
    })
  }
}

/**
 * 指标收集器配置
 */
export interface MetricCollectorConfig {
  enableDefaultMetrics?: boolean
  defaultMetricsPrefix?: string
  registry?: Registry
}

/**
 * 创建指标收集器
 */
export function createMetricCollector(config: MetricCollectorConfig = {}): MetricCollector {
  const {
    enableDefaultMetrics = true,
    defaultMetricsPrefix = 'linchkit_',
    registry = new Registry(),
  } = config

  const collector = new LinchKitMetricCollector(registry)

  if (enableDefaultMetrics) {
    collector.collectDefaultMetrics({
      register: registry,
      prefix: defaultMetricsPrefix,
    })
  }

  return collector
}

/**
 * 默认指标收集器实例
 */
export const metrics = createMetricCollector()
