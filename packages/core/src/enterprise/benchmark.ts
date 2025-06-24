/**
 * @ai-context 企业级基准测试框架
 * @ai-purpose 基于 tinybench 的高精度性能测试，支持回归检测和性能监控
 * @ai-features 基准测试、性能回归检测、统计分析、报告生成、CI集成
 * @ai-integration 与 CI/CD 流水线集成，支持性能门禁
 */

import { z } from 'zod'
import { Bench, Task } from 'tinybench'

/**
 * 基准测试配置 Schema
 */
export const BenchmarkConfigSchema = z.object({
  /** 是否启用基准测试 */
  enabled: z.boolean().default(true),
  /** 预热次数 */
  warmupRuns: z.number().default(5),
  /** 最小运行时间（毫秒） */
  minTime: z.number().default(1000),
  /** 最大运行时间（毫秒） */
  maxTime: z.number().default(10000),
  /** 最小迭代次数 */
  minIterations: z.number().default(10),
  /** 最大迭代次数 */
  maxIterations: z.number().default(1000),
  /** 性能回归阈值（百分比） */
  regressionThreshold: z.number().default(10),
  /** 是否生成详细报告 */
  detailedReport: z.boolean().default(true),
  /** 报告输出格式 */
  reportFormat: z.enum(['json', 'markdown', 'html']).default('json'),
  /** 基线数据存储路径 */
  baselinePath: z.string().optional(),
  /** 是否在 CI 环境中运行 */
  ci: z.boolean().default(false)
})

export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>

/**
 * 基准测试结果接口
 */
export interface BenchmarkResult {
  name: string
  ops: number
  margin: number
  samples: number
  mean: number
  variance: number
  sd: number
  sem: number
  df: number
  critical: number
  moe: number
  rme: number
  p75: number
  p99: number
  p995: number
  p999: number
  min: number
  max: number
  hz: number
  period: number
  timestamp: Date
}

/**
 * 性能回归检测结果
 */
export interface RegressionResult {
  testName: string
  current: BenchmarkResult
  baseline?: BenchmarkResult
  regression: boolean
  changePercent: number
  status: 'improved' | 'degraded' | 'stable' | 'no_baseline'
  threshold: number
}

/**
 * 基准测试套件
 */
export interface BenchmarkSuite {
  name: string
  description?: string
  tests: Array<{
    name: string
    fn: () => void | Promise<void>
    setup?: () => void | Promise<void>
    teardown?: () => void | Promise<void>
  }>
}

/**
 * 企业级基准测试管理器
 */
