/**
 * Schema CLI 插件
 *
 * 将 schema 相关的 CLI 命令注册到 core 包的 CLI 系统中
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

import { glob } from 'glob'
import type { CLIContext, CommandMetadata, CommandPlugin, SchemaConfig } from '@linch-kit/core'

import { getAllEntities } from '../core/entity'
import { writePrismaSchema } from '../generators/prisma'
import { writeValidators } from '../generators/validators'

// 导入 core 包的配置加载函数

/**
 * @description 从 linch.config.js/ts 加载 schema 配置
 * @returns {Promise<SchemaConfig>} Schema 配置对象
 * @throws {Error} 当配置加载失败时抛出错误
 * @since 0.2.1
 * @example
 * ```typescript
 * const config = await loadLinchConfig();
 * console.log(config.entities); // ['src/entities/**\/*.{ts,tsx,js}']
 * ```
 */
async function loadLinchConfig(): Promise<SchemaConfig> {
  try {
    // 最后回退到core包的配置加载
    const { loadLinchConfig: loadLinchConfigFromCore } = await import('@linch-kit/core')
    const coreConfig = await loadLinchConfigFromCore({ required: false })

    // 将完整配置存储到全局变量，供其他函数使用
    if (coreConfig) {
      (globalThis as any).__LINCH_CONFIG__ = coreConfig
    }

    // 如果有配置，直接返回 schema 部分
    if (coreConfig?.schema) {
      return coreConfig.schema
    }

    // 默认配置
    return {
      entities: ['src/entities/**/*.{ts,tsx,js}'],
      output: {
        prisma: './prisma/schema.prisma',
        validators: './src/validators/generated.ts',
        mocks: './src/mocks/factories.ts',
        openapi: './docs/api.json'
      },
      database: {
        provider: 'sqlite'
      }
    }
  } catch {
    console.warn('⚠️ Failed to load linch config, using default schema config')
    return {
      entities: ['src/entities/**/*.{ts,tsx,js}'],
      output: {
        prisma: './prisma/schema.prisma',
        validators: './src/validators/generated.ts',
        mocks: './src/mocks/factories.ts',
        openapi: './docs/api.json'
      },
      database: {
        provider: 'sqlite'
      }
    }
  }
}

/**
 * 加载单个实体文件，支持 TypeScript 和 JavaScript
 * 在开发环境支持 .ts/.tsx，在生产环境支持 .js/.mjs
 */
async function loadEntityFile(filePath: string): Promise<void> {
  try {
    const ext = filePath.split('.').pop()?.toLowerCase()

    if (ext === 'ts' || ext === 'tsx') {
      // 对于TypeScript文件，使用tsx在同一进程中加载
      const { execSync } = await import('child_process')

      // 使用tsx直接执行，确保在同一进程中注册实体
      execSync(
        `npx tsx -e "import('${filePath}')"`,
        {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'inherit'
        }
      )
    } else {
      // 对于JavaScript文件，直接使用动态导入
      await import(pathToFileURL(filePath).href)
    }
  } catch (error) {
    console.error(`❌ Failed to load entity file ${filePath}:`, error)
    throw error
  }
}

/**
 * @description 加载依赖包中的实体，根据配置选择合适的认证套件
 * @param {SchemaConfig} config - Schema 配置对象
 * @returns {Promise<void>} 无返回值的 Promise
 * @throws {Error} 当包加载失败时抛出错误
 * @since 0.2.1
 * @example
 * ```typescript
 * const config = { auth: { entityKit: 'simplified' } };
 * await loadPackageEntities(config);
 * ```
 */
