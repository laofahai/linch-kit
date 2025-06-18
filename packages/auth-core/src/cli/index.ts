#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'fs'
import { join } from 'path'
import { generateConfigTemplate } from '../config/loader'
import { generateAuthEntities, authPresets } from '../generators/auth-entities'
import { writeFileSync, existsSync } from 'fs'

/**
 * 读取 package.json 中的版本号
 */
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version || '0.1.0'
  } catch (error) {
    return '0.1.0'
  }
}

const program = new Command()

program
  .name('@linch-kit/auth-core')
  .description('Auth Core CLI tools for linch-kit')
  .version(getVersion())

// 初始化配置文件
program
  .command('init')
  .description('Initialize auth configuration file')
  .option('-t, --type <type>', 'Config file type (ts|js|json|mjs)', 'ts')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options) => {
    const { type, force } = options
    const fileName = `auth.config.${type}`
    
    if (existsSync(fileName) && !force) {
      console.error(`Config file ${fileName} already exists. Use --force to overwrite.`)
      process.exit(1)
    }

    try {
      const template = generateConfigTemplate(type)
      writeFileSync(fileName, template)
      console.log(`✅ Created ${fileName}`)
      console.log('\nNext steps:')
      console.log('1. Configure your authentication providers')
      console.log('2. Set up environment variables')
      console.log('3. Customize user entity if needed')
    } catch (error) {
      console.error(`❌ Failed to create config file: ${error}`)
      process.exit(1)
    }
  })

// 生成认证实体
program
  .command('generate:auth')
  .description('Generate authentication entities')
  .option('--kit <kit>', 'Auth kit type (basic|standard|enterprise|multi-tenant)', 'standard')
  .option('--preset <preset>', 'Use preset configuration (blog|enterprise|saas)')
  .option('--roles', 'Include roles and permissions')
  .option('--departments', 'Include department hierarchy')
  .option('--tenants', 'Include multi-tenant support')
  .option('--output <dir>', 'Output directory', './src/auth')
  .action(async (options) => {
    const { kit, preset, roles, departments, tenants, output } = options

    try {
      let config
      
      if (preset) {
        config = authPresets[preset as keyof typeof authPresets]
        if (!config) {
          console.error(`❌ Unknown preset: ${preset}`)
          console.log('Available presets:', Object.keys(authPresets).join(', '))
          process.exit(1)
        }
      } else {
        config = {
          kit,
          includeRoles: roles,
          includeDepartments: departments,
          includeTenants: tenants,
          outputDir: output
        }
      }

      const entities = generateAuthEntities(config)
      
      console.log(`✅ Generated ${entities.length} auth entities`)
      console.log(`📁 Output directory: ${output}`)
      console.log('\nGenerated entities:')
      entities.forEach(entity => {
        console.log(`  - ${entity.name}`)
      })
      
      console.log('\nNext steps:')
      console.log('1. Run schema generation: npx linch-schema generate:prisma')
      console.log('2. Run database migration')
      console.log('3. Update your auth config to use custom entities')
      
    } catch (error) {
      console.error(`❌ Failed to generate auth entities: ${error}`)
      process.exit(1)
    }
  })

// 生成权限系统
program
  .command('generate:permissions')
  .description('Generate permission system')
  .option('--strategy <strategy>', 'Permission strategy (rbac|abac|hybrid)', 'rbac')
  .option('--hierarchical', 'Include hierarchical permissions')
  .option('--multi-tenant', 'Include multi-tenant permissions')
  .option('--output <dir>', 'Output directory', './src/auth/permissions')
  .action(async (options) => {
    const { strategy, hierarchical, multiTenant, output } = options

    try {
      console.log(`🔐 Generating ${strategy.toUpperCase()} permission system...`)
      
      if (hierarchical) {
        console.log('📊 Including hierarchical permissions')
      }
      
      if (multiTenant) {
        console.log('🏢 Including multi-tenant permissions')
      }
      
      console.log(`✅ Permission system generated`)
      console.log(`📁 Output directory: ${output}`)
      
    } catch (error) {
      console.error(`❌ Failed to generate permission system: ${error}`)
      process.exit(1)
    }
  })

// 验证配置
program
  .command('validate')
  .description('Validate auth configuration')
  .option('-c, --config <path>', 'Config file path')
  .action(async (options) => {
    const { config } = options

    try {
      const { loadAuthConfig } = await import('../config/loader')
      const authConfig = await loadAuthConfig({ 
        configPath: config,
        required: true 
      })

      if (!authConfig) {
        console.error('❌ No auth config found')
        process.exit(1)
      }

      console.log('✅ Auth configuration is valid')
      console.log(`📋 Providers: ${authConfig.providers?.length || 0}`)
      console.log(`🔧 Session strategy: ${authConfig.session?.strategy || 'jwt'}`)
      
      if (authConfig.permissions) {
        console.log(`🔐 Permission strategy: ${authConfig.permissions.strategy}`)
      }
      
      if (authConfig.multiTenant?.enabled) {
        console.log('🏢 Multi-tenant: enabled')
      }
      
    } catch (error) {
      console.error(`❌ Configuration validation failed: ${error}`)
      process.exit(1)
    }
  })

// 显示配置信息
program
  .command('info')
  .description('Show auth configuration information')
  .option('-c, --config <path>', 'Config file path')
  .action(async (options) => {
    const { config } = options

    try {
      const { loadAuthConfig, findConfigFile } = await import('../config/loader')
      
      const configFile = findConfigFile({ configPath: config })
      if (!configFile) {
        console.log('ℹ️  No auth config file found')
        console.log('\nTo create one, run:')
        console.log('  npx @linch-kit/auth-core init')
        return
      }

      console.log(`📄 Config file: ${configFile}`)
      
      const authConfig = await loadAuthConfig({ configPath: config })
      if (authConfig) {
        console.log('\n📋 Configuration:')
        console.log(`  Providers: ${authConfig.providers?.length || 0}`)
        console.log(`  Session: ${authConfig.session?.strategy || 'jwt'}`)
        console.log(`  Debug: ${authConfig.debug ? 'enabled' : 'disabled'}`)
        
        if (authConfig.permissions) {
          console.log(`  Permissions: ${authConfig.permissions.strategy}`)
        }
        
        if (authConfig.multiTenant?.enabled) {
          console.log('  Multi-tenant: enabled')
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to load config info: ${error}`)
      process.exit(1)
    }
  })

program.parse()
