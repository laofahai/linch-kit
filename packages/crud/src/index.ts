/**
 * @linch-kit/crud - CRUD操作包
 * 
 * 提供类型安全的CRUD操作，平衡封装便利性和Prisma原生灵活性
 * 
 * 核心特性：
 * - 便捷的高层CRUD API
 * - 直接的Prisma原生访问
 * - 可选的增强功能（权限、验证、缓存）
 * - 插件扩展支持
 */

// 核心管理器
export { CrudManager } from './core/crud-manager'
export type { CrudManagerOptions } from './core/crud-manager'

// 查询构建器（重构后的模块化版本）
export { PrismaQueryBuilder, QueryBuilderFactory } from './core/query-builder/prisma-query-builder'
export { BaseQueryBuilder } from './core/query-builder/base-query-builder'
export { QueryConditionBuilder } from './core/query-builder/condition-builder'
export { QueryExecutor, QueryExecutorFactory } from './core/query-builder/query-executor'
export { QueryOptimizer, createQueryOptimizer } from './core/query-builder/query-optimizer'
export { QueryValidator, createQueryValidator } from './core/query-builder/query-validator'

// 工具类
export { PermissionChecker } from './permissions/permission-checker'
export { ValidationManager } from './validation/validation-manager'
export { CacheManager } from './cache/cache-manager'

// 类型定义
export type * from './types'

// 便捷工厂函数
export { createCrudManager, createQueryBuilder } from './factory'

// 插件相关
export type { CrudPlugin, CrudPluginHooks } from './plugins/types'
export { BaseCrudPlugin } from './plugins/base-plugin'