export class EnterpriseBenchmark {
  private config: BenchmarkConfig
  private suites: Map<string, BenchmarkSuite> = new Map()
  private results: Map<string, BenchmarkResult[]> = new Map()
  private baselines: Map<string, BenchmarkResult> = new Map()

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = BenchmarkConfigSchema.parse(config)
    this.loadBaselines()
  }

  /**
   * 加载基线数据
   */
  private async loadBaselines(): Promise<void> {
    if (!this.config.baselinePath) return

    try {
      const fs = await import('fs/promises')
      const data = await fs.readFile(this.config.baselinePath, 'utf-8')
      const baselines = JSON.parse(data)
      
      for (const [key, value] of Object.entries(baselines)) {
        this.baselines.set(key, value as BenchmarkResult)
      }
    } catch (error) {
      console.warn('Failed to load baseline data:', error)
    }
  }

  /**
   * 保存基线数据
   */
  private async saveBaselines(): Promise<void> {
    if (!this.config.baselinePath) return

    try {
      const fs = await import('fs/promises')
      const data = Object.fromEntries(this.baselines)
      await fs.writeFile(this.config.baselinePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to save baseline data:', error)
    }
  }

  /**
   * 添加基准测试套件
   */
  addSuite(suite: BenchmarkSuite): void {
    this.suites.set(suite.name, suite)
  }

  /**
   * 添加单个基准测试
   */
  addTest(
    suiteName: string,
    testName: string,
    fn: () => void | Promise<void>,
    options?: {
      setup?: () => void | Promise<void>
      teardown?: () => void | Promise<void>
    }
  ): void {
    let suite = this.suites.get(suiteName)
    if (!suite) {
      suite = { name: suiteName, tests: [] }
      this.suites.set(suiteName, suite)
    }

    suite.tests.push({
      name: testName,
      fn,
      setup: options?.setup,
      teardown: options?.teardown
    })
  }

  /**
   * 运行基准测试套件
   */
  async runSuite(suiteName: string): Promise<BenchmarkResult[]> {
    const suite = this.suites.get(suiteName)
    if (!suite) {
      throw new Error(`Benchmark suite '${suiteName}' not found`)
    }

    const bench = new Bench({
      time: this.config.minTime,
      iterations: this.config.minIterations
    })

    // 添加测试到 bench
    for (const test of suite.tests) {
      bench.add(test.name, test.fn, {
        beforeEach: test.setup,
        afterEach: test.teardown
      })
    }

    // 运行基准测试
    await bench.run()

    // 转换结果
    const results: BenchmarkResult[] = bench.tasks.map(task => this.convertTaskToResult(task))
    
    // 存储结果
    this.results.set(suiteName, results)

    return results
  }

  /**
   * 运行所有基准测试套件
   */
  async runAll(): Promise<Map<string, BenchmarkResult[]>> {
    const allResults = new Map<string, BenchmarkResult[]>()

    for (const suiteName of this.suites.keys()) {
      try {
        const results = await this.runSuite(suiteName)
        allResults.set(suiteName, results)
      } catch (error) {
        console.error(`Failed to run benchmark suite '${suiteName}':`, error)
      }
    }

    return allResults
  }

  /**
   * 转换 Task 结果为标准格式
   */
  private convertTaskToResult(task: Task): BenchmarkResult {
    const stats = task.result!
    
    return {
      name: task.name,
      ops: stats.hz || 0,
      margin: stats.rme || 0,
      samples: stats.samples?.length || 0,
      mean: stats.mean || 0,
      variance: stats.variance || 0,
      sd: stats.sd || 0,
      sem: stats.sem || 0,
      df: stats.df || 0,
      critical: stats.critical || 0,
      moe: stats.moe || 0,
      rme: stats.rme || 0,
      p75: stats.p75 || 0,
      p99: stats.p99 || 0,
      p995: stats.p995 || 0,
      p999: stats.p999 || 0,
      min: stats.min || 0,
      max: stats.max || 0,
      hz: stats.hz || 0,
      period: stats.period || 0,
      timestamp: new Date()
    }
  }

  /**
   * 检测性能回归
   */
  detectRegression(suiteName: string): RegressionResult[] {
    const currentResults = this.results.get(suiteName)
    if (!currentResults) {
      throw new Error(`No results found for suite '${suiteName}'`)
    }

    return currentResults.map(current => {
      const baselineKey = `${suiteName}.${current.name}`
      const baseline = this.baselines.get(baselineKey)

      if (!baseline) {
        return {
          testName: current.name,
          current,
          regression: false,
          changePercent: 0,
          status: 'no_baseline' as const,
          threshold: this.config.regressionThreshold
        }
      }

      const changePercent = ((current.ops - baseline.ops) / baseline.ops) * 100
      const regression = changePercent < -this.config.regressionThreshold

      let status: 'improved' | 'degraded' | 'stable'
      if (changePercent > this.config.regressionThreshold) {
        status = 'improved'
      } else if (changePercent < -this.config.regressionThreshold) {
        status = 'degraded'
      } else {
        status = 'stable'
      }

      return {
        testName: current.name,
        current,
        baseline,
        regression,
        changePercent,
        status,
        threshold: this.config.regressionThreshold
      }
    })
  }

  /**
   * 更新基线数据
   */
  updateBaselines(suiteName: string): void {
    const results = this.results.get(suiteName)
    if (!results) {
      throw new Error(`No results found for suite '${suiteName}'`)
    }

    for (const result of results) {
      const key = `${suiteName}.${result.name}`
      this.baselines.set(key, result)
    }

    this.saveBaselines()
  }

  /**
   * 生成性能报告
   */
  generateReport(suiteName: string): string {
    const results = this.results.get(suiteName)
    if (!results) {
      throw new Error(`No results found for suite '${suiteName}'`)
    }

    const regressions = this.detectRegression(suiteName)

    switch (this.config.reportFormat) {
      case 'markdown':
        return this.generateMarkdownReport(suiteName, results, regressions)
      case 'html':
        return this.generateHtmlReport(suiteName, results, regressions)
      default:
        return JSON.stringify({
          suite: suiteName,
          timestamp: new Date(),
          results,
          regressions
        }, null, 2)
    }
  }

  /**
   * 生成 Markdown 报告
   */
  private generateMarkdownReport(
    suiteName: string,
    results: BenchmarkResult[],
    regressions: RegressionResult[]
  ): string {
    let report = `# Benchmark Report: ${suiteName}\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n\n`

    // 性能结果表格
    report += `## Performance Results\n\n`
    report += `| Test | Ops/sec | Margin | Samples | Mean (ms) |\n`
    report += `|------|---------|--------|---------|----------|\n`

    for (const result of results) {
      report += `| ${result.name} | ${result.ops.toFixed(0)} | ±${result.margin.toFixed(2)}% | ${result.samples} | ${(result.mean * 1000).toFixed(3)} |\n`
    }

    // 回归检测结果
    report += `\n## Regression Analysis\n\n`
    const regressionCount = regressions.filter(r => r.regression).length
    
    if (regressionCount > 0) {
      report += `⚠️ **${regressionCount} performance regression(s) detected!**\n\n`
    } else {
      report += `✅ **No performance regressions detected**\n\n`
    }

    for (const regression of regressions) {
      const icon = regression.status === 'improved' ? '📈' : 
                   regression.status === 'degraded' ? '📉' : '➡️'
      
      report += `${icon} **${regression.testName}**: ${regression.changePercent.toFixed(2)}% change\n`
    }

    return report
  }

  /**
   * 生成 HTML 报告
   */
  private generateHtmlReport(
    suiteName: string,
    results: BenchmarkResult[],
    regressions: RegressionResult[]
  ): string {
    // 简化的 HTML 报告生成
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Benchmark Report: ${suiteName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .regression { color: red; }
        .improvement { color: green; }
    </style>
</head>
<body>
    <h1>Benchmark Report: ${suiteName}</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    <h2>Performance Results</h2>
    <table>
        <tr><th>Test</th><th>Ops/sec</th><th>Margin</th><th>Samples</th><th>Mean (ms)</th></tr>
        ${results.map(r => `
        <tr>
            <td>${r.name}</td>
            <td>${r.ops.toFixed(0)}</td>
            <td>±${r.margin.toFixed(2)}%</td>
            <td>${r.samples}</td>
            <td>${(r.mean * 1000).toFixed(3)}</td>
        </tr>
        `).join('')}
    </table>
    
    <h2>Regression Analysis</h2>
    ${regressions.map(r => `
    <p class="${r.status === 'degraded' ? 'regression' : r.status === 'improved' ? 'improvement' : ''}">
        <strong>${r.testName}</strong>: ${r.changePercent.toFixed(2)}% change (${r.status})
    </p>
    `).join('')}
</body>
</html>
    `
  }

  /**
   * 获取所有结果
   */
  getAllResults(): Map<string, BenchmarkResult[]> {
    return new Map(this.results)
  }

  /**
   * 清除结果
   */
  clearResults(): void {
    this.results.clear()
  }
}

/**
 * 默认基准测试实例
 */
export const benchmark = new EnterpriseBenchmark({
  enabled: process.env.BENCHMARK_ENABLED !== 'false',
  ci: process.env.CI === 'true',
  baselinePath: process.env.BENCHMARK_BASELINE_PATH || './benchmark-baselines.json',
  regressionThreshold: parseFloat(process.env.BENCHMARK_REGRESSION_THRESHOLD || '10')
})

/**
 * 创建基准测试实例
 */
export function createBenchmark(config?: Partial<BenchmarkConfig>): EnterpriseBenchmark {
  return new EnterpriseBenchmark(config)
}
