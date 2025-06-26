/**
 * @linch-kit/schema 主入口文件
 * Schema驱动开发引擎
 */

// 核心类型导出
export type * from './types'

// 核心功能导出
export { defineField } from './core/field'
export { defineEntity, defineEntities, isEntity, entityToTypeString } from './core/entity'
export { 
  schema, 
  fromEntity, 
  mixin, 
  template, 
  conditional, 
  group, 
  variants, 
  compose,
  SchemaBuilder 
} from './core/schema'

// 装饰器系统导出
export {
  Entity,
  Field,
  getEntityFromClass,
  getEntitiesFromClasses
} from './decorators/minimal'

// 代码生成器导出
export { 
  BaseGenerator, 
  CodeGenerator, 
  GeneratorRegistry, 
  createGenerator, 
  quickGenerate,
  PrismaGenerator,
  TypeScriptGenerator
} from './generators'

// CLI命令导出
export { schemaCommands } from './cli'

// 验证系统导出
export { SchemaValidator } from './validation'

// 迁移系统导出
export { SchemaMigrator } from './migration'

// 插件系统导出
export { SchemaPluginManager } from './plugins'

// 版本信息
export const VERSION = '0.1.0'