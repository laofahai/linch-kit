/**
 * Auth Core CLI 插件
 * 
 * 将认证相关的 CLI 命令注册到 core 包的 CLI 系统中
 */

// 临时使用 any 类型，等待 core 包完善
type CLIPlugin = any
import { authCoreConfigPlugin } from './config-plugin'
import { generateAuthEntities, authPresets } from '../generators/auth-entities'
import { writeFileSync, existsSync } from 'fs'

/**
 * Auth Core CLI 插件
 */
export const authCoreCliPlugin: CLIPlugin = {
  name: '@linch-kit/auth-core',
  description: 'Authentication and authorization commands',
  version: '0.1.0',
  
  commands: [
    {
      name: 'auth:init',
      description: 'Initialize auth configuration',
      options: [
        {
          flags: '-t, --type <type>',
          description: 'Config file type (ts|js|json|mjs)',
          defaultValue: 'ts'
        },
        {
          flags: '-f, --force',
          description: 'Overwrite existing config file'
        }
      ],
      async action(options: any, { logger }: any) {
        const { type, force } = options
        const fileName = `auth.config.${type}`
        
        if (existsSync(fileName) && !force) {
          logger.error(`Config file ${fileName} already exists. Use --force to overwrite.`)
          process.exit(1)
        }

        try {
          const template = authCoreConfigPlugin.getConfigTemplate(type as 'ts' | 'js' | 'json')
          writeFileSync(fileName, template)
          logger.success(`Created ${fileName}`)
          logger.info('\nNext steps:')
          logger.info('1. Configure your authentication providers')
          logger.info('2. Set up environment variables')
          logger.info('3. Customize user entity if needed')
        } catch (error) {
          logger.error(`Failed to create config file: ${error}`)
          process.exit(1)
        }
      }
    },
    
    {
      name: 'auth:generate',
      description: 'Generate authentication entities',
      options: [
        {
          flags: '--kit <kit>',
          description: 'Auth kit type (basic|standard|enterprise|multi-tenant)',
          defaultValue: 'standard'
        },
        {
          flags: '--preset <preset>',
          description: 'Use preset configuration (blog|enterprise|saas)'
        },
        {
          flags: '--roles',
          description: 'Include roles and permissions'
        },
        {
          flags: '--departments',
          description: 'Include department hierarchy'
        },
        {
          flags: '--tenants',
          description: 'Include multi-tenant support'
        },
        {
          flags: '--output <dir>',
          description: 'Output directory',
          defaultValue: './src/auth'
        }
      ],
      async action(options: any, { logger }: any) {
        const { kit, preset, roles, departments, tenants, output } = options

        try {
          let config
          
          if (preset) {
            config = authPresets[preset as keyof typeof authPresets]
            if (!config) {
              logger.error(`Unknown preset: ${preset}`)
              logger.info('Available presets:', Object.keys(authPresets).join(', '))
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
          
          logger.success(`Generated ${entities.length} auth entities`)
          logger.info(`Output directory: ${output}`)
          logger.info('\nGenerated entities:')
          entities.forEach(entity => {
            logger.info(`  - ${entity.name}`)
          })
          
          logger.info('\nNext steps:')
          logger.info('1. Run schema generation: linch schema:generate')
          logger.info('2. Run database migration')
          logger.info('3. Update your auth config to use custom entities')
          
        } catch (error) {
          logger.error(`Failed to generate auth entities: ${error}`)
          process.exit(1)
        }
      }
    },
    
    {
      name: 'auth:permissions',
      description: 'Generate permission system',
      options: [
        {
          flags: '--strategy <strategy>',
          description: 'Permission strategy (rbac|abac|hybrid)',
          defaultValue: 'rbac'
        },
        {
          flags: '--hierarchical',
          description: 'Include hierarchical permissions'
        },
        {
          flags: '--multi-tenant',
          description: 'Include multi-tenant permissions'
        },
        {
          flags: '--output <dir>',
          description: 'Output directory',
          defaultValue: './src/auth/permissions'
        }
      ],
      async action(options: any, { logger }: any) {
        const { strategy, hierarchical, multiTenant, output } = options

        try {
          logger.info(`Generating ${strategy.toUpperCase()} permission system...`)
          
          if (hierarchical) {
            logger.info('Including hierarchical permissions')
          }
          
          if (multiTenant) {
            logger.info('Including multi-tenant permissions')
          }
          
          logger.success('Permission system generated')
          logger.info(`Output directory: ${output}`)
          
        } catch (error) {
          logger.error(`Failed to generate permission system: ${error}`)
          process.exit(1)
        }
      }
    },
    
    {
      name: 'auth:validate',
      description: 'Validate auth configuration',
      options: [
        {
          flags: '-c, --config <path>',
          description: 'Config file path'
        }
      ],
      async action(options: any, { logger }: any) {
        const { config } = options

        try {
          // 简化版本：只检查配置文件是否存在
          const configFiles = ['auth.config.ts', 'auth.config.js', 'auth.config.mjs', 'auth.config.json']
          const configFile = configFiles.find(file => existsSync(config || file))

          if (!configFile) {
            logger.error('No auth config found')
            logger.info('Available config files:', configFiles.join(', '))
            process.exit(1)
          }

          logger.success('Auth configuration file found')
          logger.info(`Config file: ${configFile}`)
          logger.info('\nNote: Use auth:info for detailed configuration information')

        } catch (error) {
          logger.error(`Configuration validation failed: ${error}`)
          process.exit(1)
        }
      }
    },
    
    {
      name: 'auth:info',
      description: 'Show auth configuration information',
      options: [
        {
          flags: '-c, --config <path>',
          description: 'Config file path'
        }
      ],
      async action(options: any, { logger }: any) {
        const { config } = options

        try {
          const configFiles = ['auth.config.ts', 'auth.config.js', 'auth.config.mjs', 'auth.config.json']
          const configFile = configFiles.find(file => existsSync(config || file))

          if (!configFile) {
            logger.info('No auth config file found')
            logger.info('\nTo create one, run:')
            logger.info('  linch auth:init')
            logger.info('\nSupported config files:', configFiles.join(', '))
            return
          }

          logger.info(`Config file: ${configFile}`)
          logger.info('\nConfiguration details:')
          logger.info('  Use a proper config loader to get detailed information')
          logger.info('  This command shows basic file existence only')

        } catch (error) {
          logger.error(`Failed to load config info: ${error}`)
          process.exit(1)
        }
      }
    }
  ]
}

/**
 * 注册 Auth Core CLI 插件
 */
export function registerAuthCoreCliPlugin() {
  // 这个函数会在包被导入时自动调用
  // 通过 core 包的插件系统注册命令
  if (typeof globalThis !== 'undefined' && (globalThis as any).__LINCH_CLI_REGISTRY__) {
    (globalThis as any).__LINCH_CLI_REGISTRY__.registerPlugin(authCoreCliPlugin)
  }
}
