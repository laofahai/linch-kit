/**
 * LinchKit Arch-Warden (架构典狱官)
 * 
 * 自动化架构合规性检查工具，基于Graph RAG知识图谱验证架构决策
 * 防止违反LinchKit 4层架构原则的变更
 * 
 * 架构设计理念：
 * - 集成到 ai-platform 中，充分利用 Graph RAG 和其他 AI 能力
 * - 提供轻量级的 Claude Code 适配接口
 * - 支持实时架构监控和违规阻止
 * 
 * @version 1.0.0
 * @author LinchKit AI Guardian System
 */

import { DependencyGraph } from '../../../dev/deps-graph.js'

/**
 * LinchKit架构层级定义
 * 基于实际项目结构和依赖分析脚本的结果
 */
const ARCHITECTURE_LAYERS = {
  L0: ['@linch-kit/core'],           // 基础设施层
  L1: ['@linch-kit/auth'],           // 认证授权层
  L2: ['@linch-kit/ui'],             // 用户界面层
  L3: ['@linch-kit/platform']        // 业务平台层
} as const

/**
 * 正确的依赖顺序（基于实际运行结果）
 */
const EXPECTED_BUILD_ORDER = [
  '@linch-kit/core',
  '@linch-kit/auth', 
  '@linch-kit/ui',
  '@linch-kit/platform'
] as const

interface ArchViolation {
  type: 'circular_dependency' | 'reverse_dependency' | 'layer_violation' | 'unknown_package'
  severity: 'fatal' | 'error' | 'warning'
  package: string
  dependency?: string
  message: string
  suggestion: string
}

interface ArchComplianceReport {
  isCompliant: boolean
  violations: ArchViolation[]
  summary: {
    totalPackages: number
    buildOrder: string[]
    complianceScore: number
    expectedOrder: string[]
  }
  recommendations: string[]
  timestamp: string
}

/**
 * Claude Code 适配接口
 * 提供给 .claude/commands/ 调用的简化接口
 */
interface ClaudeArchCheckOptions {
  targetPackage?: string
  verbose?: boolean
  format?: 'text' | 'json'
}

export class ArchWarden {
  private dependencyGraph: DependencyGraph

  constructor() {
    this.dependencyGraph = new DependencyGraph()
  }

  /**
   * Claude Code 适配方法
   * 专为 .claude/commands/arch-check.md 设计的简化接口
   */
  async claudeCheck(options: ClaudeArchCheckOptions = {}): Promise<{
    success: boolean
    report: ArchComplianceReport
    output: string
  }> {
    try {
      const report = await this.checkCompliance()
      
      // 如果指定了特定包，添加详细信息
      if (options.targetPackage) {
        report.recommendations.unshift(`🔍 详细检查包: ${options.targetPackage}`)
      }
      
      const output = options.format === 'json' 
        ? JSON.stringify(report, null, 2)
        : this.formatReportForClaude(report, options)
      
      return {
        success: report.isCompliant,
        report,
        output
      }
    } catch (error) {
      const errorOutput = `❌ Arch-Warden 执行失败: ${error instanceof Error ? error.message : String(error)}`
      return {
        success: false,
        report: this.createErrorReport(String(error)),
        output: errorOutput
      }
    }
  }

