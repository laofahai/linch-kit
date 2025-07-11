/**
 * LinchKit Platform - Business Development Platform
 * @module platform
 *
 * 整合Schema、tRPC、验证等业务开发能力
 * 基于LinchKit Extension系统提供扩展功能
 */

// Extension系统的扩展功能
export * from './extensions'

// Schema运行时功能
export * from './schema'

// tRPC功能
export * from './trpc'

// 运行时验证
export { RuntimeValidator } from './validation'

// 平台工具
export * from './platform-manager'
