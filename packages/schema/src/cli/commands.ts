/**
 * @linch-kit/schema CLI命令集成
 */

import { join, resolve } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

import type { CLICommand } from '@linch-kit/core'

import { CodeGenerator, GeneratorRegistry, PrismaGenerator, TypeScriptGenerator } from '../generators'
import type { Entity } from '../types'

/**
 * Schema代码生成命令
 */
export const generateSchemaCommand: CLICommand = {
  name: 'generate:schema',
  description: 'Generate code from schema definitions',
  category: 'schema',
  options: [
    {
      name: '--input',
      alias: '-i',
      description: 'Input schema file or directory',
      defaultValue: './src/schema'
    },
    {
      name: '--output',
      alias: '-o', 
      description: 'Output directory for generated files',
      defaultValue: './generated'
    },
    {
      name: '--generators',
      alias: '-g',
      description: 'Comma-separated list of generators to run',
      defaultValue: 'typescript,prisma'
    },
    {
      name: '--watch',
      alias: '-w',
      description: 'Watch for changes and regenerate',
      type: 'boolean'
    },
    {
      name: '--clean',
      description: 'Clean output directory before generating',
      type: 'boolean'
    }
  ],
  handler: async (args, { logger, i18n }) => {
    const t = i18n.getTranslation()
    
    try {
      const { input, output, generators, watch, clean } = args
      
      logger.info(t('schema.generate.starting', { input, output }))
      
      // 加载Schema实体
      const entities = await loadSchemaEntities(input)
      if (entities.length === 0) {
        logger.warn(t('schema.generate.noEntities', { input }))
        return
      }
      
      logger.info(t('schema.generate.foundEntities', { count: entities.length }))
      
      // 清理输出目录
      if (clean && existsSync(output)) {
        logger.info(t('schema.generate.cleaning', { output }))
        await cleanDirectory(output)
      }
      
      // 确保输出目录存在
      if (!existsSync(output)) {
        mkdirSync(output, { recursive: true })
      }
      
      // 创建代码生成器
      const generator = new CodeGenerator({
        entities,
        outputDir: output,
        hooks: {
          beforeGenerate: async (context) => {
            logger.info(t('schema.generate.beforeGenerate', { 
              entityCount: context.entities.length 
            }))
          },
          afterFileGenerated: async (file) => {
            logger.debug(t('schema.generate.fileGenerated', { 
              path: file.path, 
              type: file.type 
            }))
          },
          afterGenerate: async (files) => {
            logger.success(t('schema.generate.completed', { 
              fileCount: files.length 
            }))
          }
        }
      })
      
      // 注册生成器
      const generatorNames = generators.split(',').map((g: string) => g.trim())
      generatorNames.forEach((name: string) => {
        const gen = GeneratorRegistry.create(name)
        generator.registerGenerator(gen)
      })
      
      // 执行生成
      const files = await generator.generate()
      
      // 写入文件
      await writeGeneratedFiles(files, output)
      
      // 监听模式
      if (watch) {
        logger.info(t('schema.generate.watchMode', { input }))
        await watchSchemaChanges(input, async () => {
          logger.info(t('schema.generate.regenerating'))
          const newEntities = await loadSchemaEntities(input)
          const newFiles = await new CodeGenerator({ entities: newEntities })
            .registerGenerators(generatorNames.map(name => GeneratorRegistry.create(name)))
            .generate()
          await writeGeneratedFiles(newFiles, output)
        })
      }
      
    } catch (error) {
      logger.error(t('schema.generate.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      process.exit(1)
    }
  }
}

/**
 * Schema验证命令
 */
export const validateSchemaCommand: CLICommand = {
  name: 'validate:schema',
  description: 'Validate schema definitions',
  category: 'schema',
  options: [
    {
      name: '--input',
      alias: '-i',
      description: 'Input schema file or directory',
      defaultValue: './src/schema'
    },
    {
      name: '--strict',
      description: 'Enable strict validation mode',
      type: 'boolean'
    }
  ],
  handler: async (args, { logger, i18n }) => {
    const t = i18n.getTranslation()
    
    try {
      const { input, strict } = args
      
      logger.info(t('schema.validate.starting', { input }))
      
      const entities = await loadSchemaEntities(input)
      
      if (entities.length === 0) {
        logger.warn(t('schema.validate.noEntities', { input }))
        return
      }
      
      // 验证Schema
      const errors = await validateEntities(entities, { strict })
      
      if (errors.length === 0) {
        logger.success(t('schema.validate.success', { count: entities.length }))
      } else {
        logger.error(t('schema.validate.errors', { count: errors.length }))
        errors.forEach(error => {
          logger.error(`  - ${error}`)
        })
        process.exit(1)
      }
      
    } catch (error) {
      logger.error(t('schema.validate.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      process.exit(1)
    }
  }
}

/**
 * Schema初始化命令
 */
export const initSchemaCommand: CLICommand = {
  name: 'init:schema',
  description: 'Initialize schema structure in current project',
  category: 'schema',
  options: [
    {
      name: '--typescript',
      alias: '-ts',
      description: 'Use TypeScript template',
      type: 'boolean',
      defaultValue: true
    },
    {
      name: '--decorators',
      alias: '-d',
      description: 'Use decorator-based schema definitions',
      type: 'boolean'
    },
    {
      name: '--examples',
      alias: '-e',
      description: 'Include example schema files',
      type: 'boolean'
    }
  ],
  handler: async (args, { logger, i18n }) => {
    const t = i18n.getTranslation()
    
    try {
      const { typescript, decorators, examples } = args
      
      logger.info(t('schema.init.starting'))
      
      // 创建基础目录结构
      const dirs = [
        'src/schema',
        'src/schema/entities',
        'generated'
      ]
      
      dirs.forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
          logger.info(t('schema.init.dirCreated', { dir }))
        }
      })
      
      // 创建配置文件
      await createSchemaConfig(typescript, decorators)
      logger.info(t('schema.init.configCreated'))
      
      // 创建示例文件
      if (examples) {
        await createExampleSchemas(decorators)
        logger.info(t('schema.init.examplesCreated'))
      }
      
      // 创建生成脚本
      await createGenerateScript()
      logger.info(t('schema.init.scriptsCreated'))
      
      logger.success(t('schema.init.completed'))
      logger.info(t('schema.init.nextSteps'))
      
    } catch (error) {
      logger.error(t('schema.init.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      process.exit(1)
    }
  }
}

/**
 * Schema信息命令
 */
export const infoSchemaCommand: CLICommand = {
  name: 'info:schema',
  description: 'Display schema information and statistics',
  category: 'schema',
  options: [
    {
      name: '--input',
      alias: '-i',
      description: 'Input schema file or directory',
      defaultValue: './src/schema'
    },
    {
      name: '--detailed',
      alias: '-d',
      description: 'Show detailed information',
      type: 'boolean'
    }
  ],
  handler: async (args, { logger, i18n }) => {
    const t = i18n.getTranslation()
    
    try {
      const { input, detailed } = args
      
      const entities = await loadSchemaEntities(input)
      
      if (entities.length === 0) {
        logger.warn(t('schema.info.noEntities', { input }))
        return
      }
      
      // 显示基本信息
      logger.info(t('schema.info.summary', {
        entityCount: entities.length,
        fieldCount: entities.reduce((sum, entity) => sum + Object.keys(entity.fields).length, 0)
      }))
      
      // 显示实体列表
      entities.forEach(entity => {
        const fieldCount = Object.keys(entity.fields).length
        const relationCount = Object.values(entity.fields).filter(f => f.type === 'relation').length
        
        logger.info(`  📋 ${entity.name} (${fieldCount} fields, ${relationCount} relations)`)
        
        if (detailed) {
          Object.entries(entity.fields).forEach(([name, field]) => {
            const required = field.required ? ' *' : ''
            const unique = field.unique ? ' [unique]' : ''
            logger.info(`    - ${name}: ${field.type}${required}${unique}`)
          })
        }
      })
      
      // 显示生成器信息
      const availableGenerators = GeneratorRegistry.getRegisteredNames()
      logger.info(t('schema.info.generators', {
        generators: availableGenerators.join(', ')
      }))
      
    } catch (error) {
      logger.error(t('schema.info.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      process.exit(1)
    }
  }
}

// 辅助函数

/**
 * 加载Schema实体
 */
async function loadSchemaEntities(input: string): Promise<Entity[]> {
  // 这里应该实现实际的Schema文件加载逻辑
  // 支持TypeScript文件、装饰器类等
  return []
}

/**
 * 验证实体
 */
async function validateEntities(entities: Entity[], options: { strict?: boolean }): Promise<string[]> {
  const errors: string[] = []
  
  entities.forEach(entity => {
    // 基础验证
    if (!entity.name) {
      errors.push(`Entity missing name`)
    }
    
    if (!entity.fields || Object.keys(entity.fields).length === 0) {
      errors.push(`Entity ${entity.name} has no fields`)
    }
    
    // 字段验证
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      if (!field.type) {
        errors.push(`Field ${entity.name}.${fieldName} missing type`)
      }
      
      // 关系验证
      if (field.type === 'relation') {
        if (!field.target) {
          errors.push(`Relation field ${entity.name}.${fieldName} missing target`)
        }
      }
      
      // 严格模式验证
      if (options.strict) {
        if (!field.description) {
          errors.push(`Field ${entity.name}.${fieldName} missing description (strict mode)`)
        }
      }
    })
  })
  
  return errors
}

/**
 * 写入生成的文件
 */
async function writeGeneratedFiles(files: any[], outputDir: string): Promise<void> {
  for (const file of files) {
    const fullPath = resolve(outputDir, file.path)
    const dir = join(fullPath, '..')
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    
    writeFileSync(fullPath, file.content, 'utf8')
  }
}

/**
 * 清理目录
 */
async function cleanDirectory(dir: string): Promise<void> {
  // 实现目录清理逻辑
}

/**
 * 监听Schema变化
 */
async function watchSchemaChanges(input: string, callback: () => Promise<void>): Promise<void> {
  // 实现文件监听逻辑
}

/**
 * 创建Schema配置
 */
async function createSchemaConfig(typescript: boolean, decorators: boolean): Promise<void> {
  const config = {
    input: './src/schema',
    output: './generated',
    generators: ['typescript', 'prisma'],
    typescript,
    decorators
  }
  
  writeFileSync('linch.schema.json', JSON.stringify(config, null, 2))
}

/**
 * 创建示例Schema
 */
async function createExampleSchemas(decorators: boolean): Promise<void> {
  if (decorators) {
    const userSchema = `import { Entity, Field } from '@linch-kit/schema'

@Entity('User', { tableName: 'users' })
export class User {
  @Field.string().required().min(2).max(50)
  name!: string

  @Field.email().required().unique()
  email!: string

  @Field.number().min(0).max(120)
  age?: number

  @Field.oneToMany('Post')
  posts?: Post[]
}

@Entity('Post')
export class Post {
  @Field.string().required()
  title!: string

  @Field.text()
  content?: string

  @Field.manyToOne('User')
  author!: User
}`

    writeFileSync('src/schema/entities/user.schema.ts', userSchema)
  } else {
    const userSchema = `import { defineEntity, defineField } from '@linch-kit/schema'

export const User = defineEntity('User', {
  name: defineField.string().required().min(2).max(50),
  email: defineField.email().required().unique(),
  age: defineField.number().min(0).max(120),
  posts: defineField.relation('Post').oneToMany()
}, {
  tableName: 'users'
})

export const Post = defineEntity('Post', {
  title: defineField.string().required(),
  content: defineField.text(),
  author: defineField.relation('User').manyToOne()
})`

    writeFileSync('src/schema/entities/user.schema.ts', userSchema)
  }
}

/**
 * 创建生成脚本
 */
async function createGenerateScript(): Promise<void> {
  const script = `#!/usr/bin/env node
/**
 * Schema code generation script
 */

const { execSync } = require('child_process')

try {
  console.log('🔄 Generating schema code...')
  execSync('pnpm linch generate:schema', { stdio: 'inherit' })
  console.log('✅ Schema generation completed!')
} catch (error) {
  console.error('❌ Schema generation failed:', error.message)
  process.exit(1)
}`

  writeFileSync('scripts/generate-schema.js', script)
}

/**
 * 所有Schema相关命令
 */
export const schemaCommands: CLICommand[] = [
  generateSchemaCommand,
  validateSchemaCommand,
  initSchemaCommand,
  infoSchemaCommand
]