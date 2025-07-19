/**
 * LinchKit Schema CLI 命令
 *
 * 集成@linch-kit/schema工具的CLI命令
 */

import { resolve, dirname } from 'path'
import { mkdir, writeFile } from 'fs/promises'

import { glob } from 'glob'
import { createGenerator, PrismaGenerator } from '@linch-kit/schema'

import { type CLIManager, type CLICommand } from '../index'

interface EntityModule {
  path: string
  exports: Record<string, unknown>
}

/**
 * 自动发现实体文件
 */
async function discoverEntities(inputPatterns?: string): Promise<EntityModule[]> {
  const patterns = inputPatterns 
    ? inputPatterns.split(',').map(p => p.trim())
    : [
        'packages/**/src/entities/**/*.ts',
        'extensions/**/src/entities/**/*.ts'
      ]
  
  const entityFiles: string[] = []
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts']
    })
    entityFiles.push(...files)
  }
  
  console.log(`📁 发现 ${entityFiles.length} 个实体文件`)
  
  const modules: EntityModule[] = []
  
  for (const file of entityFiles) {
    try {
      const module = await import(file)
      modules.push({
        path: file,
        exports: module
      })
      console.log(`✅ 加载实体文件: ${file}`)
    } catch (error) {
      console.warn(`⚠️ 跳过无效实体文件: ${file}`, error)
    }
  }
  
  return modules
}

/**
 * 提取实体定义
 */
function extractEntities(modules: EntityModule[]): unknown[] {
  const entities: unknown[] = []
  
  for (const module of modules) {
    // 查找以Entity结尾的导出
    for (const [name, exported] of Object.entries(module.exports)) {
      if (name.endsWith('Entity') && exported && typeof exported === 'object') {
        entities.push(exported)
        console.log(`📋 提取实体: ${name}`)
      }
    }
    
    // 查找AllAuthEntities, ConsoleEntities等集合
    if (module.exports.AllAuthEntities) {
      console.log(`📋 发现认证实体集合: AllAuthEntities`)
    }
    
    if (module.exports.ConsoleEntities) {
      console.log(`📋 发现Console实体集合: ConsoleEntities`)
    }
  }
  
  return entities
}

/**
 * 生成Prisma Schema
 */
export async function generatePrismaSchema(options: {
  output?: string
  input?: string
}): Promise<void> {
  console.log('🚀 LinchKit认证系统Prisma Schema统一生成')
  console.log('=' .repeat(50))
  
  try {
    // 1. 自动发现实体
    console.log('📁 正在发现实体文件...')
    console.log('📋 输入模式:', options.input)
    const modules = await discoverEntities(options.input)
    
    if (modules.length === 0) {
      throw new Error('未发现任何实体文件')
    }
    
    // 2. 提取实体定义
    console.log('📋 正在提取实体定义...')
    const entities = extractEntities(modules)
    
    if (entities.length === 0) {
      throw new Error('未发现任何有效实体定义')
    }
    
    // 3. 创建代码生成器
    console.log('🔧 正在创建Prisma生成器...')
    const outputDir = options.output || './apps/starter/prisma'
    const generator = createGenerator({
      entities,
      outputDir,
      config: {
        database: {
          provider: 'postgresql',
          url: 'env("DATABASE_URL")'
        }
      }
    })
    
    // 4. 注册PrismaGenerator
    const prismaGenerator = new PrismaGenerator()
    generator.registerGenerator(prismaGenerator)
    
    // 5. 生成Schema文件
    console.log('⚡ 正在生成Prisma Schema...')
    const files = await generator.generate()
    
    // 6. 确保输出目录存在
    const resolvedOutputDir = resolve(process.cwd(), outputDir)
    await mkdir(resolvedOutputDir, { recursive: true })
    
    // 7. 写入文件
    for (const file of files) {
      const filePath = resolve(resolvedOutputDir, file.path)
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, file.content, 'utf8')
      console.log(`✅ 生成文件: ${filePath}`)
    }
    
    console.log('=' .repeat(50))
    console.log('✅ Prisma Schema生成完成！')
    console.log(`📄 生成了 ${files.length} 个文件`)
    console.log(`📂 输出目录: ${outputDir}`)
    console.log('')
    console.log('🔄 下一步:')
    console.log('1. 配置DATABASE_URL环境变量')
    console.log('2. 运行: bunx prisma migrate dev')
    console.log('3. 运行: bunx prisma generate')
    
  } catch (error) {
    console.error('❌ Schema生成失败:', error)
    throw error
  }
}

/**
 * Schema生成命令
 */
const schemaGenerateCommand: CLICommand = {
  name: 'schema:generate',
  description: '生成LinchKit认证系统Prisma Schema',
  category: 'schema',
  options: [
    {
      name: 'output',
      description: 'Prisma Schema输出目录',
      defaultValue: './apps/starter/prisma',
      type: 'string'
    },
    {
      name: 'input',
      description: '实体文件输入目录模式',
      defaultValue: 'packages/**/src/entities/**/*.ts,extensions/**/src/entities/**/*.ts',
      type: 'string'
    }
  ],
  handler: async ({ options }) => {
    try {
      await generatePrismaSchema({
        output: options.output as string,
        input: options.input as string
      })
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * 注册所有Schema相关命令
 */
export function registerSchemaCommands(cli: CLIManager) {
  // 注册schema:generate命令
  cli.registerCommand(schemaGenerateCommand)
}