async function loadPackageEntities(config?: SchemaConfig) {
  // 已知包含实体的包列表和路径
  const packagesWithEntities = [
    {
      name: '@linch-kit/auth-core',
      // 在monorepo中使用相对路径，从项目根目录开始
      path: resolve(process.cwd(), 'packages/auth-core/dist/index.js')
    }
  ]

  for (const packageInfo of packagesWithEntities) {
    try {
      let packageModule

      // 首先尝试通过包名导入
      try {
        packageModule = await import(packageInfo.name)
      } catch (npmError) {
        // 如果包名导入失败，尝试使用相对路径（monorepo环境）
        if (existsSync(packageInfo.path)) {
          packageModule = await import(pathToFileURL(packageInfo.path).href)
        } else {
          throw npmError
        }
      }

      // 根据配置选择合适的认证套件
      const authKitType = getAuthKitType(config)
      const authKit = getAuthKitFromModule(packageModule, authKitType)

      if (authKit) {
        console.log(`📦 Loading entities from ${packageInfo.name}...`)
        // 这些实体模板在导入时会自动注册
        Object.values(authKit)
      }
    } catch (error) {
      // 如果包不存在或加载失败，继续处理其他包
      console.warn(`⚠️ Could not load entities from ${packageInfo.name}:`, error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * @description 根据配置获取认证套件类型
 * @param {SchemaConfig} config - Schema 配置对象
 * @returns {string} 认证套件类型
 * @since 0.2.1
 */
function getAuthKitType(_config?: SchemaConfig): string {
  // 尝试从全局配置中获取 auth 配置
  const globalConfig = (globalThis as any).__LINCH_CONFIG__

  // 检查顶级插件配置中的 entityKit 设置
  if (globalConfig?.plugins) {
    const authCorePlugin = globalConfig.plugins.find((p: any) =>
      p.name === '@linch-kit/auth-core' || p === '@linch-kit/auth-core'
    )
    if (authCorePlugin?.config?.entityKit) {
      return authCorePlugin.config.entityKit
    }
  }

  // 检查 auth 配置中的插件设置
  const authConfig = globalConfig?.auth
  if (authConfig?.plugins) {
    const authCorePlugin = authConfig.plugins.find((p: any) =>
      p.name === '@linch-kit/auth-core' || p === '@linch-kit/auth-core'
    )
    if (authCorePlugin?.config?.entityKit) {
      return authCorePlugin.config.entityKit
    }
  }

  // 默认使用多租户套件
  return 'multi-tenant'
}

/**
 * @description 从模块中获取指定类型的认证套件
 * @param {any} packageModule - 包模块对象
 * @param {string} kitType - 套件类型
 * @returns {any|null} 认证套件对象或 null
 * @since 0.2.1
 */
function getAuthKitFromModule(packageModule: any, kitType: string): any | null {
  const kitMap: Record<string, string> = {
    'basic': 'BasicAuthKit',
    'standard': 'StandardAuthKit',
    'enterprise': 'EnterpriseAuthKit',
    'multi-tenant': 'MultiTenantAuthKit',
    'simplified': 'SimplifiedAuthKit'
  }

  const kitName = kitMap[kitType]
  if (kitName && packageModule[kitName]) {
    return packageModule[kitName]
  }

  // 回退到多租户套件
  return packageModule.MultiTenantAuthKit || null
}

/**
 * @description 动态加载用户的实体文件
 * @param {SchemaConfig} config - Schema 配置对象
 * @param {string} entitiesPath - 可选的实体文件路径
 * @returns {Promise<void>} 无返回值的 Promise
 * @throws {Error} 当实体文件加载失败时抛出错误
 * @since 0.2.1
 */
async function loadEntities(config: SchemaConfig, entitiesPath?: string) {
  // 首先加载依赖包中的实体
  await loadPackageEntities(config)

  if (entitiesPath) {
    // 用户指定了实体文件路径
    const resolvedPath = resolve(process.cwd(), entitiesPath)
    if (existsSync(resolvedPath)) {
      await loadEntityFile(resolvedPath)
    } else {
      console.error(`❌ Entities file not found: ${resolvedPath}`)
      process.exit(1)
    }
  } else {
    // 使用配置文件中的模式
    const patterns = config.entities || []

    let allFiles: string[] = []

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: process.cwd() })
        if (files.length > 0) {
          allFiles.push(...files)
        }
      } catch {
        // 忽略错误，继续尝试下一个模式
      }
    }

    if (allFiles.length > 0) {
      console.log(`📁 Found entity files: ${allFiles.join(', ')}`)
      for (const file of allFiles) {
        const filePath = resolve(process.cwd(), file)
        await loadEntityFile(filePath)
      }
    }
  }

  const entities = getAllEntities()
  if (entities.length === 0) {
    console.error('❌ No entities registered. Make sure your entity files call defineEntity().')
    process.exit(1)
  }

  console.log(`✅ Loaded ${entities.length} entities: ${entities.map(e => e.name).join(', ')}`)
}

/**
 * Schema CLI 插件
 */
