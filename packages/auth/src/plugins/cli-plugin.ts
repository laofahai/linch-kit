/**
 * Auth CLI 插件
 *
 * 将认证相关的 CLI 命令注册到 core 包的 CLI 系统中
 */

import type { CommandPlugin, CommandMetadata, CLIContext } from '@linch-kit/core/cli'

import { generateAuthEntities, authPresets } from '../generators/auth-entities'

import { authConfigPlugin } from './config-plugin'

/**
 * Auth CLI 插件
 */
export const authCoreCliPlugin: CommandPlugin = {
  name: '@linch-kit/auth',
  description: 'Authentication and authorization commands',
  version: '0.1.0',
  aiTags: ['auth', 'generation', 'validation'],

  async register(registry: any): Promise<void> {
    // 注册所有认证相关的命令
    const commands: Record<string, CommandMetadata> = {
      'auth-init': {
        description: 'Initialize auth configuration',
        options: [
          {
            flags: '-t, --type <type>',
            description: 'Config file type (ts|js|json|mjs)',
            defaultValue: 'ts',
          },
          {
            flags: '-f, --force',
            description: 'Overwrite existing config file',
          },
        ],
        async handler(context: CLIContext): Promise<void> {
          const { args = [] } = context
          const options = args[args.length - 1] || {}
          const { type = 'ts', force = false } = options
          const fileName = `auth.config.${type}`

          try {
            // 动态导入 fs 模块
            const fs = await import('fs')

            if (fs.existsSync(fileName) && !force) {
              console.error(`❌ Config file ${fileName} already exists. Use --force to overwrite.`)
              process.exit(1)
            }

            const template = authConfigPlugin.getConfigTemplate(type as 'ts' | 'js' | 'json')
            fs.writeFileSync(fileName, template)
            console.log(`✅ Created ${fileName}`)
            console.log('\nNext steps:')
            console.log('1. Configure your authentication providers')
            console.log('2. Set up environment variables')
            console.log('3. Customize user entity if needed')
          } catch (error) {
            console.error(`❌ Failed to create config file: ${error}`)
            process.exit(1)
          }
        },
      },
      'auth-generate': {
        description: 'Generate authentication entities',
        options: [
          {
            flags: '--kit <kit>',
            description: 'Auth kit type (basic|standard|enterprise|multi-tenant)',
            defaultValue: 'standard',
          },
          {
            flags: '--preset <preset>',
            description: 'Use preset configuration (blog|enterprise|saas)',
          },
          {
            flags: '--roles',
            description: 'Include roles and permissions',
          },
          {
            flags: '--departments',
            description: 'Include department hierarchy',
          },
          {
            flags: '--tenants',
            description: 'Include multi-tenant support',
          },
          {
            flags: '--output <dir>',
            description: 'Output directory',
            defaultValue: './src/auth',
          },
        ],
        async handler(context: CLIContext): Promise<void> {
          const { args = [] } = context
          const options = args[args.length - 1] || {}
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
                outputDir: output,
              }
            }

            const entities = generateAuthEntities(config)

            console.log(`✅ Generated ${entities.length} auth entities`)
            console.log(`Output directory: ${output}`)
            console.log('\nGenerated entities:')
            entities.forEach(entity => {
              console.log(`  - ${entity.name}`)
            })

            console.log('\nNext steps:')
            console.log('1. Run schema generation: linch schema-generate')
            console.log('2. Run database migration')
            console.log('3. Update your auth config to use custom entities')
          } catch (error) {
            console.error(`❌ Failed to generate auth entities: ${error}`)
            process.exit(1)
          }
        },
      },
      'auth-validate': {
        description: 'Validate auth configuration',
        options: [
          {
            flags: '-c, --config <path>',
            description: 'Config file path',
          },
        ],
        async handler(context: CLIContext): Promise<void> {
          const { args = [] } = context
          const options = args[args.length - 1] || {}
          const { config } = options

          try {
            // 简化版本：只检查配置文件是否存在
            const fs = await import('fs')
            const configFiles = [
              'auth.config.ts',
              'auth.config.js',
              'auth.config.mjs',
              'auth.config.json',
            ]
            const configFile = configFiles.find(file => fs.existsSync(config || file))

            if (!configFile) {
              console.error('❌ No auth config found')
              console.log('Available config files:', configFiles.join(', '))
              process.exit(1)
            }

            console.log('✅ Auth configuration file found')
            console.log(`Config file: ${configFile}`)
            console.log('\nNote: Use auth-info for detailed configuration information')
          } catch (error) {
            console.error(`❌ Configuration validation failed: ${error}`)
            process.exit(1)
          }
        },
      },
    }

    // 注册所有命令
    for (const [name, command] of Object.entries(commands)) {
      registry.registerCommand(name, command)
    }
  },
}
/**
 * 注册 Auth CLI 插件
 */
export function registerAuthCoreCliPlugin() {
  // 这个函数会在包被导入时自动调用
  // 通过 core 包的插件系统注册命令
  if (typeof globalThis !== 'undefined' && (globalThis as any).__LINCH_CLI_REGISTRY__) {
    ;(globalThis as any).__LINCH_CLI_REGISTRY__.registerPlugin(authCoreCliPlugin)
  }
}
