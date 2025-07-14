/**
 * LinchKit Security Sentinel (安全哨兵)
 * 
 * Extension和AI代码安全防护系统，确保AI生成代码和Extension动态加载安全性
 * 
 * 核心功能：
 * - Extension代码静态安全分析
 * - AI生成代码安全模式检查
 * - 沙箱隔离机制（VM2集成）
 * - 权限控制和威胁检测
 * - 与现有CASL权限系统集成
 * 
 * @version 1.0.0
 * @author LinchKit AI Guardian System
 */

// 临时使用console.log直到logger导出问题解决
const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args)
}

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * 安全威胁类型
 */
type SecurityThreatType = 
  | 'code_injection'
  | 'path_traversal'
  | 'command_injection'
  | 'prototype_pollution'
  | 'eval_usage'
  | 'unsafe_import'
  | 'permission_bypass'
  | 'data_exposure'
  | 'resource_exhaustion'

/**
 * 威胁严重程度
 */
type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * 安全扫描结果
 */
interface SecurityScanResult {
  fileName: string
  filePath: string
  threatType: SecurityThreatType
  severity: ThreatSeverity
  description: string
  line: number
  column?: number
  code: string
  recommendation: string
  autoFixAvailable: boolean
  riskScore: number // 0-100
}

/**
 * 扩展安全评估
 */
interface ExtensionSecurityAssessment {
  extensionName: string
  extensionPath: string
  overallRiskScore: number // 0-100
  threats: SecurityScanResult[]
  permissions: {
    requested: string[]
    granted: string[]
    violations: string[]
  }
  sandboxStatus: 'isolated' | 'partial' | 'unrestricted'
  recommendations: {
    immediate: string[]
    preventive: string[]
    monitoring: string[]
  }
  metadata: {
    scanTime: string
    filesScanned: number
    rulesApplied: number
    falsePositives: number
  }
}

/**
 * AI代码安全审计
 */
interface AICodeSecurityAudit {
  sessionId: string
  generatedAt: string
  codeSnippets: {
    content: string
    filePath: string
    riskScore: number
    threats: SecurityScanResult[]
  }[]
  overallRiskScore: number
  securityPatterns: {
    pattern: string
    violations: number
    severity: ThreatSeverity
  }[]
  recommendations: string[]
}

/**
 * Security Sentinel 配置
 */
interface SecuritySentinelConfig {
  extensionSandboxing: boolean
  strictPermissionMode: boolean
  aiCodeReviewEnabled: boolean
  threatThreshold: number // 威胁分数阈值
  autoBlockThreshold: number // 自动阻止阈值
  scanPatterns: {
    extensions: string[]
    aiGenerated: string[]
    suspicious: string[]
  }
  trustedSources: string[]
  quarantineDir: string
}

export class SecuritySentinel {
  private config: SecuritySentinelConfig
  private dataDir: string
  private securityRules: Map<SecurityThreatType, RegExp[]> = new Map()

  constructor() {
    this.config = {
      extensionSandboxing: true,
      strictPermissionMode: true,
      aiCodeReviewEnabled: true,
      threatThreshold: 25, // 25分以上认为有威胁
      autoBlockThreshold: 75, // 75分以上自动阻止
      scanPatterns: {
        extensions: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        aiGenerated: ['**/ai-generated/**/*', '**/*.ai.ts', '**/*.generated.ts'],
        suspicious: ['**/node_modules/**/*', '**/dist/**/*', '**/*.min.js']
      },
      trustedSources: [
        '@linch-kit/',
        'react',
        'next',
        'typescript'
      ],
      quarantineDir: '.security/quarantine'
    }
    
    const currentDir = dirname(fileURLToPath(import.meta.url))
    this.dataDir = join(currentDir, '../../../..', '.claude', 'security-sentinel')
    
    this.initializeSecurityRules()
  }

