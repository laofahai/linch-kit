/**
 * linch upgrade 命令
 *
 * 框架升级迁移工具 - Gemini建议的增强命令
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

import { type CLIManager, type CLICommand } from '../index'
import { Logger } from '../../logger-client'

const upgradeCommand: CLICommand = {
  name: 'upgrade',
  description: '升级LinchKit框架和处理版本迁移',
  category: 'ops',
  options: [
    {
      name: 'target',
      alias: '-t',
      description: '目标版本 (latest, next, 具体版本号)',
      defaultValue: 'latest',
    },
    {
      name: 'dry-run',
      description: '模拟运行，不实际执行升级',
      type: 'boolean',
    },
    {
      name: 'force',
      description: '强制升级，跳过兼容性检查',
      type: 'boolean',
    },
    {
      name: 'backup',
      description: '升级前创建备份',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'migration',
      description: '仅运行迁移脚本',
      type: 'boolean',
    },
  ],
  handler: async ({ options }) => {
    try {
      const { target, dryRun, force, backup, migration } = options as {
        target: string
        dryRun?: boolean
        force?: boolean
        backup?: boolean
        migration?: boolean
      }

      console.log('===========================================')
      console.log('🚀 LinchKit 框架升级工具')
      console.log('===========================================\n')

      // 检查是否在LinchKit项目中
      const projectInfo = await checkProject()
      if (!projectInfo.isLinchKit) {
        return {
          success: false,
          error: '当前目录不是LinchKit项目',
        }
      }

      console.log(`当前版本分析:`)
      console.log(`项目名称: ${projectInfo.name}`)
      console.log(`项目版本: ${projectInfo.version}`)
      console.log(`LinchKit包: ${projectInfo.linchKitPackages.length} 个\n`)

      // 仅运行迁移
      if (migration) {
        return await runMigrationOnly(projectInfo, dryRun)
      }

      // 获取目标版本信息
      const targetVersion = await getTargetVersion(target)
      console.log(`目标版本: ${targetVersion}\n`)

      // 兼容性检查
      if (!force) {
        const compatibility = await checkCompatibility(projectInfo, targetVersion)
        if (!compatibility.compatible) {
          console.log('❌ 兼容性检查失败:')
          compatibility.issues.forEach(issue => console.log(`  - ${issue}`))
          console.log('\n使用 --force 强制升级或先解决兼容性问题')
          return { success: false, error: 'Compatibility check failed' }
        }
      }

      // 创建备份
      if (backup && !dryRun) {
        await createBackup()
      }

      // 执行升级
      const result = await performUpgrade(projectInfo, targetVersion, dryRun)

      if (result.success) {
        console.log('\n✅ 升级完成!')
        if (result.migrations && result.migrations.length > 0) {
          console.log(`执行了 ${result.migrations.length} 个迁移脚本`)
        }
        console.log('\n建议的后续步骤:')
        console.log('1. 运行 pnpm install 安装新依赖')
        console.log('2. 运行 pnpm build 验证构建')
        console.log('3. 运行 pnpm test 验证测试')
      }

      return result
    } catch (error) {
      Logger.error('Upgrade failed:', error instanceof Error ? error : new Error(String(error)))
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

interface ProjectInfo {
  isLinchKit: boolean
  name: string
  version: string
  linchKitPackages: Array<{ name: string; version: string }>
  packageJson: Record<string, unknown>
}

async function checkProject(): Promise<ProjectInfo> {
  if (!existsSync('package.json')) {
    return {
      isLinchKit: false,
      name: '',
      version: '',
      linchKitPackages: [],
      packageJson: {},
    }
  }

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  const linchKitPackages = Object.entries(deps)
    .filter(([name]) => name.startsWith('@linch-kit/'))
    .map(([name, version]) => ({ name, version: version as string }))

  return {
    isLinchKit: linchKitPackages.length > 0,
    name: packageJson.name || 'unnamed',
    version: packageJson.version || '0.0.0',
    linchKitPackages,
    packageJson,
  }
}

async function getTargetVersion(target: string): Promise<string> {
  try {
    if (target === 'latest') {
      // 获取最新版本
      const result = execSync('npm view @linch-kit/core version', { encoding: 'utf-8' })
      return result.trim()
    } else if (target === 'next') {
      // 获取预发布版本
      const result = execSync('npm view @linch-kit/core version --tag next', { encoding: 'utf-8' })
      return result.trim()
    } else {
      // 验证指定版本
      return target
    }
  } catch (error) {
    throw new Error(`无法获取目标版本信息: ${error}`)
  }
}

async function checkCompatibility(
  projectInfo: ProjectInfo,
  targetVersion: string
): Promise<{ compatible: boolean; issues: string[] }> {
  const issues: string[] = []

  // 检查Node.js版本
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  if (majorVersion < 18) {
    issues.push(`Node.js版本过低 (${nodeVersion})，建议升级到18+`)
  }

  // 检查包管理器
  try {
    execSync('pnpm --version', { stdio: 'pipe' })
  } catch {
    issues.push('未找到pnpm包管理器，LinchKit需要pnpm')
  }

  // 检查破坏性变更
  const currentVersions = projectInfo.linchKitPackages
  const breakingChanges = await checkBreakingChanges(currentVersions, targetVersion)
  issues.push(...breakingChanges)

  return {
    compatible: issues.length === 0,
    issues,
  }
}

async function checkBreakingChanges(
  currentPackages: Array<{ name: string; version: string }>,
  targetVersion: string
): Promise<string[]> {
  const issues: string[] = []

  // 这里应该实现实际的破坏性变更检查
  // 基于CHANGELOG或版本兼容性矩阵

  for (const pkg of currentPackages) {
    const currentMajor = parseInt(pkg.version.split('.')[0])
    const targetMajor = parseInt(targetVersion.split('.')[0])

    if (targetMajor > currentMajor) {
      issues.push(
        `${pkg.name}: 主版本升级 (${pkg.version} -> ${targetVersion})，可能包含破坏性变更`
      )
    }
  }

  return issues
}

async function createBackup(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupName = `linchkit-backup-${timestamp}`

  console.log(`创建备份: ${backupName}`)

  try {
    // 备份package.json和重要配置文件
    const filesToBackup = [
      'package.json',
      'pnpm-lock.yaml',
      '.env.example',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
    ]

    const backupData: Record<string, string> = {}

    filesToBackup.forEach(file => {
      if (existsSync(file)) {
        backupData[file] = readFileSync(file, 'utf-8')
      }
    })

    writeFileSync(`${backupName}.json`, JSON.stringify(backupData, null, 2))
    console.log(`✓ 备份已创建: ${backupName}.json`)
  } catch (error) {
    console.warn(`备份创建失败: ${error}`)
  }
}

async function performUpgrade(
  projectInfo: ProjectInfo,
  targetVersion: string,
  dryRun?: boolean
): Promise<{ success: boolean; migrations?: string[] }> {
  console.log(`${dryRun ? '[模拟] ' : ''}开始升级到版本 ${targetVersion}...`)

  const migrations: string[] = []

  // 1. 更新package.json中的LinchKit包版本
  if (!dryRun) {
    const packageJson = projectInfo.packageJson as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    projectInfo.linchKitPackages.forEach(pkg => {
      if (packageJson.dependencies?.[pkg.name]) {
        packageJson.dependencies[pkg.name] = `^${targetVersion}`
        migrations.push(`Updated ${pkg.name} to ^${targetVersion}`)
      }
      if (packageJson.devDependencies?.[pkg.name]) {
        packageJson.devDependencies[pkg.name] = `^${targetVersion}`
        migrations.push(`Updated ${pkg.name} to ^${targetVersion}`)
      }
    })

    writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
    console.log('✓ 已更新package.json')
  } else {
    console.log('[模拟] 将更新package.json中的LinchKit包版本')
    migrations.push('Update package.json versions')
  }

  // 2. 运行迁移脚本
  const migrationResult = await runMigrations(targetVersion, dryRun)
  migrations.push(...migrationResult)

  return { success: true, migrations }
}

async function runMigrationOnly(
  projectInfo: ProjectInfo,
  dryRun?: boolean
): Promise<{ success: boolean; migrations: string[] }> {
  console.log(`${dryRun ? '[模拟] ' : ''}仅运行迁移脚本...`)

  const targetVersion = getLatestInstalledVersion(projectInfo)
  const migrations = await runMigrations(targetVersion, dryRun)

  return { success: true, migrations }
}

function getLatestInstalledVersion(projectInfo: ProjectInfo): string {
  // 获取当前安装的最高版本
  const versions = projectInfo.linchKitPackages.map(pkg => pkg.version.replace(/[^0-9.]/g, ''))
  return versions.sort().pop() || '1.0.0'
}

async function runMigrations(targetVersion: string, dryRun?: boolean): Promise<string[]> {
  const migrations: string[] = []

  // 这里应该实现实际的迁移脚本逻辑
  // 基于版本号运行相应的迁移脚本

  const migrationScripts = [
    {
      version: '2.0.0',
      name: 'Schema API重构迁移',
      script: () => {
        // 迁移Schema API调用
        migrations.push('Migrated Schema API calls')
      },
    },
    {
      version: '2.1.0',
      name: 'CRUD配置更新',
      script: () => {
        // 更新CRUD配置格式
        migrations.push('Updated CRUD configuration format')
      },
    },
  ]

  for (const migration of migrationScripts) {
    if (shouldRunMigration(migration.version, targetVersion)) {
      console.log(`${dryRun ? '[模拟] ' : ''}运行迁移: ${migration.name}`)
      if (!dryRun) {
        migration.script()
      }
      migrations.push(migration.name)
    }
  }

  return migrations
}

function shouldRunMigration(migrationVersion: string, targetVersion: string): boolean {
  // 简单的版本比较逻辑
  return migrationVersion <= targetVersion
}

export function registerUpgradeCommand(cli: CLIManager) {
  cli.registerCommand(upgradeCommand)
}