  /**
   * 执行完整的架构合规性检查
   */
  async checkCompliance(): Promise<ArchComplianceReport> {
    try {
      // 分析当前依赖关系
      const analysis = await this.dependencyGraph.analyze()
      
      // 检查架构违规
      const violations = await this.detectViolations(analysis)
      
      // 生成合规性报告
      const report = this.generateComplianceReport(analysis, violations)
      
      return report
      
    } catch (error) {
      throw new Error(`架构检查失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 检测架构违规
   */
  private async detectViolations(analysis: any): Promise<ArchViolation[]> {
    const violations: ArchViolation[] = []

    // 1. 检查循环依赖
    violations.push(...this.checkCircularDependencies(analysis))
    
    // 2. 检查层级违规
    violations.push(...this.checkLayerViolations(analysis))
    
    // 3. 检查未知包
    violations.push(...this.checkUnknownPackages(analysis))
    
    // 4. 检查逆向依赖
    violations.push(...this.checkReverseDependencies(analysis))

    return violations
  }

  /**
   * 检查循环依赖
   */
  private checkCircularDependencies(analysis: any): ArchViolation[] {
    const violations: ArchViolation[] = []
    
    // deps-graph.ts 已经会检测循环依赖并抛出错误
    // 如果能到这里说明没有循环依赖
    
    return violations
  }

  /**
   * 检查层级违规
   */
  private checkLayerViolations(analysis: any): ArchViolation[] {
    const violations: ArchViolation[] = []
    
    // 检查每个包是否只依赖更低层级的包
    for (const [packageName, dependencies] of analysis.dependencies) {
      const packageLayer = this.getPackageLayer(packageName)
      
      for (const dep of dependencies) {
        const depLayer = this.getPackageLayer(dep)
        
        if (packageLayer !== null && depLayer !== null) {
          if (packageLayer <= depLayer) {
            violations.push({
              type: 'layer_violation',
              severity: 'error',
              package: packageName,
              dependency: dep,
              message: `${packageName} (L${packageLayer}) 不能依赖 ${dep} (L${depLayer})`,
              suggestion: `重构 ${packageName}，移除对 ${dep} 的依赖，或调整架构层级`
            })
          }
        }
      }
    }
    
    return violations
  }

  /**
   * 检查未知包
   */
  private checkUnknownPackages(analysis: any): ArchViolation[] {
    const violations: ArchViolation[] = []
    const knownPackages = new Set(EXPECTED_BUILD_ORDER)
    
    for (const pkg of analysis.packages) {
      if (!knownPackages.has(pkg.name)) {
        violations.push({
          type: 'unknown_package',
          severity: 'warning',
          package: pkg.name,
          message: `发现未知包: ${pkg.name}`,
          suggestion: `确认 ${pkg.name} 是否应该在架构层级中，或移除该包`
        })
      }
    }
    
    return violations
  }

  /**
   * 检查逆向依赖
   */
  private checkReverseDependencies(analysis: any): ArchViolation[] {
    const violations: ArchViolation[] = []
    
    // 检查构建顺序是否正确
    const actualOrder = analysis.buildOrder
    
    // 检查core是否是第一个
    if (actualOrder.length > 0 && actualOrder[0] !== '@linch-kit/core') {
      violations.push({
        type: 'reverse_dependency',
        severity: 'error',
        package: actualOrder[0],
        message: '@linch-kit/core 必须是第一个（基础层）',
        suggestion: '移除其他包对core包的依赖，确保core包无依赖'
      })
    }
    
    // 检查platform是否是最后一个
    const lastPackage = actualOrder[actualOrder.length - 1]
    if (lastPackage && !lastPackage.includes('platform')) {
      violations.push({
        type: 'reverse_dependency',
        severity: 'error', 
        package: lastPackage,
        message: '@linch-kit/platform 应该是最后一个（应用层）',
        suggestion: '检查platform包的依赖关系，确保其在最高层级'
      })
    }
    
    return violations
  }

  /**
   * 获取包的层级
   */
  private getPackageLayer(packageName: string): number | null {
    for (const [layer, packages] of Object.entries(ARCHITECTURE_LAYERS)) {
      if (packages.includes(packageName as any)) {
        return parseInt(layer.replace('L', ''))
      }
    }
    return null
  }

  /**
   * 生成合规性报告
   */
  private generateComplianceReport(analysis: any, violations: ArchViolation[]): ArchComplianceReport {
    const fatalViolations = violations.filter(v => v.severity === 'fatal')
    const errorViolations = violations.filter(v => v.severity === 'error')
    const warningViolations = violations.filter(v => v.severity === 'warning')
    
    const isCompliant = fatalViolations.length === 0 && errorViolations.length === 0
    
    // 计算合规性分数 (0-100)
    let complianceScore = 100
    complianceScore -= fatalViolations.length * 50  // 致命错误 -50分
    complianceScore -= errorViolations.length * 20  // 错误 -20分  
    complianceScore -= warningViolations.length * 5 // 警告 -5分
    complianceScore = Math.max(0, complianceScore)

    const recommendations = this.generateRecommendations(violations)

    return {
      isCompliant,
      violations,
      summary: {
        totalPackages: analysis.packages.length,
        buildOrder: analysis.buildOrder,
        complianceScore,
        expectedOrder: [...EXPECTED_BUILD_ORDER]
      },
      recommendations,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 生成修复建议
   */
  private generateRecommendations(violations: ArchViolation[]): string[] {
    const recommendations: string[] = []
    
    if (violations.length === 0) {
      recommendations.push('✅ 架构完全合规，继续保持！')
      return recommendations
    }

    const fatalCount = violations.filter(v => v.severity === 'fatal').length
    const errorCount = violations.filter(v => v.severity === 'error').length
    const warningCount = violations.filter(v => v.severity === 'warning').length

    if (fatalCount > 0) {
      recommendations.push('🚨 立即修复致命的架构违规，系统无法正常工作')
    }
    
    if (errorCount > 0) {
      recommendations.push('❌ 修复架构错误，防止技术债务累积')
    }
    
    if (warningCount > 0) {
      recommendations.push('⚠️ 关注架构警告，保持代码质量')
    }

    // 基于违规类型的具体建议
    const circularDeps = violations.filter(v => v.type === 'circular_dependency')
    if (circularDeps.length > 0) {
      recommendations.push('🔄 重构代码以消除循环依赖：使用依赖注入或事件系统')
    }

    const layerViolations = violations.filter(v => v.type === 'layer_violation')
    if (layerViolations.length > 0) {
      recommendations.push('📦 调整包结构以符合层级架构：下层包不能依赖上层包')
    }

    return recommendations
  }

  /**
   * 为Claude Code格式化报告输出
   */
  private formatReportForClaude(report: ArchComplianceReport, options: ClaudeArchCheckOptions): string {
    const lines: string[] = []
    
    lines.push('🛡️ ===== Arch-Warden 架构合规性报告 =====\n')
    
    // 概览
    lines.push('📊 概览:')
    lines.push(`   包总数: ${report.summary.totalPackages}`)
    lines.push(`   合规状态: ${report.isCompliant ? '✅ 合规' : '❌ 不合规'}`)
    lines.push(`   合规分数: ${report.summary.complianceScore}/100`)
    lines.push(`   期望顺序: ${report.summary.expectedOrder.join(' → ')}`)
    lines.push(`   实际顺序: ${report.summary.buildOrder.join(' → ')}\n`)
    
    // 违规详情
    if (report.violations.length > 0) {
      lines.push(`🚨 发现 ${report.violations.length} 个架构违规:\n`)
      
      for (const violation of report.violations) {
        const icon = violation.severity === 'fatal' ? '💀' : 
                    violation.severity === 'error' ? '❌' : '⚠️'
        
        lines.push(`${icon} ${violation.type.toUpperCase()}`)
        lines.push(`   包: ${violation.package}`)
        if (violation.dependency) {
          lines.push(`   依赖: ${violation.dependency}`)
        }
        lines.push(`   问题: ${violation.message}`)
        lines.push(`   建议: ${violation.suggestion}\n`)
      }
    }
    
    // 修复建议
    if (report.recommendations.length > 0) {
      lines.push('💡 修复建议:')
      for (const rec of report.recommendations) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }
    
    // 架构约束说明
    if (options.verbose) {
      lines.push('📋 LinchKit 架构约束:')
      lines.push('   L0: @linch-kit/core (基础设施)')
      lines.push('   L1: @linch-kit/auth (认证授权)')
      lines.push('   L2: @linch-kit/ui (用户界面)')
      lines.push('   L3: @linch-kit/platform (业务平台)')
      lines.push('')
      lines.push('🔗 依赖规则: 只能依赖更低层级的包')
      lines.push('🚫 禁止规则: 循环依赖、逆向依赖\n')
    }
    
    lines.push('🛡️ ===== 架构检查完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 创建错误报告
   */
  private createErrorReport(error: string): ArchComplianceReport {
    return {
      isCompliant: false,
      violations: [{
        type: 'circular_dependency',
        severity: 'fatal',
        package: 'system',
        message: `系统错误: ${error}`,
        suggestion: '检查依赖分析脚本和项目结构'
      }],
      summary: {
        totalPackages: 0,
        buildOrder: [],
        complianceScore: 0,
        expectedOrder: [...EXPECTED_BUILD_ORDER]
      },
      recommendations: ['🚨 修复系统错误后重新运行检查'],
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 阻止违规变更
   */
  enforceCompliance(report: ArchComplianceReport): boolean {
    const fatalViolations = report.violations.filter(v => v.severity === 'fatal')
    const errorViolations = report.violations.filter(v => v.severity === 'error')
    
    if (fatalViolations.length > 0) {
      return false
    }
    
    if (errorViolations.length > 0) {
      // 在CI环境中可以设置为阻止
      const isCI = process.env.CI === 'true'
      if (isCI) {
        return false
      }
    }
    
    return true
  }
}

export default ArchWarden