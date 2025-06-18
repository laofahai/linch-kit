#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

// 导入各个命令
import { initCommand } from './commands/init'
import { configCommand } from './commands/config'
import { schemaCommand } from './commands/schema'
import { authCommand } from './commands/auth'
import { devCommand } from './commands/dev'

/**
 * 读取 package.json 中的版本号
 */
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version || '0.1.0'
  } catch (error) {
    return '0.1.0'
  }
}

const program = new Command()

program
  .name('linch')
  .description(chalk.blue('🚀 Linch Kit - Unified CLI for modern web development'))
  .version(getVersion())

// 全局选项
program
  .option('-c, --config <path>', 'Config file path')
  .option('--cwd <path>', 'Working directory')
  .option('-v, --verbose', 'Verbose output')
  .option('--silent', 'Silent mode')

// 初始化命令
program
  .command('init')
  .description('Initialize a new Linch Kit project')
  .option('-t, --template <template>', 'Project template (blog|enterprise|saas)', 'blog')
  .option('-n, --name <name>', 'Project name')
  .option('--skip-install', 'Skip package installation')
  .option('--skip-git', 'Skip git initialization')
  .action(initCommand)

// 配置管理命令
const configCmd = program
  .command('config')
  .description('Manage Linch Kit configuration')

configCmd
  .command('init')
  .description('Initialize configuration file')
  .option('-t, --type <type>', 'Config file type (ts|js|json|mjs)', 'ts')
  .option('-p, --preset <preset>', 'Use preset configuration (blog|enterprise|saas)')
  .option('-f, --force', 'Overwrite existing config file')
  .action(configCommand.init)

configCmd
  .command('validate')
  .description('Validate configuration file')
  .action(configCommand.validate)

configCmd
  .command('info')
  .description('Show configuration information')
  .action(configCommand.info)

configCmd
  .command('set <key> <value>')
  .description('Set configuration value')
  .option('--db', 'Save to database instead of file')
  .action(configCommand.set)

configCmd
  .command('get <key>')
  .description('Get configuration value')
  .action(configCommand.get)

// Schema 命令
const schemaCmd = program
  .command('schema')
  .description('Schema generation and management')

schemaCmd
  .command('generate')
  .description('Generate schema files')
  .option('--prisma', 'Generate Prisma schema')
  .option('--mock', 'Generate mock data')
  .option('--openapi', 'Generate OpenAPI spec')
  .option('--all', 'Generate all')
  .action(schemaCommand.generate)

schemaCmd
  .command('validate')
  .description('Validate schema definitions')
  .action(schemaCommand.validate)

// Auth 命令
const authCmd = program
  .command('auth')
  .description('Authentication and authorization management')

authCmd
  .command('generate')
  .description('Generate auth entities and configuration')
  .option('--kit <kit>', 'Auth kit type (basic|standard|enterprise|multi-tenant)', 'standard')
  .option('--preset <preset>', 'Use preset configuration (blog|enterprise|saas)')
  .option('--roles', 'Include roles and permissions')
  .option('--departments', 'Include department hierarchy')
  .option('--tenants', 'Include multi-tenant support')
  .option('--output <dir>', 'Output directory', './src/auth')
  .action(authCommand.generate)

authCmd
  .command('permissions')
  .description('Generate permission system')
  .option('--strategy <strategy>', 'Permission strategy (rbac|abac|hybrid)', 'rbac')
  .option('--hierarchical', 'Include hierarchical permissions')
  .option('--multi-tenant', 'Include multi-tenant permissions')
  .action(authCommand.permissions)

// 开发命令
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--host <host>', 'Host address', 'localhost')
  .option('--open', 'Open browser automatically')
  .action(devCommand)

// 构建命令
program
  .command('build')
  .description('Build project for production')
  .option('--analyze', 'Analyze bundle size')
  .option('--clean', 'Clean output directory before build')
  .action(async (options) => {
    console.log(chalk.blue('🔨 Building project...'))
    // 实现构建逻辑
  })

// 部署命令
program
  .command('deploy')
  .description('Deploy project to production')
  .option('--env <env>', 'Deployment environment', 'production')
  .option('--dry-run', 'Show what would be deployed without actually deploying')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Deploying project...'))
    // 实现部署逻辑
  })

// 数据库命令
const dbCmd = program
  .command('db')
  .description('Database management')

dbCmd
  .command('migrate')
  .description('Run database migrations')
  .option('--reset', 'Reset database before migration')
  .action(async (options) => {
    console.log(chalk.blue('📊 Running database migrations...'))
    // 实现数据库迁移逻辑
  })

dbCmd
  .command('seed')
  .description('Seed database with initial data')
  .option('--env <env>', 'Environment', 'development')
  .action(async (options) => {
    console.log(chalk.blue('🌱 Seeding database...'))
    // 实现数据库种子逻辑
  })

// 插件命令
const pluginCmd = program
  .command('plugin')
  .description('Plugin management')

pluginCmd
  .command('list')
  .description('List installed plugins')
  .action(async () => {
    console.log(chalk.blue('📦 Listing plugins...'))
    // 实现插件列表逻辑
  })

pluginCmd
  .command('install <name>')
  .description('Install a plugin')
  .action(async (name) => {
    console.log(chalk.blue(`📦 Installing plugin: ${name}...`))
    // 实现插件安装逻辑
  })

// 错误处理
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`))
  console.log(chalk.yellow('See --help for a list of available commands.'))
  process.exit(1)
})

// 解析命令行参数
program.parse()

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
