#!/usr/bin/env node

/**
 * Linch Kit CLI 入口点
 * 
 * 集成所有 @linch-kit 包的 CLI 命令
 */

import { Command } from 'commander'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取版本号
function getVersion() {
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
  .description('Linch Kit CLI - AI-First Enterprise Development Framework')
  .version(getVersion())

// Auth 命令组
const authCommand = program
  .command('auth')
  .description('Authentication and authorization commands')

authCommand
  .command('init')
  .description('Initialize auth configuration')
  .option('-t, --type <type>', 'Config file type (ts|js|json)', 'ts')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options) => {
    try {
      const { authCoreCliPlugin } = await import('@linch-kit/auth-core')
      const initCommand = authCoreCliPlugin.commands.find(cmd => cmd.name === 'auth:init')
      if (initCommand) {
        await initCommand.action(options, { 
          logger: {
            info: console.log,
            success: (msg) => console.log(`✅ ${msg}`),
            error: (msg) => console.error(`❌ ${msg}`)
          }
        })
      }
    } catch (error) {
      console.error('❌ Error running auth:init:', error.message)
      process.exit(1)
    }
  })

authCommand
  .command('generate')
  .description('Generate authentication entities')
  .option('--kit <kit>', 'Auth kit type (basic|standard|enterprise|multi-tenant)', 'standard')
  .option('--preset <preset>', 'Use preset configuration (blog|enterprise|saas)')
  .option('--roles', 'Include roles and permissions')
  .option('--departments', 'Include department hierarchy')
  .option('--tenants', 'Include multi-tenant support')
  .option('--output <dir>', 'Output directory', './src/auth')
  .action(async (options) => {
    try {
      const { authCoreCliPlugin } = await import('@linch-kit/auth-core')
      const generateCommand = authCoreCliPlugin.commands.find(cmd => cmd.name === 'auth:generate')
      if (generateCommand) {
        await generateCommand.action(options, { 
          logger: {
            info: console.log,
            success: (msg) => console.log(`✅ ${msg}`),
            error: (msg) => console.error(`❌ ${msg}`)
          }
        })
      }
    } catch (error) {
      console.error('❌ Error running auth:generate:', error.message)
      process.exit(1)
    }
  })

authCommand
  .command('permissions')
  .description('Generate permission system')
  .option('--strategy <strategy>', 'Permission strategy (rbac|abac|hybrid)', 'rbac')
  .option('--hierarchical', 'Include hierarchical permissions')
  .option('--multi-tenant', 'Include multi-tenant permissions')
  .option('--output <dir>', 'Output directory', './src/auth/permissions')
  .action(async (options) => {
    try {
      const { authCoreCliPlugin } = await import('@linch-kit/auth-core')
      const permissionsCommand = authCoreCliPlugin.commands.find(cmd => cmd.name === 'auth:permissions')
      if (permissionsCommand) {
        await permissionsCommand.action(options, { 
          logger: {
            info: console.log,
            success: (msg) => console.log(`✅ ${msg}`),
            error: (msg) => console.error(`❌ ${msg}`)
          }
        })
      }
    } catch (error) {
      console.error('❌ Error running auth:permissions:', error.message)
      process.exit(1)
    }
  })

authCommand
  .command('validate')
  .description('Validate auth configuration')
  .option('-c, --config <path>', 'Config file path')
  .action(async (options) => {
    try {
      const { authCoreCliPlugin } = await import('@linch-kit/auth-core')
      const validateCommand = authCoreCliPlugin.commands.find(cmd => cmd.name === 'auth:validate')
      if (validateCommand) {
        await validateCommand.action(options, { 
          logger: {
            info: console.log,
            success: (msg) => console.log(`✅ ${msg}`),
            error: (msg) => console.error(`❌ ${msg}`)
          }
        })
      }
    } catch (error) {
      console.error('❌ Error running auth:validate:', error.message)
      process.exit(1)
    }
  })

