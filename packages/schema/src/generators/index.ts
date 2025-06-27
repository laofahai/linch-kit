/**
 * @linch-kit/schema 代码生成器导出
 *
 * 提供完整的代码生成器系统，包括基础框架和具体生成器实现
 *
 * @module generators
 */

// ==================== 基础生成器框架 ====================
/**
 * 代码生成器基础框架
 * 包含抽象基类、注册表、工厂函数等
 */
export {
    BaseGenerator,
    CodeGenerator, createGenerator, GeneratorRegistry, quickGenerate
} from './base'

// ==================== 具体生成器实现 ====================
/**
 * 内置的代码生成器实现
 */
export { PrismaGenerator } from './prisma'
export { TypeScriptGenerator } from './typescript'

// ==================== 生成器自动注册 ====================
/**
 * 自动注册内置生成器到注册表
 */
import { GeneratorRegistry } from './base'
import { PrismaGenerator } from './prisma'
import { TypeScriptGenerator } from './typescript'

// 注册内置生成器
GeneratorRegistry.register('prisma', PrismaGenerator)
GeneratorRegistry.register('typescript', TypeScriptGenerator)