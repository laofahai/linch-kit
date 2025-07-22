#!/usr/bin/env bun

/**
 * LinchKit Test Runner - Bun Test 包装器
 * 支持覆盖率报告、多种测试模式和智能分析
 */

import { spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { parseArgs } from 'util'

interface TestRunnerOptions {
  mode: 'unit' | 'integration' | 'e2e' | 'all'
  coverage: boolean
  watch: boolean
  pattern?: string
  verbose: boolean
  bail: boolean
  timeout: number
  concurrency: number
  reporter: 'default' | 'json' | 'junit' | 'tap'
  outputFile?: string
}

interface TestResult {
  success: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  duration: number
  coverage?: CoverageReport
  errors: Array<{
    file: string
    test: string
    error: string
  }>
}

interface CoverageReport {
  lines: { covered: number; total: number; percentage: number }
  functions: { covered: number; total: number; percentage: number }
  branches: { covered: number; total: number; percentage: number }
  statements: { covered: number; total: number; percentage: number }
  files: Record<string, {
    lines: number
    functions: number
    branches: number
    statements: number
  }>
}

class LinchKitTestRunner {
  private projectRoot: string
  private coverageDir: string

  constructor() {
    this.projectRoot = resolve(process.cwd())
    this.coverageDir = join(this.projectRoot, 'coverage')
  }

  async run(options: TestRunnerOptions): Promise<TestResult> {
    console.log('🧪 LinchKit Test Runner v2.0.0')
    console.log(`📋 模式: ${options.mode}`)
    console.log(`📊 覆盖率: ${options.coverage ? '启用' : '禁用'}`)
    console.log(`🔍 监视: ${options.watch ? '启用' : '禁用'}`)
    console.log('')

    const startTime = Date.now()

    try {
      // 准备测试环境
      await this.prepareTestEnvironment()

      // 构建测试命令
      const command = this.buildTestCommand(options)
      
      // 执行测试
      const result = await this.executeTests(command, options)
      
      // 处理覆盖率报告
      if (options.coverage) {
        result.coverage = await this.processCoverageReport()
      }

      // 生成测试报告
      await this.generateTestReport(result, options)

      const duration = Date.now() - startTime
      result.duration = duration

      this.printSummary(result)

      return result
    } catch (error) {
      console.error('❌ 测试运行失败:', error)
      throw error
    }
  }

  private async prepareTestEnvironment(): Promise<void> {
    // 确保覆盖率目录存在
    if (!existsSync(this.coverageDir)) {
      mkdirSync(this.coverageDir, { recursive: true })
    }

    // 清理之前的覆盖率数据
    const oldCoverageFiles = [
      'coverage.json',
      'lcov.info',
      'coverage-final.json'
    ]

    for (const file of oldCoverageFiles) {
      const filePath = join(this.coverageDir, file)
      if (existsSync(filePath)) {
        // 可选：保留备份
        // await fs.rename(filePath, `${filePath}.backup`)
      }
    }
  }

  private buildTestCommand(options: TestRunnerOptions): string[] {
    const args = ['test']

    // 测试模式过滤
    switch (options.mode) {
      case 'unit':
        args.push('--testNamePattern=unit|Unit')
        break
      case 'integration':
        args.push('--testNamePattern=integration|Integration')
        break
      case 'e2e':
        args.push('--testNamePattern=e2e|E2E|End')
        break
      case 'all':
        // 运行所有测试
        break
    }

    // 覆盖率选项
    if (options.coverage) {
      args.push('--coverage')
      args.push(`--coverage-dir=${this.coverageDir}`)
    }

    // 监视模式
    if (options.watch) {
      args.push('--watch')
    }

    // 测试模式选项
    if (options.pattern) {
      args.push(`--testPathPattern=${options.pattern}`)
    }

    if (options.verbose) {
      args.push('--verbose')
    }

    if (options.bail) {
      args.push('--bail')
    }

    // 超时设置
    if (options.timeout !== 5000) {
      args.push(`--timeout=${options.timeout}`)
    }

    // 并发设置
    if (options.concurrency !== 4) {
      args.push(`--concurrency=${options.concurrency}`)
    }

    // 报告器
    if (options.reporter !== 'default') {
      args.push(`--reporter=${options.reporter}`)
    }

    return args
  }

  private executeTests(command: string[], options: TestRunnerOptions): Promise<TestResult> {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', command, {
        stdio: 'pipe',
        cwd: this.projectRoot
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        const output = data.toString()
        stdout += output
        if (options.verbose) {
          process.stdout.write(output)
        }
      })

      child.stderr?.on('data', (data) => {
        const output = data.toString()
        stderr += output
        if (options.verbose) {
          process.stderr.write(output)
        }
      })

      child.on('close', (code) => {
        const result = this.parseTestOutput(stdout, stderr, code === 0)
        
        if (code === 0) {
          resolve(result)
        } else {
          // 即使测试失败，也解析结果
          resolve(result)
        }
      })

      child.on('error', (error) => {
        reject(new Error(`测试执行失败: ${error.message}`))
      })
    })
  }

  private parseTestOutput(stdout: string, stderr: string, success: boolean): TestResult {
    // 解析 Bun test 输出
    const lines = stdout.split('\n')
    
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    let skippedTests = 0
    const errors: Array<{ file: string; test: string; error: string }> = []

    // 查找测试结果总结
    for (const line of lines) {
      if (line.includes('pass')) {
        const match = line.match(/(\d+)\s+pass/)
        if (match) passedTests = parseInt(match[1])
      }
      
      if (line.includes('fail')) {
        const match = line.match(/(\d+)\s+fail/)
        if (match) failedTests = parseInt(match[1])
      }

      if (line.includes('skip')) {
        const match = line.match(/(\d+)\s+skip/)
        if (match) skippedTests = parseInt(match[1])
      }
    }

    totalTests = passedTests + failedTests + skippedTests

    // 解析错误信息
    if (stderr) {
      errors.push({
        file: 'unknown',
        test: 'stderr',
        error: stderr
      })
    }

    return {
      success,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: 0, // 将在调用方设置
      errors
    }
  }

  private async processCoverageReport(): Promise<CoverageReport | undefined> {
    const coverageFile = join(this.coverageDir, 'coverage-final.json')
    
    if (!existsSync(coverageFile)) {
      console.warn('⚠️ 未找到覆盖率报告文件')
      return undefined
    }

    try {
      const coverageData = JSON.parse(readFileSync(coverageFile, 'utf-8'))
      
      // 计算总体覆盖率统计
      let totalLines = 0, coveredLines = 0
      let totalFunctions = 0, coveredFunctions = 0
      let totalBranches = 0, coveredBranches = 0
      let totalStatements = 0, coveredStatements = 0

      const files: Record<string, any> = {}

      for (const [file, data] of Object.entries(coverageData)) {
        if (typeof data === 'object' && data !== null) {
          const fileData = data as any
          
          if (fileData.l) {
            totalLines += Object.keys(fileData.l).length
            coveredLines += Object.values(fileData.l).filter(Boolean).length
          }

          if (fileData.f) {
            totalFunctions += Object.keys(fileData.f).length
            coveredFunctions += Object.values(fileData.f).filter(Boolean).length
          }

          if (fileData.b) {
            for (const branch of Object.values(fileData.b) as any[]) {
              if (Array.isArray(branch)) {
                totalBranches += branch.length
                coveredBranches += branch.filter(Boolean).length
              }
            }
          }

          if (fileData.s) {
            totalStatements += Object.keys(fileData.s).length
            coveredStatements += Object.values(fileData.s).filter(Boolean).length
          }

          files[file] = {
            lines: fileData.l ? Object.values(fileData.l).filter(Boolean).length / Object.keys(fileData.l).length * 100 : 0,
            functions: fileData.f ? Object.values(fileData.f).filter(Boolean).length / Object.keys(fileData.f).length * 100 : 0,
            branches: fileData.b ? this.calculateBranchCoverage(fileData.b) : 0,
            statements: fileData.s ? Object.values(fileData.s).filter(Boolean).length / Object.keys(fileData.s).length * 100 : 0
          }
        }
      }

      return {
        lines: { covered: coveredLines, total: totalLines, percentage: totalLines ? (coveredLines / totalLines) * 100 : 0 },
        functions: { covered: coveredFunctions, total: totalFunctions, percentage: totalFunctions ? (coveredFunctions / totalFunctions) * 100 : 0 },
        branches: { covered: coveredBranches, total: totalBranches, percentage: totalBranches ? (coveredBranches / totalBranches) * 100 : 0 },
        statements: { covered: coveredStatements, total: totalStatements, percentage: totalStatements ? (coveredStatements / totalStatements) * 100 : 0 },
        files
      }
    } catch (error) {
      console.warn('⚠️ 处理覆盖率报告时出错:', error)
      return undefined
    }
  }

  private calculateBranchCoverage(branches: any): number {
    let total = 0, covered = 0
    for (const branch of Object.values(branches)) {
      if (Array.isArray(branch)) {
        total += branch.length
        covered += branch.filter(Boolean).length
      }
    }
    return total ? (covered / total) * 100 : 0
  }

  private async generateTestReport(result: TestResult, options: TestRunnerOptions): Promise<void> {
    const reportFile = join(this.coverageDir, 'test-report.json')
    
    const report = {
      timestamp: new Date().toISOString(),
      options,
      result,
      environment: {
        node: process.version,
        bun: await this.getBunVersion(),
        platform: process.platform,
        arch: process.arch
      }
    }

    writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`📋 测试报告已保存: ${reportFile}`)

    // 如果指定了输出文件
    if (options.outputFile) {
      writeFileSync(options.outputFile, JSON.stringify(report, null, 2))
      console.log(`📋 测试报告已保存: ${options.outputFile}`)
    }
  }

  private async getBunVersion(): Promise<string> {
    try {
      const { stdout } = await import('child_process').then(cp => 
        new Promise<{ stdout: string }>((resolve, reject) => {
          const child = cp.spawn('bun', ['--version'], { stdio: 'pipe' })
          let stdout = ''
          child.stdout?.on('data', data => stdout += data.toString())
          child.on('close', code => code === 0 ? resolve({ stdout }) : reject())
        })
      )
      return stdout.trim()
    } catch {
      return 'unknown'
    }
  }

  private printSummary(result: TestResult): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试运行总结')
    console.log('='.repeat(60))
    
    console.log(`✅ 通过: ${result.passedTests}`)
    console.log(`❌ 失败: ${result.failedTests}`)
    console.log(`⏭️  跳过: ${result.skippedTests}`)
    console.log(`📊 总计: ${result.totalTests}`)
    console.log(`⏱️  耗时: ${(result.duration / 1000).toFixed(2)}s`)

    if (result.coverage) {
      console.log('\n📈 覆盖率统计:')
      console.log(`   行数: ${result.coverage.lines.percentage.toFixed(2)}% (${result.coverage.lines.covered}/${result.coverage.lines.total})`)
      console.log(`   函数: ${result.coverage.functions.percentage.toFixed(2)}% (${result.coverage.functions.covered}/${result.coverage.functions.total})`)
      console.log(`   分支: ${result.coverage.branches.percentage.toFixed(2)}% (${result.coverage.branches.covered}/${result.coverage.branches.total})`)
      console.log(`   语句: ${result.coverage.statements.percentage.toFixed(2)}% (${result.coverage.statements.covered}/${result.coverage.statements.total})`)
      
      // 覆盖率阈值检查
      const threshold = 80
      const linesCoverage = result.coverage.lines.percentage
      if (linesCoverage < threshold) {
        console.log(`\n⚠️  警告: 行覆盖率 ${linesCoverage.toFixed(2)}% 低于阈值 ${threshold}%`)
      } else {
        console.log(`\n✅ 覆盖率达标: ${linesCoverage.toFixed(2)}% >= ${threshold}%`)
      }
    }

    if (result.errors.length > 0) {
      console.log('\n🐛 错误详情:')
      for (const error of result.errors.slice(0, 5)) { // 只显示前5个错误
        console.log(`   ${error.file}: ${error.test}`)
        console.log(`   ${error.error}`)
        console.log('')
      }
      
      if (result.errors.length > 5) {
        console.log(`   ... 还有 ${result.errors.length - 5} 个错误`)
      }
    }

    console.log('='.repeat(60))
  }
}

