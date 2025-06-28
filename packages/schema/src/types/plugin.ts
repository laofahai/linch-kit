/**
 * @linch-kit/schema 插件相关类型定义
 */

import type { Entity } from './entity'
import type { FieldDefinition, ValidationRule } from './field'

/**
 * 生成文件接口
 */
export interface GeneratedFile {
  path: string
  content: string
  type: 'types' | 'prisma' | 'api' | 'validation'
}

/**
 * 代码生成器选项
 */
export interface CodeGeneratorOptions {
  entities: Entity[]
  outputDir?: string
  incremental?: boolean
  cache?: string
  hooks?: GeneratorHooks
}

/**
 * 生成器钩子
 */
export interface GeneratorHooks {
  beforeGenerate?: (context: GeneratorContext) => void | Promise<void>
  afterFileGenerated?: (file: GeneratedFile) => void | Promise<void>
  afterGenerate?: (files: GeneratedFile[]) => void | Promise<void>
}

/**
 * 生成器上下文
 */
export interface GeneratorContext {
  entities: Entity[]
  options: CodeGeneratorOptions
}

/**
 * 生成器接口
 */
export interface Generator {
  name: string
  generate(entities: Entity[], options?: { outputDir?: string }): Promise<GeneratedFile[]>
}

/**
 * Schema插件接口
 */
export interface SchemaPlugin {
  name: string
  transformEntity?: (entity: Entity) => Entity
  transformField?: (field: FieldDefinition) => FieldDefinition
  transformCode?: (code: GeneratedFile) => GeneratedFile
  registerGenerators?: () => Generator[]
}

/**
 * Schema上下文
 */
export interface SchemaContext {
  entities: Map<string, Entity>
  generators: Generator[]
  plugins: SchemaPlugin[]
  validators: Map<string, ValidationRule>
}
