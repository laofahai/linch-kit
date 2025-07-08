/**
 * linch doctor 命令
 *
 * 开发环境诊断工具 - Gemini建议的增强命令
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { join as _join } from 'path'

import { Logger } from '../../logger-client'
import { type CLIManager, type CLICommand } from '../index'

const doctorCommand: CLICommand = {
  name: 'doctor',
  description: '诊断开发环境和项目配置问题',
  category: 'system',
  options: [
    {
      name: 'fix',
      description: '自动修复发现的问题',
      type: 'boolean',
    },
    {
      name: 'verbose',
      alias: '-v',
      description: '显示详细诊断信息',
      type: 'boolean',
    },
    {
      name: 'category',
      alias: '-c',
      description: '仅检查特定分类 (env|deps|config|db|build)',
      type: 'string',
    },
    {
      name: 'output',
      alias: '-o',
      description: '输出格式 (console|json|md)',
      defaultValue: 'console',
    },
  ],
  handler: async ({ options }) => {
    try {
      const { fix, verbose, category, output } = options as {
        fix?: boolean
        verbose?: boolean
        category?: string
        output: string
      }

      console.log('===========================================')
      console.log('🩺 LinchKit 环境诊断工具')
      console.log('===========================================\n')

      const diagnostics = await runDiagnostics(category, verbose)

      // 显示诊断结果
      if (output === 'json') {
        console.log(JSON.stringify(diagnostics, null, 2))
      } else if (output === 'md') {
        showMarkdownReport(diagnostics)
      } else {
        showConsoleReport(diagnostics, verbose)
      }

      // 自动修复
      if (fix) {
        console.log('\n🔧 开始自动修复...')
        const fixResults = await autoFix(diagnostics)
        console.log(
          `修复完成: ${fixResults.fixed} 个问题已修复, ${fixResults.failed} 个问题需要手动处理`
        )
      }

      const hasErrors = diagnostics.some(d => d.issues.some(i => i.level === 'error'))
      return {
        success: !hasErrors,
        diagnostics,
        summary: generateSummary(diagnostics),
      }
    } catch (error) {
      Logger.error('Doctor check failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

interface DiagnosticIssue {
  level: 'info' | 'warning' | 'error'
  message: string
  suggestion?: string
  fixable?: boolean
  command?: string
}

interface DiagnosticCategory {
  name: string
  status: 'healthy' | 'warning' | 'error'
  issues: DiagnosticIssue[]
}

async function runDiagnostics(category?: string, verbose?: boolean): Promise<DiagnosticCategory[]> {
  const diagnostics: DiagnosticCategory[] = []

  const categories = category ? [category] : ['env', 'deps', 'config', 'db', 'build']

  for (const cat of categories) {
    switch (cat) {
      case 'env':
        diagnostics.push(await checkEnvironment(verbose))
        break
      case 'deps':
        diagnostics.push(await checkDependencies(verbose))
        break
      case 'config':
        diagnostics.push(await checkConfiguration(verbose))
        break
      case 'db':
        diagnostics.push(await checkDatabase(verbose))
        break
      case 'build':
        diagnostics.push(await checkBuild(verbose))
        break
    }
  }

  return diagnostics
}

async function checkEnvironment(verbose?: boolean): Promise<DiagnosticCategory> {
  const issues: DiagnosticIssue[] = []

  // Node.js版本检查
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])

  if (majorVersion < 18) {
    issues.push({
      level: 'error',
      message: `Node.js版本过低: ${nodeVersion}`,
      suggestion: '建议升级到Node.js 18+',
      fixable: false,
    })
  } else if (majorVersion < 20) {
    issues.push({
      level: 'warning',
      message: `Node.js版本偏低: ${nodeVersion}`,
      suggestion: '建议升级到Node.js 20+以获得更好的性能',
    })
  } else if (verbose) {
    issues.push({
      level: 'info',
      message: `Node.js版本: ${nodeVersion} ✓`,
    })
  }

  // pnpm检查
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim()
    if (verbose) {
      issues.push({
        level: 'info',
        message: `pnpm版本: ${pnpmVersion} ✓`,
      })
    }
  } catch {
    issues.push({
      level: 'error',
      message: 'pnpm未安装',
      suggestion: '运行 npm install -g pnpm 安装pnpm',
      fixable: true,
      command: 'npm install -g pnpm',
    })
  }

  // 环境变量检查
  const envFiles = ['.env', '.env.local', '.env.development']
  const missingEnvFiles = envFiles.filter(file => !existsSync(file))

  if (missingEnvFiles.length === envFiles.length) {
    issues.push({
      level: 'warning',
      message: '未找到环境变量文件',
      suggestion: '运行 linch init 创建环境配置',
      fixable: true,
      command: 'linch init --skip-deps --skip-db',
    })
  }

  // 内存检查
  const totalMemory = require('os').totalmem()
  const memoryGB = Math.round(totalMemory / 1024 / 1024 / 1024)

  if (memoryGB < 4) {
    issues.push({
      level: 'warning',
      message: `系统内存较低: ${memoryGB}GB`,
      suggestion: '建议至少8GB内存以获得更好的开发体验',
    })
  } else if (verbose) {
    issues.push({
      level: 'info',
      message: `系统内存: ${memoryGB}GB ✓`,
    })
  }

  return {
    name: '环境检查',
    status: issues.some(i => i.level === 'error')
      ? 'error'
      : issues.some(i => i.level === 'warning')
        ? 'warning'
        : 'healthy',
    issues,
  }
}

async function checkDependencies(verbose?: boolean): Promise<DiagnosticCategory> {
  const issues: DiagnosticIssue[] = []

  if (!existsSync('package.json')) {
    issues.push({
      level: 'error',
      message: '未找到package.json文件',
      suggestion: '确保在项目根目录运行命令',
    })
    return { name: '依赖检查', status: 'error', issues }
  }

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  // LinchKit包检查
  const linchKitPackages = Object.keys(deps).filter(dep => dep.startsWith('@linch-kit/'))

  if (linchKitPackages.length === 0) {
    issues.push({
      level: 'error',
      message: '未找到LinchKit依赖',
      suggestion: '运行 pnpm add @linch-kit/core 安装LinchKit',
    })
  } else if (verbose) {
    issues.push({
      level: 'info',
      message: `LinchKit包: ${linchKitPackages.length} 个 ✓`,
    })
  }

  // 版本一致性检查
  const linchKitVersions = linchKitPackages.map(pkg => deps[pkg])
  const uniqueVersions = [...new Set(linchKitVersions)]

  if (uniqueVersions.length > 1) {
    issues.push({
      level: 'warning',
      message: 'LinchKit包版本不一致',
      suggestion: '运行 linch upgrade 统一版本',
      fixable: true,
      command: 'linch upgrade',
    })
  }

  // node_modules检查
  if (!existsSync('node_modules')) {
    issues.push({
      level: 'error',
      message: '依赖未安装',
      suggestion: '运行 pnpm install 安装依赖',
      fixable: true,
      command: 'pnpm install',
    })
  } else {
    try {
      const stats = statSync('node_modules')
      const ageMinutes = (Date.now() - stats.mtime.getTime()) / 1000 / 60

      if (ageMinutes > 60 * 24) {
        // 超过24小时
        issues.push({
          level: 'info',
          message: '依赖安装时间较久，建议重新安装',
          suggestion: '运行 pnpm install 更新依赖',
        })
      }
    } catch {
      // 忽略stat错误
    }
  }

  // 锁文件检查
  if (!existsSync('pnpm-lock.yaml')) {
    issues.push({
      level: 'warning',
      message: '未找到pnpm-lock.yaml',
      suggestion: '运行 pnpm install 生成锁文件',
    })
  }

  return {
    name: '依赖检查',
    status: issues.some(i => i.level === 'error')
      ? 'error'
      : issues.some(i => i.level === 'warning')
        ? 'warning'
        : 'healthy',
    issues,
  }
}

async function checkConfiguration(verbose?: boolean): Promise<DiagnosticCategory> {
  const issues: DiagnosticIssue[] = []

  // TypeScript配置
  if (existsSync('tsconfig.json')) {
    try {
      const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'))

      if (!tsconfig.compilerOptions?.strict) {
        issues.push({
          level: 'warning',
          message: 'TypeScript严格模式未启用',
          suggestion: '在tsconfig.json中启用strict模式',
        })
      }

      if (verbose) {
        issues.push({
          level: 'info',
          message: 'TypeScript配置: ✓',
        })
      }
    } catch {
      issues.push({
        level: 'error',
        message: 'tsconfig.json格式错误',
        suggestion: '检查JSON语法',
      })
    }
  } else {
    issues.push({
      level: 'warning',
      message: '未找到tsconfig.json',
      suggestion: '运行 tsc --init 创建TypeScript配置',
    })
  }

  // Next.js配置
  const nextConfigFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts']
  const hasNextConfig = nextConfigFiles.some(file => existsSync(file))

  if (!hasNextConfig) {
    issues.push({
      level: 'info',
      message: '未找到Next.js配置文件',
      suggestion: '如果使用Next.js，创建next.config.js',
    })
  } else if (verbose) {
    issues.push({
      level: 'info',
      message: 'Next.js配置: ✓',
    })
  }

  // Tailwind配置
  const tailwindConfigFiles = ['tailwind.config.js', 'tailwind.config.ts']
  const hasTailwindConfig = tailwindConfigFiles.some(file => existsSync(file))

  if (!hasTailwindConfig) {
    issues.push({
      level: 'info',
      message: '未找到Tailwind配置文件',
      suggestion: '如果使用Tailwind，运行 bunx tailwindcss init',
    })
  } else if (verbose) {
    issues.push({
      level: 'info',
      message: 'Tailwind配置: ✓',
    })
  }

  return {
    name: '配置检查',
    status: issues.some(i => i.level === 'error')
      ? 'error'
      : issues.some(i => i.level === 'warning')
        ? 'warning'
        : 'healthy',
    issues,
  }
}

async function checkDatabase(verbose?: boolean): Promise<DiagnosticCategory> {
  const issues: DiagnosticIssue[] = []

  // Prisma Schema检查
  if (existsSync('prisma/schema.prisma')) {
    if (verbose) {
      issues.push({
        level: 'info',
        message: 'Prisma Schema: ✓',
      })
    }

    // 检查生成的客户端
    if (!existsSync('node_modules/.prisma')) {
      issues.push({
        level: 'warning',
        message: 'Prisma客户端未生成',
        suggestion: '运行 pnpm prisma generate',
        fixable: true,
        command: 'pnpm prisma generate',
      })
    }
  } else {
    issues.push({
      level: 'info',
      message: '未找到Prisma Schema',
      suggestion: '如果使用数据库，运行 pnpm prisma init',
    })
  }

  // 环境变量检查
  const envFiles = ['.env', '.env.local']
  let hasDatabaseUrl = false

  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      const content = readFileSync(envFile, 'utf-8')
      if (content.includes('DATABASE_URL')) {
        hasDatabaseUrl = true
        break
      }
    }
  }

  if (!hasDatabaseUrl && existsSync('prisma/schema.prisma')) {
    issues.push({
      level: 'warning',
      message: '未配置DATABASE_URL环境变量',
      suggestion: '在.env文件中配置数据库连接字符串',
    })
  }

  return {
    name: '数据库检查',
    status: issues.some(i => i.level === 'error')
      ? 'error'
      : issues.some(i => i.level === 'warning')
        ? 'warning'
        : 'healthy',
    issues,
  }
}

async function checkBuild(verbose?: boolean): Promise<DiagnosticCategory> {
  const issues: DiagnosticIssue[] = []

  if (!existsSync('package.json')) {
    issues.push({
      level: 'error',
      message: '未找到package.json',
      suggestion: '确保在项目根目录运行命令',
    })
    return { name: '构建检查', status: 'error', issues }
  }

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
  const scripts = packageJson.scripts || {}

  // 检查关键脚本
  const requiredScripts = ['build', 'dev']
  const missingScripts = requiredScripts.filter(script => !scripts[script])

  if (missingScripts.length > 0) {
    issues.push({
      level: 'warning',
      message: `缺少构建脚本: ${missingScripts.join(', ')}`,
      suggestion: '在package.json中添加必要的脚本',
    })
  }

  // 检查构建输出
  const buildDirs = ['dist', 'build', '.next']
  const hasBuildOutput = buildDirs.some(dir => existsSync(dir))

  if (!hasBuildOutput) {
    issues.push({
      level: 'info',
      message: '未找到构建输出',
      suggestion: '运行 pnpm build 进行构建测试',
      fixable: true,
      command: 'pnpm build',
    })
  } else if (verbose) {
    issues.push({
      level: 'info',
      message: '构建输出: ✓',
    })
  }

  return {
    name: '构建检查',
    status: issues.some(i => i.level === 'error')
      ? 'error'
      : issues.some(i => i.level === 'warning')
        ? 'warning'
        : 'healthy',
    issues,
  }
}

function showConsoleReport(diagnostics: DiagnosticCategory[], verbose?: boolean) {
  diagnostics.forEach(category => {
    const statusIcon =
      category.status === 'healthy' ? '✅' : category.status === 'warning' ? '⚠️' : '❌'

    console.log(`\n${statusIcon} ${category.name}`)
    console.log('─'.repeat(40))

    if (category.issues.length === 0) {
      console.log('  所有检查项目正常 ✓')
      return
    }

    category.issues.forEach(issue => {
      const levelIcon = issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️'

      console.log(`  ${levelIcon} ${issue.message}`)

      if (issue.suggestion) {
        console.log(`     建议: ${issue.suggestion}`)
      }

      if (issue.command && verbose) {
        console.log(`     命令: ${issue.command}`)
      }
    })
  })
}

function showMarkdownReport(diagnostics: DiagnosticCategory[]) {
  console.log('# LinchKit 诊断报告\n')

  diagnostics.forEach(category => {
    const statusIcon =
      category.status === 'healthy' ? '✅' : category.status === 'warning' ? '⚠️' : '❌'

    console.log(`## ${statusIcon} ${category.name}\n`)

    if (category.issues.length === 0) {
      console.log('所有检查项目正常\n')
      return
    }

    category.issues.forEach(issue => {
      const levelIcon = issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️'

      console.log(`- ${levelIcon} **${issue.message}**`)

      if (issue.suggestion) {
        console.log(`  - 建议: ${issue.suggestion}`)
      }

      if (issue.command) {
        console.log(`  - 命令: \`${issue.command}\``)
      }
    })

    console.log('')
  })
}

async function autoFix(
  diagnostics: DiagnosticCategory[]
): Promise<{ fixed: number; failed: number }> {
  let fixed = 0
  let failed = 0

  for (const category of diagnostics) {
    for (const issue of category.issues) {
      if (issue.fixable && issue.command) {
        try {
          console.log(`修复: ${issue.message}`)
          execSync(issue.command, { stdio: 'pipe' })
          console.log(`✓ 已修复: ${issue.message}`)
          fixed++
        } catch {
          // 忽略修复错误
          console.log(`✗ 修复失败: ${issue.message}`)
          failed++
        }
      }
    }
  }

  return { fixed, failed }
}

function generateSummary(diagnostics: DiagnosticCategory[]): string {
  const total = diagnostics.length
  const healthy = diagnostics.filter(d => d.status === 'healthy').length
  const warnings = diagnostics.filter(d => d.status === 'warning').length
  const errors = diagnostics.filter(d => d.status === 'error').length

  return `总计 ${total} 项检查: ${healthy} 正常, ${warnings} 警告, ${errors} 错误`
}

export function registerDoctorCommand(cli: CLIManager) {
  cli.registerCommand(doctorCommand)
}
