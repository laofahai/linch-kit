# DTS 构建性能监控机制

## 🎯 目标
建立完整的 DTS 构建性能监控体系，及时发现和预防类似的构建超时问题。

## 📊 监控指标体系

### 核心指标
1. **构建时间指标**
   - 单包 DTS 构建时间
   - 整体项目构建时间
   - 增量构建时间

2. **资源使用指标**
   - 内存峰值使用量
   - CPU 使用率
   - 磁盘 I/O 量

3. **类型复杂度指标**
   - 类型推导深度
   - 泛型嵌套层级
   - 条件类型数量

## 🛠️ 监控实现

### 1. 构建时间监控脚本
```typescript
// scripts/monitor-dts-performance.ts
import { execSync } from 'child_process'
import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'

interface PerformanceMetrics {
  packageName: string
  dtsBuildTime: number
  memoryUsage: number
  timestamp: number
  gitCommit: string
  success: boolean
  errorMessage?: string
}

export class DTSPerformanceMonitor {
  private metricsHistory: PerformanceMetrics[] = []
  private thresholds = {
    dtsBuildTime: 30000, // 30 秒
    memoryUsage: 2048,   // 2GB
  }

  async measurePackageBuild(packagePath: string): Promise<PerformanceMetrics> {
    const packageName = path.basename(packagePath)
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed
    
    let success = false
    let errorMessage: string | undefined

    try {
      // 清理之前的构建产物
      execSync('rm -rf dist', { cwd: packagePath, stdio: 'pipe' })
      
      // 执行 DTS 构建
      execSync('pnpm run build:dts', { 
        cwd: packagePath, 
        stdio: 'pipe',
        timeout: this.thresholds.dtsBuildTime + 5000 // 额外 5 秒缓冲
      })
      
      success = true
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error)
    }

    const endTime = performance.now()
    const endMemory = process.memoryUsage().heapUsed
    
    const metrics: PerformanceMetrics = {
      packageName,
      dtsBuildTime: endTime - startTime,
      memoryUsage: (endMemory - startMemory) / 1024 / 1024, // MB
      timestamp: Date.now(),
      gitCommit: this.getCurrentGitCommit(),
      success,
      errorMessage
    }

    this.metricsHistory.push(metrics)
    this.saveMetrics()
    
    return metrics
  }

  async measureAllPackages(): Promise<PerformanceMetrics[]> {
    const packages = [
      'packages/schema',
      'packages/auth',
      'packages/core',
      'packages/ui',
      'packages/trpc'
    ]

    const results: PerformanceMetrics[] = []
    
    for (const pkg of packages) {
      if (fs.existsSync(pkg)) {
        console.log(`📊 Measuring DTS build performance for ${pkg}...`)
        const metrics = await this.measurePackageBuild(pkg)
        results.push(metrics)
        
        // 输出结果
        this.logMetrics(metrics)
        
        // 检查阈值
        this.checkThresholds(metrics)
      }
    }

    return results
  }

  private getCurrentGitCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }

  private logMetrics(metrics: PerformanceMetrics): void {
    const status = metrics.success ? '✅' : '❌'
    const time = (metrics.dtsBuildTime / 1000).toFixed(2)
    const memory = metrics.memoryUsage.toFixed(2)
    
    console.log(`${status} ${metrics.packageName}: ${time}s, ${memory}MB`)
    
    if (!metrics.success && metrics.errorMessage) {
      console.error(`   Error: ${metrics.errorMessage}`)
    }
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const warnings: string[] = []
    
    if (metrics.dtsBuildTime > this.thresholds.dtsBuildTime) {
      warnings.push(`DTS build time (${(metrics.dtsBuildTime / 1000).toFixed(2)}s) exceeds threshold (${this.thresholds.dtsBuildTime / 1000}s)`)
    }
    
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      warnings.push(`Memory usage (${metrics.memoryUsage.toFixed(2)}MB) exceeds threshold (${this.thresholds.memoryUsage}MB)`)
    }

    if (warnings.length > 0) {
      console.warn(`⚠️  Performance warnings for ${metrics.packageName}:`)
      warnings.forEach(warning => console.warn(`   - ${warning}`))
    }
  }

  private saveMetrics(): void {
    const metricsFile = 'performance-metrics.json'
    fs.writeFileSync(metricsFile, JSON.stringify(this.metricsHistory, null, 2))
  }

  generateReport(): string {
    const recent = this.metricsHistory.slice(-10) // 最近 10 次构建
    
    let report = '# DTS 构建性能报告\n\n'
    report += `生成时间: ${new Date().toISOString()}\n\n`
    
    // 按包分组统计
    const byPackage = recent.reduce((acc, metrics) => {
      if (!acc[metrics.packageName]) {
        acc[metrics.packageName] = []
      }
      acc[metrics.packageName].push(metrics)
      return acc
    }, {} as Record<string, PerformanceMetrics[]>)

    for (const [packageName, metrics] of Object.entries(byPackage)) {
      const avgTime = metrics.reduce((sum, m) => sum + m.dtsBuildTime, 0) / metrics.length
      const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length
      const successRate = metrics.filter(m => m.success).length / metrics.length * 100
      
      report += `## ${packageName}\n`
      report += `- 平均构建时间: ${(avgTime / 1000).toFixed(2)}s\n`
      report += `- 平均内存使用: ${avgMemory.toFixed(2)}MB\n`
      report += `- 成功率: ${successRate.toFixed(1)}%\n\n`
    }

    return report
  }
}

