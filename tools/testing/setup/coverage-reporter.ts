#!/usr/bin/env bun

/**
 * LinchKit Coverage Reporter - 覆盖率报告生成器
 * 生成详细的覆盖率报告、徽章和可视化图表
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, relative, basename, dirname } from 'path'
import { parseArgs } from 'util'

interface CoverageData {
  [file: string]: {
    l: Record<number, number> // lines
    f: Record<string, number> // functions  
    b: Record<string, number[]> // branches
    s: Record<string, number> // statements
  }
}

interface FileCoverage {
  file: string
  lines: { total: number; covered: number; percentage: number }
  functions: { total: number; covered: number; percentage: number }
  branches: { total: number; covered: number; percentage: number }
  statements: { total: number; covered: number; percentage: number }
  uncoveredLines: number[]
}

interface CoverageReport {
  summary: {
    lines: { total: number; covered: number; percentage: number }
    functions: { total: number; covered: number; percentage: number }
    branches: { total: number; covered: number; percentage: number }
    statements: { total: number; covered: number; percentage: number }
  }
  files: FileCoverage[]
  packages: Record<string, {
    lines: number
    functions: number
    branches: number
    statements: number
    fileCount: number
  }>
  timestamp: string
  threshold: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  passed: boolean
}

class LinchKitCoverageReporter {
  private projectRoot: string
  private coverageDir: string
  private outputDir: string

  constructor() {
    this.projectRoot = process.cwd()
    this.coverageDir = join(this.projectRoot, 'coverage')
    this.outputDir = join(this.coverageDir, 'reports')
    
    // 确保输出目录存在
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async generateReport(options: {
    input?: string
    output?: string
    format: 'html' | 'json' | 'lcov' | 'text' | 'badge' | 'all'
    threshold: { lines: number; functions: number; branches: number; statements: number }
    includePackages: boolean
    excludePatterns: string[]
  }): Promise<CoverageReport> {
    console.log('📊 LinchKit Coverage Reporter v2.0.0')
    console.log(`📁 覆盖率目录: ${this.coverageDir}`)
    console.log(`📄 输出格式: ${options.format}`)
    console.log('')

    try {
      // 读取覆盖率数据
      const coverageData = await this.loadCoverageData(options.input)
      
      // 分析覆盖率
      const report = await this.analyzeCoverage(coverageData, options)
      
      // 生成报告
      await this.generateReports(report, options)
      
      // 打印总结
      this.printSummary(report)
      
      return report
    } catch (error) {
      console.error('❌ 生成覆盖率报告失败:', error)
      throw error
    }
  }

  private async loadCoverageData(inputFile?: string): Promise<CoverageData> {
    const coverageFile = inputFile || join(this.coverageDir, 'coverage-final.json')
    
    if (!existsSync(coverageFile)) {
      throw new Error(`覆盖率数据文件不存在: ${coverageFile}`)
    }

    const data = readFileSync(coverageFile, 'utf-8')
    return JSON.parse(data)
  }

  private async analyzeCoverage(
    coverageData: CoverageData,
    options: { threshold: any; includePackages: boolean; excludePatterns: string[] }
  ): Promise<CoverageReport> {
    const files: FileCoverage[] = []
    const packages: Record<string, any> = {}
    
    let totalLines = 0, coveredLines = 0
    let totalFunctions = 0, coveredFunctions = 0
    let totalBranches = 0, coveredBranches = 0
    let totalStatements = 0, coveredStatements = 0

    for (const [filePath, data] of Object.entries(coverageData)) {
      // 跳过排除的文件
      if (this.shouldExcludeFile(filePath, options.excludePatterns)) {
        continue
      }

      const fileAnalysis = this.analyzeFile(filePath, data)
      files.push(fileAnalysis)

      // 累计统计
      totalLines += fileAnalysis.lines.total
      coveredLines += fileAnalysis.lines.covered
      totalFunctions += fileAnalysis.functions.total
      coveredFunctions += fileAnalysis.functions.covered
      totalBranches += fileAnalysis.branches.total
      coveredBranches += fileAnalysis.branches.covered
      totalStatements += fileAnalysis.statements.total
      coveredStatements += fileAnalysis.statements.covered

      // 按包分组
      if (options.includePackages) {
        const packageName = this.getPackageName(filePath)
        if (packageName) {
          if (!packages[packageName]) {
            packages[packageName] = {
              lines: 0,
              functions: 0,
              branches: 0,
              statements: 0,
              fileCount: 0
            }
          }

          packages[packageName].lines += fileAnalysis.lines.percentage
          packages[packageName].functions += fileAnalysis.functions.percentage
          packages[packageName].branches += fileAnalysis.branches.percentage
          packages[packageName].statements += fileAnalysis.statements.percentage
          packages[packageName].fileCount++
        }
      }
    }

    // 计算包的平均覆盖率
    for (const pkg of Object.values(packages)) {
      if (pkg.fileCount > 0) {
        pkg.lines = pkg.lines / pkg.fileCount
        pkg.functions = pkg.functions / pkg.fileCount
        pkg.branches = pkg.branches / pkg.fileCount
        pkg.statements = pkg.statements / pkg.fileCount
      }
    }

    const summary = {
      lines: { 
        total: totalLines, 
        covered: coveredLines, 
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      },
      functions: { 
        total: totalFunctions, 
        covered: coveredFunctions, 
        percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
      },
      branches: { 
        total: totalBranches, 
        covered: coveredBranches, 
        percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
      },
      statements: { 
        total: totalStatements, 
        covered: coveredStatements, 
        percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
      }
    }

    const passed = 
      summary.lines.percentage >= options.threshold.lines &&
      summary.functions.percentage >= options.threshold.functions &&
      summary.branches.percentage >= options.threshold.branches &&
      summary.statements.percentage >= options.threshold.statements

    return {
      summary,
      files: files.sort((a, b) => a.file.localeCompare(b.file)),
      packages,
      timestamp: new Date().toISOString(),
      threshold: options.threshold,
      passed
    }
  }

  private analyzeFile(filePath: string, data: any): FileCoverage {
    const lines = data.l || {}
    const functions = data.f || {}
    const branches = data.b || {}
    const statements = data.s || {}

    // 行覆盖率
    const lineNumbers = Object.keys(lines).map(Number)
    const coveredLineCount = Object.values(lines).filter(count => (count as number) > 0).length
    const uncoveredLines = lineNumbers.filter(line => lines[line] === 0)

    // 函数覆盖率
    const functionCount = Object.keys(functions).length
    const coveredFunctionCount = Object.values(functions).filter(count => (count as number) > 0).length

    // 分支覆盖率
    let branchTotal = 0, branchCovered = 0
    for (const branch of Object.values(branches)) {
      if (Array.isArray(branch)) {
        branchTotal += branch.length
        branchCovered += branch.filter(count => count > 0).length
      }
    }

    // 语句覆盖率
    const statementCount = Object.keys(statements).length
    const coveredStatementCount = Object.values(statements).filter(count => (count as number) > 0).length

    return {
      file: relative(this.projectRoot, filePath),
      lines: {
        total: lineNumbers.length,
        covered: coveredLineCount,
        percentage: lineNumbers.length > 0 ? (coveredLineCount / lineNumbers.length) * 100 : 0
      },
      functions: {
        total: functionCount,
        covered: coveredFunctionCount,
        percentage: functionCount > 0 ? (coveredFunctionCount / functionCount) * 100 : 0
      },
      branches: {
        total: branchTotal,
        covered: branchCovered,
        percentage: branchTotal > 0 ? (branchCovered / branchTotal) * 100 : 0
      },
      statements: {
        total: statementCount,
        covered: coveredStatementCount,
        percentage: statementCount > 0 ? (coveredStatementCount / statementCount) * 100 : 0
      },
      uncoveredLines
    }
  }

  private shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
    const relativePath = relative(this.projectRoot, filePath)
    
    // 默认排除模式
    const defaultExcludes = [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.next/',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**',
      '**/__mocks__/**'
    ]

    const allPatterns = [...defaultExcludes, ...excludePatterns]
    
    return allPatterns.some(pattern => {
      // 简单的glob匹配
      const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
      
      return new RegExp(regex).test(relativePath)
    })
  }

  private getPackageName(filePath: string): string | null {
    const relativePath = relative(this.projectRoot, filePath)
    
    // 检查是否在 packages/ 目录下
    if (relativePath.startsWith('packages/')) {
      const parts = relativePath.split('/')
      if (parts.length >= 2) {
        return `@linch-kit/${parts[1]}`
      }
    }
    
    // 检查是否在 apps/ 目录下
    if (relativePath.startsWith('apps/')) {
      const parts = relativePath.split('/')
      if (parts.length >= 2) {
        return `apps/${parts[1]}`
      }
    }

    // 检查是否在 tools/ 目录下
    if (relativePath.startsWith('tools/')) {
      const parts = relativePath.split('/')
      if (parts.length >= 2) {
        return `tools/${parts[1]}`
      }
    }

    return null
  }

  private async generateReports(report: CoverageReport, options: any): Promise<void> {
    const formats = options.format === 'all' 
      ? ['html', 'json', 'lcov', 'text', 'badge']
      : [options.format]

    for (const format of formats) {
      switch (format) {
        case 'html':
          await this.generateHtmlReport(report, options.output)
          break
        case 'json':
          await this.generateJsonReport(report, options.output)
          break
        case 'lcov':
          await this.generateLcovReport(report, options.output)
          break
        case 'text':
          await this.generateTextReport(report, options.output)
          break
        case 'badge':
          await this.generateBadgeReport(report, options.output)
          break
      }
    }
  }

  private async generateHtmlReport(report: CoverageReport, outputFile?: string): Promise<void> {
    const output = outputFile || join(this.outputDir, 'index.html')
    
    const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinchKit Coverage Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .metric { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
    .metric-label { color: #6c757d; font-size: 0.9em; }
    .good { color: #28a745; }
    .warning { color: #fd7e14; }
    .danger { color: #dc3545; }
    .files-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .files-table th, .files-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
    .files-table th { background: #f8f9fa; font-weight: 600; }
    .progress { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s; }
    .uncovered-lines { font-size: 0.8em; color: #6c757d; }
    .package-summary { margin-bottom: 30px; }
    .package-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .package-card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 LinchKit Coverage Report</h1>
    <p>生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
    <p>总计文件: ${report.files.length}</p>
    ${report.passed ? 
      '<p style="color: #28a745;">✅ 所有覆盖率阈值均已达标</p>' : 
      '<p style="color: #dc3545;">❌ 部分覆盖率未达标</p>'
    }
  </div>

  <div class="summary">
    <div class="metric">
      <div class="metric-value ${this.getColorClass(report.summary.lines.percentage, report.threshold.lines)}">
        ${report.summary.lines.percentage.toFixed(1)}%
      </div>
      <div class="metric-label">行覆盖率 (${report.summary.lines.covered}/${report.summary.lines.total})</div>
      <div class="progress">
        <div class="progress-bar" style="width: ${report.summary.lines.percentage}%"></div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-value ${this.getColorClass(report.summary.functions.percentage, report.threshold.functions)}">
        ${report.summary.functions.percentage.toFixed(1)}%
      </div>
      <div class="metric-label">函数覆盖率 (${report.summary.functions.covered}/${report.summary.functions.total})</div>
      <div class="progress">
        <div class="progress-bar" style="width: ${report.summary.functions.percentage}%"></div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-value ${this.getColorClass(report.summary.branches.percentage, report.threshold.branches)}">
        ${report.summary.branches.percentage.toFixed(1)}%
      </div>
      <div class="metric-label">分支覆盖率 (${report.summary.branches.covered}/${report.summary.branches.total})</div>
      <div class="progress">
        <div class="progress-bar" style="width: ${report.summary.branches.percentage}%"></div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-value ${this.getColorClass(report.summary.statements.percentage, report.threshold.statements)}">
        ${report.summary.statements.percentage.toFixed(1)}%
      </div>
      <div class="metric-label">语句覆盖率 (${report.summary.statements.covered}/${report.summary.statements.total})</div>
      <div class="progress">
        <div class="progress-bar" style="width: ${report.summary.statements.percentage}%"></div>
      </div>
    </div>
  </div>

  ${Object.keys(report.packages).length > 0 ? this.generatePackageSection(report.packages) : ''}

  <h2>📁 文件覆盖率详情</h2>
  <table class="files-table">
    <thead>
      <tr>
        <th>文件</th>
        <th>行覆盖率</th>
        <th>函数覆盖率</th>
        <th>分支覆盖率</th>
        <th>语句覆盖率</th>
        <th>未覆盖行</th>
      </tr>
    </thead>
    <tbody>
      ${report.files.map(file => `
        <tr>
          <td><code>${file.file}</code></td>
          <td>
            <span class="${this.getColorClass(file.lines.percentage, report.threshold.lines)}">
              ${file.lines.percentage.toFixed(1)}%
            </span>
            (${file.lines.covered}/${file.lines.total})
          </td>
          <td>
            <span class="${this.getColorClass(file.functions.percentage, report.threshold.functions)}">
              ${file.functions.percentage.toFixed(1)}%
            </span>
            (${file.functions.covered}/${file.functions.total})
          </td>
          <td>
            <span class="${this.getColorClass(file.branches.percentage, report.threshold.branches)}">
              ${file.branches.percentage.toFixed(1)}%
            </span>
            (${file.branches.covered}/${file.branches.total})
          </td>
          <td>
            <span class="${this.getColorClass(file.statements.percentage, report.threshold.statements)}">
              ${file.statements.percentage.toFixed(1)}%
            </span>
            (${file.statements.covered}/${file.statements.total})
          </td>
          <td class="uncovered-lines">
            ${file.uncoveredLines.length > 0 ? 
              (file.uncoveredLines.length > 10 ? 
                `${file.uncoveredLines.slice(0, 10).join(', ')}... (+${file.uncoveredLines.length - 10})` :
                file.uncoveredLines.join(', ')
              ) : 
              '✅'
            }
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`

    writeFileSync(output, html)
    console.log(`📄 HTML报告已生成: ${output}`)
  }

  private generatePackageSection(packages: Record<string, any>): string {
    return `
    <div class="package-summary">
      <h2>📦 包覆盖率统计</h2>
      <div class="package-grid">
        ${Object.entries(packages).map(([name, stats]) => `
          <div class="package-card">
            <h3>${name}</h3>
            <p>文件数: ${stats.fileCount}</p>
            <div style="font-size: 0.9em;">
              <div>行: ${stats.lines.toFixed(1)}%</div>
              <div>函数: ${stats.functions.toFixed(1)}%</div>
              <div>分支: ${stats.branches.toFixed(1)}%</div>
              <div>语句: ${stats.statements.toFixed(1)}%</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`
  }

  private getColorClass(value: number, threshold: number): string {
    if (value >= threshold) return 'good'
    if (value >= threshold * 0.8) return 'warning'
    return 'danger'
  }

  private async generateJsonReport(report: CoverageReport, outputFile?: string): Promise<void> {
    const output = outputFile || join(this.outputDir, 'coverage-report.json')
    writeFileSync(output, JSON.stringify(report, null, 2))
    console.log(`📄 JSON报告已生成: ${output}`)
  }

  private async generateLcovReport(report: CoverageReport, outputFile?: string): Promise<void> {
    const output = outputFile || join(this.outputDir, 'lcov.info')
    
    let lcov = ''
    
    for (const file of report.files) {
      const fullPath = join(this.projectRoot, file.file)
      lcov += `TN:\n`
      lcov += `SF:${fullPath}\n`
      
      // 函数
      for (let i = 0; i < file.functions.total; i++) {
        lcov += `FN:${i + 1},function${i + 1}\n`
      }
      lcov += `FNF:${file.functions.total}\n`
      lcov += `FNH:${file.functions.covered}\n`
      
      // 分支
      for (let i = 0; i < file.branches.total; i++) {
        lcov += `BA:${i + 1},${i < file.branches.covered ? 1 : 0}\n`
      }
      lcov += `BRF:${file.branches.total}\n`
      lcov += `BRH:${file.branches.covered}\n`
      
      // 行
      for (let i = 1; i <= file.lines.total; i++) {
        const covered = !file.uncoveredLines.includes(i) ? 1 : 0
        lcov += `DA:${i},${covered}\n`
      }
      lcov += `LH:${file.lines.covered}\n`
      lcov += `LF:${file.lines.total}\n`
      
      lcov += `end_of_record\n`
    }
    
    writeFileSync(output, lcov)
    console.log(`📄 LCOV报告已生成: ${output}`)
  }

  private async generateTextReport(report: CoverageReport, outputFile?: string): Promise<void> {
    const output = outputFile || join(this.outputDir, 'coverage-report.txt')
    
    const text = `
LinchKit Coverage Report
========================

生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}
总文件数: ${report.files.length}
状态: ${report.passed ? '✅ 通过' : '❌ 未通过'}

总体覆盖率
----------
行覆盖率:     ${report.summary.lines.percentage.toFixed(2)}% (${report.summary.lines.covered}/${report.summary.lines.total})
函数覆盖率:   ${report.summary.functions.percentage.toFixed(2)}% (${report.summary.functions.covered}/${report.summary.functions.total})
分支覆盖率:   ${report.summary.branches.percentage.toFixed(2)}% (${report.summary.branches.covered}/${report.summary.branches.total})
语句覆盖率:   ${report.summary.statements.percentage.toFixed(2)}% (${report.summary.statements.covered}/${report.summary.statements.total})

阈值要求
--------
行覆盖率:     >= ${report.threshold.lines}%
函数覆盖率:   >= ${report.threshold.functions}%
分支覆盖率:   >= ${report.threshold.branches}%
语句覆盖率:   >= ${report.threshold.statements}%

文件详情
--------
${report.files.map(file => `
${file.file}
  行:   ${file.lines.percentage.toFixed(2)}% (${file.lines.covered}/${file.lines.total})
  函数: ${file.functions.percentage.toFixed(2)}% (${file.functions.covered}/${file.functions.total})
  分支: ${file.branches.percentage.toFixed(2)}% (${file.branches.covered}/${file.branches.total})
  语句: ${file.statements.percentage.toFixed(2)}% (${file.statements.covered}/${file.statements.total})
  ${file.uncoveredLines.length > 0 ? `未覆盖行: ${file.uncoveredLines.join(', ')}` : '✅ 全覆盖'}
`).join('')}

${Object.keys(report.packages).length > 0 ? `
包统计
------
${Object.entries(report.packages).map(([name, stats]) => `
${name} (${stats.fileCount} 个文件)
  行:   ${stats.lines.toFixed(2)}%
  函数: ${stats.functions.toFixed(2)}%
  分支: ${stats.branches.toFixed(2)}%
  语句: ${stats.statements.toFixed(2)}%
`).join('')}` : ''}
`

    writeFileSync(output, text)
    console.log(`📄 文本报告已生成: ${output}`)
  }

  private async generateBadgeReport(report: CoverageReport, outputFile?: string): Promise<void> {
    const coverage = report.summary.lines.percentage
    const color = coverage >= 80 ? 'brightgreen' : coverage >= 60 ? 'yellow' : 'red'
    
    const badgeUrl = `https://img.shields.io/badge/coverage-${coverage.toFixed(1)}%25-${color}`
    const badgeMarkdown = `![Coverage](${badgeUrl})`
    const badgeHtml = `<img src="${badgeUrl}" alt="Coverage ${coverage.toFixed(1)}%" />`
    
    const output = outputFile || join(this.outputDir, 'coverage-badge.md')
    const badgeData = {
      url: badgeUrl,
      markdown: badgeMarkdown,
      html: badgeHtml,
      coverage: coverage.toFixed(1),
      color,
      timestamp: report.timestamp
    }
    
    writeFileSync(output, JSON.stringify(badgeData, null, 2))
    writeFileSync(join(this.outputDir, 'README-badge.md'), badgeMarkdown)
    
    console.log(`🏆 覆盖率徽章已生成: ${output}`)
    console.log(`🔗 徽章URL: ${badgeUrl}`)
  }

  private printSummary(report: CoverageReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 覆盖率报告总结')
    console.log('='.repeat(60))
    
    console.log(`📁 总文件数: ${report.files.length}`)
    console.log(`📅 生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}`)
    console.log(`${report.passed ? '✅' : '❌'} 状态: ${report.passed ? '通过' : '未通过'}`)
    console.log('')
    
    console.log('📈 覆盖率统计:')
    console.log(`   行数: ${report.summary.lines.percentage.toFixed(2)}% (阈值: ${report.threshold.lines}%) ${report.summary.lines.percentage >= report.threshold.lines ? '✅' : '❌'}`)
    console.log(`   函数: ${report.summary.functions.percentage.toFixed(2)}% (阈值: ${report.threshold.functions}%) ${report.summary.functions.percentage >= report.threshold.functions ? '✅' : '❌'}`)
    console.log(`   分支: ${report.summary.branches.percentage.toFixed(2)}% (阈值: ${report.threshold.branches}%) ${report.summary.branches.percentage >= report.threshold.branches ? '✅' : '❌'}`)
    console.log(`   语句: ${report.summary.statements.percentage.toFixed(2)}% (阈值: ${report.threshold.statements}%) ${report.summary.statements.percentage >= report.threshold.statements ? '✅' : '❌'}`)

    if (Object.keys(report.packages).length > 0) {
      console.log('\n📦 包覆盖率:')
      for (const [name, stats] of Object.entries(report.packages)) {
        console.log(`   ${name}: ${stats.lines.toFixed(1)}% (${stats.fileCount} 个文件)`)
      }
    }

    // 显示覆盖率最低的文件
    const lowCoverageFiles = report.files
      .filter(file => file.lines.percentage < report.threshold.lines)
      .sort((a, b) => a.lines.percentage - b.lines.percentage)
      .slice(0, 5)

    if (lowCoverageFiles.length > 0) {
      console.log('\n⚠️  覆盖率较低的文件:')
      for (const file of lowCoverageFiles) {
        console.log(`   ${file.file}: ${file.lines.percentage.toFixed(1)}%`)
      }
    }

    console.log('='.repeat(60))
  }
}

// CLI 接口
async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: 'string', short: 'i' },
      output: { type: 'string', short: 'o' },
      format: { type: 'string', short: 'f', default: 'all' },
      'threshold-lines': { type: 'string', default: '80' },
      'threshold-functions': { type: 'string', default: '80' },
      'threshold-branches': { type: 'string', default: '80' },
      'threshold-statements': { type: 'string', default: '80' },
      'include-packages': { type: 'boolean', default: true },
      exclude: { type: 'string', multiple: true, default: [] },
      help: { type: 'boolean', short: 'h', default: false }
    }
  })

  if (values.help) {
    console.log(`
LinchKit Coverage Reporter - 覆盖率报告生成器

用法: bun coverage-reporter.ts [options]

选项:
  -i, --input <file>           覆盖率数据文件 [default: coverage/coverage-final.json]
  -o, --output <file>          输出文件路径
  -f, --format <type>          输出格式 (html|json|lcov|text|badge|all) [default: all]
  --threshold-lines <n>        行覆盖率阈值 [default: 80]
  --threshold-functions <n>    函数覆盖率阈值 [default: 80]
  --threshold-branches <n>     分支覆盖率阈值 [default: 80]
  --threshold-statements <n>   语句覆盖率阈值 [default: 80]
  --include-packages          包含包统计 [default: true]
  --exclude <pattern>          排除文件模式 (可重复)
  -h, --help                   显示帮助信息

示例:
  bun coverage-reporter.ts                    # 生成所有格式报告
  bun coverage-reporter.ts -f html            # 只生成HTML报告
  bun coverage-reporter.ts --threshold-lines 90  # 设置行覆盖率阈值为90%
  bun coverage-reporter.ts --exclude "**/*.d.ts"  # 排除类型声明文件
`)
    process.exit(0)
  }

  const options = {
    input: values.input,
    output: values.output,
    format: values.format as any || 'all',
    threshold: {
      lines: parseInt(values['threshold-lines'] as string || '80'),
      functions: parseInt(values['threshold-functions'] as string || '80'),
      branches: parseInt(values['threshold-branches'] as string || '80'),
      statements: parseInt(values['threshold-statements'] as string || '80')
    },
    includePackages: values['include-packages'] ?? true,
    excludePatterns: (values.exclude as string[]) || []
  }

  try {
    const reporter = new LinchKitCoverageReporter()
    const report = await reporter.generateReport(options)
    
    // 根据覆盖率阈值设置退出码
    process.exit(report.passed ? 0 : 1)
  } catch (error) {
    console.error('💥 覆盖率报告生成失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (import.meta.main) {
  main().catch(console.error)
}

export { LinchKitCoverageReporter, type CoverageReport, type FileCoverage }