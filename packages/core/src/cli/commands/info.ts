/**
 * linch info 命令
 *
 * 显示系统信息和项目状态
 */

import { existsSync, readFileSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

import { type CLIManager, type CLICommand } from '../index'
import { Logger } from '../../logger-client'

const infoCommand: CLICommand = {
  name: 'info',
  description: '显示系统信息和项目状态',
  category: 'core',
  options: [
    {
      name: 'system',
      alias: '-s',
      description: '显示系统环境信息',
      type: 'boolean',
    },
    {
      name: 'project',
      alias: '-p',
      description: '显示项目信息',
      type: 'boolean',
    },
    {
      name: 'packages',
      description: '显示LinchKit包版本',
      type: 'boolean',
    },
    {
      name: 'detailed',
      alias: '-d',
      description: '显示详细信息',
      type: 'boolean',
    },
  ],
  handler: async ({ options }) => {
    try {
      const { system, project, packages, detailed } = options as {
        system?: boolean
        project?: boolean
        packages?: boolean
        detailed?: boolean
      }

      console.log('===========================================')
      console.log('📊 LinchKit 系统信息')
      console.log('===========================================\n')

      // 如果没有指定特定选项，显示所有信息
      const showAll = !system && !project && !packages

      if (showAll || system) {
        await showSystemInfo(detailed)
      }

      if (showAll || project) {
        await showProjectInfo(detailed)
      }

      if (showAll || packages) {
        await showPackageInfo(detailed)
      }

      return { success: true }
    } catch (error) {
      Logger.error('Failed to get system info: ' + (error instanceof Error ? error.message : String(error)))
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

async function showSystemInfo(detailed?: boolean) {
  console.log('🖥️  系统环境')
  console.log('─'.repeat(40))

  try {
    // Node.js 版本
    const nodeVersion = process.version
    console.log(`Node.js:     ${nodeVersion}`)

    // npm/pnpm 版本
    try {
      const { stdout } = await execAsync('pnpm --version')
      console.log(`pnpm:        ${stdout.trim()}`)
    } catch (error) {
      Logger.debug('pnpm version check failed:', { error: error instanceof Error ? error.message : String(error) })
      console.log(`pnpm:        未安装`)
    }

    // 操作系统
    const os = require('os')
    console.log(`系统:        ${os.type()} ${os.release()}`)
    console.log(`架构:        ${os.arch()}`)

    if (detailed) {
      console.log(`内存:        ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`)
      console.log(`CPU核心:     ${os.cpus().length}`)
      console.log(`用户目录:    ${os.homedir()}`)
    }
  } catch (error) {
    console.log(`错误: ${error}`)
  }

  console.log('')
}

async function showProjectInfo(detailed?: boolean) {
  console.log('📁 项目信息')
  console.log('─'.repeat(40))

  try {
    const cwd = process.cwd()
    console.log(`工作目录:    ${cwd}`)

    // 检查 package.json
    if (existsSync('package.json')) {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
      console.log(`项目名称:    ${packageJson.name || '未设置'}`)
      console.log(`项目版本:    ${packageJson.version || '未设置'}`)

      if (detailed && packageJson.description) {
        console.log(`项目描述:    ${packageJson.description}`)
      }

      // 检查是否是 LinchKit 项目
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      const linchKitPackages = Object.keys(deps).filter(dep => dep.startsWith('@linch-kit/'))

      if (linchKitPackages.length > 0) {
        console.log(`LinchKit:    ✅ 已集成 (${linchKitPackages.length} 个包)`)

        if (detailed) {
          console.log(`使用的包:`)
          linchKitPackages.forEach(pkg => {
            console.log(`  - ${pkg}: ${deps[pkg]}`)
          })
        }
      } else {
        console.log(`LinchKit:    ❌ 未集成`)
      }
    } else {
      console.log(`package.json: ❌ 未找到`)
    }

    // 检查环境文件
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production']
    const existingEnvFiles = envFiles.filter(file => existsSync(file))

    if (existingEnvFiles.length > 0) {
      console.log(`环境文件:    ✅ ${existingEnvFiles.join(', ')}`)
    } else {
      console.log(`环境文件:    ❌ 未找到`)
    }

    // 检查数据库配置
    if (existsSync('prisma/schema.prisma')) {
      console.log(`Prisma:      ✅ 已配置`)
    } else {
      console.log(`Prisma:      ❌ 未配置`)
    }
  } catch (error) {
    console.log(`错误: ${error}`)
  }

  console.log('')
}

async function showPackageInfo(detailed?: boolean) {
  console.log('📦 LinchKit 包版本')
  console.log('─'.repeat(40))

  const linchKitPackages = [
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/auth',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui',
  ]

  if (existsSync('package.json')) {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    for (const pkg of linchKitPackages) {
      const version = deps[pkg]
      if (version) {
        console.log(`${pkg.padEnd(20)} ${version}`)

        if (detailed) {
          try {
            // 尝试获取已安装的实际版本
            const installedVersion = require(`${pkg}/package.json`).version
            if (installedVersion !== version.replace(/[^0-9.]/g, '')) {
              console.log(`  └─ 已安装: ${installedVersion}`)
            }
          } catch {
            // 忽略错误
          }
        }
      } else {
        console.log(`${pkg.padEnd(20)} ❌ 未安装`)
      }
    }
  } else {
    console.log('未找到 package.json 文件')
  }

  console.log('')

  // 显示可用命令统计
  try {
    const commands = getAllAvailableCommands()
    console.log('🔧 可用命令统计')
    console.log('─'.repeat(40))

    const categories = groupCommandsByCategory(commands)
    Object.entries(categories).forEach(([category, count]) => {
      const categoryName = getCategoryDisplayName(category)
      console.log(`${categoryName.padEnd(15)} ${count} 个命令`)
    })
  } catch (error) {
    if (detailed) {
      console.log(`命令统计错误: ${error}`)
    }
  }
}

function getAllAvailableCommands(): Array<{ category: string }> {
  // 这里应该从 CLI 管理器获取所有命令
  // 暂时返回预期的命令结构
  return [
    { category: 'core' },
    { category: 'core' },
    { category: 'core' },
    { category: 'schema' },
    { category: 'schema' },
    { category: 'schema' },
    { category: 'crud' },
    { category: 'crud' },
    { category: 'crud' },
    { category: 'trpc' },
  ]
}

function groupCommandsByCategory(commands: Array<{ category: string }>): Record<string, number> {
  return commands.reduce(
    (acc, cmd) => {
      acc[cmd.category] = (acc[cmd.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    core: 'Core',
    schema: 'Schema',
    crud: 'CRUD',
    trpc: 'tRPC',
    system: 'System',
  }
  return names[category] || category
}

export function registerInfoCommand(cli: CLIManager) {
  cli.registerCommand(infoCommand)
}
