/**
 * @linch-kit/crud CLI命令集成
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import type { CLICommand } from '@linch-kit/core/cli'

// CLI 上下文类型
interface CLIContext {
  options: Record<string, unknown>
}

// 临时翻译函数
const useCrudTranslation = () => (key: string, params?: Record<string, unknown>) => {
  const messages: Record<string, string> = {
    'crud.generate.start': 'Starting CRUD generation...',
    'crud.generate.success': 'CRUD generation completed successfully',
    'crud.generate.error': 'CRUD generation failed',
    'crud.migrate.start': 'Starting database migration...',
    'crud.migrate.success': 'Database migration completed',
    'crud.migrate.error': 'Database migration failed',
    'crud.seed.start': 'Starting database seeding...',
    'crud.seed.success': 'Database seeding completed',
    'crud.seed.error': 'Database seeding failed',
  }

  let message = messages[key] || key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(`{${k}}`, String(v))
    })
  }
  return message
}

/**
 * CRUD代码生成命令
 */
export const generateCrudCommand: CLICommand = {
  name: 'crud:generate',
  description: 'Generate CRUD operations from schema definitions',
  category: 'crud',
  options: [
    {
      name: '--schema',
      alias: '-s',
      description: 'Schema file or directory',
      defaultValue: './src/schema',
    },
    {
      name: '--output',
      alias: '-o',
      description: 'Output directory for generated CRUD files',
      defaultValue: './src/crud',
    },
    {
      name: '--provider',
      alias: '-p',
      description: 'Database provider (prisma, drizzle, etc.)',
      defaultValue: 'prisma',
    },
    {
      name: '--permissions',
      description: 'Generate with permission checks',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--validation',
      description: 'Generate with validation',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--cache',
      description: 'Generate with caching support',
      type: 'boolean',
    },
  ],
  handler: async (context: CLIContext) => {
    const { options } = context
    const t = useCrudTranslation()

    try {
      const { schema, output, provider, permissions, validation, cache } = options as {
        schema: string
        output: string
        provider: string
        permissions: boolean
        validation: boolean
        cache: boolean
      }

      console.log(t('crud.generate.start'))

      // 读取Schema定义
      const entities = await loadSchemaEntities(schema)
      
      if (entities.length === 0) {
        console.warn(`No entities found in ${schema}`)
        return { success: true, entities: [], files: [] }
      }

      console.log(`Found ${entities.length} entities to generate CRUD for`)

      // 确保输出目录存在
      if (!existsSync(output)) {
        mkdirSync(output, { recursive: true })
      }

      // 生成CRUD文件
      const files = await generateCrudFiles(entities, {
        outputDir: output,
        provider,
        permissions,
        validation,
        cache,
      })

      console.log(`Generated ${files.length} CRUD files`)
      console.log(t('crud.generate.success'))

      return { success: true, entities, files }
    } catch (error) {
      console.error(
        t('crud.generate.error', {
          message: error instanceof Error ? error.message : String(error),
        })
      )
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
}

/**
 * 数据库迁移命令
 */
export const migrateCrudCommand: CLICommand = {
  name: 'crud:migrate',
  description: 'Run database migrations',
  category: 'crud',
  options: [
    {
      name: '--provider',
      alias: '-p',
      description: 'Database provider (prisma, drizzle, etc.)',
      defaultValue: 'prisma',
    },
    {
      name: '--reset',
      description: 'Reset database before migration',
      type: 'boolean',
    },
    {
      name: '--seed',
      description: 'Run seed after migration',
      type: 'boolean',
    },
    {
      name: '--force',
      description: 'Force migration in production',
      type: 'boolean',
    },
  ],
  handler: async (context: CLIContext) => {
    const { options } = context
    const t = useCrudTranslation()

    try {
      const { provider, reset, seed, force } = options as {
        provider: string
        reset: boolean
        seed: boolean
        force: boolean
      }

      console.log(t('crud.migrate.start'))

      // 执行迁移
      const result = await runMigration({
        provider,
        reset,
        force,
      })

      console.log(`Migration completed: ${result.appliedMigrations.length} migrations applied`)

      // 执行种子数据
      if (seed) {
        console.log('Running seed data...')
        await runSeedData()
      }

      console.log(t('crud.migrate.success'))

      return { success: true, result }
    } catch (error) {
      console.error(
        t('crud.migrate.error', {
          message: error instanceof Error ? error.message : String(error),
        })
      )
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
}

/**
 * 数据库种子命令
 */
export const seedCrudCommand: CLICommand = {
  name: 'crud:seed',
  description: 'Seed database with initial data',
  category: 'crud',
  options: [
    {
      name: '--file',
      alias: '-f',
      description: 'Specific seed file to run',
    },
    {
      name: '--env',
      alias: '-e',
      description: 'Environment for seeding',
      defaultValue: 'development',
    },
    {
      name: '--reset',
      description: 'Reset data before seeding',
      type: 'boolean',
    },
  ],
  handler: async (context: CLIContext) => {
    const { options } = context
    const t = useCrudTranslation()

    try {
      const { file, env, reset } = options as {
        file?: string
        env: string
        reset: boolean
      }

      console.log(t('crud.seed.start'))

      // 执行种子数据
      const result = await runSeedData({
        file,
        env,
        reset,
      })

      console.log(`Seeding completed: ${result.seedsRun} seeds applied`)
      console.log(t('crud.seed.success'))

      return { success: true, result }
    } catch (error) {
      console.error(
        t('crud.seed.error', {
          message: error instanceof Error ? error.message : String(error),
        })
      )
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
}

// 辅助函数

/**
 * 加载Schema实体
 */
async function loadSchemaEntities(_schemaPath: string): Promise<Array<{ name: string; fields: Record<string, any> }>> {
  // 这里应该实现实际的Schema加载逻辑
  // 与 @linch-kit/schema 集成
  return []
}

/**
 * 生成CRUD文件
 */
async function generateCrudFiles(
  entities: Array<{ name: string; fields: Record<string, any> }>,
  options: {
    outputDir: string
    provider: string
    permissions: boolean
    validation: boolean
    cache: boolean
  }
): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = []

  for (const entity of entities) {
    // 生成基础CRUD类
    const crudFile = generateCrudClass(entity, options)
    files.push({
      path: join(options.outputDir, `${entity.name.toLowerCase()}.crud.ts`),
      content: crudFile,
    })

    // 生成路由文件
    const routerFile = generateRouterFile(entity, options)
    files.push({
      path: join(options.outputDir, `${entity.name.toLowerCase()}.router.ts`),
      content: routerFile,
    })

    // 生成类型文件
    const typesFile = generateTypesFile(entity, options)
    files.push({
      path: join(options.outputDir, `${entity.name.toLowerCase()}.types.ts`),
      content: typesFile,
    })
  }

  // 写入文件
  for (const file of files) {
    const dir = join(file.path, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(file.path, file.content, 'utf8')
  }

  return files
}

/**
 * 生成CRUD类
 */
function generateCrudClass(
  entity: { name: string; fields: Record<string, any> },
  options: {
    provider: string
    permissions: boolean
    validation: boolean
    cache: boolean
  }
): string {
  const className = `${entity.name}Crud`
  const imports = [`import { CrudManager } from '@linch-kit/crud'`]
  
  if (options.permissions) {
    imports.push(`import { PermissionChecker } from '@linch-kit/crud/permissions'`)
  }
  
  if (options.validation) {
    imports.push(`import { ValidationManager } from '@linch-kit/crud/validation'`)
  }
  
  if (options.cache) {
    imports.push(`import { CacheManager } from '@linch-kit/crud/cache'`)
  }

  return `${imports.join('\n')}

/**
 * ${entity.name} CRUD操作类
 * 自动生成，请勿手动修改
 */
export class ${className} extends CrudManager<${entity.name}> {
  constructor() {
    super('${entity.name.toLowerCase()}', {
      permissions: ${options.permissions},
      validation: ${options.validation},
      cache: ${options.cache},
    })
  }

  // 这里可以添加自定义方法
}

export const ${entity.name.toLowerCase()}Crud = new ${className}()
`
}

/**
 * 生成路由文件
 */
function generateRouterFile(
  entity: { name: string; fields: Record<string, any> },
  _options: any
): string {
  return `import { createTRPCRouter } from '@linch-kit/trpc'
import { ${entity.name.toLowerCase()}Crud } from './${entity.name.toLowerCase()}.crud'

/**
 * ${entity.name} tRPC路由
 * 自动生成，请勿手动修改
 */
export const ${entity.name.toLowerCase()}Router = createTRPCRouter({
  // 基础CRUD操作
  create: ${entity.name.toLowerCase()}Crud.createProcedure(),
  findMany: ${entity.name.toLowerCase()}Crud.findManyProcedure(),
  findOne: ${entity.name.toLowerCase()}Crud.findOneProcedure(),
  update: ${entity.name.toLowerCase()}Crud.updateProcedure(),
  delete: ${entity.name.toLowerCase()}Crud.deleteProcedure(),

  // 这里可以添加自定义路由
})
`
}

/**
 * 生成类型文件
 */
function generateTypesFile(
  entity: { name: string; fields: Record<string, any> },
  _options: any
): string {
  return `/**
 * ${entity.name} 类型定义
 * 自动生成，请勿手动修改
 */

export interface ${entity.name}CreateInput {
  // 根据Schema生成
}

export interface ${entity.name}UpdateInput {
  // 根据Schema生成
}

export interface ${entity.name}WhereInput {
  // 根据Schema生成
}

export interface ${entity.name}OrderByInput {
  // 根据Schema生成
}
`
}

/**
 * 运行迁移
 */
async function runMigration(options: {
  provider: string
  reset: boolean
  force: boolean
}): Promise<{ appliedMigrations: string[] }> {
  console.log(`Running migration with provider: ${options.provider}`)
  
  // 这里应该实现实际的迁移逻辑
  // 根据provider调用相应的迁移工具
  
  return { appliedMigrations: [] }
}

/**
 * 运行种子数据
 */
async function runSeedData(options?: {
  file?: string
  env?: string
  reset?: boolean
}): Promise<{ seedsRun: number }> {
  console.log(`Running seed data${options?.file ? ` from ${options.file}` : ''}`)
  
  // 这里应该实现实际的种子数据逻辑
  
  return { seedsRun: 0 }
}

/**
 * 所有CRUD相关命令
 */
export const crudCommands: CLICommand[] = [
  generateCrudCommand,
  migrateCrudCommand,
  seedCrudCommand,
]