// CLI 接口
async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      mode: { type: 'string', short: 'm', default: 'all' },
      coverage: { type: 'boolean', short: 'c', default: true },
      watch: { type: 'boolean', short: 'w', default: false },
      pattern: { type: 'string', short: 'p' },
      verbose: { type: 'boolean', short: 'v', default: false },
      bail: { type: 'boolean', short: 'b', default: false },
      timeout: { type: 'string', short: 't', default: '5000' },
      concurrency: { type: 'string', default: '4' },
      reporter: { type: 'string', short: 'r', default: 'default' },
      output: { type: 'string', short: 'o' },
      help: { type: 'boolean', short: 'h', default: false }
    },
    allowPositionals: true
  })

  if (values.help) {
    console.log(`
LinchKit Test Runner - Bun Test 包装器

用法: bun test-runner.ts [options]

选项:
  -m, --mode <type>        测试模式 (unit|integration|e2e|all) [default: all]
  -c, --coverage           启用覆盖率报告 [default: true]
  -w, --watch             监视模式
  -p, --pattern <pattern>  测试文件匹配模式
  -v, --verbose           详细输出
  -b, --bail              遇到失败时停止
  -t, --timeout <ms>      测试超时时间 [default: 5000]
  --concurrency <n>       并发数 [default: 4]
  -r, --reporter <type>   报告器类型 (default|json|junit|tap) [default: default]
  -o, --output <file>     输出文件路径
  -h, --help              显示帮助信息

示例:
  bun test-runner.ts                           # 运行所有测试
  bun test-runner.ts -m unit                   # 只运行单元测试
  bun test-runner.ts -w                        # 监视模式
  bun test-runner.ts -p "**/*auth*"            # 运行包含 auth 的测试
  bun test-runner.ts --no-coverage             # 禁用覆盖率
`)
    process.exit(0)
  }

  const options: TestRunnerOptions = {
    mode: values.mode as any || 'all',
    coverage: values.coverage ?? true,
    watch: values.watch ?? false,
    pattern: values.pattern,
    verbose: values.verbose ?? false,
    bail: values.bail ?? false,
    timeout: parseInt(values.timeout as string || '5000'),
    concurrency: parseInt(values.concurrency as string || '4'),
    reporter: values.reporter as any || 'default',
    outputFile: values.output
  }

  try {
    const runner = new LinchKitTestRunner()
    const result = await runner.run(options)
    
    // 设置退出码
    process.exit(result.success && result.failedTests === 0 ? 0 : 1)
  } catch (error) {
    console.error('💥 测试运行器执行失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (import.meta.main) {
  main().catch(console.error)
}

export { LinchKitTestRunner, type TestRunnerOptions, type TestResult }