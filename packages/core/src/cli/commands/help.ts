/**
 * linch help 命令
 *
 * 显示所有可用命令的帮助信息
 */

import { type CLIManager, type CLICommand } from '../index'

/**
 * 获取所有可用命令的静态列表
 */
function getAllAvailableCommands(): CLICommand[] {
  return [
    // 核心命令
    {
      name: 'init',
      description: '初始化 LinchKit 项目',
      category: 'core',
      options: [
        { name: 'skip-env', description: '跳过环境变量配置', type: 'boolean' },
        { name: 'skip-deps', description: '跳过依赖安装', type: 'boolean' },
        { name: 'skip-db', description: '跳过数据库初始化', type: 'boolean' },
      ],
      handler: async () => ({ success: true }),
    },
    {
      name: 'info',
      description: '显示项目信息和状态',
      category: 'core',
      handler: async () => ({ success: true }),
    },
    {
      name: 'help',
      description: '显示所有可用命令和使用帮助',
      category: 'core',
      handler: async () => ({ success: true }),
    },
    {
      name: 'doctor',
      description: '诊断开发环境和项目配置问题',
      category: 'ops',
      options: [
        { name: 'fix', description: '自动修复发现的问题', type: 'boolean' },
        { name: 'verbose', description: '显示详细诊断信息', type: 'boolean' },
      ],
      handler: async () => ({ success: true }),
    },
    {
      name: 'upgrade',
      description: '升级 LinchKit 框架和依赖',
      category: 'ops',
      options: [
        { name: 'check', description: '仅检查可用更新', type: 'boolean' },
        { name: 'force', description: '强制升级到最新版本', type: 'boolean' },
      ],
      handler: async () => ({ success: true }),
    },
    // Schema 命令
    {
      name: 'schema:generate',
      description: '生成 Schema 类型定义',
      category: 'schema',
      handler: async () => ({ success: true }),
    },
    {
      name: 'schema:sync',
      description: '同步数据库 Schema',
      category: 'schema',
      handler: async () => ({ success: true }),
    },
    // CRUD 命令
    {
      name: 'crud:generate',
      description: '生成 CRUD 操作代码',
      category: 'crud',
      handler: async () => ({ success: true }),
    },
    // tRPC 命令
    {
      name: 'trpc:generate',
      description: '生成 tRPC 路由',
      category: 'trpc',
      handler: async () => ({ success: true }),
    },
  ]
}

const helpCommand: CLICommand = {
  name: 'help',
  description: '显示所有可用命令和使用帮助',
  category: 'core',
  options: [
    {
      name: 'command',
      description: '显示特定命令的详细帮助',
      type: 'string',
    },
    {
      name: 'category',
      alias: '-c',
      description: '仅显示特定分类的命令',
      type: 'string',
    },
  ],
  handler: async ({ options }) => {
    try {
      const { command, category } = options as {
        command?: string
        category?: string
      }

      // 获取所有已注册的命令 (静态列表)
      const commands = getAllAvailableCommands()

      if (command) {
        // 显示特定命令的详细帮助
        const cmd = commands.find((c: CLICommand) => c.name === command)
        if (!cmd) {
          console.error(`❌ 未找到命令: ${command}`)
          return { success: false, error: `Command not found: ${command}` }
        }

        showCommandHelp(cmd)
        return { success: true }
      }

      // 显示所有命令的帮助
      showAllCommandsHelp(commands, category)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

function showCommandHelp(command: CLICommand) {
  console.log('===========================================')
  console.log(`📖 ${command.name} - 命令帮助`)
  console.log('===========================================\n')

  console.log(`描述: ${command.description}`)
  console.log(`分类: ${command.category}`)

  if (command.options && command.options.length > 0) {
    console.log('\n选项:')
    command.options.forEach(option => {
      const alias = option.alias ? `, ${option.alias}` : ''
      const defaultValue =
        option.defaultValue !== undefined ? ` (默认: ${option.defaultValue})` : ''
      const type = option.type === 'boolean' ? ' [flag]' : ''

      console.log(`  --${option.name}${alias}${type}`)
      console.log(`    ${option.description}${defaultValue}`)
    })
  }

  console.log(`\n用法示例:`)
  console.log(`  pnpm linch ${command.name}`)

  if (command.options && command.options.length > 0) {
    const exampleOptions = command.options
      .filter(opt => opt.type !== 'boolean')
      .slice(0, 2)
      .map(opt => `--${opt.name} <value>`)
      .join(' ')

    if (exampleOptions) {
      console.log(`  pnpm linch ${command.name} ${exampleOptions}`)
    }
  }
}

function showAllCommandsHelp(commands: CLICommand[], filterCategory?: string) {
  console.log('===========================================')
  console.log('📚 LinchKit CLI 命令帮助')
  console.log('===========================================\n')

  console.log('LinchKit 是 AI-First 全栈开发框架，提供极简的9个核心CLI命令:\n')

  // 按分类组织命令
  const categories = groupCommandsByCategory(commands, filterCategory)

  // 显示每个分类的命令
  Object.entries(categories).forEach(([cat, cmds]) => {
    const categoryName = getCategoryDisplayName(cat)
    const categoryIcon = getCategoryIcon(cat)

    console.log(`${categoryIcon} ${categoryName}`)
    console.log('─'.repeat(40))

    cmds.forEach(cmd => {
      const nameWidth = 20
      const paddedName = cmd.name.padEnd(nameWidth)
      console.log(`  ${paddedName} ${cmd.description}`)
    })

    console.log('')
  })

  // 显示使用说明
  console.log('使用说明:')
  console.log('  pnpm linch <command> [options]')
  console.log('  pnpm linch help <command>     # 查看特定命令帮助')
  console.log('  pnpm linch help -c <category> # 查看特定分类命令')
  console.log('')

  // 显示快速开始
  console.log('快速开始:')
  console.log('  1. pnpm linch init             # 初始化项目')
  console.log('  2. pnpm linch schema:generate  # 生成Schema代码')
  console.log('  3. pnpm linch crud:generate    # 生成CRUD操作')
  console.log('  4. pnpm linch trpc:generate    # 生成tRPC路由')
  console.log('')

  console.log('更多信息:')
  console.log('  官方文档: https://linchkit.dev')
  console.log('  GitHub:   https://github.com/laofahai/linch-kit')
}

function groupCommandsByCategory(
  commands: CLICommand[],
  filterCategory?: string
): Record<string, CLICommand[]> {
  return commands.reduce(
    (acc, cmd) => {
      if (filterCategory && cmd.category !== filterCategory) {
        return acc
      }

      if (!acc[cmd.category]) {
        acc[cmd.category] = []
      }
      acc[cmd.category].push(cmd)
      return acc
    },
    {} as Record<string, CLICommand[]>
  )
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    core: '核心命令 (Core)',
    schema: 'Schema 引擎',
    crud: 'CRUD 操作',
    trpc: 'tRPC API层',
    ops: '运维工具',
    dev: '开发工具',
    deploy: '部署工具',
    util: '实用工具',
    auth: '认证权限',
    ui: 'UI 组件',
    config: '配置管理',
    plugin: '插件管理',
  }
  return names[category] || category
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    core: '🚀',
    schema: '📋',
    crud: '⚡',
    trpc: '🔌',
    ops: '🔧',
    dev: '👨‍💻',
    deploy: '🚀',
    util: '🛠️',
    auth: '🔐',
    ui: '🎨',
    config: '⚙️',
    plugin: '🧩',
  }
  return icons[category] || '📦'
}

export function registerHelpCommand(cli: CLIManager) {
  cli.registerCommand(helpCommand)
}
