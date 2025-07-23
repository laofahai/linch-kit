#!/usr/bin/env bun

/**
 * LinchKit API兼容性检查工具
 * 根据Essential_Rules.md中的标准自动判断是否需要保持API兼容性
 */

import { parseArgs } from 'util'
import { readFile, access } from 'fs/promises'
import { join, dirname } from 'path'
import { $ } from 'bun'

interface CompatibilityResult {
  strategy: 'modify_existing' | 'create_compatible' | 'need_confirmation'
  reasons: string[]
  packageInfo?: {
    name: string
    version: string
    published: boolean
  }
  codeAnalysis?: {
    hasTodo: boolean
    hasStableMarkers: boolean
    isPlaceholder: boolean
    isPrivateMethod: boolean
  }
  externalUsage?: {
    hasReferences: boolean
    referenceCount: number
    referencedBy: string[]
  }
}

class CompatibilityChecker {
  private log = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    warn: (msg: string) => console.log(`[WARN] ${msg}`),
    error: (msg: string) => console.log(`[ERROR] ${msg}`),
    header: (msg: string) => console.log(`\n🔍 ${msg}`),
    success: (msg: string) => console.log(`✅ ${msg}`),
    fail: (msg: string) => console.log(`❌ ${msg}`),
  }

  async checkCompatibility(filePath: string, apiName: string): Promise<CompatibilityResult> {
    this.log.header(`检查API兼容性: ${apiName} in ${filePath}`)

    const result: CompatibilityResult = {
      strategy: 'need_confirmation',
      reasons: [],
    }

    try {
      // 1. 分析包信息
      result.packageInfo = await this.analyzePackageInfo(filePath)
      
      // 2. 分析代码
      result.codeAnalysis = await this.analyzeCode(filePath, apiName)
      
      // 3. 检查外部使用情况 (如果Graph RAG可用)
      result.externalUsage = await this.checkExternalUsage(apiName)
      
      // 4. 应用决策规则
      result.strategy = this.applyDecisionRules(result)
      
      // 5. 输出结果
      this.outputResult(result)
      
      return result

    } catch (error) {
      this.log.error(`兼容性检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.reasons.push(`检查过程出错: ${error}`)
      return result
    }
  }

  private async analyzePackageInfo(filePath: string): Promise<CompatibilityResult['packageInfo']> {
    try {
      // 查找最近的package.json
      let currentDir = dirname(filePath)
      let packageJsonPath = ''
      
      while (currentDir !== '/') {
        const potentialPath = join(currentDir, 'package.json')
        try {
          await access(potentialPath)
          packageJsonPath = potentialPath
          break
        } catch {
          currentDir = dirname(currentDir)
        }
      }

      if (!packageJsonPath) {
        return { name: 'unknown', version: '0.0.0', published: false }
      }

      const packageContent = await readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageContent)
      
      // 检查是否已发布
      let published = false
      try {
        const npmResult = await $`npm view ${packageJson.name} version`.quiet()
        published = !!npmResult.stdout.toString().trim()
      } catch {
        published = false
      }

      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0',
        published,
      }

    } catch (error) {
      this.log.warn(`无法分析包信息: ${error}`)
      return { name: 'unknown', version: '0.0.0', published: false }
    }
  }

  private async analyzeCode(filePath: string, apiName: string): Promise<CompatibilityResult['codeAnalysis']> {
    try {
      const fileContent = await readFile(filePath, 'utf-8')
      
      // 检查代码标记
      const hasTodo = this.checkCodeMarkers(fileContent, apiName, ['TODO', '@internal', '@experimental'])
      const hasStableMarkers = this.checkCodeMarkers(fileContent, apiName, ['@stable', '@public', '@api'])
      
      // 检查是否是占位符实现
      const isPlaceholder = this.checkPlaceholderImplementation(fileContent, apiName)
      
      // 检查是否是私有方法
      const isPrivateMethod = this.checkPrivateMethod(fileContent, apiName)

      return {
        hasTodo,
        hasStableMarkers,
        isPlaceholder,
        isPrivateMethod,
      }

    } catch (error) {
      this.log.warn(`无法分析代码: ${error}`)
      return {
        hasTodo: false,
        hasStableMarkers: false,
        isPlaceholder: false,
        isPrivateMethod: false,
      }
    }
  }

  private checkCodeMarkers(content: string, apiName: string, markers: string[]): boolean {
    // 查找API定义及其附近的注释
    const apiRegex = new RegExp(`(class|function|async function|const|let)\\s+${apiName}`, 'g')
    const matches = [...content.matchAll(apiRegex)]
    
    for (const match of matches) {
      const startIndex = Math.max(0, match.index! - 500) // 检查前面500个字符
      const endIndex = Math.min(content.length, match.index! + 500) // 检查后面500个字符
      const contextContent = content.slice(startIndex, endIndex)
      
      for (const marker of markers) {
        if (contextContent.includes(marker)) {
          return true
        }
      }
    }
    
    return false
  }

  private checkPlaceholderImplementation(content: string, apiName: string): boolean {
    // 查找方法实现
    const patterns = [
      new RegExp(`${apiName}[^{]*{[^}]*return\\s+\\[\\]`, 'g'),
      new RegExp(`${apiName}[^{]*{[^}]*return\\s+\\{\\}`, 'g'),
      new RegExp(`${apiName}[^{]*{[^}]*return\\s+null`, 'g'),
      new RegExp(`${apiName}[^{]*{[^}]*throw\\s+new\\s+Error\\s*\\(\\s*['"](Not implemented|TODO)['"]*\\s*\\)`, 'g'),
      new RegExp(`${apiName}[^{]*{[^}]*\\/\\/\\s*TODO`, 'g'),
    ]
    
    return patterns.some(pattern => pattern.test(content))
  }

  private checkPrivateMethod(content: string, apiName: string): boolean {
    // 检查是否是私有方法 (private 关键字或 _ 前缀)
    const privatePatterns = [
      new RegExp(`private\\s+.*${apiName}`, 'g'),
      new RegExp(`private\\s+async\\s+${apiName}`, 'g'),
    ]
    
    return privatePatterns.some(pattern => pattern.test(content)) || apiName.startsWith('_')
  }

  private async checkExternalUsage(apiName: string): Promise<CompatibilityResult['externalUsage']> {
    try {
      // 尝试使用Graph RAG查询外部引用
      const result = await $`bun run ai:session symbol "${apiName}"`.quiet()
      const output = result.stdout.toString()
      
      // 解析Graph RAG结果 (这里需要根据实际输出格式调整)
      const hasReferences = output.includes('found') && !output.includes('0 results')
      const referenceCount = (output.match(/found/g) || []).length
      const referencedBy: string[] = [] // 从输出中提取引用文件列表
      
      return {
        hasReferences,
        referenceCount,
        referencedBy,
      }

    } catch (error) {
      this.log.warn(`无法检查外部使用情况: ${error}`)
      return {
        hasReferences: false,
        referenceCount: 0,
        referencedBy: [],
      }
    }
  }

  private applyDecisionRules(result: CompatibilityResult): CompatibilityResult['strategy'] {
    const reasons: string[] = []

    // 规则1: 可以直接修改的情况
    if (result.codeAnalysis?.hasTodo) {
      reasons.push('✅ 代码标记为TODO/internal/experimental')
    }
    
    if (result.codeAnalysis?.isPlaceholder) {
      reasons.push('✅ 检测到占位符实现')
    }
    
    if (result.codeAnalysis?.isPrivateMethod) {
      reasons.push('✅ 私有方法，可以直接修改')
    }
    
    if (result.packageInfo?.version && result.packageInfo.version.startsWith('0.')) {
      reasons.push('✅ 预发布版本 (< 1.0.0)')
    }
    
    if (!result.externalUsage?.hasReferences) {
      reasons.push('✅ 无外部引用')
    }

    // 规则2: 必须保持兼容性的情况
    if (result.packageInfo?.published && 
        result.packageInfo.version && 
        !result.packageInfo.version.startsWith('0.')) {
      reasons.push('🔴 已发布稳定版本 (>= 1.0.0)')
    }
    
    if (result.codeAnalysis?.hasStableMarkers) {
      reasons.push('🔴 包含稳定API标记')
    }
    
    if (result.externalUsage?.hasReferences) {
      reasons.push('🔴 有外部引用')
    }

    result.reasons = reasons

    // 决策逻辑
    const canModifyReasons = result.reasons.filter(r => r.startsWith('✅')).length
    const mustKeepCompatibleReasons = result.reasons.filter(r => r.startsWith('🔴')).length

    if (canModifyReasons > 0 && mustKeepCompatibleReasons === 0) {
      return 'modify_existing'
    }
    
    if (mustKeepCompatibleReasons > 0) {
      return 'create_compatible'
    }
    
    return 'need_confirmation'
  }

  private outputResult(result: CompatibilityResult): void {
    this.log.header('兼容性检查结果')
    
    console.log(`📦 包信息:`)
    console.log(`  名称: ${result.packageInfo?.name}`)
    console.log(`  版本: ${result.packageInfo?.version}`)
    console.log(`  已发布: ${result.packageInfo?.published ? '是' : '否'}`)
    
    console.log(`\n📄 代码分析:`)
    console.log(`  TODO标记: ${result.codeAnalysis?.hasTodo ? '是' : '否'}`)
    console.log(`  稳定标记: ${result.codeAnalysis?.hasStableMarkers ? '是' : '否'}`)
    console.log(`  占位符: ${result.codeAnalysis?.isPlaceholder ? '是' : '否'}`)
    console.log(`  私有方法: ${result.codeAnalysis?.isPrivateMethod ? '是' : '否'}`)
    
    console.log(`\n🔗 外部引用:`)
    console.log(`  有引用: ${result.externalUsage?.hasReferences ? '是' : '否'}`)
    console.log(`  引用数量: ${result.externalUsage?.referenceCount}`)
    
    console.log(`\n📋 决策理由:`)
    result.reasons.forEach(reason => console.log(`  ${reason}`))
    
    console.log(`\n🎯 推荐策略: ${this.getStrategyDescription(result.strategy)}`)
    
    // 设置退出码以便脚本判断
    if (result.strategy === 'modify_existing') {
      process.env.COMPATIBILITY_REQUIRED = 'false'
    } else if (result.strategy === 'create_compatible') {
      process.env.COMPATIBILITY_REQUIRED = 'true'
    } else {
      process.env.COMPATIBILITY_REQUIRED = 'confirm'
    }
  }

  private getStrategyDescription(strategy: CompatibilityResult['strategy']): string {
    switch (strategy) {
      case 'modify_existing':
        return '🟡 可以直接修改/补全现有实现'
      case 'create_compatible':
        return '🔴 必须创建新版本/扩展，保持兼容性'
      case 'need_confirmation':
        return '🔵 需要人工确认决策'
      default:
        return '❓ 未知策略'
    }
  }
}

// 主执行逻辑
async function main() {
  const args = parseArgs({
    args: process.argv.slice(2),
    options: {
      file: { type: 'string', short: 'f' },
      api: { type: 'string', short: 'a' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (args.values.help || !args.values.file || !args.values.api) {
    console.log(`
用法: bun run ai:compatibility-check --file="文件路径" --api="API名称"

选项:
  -f, --file    要检查的文件路径
  -a, --api     要检查的API名称
  -h, --help    显示帮助信息

示例:
  bun run ai:compatibility-check --file="packages/auth/src/permissions/enhanced-permission-engine.ts" --api="EnhancedPermissionEngine"
`)
    process.exit(0)
  }

  const checker = new CompatibilityChecker()
  const result = await checker.checkCompatibility(
    args.values.file as string,
    args.values.api as string
  )

  // 输出JSON结果供其他工具使用
  if (process.env.OUTPUT_JSON === 'true') {
    console.log('\n' + JSON.stringify(result, null, 2))
  }
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的异常:', error)
  process.exit(1)
})

if (import.meta.main) {
  main()
}