/**
 * Schema CLI 插件
 *
 * 将 schema 相关的 CLI 命令注册到 core 包的 CLI 系统中
 */

import type { CommandPlugin, CommandMetadata, CLIContext } from '@linch-kit/core'
import { writePrismaSchema } from '../generators/prisma'
import { writeValidators } from '../generators/validators'
import { writeMockFactories, generateTestDataFiles } from '../generators/mock'
import { writeOpenAPISpec } from '../generators/openapi'
import { getAllEntities, clearEntityRegistry } from '../core/entity'
import { loadConfig, type SchemaConfig } from '../config/loader'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import { glob } from 'glob'
import { existsSync, writeFileSync } from 'fs'

/**
 * 从 linch.config.ts 加载 schema 配置
 */
async function loadLinchConfig(): Promise<SchemaConfig> {
  try {
    // 尝试加载 linch.config.ts 使用 tsx
    const tsConfigPath = resolve(process.cwd(), 'linch.config.ts')
    if (existsSync(tsConfigPath)) {
      try {
        // 使用 tsx 动态加载 TypeScript 文件
        const { execSync } = await import('child_process')
        const configJson = execSync(
          `npx tsx -e "import config from '${tsConfigPath}'; console.log(JSON.stringify(config.schema || {}))"`,
          { encoding: 'utf8', cwd: process.cwd() }
        ).trim()

        const config = JSON.parse(configJson)
        return config
      } catch (tsxError) {
        console.warn('⚠️ Failed to load TypeScript config with tsx:', tsxError instanceof Error ? tsxError.message : String(tsxError))
      }
    }

    // 尝试加载 linch.config.js (编译后的版本)
    const jsConfigPath = resolve(process.cwd(), 'linch.config.js')
    if (existsSync(jsConfigPath)) {
      const configModule = await import(pathToFileURL(jsConfigPath).href)
      const config = configModule.default || configModule
      return config.schema || {}
    }

    // 尝试加载 linch.config.mjs
    const mjsConfigPath = resolve(process.cwd(), 'linch.config.mjs')
    if (existsSync(mjsConfigPath)) {
      const configModule = await import(pathToFileURL(mjsConfigPath).href)
      const config = configModule.default || configModule
      return config.schema || {}
    }

    // 最后回退到原有的 schema 配置加载
    return await loadConfig()
  } catch (error) {
    console.warn('⚠️ Failed to load linch config, using default schema config')
    return await loadConfig()
  }
}

/**
 * 动态加载用户的实体文件
 */
async function loadEntities(config: SchemaConfig, entitiesPath?: string) {
  // 清空现有的实体注册
  clearEntityRegistry()

  if (entitiesPath) {
    // 用户指定了实体文件路径
    const resolvedPath = resolve(process.cwd(), entitiesPath)
    if (existsSync(resolvedPath)) {
      await import(pathToFileURL(resolvedPath).href)
    } else {
      console.error(`❌ Entities file not found: ${resolvedPath}`)
      process.exit(1)
    }
  } else {
    // 使用配置文件中的模式
    const patterns = config.entities || []

    let found = false
    let allFiles: string[] = []

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: process.cwd() })
        if (files.length > 0) {
          allFiles.push(...files)
          found = true
        }
      } catch (error) {
        // 忽略错误，继续尝试下一个模式
      }
    }

    if (!found) {
      console.error('❌ No entity files found. Please:')
      console.error('  1. Run `linch schema:init` to create a config file')
      console.error('  2. Or specify --entities-path')
      console.error('  3. Or place entity files in default locations:')
      patterns.forEach(pattern => console.error(`     - ${pattern}`))
      process.exit(1)
    }

    console.log(`📁 Found entity files: ${allFiles.join(', ')}`)
    for (const file of allFiles) {
      const filePath = resolve(process.cwd(), file)
      await import(pathToFileURL(filePath).href)
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
        async handler(context: CLIContext): Promise<void> {
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
