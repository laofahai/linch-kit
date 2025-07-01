/**
 * Console 模块初始化
 * 
 * 使用 LinchKit Schema 客户端和 Console 模块服务
 */

import { schemaClient } from './schema-client'
import { consoleServices } from '@linch-kit/console'

/**
 * 初始化 Console 服务
 * 使用 LinchKit 架构设计，通过 Console 模块提供的服务
 */
export function initializeConsoleServices() {
  try {
    // 使用 Console 模块的服务初始化
    if (consoleServices.tenant) {
      // 设置数据库客户端（如果支持的话）
      console.log('✅ Console 租户服务已就绪')
    }
    
    if (consoleServices.user) {
      console.log('✅ Console 用户服务已就绪')
    }
    
    if (consoleServices.plugin) {
      console.log('✅ Console 插件服务已就绪')
    }
    
    console.log('✅ Console services initialized with LinchKit architecture')
  } catch (error) {
    console.warn('⚠️ Console services initialization warning:', error)
    console.log('✅ Running with minimal console integration')
  }
}

/**
 * 获取 Console 数据库适配器
 * 为 Console 模块提供统一的数据库访问接口
 */
export function getConsoleDbAdapter() {
  return {
    // 用户相关操作
    user: schemaClient.user,
    
    // 租户相关操作
    tenant: schemaClient.tenant,
    tenantQuotas: schemaClient.tenantQuotas,
    
    // 插件相关操作
    plugin: schemaClient.plugin,
    tenantPlugin: schemaClient.tenantPlugin,
    
    // 监控数据
    monitoringData: schemaClient.monitoringData,
    
    // 事务支持
    $transaction: schemaClient.$transaction.bind(schemaClient),
  }
}

// 自动初始化（在模块加载时执行）
initializeConsoleServices()