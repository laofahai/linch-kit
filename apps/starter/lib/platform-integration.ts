/**
 * Platform包集成工具库
 * 集成 @linch-kit/platform 的CRUD和实体管理功能
 */

import { Logger } from '@linch-kit/core/client'

// 导出平台核心功能
export type {
  Entity,
  Field,
  ValidationRule,  // ✅ 从 @linch-kit/platform 导入
  // EntitySchema,  // ❌ 不存在，保持注释
  // RelationType   // ❌ 不存在，保持注释  
} from '@linch-kit/platform'

// 从 @linch-kit/schema 导入 FieldType
export type {
  FieldType       // ✅ 从 @linch-kit/schema 导入
} from '@linch-kit/schema'

export {
  PlatformManager,
  createCRUDExtension
} from '@linch-kit/platform'

// 导出平台组件
export {
  DashboardLayout
} from '@linch-kit/platform'

/**
 * Platform集成配置
 */
export interface PlatformIntegrationConfig {
  // 实体配置
  entities: {
    enableAutoGeneration: boolean
    defaultValidationMode: 'strict' | 'loose'
    enableSoftDelete: boolean
  }
  
  // CRUD配置
  crud: {
    enablePagination: boolean
    defaultPageSize: number
    enableSorting: boolean
    enableFiltering: boolean
  }
  
  // 表单配置
  forms: {
    enableAutoSave: boolean
    autoSaveInterval: number
    enableValidation: boolean
  }
  
  // 表格配置
  tables: {
    enableVirtualization: boolean
    enableExport: boolean
    defaultRowHeight: number
  }
}

/**
 * 默认Platform集成配置
 */
export const defaultPlatformConfig: PlatformIntegrationConfig = {
  entities: {
    enableAutoGeneration: true,
    defaultValidationMode: 'strict',
    enableSoftDelete: true
  },
  crud: {
    enablePagination: true,
    defaultPageSize: 10,
    enableSorting: true,
    enableFiltering: true
  },
  forms: {
    enableAutoSave: false,
    autoSaveInterval: 30000,
    enableValidation: true
  },
  tables: {
    enableVirtualization: false,
    enableExport: true,
    defaultRowHeight: 40
  }
}

/**
 * Platform集成工具类
 */
export class PlatformIntegration {
  private config: PlatformIntegrationConfig
  private platformManager: unknown = null

  constructor(config: Partial<PlatformIntegrationConfig> = {}) {
    this.config = { ...defaultPlatformConfig, ...config }
  }