authCommand
  .command('info')
  .description('Show auth configuration information')
  .option('-c, --config <path>', 'Config file path')
  .action(async (options) => {
    try {
      const { authCoreCliPlugin } = await import('@linch-kit/auth-core')
      const infoCommand = authCoreCliPlugin.commands.find(cmd => cmd.name === 'auth:info')
      if (infoCommand) {
        await infoCommand.action(options, { 
          logger: {
            info: console.log,
            success: (msg) => console.log(`✅ ${msg}`),
            error: (msg) => console.error(`❌ ${msg}`)
          }
        })
      }
    } catch (error) {
      console.error('❌ Error running auth:info:', error.message)
      process.exit(1)
    }
  })

// Schema 命令组
const schemaCommand = program
  .command('schema')
  .description('Schema generation and management commands')

schemaCommand
  .command('init')
  .description('Initialize schema configuration file')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options) => {
    try {
      // 直接调用 schema 包的 CLI
      const { spawn } = await import('child_process')
      const child = spawn('node', [
        './node_modules/@linch-kit/schema/dist/cli/index.js',
        'init',
        ...(options.force ? ['--force'] : [])
      ], { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      child.on('exit', (code) => {
        process.exit(code || 0)
      })
    } catch (error) {
      console.error('❌ Error running schema:init:', error.message)
      process.exit(1)
    }
  })

schemaCommand
  .command('generate:all')
  .description('Generate all artifacts (Prisma, validators, mocks, OpenAPI)')
  .option('--prisma-output <path>', 'Prisma output path', './prisma/schema.prisma')
  .option('--validators-output <path>', 'Validators output path', './src/validators/generated.ts')
  .option('--mocks-output <path>', 'Mocks output path', './src/mocks/factories.ts')
  .option('--openapi-output <path>', 'OpenAPI output path', './docs/api.json')
  .option('-p, --provider <provider>', 'Database provider', 'postgresql')
  .action(async (options) => {
    try {
      const { spawn } = await import('child_process')
      const args = [
        './node_modules/@linch-kit/schema/dist/cli/index.js',
        'generate:all',
        '--prisma-output', options.prismaOutput,
        '--validators-output', options.validatorsOutput,
        '--mocks-output', options.mocksOutput,
        '--openapi-output', options.openapiOutput,
        '--provider', options.provider
      ]
      
      const child = spawn('node', args, { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      child.on('exit', (code) => {
        process.exit(code || 0)
      })
    } catch (error) {
      console.error('❌ Error running schema:generate:all:', error.message)
      process.exit(1)
    }
  })

schemaCommand
  .command('generate:prisma')
  .description('Generate Prisma schema from entity definitions')
  .option('-o, --output <path>', 'Output file path', './prisma/schema.prisma')
  .option('-p, --provider <provider>', 'Database provider', 'postgresql')
  .option('--url <url>', 'Database URL')
  .option('-e, --entities-path <path>', 'Path to entities file or directory')
  .action(async (options) => {
    try {
      const { spawn } = await import('child_process')
      const args = [
        './node_modules/@linch-kit/schema/dist/cli/index.js',
        'generate:prisma',
        '--output', options.output,
        '--provider', options.provider
      ]
      
      if (options.url) {
        args.push('--url', options.url)
      }
      
      if (options.entitiesPath) {
        args.push('--entities-path', options.entitiesPath)
      }
      
      const child = spawn('node', args, { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      child.on('exit', (code) => {
        process.exit(code || 0)
      })
    } catch (error) {
      console.error('❌ Error running schema:generate:prisma:', error.message)
      process.exit(1)
    }
  })

schemaCommand
  .command('list')
  .description('List all registered entities')
  .action(async () => {
    try {
      const { spawn } = await import('child_process')
      const child = spawn('node', [
        './node_modules/@linch-kit/schema/dist/cli/index.js',
        'list'
      ], { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      child.on('exit', (code) => {
        process.exit(code || 0)
      })
    } catch (error) {
      console.error('❌ Error running schema:list:', error.message)
      process.exit(1)
    }
  })

// 显示帮助信息
if (process.argv.length === 2) {
  program.help()
}

program.parse()