// CLI 入口
if (require.main === module) {
  const monitor = new DTSPerformanceMonitor()
  
  monitor.measureAllPackages()
    .then(() => {
      console.log('\n📈 Performance report:')
      console.log(monitor.generateReport())
    })
    .catch(error => {
      console.error('❌ Performance monitoring failed:', error)
      process.exit(1)
    })
}
```

### 2. CI/CD 集成
```yaml
# .github/workflows/dts-performance-check.yml
name: DTS Performance Check

on:
  pull_request:
    paths:
      - 'packages/*/src/**/*.ts'
      - 'packages/*/tsconfig*.json'
  push:
    branches: [main]

jobs:
  dts-performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run DTS performance check
        run: |
          node scripts/monitor-dts-performance.ts
          
      - name: Upload performance metrics
        uses: actions/upload-artifact@v3
        with:
          name: performance-metrics
          path: performance-metrics.json
          
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const metrics = JSON.parse(fs.readFileSync('performance-metrics.json', 'utf8'));
            const recent = metrics.slice(-5); // 最近 5 次构建
            
            let comment = '## 📊 DTS 构建性能报告\n\n';
            comment += '| 包名 | 构建时间 | 内存使用 | 状态 |\n';
            comment += '|------|----------|----------|------|\n';
            
            recent.forEach(metric => {
              const time = (metric.dtsBuildTime / 1000).toFixed(2);
              const memory = metric.memoryUsage.toFixed(2);
              const status = metric.success ? '✅' : '❌';
              comment += `| ${metric.packageName} | ${time}s | ${memory}MB | ${status} |\n`;
            });
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 3. 本地开发集成
```json
// package.json scripts
{
  "scripts": {
    "perf:check": "node scripts/monitor-dts-performance.ts",
    "perf:watch": "nodemon --watch 'packages/*/src/**/*.ts' --exec 'npm run perf:check'",
    "build:check": "npm run perf:check && npm run build"
  }
}
```

## 📈 性能趋势分析

### 1. 趋势监控脚本
```typescript
// scripts/performance-trend-analysis.ts
export class PerformanceTrendAnalyzer {
  analyzePerformanceTrend(metrics: PerformanceMetrics[]): TrendAnalysis {
    const sortedMetrics = metrics.sort((a, b) => a.timestamp - b.timestamp)
    
    return {
      buildTimetrend: this.calculateTrend(sortedMetrics.map(m => m.dtsBuildTime)),
      memoryUsageTrend: this.calculateTrend(sortedMetrics.map(m => m.memoryUsage)),
      successRateTrend: this.calculateSuccessRateTrend(sortedMetrics),
      recommendations: this.generateRecommendations(sortedMetrics)
    }
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable'
    
    const recent = values.slice(-3)
    const earlier = values.slice(-6, -3)
    
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length
    const earlierAvg = earlier.reduce((a, b) => a + b) / earlier.length
    
    const change = (recentAvg - earlierAvg) / earlierAvg
    
    if (change < -0.1) return 'improving'
    if (change > 0.1) return 'degrading'
    return 'stable'
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = []
    const recent = metrics.slice(-5)
    
    // 检查构建时间趋势
    const avgBuildTime = recent.reduce((sum, m) => sum + m.dtsBuildTime, 0) / recent.length
    if (avgBuildTime > 20000) {
      recommendations.push('考虑优化类型定义复杂度，当前平均构建时间过长')
    }
    
    // 检查内存使用趋势
    const avgMemory = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length
    if (avgMemory > 1024) {
      recommendations.push('内存使用量较高，建议检查是否存在内存泄漏')
    }
    
    // 检查失败率
    const failureRate = recent.filter(m => !m.success).length / recent.length
    if (failureRate > 0.2) {
      recommendations.push('构建失败率较高，需要检查类型定义错误')
    }
    
    return recommendations
  }
}
```

## ⚠️ 告警机制

### 1. 阈值告警
```typescript
// scripts/performance-alerts.ts
export class PerformanceAlerter {
  private webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  async checkAndAlert(metrics: PerformanceMetrics): Promise<void> {
    const alerts: string[] = []
    
    // 构建时间告警
    if (metrics.dtsBuildTime > 30000) {
      alerts.push(`🚨 ${metrics.packageName} DTS 构建超时: ${(metrics.dtsBuildTime / 1000).toFixed(2)}s`)
    }
    
    // 内存使用告警
    if (metrics.memoryUsage > 2048) {
      alerts.push(`🚨 ${metrics.packageName} 内存使用过高: ${metrics.memoryUsage.toFixed(2)}MB`)
    }
    
    // 构建失败告警
    if (!metrics.success) {
      alerts.push(`🚨 ${metrics.packageName} DTS 构建失败: ${metrics.errorMessage}`)
    }
    
    if (alerts.length > 0 && this.webhookUrl) {
      await this.sendSlackAlert(alerts.join('\n'))
    }
  }
  
  private async sendSlackAlert(message: string): Promise<void> {
    try {
      await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `LinchKit DTS 构建性能告警\n${message}`,
          channel: '#dev-alerts'
        })
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }
}
```

## ✅ 实施检查清单

### 监控系统部署
- [ ] 部署性能监控脚本
- [ ] 配置 CI/CD 集成
- [ ] 设置告警机制
- [ ] 创建性能仪表板

### 阈值配置
- [ ] 设置合理的性能阈值
- [ ] 配置告警通知渠道
- [ ] 建立性能基准线
- [ ] 定期审查和调整阈值

### 团队培训
- [ ] 培训开发团队使用监控工具
- [ ] 建立性能问题处理流程
- [ ] 制定性能优化最佳实践
- [ ] 定期进行性能回顾会议