export const schemaCliPlugin: CommandPlugin = {
  name: '@linch-kit/schema',
  description: 'Schema generation and management commands',
  version: '0.2.1',
  aiTags: ['schema', 'generation', 'database', 'validation'],

  async register(registry: any): Promise<void> {
    const commands: Record<string, CommandMetadata> = {
      'schema:init': {
        description: 'Initialize schema configuration',
        options: [
          {
            flags: '-f, --force',
            description: 'Overwrite existing config file'
          }
        ],
        async handler(_context: CLIContext): Promise<void> {
          console.log('✅ Schema configuration is now part of linch.config.ts')
          console.log('📝 Edit linch.config.ts to customize your schema setup')
        }
      },

      'schema:generate:prisma': {
        description: 'Generate Prisma schema from entity definitions',
        options: [
          {
            flags: '-o, --output <path>',
            description: 'Output file path (overrides config)'
          },
          {
            flags: '-p, --provider <provider>',
            description: 'Database provider (overrides config)'
          },
          {
            flags: '--url <url>',
            description: 'Database URL (overrides config)'
          },
          {
            flags: '-e, --entities-path <path>',
            description: 'Path to entities file or directory'
          },
          {
            flags: '-c, --config <path>',
            description: 'Path to config file'
          }
        ],
        async handler(context: CLIContext): Promise<void> {
          const { args = [] } = context
          const options = args[args.length - 1] || {}

          try {
            console.log('🔄 Loading configuration...')
            const config = await loadLinchConfig()

            console.log('🔄 Loading entities...')
            await loadEntities(config, options.entitiesPath)

            const outputPath = options.output || config.output?.prisma || './prisma/schema.prisma'
            const provider = options.provider || config.database?.provider || 'postgresql'
            const databaseUrl = options.url || config.database?.url

            console.log('🔄 Generating Prisma schema...')
            await writePrismaSchema(outputPath, {
              provider,
              databaseUrl,
            })
            console.log(`✅ Prisma schema generated at: ${outputPath}`)
          } catch (error) {
            console.error('❌ Error generating Prisma schema:', error)
            process.exit(1)
          }
        }
      },

      'schema:generate:validators': {
        description: 'Generate Zod validators from entity definitions',
        options: [
          {
            flags: '-o, --output <path>',
            description: 'Output file path',
            defaultValue: './src/validators/generated.ts'
          },
          {
            flags: '-e, --entities-path <path>',
            description: 'Path to entities file or directory'
          }
        ],
        async handler(context: CLIContext): Promise<void> {
          const { args = [] } = context
          const options = args[args.length - 1] || {}

          try {
            console.log('🔄 Loading configuration...')
            const config = await loadLinchConfig()

            console.log('🔄 Loading entities...')
            await loadEntities(config, options.entitiesPath)

            console.log('🔄 Generating validators...')
            await writeValidators(options.output)
            console.log('✅ Validators generated successfully!')
          } catch (error) {
            console.error('❌ Error generating validators:', error)
            process.exit(1)
          }
        }
      },

      'schema:list': {
        description: 'List all registered entities',
        async handler(): Promise<void> {
          try {
            console.log('🔄 Loading configuration...')
            const config = await loadLinchConfig()

            console.log('🔄 Loading entities...')
            await loadEntities(config)

            const entities = getAllEntities()
            console.log('📋 Registered entities:')
            entities.forEach(entity => {
              console.log(`  - ${entity.name}`)
            })
            console.log(`\nTotal: ${entities.length} entities`)
          } catch (error) {
            console.error('❌ Error listing entities:', error)
            process.exit(1)
          }
        }
      },

      'schema:show': {
        description: 'Show entity details',
        arguments: [
          {
            name: 'entityName',
            description: 'Name of the entity to show',
            required: true
          }
        ],
        async handler(context: CLIContext): Promise<void> {
          const { args = [] } = context
          const entityName = args[0]

          if (!entityName) {
            console.error('❌ Entity name is required')
            process.exit(1)
          }

          try {
            console.log('🔄 Loading configuration...')
            const config = await loadLinchConfig()

            console.log('🔄 Loading entities...')
            await loadEntities(config)

            const entities = getAllEntities()
            const entity = entities.find(e => e.name === entityName)

            if (!entity) {
              console.error(`❌ Entity '${entityName}' not found`)
              process.exit(1)
            }

            console.log(`📄 Entity: ${entity.name}`)
            console.log(`Table: ${entity.meta?.model?.tableName || entity.name.toLowerCase()}`)

            if (entity.meta?.fields) {
              console.log('\nFields:')
              Object.entries(entity.meta.fields).forEach(([name, meta]) => {
                const attributes = []
                if (meta.id) attributes.push('PRIMARY KEY')
                if (meta.unique) attributes.push('UNIQUE')
                if (meta.createdAt) attributes.push('CREATED_AT')
                if (meta.updatedAt) attributes.push('UPDATED_AT')

                console.log(`  - ${name} ${attributes.length ? `(${attributes.join(', ')})` : ''}`)
              })
            }
          } catch (error) {
            console.error('❌ Error showing entity:', error)
            process.exit(1)
          }
        }
      }
    }

    // 注册所有命令
    for (const [name, command] of Object.entries(commands)) {
      registry.registerCommand(name, command)
    }
  }
}

/**
 * 注册 Schema CLI 插件
 */
export function registerSchemaCliPlugin() {
  // 这个函数会在包被导入时自动调用
  // 通过 core 包的插件系统注册命令
  if (typeof globalThis !== 'undefined' && (globalThis as any).__LINCH_CLI_REGISTRY__) {
    (globalThis as any).__LINCH_CLI_REGISTRY__.registerPlugin(schemaCliPlugin)
  }
}
