/**
 * @linch-kit/schema 基础设施集成导出
 *
 * 集成@linch-kit/core的基础设施功能，包括日志、国际化、配置管理等
 *
 * @module infrastructure
 */

// ==================== Core基础设施集成 ====================
/**
 * 日志系统集成
 */
export { logDebug, logError, logger, logInfo, logWarn } from './logger'

/**
 * 国际化系统集成
 */
export { packageI18n, useSchemaTranslation } from './i18n'

// ==================== 配置管理 ====================
/**
 * Schema包配置管理
 */
export { defaultSchemaConfig, type SchemaConfig } from './config'
