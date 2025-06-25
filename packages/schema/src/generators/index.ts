/**
 * @linch-kit/schema 代码生成器导出
 */

// 基础框架
export { BaseGenerator, CodeGenerator, GeneratorRegistry, createGenerator, quickGenerate } from './base'

// 具体生成器
export { PrismaGenerator } from './prisma'
export { TypeScriptGenerator } from './typescript'

// 生成器注册
import { GeneratorRegistry } from './base'
import { PrismaGenerator } from './prisma'
import { TypeScriptGenerator } from './typescript'

// 自动注册内置生成器
GeneratorRegistry.register('prisma', PrismaGenerator)
GeneratorRegistry.register('typescript', TypeScriptGenerator)