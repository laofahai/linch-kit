/**
 * @linch-kit/schema 插件定义
 * 
 * @description Schema 包的插件定义，用于集成到 @linch-kit/core 插件系统
 * @author LinchKit Team
 * @since 0.1.0
 */

/**
 * Schema 插件配置
 */
export interface SchemaPluginConfig {
  /** 是否启用自动迁移 */
  autoMigration?: boolean
  /** 是否启用验证 */
  enableValidation?: boolean
  /** 生成器配置 */
  generators?: string[]
}

/**
 * Schema 插件定义
 * 
 * @description 将 Schema 功能注册为 Core 插件
 * @param config 插件配置
 * @returns 插件定义对象
 */
export function schemaPlugin(config: SchemaPluginConfig = {}) {
  return {
    name: 'schema',
    version: '0.1.0',
    description: 'LinchKit Schema 插件',
    
    // 插件初始化
    async initialize() {
      console.log('Schema 插件已初始化')
    },
    
    // 插件配置
    config: {
      autoMigration: config.autoMigration ?? false,
      enableValidation: config.enableValidation ?? true,
      generators: config.generators ?? ['prisma', 'typescript']
    },
    
    // 插件提供的服务
    services: {
      // 这里可以注册 Schema 相关的服务
    },
    
    // 插件钩子
    hooks: {
      // 这里可以注册 Schema 相关的钩子
    }
  }
}