  /**
   * 初始化Platform集成
   */
  async initialize() {
    try {
      Logger.info('[Platform] Initializing platform integration...')
      
      // 动态导入Platform组件以避免SSR问题
      const { PlatformManager } = await import('@linch-kit/platform')
      
      this.platformManager = new PlatformManager({
        enableAutoGeneration: this.config.entities.enableAutoGeneration,
        defaultValidationMode: this.config.entities.defaultValidationMode
      })
      
      Logger.info('[Platform] Platform integration initialized successfully')
      return { success: true }
    } catch (error) {
      Logger.error('[Platform] Failed to initialize platform integration:', error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * 获取Platform管理器实例
   */
  getPlatformManager() {
    return this.platformManager
  }

  /**
   * 获取CRUD配置
   */
  getCRUDConfig() {
    return {
      pagination: {
        enabled: this.config.crud.enablePagination,
        pageSize: this.config.crud.defaultPageSize
      },
      sorting: {
        enabled: this.config.crud.enableSorting
      },
      filtering: {
        enabled: this.config.crud.enableFiltering
      }
    }
  }

  /**
   * 获取表单配置
   */
  getFormConfig() {
    return {
      autoSave: {
        enabled: this.config.forms.enableAutoSave,
        interval: this.config.forms.autoSaveInterval
      },
      validation: {
        enabled: this.config.forms.enableValidation,
        mode: this.config.entities.defaultValidationMode
      }
    }
  }

  /**
   * 获取表格配置
   */
  getTableConfig() {
    return {
      virtualization: {
        enabled: this.config.tables.enableVirtualization,
        rowHeight: this.config.tables.defaultRowHeight
      },
      export: {
        enabled: this.config.tables.enableExport
      }
    }
  }

  /**
   * 创建实体Schema
   */
  createEntitySchema(name: string, fields: unknown[]) {
    return {
      name,
      fields,
      options: {
        softDelete: this.config.entities.enableSoftDelete,
        validationMode: this.config.entities.defaultValidationMode
      }
    }
  }

  /**
   * 获取完整配置
   */
  getConfig() {
    return this.config
  }
}

/**
 * 默认Platform集成实例
 */
export const platformIntegration = new PlatformIntegration()

/**
 * 创建自定义Platform集成实例
 */
export function createPlatformIntegration(config: Partial<PlatformIntegrationConfig>) {
  return new PlatformIntegration(config)
}

/**
 * 常用实体Schema预设
 */
export const EntitySchemas = {
  // 用户实体
  User: {
    name: 'User',
    fields: [
      { name: 'id', type: 'string', required: true, primary: true },
      { name: 'email', type: 'email', required: true, unique: true },
      { name: 'name', type: 'string', required: true },
      { name: 'avatar', type: 'url', required: false },
      { name: 'createdAt', type: 'datetime', required: true, default: 'now' },
      { name: 'updatedAt', type: 'datetime', required: true, default: 'now' }
    ]
  },
  
  // 角色实体
  Role: {
    name: 'Role',
    fields: [
      { name: 'id', type: 'string', required: true, primary: true },
      { name: 'name', type: 'string', required: true, unique: true },
      { name: 'description', type: 'text', required: false },
      { name: 'permissions', type: 'json', required: true, default: '[]' },
      { name: 'createdAt', type: 'datetime', required: true, default: 'now' }
    ]
  },
  
  // 文章实体
  Post: {
    name: 'Post',
    fields: [
      { name: 'id', type: 'string', required: true, primary: true },
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'richtext', required: true },
      { name: 'excerpt', type: 'text', required: false },
      { name: 'slug', type: 'slug', required: true, unique: true },
      { name: 'status', type: 'enum', options: ['draft', 'published', 'archived'], default: 'draft' },
      { name: 'authorId', type: 'string', required: true, relation: 'User' },
      { name: 'tags', type: 'json', required: false, default: '[]' },
      { name: 'publishedAt', type: 'datetime', required: false },
      { name: 'createdAt', type: 'datetime', required: true, default: 'now' },
      { name: 'updatedAt', type: 'datetime', required: true, default: 'now' }
    ]
  }
}

/**
 * CRUD操作工具
 */
export const CRUDUtils = {
  /**
   * 创建标准CRUD路由
   */
  createRoutes: (entityName: string) => ({
    list: `/api/${entityName.toLowerCase()}s`,
    create: `/api/${entityName.toLowerCase()}s`,
    read: `/api/${entityName.toLowerCase()}s/:id`,
    update: `/api/${entityName.toLowerCase()}s/:id`,
    delete: `/api/${entityName.toLowerCase()}s/:id`
  }),
  
  /**
   * 创建标准分页参数
   */
  createPaginationParams: (page = 1, pageSize = 10) => ({
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize
  }),
  
  /**
   * 创建标准排序参数
   */
  createSortParams: (sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') => ({
    sortBy,
    sortOrder
  }),
  
  /**
   * 创建标准过滤参数
   */
  createFilterParams: (filters: Record<string, unknown> = {}) => ({
    where: filters,
    search: filters['_search'] ?? undefined
  })
}

/**
 * 平台集成React Hook
 */
export function usePlatformIntegration() {
  return {
    platformIntegration,
    config: platformIntegration.getConfig(),
    schemas: EntitySchemas,
    utils: CRUDUtils
  }
}