/**
 * tRPC module - re-export from existing trpc package
 * @module platform/trpc
 */

// 重新导出现有tRPC功能
export * from '../../trpc/src/index'

// 新增平台特定的tRPC增强
export * from './platform-router-factory'