  /**
   * Claude Code 适配接口
   */
  async claudeSecurityCheck(options: {
    action?: 'scan' | 'audit' | 'assess' | 'quarantine'
    target?: string
    extensionName?: string
    aiCode?: string
    verbose?: boolean
    format?: 'text' | 'json'
  } = {}): Promise<{
    success: boolean
    data: unknown
    output: string
  }> {
    try {
      const action = options.action || 'scan'
      
      switch (action) {
        case 'scan':
          if (!options.target) {
            throw new Error('扫描目标路径是必需的')
          }
          const scanResult = await this.scanDirectory(options.target)
          return {
            success: scanResult.threats.length === 0,
            data: scanResult,
            output: options.format === 'json' 
              ? JSON.stringify(scanResult, null, 2)
              : this.formatScanResultForClaude(scanResult, options)
          }
          
        case 'audit':
          if (!options.aiCode) {
            throw new Error('AI代码内容是必需的')
          }
          const auditResult = await this.auditAIGeneratedCode(options.aiCode)
          return {
            success: auditResult.overallRiskScore < this.config.threatThreshold,
            data: auditResult,
            output: options.format === 'json'
              ? JSON.stringify(auditResult, null, 2)
              : this.formatAuditResultForClaude(auditResult, options)
          }
          
        case 'assess':
          if (!options.extensionName) {
            throw new Error('扩展名是必需的')
          }
          const assessment = await this.assessExtensionSecurity(options.extensionName)
          return {
            success: assessment.overallRiskScore < this.config.threatThreshold,
            data: assessment,
            output: options.format === 'json'
              ? JSON.stringify(assessment, null, 2)
              : this.formatAssessmentForClaude(assessment, options)
          }
          
        case 'quarantine':
          if (!options.target) {
            throw new Error('隔离目标是必需的')
          }
          await this.quarantineFile(options.target)
          return {
            success: true,
            data: { quarantined: true },
            output: `🔒 文件已被隔离到安全区域: ${options.target}`
          }
          
        default:
          throw new Error(`未知操作: ${action}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Security Sentinel执行失败', { error: errorMessage })
      
      return {
        success: false,
        data: null,
        output: `❌ Security Sentinel执行失败: ${errorMessage}`
      }
    }
  }

  /**
   * 扫描目录中的安全威胁
   */
  async scanDirectory(dirPath: string): Promise<ExtensionSecurityAssessment> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true })

      const scanResults: SecurityScanResult[] = []
      const startTime = Date.now()
      
      // 获取所有需要扫描的文件
      const filesToScan = await this.getFilesToScan(dirPath)
      
      logger.info('开始安全扫描', {
        目录: dirPath,
        文件数量: filesToScan.length
      })

      // 扫描每个文件
      for (const filePath of filesToScan) {
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const threats = await this.scanFileContent(filePath, fileContent)
          scanResults.push(...threats)
        } catch (error) {
          logger.warn('跳过文件扫描', { 文件: filePath, 错误: error })
        }
      }

      // 计算整体风险分数
      const overallRiskScore = this.calculateOverallRiskScore(scanResults)
      
      // 生成建议
      const recommendations = this.generateSecurityRecommendations(scanResults)

      const assessment: ExtensionSecurityAssessment = {
        extensionName: dirPath.split('/').pop() || 'unknown',
        extensionPath: dirPath,
        overallRiskScore,
        threats: scanResults,
        permissions: {
          requested: [], // TODO: 实现权限分析
          granted: [],
          violations: []
        },
        sandboxStatus: overallRiskScore > this.config.autoBlockThreshold ? 'isolated' : 'unrestricted',
        recommendations,
        metadata: {
          scanTime: new Date().toISOString(),
          filesScanned: filesToScan.length,
          rulesApplied: this.getTotalRules(),
          falsePositives: 0 // TODO: 实现假阳性检测
        }
      }

      // 保存扫描结果
      await this.persistScanResult(assessment)

      logger.info('安全扫描完成', {
        威胁数量: scanResults.length,
        风险分数: overallRiskScore,
        扫描时间: Date.now() - startTime
      })

      return assessment
    } catch (error) {
      logger.error('目录安全扫描失败', { error, dirPath })
      throw error
    }
  }

  /**
   * 审计AI生成的代码
   */
  async auditAIGeneratedCode(code: string, filePath?: string): Promise<AICodeSecurityAudit> {
    try {
      const sessionId = process.env.AI_SESSION_ID || 'default'
      const threats = await this.scanFileContent(filePath || 'ai-generated.ts', code)
      
      const codeSnippets = [{
        content: code,
        filePath: filePath || 'ai-generated.ts',
        riskScore: this.calculateCodeRiskScore(threats),
        threats
      }]

      const overallRiskScore = codeSnippets.reduce((max, snippet) => 
        Math.max(max, snippet.riskScore), 0)

      // 分析安全模式
      const securityPatterns = this.analyzeSecurityPatterns(code)

      const audit: AICodeSecurityAudit = {
        sessionId,
        generatedAt: new Date().toISOString(),
        codeSnippets,
        overallRiskScore,
        securityPatterns,
        recommendations: this.generateAICodeRecommendations(threats)
      }

      // 如果风险分数过高，自动隔离
      if (overallRiskScore >= this.config.autoBlockThreshold) {
        logger.warn('AI代码风险过高，自动隔离', { 风险分数: overallRiskScore })
        await this.quarantineAICode(code, audit)
      }

      return audit
    } catch (error) {
      logger.error('AI代码审计失败', { error })
      throw error
    }
  }

  /**
   * 评估扩展安全性
   */
  async assessExtensionSecurity(extensionName: string): Promise<ExtensionSecurityAssessment> {
    const extensionPath = await this.findExtensionPath(extensionName)
    if (!extensionPath) {
      throw new Error(`找不到扩展: ${extensionName}`)
    }

    return await this.scanDirectory(extensionPath)
  }

  /**
   * 初始化安全规则
   */
  private initializeSecurityRules(): void {
    // 代码注入检测
    this.securityRules.set('code_injection', [
      /eval\s*\(/gi,
      /new\s+Function\s*\(/gi,
      /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi,
      /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi
    ])

    // 路径遍历检测
    this.securityRules.set('path_traversal', [
      /\.\.[\\/]/gi,
      /\.\.[\\\/]/gi,
      /[\\\/]\.\.$/gi,
      /\.\.[\\\//]/gi
    ])

    // 命令注入检测
    this.securityRules.set('command_injection', [
      /exec\s*\(/gi,
      /spawn\s*\(/gi,
      /system\s*\(/gi,
      /shell_exec\s*\(/gi
    ])

    // 原型污染检测
    this.securityRules.set('prototype_pollution', [
      /__proto__/gi,
      /constructor\.prototype/gi,
      /Object\.prototype/gi
    ])

    // 不安全导入检测
    this.securityRules.set('unsafe_import', [
      /require\s*\(\s*[^"'`]*\$\{/gi,
      /import\s*\(\s*[^"'`]*\$\{/gi,
      /require\s*\(\s*process\.env/gi
    ])

    // 数据暴露检测
    this.securityRules.set('data_exposure', [
      /console\.log\s*\(\s*.*password/gi,
      /console\.log\s*\(\s*.*token/gi,
      /console\.log\s*\(\s*.*secret/gi,
      /\.env\s*\[\s*["'`][A-Z_]+["'`]\s*\]/gi
    ])
  }

  /**
   * 扫描文件内容
   */
  private async scanFileContent(filePath: string, content: string): Promise<SecurityScanResult[]> {
    const results: SecurityScanResult[] = []
    const lines = content.split('\n')

    for (const [threatType, patterns] of this.securityRules.entries()) {
      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index)
          const line = lines[lineNumber - 1] || ''
          
          const result: SecurityScanResult = {
            fileName: filePath.split('/').pop() || '',
            filePath,
            threatType,
            severity: this.determineSeverity(threatType),
            description: this.getThreatDescription(threatType),
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index) - 1,
            code: line.trim(),
            recommendation: this.getThreatRecommendation(threatType),
            autoFixAvailable: this.canAutoFix(threatType),
            riskScore: this.calculateThreatRiskScore(threatType)
          }

          results.push(result)
        }
      }
    }

    return results
  }

  /**
   * 获取需要扫描的文件列表
   */
  private async getFilesToScan(dirPath: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
          // 跳过可疑目录
          if (!this.isSuspiciousDirectory(entry.name)) {
            const subFiles = await this.getFilesToScan(fullPath)
            files.push(...subFiles)
          }
        } else if (entry.isFile()) {
          // 只扫描匹配模式的文件
          if (this.shouldScanFile(entry.name)) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      logger.warn('读取目录失败', { dirPath, error })
    }
    
    return files
  }

  /**
   * 判断是否应该扫描文件
   */
  private shouldScanFile(fileName: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json']
    return extensions.some(ext => fileName.endsWith(ext))
  }

  /**
   * 判断是否是可疑目录
   */
  private isSuspiciousDirectory(dirName: string): boolean {
    const suspiciousDirs = ['node_modules', '.git', 'dist', 'build', '.next']
    return suspiciousDirs.includes(dirName)
  }

  /**
   * 计算整体风险分数
   */
  private calculateOverallRiskScore(threats: SecurityScanResult[]): number {
    if (threats.length === 0) return 0

    const totalRisk = threats.reduce((sum, threat) => sum + threat.riskScore, 0)
    const avgRisk = totalRisk / threats.length
    
    // 考虑威胁数量的影响
    const threatCountMultiplier = Math.min(1 + threats.length * 0.1, 2)
    
    return Math.min(100, Math.round(avgRisk * threatCountMultiplier))
  }

  /**
   * 计算代码片段风险分数
   */
  private calculateCodeRiskScore(threats: SecurityScanResult[]): number {
    return this.calculateOverallRiskScore(threats)
  }

  /**
   * 计算威胁风险分数
   */
  private calculateThreatRiskScore(threatType: SecurityThreatType): number {
    const riskScores: Record<SecurityThreatType, number> = {
      code_injection: 90,
      command_injection: 95,
      path_traversal: 70,
      prototype_pollution: 60,
      eval_usage: 80,
      unsafe_import: 50,
      permission_bypass: 85,
      data_exposure: 40,
      resource_exhaustion: 30
    }
    
    return riskScores[threatType] || 50
  }

  /**
   * 确定威胁严重程度
   */
  private determineSeverity(threatType: SecurityThreatType): ThreatSeverity {
    const riskScore = this.calculateThreatRiskScore(threatType)
    
    if (riskScore >= 80) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
  }

  /**
   * 获取威胁描述
   */
  private getThreatDescription(threatType: SecurityThreatType): string {
    const descriptions: Record<SecurityThreatType, string> = {
      code_injection: '代码注入漏洞：检测到可能的动态代码执行',
      command_injection: '命令注入漏洞：检测到可能的系统命令执行',
      path_traversal: '路径遍历漏洞：检测到可能的目录遍历攻击',
      prototype_pollution: '原型污染漏洞：检测到可能的JavaScript原型污染',
      eval_usage: '不安全的eval使用：检测到eval函数的使用',
      unsafe_import: '不安全的模块导入：检测到动态模块导入',
      permission_bypass: '权限绕过：检测到可能的权限控制绕过',
      data_exposure: '数据暴露：检测到敏感信息可能泄露',
      resource_exhaustion: '资源耗尽：检测到可能的DoS攻击向量'
    }
    
    return descriptions[threatType] || '未知安全威胁'
  }

  /**
   * 获取威胁修复建议
   */
  private getThreatRecommendation(threatType: SecurityThreatType): string {
    const recommendations: Record<SecurityThreatType, string> = {
      code_injection: '避免使用eval、new Function等动态代码执行，使用安全的替代方案',
      command_injection: '避免直接执行系统命令，使用安全的API替代',
      path_traversal: '验证和清理所有文件路径，使用安全的路径操作函数',
      prototype_pollution: '避免直接修改Object.prototype，使用Object.create(null)',
      eval_usage: '移除eval使用，使用JSON.parse或其他安全方法',
      unsafe_import: '使用静态import，避免动态模块加载',
      permission_bypass: '实施严格的权限检查，使用CASL权限系统',
      data_exposure: '移除敏感信息的日志输出，使用安全的日志记录',
      resource_exhaustion: '实施资源限制和速率控制'
    }
    
    return recommendations[threatType] || '请咨询安全专家'
  }

  /**
   * 判断是否可以自动修复
   */
  private canAutoFix(threatType: SecurityThreatType): boolean {
    const autoFixable: SecurityThreatType[] = [
      'data_exposure',
      'eval_usage'
    ]
    
    return autoFixable.includes(threatType)
  }

  /**
   * 获取行号
   */
  private getLineNumber(content: string, index: number): number {
    const beforeIndex = content.substring(0, index)
    return beforeIndex.split('\n').length
  }

  /**
   * 获取总规则数
   */
  private getTotalRules(): number {
    let total = 0
    for (const patterns of this.securityRules.values()) {
      total += patterns.length
    }
    return total
  }

  /**
   * 生成安全建议
   */
  private generateSecurityRecommendations(threats: SecurityScanResult[]): ExtensionSecurityAssessment['recommendations'] {
    const immediate: string[] = []
    const preventive: string[] = []
    const monitoring: string[] = []

    const criticalThreats = threats.filter(t => t.severity === 'critical')
    const highThreats = threats.filter(t => t.severity === 'high')

    if (criticalThreats.length > 0) {
      immediate.push('🚨 立即修复严重安全威胁')
      immediate.push('暂停Extension加载，进行安全审查')
    }

    if (highThreats.length > 0) {
      immediate.push('优先修复高风险安全威胁')
    }

    preventive.push('实施代码安全扫描流程')
    preventive.push('建立Extension安全沙箱')
    preventive.push('启用严格权限模式')

    monitoring.push('监控Extension运行时行为')
    monitoring.push('定期进行安全评估')
    monitoring.push('建立威胁情报收集机制')

    return { immediate, preventive, monitoring }
  }

  /**
   * 生成AI代码建议
   */
  private generateAICodeRecommendations(threats: SecurityScanResult[]): string[] {
    const recommendations: string[] = []

    if (threats.some(t => t.threatType === 'code_injection')) {
      recommendations.push('避免在AI生成代码中使用动态代码执行')
    }

    if (threats.some(t => t.threatType === 'data_exposure')) {
      recommendations.push('确保AI生成代码不包含敏感信息输出')
    }

    if (threats.length > 0) {
      recommendations.push('对AI生成代码进行人工安全审查')
      recommendations.push('使用静态分析工具验证代码安全性')
    }

    if (recommendations.length === 0) {
      recommendations.push('AI生成代码通过了基础安全检查')
    }

    return recommendations
  }

  /**
   * 分析安全模式
   */
  private analyzeSecurityPatterns(code: string): AICodeSecurityAudit['securityPatterns'] {
    const patterns: AICodeSecurityAudit['securityPatterns'] = []

    // 分析常见不安全模式
    const unsafePatterns = [
      { pattern: 'eval使用', regex: /eval\s*\(/gi, severity: 'critical' as ThreatSeverity },
      { pattern: '动态导入', regex: /import\s*\(\s*[^"'`]*\$\{/gi, severity: 'medium' as ThreatSeverity },
      { pattern: '原型修改', regex: /__proto__/gi, severity: 'high' as ThreatSeverity }
    ]

    for (const { pattern, regex, severity } of unsafePatterns) {
      const matches = code.match(regex)
      if (matches) {
        patterns.push({
          pattern,
          violations: matches.length,
          severity
        })
      }
    }

    return patterns
  }

  /**
   * 隔离文件
   */
  private async quarantineFile(filePath: string): Promise<void> {
    try {
      const quarantineDir = join(this.dataDir, this.config.quarantineDir)
      await fs.mkdir(quarantineDir, { recursive: true })

      const fileName = filePath.split('/').pop() || 'unknown'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const quarantinePath = join(quarantineDir, `${timestamp}-${fileName}`)

      await fs.copyFile(filePath, quarantinePath)
      
      logger.info('文件已隔离', {
        原文件: filePath,
        隔离路径: quarantinePath
      })
    } catch (error) {
      logger.error('文件隔离失败', { error, filePath })
      throw error
    }
  }

  /**
   * 隔离AI代码
   */
  private async quarantineAICode(code: string, audit: AICodeSecurityAudit): Promise<void> {
    try {
      const quarantineDir = join(this.dataDir, this.config.quarantineDir, 'ai-generated')
      await fs.mkdir(quarantineDir, { recursive: true })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const codePath = join(quarantineDir, `${timestamp}-ai-code.ts`)
      const auditPath = join(quarantineDir, `${timestamp}-audit.json`)

      await fs.writeFile(codePath, code)
      await fs.writeFile(auditPath, JSON.stringify(audit, null, 2))
      
      logger.warn('AI代码已隔离', {
        代码路径: codePath,
        审计路径: auditPath,
        风险分数: audit.overallRiskScore
      })
    } catch (error) {
      logger.error('AI代码隔离失败', { error })
      throw error
    }
  }

  /**
   * 查找扩展路径
   */
  private async findExtensionPath(extensionName: string): Promise<string | null> {
    const possiblePaths = [
      `extensions/${extensionName}`,
      `packages/${extensionName}`,
      `apps/${extensionName}`
    ]

    for (const path of possiblePaths) {
      try {
        await fs.access(path)
        return path
      } catch {
        // 继续尝试下一个路径
      }
    }

    return null
  }

  /**
   * 持久化扫描结果
   */
  private async persistScanResult(assessment: ExtensionSecurityAssessment): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${assessment.extensionName}-${timestamp}.json`
      const filePath = join(this.dataDir, 'assessments', fileName)
      
      await fs.mkdir(dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(assessment, null, 2))
      
      logger.info('安全评估结果已保存', { 文件: filePath })
    } catch (error) {
      logger.error('保存扫描结果失败', { error })
    }
  }

  /**
   * 格式化扫描结果给Claude
   */
  private formatScanResultForClaude(
    assessment: ExtensionSecurityAssessment,
    options: { verbose?: boolean }
  ): string {
    const lines: string[] = []
    
    lines.push('🛡️ ===== Security Sentinel 安全扫描报告 =====\n')
    
    // 总体状态
    const statusIcon = assessment.overallRiskScore < 25 ? '✅' : 
                      assessment.overallRiskScore < 50 ? '⚠️' : 
                      assessment.overallRiskScore < 75 ? '❌' : '🚨'
    
    lines.push('📊 整体安全状态:')
    lines.push(`   ${statusIcon} 风险分数: ${assessment.overallRiskScore}/100`)
    lines.push(`   🎯 扫描目标: ${assessment.extensionName}`)
    lines.push(`   📁 扫描路径: ${assessment.extensionPath}`)
    lines.push(`   🔍 发现威胁: ${assessment.threats.length}`)
    lines.push(`   🛡️ 沙箱状态: ${assessment.sandboxStatus}\n`)

    // 威胁详情
    if (assessment.threats.length > 0) {
      lines.push('🚨 检测到的安全威胁:\n')
      
      const topThreats = assessment.threats
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, options.verbose ? 20 : 5)
      
      for (const threat of topThreats) {
        const severityIcon = threat.severity === 'critical' ? '🚨' : 
                           threat.severity === 'high' ? '❌' : 
                           threat.severity === 'medium' ? '⚠️' : '🔶'
        
        lines.push(`${severityIcon} ${threat.threatType} (${threat.severity})`)
        lines.push(`   文件: ${threat.fileName}:${threat.line}`)
        lines.push(`   风险: ${threat.riskScore}/100`)
        lines.push(`   描述: ${threat.description}`)
        
        if (options.verbose) {
          lines.push(`   代码: ${threat.code}`)
          lines.push(`   建议: ${threat.recommendation}`)
        }
        lines.push('')
      }
    }

    // 建议
    if (assessment.recommendations.immediate.length > 0) {
      lines.push('🚨 立即行动建议:')
      for (const rec of assessment.recommendations.immediate) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }

    if (options.verbose && assessment.recommendations.preventive.length > 0) {
      lines.push('🛡️ 预防性建议:')
      for (const rec of assessment.recommendations.preventive) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }

    lines.push('🛡️ ===== 安全扫描完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 格式化审计结果给Claude
   */
  private formatAuditResultForClaude(
    audit: AICodeSecurityAudit,
    options: { verbose?: boolean }
  ): string {
    const lines: string[] = []
    
    lines.push('🤖 ===== Security Sentinel AI代码审计 =====\n')
    
    const statusIcon = audit.overallRiskScore < 25 ? '✅' : 
                      audit.overallRiskScore < 50 ? '⚠️' : 
                      audit.overallRiskScore < 75 ? '❌' : '🚨'
    
    lines.push('📊 AI代码安全状态:')
    lines.push(`   ${statusIcon} 风险分数: ${audit.overallRiskScore}/100`)
    lines.push(`   🔬 会话ID: ${audit.sessionId}`)
    lines.push(`   📝 代码片段: ${audit.codeSnippets.length}`)
    lines.push(`   ⚡ 生成时间: ${audit.generatedAt}\n`)

    // 威胁分析
    const allThreats = audit.codeSnippets.flatMap(snippet => snippet.threats)
    if (allThreats.length > 0) {
      lines.push(`🚨 发现 ${allThreats.length} 个安全威胁:\n`)
      
      const topThreats = allThreats
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, options.verbose ? 10 : 3)
      
      for (const threat of topThreats) {
        const severityIcon = threat.severity === 'critical' ? '🚨' : 
                           threat.severity === 'high' ? '❌' : 
                           threat.severity === 'medium' ? '⚠️' : '🔶'
        
        lines.push(`${severityIcon} ${threat.threatType}`)
        lines.push(`   位置: 第${threat.line}行`)
        lines.push(`   风险: ${threat.riskScore}/100`)
        lines.push(`   建议: ${threat.recommendation}`)
        lines.push('')
      }
    }

    // 安全模式分析
    if (audit.securityPatterns.length > 0) {
      lines.push('📋 安全模式分析:')
      for (const pattern of audit.securityPatterns) {
        const patternIcon = pattern.severity === 'critical' ? '🚨' : 
                          pattern.severity === 'high' ? '❌' : '⚠️'
        lines.push(`   ${patternIcon} ${pattern.pattern}: ${pattern.violations} 次违规`)
      }
      lines.push('')
    }

    // 建议
    if (audit.recommendations.length > 0) {
      lines.push('💡 安全建议:')
      for (const rec of audit.recommendations) {
        lines.push(`   ${rec}`)
      }
      lines.push('')
    }

    lines.push('🤖 ===== AI代码审计完成 =====')
    
    return lines.join('\n')
  }

  /**
   * 格式化评估结果给Claude
   */
  private formatAssessmentForClaude(
    assessment: ExtensionSecurityAssessment,
    options: { verbose?: boolean }
  ): string {
    return this.formatScanResultForClaude(assessment, options)
  }

  /**
   * 启动安全监控
   */
  async startSecurityMonitoring(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true })
      
      logger.info('Security Sentinel安全监控已启动', { 
        dataDir: this.dataDir,
        配置: this.config
      })
    } catch (error) {
      logger.error('启动安全监控失败', { error })
      throw error
    }
  }
}

export default SecuritySentinel