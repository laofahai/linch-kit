#!/usr/bin/env node

import { Command } from 'commander'
import { writePrismaSchema } from '../generators/prisma'
import { writeValidators } from '../generators/validators'
import { writeMockFactories, generateTestDataFiles } from '../generators/mock'
import { writeOpenAPISpec } from '../generators/openapi'
import { getAllEntities, clearEntityRegistry } from '../core/entity'
import { loadLinchConfig } from '@linch-kit/core'
import type { SchemaConfig } from '../core/types'
import { pathToFileURL } from 'url'
import { resolve, join } from 'path'
import { glob } from 'glob'
import { existsSync, writeFileSync, readFileSync } from 'fs'

/**
 * 读取 package.json 中的版本号
 */
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version || '0.1.0'
  } catch (error) {
    // 如果读取失败，使用默认版本
    return '0.1.0'
  }
}

/**
 * 生成schema配置模板
 */
function generateSchemaConfigTemplate(): string {
  return `// Schema Configuration
// This file is deprecated. Please use linch.config.ts instead.

export default {
  entities: ['src/entities/**/*.{ts,tsx,js}'],
  output: {
    prisma: './prisma/schema.prisma',
    validators: './src/validators/generated.ts',
    mocks: './src/mocks/factories.ts',
    openapi: './docs/api.json',
  },
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  softDelete: true,
}
`
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
        const files = await glob(pattern as string, { cwd: process.cwd() })
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
      console.error('  1. Run `linch-schema init` to create a config file')
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

const program = new Command()

program
  .name('@linch-kit/schema')
  .description('Schema generation tools for linch-kit')
  .version(getVersion())

// 初始化配置文件
program
  .command('init')
  .description('Initialize schema configuration file')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options) => {
    const configPath = 'linch-schema.config.js'

    if (existsSync(configPath) && !options.force) {
      console.error(`❌ Config file already exists: ${configPath}`)
      console.error('Use --force to overwrite')
      process.exit(1)
    }

    try {
      const template = generateSchemaConfigTemplate()
      writeFileSync(configPath, template, 'utf-8')
      console.log(`✅ Created config file: ${configPath}`)
      console.log('📝 Edit the config file to customize your setup')
    } catch (error) {
      console.error('❌ Error creating config file:', error)
      process.exit(1)
    }
  })

