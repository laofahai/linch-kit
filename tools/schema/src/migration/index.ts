/**
 * @linch-kit/schema 数据迁移系统导出
 *
 * 提供Schema变更的数据迁移功能，包括迁移管理器和迁移操作
 *
 * @module migration
 */

// ==================== 迁移系统导出 ====================
/**
 * 数据迁移功能
 * 包含迁移管理器、迁移操作等
 */
export { SchemaMigrator } from './migrator'

// 重新导出迁移相关类型
export type { Migration, MigrationOperation } from '../types'
