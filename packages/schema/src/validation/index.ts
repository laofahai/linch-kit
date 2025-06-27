/**
 * @linch-kit/schema 数据验证系统导出
 *
 * 提供基于Schema的数据验证功能，包括验证规则和验证引擎
 *
 * @module validation
 */

// ==================== 验证系统导出 ====================
/**
 * 数据验证功能
 * 包含验证器、验证规则等
 */
export { SchemaValidator } from './validator'

// 重新导出验证相关类型
export type { ValidationRule } from '../types'