// 生成 Prisma Schema
program
  .command('generate:prisma')
  .description('Generate Prisma schema from entity definitions')
  .option('-o, --output <path>', 'Output file path (overrides config)')
  .option('-p, --provider <provider>', 'Database provider (overrides config)')
  .option('--url <url>', 'Database URL (overrides config)')
  .option('-e, --entities-path <path>', 'Path to entities file or directory')
  .option('-c, --config <path>', 'Path to config file')
  .action(async options => {
    try {
      console.log('🔄 Loading configuration...')
      const linchConfig = await loadLinchConfig()
      const config = linchConfig.schema || {}

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
  })

// 生成验证器
program
  .command('generate:validators')
  .description('Generate Zod validators from entity definitions')
  .option('-o, --output <path>', 'Output file path', './src/validators/generated.ts')
  .option('-e, --entities-path <path>', 'Path to entities file or directory')
  .action(async options => {
    try {
      console.log('🔄 Loading entities...')
      await loadEntities(options.entitiesPath)

      console.log('🔄 Generating validators...')
      await writeValidators(options.output)
      console.log('✅ Validators generated successfully!')
    } catch (error) {
      console.error('❌ Error generating validators:', error)
      process.exit(1)
    }
  })

// 生成 Mock 工厂
program
  .command('generate:mocks')
  .description('Generate mock data factories from entity definitions')
  .option('-o, --output <path>', 'Output file path', './src/mocks/factories.ts')
  .action(async options => {
    try {
      console.log('🔄 Generating mock factories...')
      await writeMockFactories(options.output)
      console.log('✅ Mock factories generated successfully!')
    } catch (error) {
      console.error('❌ Error generating mock factories:', error)
      process.exit(1)
    }
  })

// 生成测试数据
program
  .command('generate:test-data')
  .description('Generate test data JSON files')
  .option('-o, --output <dir>', 'Output directory', './test-data')
  .option('-c, --count <number>', 'Number of records per entity', '10')
  .action(async options => {
    try {
      console.log('🔄 Generating test data...')
      await generateTestDataFiles(options.output, { count: parseInt(options.count) })
      console.log('✅ Test data generated successfully!')
    } catch (error) {
      console.error('❌ Error generating test data:', error)
      process.exit(1)
    }
  })

// 生成 OpenAPI 文档
program
  .command('generate:openapi')
  .description('Generate OpenAPI specification from entity definitions')
  .option('-o, --output <path>', 'Output file path', './docs/api.json')
  .option('--title <title>', 'API title', 'Linch Kit API')
  .option('--version <version>', 'API version', '1.0.0')
  .option('--description <description>', 'API description')
  .action(async options => {
    try {
      console.log('🔄 Generating OpenAPI specification...')
      await writeOpenAPISpec(options.output, {
        title: options.title,
        version: options.version,
        description: options.description,
      })
      console.log('✅ OpenAPI specification generated successfully!')
    } catch (error) {
      console.error('❌ Error generating OpenAPI specification:', error)
      process.exit(1)
    }
  })

// 生成所有
program
  .command('generate:all')
  .description('Generate all artifacts (Prisma, validators, mocks, OpenAPI)')
  .option('--prisma-output <path>', 'Prisma output path', './prisma/schema.prisma')
  .option('--validators-output <path>', 'Validators output path', './src/validators/generated.ts')
  .option('--mocks-output <path>', 'Mocks output path', './src/mocks/factories.ts')
  .option('--openapi-output <path>', 'OpenAPI output path', './docs/api.json')
  .option('--test-data-output <dir>', 'Test data output directory', './test-data')
  .option('-p, --provider <provider>', 'Database provider', 'postgresql')
  .action(async options => {
    try {
      console.log('🔄 Generating all artifacts...')

      // 生成 Prisma schema
      await writePrismaSchema(options.prismaOutput, { provider: options.provider })
      console.log('✅ Prisma schema generated')

      // 生成验证器
      await writeValidators(options.validatorsOutput)
      console.log('✅ Validators generated')

      // 生成 Mock 工厂
      await writeMockFactories(options.mocksOutput)
      console.log('✅ Mock factories generated')

      // 生成 OpenAPI 文档
      await writeOpenAPISpec(options.openapiOutput)
      console.log('✅ OpenAPI specification generated')

      // 生成测试数据
      await generateTestDataFiles(options.testDataOutput, { count: 10 })
      console.log('✅ Test data generated')

      console.log('🎉 All artifacts generated successfully!')
    } catch (error) {
      console.error('❌ Error generating artifacts:', error)
      process.exit(1)
    }
  })

// 列出实体
program
  .command('list')
  .description('List all registered entities')
  .action(() => {
    const entities = getAllEntities()
    console.log('📋 Registered entities:')
    entities.forEach(entity => {
      console.log(`  - ${entity.name}`)
    })
    console.log(`\nTotal: ${entities.length} entities`)
  })

// 显示实体详情
program
  .command('show <entityName>')
  .description('Show entity details')
  .action(entityName => {
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

    if (entity.meta?.relations) {
      console.log('\nRelations:')
      Object.entries(entity.meta.relations).forEach(([name, relation]) => {
        console.log(`  - ${name} -> ${relation.model} (${relation.type})`)
      })
    }

    if (entity.meta?.model?.indexes) {
      console.log('\nIndexes:')
      entity.meta.model.indexes.forEach((index, i) => {
        const type = index.unique ? 'UNIQUE' : 'INDEX'
        console.log(`  - ${type} (${index.fields.join(', ')})`)
      })
    }
  })

program.parse()
