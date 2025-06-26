/**
 * @linch-kit/schema CLI命令集成
 */

import { join, resolve } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

import type { CLICommand } from '@linch-kit/core'

import { CodeGenerator, GeneratorRegistry } from '../generators'
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
  handler: async (context) => {
    const { options, t } = context
    
    try {
      const { input, output, generators, watch, clean } = options as {
        input: string
        output: string
        generators: string
        watch: boolean
        clean: boolean
      }
      
      console.log(t('schema.generate.starting', { input, output }))
      
      // 加载Schema实体
      const entities = await loadSchemaEntities(input)
      if (entities.length === 0) {
        console.warn(t('schema.generate.noEntities', { input }))
        return { success: true, entities: [], files: [] }
      }
      
      console.log(t('schema.generate.foundEntities', { count: entities.length }))
      
      // 清理输出目录
      if (clean && existsSync(output)) {
        console.log(t('schema.generate.cleaning', { output }))
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
            console.log(t('schema.generate.beforeGenerate', { 
              entityCount: context.entities.length 
            }))
          },
          afterFileGenerated: async (file) => {
            console.log(t('schema.generate.fileGenerated', { 
              path: file.path, 
              type: file.type 
            }))
          },
          afterGenerate: async (files) => {
            console.log(t('schema.generate.completed', { 
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
        console.log(t('schema.generate.watchMode', { input }))
        await watchSchemaChanges(input, async () => {
          console.log(t('schema.generate.regenerating'))
          const newEntities = await loadSchemaEntities(input)
          const newFiles = await new CodeGenerator({ entities: newEntities })
            .registerGenerators(generatorNames.map(name => GeneratorRegistry.create(name)))
            .generate()
          await writeGeneratedFiles(newFiles, output)
        })
      }
      
      return { success: true }
    } catch (error) {
      console.error(t('schema.generate.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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
  handler: async (context) => {
    const { options, t } = context
    
    try {
      const { input, strict } = options as {
        input: string
        strict: boolean
      }
      
      console.log(t('schema.validate.starting', { input }))
      
      const entities = await loadSchemaEntities(input)
      
      if (entities.length === 0) {
        console.warn(t('schema.validate.noEntities', { input }))
        return { success: true, entities: [] }
      }
      
      // 验证Schema
      const errors = await validateEntities(entities, { strict })
      
      if (errors.length === 0) {
        console.log(t('schema.validate.success', { count: entities.length }))
        return { success: true, entities, errors: [] }
      } else {
        console.error(t('schema.validate.errors', { count: errors.length }))
        errors.forEach(error => {
          console.error(`  - ${error}`)
        })
        return { success: false, entities, errors }
      }
      
    } catch (error) {
      console.error(t('schema.validate.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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
  handler: async (context) => {
    const { options, t } = context
    
    try {
      const { typescript, decorators, examples } = options as {
        typescript: boolean
        decorators: boolean
        examples: boolean
      }
      
      console.log(t('schema.init.starting'))
      
      // 创建基础目录结构
      const dirs = [
        'src/schema',
        'src/schema/entities',
        'generated'
      ]
      
      const createdDirs: string[] = []
      dirs.forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
          console.log(t('schema.init.dirCreated', { dir }))
          createdDirs.push(dir)
        }
      })
      
      // 创建配置文件
      await createSchemaConfig(typescript, decorators)
      console.log(t('schema.init.configCreated'))
      
      // 创建示例文件
      const createdExamples: string[] = []
      if (examples) {
        await createExampleSchemas(decorators)
        console.log(t('schema.init.examplesCreated'))
        createdExamples.push('src/schema/entities/user.schema.ts')
      }
      
      // 创建生成脚本
      await createGenerateScript()
      console.log(t('schema.init.scriptsCreated'))
      
      console.log(t('schema.init.completed'))
      console.log(t('schema.init.nextSteps'))
      
      return { 
        success: true, 
        createdDirs, 
        createdExamples, 
        configFile: 'linch.schema.json',
        scriptFile: 'scripts/generate-schema.js'
      }
      
    } catch (error) {
      console.error(t('schema.init.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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
  handler: async (context) => {
    const { options, t } = context
    
    try {
      const { input, detailed } = options as {
        input: string
        detailed: boolean
      }
      
      const entities = await loadSchemaEntities(input)
      
      if (entities.length === 0) {
        console.warn(t('schema.info.noEntities', { input }))
        return { success: true, entities: [], summary: null }
      }
      
      const fieldCount = entities.reduce((sum, entity) => sum + Object.keys(entity.fields).length, 0)
      
      // 显示基本信息
      console.log(t('schema.info.summary', {
        entityCount: entities.length,
        fieldCount
      }))
      
      const entityInfos: Array<{
        name: string
        fieldCount: number
        relationCount: number
        fields: Array<{
          name: string
          type: string
          required?: boolean
          unique?: boolean
        }>
      }> = []
      
      // 显示实体列表
      entities.forEach(entity => {
        const entityFieldCount = Object.keys(entity.fields).length
        const relationCount = Object.values(entity.fields).filter(f => f.type === 'relation').length
        
        console.log(`  📋 ${entity.name} (${entityFieldCount} fields, ${relationCount} relations)`)
        
        const entityInfo = {
          name: entity.name,
          fieldCount: entityFieldCount,
          relationCount,
          fields: [] as Array<{
            name: string
            type: string
            required?: boolean
            unique?: boolean
          }>
        }
        
        if (detailed) {
          Object.entries(entity.fields).forEach(([name, field]) => {
            const required = field.required ? ' *' : ''
            const unique = field.unique ? ' [unique]' : ''
            const fieldInfo = `${name}: ${field.type}${required}${unique}`
            console.log(`    - ${fieldInfo}`)
            entityInfo.fields.push({ name, type: field.type, required: field.required, unique: field.unique })
          })
        }
        
        entityInfos.push(entityInfo)
      })
      
      // 显示生成器信息
      const availableGenerators = GeneratorRegistry.getRegisteredNames()
      console.log(t('schema.info.generators', {
        generators: availableGenerators.join(', ')
      }))
      
      return {
        success: true,
        entities: entityInfos,
        summary: {
          entityCount: entities.length,
          fieldCount,
          availableGenerators
        }
      }
      
    } catch (error) {
      console.error(t('schema.info.error', { 
        message: error instanceof Error ? error.message : String(error) 
      }))
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}

// 辅助函数

/**
 * 加载Schema实体
 */
async function loadSchemaEntities(_input: string): Promise<Entity[]> {
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
async function writeGeneratedFiles(files: Array<{ path: string; content: string }>, outputDir: string): Promise<void> {
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
async function cleanDirectory(_dir: string): Promise<void> {
  // 实现目录清理逻辑
}

/**
 * 监听Schema变化
 */
async function watchSchemaChanges(_input: string, _callback: () => Promise<void>): Promise<void> {
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