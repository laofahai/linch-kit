/**
 * @linch-kit/schema 插件类型定义
 * 
 * @description 插件系统相关的类型定义
 * @author LinchKit Team
 * @since 0.1.0
 */

import type { EntityDefinition } from './entity'

/**
 * 生成的文件
 */
export interface GeneratedFile {
  path: string
  content: string
  type: 'typescript' | 'prisma' | 'sql' | 'json' | 'types' | 'other'
}

/**
 * 生成器上下文
 */
export interface GeneratorContext {
  entities: EntityDefinition[]
  outputDir: string
  config: Record<string, any>
  schema: SchemaContext
  options?: CodeGeneratorOptions
}

/**
 * 模式上下文
 */
export interface SchemaContext {
  name: string
  version: string
  entities: EntityDefinition[]
  config: Record<string, any>
}

/**
 * 代码生成器选项
 */
export interface CodeGeneratorOptions {
  entities: EntityDefinition[]
  outputDir?: string
  template?: string
  config?: Record<string, any>
  hooks?: GeneratorHooks
}

/**
 * 生成器钩子
 */
export interface GeneratorHooks {
  beforeGenerate?: (context: GeneratorContext) => Promise<void> | void
  afterGenerate?: (files: GeneratedFile[], context: GeneratorContext) => Promise<void> | void
  afterFileGenerated?: (file: GeneratedFile) => Promise<void> | void
  onError?: (error: Error, context: GeneratorContext) => Promise<void> | void
}

/**
 * 生成器接口
 */
export interface Generator {
  name: string
  description?: string
  version?: string
  
  // 生成器方法
  generate(context: GeneratorContext): Promise<GeneratedFile[]>
  
  // 生成器钩子
  hooks?: GeneratorHooks
  
  // 生成器配置
  options?: CodeGeneratorOptions
}

/**
 * Schema 插件接口
 */
export interface SchemaPlugin {
  name: string
  version: string
  description?: string
  
  // 插件初始化
  initialize?(context: SchemaContext): Promise<void> | void
  
  // 插件销毁
  destroy?(): Promise<void> | void
  
  // 提供的生成器
  generators?: Generator[]
  
  // 插件配置
  config?: Record<string, any>
  
  // 插件钩子
  hooks?: {
    beforeSchemaLoad?: (schema: SchemaContext) => Promise<SchemaContext> | SchemaContext
    afterSchemaLoad?: (schema: SchemaContext) => Promise<void> | void
    beforeGenerate?: (context: GeneratorContext) => Promise<void> | void
    afterGenerate?: (files: GeneratedFile[], context: GeneratorContext) => Promise<void> | void
  }
}
